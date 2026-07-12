import { useState, useEffect, useMemo, useCallback } from "react";
import { productSlug } from "@/lib/utils";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/ui/product-card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  Search, 
  SlidersHorizontal, 
  ArrowLeft,
  Star,
  Percent,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useProducts, useProductsByCategoryName, useProductsByCategory, useCategories, useSubCategories } from "@/hooks/useApi";
import { Product } from "@/services/api";
import { formatPrice } from "@/data/products";
import { LoadingWave, LoadingWine } from "@/components/ui/lottie-loader";

const Category = () => {
  const { category } = useParams<{ category: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [alcoholRange, setAlcoholRange] = useState([0, 50]);
  const [minRating, setMinRating] = useState(0);
  const [inStock, setInStock] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const { addToCart } = useCart();

  // Fetch categories first (needed to find category ID)
  const { data: categories, loading: categoriesLoading } = useCategories();

  // Fetch all subcategories to detect when the route param is a subcategory slug
  const { data: allSubcategories } = useSubCategories();

  // Check if the route param matches a subcategory (e.g. /category/red-wine)
  const matchedSubcategory = useMemo(() => {
    if (!allSubcategories || !category) return null;
    const slug = category.toLowerCase();
    return (allSubcategories as any[]).find(
      sc => sc.name.toLowerCase() === slug ||
            sc.name.toLowerCase().replace(/\s+/g, '-') === slug
    ) || null;
  }, [allSubcategories, category]);

  // Get current category to fetch its subcategories and products.
  // For subcategory routes, resolve to the parent category instead.
  const currentCategory = useMemo(() => {
    if (!categories || !category) return null;
    const slug = category.toLowerCase();
    // Try direct match (exact or slug)
    const direct = (categories as any[]).find(
      cat => cat.name.toLowerCase() === slug ||
             cat.name.toLowerCase().replace(/\s+/g, '-') === slug
    );
    if (direct) return direct;
    // Fall back to parent category of a matched subcategory
    if (matchedSubcategory) {
      return (categories as any[]).find(cat => cat.id === matchedSubcategory.categoryId) || null;
    }
    return null;
  }, [categories, category, matchedSubcategory]);

  // Optimize: Use category ID directly when available to avoid extra API call in getProductsByCategoryName
  // This avoids fetching all categories again inside getProductsByCategoryName
  // Only fetch by ID if we have a valid category ID, otherwise use name-based lookup
  const hasValidCategoryId = currentCategory?.id && currentCategory.id > 0;
  const { data: categoryProductsById, loading: categoryLoadingById, error: categoryErrorById } = useProductsByCategory(
    currentCategory?.id || 0, 
    hasValidCategoryId
  );
  // Only fetch by name if we don't have a valid category ID yet (categories still loading)
  const { data: categoryProductsByName, loading: categoryLoadingByName, error: categoryErrorByName } = useProductsByCategoryName(
    category || "",
    !hasValidCategoryId && !!category // Only fetch if we don't have ID and have category name
  );
  
  // Use the optimized version (by ID) if we have category ID, otherwise fall back to name-based lookup
  const categoryProducts = hasValidCategoryId ? categoryProductsById : categoryProductsByName;
  const categoryLoading = hasValidCategoryId ? categoryLoadingById : categoryLoadingByName;
  const categoryError = hasValidCategoryId ? categoryErrorById : categoryErrorByName;
  
  // Only fetch all products if no category is specified
  const { data: allProducts, loading: productsLoading, error: productsError } = useProducts();
  
  // Only fetch subcategories if we have a category ID
  const { data: subcategories, loading: subcategoriesLoading } = useSubCategories(currentCategory?.id);

  // Use category-specific products if available, otherwise use all products
  const baseProducts = useMemo(() => {
    if (category && categoryProducts) {
      return (categoryProducts as any[]) || [];
    }
    if (!category && allProducts) {
      return (allProducts as any[]) || [];
    }
    return [];
  }, [category, categoryProducts, allProducts]);

  // Memoize unique values for filters to avoid recalculating on every render
  const uniqueSizes = useMemo(() => {
    return [...new Set(baseProducts.map(p => p.volume).filter(Boolean))].sort();
  }, [baseProducts]);

  const uniqueSubCategories = useMemo(() => {
    return (subcategories as any[])?.map(sc => sc.name) || [];
  }, [subcategories]);

  // Map of subcategoryId → name for products that only carry an id (not a joined object)
  const subcategoryIdToName = useMemo(() => {
    const map: Record<number, string> = {};
    (subcategories as any[])?.forEach(sc => { map[sc.id] = sc.name; });
    return map;
  }, [subcategories]);

  const uniqueCountries = useMemo(() => {
    return [...new Set(baseProducts.map(p => p.origin).filter(Boolean))].sort();
  }, [baseProducts]);

  // Get category display name (always show the parent category)
  const categoryDisplayName = useMemo(() => {
    return currentCategory?.name || category || "All Drinks";
  }, [currentCategory, category]);

  // Memoize filtered products to avoid recalculating on every render
  const filteredProducts = useMemo(() => {
    return baseProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.brand?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      
      // Extract alcohol percentage from alcoholContent string
      const alcoholMatch = product.alcoholContent?.match(/(\d+(?:\.\d+)?)/);
      const alcoholValue = alcoholMatch ? parseFloat(alcoholMatch[1]) : 0;
      const matchesAlcohol = alcoholValue >= alcoholRange[0] && alcoholValue <= alcoholRange[1];
      
      const matchesRating = product.rating >= minRating;
      const matchesStock = !inStock || product.stock > 0;
      const matchesSize = selectedSize === "all" || product.volume === selectedSize;
      const productSubcategoryName =
        product.subcategory?.name ||
        (product.subcategoryId ? subcategoryIdToName[product.subcategoryId] : undefined);
      const matchesSubCategory = selectedSubCategory === "all" || productSubcategoryName === selectedSubCategory;
      const matchesCountry = selectedCountry === "all" || product.origin === selectedCountry;
      
      return matchesSearch && matchesPrice && matchesAlcohol && matchesRating && matchesStock && matchesSize && matchesSubCategory && matchesCountry;
    });
  }, [baseProducts, searchQuery, priceRange, alcoholRange, minRating, inStock, selectedSize, selectedSubCategory, selectedCountry, subcategoryIdToName]);

  // Memoize sorted products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [filteredProducts, sortBy]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = useMemo(() => {
    return sortedProducts.slice(startIndex, endIndex);
  }, [sortedProducts, startIndex, endIndex]);

  // Flatten products into price-list table rows - one row per SKU size
  const categoryProductRows = useMemo(() => {
    return sortedProducts.flatMap((product: any) => {
      const base = {
        product,
        brand: product.brand || '—',
        origin: product.origin || '—',
        alcoholContent: product.alcoholContent ? `${product.alcoholContent}%` : '—',
      };
      if (product.skus && product.skus.length > 0) {
        return product.skus.map((sku: any, idx: number) => ({
          ...base,
          key: `${product.id}-${sku.code || idx}`,
          size: sku.code || '—',
          price: sku.price,
        }));
      }
      return [{ ...base, key: `${product.id}`, size: '—', price: product.price }];
    });
  }, [sortedProducts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, priceRange, alcoholRange, minRating, inStock, selectedSize, selectedSubCategory, selectedCountry, category]);


  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSortBy("name");
    setPriceRange([0, 100000]);
    setAlcoholRange([0, 50]);
    setMinRating(0);
    setInStock(false);
    setSelectedSize("all");
    setSelectedSubCategory("all");
    setSelectedCountry("all");
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top of products section when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Memoize structured data for SEO (must be before early returns to follow Rules of Hooks)
  const categoryStructuredData = useMemo(() => {
    const baseUrl = window.location.origin;
    const categoryUrl = `${baseUrl}/category/${category?.toLowerCase()}`;
    
    // Enhanced Product schema with more details
    const productSchemas = sortedProducts.slice(0, 20).map((product, index) => {
      // Build clean image array - filter out null/undefined
      const productImages = product.images && product.images.length > 0
        ? product.images.filter(Boolean)
        : (product.image ? [product.image] : []);

      const productUrl = `${baseUrl}/product/${productSlug(product)}`;
      const productSchema: any = {
        "@type": "Product",
        "@id": productUrl,
        "name": product.name,
        "url": productUrl,
        "description": product.description
          ? product.description
          : `${product.name} - Premium ${categoryDisplayName.toLowerCase()} available at Drinks Avenue Kenya. Fast delivery in Nairobi and across Kenya.`,
        ...(productImages.length > 0 && { "image": productImages }),
        "brand": {
          "@type": "Brand",
          "name": product.brand || "Drinks Avenue"
        },
        "sku": product.id?.toString() || "",
        "mpn": product.id?.toString() || "",
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
        },
        "category": categoryDisplayName
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

      // Add additional properties if they exist
      const additionalProperties = [
        ...(product.volume ? [{
          "@type": "PropertyValue",
          "name": "Volume",
          "value": product.volume
        }] : []),
        ...(product.origin ? [{
          "@type": "PropertyValue",
          "name": "Origin",
          "value": product.origin
        }] : []),
        ...(product.alcoholContent ? [{
          "@type": "PropertyValue",
          "name": "Alcohol Content",
          "value": product.alcoholContent
        }] : [])
      ].filter(Boolean);

      if (additionalProperties.length > 0) {
        productSchema.additionalProperty = additionalProperties;
      }

      return productSchema;
    });

    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `${categoryDisplayName} - Premium Drinks & Spirits | Drinks Avenue`,
      "description": `Browse our extensive collection of ${categoryDisplayName.toLowerCase()} products. ${sortedProducts.length} premium quality drinks available with fast delivery across Kenya. Shop ${categoryDisplayName.toLowerCase()} online at Drinks Avenue.`,
      "url": categoryUrl,
      "mainEntity": {
        "@type": "ItemList",
        "name": `${categoryDisplayName} Products Collection`,
        "description": `Complete collection of premium ${categoryDisplayName.toLowerCase()} products including wine, spirits, beer, and more. Fast delivery in Nairobi and across Kenya.`,
        "numberOfItems": sortedProducts.length,
        "itemListElement": productSchemas.map((product, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": product
        }))
      },
      "publisher": {
        "@type": "Organization",
        "name": "Drinks Avenue",
        "url": baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/logo.png`
        }
      }
    };
  }, [categoryDisplayName, sortedProducts, category]);

  // Separate BreadcrumbList schema for better SEO
  const breadcrumbStructuredData = useMemo(() => {
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
            "name": categoryDisplayName,
            "item": `${window.location.origin}/category/${category?.toLowerCase()}`
          }
        ]
    };
  }, [categoryDisplayName, category]);

  // Organization schema for better brand recognition
  const organizationStructuredData = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Drinks Avenue",
      "url": window.location.origin,
      "logo": `${window.location.origin}/logo.png`,
      "description": "Premium drinks and spirits delivery service in Kenya. Fast delivery of wine, beer, spirits, and more across Nairobi and Kenya.",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "KE",
        "addressLocality": "Nairobi"
      },
      "sameAs": [
        // Add social media links if available
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Customer Service",
        "areaServed": "KE",
        "availableLanguage": ["en"]
      }
    };
  }, []);

  // Determine loading state - only show loading if critical data is missing
  // Categories can load in background, subcategories are optional
  const isLoadingCriticalData = (category && categoryLoading) || (!category && productsLoading);
  const hasError = (category && categoryError) || (!category && productsError);
  
  // Show loading state only for critical data (after all hooks)
  if (isLoadingCriticalData) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-12 sm:py-16 md:py-24 px-4">
          <div className="text-center">
            <LoadingWave size="xl" className="mx-auto mb-3 sm:mb-4" />
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-wine mb-2 sm:mb-4">Loading Category...</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Discovering products for you...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state (after all hooks)
  if (hasError) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-12 sm:py-16 md:py-24 px-4">
          <div className="text-center">
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">⚠️</div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-wine mb-2 sm:mb-4">Connection Error</h1>
            <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">Unable to load products</p>
            <Button onClick={() => window.location.reload()} className="text-xs sm:text-sm touch-manipulation">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{`${categoryDisplayName} - Premium Drinks & Spirits | Drinks Avenue`}</title>
        <meta name="description" content={`Browse our extensive collection of ${categoryDisplayName.toLowerCase()} products. ${sortedProducts.length} premium quality drinks available with fast delivery across Kenya. Shop ${categoryDisplayName.toLowerCase()} online at Drinks Avenue - Nairobi's trusted alcohol delivery service.`} />
        <meta name="keywords" content={`${categoryDisplayName.toLowerCase()}, ${categoryDisplayName.toLowerCase()} delivery Kenya, alcohol delivery Nairobi, premium ${categoryDisplayName.toLowerCase()}, buy ${categoryDisplayName.toLowerCase()} online, wine delivery, spirits delivery, beer delivery, drinks delivery Kenya, alcohol online Kenya, ${categoryDisplayName.toLowerCase()} shop Nairobi`} />
        <meta name="author" content="Drinks Avenue" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="geo.region" content="KE" />
        <meta name="geo.placename" content="Nairobi" />
        <link rel="canonical" href={`${window.location.origin}/category/${category?.toLowerCase()}`} />
        
        {/* Open Graph Tags - Enhanced */}
        <meta property="og:title" content={`${categoryDisplayName} - Premium Drinks & Spirits | Drinks Avenue`} />
        <meta property="og:description" content={`Browse our extensive collection of ${categoryDisplayName.toLowerCase()} products. ${sortedProducts.length} premium quality drinks available with fast delivery across Kenya.`} />
        <meta property="og:image" content={`${window.location.origin}/logo.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`${categoryDisplayName} - Drinks Avenue`} />
        <meta property="og:url" content={`${window.location.origin}/category/${category?.toLowerCase()}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Drinks Avenue" />
        <meta property="og:locale" content="en_KE" />
        
        {/* Twitter Card Tags - Enhanced */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${categoryDisplayName} - Premium Drinks & Spirits | Drinks Avenue`} />
        <meta name="twitter:description" content={`Browse our extensive collection of ${categoryDisplayName.toLowerCase()} products. ${sortedProducts.length} premium quality drinks available with fast delivery across Kenya.`} />
        <meta name="twitter:image" content={`${window.location.origin}/logo.png`} />
        <meta name="twitter:image:alt" content={`${categoryDisplayName} - Drinks Avenue`} />
        
        {/* Structured Data - CollectionPage */}
        <script type="application/ld+json">
          {JSON.stringify(categoryStructuredData)}
        </script>
        
        {/* Structured Data - BreadcrumbList */}
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbStructuredData)}
        </script>
        
        {/* Structured Data - Organization */}
        <script type="application/ld+json">
          {JSON.stringify(organizationStructuredData)}
        </script>
      </Helmet>

      {/* Navigation */}
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4 lg:py-4">
        {/* Breadcrumb Navigation - Enhanced for SEO */}
        <nav className="mb-2 sm:mb-3" aria-label="Breadcrumb" itemScope itemType="https://schema.org/BreadcrumbList">
          <ol className="flex items-center space-x-2 text-sm">
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link to="/" className="text-muted-foreground hover:text-wine transition-colors" itemProp="item">
                <span itemProp="name">Home</span>
              </Link>
              <meta itemProp="position" content="1" />
            </li>
            <li className="text-muted-foreground" aria-hidden="true">/</li>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem" className="text-wine font-semibold">
              <span itemProp="name">{categoryDisplayName}</span>
              <meta itemProp="position" content="2" />
            </li>
          </ol>
        </nav>

        {/* Header Section - Redesigned with Enhanced SEO */}
        <header className="mb-3 sm:mb-4 lg:mb-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-wine mb-1.5">
                {categoryDisplayName}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Discover {sortedProducts.length} premium {categoryDisplayName.toLowerCase()} products with fast delivery across Kenya. Shop online for the best selection of {categoryDisplayName.toLowerCase()} including wine, spirits, beer, and more. Free delivery available in Nairobi.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl sm:text-3xl font-bold text-wine">{sortedProducts.length}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Products</div>
              </div>
            </div>
          </div>
        </header>

        {/* Filter Toggle */}
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full justify-between h-12 text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              {showFilters ? "Hide Filters & Sort" : "Show Filters & Sort"}
            </span>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-1 lg:gap-2">
          {/* Filters Sidebar - Redesigned */}
          <aside className={`${showFilters ? 'block lg:col-span-3' : 'hidden'}`} aria-label="Product Filters">
            <Card className="lg:sticky lg:top-24 shadow-md border-2">
              <CardHeader className="border-b bg-gradient-to-r from-wine/5 to-wine/10 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-wine" />
                  Filters & Sort
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 p-3 max-h-[calc(100vh-8rem)] overflow-y-auto">
                {/* Search - Redesigned */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Search Products</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
                    <Input
                      placeholder="Search drinks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Subcategory Filter - Redesigned */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Subcategory</label>
                  <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Subcategories" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      <SelectItem value="all">All Subcategories</SelectItem>
                      {uniqueSubCategories.map((subcategory: string) => (
                        <SelectItem key={subcategory} value={subcategory}>
                          {subcategory}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By - Redesigned */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="price-low">Price (Low to High)</SelectItem>
                      <SelectItem value="price-high">Price (High to Low)</SelectItem>
                      <SelectItem value="rating">Rating (High to Low)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range - Redesigned */}
                <div className="space-y-2 p-2 bg-muted/50 rounded-lg">
                  <label className="text-xs font-semibold flex items-center justify-between">
                    <span>Price Range</span>
                    <Badge variant="secondary" className="text-[10px] font-semibold px-1.5 py-0.5">
                      KES {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()}
                    </Badge>
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={100000}
                    step={100}
                    className="w-full"
                  />
                </div>

                {/* Alcohol Content - Redesigned */}
                <div className="space-y-2 p-2 bg-muted/50 rounded-lg">
                  <label className="text-xs font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Percent className="h-3.5 w-3.5" />
                      Alcohol Content
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-semibold px-1.5 py-0.5">
                      {alcoholRange[0]}% - {alcoholRange[1]}%
                    </Badge>
                  </label>
                  <Slider
                    value={alcoholRange}
                    onValueChange={setAlcoholRange}
                    max={50}
                    step={0.5}
                    className="w-full"
                  />
                </div>

                {/* Minimum Rating - Redesigned */}
                <div className="space-y-2 p-2 bg-muted/50 rounded-lg">
                  <label className="text-xs font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      Minimum Rating
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-semibold px-1.5 py-0.5">
                      {minRating.toFixed(1)}+ stars
                    </Badge>
                  </label>
                  <Slider
                    value={[minRating]}
                    onValueChange={([value]) => setMinRating(value)}
                    max={5}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* In Stock Only - Redesigned */}
                <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="inStock"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="rounded border-input h-3.5 w-3.5 cursor-pointer"
                  />
                  <label htmlFor="inStock" className="text-xs font-medium cursor-pointer">
                    In stock only
                  </label>
                </div>

                {/* Volume Filter - Redesigned */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Volume</label>
                  <Select value={selectedSize} onValueChange={setSelectedSize}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Volumes" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      <SelectItem value="all">All Volumes</SelectItem>
                      {uniqueSizes.map((size: string) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Origin Filter - Redesigned */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Origin</label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Origins" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      <SelectItem value="all">All Origins</SelectItem>
                      {uniqueCountries.map((origin: string) => (
                        <SelectItem key={origin} value={origin}>
                          {origin}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Reset Filters - Redesigned */}
                <Button 
                  variant="outline" 
                  onClick={resetFilters} 
                  className="w-full h-8 text-xs font-semibold border-2 hover:bg-wine hover:text-white hover:border-wine transition-colors"
                >
                  Reset All Filters
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Products Grid - Redesigned */}
          <main className={`${showFilters ? 'lg:col-span-9' : 'lg:col-span-12'} -ml-2 lg:ml-0`} aria-label="Product List">
            {sortedProducts.length === 0 ? (
              <div className="text-center py-16 sm:py-20">
                <div className="text-6xl sm:text-7xl mb-4">🔍</div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3">No products found</h3>
                <p className="text-muted-foreground text-base mb-6 max-w-md mx-auto">
                  No products found matching your criteria. Try adjusting your filters.
                </p>
                <Button variant="outline" onClick={resetFilters} className="h-11 px-6">
                  Reset Filters
                </Button>
              </div>
            ) : (
              <>
                <section 
                  aria-label={`${categoryDisplayName} Products`}
                  className="bg-gradient-to-br from-wine/5 to-primary/5 rounded-lg"
                >
                  <div className="px-1 sm:px-2">
                    {/* Results count - Redesigned */}
                    <div className="mb-3 sm:mb-4 flex items-center justify-between pb-2 sm:pb-3 border-b border-border/50">
                      <div className="text-sm text-muted-foreground">
                        Showing <span className="font-semibold text-foreground">{startIndex + 1}-{Math.min(endIndex, sortedProducts.length)}</span> of <span className="font-semibold text-foreground">{sortedProducts.length}</span> products
                      </div>
                      <div className="hidden sm:block text-xs text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </div>
                    </div>
                    
                    {/* Products Grid - structured data is emitted via JSON-LD above; no inline microdata here to avoid incomplete Product/ItemList items */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                      {paginatedProducts.map((product, index) => (
                        <article
                          key={product.id}
                          className="relative group"
                        >
                          <ProductCard
                            product={product}
                            onAddToCart={addToCart}
                            compact
                          />
                        </article>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Pagination - Redesigned */}
                {totalPages > 1 && (
                  <div className="mt-6 sm:mt-8 pt-4 border-t">
                    <Pagination>
                      <PaginationContent className="gap-2">
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage > 1) handlePageChange(currentPage - 1);
                            }}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer h-10 px-4'}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          // Show first page, last page, current page, and pages around current
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handlePageChange(page);
                                  }}
                                  isActive={currentPage === page}
                                  className="cursor-pointer h-10 w-10"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis className="h-10 w-10" />
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage < totalPages) handlePageChange(currentPage + 1);
                            }}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer h-10 px-4'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}

                {/* Price List Table - crawlable product/price data for SEO */}
                {categoryProductRows.length > 0 && (
                  <section
                    className="mt-6 sm:mt-8 md:mt-10"
                    aria-label={`${categoryDisplayName} price list`}
                    style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 800px' }}
                  >
                    <div className="mb-4 sm:mb-6">
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground tracking-tight">
                        {categoryDisplayName} Price List in Kenya
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        All {categoryDisplayName.toLowerCase()} products, sizes and prices — updated regularly. Order online for fast delivery in Nairobi.
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap text-xs sm:text-sm">Product Name</TableHead>
                            <TableHead className="whitespace-nowrap text-xs sm:text-sm">Brand</TableHead>
                            <TableHead className="whitespace-nowrap text-xs sm:text-sm">Size</TableHead>
                            <TableHead className="whitespace-nowrap text-xs sm:text-sm">Price</TableHead>
                            <TableHead className="whitespace-nowrap text-xs sm:text-sm">Alcohol Content</TableHead>
                            <TableHead className="whitespace-nowrap text-xs sm:text-sm">Country</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryProductRows.map((row: any) => (
                            <TableRow key={row.key}>
                              <TableCell className="text-xs sm:text-sm font-medium">
                                <Link
                                  to={`/product/${productSlug(row.product)}`}
                                  className="text-wine hover:underline"
                                  title={`${row.product.name} — order online at Drinks Avenue`}
                                >
                                  {row.product.name}
                                </Link>
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                {row.brand !== '—' ? (
                                  <Link
                                    to={`/brands/${encodeURIComponent(row.brand)}`}
                                    className="hover:text-wine hover:underline"
                                    title={`All ${row.brand} products & prices in Kenya`}
                                  >
                                    {row.brand}
                                  </Link>
                                ) : (
                                  row.brand
                                )}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm whitespace-nowrap">{row.size}</TableCell>
                              <TableCell className="text-xs sm:text-sm whitespace-nowrap font-semibold">
                                {row.price != null ? formatPrice(row.price) : '—'}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm whitespace-nowrap">{row.alcoholContent}</TableCell>
                              <TableCell className="text-xs sm:text-sm whitespace-nowrap">{row.origin}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </section>
                )}
              </>
            )}
          </main>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Category;