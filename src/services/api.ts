// API service for fetching data from the backend
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && (
    window.location.hostname.endsWith('vercel.app') ||
    window.location.hostname.includes('drinksavenue.co.ke')
  )
    ? '/api'
    : 'http://localhost:3001/api');

export interface Category {
  id: number;
  name: string;
  description: string;
  image: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubCategory {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  categoryId: number;
  category: Category;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSKU {
  code: string;
  price: number;
  originalPrice?: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  image: string;
  images?: string[];
  brand: string;
  alcoholContent: string;
  volume: string;
  origin: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  newArrival: boolean;
  requiresAgeVerification: boolean;
  category: Category;
  categoryId: number;
  subcategory?: SubCategory;
  subcategoryId?: number;
  skus?: ProductSKU[];
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  isPublished: boolean;
  author?: string;
  tags?: string[];
  slug?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryLocation {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductReview {
  id: number;
  productId: number;
  customerName: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  customerName: string;
  customerEmail?: string;
  rating: number;
  title?: string;
  comment: string;
  website?: string; // honeypot field, must stay empty
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: string;
  billingAddress?: string;
  notes?: string;
  paymentMethod: string;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: string;
  billingAddress?: string;
  notes?: string;
  items: {
    id: number;
    productId: number;
    quantity: number;
    price: number;
    total: number;
    product: {
      id: number;
      name: string;
      image: string;
    };
  }[];
  createdAt: string;
  updatedAt: string;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      console.log(`Making API request to: ${url}`);
      console.log('Request options:', options);
      console.log('Request body:', options?.body);
      console.log('Request body type:', typeof options?.body);
      console.log('Request headers:', {
        'Content-Type': 'application/json',
        ...options?.headers,
      });
      
      const response = await fetch(url, {
        method: options?.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: options?.body,
      });

      console.log(`Response status: ${response.status}`);
      console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Received non-JSON response:', responseText.substring(0, 200));
        throw new Error(`Expected JSON but received ${contentType}. Response: ${responseText.substring(0, 100)}...`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Enhance error with network information
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new Error('Network connection failed. Please check your internet connection.');
        networkError.name = 'NetworkError';
        (networkError as any).code = 'NETWORK_ERROR';
        throw networkError;
      }
      
      // Handle 502 Bad Gateway errors specifically
      if (error.message.includes('502')) {
        const gatewayError = new Error('Backend service is temporarily unavailable. Please try again later.');
        gatewayError.name = 'GatewayError';
        (gatewayError as any).code = 'GATEWAY_ERROR';
        throw gatewayError;
      }
      
      throw error;
    }
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/categories');
  }

  async getCategoryById(id: number): Promise<Category> {
    return this.request<Category>(`/categories/${id}`);
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return this.request<Product[]>('/products');
  }

  async getProductById(id: number): Promise<Product> {
    return this.request<Product>(`/products/${id}`);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return this.request<Product[]>('/products/featured');
  }

  async getNewArrivals(): Promise<Product[]> {
    return this.request<Product[]>('/products/new-arrivals');
  }

  async searchProducts(query: string): Promise<Product[]> {
    return this.request<Product[]>(`/products/search?q=${encodeURIComponent(query)}`);
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return this.request<Product[]>(`/products/category/${categoryId}`);
  }

  async getPopularWines(): Promise<Product[]> {
    return this.request<Product[]>('/products/popular-wines');
  }

  // Product reviews
  async getProductReviews(productId: number): Promise<ProductReview[]> {
    return this.request<ProductReview[]>(`/products/${productId}/reviews`);
  }

  async createProductReview(productId: number, data: CreateReviewRequest): Promise<ProductReview> {
    return this.request<ProductReview>(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Blogs (public, published posts only)
  async getBlogs(): Promise<BlogPost[]> {
    return this.request<BlogPost[]>('/blogs');
  }

  async getBlogById(id: number): Promise<BlogPost> {
    return this.request<BlogPost>(`/blogs/${id}`);
  }

  async getBlogBySlug(slug: string): Promise<BlogPost> {
    return this.request<BlogPost>(`/blogs/slug/${encodeURIComponent(slug)}`);
  }

  // Delivery locations (public)
  async getDeliveryLocations(): Promise<DeliveryLocation[]> {
    return this.request<DeliveryLocation[]>('/delivery-locations');
  }

  async getDeliveryLocationBySlug(slug: string): Promise<DeliveryLocation> {
    return this.request<DeliveryLocation>(`/delivery-locations/${encodeURIComponent(slug)}`);
  }

  // Helper method to get products by category name (for backward compatibility)
  async getProductsByCategoryName(categoryName: string): Promise<Product[]> {
    const categories = await this.getCategories();
    const slug = categoryName.toLowerCase();
    const category = categories.find(cat =>
      cat.name.toLowerCase() === slug ||
      cat.name.toLowerCase().replace(/\s+/g, '-') === slug
    );
    
    if (!category) {
      return [];
    }
    
    return this.getProductsByCategory(category.id);
  }

  // Orders
  async createOrder(orderData: CreateOrderRequest, userId: number): Promise<OrderResponse> {
    let requestBody: string;
    
    try {
      console.log('=== API SERVICE CREATE ORDER START ===');
      console.log('Method called with parameters:', { orderData, userId });
      console.log('Order data parameter received:', orderData);
      console.log('Order data type:', typeof orderData);
      console.log('Order data is undefined:', orderData === undefined);
      console.log('Order data is null:', orderData === null);
      console.log('Arguments length:', arguments.length);
      console.log('All arguments:', Array.from(arguments));
      
      if (!orderData) {
        console.error('ERROR: orderData is undefined or null in API service!');
        console.error('This means the parameter was not passed correctly from UserContext');
        throw new Error('Order data is required but was not provided to API service');
      }
      
      console.log('Order data stringified:', JSON.stringify(orderData, null, 2));
      console.log('Order data items:', orderData.items);
      console.log('Order data items length:', orderData.items?.length);
      console.log('User ID being sent:', userId);
      console.log('API endpoint: /orders');
      
      requestBody = JSON.stringify(orderData);
      console.log('Request body:', requestBody);
      console.log('Request body length:', requestBody.length);
      console.log('Request body type:', typeof requestBody);
      
      const response = await this.request<OrderResponse>('/orders', {
        method: 'POST',
        headers: {
          'user-id': userId.toString(),
        },
        body: requestBody,
      });
      console.log('=== ORDER API RESPONSE SUCCESS ===');
      console.log('Order API response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('=== API CREATE ORDER ERROR ===');
      console.error('API createOrder error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Order data that failed:', JSON.stringify(orderData, null, 2));
      console.error('User ID sent:', userId);
      console.error('Request body that failed:', requestBody);
      console.error('Items in order data:', orderData.items);
      console.error('Items type:', typeof orderData.items);
      console.error('Items length:', orderData.items?.length);
      console.error('Items is array:', Array.isArray(orderData.items));
      
      // Log specific error types
      if (error.message?.includes('500')) {
        console.error('Server returned 500 - Internal Server Error');
        console.error('This usually means the backend has a bug or database issue');
      } else if (error.message?.includes('400')) {
        console.error('Server returned 400 - Bad Request');
        console.error('The order data format is invalid');
      } else if (error.message?.includes('Failed to fetch')) {
        console.error('Network error - cannot reach backend server');
      }
      
      throw error;
    }
  }

  async getMyOrders(userId: number): Promise<OrderResponse[]> {
    return this.request<OrderResponse[]>('/orders/my-orders', {
      headers: {
        'user-id': userId.toString(),
      },
    });
  }

  async getOrderById(id: number, userId: number): Promise<OrderResponse> {
    return this.request<OrderResponse>(`/orders/${id}`, {
      headers: {
        'user-id': userId.toString(),
      },
    });
  }

  // SubCategories
  async getSubCategories(categoryId?: number): Promise<SubCategory[]> {
    const url = categoryId ? `/subcategories?categoryId=${categoryId}` : '/subcategories';
    return this.request<SubCategory[]>(url);
  }

  async getSubCategoryById(id: number): Promise<SubCategory> {
    return this.request<SubCategory>(`/subcategories/${id}`);
  }
}

export const apiService = new ApiService();
export default apiService;
