import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { productSlug } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { 
  ArrowLeft,
  Filter,
  SortAsc,
  SortDesc,
  Crown,
  Star
} from "lucide-react";
import { useFeaturedProducts } from "@/hooks/useApi";
import { formatPrice } from "@/data/products";
import { LoadingWave, LoadingNetworkError } from "@/components/ui/lottie-loader";
import { useNetworkStatus, isNetworkError } from "@/hooks/useNetworkStatus";

const Featured = () => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;
  const { isOnline } = useNetworkStatus();

  // Fetch data from API
  const { data: featuredProducts, loading: featuredLoading, error: featuredError } = useFeaturedProducts();

  // Helper function to get best discount percentage from SKUs only
  const getBestDiscountFromSKU = (product: any) => {
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
  };

  // Filter products by category
  const filteredProducts = useMemo(() => {
    return filterCategory === 'all' 
      ? (featuredProducts || [])
      : (featuredProducts || []).filter(product => 
          product && product.category?.name && 
          product.category.name.toLowerCase() === filterCategory.toLowerCase()
        );
  }, [featuredProducts, filterCategory]);

  // Sort products by rating
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const ratingA = a?.rating || 0;
      const ratingB = b?.rating || 0;
      return sortOrder === 'desc' ? ratingB - ratingA : ratingA - ratingB;
    });
  }, [filteredProducts, sortOrder]);

  // Calculate pagination
  const totalPages = useMemo(() => {
    const pages = Math.ceil(sortedProducts.length / itemsPerPage);
    return pages > 0 ? pages : 1;
  }, [sortedProducts, itemsPerPage]);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = useMemo(() => {
    return sortedProducts.slice(startIndex, endIndex);
  }, [sortedProducts, startIndex, endIndex]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, sortOrder]);

  // Get unique categories from featured products
  const availableCategories = ['all', ...new Set((featuredProducts || [])
    .filter(product => product && product.category?.name)
    .map(product => product.category.name)
    .filter(Boolean))];

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Show loading state
  if (featuredLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-12 sm:py-16 md:py-24 px-4">
          <div className="text-center">
            <LoadingWave size="xl" className="mx-auto mb-3 sm:mb-4" />
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-wine mb-2 sm:mb-4">Loading Featured Products...</h1>
            <p className="text-sm sm:text-base">Discovering our premium selection...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check for network errors
  const hasNetworkError = !isOnline || isNetworkError(featuredError);

  // Show network error state
  if (hasNetworkError) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-12 sm:py-16 md:py-24 px-4">
          <div className="text-center">
            <LoadingNetworkError size="xl" className="mx-auto mb-3 sm:mb-4" />
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-wine mb-3 sm:mb-4">Connection Error</h1>
            <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">Unable to load featured products</p>
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
      <Helmet>
        <title>Featured Drinks | Premium Alcohol Selection Kenya | Drinks Avenue</title>
        <meta name="description" content="Explore our handpicked featured drinks collection. Premium wines, craft beers, whiskeys, gins and spirits curated for you. Fast delivery across Nairobi and Kenya with Drinks Avenue." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.drinksavenue.com/featured" />
        <meta property="og:title" content="Featured Drinks | Premium Alcohol Selection | Drinks Avenue Kenya" />
        <meta property="og:description" content="Explore our handpicked featured drinks — premium wines, craft beers, whiskeys, gins and spirits with fast delivery across Nairobi and Kenya." />
        <meta property="og:url" content="https://www.drinksavenue.com/featured" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.drinksavenue.com/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Featured Drinks | Drinks Avenue Kenya" />
        <meta name="twitter:description" content="Handpicked premium wines, beers, whiskeys and spirits. Fast delivery across Nairobi and Kenya." />
      </Helmet>
      <Navigation />

      {/* Header Section */}
      <section className="py-4 sm:py-5 md:py-6 bg-gradient-to-br from-wine/10 to-primary/10">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Link to="/">
              <Button variant="outline" size="sm" className="w-fit touch-manipulation">
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline text-xs sm:text-sm">Back to Home</span>
                <span className="sm:hidden text-xs">Back</span>
              </Button>
            </Link>
            <div className="inline-flex items-center gap-2 bg-wine text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold">
              <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
              Featured Products
            </div>
          </div>
          
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-wine mb-1 sm:mb-2">
              Featured Products
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Discover our handpicked selection of premium drinks - carefully curated for quality and taste.
            </p>
          </div>
        </div>
      </section>

      {/* Filters and Controls */}
      <section className="py-4 sm:py-6 md:py-8 bg-white border-b">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Category Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm font-medium">Filter by category:</span>
              </div>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {availableCategories.map((category) => (
                  <Button
                    key={category}
                    variant={filterCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterCategory(category)}
                    className={`text-xs sm:text-sm touch-manipulation ${
                      filterCategory === category ? "bg-wine hover:bg-wine/90" : ""
                    }`}
                  >
                    {category === 'all' ? 'All Categories' : category}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Sort Control */}
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm font-medium">Sort by rating:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="text-xs sm:text-sm touch-manipulation"
              >
                {sortOrder === 'desc' ? (
                  <>
                    <SortDesc className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Highest First</span>
                    <span className="sm:hidden">Highest</span>
                  </>
                ) : (
                  <>
                    <SortAsc className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Lowest First</span>
                    <span className="sm:hidden">Lowest</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-wine/5 to-primary/5">
        <div className="container mx-auto px-3 sm:px-4">
          {paginatedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                {paginatedProducts.filter(product => product && product.id).map((product) => (
                  <div key={product.id} className="relative group">
                    <Link to={`/product/${productSlug(product)}`} className="block">
                      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:scale-105 group-active:scale-95 border-0 touch-manipulation cursor-pointer">
                        <div className="relative overflow-hidden">
                          <img
                            src={product.image || '/placeholder-product.jpg'}
                            alt={product.name}
                            className="h-60 sm:h-52 md:h-56 lg:h-64 xl:h-72 w-full object-contain bg-white"
                            loading="lazy"
                            decoding="async"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          />
                          {/* Discount Badge - Only show if there's a SKU discount */}
                          {getBestDiscountFromSKU(product) > 0 && (
                            <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-red-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold">
                              {Math.round(getBestDiscountFromSKU(product))}% OFF
                            </div>
                          )}
                        </div>
                        <CardContent className="p-2 sm:p-2 md:p-3 lg:p-3">
                          <div className="space-y-1 sm:space-y-2">
                            <h3 className="font-semibold text-[10px] sm:text-xs md:text-xs lg:text-sm line-clamp-1 group-hover:text-wine transition-colors">
                              {product.name}
                            </h3>
                            <div className="flex items-center gap-1">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 ${
                                      i < Math.floor(product.rating || 0)
                                        ? "text-gold fill-gold"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs sm:text-sm text-muted-foreground">
                                ({product.reviewCount || 0})
                              </span>
                            </div>
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
                      </Card>
                    </Link>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 sm:mt-12 pt-6 border-t">
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
            </>
          ) : (
            <div className="text-center py-12 sm:py-16 md:py-24">
              <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">👑</div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-muted-foreground mb-3 sm:mb-4">No featured products found</h3>
              <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
                {filterCategory === 'all' 
                  ? "There are currently no featured products available. Check back soon for our premium selection!"
                  : `No featured products found in the ${filterCategory} category. Try selecting a different category.`
                }
              </p>
              <Link to="/">
                <Button className="bg-wine hover:bg-wine/90 active:bg-wine/80 text-xs sm:text-sm touch-manipulation">
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Featured;
