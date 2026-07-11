import { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense } from "react";
import { productSlug } from "@/lib/utils";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { ArrowRight, Phone, MapPin } from "lucide-react";
import { useProducts, useFeaturedProducts, useCategories, useSearchProductsDebounced, usePopularWines } from "@/hooks/useApi";
import { formatPrice } from "@/data/products";
import { LoadingWave, LoadingWine, LoadingNetworkError } from "@/components/ui/lottie-loader";
import { useNetworkStatus, isNetworkError } from "@/hooks/useNetworkStatus";
import { ProductGridCardActions } from "@/components/ProductGridCardActions";

// Lazy load heavy components
const LazyProductCard = lazy(() => import("@/components/ui/product-card").then(module => ({ default: module.ProductCard })));

const wineImage = "/wine-bottle.jpg";
const beerImage = "/beer-bottles.jpg";
const whiskeyImage = "/whiskey-bottle.jpg";

const Home = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const siteUrl = useMemo(() => {
    const configuredUrl = import.meta.env.VITE_SITE_URL?.trim();
    if (configuredUrl) {
      return configuredUrl.replace(/\/+$/, '');
    }
    return window.location.origin.replace(/\/+$/, '');
  }, []);
  const canonicalUrl = `${siteUrl}/`;
  
  // Read search query from URL parameters
  const urlSearchParams = new URLSearchParams(location.search);
  const urlSearchQuery = urlSearchParams.get('search') || '';
  
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const { addToCart } = useCart();
  const { isOnline } = useNetworkStatus();
  
  // Update search query when URL changes
  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  // Memoized banner slider images - LCP optimized
  const bannerImages = useMemo(() => [
    {
      //image: "/slider/4.webp",
      image: "/slider/5.png",
      title: "Premium Drinks Delivery",
      subtitle: "Fast, reliable, and fresh to your doorstep"
    }
  ], []);

  // Priority data fetching - load critical data first
  const { data: categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { data: featuredProducts, loading: featuredLoading, error: featuredError } = useFeaturedProducts();
  
  // Secondary data - load after critical data
  const { data: allProducts, error: productsError } = useProducts();
  const { data: popularWines, loading: popularWinesLoading, error: popularWinesError } = usePopularWines();
  
  // Search only when needed
  const { data: searchResults } = useSearchProductsDebounced(
    searchQuery.length > 2 ? searchQuery : '', 
    300
  );

  // Helper function to check DB offer flag (supports number/string/boolean shapes)
  const isProductOnOffer = useCallback((product: any) => {
    const offerFlag = product?.isOnOffer;
    return offerFlag === 1 || offerFlag === "1" || offerFlag === true;
  }, []);

  // Helper function to get best discount percentage from SKUs only
  const getBestDiscountFromSKU = useCallback((product: any) => {
    let maxDiscount = 0;
    
    // Only check SKU discounts
    if (product.skus && product.skus.length > 0) {
      product.skus.forEach((sku: any) => {
        if (sku.originalPrice && sku.originalPrice > sku.price) {
          const discount = ((sku.originalPrice - sku.price) / sku.originalPrice) * 100;
          if (discount > maxDiscount) {
            maxDiscount = discount;
          }
        }
      });
    }
    
    return maxDiscount;
  }, []);

  const offersOfTheWeek = useMemo(() => 
    (allProducts as any[])?.filter(product => 
      product && isProductOnOffer(product)
    ).slice(0, 12) || [],
    [allProducts, isProductOnOffer]
  );
  
  // Get all unique brands from products
  const allBrands = useMemo(() => {
    if (!allProducts || !Array.isArray(allProducts)) return [];
    const brands = new Set<string>();
    (allProducts as any[]).forEach((product: any) => {
      if (product.brand) {
        brands.add(product.brand.toLowerCase());
      }
    });
    return Array.from(brands);
  }, [allProducts]);

  // Shop by Brand: expand/collapse state per category group
  const [expandedBrandCats, setExpandedBrandCats] = useState<Record<string, boolean>>({});

  // Brands grouped by category for the Shop by Brand section, most popular first
  const brandsByCategory = useMemo(() => {
    if (!allProducts || !Array.isArray(allProducts)) return [];
    const groups = new Map<string, Map<string, { name: string; count: number }>>();
    (allProducts as any[]).forEach((product: any) => {
      if (!product.brand) return;
      const catName = typeof product.category === 'object'
        ? product.category?.name
        : product.category;
      if (!catName) return;
      if (!groups.has(catName)) groups.set(catName, new Map());
      const brands = groups.get(catName)!;
      const key = product.brand.toLowerCase();
      if (!brands.has(key)) brands.set(key, { name: product.brand, count: 0 });
      brands.get(key)!.count++;
    });
    const priority = ["whisky", "champagne", "cognac", "vodka", "brandy", "wine", "beer", "gin", "rum", "tequila", "liqueur"];
    const rank = (category: string) => {
      const idx = priority.findIndex((p) => category.toLowerCase().includes(p));
      return idx === -1 ? 99 : idx;
    };
    return Array.from(groups.entries())
      .map(([category, brands]) => ({
        category,
        brands: Array.from(brands.values())
          .sort((a, b) => b.count - a.count)
          .map((b) => b.name),
      }))
      .filter((group) => group.brands.length > 0)
      .sort((a, b) => rank(a.category) - rank(b.category) || a.category.localeCompare(b.category));
  }, [allProducts]);

  // Check if search query exactly matches a brand name
  const isBrandSearch = useMemo(() => {
    if (!searchQuery) return false;
    const lowerQuery = searchQuery.toLowerCase().trim();
    return allBrands.includes(lowerQuery);
  }, [searchQuery, allBrands]);

  // Filter products by exact brand if it's a brand search
  const brandFilteredProducts = useMemo(() => {
    if (!isBrandSearch || !allProducts) return [];
    const lowerQuery = searchQuery.toLowerCase().trim();
    return (allProducts as any[]).filter((product: any) => 
      product.brand && product.brand.toLowerCase() === lowerQuery
    );
  }, [isBrandSearch, searchQuery, allProducts]);

  // Get the actual brand name (with proper casing) from filtered products
  const brandName = useMemo(() => {
    if (!isBrandSearch || brandFilteredProducts.length === 0) return null;
    return brandFilteredProducts[0]?.brand || searchQuery;
  }, [isBrandSearch, brandFilteredProducts, searchQuery]);

  const displayProducts = useMemo(() => {
    if (!searchQuery) {
      return (featuredProducts as any[])?.slice(0, 12) || [];
    }
    
    // If it's an exact brand match, show all products from that brand
    if (isBrandSearch) {
      return (brandFilteredProducts as any[])?.slice(0, 12) || [];
    }
    
    // Otherwise, use search results
    return (searchResults as any[])?.slice(0, 12) || [];
  }, [searchQuery, searchResults, featuredProducts, isBrandSearch, brandFilteredProducts]);

  // Memoized helper function to safely filter products by category
  const filterProductsByCategory = useCallback((products: any[], categoryName: string) => {
    if (!products || !Array.isArray(products)) return [];
    return products.filter(p => 
      p && 
      p.category && 
      typeof p.category === 'string' && 
      p.category.toLowerCase().includes(categoryName.toLowerCase())
    );
  }, []);

  // Generate enhanced structured data for the website - MUST be before early returns
  const structuredData = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Drinks Avenue - Premium Alcohol Delivery Service",
      "alternateName": "Drinks Avenue",
      "description": "Premium drinks and spirits delivery service in Kenya. Order wine, beer, whiskey, gin, rum, tequila, and more with fast 30-minute delivery across Nairobi and Kenya.",
      "url": canonicalUrl,
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${canonicalUrl}?search={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Drinks Avenue",
        "url": canonicalUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${siteUrl}/logo.png`,
          "width": 512,
          "height": 512
        }
      },
      "inLanguage": "en-KE",
      "isAccessibleForFree": true
    };
  }, [canonicalUrl, siteUrl]);

  const organizationData = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Drinks Avenue",
      "legalName": "Drinks Avenue",
      "description": "Premium drinks and spirits delivery service in Kenya. Fast delivery of wine, beer, whiskey, gin, rum, tequila, vodka, and spirits across Nairobi and Kenya.",
      "url": canonicalUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo.png`,
        "width": 512,
        "height": 512
      },
      "image": `${siteUrl}/logo.png`,
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": "0790 831798",
          "contactType": "customer service",
          "availableLanguage": ["English", "Swahili"],
          "areaServed": "KE",
          "hoursAvailable": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday"
            ],
            "opens": "00:00",
            "closes": "23:59"
          }
        }
      ],
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "KE",
        "addressLocality": "Nairobi",
        "addressRegion": "Nairobi County"
      },
      "sameAs": [
        "https://www.facebook.com/dalalidrinks",
        "https://www.instagram.com/dalalidrinks",
        "https://x.com/dalalidrinks"
      ],
      "areaServed": {
        "@type": "Country",
        "name": "Kenya"
      },
      "knowsAbout": [
        "Alcohol Delivery",
        "Wine Delivery",
        "Beer Delivery",
        "Spirits Delivery",
        "Online Alcohol Store"
      ]
    };
  }, [canonicalUrl, siteUrl]);

  const localBusinessData = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "LiquorStore",
      "@id": `${canonicalUrl}#store`,
      "name": "Drinks Avenue",
      "alternateName": ["Drinks Avenue Kenya"],
      "slogan": "Drinks delivered in 30 minutes, 24 hours a day",
      "description": "24 hour alcohol delivery liquor store in Nairobi, Kenya. Order whisky, wine, beer, gin, rum, tequila, vodka and spirits online with fast 30-minute delivery across Nairobi and same-day delivery countrywide.",
      "keywords": "dial a drink, alcohol delivery, 24 hour delivery, liquor store near me, whisky hub, chupa chup, drinks delivery Nairobi",
      "url": canonicalUrl,
      "image": `${siteUrl}/logo.png`,
      "logo": `${siteUrl}/logo.png`,
      "telephone": "+254790831798",
      "email": "support@drinksavenue.com",
      "priceRange": "$$",
      "currenciesAccepted": "KES",
      "paymentAccepted": "Cash, Credit Card, M-Pesa, Mobile Money",
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          "opens": "00:00",
          "closes": "23:59"
        }
      ],
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": -1.2921,
        "longitude": 36.8219
      },
      "hasMap": "https://maps.google.com/maps?q=-1.2921,36.8219",
      "areaServed": [
        { "@type": "City", "name": "Nairobi" },
        { "@type": "Country", "name": "Kenya" }
      ],
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "KE",
        "addressLocality": "Nairobi",
        "addressRegion": "Nairobi County"
      },
      "makesOffer": [
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "24 Hour Alcohol Delivery Nairobi" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Order by Phone Drinks Delivery" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Whisky, Wine, Beer, Gin & Spirits Delivery" } }
      ],
      "sameAs": [
        "https://www.facebook.com/dalalidrinks",
        "https://www.instagram.com/dalalidrinks",
        "https://x.com/dalalidrinks"
      ]
    };
  }, [canonicalUrl, siteUrl]);

  // Enhanced ItemList structured data for featured products
  const featuredProductsStructuredData = useMemo(() => {
    if (!featuredProducts || (featuredProducts as any[]).length === 0) return null;
    
    const products = (featuredProducts as any[]).slice(0, 12);
    
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Featured Products - Drinks Avenue",
      "description": "Handpicked selection of premium drinks and spirits available at Drinks Avenue",
      "numberOfItems": products.length,
      "itemListElement": products.map((product, index) => {
        // Safely extract category name - category may be an object or a string
        const categoryName = typeof product.category === 'object'
          ? (product.category?.name || 'Drinks')
          : (product.category || 'Drinks');

        // Build clean image array - filter out null/undefined
        const images = product.images && product.images.length > 0
          ? product.images.filter(Boolean)
          : (product.image ? [product.image] : []);

        const productUrl = `${siteUrl}/product/${productSlug(product)}`;
        const productSchema: any = {
          "@type": "Product",
          "@id": productUrl,
          "name": product.name,
          "url": productUrl,
          "description": product.description
            ? product.description
            : `${product.name} - Premium ${categoryName} available at Drinks Avenue Kenya. Fast delivery in Nairobi and across Kenya.`,
          ...(images.length > 0 && { "image": images }),
          "brand": {
            "@type": "Brand",
            "name": product.brand || "Drinks Avenue"
          },
          "category": categoryName,
          "sku": product.id?.toString() || "",
          "offers": {
            "@type": "Offer",
            "price": (product.price ?? 0).toString(),
            "priceCurrency": "KES",
            "availability": (product.stock ?? 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "url": productUrl,
            "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            "seller": {
              "@type": "Organization",
              "name": "Drinks Avenue"
            }
          }
        };

        // Add aggregateRating only if rating exists
        if (product.rating) {
          productSchema.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": product.rating,
            "reviewCount": product.reviews?.length || product.reviewCount || 1,
            "bestRating": "5",
            "worstRating": "1"
          };
        }

        return {
          "@type": "ListItem",
          "position": index + 1,
          "item": productSchema
        };
      })
    };
  }, [featuredProducts, siteUrl]);

  // Home page FAQs - single source of truth for both the visible FAQ section
  // and the FAQPage JSON-LD (Google requires the schema to match on-page content)
  const homeFaqs = useMemo(() => [
    {
      question: "Do you offer 24 hour alcohol delivery in Nairobi?",
      answer: "Yes. Drinks Avenue is a 24 hour alcohol delivery service — order any time, day or night, and we deliver whisky, wine, beer, gin, vodka and spirits to your door in Nairobi in as little as 30 minutes. We also offer late night alcohol delivery when most liquor stores are closed."
    },
    {
      question: "How do I order drinks from Drinks Avenue?",
      answer: "Ordering is easy: browse our online liquor store, add your drinks to the cart and check out, or simply call 0790 831798 and place your order by phone or WhatsApp. Our riders deliver across Nairobi 24/7."
    },
    {
      question: "Are you the liquor store near me?",
      answer: "If you are in Nairobi or anywhere in Kenya, yes! Drinks Avenue is your online liquor store near you — no matter your neighbourhood, we bring the liquor store to your doorstep with fast delivery in Westlands, Kilimani, Lavington, Karen, Kileleshwa, Ruaka, Kasarani, the CBD and beyond."
    },
    {
      question: "What makes Drinks Avenue different from other alcohol delivery services in Kenya?",
      answer: "Drinks Avenue stands out with true 24 hour delivery, 30-minute average delivery times in Nairobi, competitive prices, weekly offers and a huge selection of whisky, wine, beer, gin and spirits."
    },
    {
      question: "What types of drinks do you deliver?",
      answer: "We deliver a wide selection of premium drinks including whisky, wine, beer, gin, rum, tequila, vodka, brandy, cognac, champagne, liqueurs and mixers. Browse our whisky collection for single malts and blended Scotch, or explore wines from around the world."
    },
    {
      question: "Do you deliver alcohol outside Nairobi?",
      answer: "Yes, we deliver premium drinks and spirits across Kenya, including Mombasa, Kisumu, Nakuru, Eldoret and Thika. Delivery times vary by location — Nairobi orders typically arrive within 30 minutes."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept M-Pesa, mobile money, credit/debit cards, and cash on delivery for your convenience. All online payments are secure."
    },
    {
      question: "Is there a minimum age to order?",
      answer: "Yes. You must be 18 years or older to order alcohol in Kenya. Our riders verify age on delivery, and we deliver responsibly in line with Kenyan law."
    }
  ], []);

  // FAQ structured data derived from the visible FAQs
  const faqStructuredData = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": homeFaqs.map((faq) => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };
  }, [homeFaqs]);

  // Optimized loading state - only show if critical data is loading
  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingWave size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-wine mb-4">Loading...</h1>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  // Check for network errors
  const hasNetworkError = !isOnline || 
    isNetworkError(productsError) || 
    isNetworkError(featuredError) || 
    isNetworkError(categoriesError);

  // Show network error state
  if (hasNetworkError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingNetworkError size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-wine mb-4">Connection Error</h1>
          <p className="text-muted-foreground mb-4">Unable to connect to our servers</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Meta Tags - Enhanced */}
      <Helmet>
        <title>24 Hour Alcohol Delivery Nairobi | Liquor Store Near Me - Drinks Avenue</title>
        <meta name="description" content="24 hour alcohol delivery in Nairobi & across Kenya. Your online liquor store near you — whisky, wine, beer, gin & spirits delivered in 30 minutes, 24/7." />
        <meta name="keywords" content="dial a drink, alcohol delivery, 24 hour delivery, liquor store near me, oaks and corks, whisky hub, chupa chup, drinks delivery kenya, 24 hour drinks delivery, 24/7 drinks delivery, alcohol delivery Kenya, alcohol delivery near me, alcohol delivery Nairobi, dial a drink kenya, dial a delivery, wine delivery Nairobi, beer delivery Kenya, whiskey delivery, whisky delivery Nairobi, gin delivery, spirits delivery Kenya, online liquor store, online alcohol store, premium drinks delivery, alcohol delivery service, liquor delivery near me, wine shop Nairobi, beer shop Kenya, spirits shop, alcohol online Kenya, drinks delivery Nairobi, buy alcohol online Kenya, alcohol delivery app, same day alcohol delivery Kenya, fast drinks delivery Nairobi, late night alcohol delivery Nairobi" />
        <meta name="author" content="Drinks Avenue" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="geo.region" content="KE" />
        <meta name="geo.placename" content="Nairobi" />
        <meta name="geo.position" content="-1.2921;36.8219" />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="alternate" hrefLang="en-ke" href={canonicalUrl} />
        <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
        
        {/* LCP Optimization - Preload responsive hero image (WebP, sized per viewport) */}
        <link rel="preload" href="/slider/5-mobile.webp" as="image" type="image/webp" media="(max-width: 640px)" fetchpriority="high" />
        <link rel="preload" href="/slider/5-desktop.webp" as="image" type="image/webp" media="(min-width: 641px)" fetchpriority="high" />
        
        {/* Open Graph Tags - Enhanced */}
        <meta property="og:title" content="24 Hour Alcohol Delivery Nairobi - Drinks Avenue" />
        <meta property="og:description" content="Premium alcohol delivered fast, 24 hours a day. Order whisky, wine, beer, gin, rum, tequila, vodka and spirits — the online liquor store near you, delivering across Nairobi and Kenya." />
        <meta property="og:image" content={`${siteUrl}/logo.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Drinks Avenue - Premium Alcohol Delivery Service" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Drinks Avenue" />
        <meta property="og:locale" content="en_KE" />
        <meta property="og:locale:alternate" content="sw_KE" />
        
        {/* Twitter Card Tags - Enhanced */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="24 Hour Alcohol Delivery Nairobi - Drinks Avenue" />
        <meta name="twitter:description" content="24 hour alcohol delivery in Nairobi. Whisky, wine, beer, gin, rum & spirits delivered in 30 minutes from the liquor store near you." />
        <meta name="twitter:image" content={`${siteUrl}/logo.png`} />
        <meta name="twitter:image:alt" content="Drinks Avenue - Premium Alcohol Delivery Service" />
        
        {/* Structured Data - WebSite */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        
        {/* Structured Data - Organization */}
        <script type="application/ld+json">
          {JSON.stringify(organizationData)}
        </script>

        {/* Structured Data - Local Business */}
        <script type="application/ld+json">
          {JSON.stringify(localBusinessData)}
        </script>
        
        {/* Structured Data - Featured Products ItemList */}
        {featuredProductsStructuredData && (
          <script type="application/ld+json">
            {JSON.stringify(featuredProductsStructuredData)}
          </script>
        )}
        
        {/* Structured Data - FAQ */}
        <script type="application/ld+json">
          {JSON.stringify(faqStructuredData)}
        </script>
      </Helmet>

      
      {/* Navigation */}
      <Navigation />

      {/* Hero Section - Optimized for LCP and Mobile with SEO */}
      <section className="relative w-full bg-gray-100 hero-section" aria-label="Hero Banner" itemScope itemType="https://schema.org/WebPageElement">
        <div className="w-full max-w-full">
          <div className="relative aspect-[3/2] h-auto max-h-[55vh] sm:aspect-auto sm:h-[52vh] md:h-[62vh] lg:h-[50vh] w-full max-w-full overflow-hidden shadow-2xl hero-image-container">
            <picture>
              {/* Mobile: small WebP (~100 KB vs 2.9 MB PNG) for fast LCP */}
              <source
                media="(max-width: 640px)"
                srcSet="/slider/5-mobile.webp"
                type="image/webp"
                sizes="100vw"
              />
              {/* Tablet & Desktop: full-size WebP */}
              <source
                media="(min-width: 641px)"
                srcSet="/slider/5-desktop.webp"
                type="image/webp"
                sizes="100vw"
              />
              {/* Fallback img element with optimized attributes and SEO */}
              <img
                src="/slider/5.png"
                alt="Premium Drinks Delivery Kenya - Fast 30-minute alcohol delivery service in Nairobi and across Kenya. Order wine, beer, whiskey, gin, rum, and spirits online."
                className="hero-image"
                loading="eager"
                decoding="async"
                fetchpriority="high"
                width="1536"
                height="1024"
                sizes="100vw"
                itemProp="image"
                style={{
                  width: '100%',
                  height: '100%',
                  willChange: 'auto'
                }}
                onLoad={(e) => {
                  // Ensure image is properly loaded and displayed
                  const img = e.currentTarget;
                  img.style.opacity = '1';
                }}
              />
            </picture>
            {/* Gradient overlay - optimized for mobile visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-black/5 sm:from-black/40 sm:via-transparent sm:to-black/10 pointer-events-none" />
            {/* Hero Content for SEO */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center px-4">
                <h1 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 drop-shadow-lg" itemProp="headline">
                  24 Hour Alcohol Delivery in Nairobi
                </h1>
                <p className="text-white text-sm sm:text-base md:text-lg lg:text-xl drop-shadow-md max-w-2xl mx-auto" itemProp="description">
                  Whisky, wine, beer, gin &amp; spirits delivered in 30 minutes from the liquor store near you, 24/7 across Kenya
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Offers of the Week Section - Enhanced SEO */}
      <section
        id="offers-week"
        data-section="offers-week"
        className="py-6 sm:py-8 md:py-10 bg-background"
        aria-label="Special Offers"
        itemScope
        itemType="https://schema.org/ItemList"
      >
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5 sm:mb-6 md:mb-8">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                LIMITED TIME
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                Offers of the Week
              </h2>
            </div>
            <Link to="/offers" className="shrink-0">
              <Button size="sm" variant="outline" className="border-wine text-wine hover:bg-wine hover:text-white transition-colors text-xs sm:text-sm touch-manipulation">
                View All Offers
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          
          {(offersOfTheWeek as any[])?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {(offersOfTheWeek as any[])?.map((product) => (
                <div key={product.id} className="relative group">
                  <Card className="overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-active:scale-95 border border-border/60 hover:border-wine/40 flex flex-col h-full rounded-xl bg-card">
                    <Link to={`/product/${productSlug(product)}`} className="block flex-1 min-w-0 touch-manipulation cursor-pointer">
                      <div className="relative overflow-hidden rounded-t-xl bg-gray-50">
                        <img
                          src={product.image || '/placeholder-product.jpg'}
                          alt={product.name}
                          className="h-44 sm:h-40 md:h-44 lg:h-48 xl:h-52 w-full object-contain bg-white transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                        {getBestDiscountFromSKU(product) > 0 && (
                          <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm">
                            -{Math.round(getBestDiscountFromSKU(product))}%
                          </div>
                        )}
                      </div>
                      <CardContent className="p-2 sm:p-3">
                        <div className="space-y-1 sm:space-y-2">
                          <h3 className="font-semibold text-[10px] sm:text-xs md:text-xs lg:text-sm line-clamp-1 group-hover:text-wine transition-colors">
                            {product.name}
                          </h3>
                        <div className="h-0" />
                        <div className="flex flex-col gap-1">
                          {product.skus && product.skus.length > 0 ? (
                            <>
                              {product.skus.map((sku, idx) => (
                                <div key={idx} className="flex items-center gap-1 sm:gap-2">
                                  <span className="text-[10px] sm:text-xs font-semibold text-gray-700">{sku.code}:</span>
                                  <span className="text-xs sm:text-xs md:text-sm font-bold text-wine">
                                    {formatPrice(sku.price)}
                                  </span>
                                  {sku.originalPrice && (
                                    <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                                      {formatPrice(sku.originalPrice)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <span className="text-xs sm:text-xs md:text-sm lg:text-base font-bold text-wine">
                                    {formatPrice(product.price)}
                                  </span>
                                  <span className="text-xs sm:text-sm text-muted-foreground line-through">
                                    {formatPrice(product.originalPrice)}
                                  </span>
                                </div>
                              </div>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <div className="text-xs sm:text-sm text-green-600 font-medium">
                                  Save {formatPrice(product.originalPrice - product.price)}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {product.origin && (
                            <div className="text-[10px] sm:text-xs text-muted-foreground">
                              {product.origin}
                            </div>
                          )}
                          {product.alcoholContent && (
                            <span className="text-[10px] sm:text-xs text-gold font-medium">Alc. {product.alcoholContent}%</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    </Link>
                    <div className="px-2 sm:px-2 md:px-3 lg:px-3 pb-2 pt-0 shrink-0">
                      <ProductGridCardActions product={product} onAddToCart={addToCart} />
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">No current offers</h3>
              <p className="text-muted-foreground">Check back soon for amazing deals!</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section - Enhanced SEO */}
      <section
        id="featured-products"
        data-section="featured-products"
        className="py-6 sm:py-8 md:py-10 bg-gradient-to-b from-wine/5 via-background to-background"
        aria-label="Featured Products"
        itemScope
        itemType="https://schema.org/ItemList"
      >
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5 sm:mb-6 md:mb-8">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-wine bg-wine/10 border border-wine/20 px-3 py-1 rounded-full mb-2">
                ✦ HANDPICKED
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                {isBrandSearch ? `${brandName} Products` : searchQuery ? `Results for "${searchQuery}"` : 'Featured Products'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isBrandSearch ? `All products from ${brandName}` : searchQuery ? 'Products matching your search' : 'Discover our handpicked selection of premium drinks'}
              </p>
            </div>
            <Link to="/featured" className="shrink-0">
              <Button size="sm" variant="outline" className="border-wine text-wine hover:bg-wine hover:text-white transition-colors text-xs sm:text-sm touch-manipulation">
                <span className="hidden sm:inline">View All Featured</span>
                <span className="sm:hidden">View All</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          {featuredLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {[...Array(12)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-muted rounded-lg h-56 sm:h-64 md:h-72 mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredError ? (
            <div className="text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">⚠️</div>
              <h3 className="text-lg sm:text-xl font-semibold text-muted-foreground mb-2 sm:mb-3">Unable to load featured products</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                There was an error loading our featured products. Please try again later.
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="text-xs sm:text-sm touch-manipulation"
              >
                Try Again
              </Button>
            </div>
          ) : displayProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              {displayProducts.map((product, index) => (
                <div key={product.id} className="relative group" itemProp="item" itemScope itemType="https://schema.org/Product">
                  <Card className="overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-active:scale-95 border border-border/60 hover:border-wine/40 flex flex-col h-full rounded-xl bg-card">
                    <Link to={`/product/${productSlug(product)}`} className="block flex-1 min-w-0 touch-manipulation cursor-pointer">
                      <div className="relative overflow-hidden rounded-t-xl bg-gray-50">
                        <img
                          src={product.image || '/placeholder-product.jpg'}
                          alt={product.name}
                          className="h-44 sm:h-40 md:h-44 lg:h-48 xl:h-52 w-full object-contain bg-white transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                        {getBestDiscountFromSKU(product) > 0 && (
                          <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm">
                            -{Math.round(getBestDiscountFromSKU(product))}%
                          </div>
                        )}
                      </div>
                      <CardContent className="p-2 sm:p-3">
                        <div className="space-y-1 sm:space-y-2">
                          <h3 className="font-semibold text-[10px] sm:text-xs md:text-xs lg:text-sm line-clamp-1 group-hover:text-wine transition-colors">
                            {product.name}
                          </h3>
                          <div className="h-0" />
                          <div className="flex flex-col gap-1">
                            {product.skus && product.skus.length > 0 ? (
                              <>
                                {product.skus.map((sku, idx) => (
                                  <div key={idx} className="flex items-center gap-1 sm:gap-2">
                                    <span className="text-[10px] sm:text-xs font-semibold text-gray-700">{sku.code}:</span>
                                    <span className="text-xs sm:text-xs md:text-sm font-bold text-wine">
                                      {formatPrice(sku.price)}
                                    </span>
                                    {sku.originalPrice && (
                                      <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                                        {formatPrice(sku.originalPrice)}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </>
                            ) : (
                              <>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <span className="text-xs sm:text-xs md:text-sm lg:text-base font-bold text-wine">
                                      {formatPrice(product.price || 0)}
                                    </span>
                                    {product.originalPrice && (
                                      <span className="text-xs sm:text-sm text-muted-foreground line-through">
                                        {formatPrice(product.originalPrice)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {product.originalPrice && product.originalPrice > product.price && (
                                  <div className="text-xs sm:text-sm text-green-600 font-medium">
                                    Save {formatPrice(product.originalPrice - product.price)}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {product.origin && (
                              <div className="text-[10px] sm:text-xs text-muted-foreground">
                                {product.origin}
                              </div>
                            )}
                            {product.alcoholContent && (
                              <span className="text-[10px] sm:text-xs text-gold font-medium">Alc. {product.alcoholContent}%</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Link>
                    <div className="px-2 sm:px-2 md:px-3 lg:px-3 pb-2 pt-0 shrink-0">
                      <ProductGridCardActions product={product} onAddToCart={addToCart} />
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">⭐</div>
              <h3 className="text-lg sm:text-xl font-semibold text-muted-foreground mb-2 sm:mb-3">
                {isBrandSearch ? `No products found for ${brandName}` : searchQuery ? "No products found matching your search." : "No featured products available"}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                {isBrandSearch 
                  ? `We don't have any products from ${brandName} at the moment.`
                  : searchQuery 
                    ? "Try searching with different keywords or browse our categories."
                    : "Check back soon for our premium selection!"}
              </p>
              {searchQuery && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("");
                    navigate('/');
                  }}
                  className="text-xs sm:text-sm touch-manipulation"
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Popular Wines Section */}
      <section className="py-6 sm:py-8 md:py-10 bg-background" aria-label="Popular Wines" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 900px' }}>
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5 sm:mb-6 md:mb-8">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full mb-2">
                🍷 TOP PICKS
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                Popular Wines
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Discover our finest selection from around the world
              </p>
            </div>
            <Link to="/category/wine" className="shrink-0">
              <Button size="sm" variant="outline" className="border-wine text-wine hover:bg-wine hover:text-white transition-colors text-xs sm:text-sm touch-manipulation">
                View All Wines
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          
          {popularWinesLoading ? (
            <div className="flex gap-3 sm:gap-4 md:gap-6 overflow-hidden">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="w-64 sm:w-72 md:w-80 flex-shrink-0">
                  <Card className="overflow-hidden">
                    <div className="animate-pulse">
                      <div className="h-56 sm:h-64 md:h-72 w-full bg-muted"></div>
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                        <div className="h-8 bg-muted rounded w-full"></div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          ) : popularWinesError ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Failed to load popular wines</p>
            </div>
          ) : popularWines && (popularWines as any[])?.length > 0 ? (
            <>
              {/* Mobile: Static Grid Layout */}
              <div className="block sm:hidden">
                <div className="grid grid-cols-2 gap-3">
                  {((popularWines as any[]) || []).slice(0, 12).map((product) => (
                    <div key={product.id} className="relative group">
                      <Card className="overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-active:scale-95 border border-border/60 hover:border-wine/40 flex flex-col h-full rounded-xl bg-card">
                        <Link to={`/product/${productSlug(product)}`} className="block flex-1 min-w-0 touch-manipulation cursor-pointer">
                          <div className="relative overflow-hidden rounded-t-xl bg-gray-50">
                            <img
                              src={product.image || '/placeholder-product.jpg'}
                              alt={product.name}
                              className="h-44 w-full object-contain bg-white transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                              decoding="async"
                            />
                            <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm">
                              POPULAR
                            </div>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm">
                                -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                              </div>
                            )}
                          </div>
                          <CardContent className="p-2">
                            <div className="space-y-1">
                              <h3 className="font-semibold text-xs line-clamp-1 group-hover:text-wine transition-colors">
                                {product.name}
                              </h3>
                            <div className="h-0" />
                            <div className="flex flex-col gap-1">
                              {product.skus && product.skus.length > 0 ? (
                                <>
                                  {product.skus.map((sku, idx) => (
                                    <div key={idx} className="flex items-center gap-1">
                                      <span className="text-[10px] font-semibold text-gray-700">{sku.code}:</span>
                                      <span className="text-xs font-bold text-wine">
                                        {formatPrice(sku.price)}
                                      </span>
                                      {sku.originalPrice && (
                                        <span className="text-[10px] text-muted-foreground line-through">
                                          {formatPrice(sku.originalPrice)}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                      <span className="text-sm font-bold text-wine">
                                        {formatPrice(product.price)}
                                      </span>
                                      {product.originalPrice && product.originalPrice > product.price && (
                                        <span className="text-xs text-muted-foreground line-through">
                                          {formatPrice(product.originalPrice)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {product.originalPrice && product.originalPrice > product.price && (
                                    <div className="text-xs text-muted-foreground">
                                      Save {formatPrice(product.originalPrice - product.price)}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {product.origin && (
                                <div className="text-[10px] text-muted-foreground">
                                  {product.origin}
                                </div>
                              )}
                              {product.alcoholContent && (
                                <span className="text-[10px] text-gold font-medium">Alc. {product.alcoholContent}%</span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                        </Link>
                        <div className="px-2 pb-2 pt-0 shrink-0">
                          <ProductGridCardActions product={product} onAddToCart={addToCart} />
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop: Grid Layout */}
              <div className="hidden sm:block">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {((popularWines as any[]) || []).slice(0, 12).map((product) => (
                    <div key={product.id} className="relative group">
                      <Card className="overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-active:scale-95 border border-border/60 hover:border-wine/40 flex flex-col h-full rounded-xl bg-card">
                        <Link to={`/product/${productSlug(product)}`} className="block flex-1 min-w-0 touch-manipulation cursor-pointer">
                          <div className="relative overflow-hidden rounded-t-xl bg-gray-50">
                            <img
                              src={product.image || '/placeholder-product.jpg'}
                              alt={product.name}
                              className="h-44 sm:h-40 md:h-44 lg:h-48 xl:h-52 w-full object-contain bg-white transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                              decoding="async"
                            />
                            <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm">
                              POPULAR
                            </div>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm">
                                -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                              </div>
                            )}
                          </div>
                          <CardContent className="p-2 sm:p-2 md:p-3 lg:p-3">
                            <div className="space-y-1 sm:space-y-2">
                              <h3 className="font-semibold text-[10px] sm:text-xs md:text-xs lg:text-sm line-clamp-1 group-hover:text-wine transition-colors">
                                {product.name}
                              </h3>
                            <div className="h-0" />
                            <div className="flex flex-col gap-1">
                              {product.skus && product.skus.length > 0 ? (
                                <>
                                  {product.skus.map((sku, idx) => (
                                    <div key={idx} className="flex items-center gap-1 sm:gap-2">
                                      <span className="text-[10px] sm:text-xs font-semibold text-gray-700">{sku.code}:</span>
                                      <span className="text-xs sm:text-xs md:text-sm font-bold text-wine">
                                        {formatPrice(sku.price)}
                                      </span>
                                      {sku.originalPrice && (
                                        <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                                          {formatPrice(sku.originalPrice)}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 sm:gap-2">
                                      <span className="text-xs sm:text-xs md:text-sm lg:text-base font-bold text-wine">
                                        {formatPrice(product.price)}
                                      </span>
                                      {product.originalPrice && product.originalPrice > product.price && (
                                        <span className="text-xs sm:text-sm text-muted-foreground line-through">
                                          {formatPrice(product.originalPrice)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {product.originalPrice && product.originalPrice > product.price && (
                                    <div className="text-xs sm:text-sm text-green-600 font-medium">
                                      Save {formatPrice(product.originalPrice - product.price)}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {product.origin && (
                                <div className="text-[10px] sm:text-xs text-muted-foreground">
                                  {product.origin}
                                </div>
                              )}
                              {product.alcoholContent && (
                                <span className="text-[10px] sm:text-xs text-gold font-medium">Alc. {product.alcoholContent}%</span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                        </Link>
                        <div className="px-2 sm:px-2 md:px-3 lg:px-3 pb-2 pt-0 shrink-0">
                          <ProductGridCardActions product={product} onAddToCart={addToCart} />
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No popular wines available</p>
            </div>
          )}
        </div>
      </section>

      {/* Shop by Category Section */}
      <section className="py-6 sm:py-8 md:py-12 bg-gray-950" aria-label="Shop by Category" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 800px' }}>
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-6 sm:mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold bg-gold/10 border border-gold/20 px-3 py-1 rounded-full mb-3">
              ✦ COLLECTIONS
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
              Shop by Category
            </h2>
            <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
              Explore our curated selection of premium drinks from around the world
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                title: "Premium Spirits",
                description: "Whiskey, gin, vodka & rum",
                image: whiskeyImage,
                link: "/category/whisky",
                accent: "from-amber-900/80 to-amber-950/95"
              },
              {
                title: "Fine Wines",
                description: "Red, white & sparkling wines",
                image: wineImage,
                link: "/category/wine",
                accent: "from-wine/80 to-wine/95"
              },
              {
                title: "Craft Beers",
                description: "Lagers, ales & stouts",
                image: beerImage,
                link: "/category/beer",
                accent: "from-yellow-900/80 to-yellow-950/95"
              }
            ].map((section, index) => (
              <Link key={index} to={section.link} className="group block">
                <div className="relative overflow-hidden rounded-2xl h-52 sm:h-60 md:h-72 cursor-pointer">
                  <img
                    src={section.image}
                    alt={section.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${section.accent}`} />
                  <div className="absolute inset-0 flex flex-col justify-end p-5">
                    <h3 className="text-white font-bold text-lg sm:text-xl mb-1">{section.title}</h3>
                    <p className="text-white/70 text-sm mb-3">{section.description}</p>
                    <span className="inline-flex items-center gap-1.5 text-white text-xs font-semibold bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1.5 rounded-full w-fit group-hover:bg-white/30 transition-colors">
                      Shop Now <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Best Selling Beers Section */}
      <section className="py-6 sm:py-8 md:py-10 bg-gradient-to-b from-background via-amber-50/30 to-background" aria-label="Best Selling Beers" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 900px' }}>
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5 sm:mb-6 md:mb-8">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-2">
                🍺 BEST SELLERS
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                Best Selling Beers
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Discover our wide range of craft beers, lagers and stouts
              </p>
            </div>
            <Link to="/category/beer" className="shrink-0">
              <Button size="sm" variant="outline" className="border-amber-600 text-amber-700 hover:bg-amber-600 hover:text-white transition-colors text-xs sm:text-sm touch-manipulation">
                View All Beers
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-6">
            {[
              { name: "Craft Beer", image: "/cat/beer.webp", link: "/category/beer" },
              { name: "Lager", image: "/cat/beer.webp", link: "/category/beer" },
              { name: "Whisky", image: "/cat/whiskey.webp", link: "/category/whisky" },
              { name: "Gin", image: "/cat/gin.webp", link: "/category/gin" }
            ].map((cat) => (
              <Link key={cat.name} to={cat.link} className="group">
                <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border/50 hover:border-amber-300 hover:bg-amber-50/50 transition-all duration-200 bg-card">
                  <img src={cat.image} alt={cat.name} className="w-10 h-10 object-contain" loading="lazy" decoding="async" width="40" height="40" />
                  <span className="text-xs font-semibold text-foreground text-center leading-tight">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {filterProductsByCategory((allProducts as any[]) || [], 'beer').slice(0, 12).map((product) => (
              <Suspense key={product.id} fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg" />}>
                <LazyProductCard
                  product={product}
                  onAddToCart={addToCart}
                />
              </Suspense>
            ))}
          </div>
        </div>
      </section>


      {/* Shop by Brand Section - grouped by category */}
      {brandsByCategory.length > 0 && (
        <section className="py-6 sm:py-8 md:py-10 bg-gray-50/80" aria-label="Shop by Brand" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 900px' }}>
          <div className="container mx-auto px-3 sm:px-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight text-center mb-5 sm:mb-6 md:mb-8">
              Shop by Brand
            </h2>

            <div className="space-y-3 sm:space-y-4">
              {brandsByCategory.map((group) => {
                const expanded = !!expandedBrandCats[group.category];
                const visibleBrands = expanded ? group.brands : group.brands.slice(0, 13);
                return (
                  <div key={group.category} className="bg-card rounded-xl border border-border/40 shadow-sm p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-bold text-wine mb-2.5 sm:mb-3">
                      {group.category}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {visibleBrands.map((brand) => (
                        <Link
                          key={brand}
                          to={`/brands/${encodeURIComponent(brand)}`}
                          title={`${brand} price in Kenya — order online`}
                          className="inline-flex items-center whitespace-nowrap px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg border border-border/50 bg-background shadow-sm text-xs sm:text-sm font-semibold text-foreground hover:text-wine hover:border-wine/50 transition-colors touch-manipulation"
                        >
                          {brand}
                        </Link>
                      ))}
                    </div>
                    {group.brands.length > 13 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedBrandCats((prev) => ({ ...prev, [group.category]: !prev[group.category] }))
                        }
                        className="mt-3 inline-flex items-center px-4 py-1.5 rounded-full border border-border text-xs sm:text-sm font-medium text-foreground hover:border-wine hover:text-wine transition-colors touch-manipulation"
                      >
                        {expanded ? 'Show Less' : 'Show More'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Why Drinks Avenue - crawlable SEO content */}
      <section className="py-6 sm:py-10 md:py-14 bg-background" aria-label="Why Drinks Avenue" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 800px' }}>
        <div className="container mx-auto px-3 sm:px-4 max-w-5xl">
          <div className="text-center mb-4 sm:mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-wine bg-wine/10 border border-wine/20 px-3 py-1 rounded-full mb-2 sm:mb-3">
              ⭐ WHY CHOOSE US
            </span>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight px-2">
              The 24 Hour Liquor Store Near You in Nairobi
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-5 mb-5 sm:mb-8">
            <Card className="border border-border/60">
              <CardContent className="p-3.5 sm:p-5">
                <div className="flex items-center gap-2 mb-1 sm:mb-1.5">
                  <span className="text-lg sm:text-2xl" aria-hidden="true">🕐</span>
                  <h3 className="font-bold text-sm sm:text-base">True 24 Hour Delivery</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Whether it's midnight or midday, place your order and we deliver. Our 24 hour alcohol
                  delivery covers Nairobi in around 30 minutes — including late night delivery when
                  every other liquor store near you has closed.
                </p>
              </CardContent>
            </Card>
            <Card className="border border-border/60">
              <CardContent className="p-3.5 sm:p-5">
                <div className="flex items-center gap-2 mb-1 sm:mb-1.5">
                  <span className="text-lg sm:text-2xl" aria-hidden="true">🥃</span>
                  <h3 className="font-bold text-sm sm:text-base">Your Whisky Hub &amp; Wine Cellar</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  From single malt Scotch and bourbon in our{" "}
                  <Link to="/category/whisky" className="text-wine hover:underline">whisky collection</Link>{" "}
                  to fine <Link to="/category/wine" className="text-wine hover:underline">wines</Link>,{" "}
                  <Link to="/category/gin" className="text-wine hover:underline">gins</Link>, and ice-cold{" "}
                  <Link to="/category/beer" className="text-wine hover:underline">beers</Link> — plus
                  liqueurs and mixers to complete the party.
                </p>
              </CardContent>
            </Card>
            <Card className="border border-border/60">
              <CardContent className="p-3.5 sm:p-5">
                <div className="flex items-center gap-2 mb-1 sm:mb-1.5">
                  <span className="text-lg sm:text-2xl" aria-hidden="true">🛵</span>
                  <h3 className="font-bold text-sm sm:text-base">Fast, Legal &amp; Reliable</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Pay with M-Pesa, card or cash on delivery. Every order is age-verified (18+) and
                  handled by our own riders, so your alcohol delivery arrives quickly and safely
                  anywhere in Nairobi and across Kenya.
                </p>
              </CardContent>
            </Card>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-center max-w-3xl mx-auto">
            Searching for <strong>24 hour alcohol delivery</strong> or simply a{" "}
            <strong>liquor store near me</strong> that's open right now?
            Drinks Avenue is Nairobi's trusted online alcohol delivery service — browse{" "}
            <Link to="/offers" className="text-wine hover:underline">this week's offers</Link>, explore{" "}
            <Link to="/brands" className="text-wine hover:underline">top brands</Link>, or call{" "}
            <a href="tel:+254790831798" className="text-wine hover:underline">0790 831798</a> and
            we'll have your drinks at your door in about 30 minutes, 24 hours a day.
          </p>
        </div>
      </section>

      {/* FAQ Section - visible content matching FAQPage JSON-LD */}
      <section className="py-8 sm:py-10 md:py-14 bg-gradient-to-b from-wine/5 via-background to-background" aria-label="Frequently Asked Questions" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 700px' }}>
        <div className="container mx-auto px-3 sm:px-4 max-w-3xl">
          <div className="text-center mb-6 sm:mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-wine bg-wine/10 border border-wine/20 px-3 py-1 rounded-full mb-3">
              💬 FAQ
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Alcohol Delivery Questions, Answered
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Everything you need to know about our 24 hour drinks delivery in Nairobi and Kenya
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {homeFaqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-sm sm:text-base font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative overflow-hidden py-10 sm:py-14 md:py-20 bg-gray-950" aria-label="Call to Action">
        {/* Decorative background blobs */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-wine/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-gold/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative container mx-auto px-3 sm:px-4 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold bg-gold/10 border border-gold/30 px-3 py-1 rounded-full mb-4">
            🚚 24/7 DELIVERY
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 tracking-tight">
            Ready to Order?
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-400 mb-7 sm:mb-8 max-w-xl mx-auto leading-relaxed">
            Get your favourite drinks delivered fast — 24 hours a day, across Nairobi and Kenya.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <a href="tel:+254790831798">
              <Button size="lg" className="bg-wine hover:bg-wine/90 text-white shadow-lg shadow-wine/25 text-sm sm:text-base px-6 sm:px-8 w-full sm:w-auto">
                <Phone className="mr-2 h-4 w-4" />
                Call: 0790 831798
              </Button>
            </a>
            <Link to="/category/beer">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:border-white/60 text-sm sm:text-base px-6 sm:px-8 w-full sm:w-auto">
                Browse All Drinks
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
});

Home.displayName = 'Home';

export default Home;