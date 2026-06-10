import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { UserProvider } from "@/contexts/UserContext";
import { PageLoader } from "@/components/ui/page-loader";
import { createLazyComponent } from "@/components/LazyWrapper";
import { resourcePreloader, CRITICAL_IMAGES, CRITICAL_ROUTES } from "@/services/preloader";
import FloatingContactButtons from "@/components/FloatingContactButtons";

// Tree-shaken out of production bundle entirely
const PerformanceMonitor = import.meta.env.DEV
  ? lazy(() => import("@/components/PerformanceMonitor"))
  : () => null;
const DevTools = import.meta.env.DEV
  ? lazy(() => import("@/components/DevTools").then((m) => ({ default: m.DevTools })))
  : () => null;

// Lazy load all pages with optimized loading states
const Home = createLazyComponent(() => import("./pages/Home"), "Loading home...", true);
const Category = createLazyComponent(() => import("./pages/Category"), "Loading category...");
const Product = createLazyComponent(() => import("./pages/Product"), "Loading product...");
const Cart = createLazyComponent(() => import("./pages/Cart"), "Loading cart...");
const Checkout = createLazyComponent(() => import("./pages/Checkout"), "Loading checkout...");
const Contact = createLazyComponent(() => import("./pages/Contact"), "Loading contact...");
const Account = createLazyComponent(() => import("./pages/Account"), "Loading account...");
const Orders = createLazyComponent(() => import("./pages/Orders"), "Loading orders...");
const Offers = createLazyComponent(() => import("./pages/Offers"), "Loading offers...");
const Featured = createLazyComponent(() => import("./pages/Featured"), "Loading featured products...");
const Blog = createLazyComponent(() => import("./pages/Blog"), "Loading blog posts...");
const BlogDetail = createLazyComponent(() => import("./pages/BlogDetail"), "Loading blog post...");
const Brands = createLazyComponent(() => import("./pages/Brands"), "Loading brands...");
const Origin = createLazyComponent(() => import("./pages/Origin"), "Loading origins...");
const Sitemap = createLazyComponent(() => import("./pages/Sitemap"), "Loading...");
const NotFound = createLazyComponent(() => import("./pages/NotFound"), "Loading...");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Component to handle login redirects
const LoginRedirect = () => {
  useEffect(() => {
    // Replace the current history entry to prevent back button issues
    window.history.replaceState({}, '', '/');
    // Clear any potential cached redirects
    localStorage.removeItem('redirectToLogin');
    sessionStorage.removeItem('redirectToLogin');
  }, []);
  
  return <Navigate to="/" replace />;
};

const App = () => {
  useEffect(() => {
    // Preload critical resources
    resourcePreloader.preloadImages(CRITICAL_IMAGES);
    resourcePreloader.preloadCriticalRoutes();
    
    // Clear any potential cached redirects to login
    if (window.location.pathname === '/login') {
      window.history.replaceState({}, '', '/');
      window.location.reload();
    }
    
    // Clear any potential cached redirect flags
    localStorage.removeItem('redirectToLogin');
    sessionStorage.removeItem('redirectToLogin');
    
    if (import.meta.env.DEV) {
      console.log('App initialized. Current path:', window.location.pathname);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <UserProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/category/:category" element={<Category />} />
                <Route path="/product/:slug" element={<Product />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/account" element={<Account />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/offers" element={<Offers />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogDetail />} />
                <Route path="/featured" element={<Featured />} />
                <Route path="/brands/:brandName" element={<Brands />} />
                <Route path="/brands" element={<Brands />} />
                <Route path="/origin/:country" element={<Origin />} />
                <Route path="/origin" element={<Origin />} />
                <Route path="/sitemap.xml" element={<Sitemap />} />
                {/* Redirect /login to home page to fix refresh issue */}
                <Route path="/login" element={<LoginRedirect />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <FloatingContactButtons />
              <PerformanceMonitor showMetrics={process.env.NODE_ENV === 'development'} />
              <DevTools />
            </BrowserRouter>
          </CartProvider>
        </UserProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
