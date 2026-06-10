import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { 
  ArrowLeft, 
  ShoppingCart, 
  Star, 
  Heart, 
  Share2, 
  Truck,
  Minus,
  Plus,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  LayoutGrid,
  MapPin,
  Droplet,
  Building2,
  Copy
} from "lucide-react";
import type { Product } from "@/services/api";
import { useProduct, useProductsByCategory } from "@/hooks/useApi";
import { LoadingWine, LoadingWave } from "@/components/ui/lottie-loader";
import { ProductPageSkeleton } from "@/components/ui/loading-skeleton";
import { formatPrice } from "@/data/products";
import { slugToProductId, productSlug } from "@/lib/utils";

const Product = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const { addToCart } = useCart();

  // Extract the numeric ID from the slug (e.g. "johnnie-walker-42" → 42)
  const productId = slug ? slugToProductId(slug) : 0;
  const { data: product, loading: productLoading, error: productError } = useProduct(productId);
  
  // Only fetch related products after main product loads and has categoryId
  const shouldFetchRelated = !productLoading && product?.categoryId && product.categoryId > 0;
  const { data: relatedProducts = [] } = useProductsByCategory(product?.categoryId || 0, shouldFetchRelated);

  // Memoize filtered related products to avoid recalculation
  const filteredRelatedProducts = useMemo(() => {
    if (!relatedProducts || relatedProducts.length === 0) return [];
    return relatedProducts.filter(p => p.id !== productId);
  }, [relatedProducts, productId]);

  // Memoized helper function to get best discount percentage from SKUs only
  const getBestDiscountFromSKU = useCallback((product: any) => {
    if (!product?.skus || product.skus.length === 0) return 0;
    
    let maxDiscount = 0;
    for (const sku of product.skus) {
      if (sku.originalPrice && sku.originalPrice > sku.price) {
        const discount = ((sku.originalPrice - sku.price) / sku.originalPrice) * 100;
        if (discount > maxDiscount) {
          maxDiscount = discount;
        }
      }
    }
    return maxDiscount;
  }, []);

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;
    
    // If product has SKUs, require SKU selection
    if (product.skus && product.skus.length > 0 && !selectedSku) {
      toast({
        title: "Please select a SKU",
        description: "Please select a SKU before adding to cart.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    // Add the product to cart with the selected quantity and SKU
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedSku);
    }
    setTimeout(() => {
      setIsLoading(false);
      const skuText = selectedSku ? ` (${selectedSku})` : '';
      toast({
        title: "Added to cart",
        description: `${product.name}${skuText} (${quantity}x) has been added to your cart.`,
      });
    }, 500);
  };

  // Set default SKU when product loads
  useEffect(() => {
    if (product?.skus && product.skus.length > 0 && !selectedSku) {
      setSelectedSku(product.skus[0].code);
    }
  }, [product, selectedSku]);

  // Prefetch product images for faster switching
  useEffect(() => {
    if (product?.images && product.images.length > 1) {
      product.images.forEach((imageUrl) => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'image';
        link.href = imageUrl;
        document.head.appendChild(link);
      });
    }
  }, [product?.images]);

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 0)) {
      setQuantity(newQuantity);
    }
  };

  const handleWhatsAppOrder = () => {
    if (!product) return;
    
    const selectedSkuData = product.skus && selectedSku 
      ? product.skus.find(sku => sku.code === selectedSku)
      : null;
    
    const price = selectedSkuData?.price || product.price;
    const skuText = selectedSkuData ? ` (${selectedSkuData.code})` : '';
    
    const message = `Hello! I would like to order:\n\n` +
      `*${product.name}*${skuText}\n` +
      `Brand: ${product.brand}\n` +
      `Quantity: ${quantity}\n` +
      `Price: KES ${formatPrice(price)}\n` +
      `Total: KES ${formatPrice(price * quantity)}\n\n` +
      `Product Link: ${window.location.href}`;
    
    const whatsappNumber = '254790831798';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };


  const selectedSkuData = useMemo(() => {
    if (!product?.skus || product.skus.length === 0 || !selectedSku) return null;
    return product.skus.find((sku: any) => sku.code === selectedSku) || null;
  }, [product?.skus, selectedSku]);

  const displayPrice = selectedSkuData?.price ?? product?.price ?? 0;
  const displayOriginalPrice = selectedSkuData?.originalPrice ?? product?.originalPrice;
  const hasDiscount = !!displayOriginalPrice && displayOriginalPrice > displayPrice;

  const discountPercentage = useMemo(() => {
    if (!hasDiscount || !displayOriginalPrice || displayOriginalPrice <= 0) return 0;
    return Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100);
  }, [hasDiscount, displayOriginalPrice, displayPrice]);

  // Memoize enhanced structured data for SEO - MUST be before early returns to follow Rules of Hooks
  const structuredData = useMemo(() => {
    if (!product) return null;
    
    const baseUrl = window.location.origin;
    const productUrl = `${baseUrl}/product/${productSlug(product)}`;
    
    // Build product schema
    // Safely extract category name - may be an object or string
    const categoryName = typeof product.category === 'object'
      ? (product.category?.name || 'Drinks')
      : (product.category || 'Drinks');

    // Build clean image array - filter out null/undefined
    const productImages = product.images && product.images.length > 0
      ? product.images.filter(Boolean)
      : (product.image ? [product.image] : []);

    const productSchema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": productUrl,
    "name": product.name,
      "description": product.description
        ? product.description
        : `${product.name}${product.brand ? ` by ${product.brand}` : ''}${product.origin ? ` from ${product.origin}` : ''} - Premium ${categoryName} available at Drinks Avenue Kenya.${product.alcoholContent ? ` Alcohol content: ${product.alcoholContent}% ABV.` : ''}${product.volume ? ` Volume: ${product.volume}.` : ''} Fast 30-minute delivery in Nairobi and across Kenya.`,
      ...(productImages.length > 0 && { "image": productImages }),
    "brand": {
      "@type": "Brand",
        "name": product.brand || "Drinks Avenue"
    },
      "category": categoryName,
      "sku": product.id?.toString() || "",
      "mpn": product.id?.toString() || "",
      "url": productUrl,
      "manufacturer": product.brand ? {
        "@type": "Organization",
        "name": product.brand
      } : undefined,
    "offers": {
      "@type": "Offer",
      "price": (product.price ?? 0).toString(),
      "priceCurrency": "KES",
      "availability": (product.stock ?? 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "url": productUrl,
        "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "seller": {
        "@type": "Organization",
          "name": "Drinks Avenue",
          "url": baseUrl
    },
        "shippingDetails": {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "value": "0",
            "currency": "KES"
          },
          "shippingDestination": {
            "@type": "DefinedRegion",
            "addressCountry": "KE"
          },
          "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "businessDays": {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            },
            "cutoffTime": "23:00",
            "handlingTime": {
              "@type": "QuantitativeValue",
              "minValue": 0,
              "maxValue": 1,
              "unitCode": "DAY"
            },
            "transitTime": {
              "@type": "QuantitativeValue",
              "minValue": 0,
              "maxValue": 1,
              "unitCode": "DAY"
            }
          }
        }
      }
    };

    // Add aggregateRating only if rating exists
    if (product.rating) {
      productSchema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
        "reviewCount": product.reviewCount || 1,
        "bestRating": "5",
        "worstRating": "1"
      };
    }

    // Add additional properties
    const additionalProperties = [];
    if (product.alcoholContent) {
      additionalProperties.push({
        "@type": "PropertyValue",
        "name": "Alcohol Content",
        "value": product.alcoholContent
      });
    }
    if (product.volume) {
      additionalProperties.push({
        "@type": "PropertyValue",
        "name": "Volume",
        "value": product.volume
      });
    }
    if (product.origin) {
      additionalProperties.push({
        "@type": "PropertyValue",
        "name": "Origin",
        "value": product.origin
      });
    }
    if (product.stock !== undefined) {
      additionalProperties.push({
        "@type": "PropertyValue",
        "name": "Stock",
        "value": product.stock > 0 ? "In Stock" : "Out of Stock"
      });
    }

    if (additionalProperties.length > 0) {
      productSchema.additionalProperty = additionalProperties;
    }

    // Add SKU offers if available
    if (product.skus && product.skus.length > 0) {
      productSchema.hasVariant = product.skus.map((sku: any) => ({
        "@type": "ProductModel",
        "name": `${product.name} - ${sku.code}`,
        "sku": sku.code,
        "offers": {
          "@type": "Offer",
          "price": sku.price,
          "priceCurrency": "KES",
          "availability": "https://schema.org/InStock",
          "url": productUrl,
          "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          "seller": {
            "@type": "Organization",
            "name": "Drinks Avenue"
          }
        }
      }));
    }

    return productSchema;
  }, [product]);

  // Breadcrumb structured data
  const breadcrumbStructuredData = useMemo(() => {
    if (!product) return null;
    
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": window.location.origin
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": product.category?.name || "Products",
          "item": `${window.location.origin}/category/${product.category?.name?.toLowerCase() || 'products'}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": product.name,
          "item": `${window.location.origin}/product/${productSlug(product)}`
      }
    ]
  };
  }, [product]);

  // FAQ structured data for SEO
  const faqStructuredData = useMemo(() => {
    if (!product) return null;
    
    const faqs = [
      {
        "@type": "Question",
        "name": `What is the price of ${product.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `The price of ${product.name} by ${product.brand} is KES ${formatPrice(product.price)}${product.volume ? ` for ${product.volume}` : ''}. ${product.originalPrice && product.originalPrice > product.price ? `Original price was KES ${formatPrice(product.originalPrice)}.` : ''}`
        }
      },
      {
        "@type": "Question",
        "name": `Is ${product.name} available for delivery in Kenya?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Yes, ${product.name} is available for delivery across Kenya. We offer fast 30-minute delivery in Nairobi and delivery to other cities in Kenya. ${product.stock > 0 ? 'The product is currently in stock.' : 'Please check availability before ordering.'}`
        }
      },
      {
        "@type": "Question",
        "name": `What is the alcohol content of ${product.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": product.alcoholContent 
            ? `${product.name} has an alcohol content of ${product.alcoholContent}% ABV.`
            : `Alcohol content information is not available for ${product.name}. Please contact us for more details.`
        }
      }
    ];

    if (product.origin) {
      faqs.push({
        "@type": "Question",
        "name": `Where is ${product.name} from?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${product.name} by ${product.brand} is from ${product.origin}.`
        }
      });
    }

    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs
    };
  }, [product]);

  // Show skeleton immediately while loading - better perceived performance
  if (productLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <ProductPageSkeleton />
        <Footer />
      </div>
    );
  }

  // Handle error state
  if (productError || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-wine mb-3 sm:mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">
            {productError || "The product you're looking for doesn't exist."}
          </p>
          <Link to="/">
            <Button className="text-xs sm:text-sm touch-manipulation">Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Meta Tags - Enhanced */}
      <Helmet>
        <title>{`${product.name} - ${product.brand} | Buy Online | KES ${formatPrice(product.price)} | Drinks Avenue Kenya`}</title>
        <meta name="description" content={`Buy ${product.name} by ${product.brand} online at Drinks Avenue Kenya. ${product.description || `Premium ${product.category?.name || 'drink'}`} ${product.origin ? `from ${product.origin}` : ''} ${product.alcoholContent ? `(${product.alcoholContent}% ABV)` : ''} ${product.volume ? `- ${product.volume}` : ''}. Fast 30-minute delivery in Nairobi & Kenya. Free delivery available. Order now!`} />
        <meta name="keywords" content={`${product.name}, ${product.brand}, ${product.category?.name}, buy ${product.name} online Kenya, ${product.name} Nairobi, ${product.name} delivery Kenya, ${product.brand} ${product.category?.name}, ${product.name} price Kenya, ${product.name} ${product.origin || ''}, alcohol delivery Kenya, ${product.alcoholContent ? `${product.name} ${product.alcoholContent}%` : ''}, ${product.volume ? `${product.name} ${product.volume}` : ''}, premium ${product.category?.name} Kenya, drinks delivery Nairobi, buy ${product.brand} online, ${product.category?.name} delivery Kenya, online alcohol store Kenya, wine delivery Nairobi, spirits delivery Kenya`} />
        <meta name="author" content="Drinks Avenue" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="geo.region" content="KE" />
        <meta name="geo.placename" content="Nairobi" />
        <meta name="geo.position" content="-1.2921;36.8219" />
        <link rel="canonical" href={`${window.location.origin}/product/${productSlug(product)}`} />
        
        {product.images?.[0] && (
          <link rel="preload" href={product.images[0]} as="image" fetchpriority="high" />
        )}
        
        {/* Open Graph Tags - Enhanced */}
        <meta property="og:title" content={`${product.name} - ${product.brand} | KES ${formatPrice(product.price)} | Drinks Avenue`} />
        <meta property="og:description" content={`Buy ${product.name} by ${product.brand} online in Kenya. ${product.description || `Premium ${product.category?.name || 'drink'}`} ${product.origin ? `from ${product.origin}` : ''} ${product.alcoholContent ? `(${product.alcoholContent}% ABV)` : ''}. Fast 30-minute delivery in Nairobi. Order now!`} />
        <meta property="og:image" content={product.images?.[0] || product.image} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`${product.name} by ${product.brand} - Premium ${product.category?.name || 'drink'} ${product.origin ? `from ${product.origin}` : ''} - Drinks Avenue Kenya`} />
        <meta property="og:url" content={`${window.location.origin}/product/${productSlug(product)}`} />
        <meta property="og:type" content="product" />
        <meta property="og:site_name" content="Drinks Avenue" />
        <meta property="og:locale" content="en_KE" />
        <meta property="product:price:amount" content={product.price?.toString() || "0"} />
        <meta property="product:price:currency" content="KES" />
        <meta property="product:availability" content={product.stock > 0 ? "in stock" : "out of stock"} />
        <meta property="product:brand" content={product.brand || "Drinks Avenue"} />
        <meta property="product:category" content={product.category?.name || "Drinks"} />
        {product.origin && (
          <meta property="product:retailer_item_id" content={product.id.toString()} />
        )}
        {product.rating && (
          <meta property="product:rating:value" content={product.rating.toString()} />
        )}
        {product.reviewCount && (
          <meta property="product:rating:count" content={product.reviewCount.toString()} />
        )}
        
        {/* Twitter Card Tags - Enhanced */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.name} - ${product.brand} | KES ${formatPrice(product.price)} | Drinks Avenue`} />
        <meta name="twitter:description" content={`Buy ${product.name} by ${product.brand} online in Kenya. ${product.description?.substring(0, 200) || `Premium ${product.category?.name || 'drink'}`} ${product.origin ? `from ${product.origin}` : ''}. Fast delivery in Nairobi.`} />
        <meta name="twitter:image" content={product.images?.[0] || product.image} />
        <meta name="twitter:image:alt" content={`${product.name} by ${product.brand} - Premium ${product.category?.name || 'drink'} - Drinks Avenue Kenya`} />
        
        {/* Structured Data - Product */}
        {structuredData && (
          <script type="application/ld+json">
            {JSON.stringify(structuredData)}
          </script>
        )}
        
        {/* Structured Data - BreadcrumbList */}
        {breadcrumbStructuredData && (
          <script type="application/ld+json">
            {JSON.stringify(breadcrumbStructuredData)}
          </script>
        )}
        
        {/* Structured Data - FAQPage */}
        {faqStructuredData && (
          <script type="application/ld+json">
            {JSON.stringify(faqStructuredData)}
          </script>
        )}
      </Helmet>

      {/* Navigation */}
      <Navigation />

      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 md:py-6 lg:py-8 pb-24 sm:pb-6 lg:pb-8">
        {/* Breadcrumb Navigation - Enhanced for SEO */}
        <nav className="mb-3 sm:mb-4 md:mb-6" aria-label="Breadcrumb" itemScope itemType="https://schema.org/BreadcrumbList">
          <ol className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link to="/" className="text-muted-foreground hover:text-wine transition-colors" itemProp="item">
                <span itemProp="name">Home</span>
              </Link>
              <meta itemProp="position" content="1" />
            </li>
            <li className="text-muted-foreground" aria-hidden="true">/</li>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link to={`/category/${product.category?.name?.toLowerCase() || 'products'}`} className="text-muted-foreground hover:text-wine transition-colors" itemProp="item">
                <span itemProp="name">{product.category?.name?.charAt(0).toUpperCase() + product.category?.name?.slice(1) || 'Products'}</span>
          </Link>
              <meta itemProp="position" content="2" />
            </li>
            <li className="text-muted-foreground" aria-hidden="true">/</li>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem" className="text-wine font-medium truncate max-w-[200px] sm:max-w-none">
              <span itemProp="name">{product.name}</span>
              <meta itemProp="position" content="3" />
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[460px_1fr] gap-5 sm:gap-6 lg:gap-10" itemScope itemType="https://schema.org/Product">
          {/* Product Image */}
          <div>
            <div className="bg-white border rounded-xl p-4 sm:p-6 lg:p-8 flex items-center justify-center">
              <img
                src={product.images?.[selectedImage] || product.image}
                alt={`${product.name} by ${product.brand} - Premium ${product.category?.name || 'drink'}`}
                className="max-h-[340px] sm:max-h-[420px] lg:max-h-[520px] w-auto object-contain"
                loading="eager"
                decoding="async"
                width="520"
                height="520"
                fetchpriority="high"
                itemProp="image"
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground text-center">
              * image is for display purpose only
            </p>

            {product.images && product.images.length > 1 && (
              <div className="mt-3 sm:mt-4 grid grid-cols-4 sm:grid-cols-5 gap-2">
                {product.images.slice(0, 5).map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                      selectedImage === index ? "border-wine" : "border-muted"
                    }`}
                    aria-label={`View image ${index + 1} of ${product.images.length}`}
                    type="button"
                  >
                    <img
                      src={image}
                      alt={`${product.name} - view ${index + 1}`}
                      className="h-full w-full object-contain bg-white"
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding="async"
                      width="84"
                      height="84"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="w-full max-w-none">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {(discountPercentage > 0 || (product as any)?.isOnOffer) && (
                    <Badge className="bg-wine text-white text-xs px-2 py-0.5 rounded">
                      Holiday Special
                    </Badge>
                  )}
                  {product.stock <= 0 && (
                    <Badge variant="destructive" className="text-xs px-2 py-0.5 rounded">
                      Out of stock
                    </Badge>
                  )}
                </div>

                <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-gray-900" itemProp="name">
                  {product.name}
                </h1>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {(product.skus && product.skus.length > 0 && selectedSku) ? selectedSku : (product.volume || "")}
                    {(product.skus && product.skus.length > 0) ? " Bottle" : ""}
                  </span>
                  <span className="inline-flex items-center gap-1 text-gray-900">
                    <Star className="h-4 w-4 text-gold fill-gold" />
                    <span className="font-medium">{product.rating ?? 0}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 whitespace-nowrap">
                    KES {formatPrice(displayPrice)}
                  </div>
                  {hasDiscount && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-sm text-muted-foreground line-through whitespace-nowrap">
                        KES {formatPrice(displayOriginalPrice)}
                      </div>
                      {discountPercentage > 0 && (
                        <Badge variant="outline" className="text-xs border-wine text-wine">
                          {discountPercentage}% OFF
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFavorite(v => !v)}
                className="mt-0.5 inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border bg-white hover:bg-gray-50 transition-colors"
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? "text-wine fill-wine" : "text-gray-600"}`} />
              </button>
            </div>

            {/* Size selector (SKUs) */}
            {product.skus && product.skus.length > 0 && (
              <div className="mt-6">
                <div className="text-sm font-semibold text-gray-900 mb-2">Size</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {product.skus.map((sku) => {
                    const isSelected = selectedSku === sku.code;
                    const label = String(sku.code || "").replace(/[_-]+/g, " ").trim();
                    const skuHasDiscount = !!sku.originalPrice && sku.originalPrice > sku.price;
                    return (
                      <button
                        key={sku.code}
                        type="button"
                        onClick={() => setSelectedSku(sku.code)}
                        className={`rounded-lg border px-3 py-2.5 text-center text-xs font-semibold leading-tight transition-colors min-h-[64px] ${
                          isSelected ? "border-wine text-wine" : "border-gray-200 text-gray-900 hover:border-wine/60"
                        }`}
                        aria-pressed={isSelected}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div>{label}</div>
                          <div className={`text-[11px] font-bold ${isSelected ? "text-wine" : "text-gray-900"}`}>
                            KES {formatPrice(sku.price)}
                          </div>
                          {skuHasDiscount && (
                            <div className="text-[10px] text-muted-foreground line-through">
                              KES {formatPrice(sku.originalPrice)}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Details grid (mobile-optimized cards) */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-2 gap-3 text-sm">
              <div className="min-w-0 rounded-xl border bg-white p-3">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
                    <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-muted-foreground">Category</div>
                    <div className="font-semibold text-gray-900 truncate">
                      {product.category?.name ? (
                        <Link
                          to={`/category/${String(product.category.name).toLowerCase()}`}
                          className="hover:text-wine hover:underline underline-offset-2"
                        >
                          {String(product.category.name)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-w-0 rounded-xl border bg-white p-3">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-muted-foreground">Brand</div>
                    <div className="font-semibold text-gray-900 truncate">
                      {product.brand ? (
                        <Link
                          to={`/brands/${encodeURIComponent(product.brand)}`}
                          className="hover:text-wine hover:underline underline-offset-2"
                        >
                          {product.brand}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-w-0 rounded-xl border bg-white p-3">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
                    <Droplet className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-muted-foreground">Alcohol</div>
                    <div className="font-semibold text-gray-900 truncate">
                      {product.alcoholContent ? `${product.alcoholContent}%` : "—"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-w-0 rounded-xl border bg-white p-3">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-muted-foreground">Origin</div>
                    <div className="font-semibold text-gray-900 truncate">
                      {product.origin ? (
                        <Link
                          to={`/origin/${encodeURIComponent(product.origin)}`}
                          className="hover:text-wine hover:underline underline-offset-2"
                        >
                          {product.origin}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 justify-between sm:justify-start">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="h-9 w-9 p-0"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="min-w-[44px] text-center font-semibold text-sm">{quantity}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= (product.stock || 0)}
                  className="h-9 w-9 p-0"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:flex sm:items-center gap-2">
                <Button
                  onClick={handleAddToCart}
                  disabled={isLoading || product.stock <= 0}
                  className="bg-wine hover:bg-wine/90 text-white w-full sm:w-auto"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {isLoading ? "Adding..." : "Add to Cart"}
                </Button>
                <Button
                  onClick={handleWhatsAppOrder}
                  variant="outline"
                  className="border-green-600 text-green-700 hover:bg-green-50 w-full sm:w-auto"
                  disabled={product.stock <= 0}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Order via WhatsApp
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Truck className="h-4 w-4" />
                <span>Fast delivery. ID required for alcohol.</span>
              </div>

              <div className="flex items-center gap-2 justify-between sm:justify-end">
                <span className="text-muted-foreground font-medium">Share</span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      toast({ title: "Link copied", description: "Product link copied to clipboard." });
                    } catch {
                      toast({ title: "Copy failed", description: "Could not copy the link." });
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 hover:bg-gray-50 min-h-[36px]"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: product.name, url: window.location.href }).catch(() => {});
                    } else {
                      toast({ title: "Share", description: "Use Copy to share this product link." });
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 hover:bg-gray-50 min-h-[36px]"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Description + Reviews (Tabs) */}
        <section className="mt-6 sm:mt-10" aria-label="Product details tabs">
          <Tabs defaultValue="description">
            <TabsList className="grid w-full grid-cols-2 h-10">
              <TabsTrigger value="description" className="text-sm">
                Description
              </TabsTrigger>
              <TabsTrigger value="reviews" className="text-sm">
                Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-3">
              <Card className="border bg-white">
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-sm font-bold text-gray-900 mb-2">Product Description</h2>
                  <div className="space-y-3 text-sm text-muted-foreground leading-relaxed" itemProp="description">
                    <div className="sm:hidden">
                      {(product.description ? product.description.split(/\n\s*\n/g) : [
                        `Discover ${product.name}${product.brand ? ` by ${product.brand}` : ""}${product.origin ? `, produced in ${product.origin}` : ""}.`,
                      ]).filter(Boolean).slice(0, 2).map((p, idx) => (
                        <p key={idx}>{p}</p>
                      ))}
                    </div>
                    <div className="hidden sm:block">
                      {(product.description ? product.description.split(/\n\s*\n/g) : [
                        `Discover ${product.name}${product.brand ? ` by ${product.brand}` : ""}${product.origin ? `, produced in ${product.origin}` : ""}.`,
                      ]).filter(Boolean).slice(0, 4).map((p, idx) => (
                        <p key={idx}>{p}</p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-3">
              <Card className="border bg-white">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-gray-900">Reviews</h2>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Verified customer feedback for this product.
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(product.rating || 0)
                                ? "text-gold fill-gold"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-gray-900">
                        {product.rating ?? 0} / 5
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {product.reviewCount ?? 0} reviews
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-muted/30 p-3 sm:p-4 text-sm text-muted-foreground">
                    Reviews are not available in the current API implementation.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* Related Products - Lazy loaded after main content */}
        {filteredRelatedProducts.length > 0 && (
          <section 
            className="mt-6 sm:mt-8 md:mt-12 py-4 sm:py-5 md:py-6 bg-gradient-to-br from-wine/5 to-primary/5 -mx-3 sm:-mx-4 rounded-xl sm:rounded-2xl" 
            aria-label="Related Products"
            itemScope
            itemType="https://schema.org/ItemList"
          >
            <div className="px-3 sm:px-4">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-wine mb-3 sm:mb-4 md:mb-6" itemProp="name">
                Related Products
              </h2>
              <meta itemProp="numberOfItems" content={filteredRelatedProducts.slice(0, 6).length.toString()} />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6 items-stretch">
              {filteredRelatedProducts.slice(0, 6).map((relatedProduct, index) => (
                <div key={relatedProduct.id} className="relative group flex flex-col h-full" itemScope itemType="https://schema.org/ListItem">
                  <meta itemProp="position" content={(index + 1).toString()} />
                  <Link to={`/product/${productSlug(relatedProduct)}`} className="flex flex-col flex-1">
                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:scale-105 group-active:scale-95 border-0 touch-manipulation cursor-pointer flex flex-col h-full">
                      <div className="relative overflow-hidden flex-shrink-0" style={{ minHeight: '144px' }}>
                        <img
                          src={relatedProduct.image || '/placeholder-product.jpg'}
                          alt={relatedProduct.name}
                          className="h-36 sm:h-40 md:h-44 lg:h-48 xl:h-52 w-full object-contain bg-white"
                          loading="lazy"
                          decoding="async"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                        {/* Discount Badge - Only show if there's a SKU discount */}
                        {getBestDiscountFromSKU(relatedProduct) > 0 && (
                          <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-red-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold">
                            {Math.round(getBestDiscountFromSKU(relatedProduct))}% OFF
                          </div>
                        )}
                      </div>
                      <CardContent className="p-2 sm:p-2 md:p-3 lg:p-3 flex flex-col flex-1">
                        <div className="space-y-1 sm:space-y-2 flex flex-col flex-1">
                          <h3 className="font-semibold text-[10px] sm:text-xs md:text-xs lg:text-sm line-clamp-2 min-h-[2em] group-hover:text-wine transition-colors">
                            {relatedProduct.name}
                          </h3>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 ${
                                    i < Math.floor(relatedProduct.rating || 0)
                                      ? "text-gold fill-gold"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              ({relatedProduct.reviewCount || 0})
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            {relatedProduct.skus && relatedProduct.skus.length > 0 ? (
                              <>
                                {relatedProduct.skus.slice(0, 2).map((sku: any, idx: number) => (
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
                                {relatedProduct.skus.length > 2 && (
                                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                                    +{relatedProduct.skus.length - 2} more
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <span className="text-xs sm:text-xs md:text-sm lg:text-base font-bold text-wine">
                                      {formatPrice(relatedProduct.price)}
                                    </span>
                                    {relatedProduct.originalPrice && (
                                      <span className="text-xs sm:text-sm text-muted-foreground line-through">
                                        {formatPrice(relatedProduct.originalPrice)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {relatedProduct.originalPrice && relatedProduct.originalPrice > relatedProduct.price && (
                                  <div className="text-xs sm:text-sm text-green-600 font-medium">
                                    Save {formatPrice(relatedProduct.originalPrice - relatedProduct.price)}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-auto pt-1 flex-shrink-0">
                            {relatedProduct.origin && (
                              <div className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">
                                {relatedProduct.origin}
                              </div>
                            )}
                            {relatedProduct.alcoholContent && (
                              <span className="text-[10px] sm:text-xs text-gold font-medium">Alc. {relatedProduct.alcoholContent}%</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))}
              </div>
            </div>
          </section>
        )}
      </div>
      
      {/* Footer */}
      <Footer />

      {/* Sticky mobile Add to Cart bar */}
      {product.stock > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur border-t p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:hidden">
          <div className="container mx-auto px-2 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col gap-0.5 min-w-0">
                {product.skus && product.skus.length > 0 && selectedSku ? (
                  (() => {
                    const selectedSkuData = product.skus.find(sku => sku.code === selectedSku);
                    return selectedSkuData ? (
                      <div className="flex items-baseline gap-1 flex-wrap">
                        <span className="text-xs font-semibold text-gray-700">{selectedSkuData.code}:</span>
                        <span className="text-sm font-bold text-wine">{formatPrice(selectedSkuData.price)}</span>
                        {selectedSkuData.originalPrice && (
                          <span className="text-[10px] text-muted-foreground line-through">{formatPrice(selectedSkuData.originalPrice)}</span>
                        )}
                      </div>
                    ) : null;
                  })()
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold text-wine">{formatPrice(product.price)}</span>
                    {product.originalPrice && (
                      <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddToCart}
                disabled={isLoading}
                className="flex-1 bg-wine hover:bg-wine-light text-white text-xs px-3 py-2 min-h-[44px]"
              >
                <ShoppingCart className="h-4 w-4 mr-1 shrink-0" />
                {isLoading ? "Adding..." : "Add to Cart"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleWhatsAppOrder}
                className="flex-1 border-green-600 text-green-700 hover:bg-green-50 text-xs px-3 py-2 min-h-[44px]"
              >
                <MessageCircle className="h-4 w-4 mr-1 shrink-0" />
                WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Product;
