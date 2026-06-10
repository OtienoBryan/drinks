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
  Globe,
  Star,
  ShoppingCart,
  Search
} from "lucide-react";
import { useProducts } from "@/hooks/useApi";
import { formatPrice } from "@/data/products";
import { LoadingWave, LoadingNetworkError } from "@/components/ui/lottie-loader";
import { useNetworkStatus, isNetworkError } from "@/hooks/useNetworkStatus";

const Origin = () => {
  const { country } = useParams<{ country?: string }>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState("");
  const { addToCart } = useCart();
  const { isOnline } = useNetworkStatus();

  // Fetch data from API
  const { data: allProducts, loading: productsLoading, error: productsError } = useProducts();

  // Extract unique origins from products
  const allOrigins = useMemo(() => {
    if (!allProducts || !Array.isArray(allProducts)) return [];
    const originsMap = new Map<string, { name: string; productCount: number; image?: string }>();
    
    (allProducts as any[]).forEach((product: any) => {
      if (product.origin) {
        const originLower = product.origin.toLowerCase();
        if (!originsMap.has(originLower)) {
          originsMap.set(originLower, {
            name: product.origin,
            productCount: 0,
            image: product.image
          });
        }
        const originData = originsMap.get(originLower)!;
        originData.productCount++;
        // Use first product image as origin image if not set
        if (!originData.image && product.image) {
          originData.image = product.image;
        }
      }
    });
    
    return Array.from(originsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allProducts]);

  // Filter origins by search query
  const filteredOrigins = useMemo(() => {
    if (!searchQuery) return allOrigins;
    const lowerQuery = searchQuery.toLowerCase();
    return allOrigins.filter(origin => 
      origin.name.toLowerCase().includes(lowerQuery)
    );
  }, [allOrigins, searchQuery]);

  // Get products for selected origin
  const originProducts = useMemo(() => {
    if (!country || !allProducts) return [];
    const lowerCountry = decodeURIComponent(country).toLowerCase();
    return (allProducts as any[]).filter((product: any) => 
      product.origin && product.origin.toLowerCase() === lowerCountry
    );
  }, [country, allProducts]);

  // Sort origin products
  const sortedOriginProducts = useMemo(() => {
    return [...originProducts].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }, [originProducts, sortOrder]);

  // Get the actual origin name with proper casing
  const selectedOriginName = useMemo(() => {
    if (!country || originProducts.length === 0) return null;
    return originProducts[0]?.origin || decodeURIComponent(country);
  }, [country, originProducts]);

  // Determine if we're showing a specific origin's products
  const isShowingOriginProducts = Boolean(country && selectedOriginName);

  // Show loading state
  if (productsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-12 sm:py-16 md:py-24 px-4">
          <div className="text-center">
            <LoadingWave size="xl" className="mx-auto mb-3 sm:mb-4" />
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-wine mb-2 sm:mb-4">
              {country ? `Loading ${decodeURIComponent(country)} Products...` : "Loading Origins..."}
            </h1>
            <p className="text-sm sm:text-base">Discovering our products...</p>
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
            <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">Unable to load products</p>
            <Button onClick={() => window.location.reload()} className="text-xs sm:text-sm touch-manipulation">
              Try Again
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // If an origin is selected, show products from that origin
  if (isShowingOriginProducts) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>{`${selectedOriginName} Drinks | Buy ${selectedOriginName} Alcohol Online Kenya | Drinks Avenue`}</title>
          <meta name="description" content={`Shop drinks imported from ${selectedOriginName}. Premium wines, spirits, beers and more from ${selectedOriginName} with fast delivery across Nairobi and Kenya.`} />
          <meta name="robots" content="index, follow" />
          <link rel="canonical" href={`https://www.drinksavenue.co.ke/origin/${encodeURIComponent((selectedOriginName || '').toLowerCase().replace(/\s+/g, '-'))}`} />
          <meta property="og:title" content={`${selectedOriginName} Drinks | Drinks Avenue Kenya`} />
          <meta property="og:description" content={`Shop premium drinks from ${selectedOriginName} with fast delivery in Nairobi and Kenya.`} />
          <meta property="og:type" content="website" />
          <meta property="og:image" content="https://www.drinksavenue.co.ke/logo.png" />
        </Helmet>
        <Navigation />
        
        {/* Header Section */}
        <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-wine/10 to-primary/10">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <Link to="/origin">
                <Button variant="outline" size="sm" className="w-fit touch-manipulation">
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline text-xs sm:text-sm">Back to Origins</span>
                  <span className="sm:hidden text-xs">Back</span>
                </Button>
              </Link>
              <div className="inline-flex items-center gap-2 bg-wine text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold">
                <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                {selectedOriginName}
              </div>
            </div>
            
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-wine mb-2 sm:mb-3">
                Products from {selectedOriginName}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Discover all products from {selectedOriginName} - {originProducts.length} {originProducts.length === 1 ? 'product' : 'products'} available
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
            {sortedOriginProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                {sortedOriginProducts.map((product) => (
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
                <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">🌍</div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-muted-foreground mb-3 sm:mb-4">
                  No products found from {selectedOriginName}
                </h3>
                <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
                  We don't have any products from this country at the moment.
                </p>
                <Link to="/origin">
                  <Button className="bg-wine hover:bg-wine/90 active:bg-wine/80 text-xs sm:text-sm touch-manipulation">
                    <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Back to Origins
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

  // Show all origins list
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Shop Drinks by Country of Origin | Imported Alcohol Kenya | Drinks Avenue</title>
        <meta name="description" content="Browse premium drinks by country of origin at Drinks Avenue Kenya. Shop imported wines from France, Italy, South Africa; whiskeys from Scotland, Ireland, USA; and spirits from around the world. Fast delivery in Nairobi." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.drinksavenue.co.ke/origin" />
        <meta property="og:title" content="Shop Drinks by Country of Origin | Drinks Avenue Kenya" />
        <meta property="og:description" content="Browse imported wines, spirits and beers from around the world. Fast delivery across Nairobi and Kenya." />
        <meta property="og:url" content="https://www.drinksavenue.co.ke/origin" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.drinksavenue.co.ke/logo.png" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Shop Imported Drinks by Origin | Drinks Avenue Kenya" />
        <meta name="twitter:description" content="Browse premium imported wines, spirits and beers from around the world at Drinks Avenue Kenya." />
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
              <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
              All Origins
            </div>
          </div>
          
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-wine mb-2 sm:mb-3">
              Browse by Origin
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Discover premium drinks from {allOrigins.length} {allOrigins.length === 1 ? 'country' : 'countries'}
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
              placeholder="Search countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-2 border border-gray-200 rounded-full bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all text-xs sm:text-sm"
            />
          </div>
        </div>
      </section>

      {/* Origins Grid */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="container mx-auto px-3 sm:px-4">
          {filteredOrigins.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
              {filteredOrigins.map((origin) => (
                <Link
                  key={origin.name}
                  to={`/origin/${encodeURIComponent(origin.name)}`}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:scale-105 group-active:scale-95 border-2 border-wine/20 hover:border-wine/40 touch-manipulation flex flex-col h-full">
                    <div className="relative overflow-hidden bg-white p-4 sm:p-6 flex items-center justify-center min-h-[120px] sm:min-h-[140px]">
                      {origin.image ? (
                        <img
                          src={origin.image}
                          alt={origin.name}
                          className="w-full h-full object-contain max-h-[100px] sm:max-h-[120px]"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-wine/10 flex items-center justify-center">
                          <Globe className="h-10 w-10 sm:h-12 sm:w-12 text-wine" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3 sm:p-4 text-center">
                      <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2 group-hover:text-wine transition-colors line-clamp-2">
                        {origin.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {origin.productCount} {origin.productCount === 1 ? 'product' : 'products'}
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
                No origins found
              </h3>
              <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
                {searchQuery 
                  ? `No countries found matching "${searchQuery}". Try a different search term.`
                  : "No origins available at the moment."
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

export default Origin;
