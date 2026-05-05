import { useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProductCard } from "@/components/ui/product-card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { 
  ArrowLeft,
  Filter,
  SortAsc,
  SortDesc,
  Tag,
  Star,
  ShoppingCart,
  Search
} from "lucide-react";
import { useProducts } from "@/hooks/useApi";
import { formatPrice } from "@/data/products";
import { LoadingWave, LoadingNetworkError } from "@/components/ui/lottie-loader";
import { useNetworkStatus, isNetworkError } from "@/hooks/useNetworkStatus";

const Brands = () => {
  const { brandName } = useParams<{ brandName?: string }>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState("");
  const { addToCart } = useCart();
  const { isOnline } = useNetworkStatus();

  // Debug: Log route params
  console.log('Brands page - brandName:', brandName);

  // Fetch data from API
  const { data: allProducts, loading: productsLoading, error: productsError } = useProducts();

  // Extract unique brands from products
  const allBrands = useMemo(() => {
    if (!allProducts || !Array.isArray(allProducts)) return [];
    const brandsMap = new Map<string, { name: string; productCount: number; image?: string }>();
    
    (allProducts as any[]).forEach((product: any) => {
      if (product.brand) {
        const brandLower = product.brand.toLowerCase();
        if (!brandsMap.has(brandLower)) {
          brandsMap.set(brandLower, {
            name: product.brand,
            productCount: 0,
            image: product.image
          });
        }
        const brandData = brandsMap.get(brandLower)!;
        brandData.productCount++;
        // Use first product image as brand image if not set
        if (!brandData.image && product.image) {
          brandData.image = product.image;
        }
      }
    });
    
    return Array.from(brandsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allProducts]);

  // Filter brands by search query
  const filteredBrands = useMemo(() => {
    if (!searchQuery) return allBrands;
    const lowerQuery = searchQuery.toLowerCase();
    return allBrands.filter(brand => 
      brand.name.toLowerCase().includes(lowerQuery)
    );
  }, [allBrands, searchQuery]);

  // Get products for selected brand
  const brandProducts = useMemo(() => {
    if (!brandName || !allProducts) return [];
    const lowerBrandName = decodeURIComponent(brandName).toLowerCase();
    return (allProducts as any[]).filter((product: any) => 
      product.brand && product.brand.toLowerCase() === lowerBrandName
    );
  }, [brandName, allProducts]);

  // Sort brand products
  const sortedBrandProducts = useMemo(() => {
    return [...brandProducts].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }, [brandProducts, sortOrder]);

  // Get the actual brand name with proper casing
  const selectedBrandName = useMemo(() => {
    if (!brandName || brandProducts.length === 0) return null;
    return brandProducts[0]?.brand || decodeURIComponent(brandName);
  }, [brandName, brandProducts]);

  // Determine if we're showing a specific brand's products
  const isShowingBrandProducts = Boolean(brandName && selectedBrandName);

  // Show loading state
  if (productsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-12 sm:py-16 md:py-24 px-4">
          <div className="text-center">
            <LoadingWave size="xl" className="mx-auto mb-3 sm:mb-4" />
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-wine mb-2 sm:mb-4">
              {brandName ? `Loading ${decodeURIComponent(brandName)} Products...` : "Loading Brands..."}
            </h1>
            <p className="text-sm sm:text-base">Discovering our brands...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Check for network errors
  const hasNetworkError = !isOnline || isNetworkError(productsError);

  // Show network error state
  if (hasNetworkError) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-12 sm:py-16 md:py-24 px-4">
          <div className="text-center">
            <LoadingNetworkError size="xl" className="mx-auto mb-3 sm:mb-4" />
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-wine mb-3 sm:mb-4">Connection Error</h1>
            <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">Unable to load brands</p>
            <Button onClick={() => window.location.reload()} className="text-xs sm:text-sm touch-manipulation">
              Try Again
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // If a brand is selected, show products for that brand
  if (isShowingBrandProducts) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>{`${selectedBrandName} Drinks | Buy ${selectedBrandName} Online in Kenya | Drinks Avenue`}</title>
          <meta name="description" content={`Shop ${selectedBrandName} drinks online in Kenya. Browse the full ${selectedBrandName} range including wines, beers, spirits and more. Fast delivery across Nairobi and Kenya with Drinks Avenue.`} />
          <meta name="robots" content="index, follow" />
          <link rel="canonical" href={`https://www.drinksavenue.com/brands/${encodeURIComponent((selectedBrandName || '').toLowerCase().replace(/\s+/g, '-'))}`} />
          <meta property="og:title" content={`${selectedBrandName} Drinks | Drinks Avenue Kenya`} />
          <meta property="og:description" content={`Shop ${selectedBrandName} drinks online. Fast delivery across Nairobi and Kenya.`} />
          <meta property="og:type" content="website" />
          <meta property="og:image" content="https://www.drinksavenue.com/logo.png" />
        </Helmet>
        <Navigation />
        
        {/* Header Section */}
        <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-wine/10 to-primary/10">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <Link to="/brands">
                <Button variant="outline" size="sm" className="w-fit touch-manipulation">
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline text-xs sm:text-sm">Back to Brands</span>
                  <span className="sm:hidden text-xs">Back</span>
                </Button>
              </Link>
              <div className="inline-flex items-center gap-2 bg-wine text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold">
                <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
                {selectedBrandName}
              </div>
            </div>
            
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-wine mb-2 sm:mb-3">
                {selectedBrandName} Products
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Discover all products from {selectedBrandName} - {brandProducts.length} {brandProducts.length === 1 ? 'product' : 'products'} available
              </p>
            </div>
          </div>
        </section>

        {/* Sort Control */}
        <section className="py-4 sm:py-6 md:py-8 bg-white border-b">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm font-medium">Sort by name:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="text-xs sm:text-sm touch-manipulation"
              >
                {sortOrder === 'asc' ? (
                  <>
                    <SortAsc className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">A-Z</span>
                    <span className="sm:hidden">A-Z</span>
                  </>
                ) : (
                  <>
                    <SortDesc className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Z-A</span>
                    <span className="sm:hidden">Z-A</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-8 sm:py-12 md:py-16">
          <div className="container mx-auto px-3 sm:px-4">
            {sortedBrandProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                {sortedBrandProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addToCart}
                    compact
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16 md:py-24">
                <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">🏷️</div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-muted-foreground mb-3 sm:mb-4">
                  No products found for {selectedBrandName}
                </h3>
                <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
                  We don't have any products from this brand at the moment.
                </p>
                <Link to="/brands">
                  <Button className="bg-wine hover:bg-wine/90 active:bg-wine/80 text-xs sm:text-sm touch-manipulation">
                    <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Back to Brands
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    );
  }

  // Show all brands list
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Drinks Brands in Kenya | Wine, Beer &amp; Spirits Brands | Drinks Avenue</title>
        <meta name="description" content="Browse all alcohol brands available at Drinks Avenue Kenya. Shop Johnnie Walker, Absolut, Jack Daniel's, Heineken, and hundreds more premium drinks brands with fast delivery in Nairobi." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.drinksavenue.com/brands" />
        <meta property="og:title" content="Drinks Brands in Kenya | Drinks Avenue" />
        <meta property="og:description" content="Browse all premium drinks brands at Drinks Avenue. Fast alcohol delivery across Nairobi and Kenya." />
        <meta property="og:url" content="https://www.drinksavenue.com/brands" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.drinksavenue.com/logo.png" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Drinks Brands | Drinks Avenue Kenya" />
        <meta name="twitter:description" content="Browse all premium drinks brands available at Drinks Avenue with fast delivery across Kenya." />
      </Helmet>
      <Navigation />
      
      {/* Header Section */}
      <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-wine/10 to-primary/10">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Link to="/">
              <Button variant="outline" size="sm" className="w-fit touch-manipulation">
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline text-xs sm:text-sm">Back to Home</span>
                <span className="sm:hidden text-xs">Back</span>
              </Button>
            </Link>
            <div className="inline-flex items-center gap-2 bg-wine text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold">
              <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
              All Brands
            </div>
          </div>
          
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-wine mb-2 sm:mb-3">
              Browse by Brand
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Discover premium drinks from {allBrands.length} {allBrands.length === 1 ? 'brand' : 'brands'}
            </p>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="py-4 sm:py-6 md:py-8 bg-white border-b">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
            <input
              type="text"
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-2 border border-gray-200 rounded-full bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all text-xs sm:text-sm"
            />
          </div>
        </div>
      </section>

      {/* Brands Grid */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="container mx-auto px-3 sm:px-4">
          {filteredBrands.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
              {filteredBrands.map((brand) => (
                <Link
                  key={brand.name}
                  to={`/brands/${encodeURIComponent(brand.name)}`}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:scale-105 group-active:scale-95 border-2 border-wine/20 hover:border-wine/40 touch-manipulation flex flex-col h-full">
                    <div className="relative overflow-hidden bg-white p-4 sm:p-6 flex items-center justify-center min-h-[120px] sm:min-h-[140px]">
                      {brand.image ? (
                        <img
                          src={brand.image}
                          alt={brand.name}
                          className="w-full h-full object-contain max-h-[100px] sm:max-h-[120px]"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-wine/10 flex items-center justify-center">
                          <span className="text-wine font-bold text-2xl sm:text-3xl">
                            {brand.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3 sm:p-4 text-center">
                      <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2 group-hover:text-wine transition-colors line-clamp-2">
                        {brand.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {brand.productCount} {brand.productCount === 1 ? 'product' : 'products'}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16 md:py-24">
              <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">🔍</div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-muted-foreground mb-3 sm:mb-4">
                No brands found
              </h3>
              <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
                {searchQuery 
                  ? `No brands found matching "${searchQuery}". Try a different search term.`
                  : "No brands available at the moment."
                }
              </p>
              {searchQuery && (
                <Button 
                  onClick={() => setSearchQuery("")}
                  className="bg-wine hover:bg-wine/90 active:bg-wine/80 text-xs sm:text-sm touch-manipulation"
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Brands;
