import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService, Product, Category, SubCategory } from '@/services/api';

// Generic hook for API calls using React Query
export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const queryKey = ['api', apiCall.name || 'generic', ...dependencies];
  
  const { data, isLoading: loading, error } = useQuery({
    queryKey,
    queryFn: apiCall,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return { 
    data: data || null, 
    loading, 
    error: error?.message || null 
  };
}

// Specific hooks for different data types with optimized query keys
export function useCategories() {
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiService.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return { data: data || null, loading, error: error?.message || null };
}

export function useProducts() {
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiService.getProducts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return { data: data || null, loading, error: error?.message || null };
}

export function useFeaturedProducts() {
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => apiService.getFeaturedProducts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return { data: data || null, loading, error: error?.message || null };
}

export function useBlogs(enabled: boolean = true) {
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['blogs'],
    queryFn: () => apiService.getBlogs(),
    enabled,
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return { data: data || [], loading, error: error?.message || null };
}

export function useBlog(identifier: string | number, enabled: boolean = true) {
  const queryKey = ['blog', identifier];

  const queryFn = async () => {
    if (typeof identifier === 'number' || /^[0-9]+$/.test(String(identifier))) {
      return apiService.getBlogById(Number(identifier));
    }

    return apiService.getBlogBySlug(String(identifier));
  };

  const { data, isLoading: loading, error } = useQuery({
    queryKey,
    queryFn,
    enabled: enabled && !!identifier,
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return { data: data || null, loading, error: error?.message || null };
}

export function useNewArrivals() {
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['new-arrivals'],
    queryFn: () => apiService.getNewArrivals(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return { data: data || null, loading, error: error?.message || null };
}

export function usePopularWines() {
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['popular-wines'],
    queryFn: () => apiService.getPopularWines(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return { data: data || null, loading, error: error?.message || null };
}

export function useProduct(id: number) {
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => apiService.getProductById(id),
    enabled: id > 0, // Only fetch if valid ID
    staleTime: 10 * 60 * 1000, // 10 minutes - products don't change often
    cacheTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
    retry: 1, // Reduce retries for faster failure
    retryDelay: 500, // Faster retry
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cache if available
    refetchOnReconnect: false, // Don't refetch on reconnect
    networkMode: 'online', // Only fetch when online
  });

  return { 
    data: data || null, 
    loading, 
    error: error?.message || null 
  };
}

export function useProductsByCategory(categoryId: number, enabled: boolean = true) {
  const queryKey = ['products-by-category', categoryId];
  
  const { data, isLoading: loading, error } = useQuery({
    queryKey,
    queryFn: () => apiService.getProductsByCategory(categoryId),
    enabled: enabled && categoryId > 0, // Only fetch if enabled and valid ID
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return { 
    data: data || null, 
    loading, 
    error: error?.message || null 
  };
}

export function useProductsByCategoryName(categoryName: string, enabled: boolean = true) {
  const queryKey = ['products-by-category-name', categoryName];
  
  const { data, isLoading: loading, error } = useQuery({
    queryKey,
    queryFn: () => apiService.getProductsByCategoryName(categoryName),
    enabled: enabled && !!categoryName, // Only fetch if enabled and category name exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return { 
    data: data || null, 
    loading, 
    error: error?.message || null 
  };
}

export function useProductReviews(productId: number, enabled: boolean = true) {
  const queryKey = ['product-reviews', productId];

  const { data, isLoading: loading, error } = useQuery({
    queryKey,
    queryFn: () => apiService.getProductReviews(productId),
    enabled: enabled && productId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    data: data || null,
    loading,
    error: error?.message || null
  };
}

export function useSearchProducts(query: string) {
  return useApi<Product[]>(
    () => query ? apiService.searchProducts(query) : Promise.resolve([] as Product[]),
    [query]
  );
}

// Hook for search with debouncing
export function useSearchProductsDebounced(query: string, delay: number = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  return useSearchProducts(debouncedQuery);
}

// SubCategory hooks
export function useSubCategories(categoryId?: number) {
  return useApi(() => apiService.getSubCategories(categoryId), [categoryId]);
}

export function useSubCategory(id: number) {
  return useApi(() => apiService.getSubCategoryById(id), [id]);
}
