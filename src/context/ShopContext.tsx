import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Product, Category, Order, AppNotification, Coupon, HeaderConfig, TimerConfig, WarrantyConfig } from '../types';

interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant: { [key: string]: string };
}

interface ShopContextType {
  user: User | null;
  token: string | null;
  cart: CartItem[];
  wishlist: Product[];
  categories: Category[];
  products: Product[];
  recentSearches: string[];
  trendingSearches: string[];
  notifications: AppNotification[];
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; user?: User; message?: string; error?: string }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string; otp?: string }>;
  resetPassword: (email: string, otp: string, password: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  addToCart: (product: Product, quantity?: number, variant?: { [key: string]: string }) => void;
  removeFromCart: (productId: string, variant?: { [key: string]: string }) => void;
  updateCartQuantity: (productId: string, quantity: number, variant?: { [key: string]: string }) => void;
  clearCart: () => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  fetchProducts: (filters?: any) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchUser: () => Promise<void>;
  triggerNotification: (title: string, message: string, type: any) => void;
  validateCoupon: (code: string) => Promise<{ coupon: Coupon } | { error: string }>;
  createOrder: (orderData: any) => Promise<Order | { error: string }>;
  cancelOrder: (orderId: string) => Promise<{ success: boolean; error?: string }>;
  addReview: (productId: string, rating: number, comment: string, images?: string[]) => Promise<{ success: boolean; error?: string }>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  // Admin triggers
  refreshAdminStores: () => Promise<void>;
  headerConfig: HeaderConfig | null;
  fetchHeaderConfig: () => Promise<void>;
  alertBar: {
    id?: string;
    title?: string;
    message: string;
    type: 'success' | 'warning' | 'info' | null;
    progress?: number; // 0..100
    paused?: boolean;
    durationMs?: number;
  };
  setAlertBar: React.Dispatch<React.SetStateAction<{
    id?: string;
    title?: string;
    message: string;
    type: 'success' | 'warning' | 'info' | null;
    progress?: number;
    paused?: boolean;
    durationMs?: number;
  }>>;
  comparedProducts: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isCompareOpen: boolean;
  setIsCompareOpen: (val: boolean) => void;
  recentlyViewed: Product[];
  addToRecentlyViewed: (product: Product) => void;
  clearRecentlyViewed: () => void;
  // Shipping and Tax API functions
  fetchShippingRates: (destinationAddress: any, packageDetails: any) => Promise<any>;
  fetchTaxCalculation: (amount: number, customerAddress: any, productCategory?: string) => Promise<any>;
  fetchCartTaxCalculation: (items: any[], customerAddress: any) => Promise<any>;
  validateAddress: (pinCode: string, state?: string) => Promise<any>;
  validateState: (state: string) => Promise<any>;
  // Carrier API functions
  fetchAvailableCarriers: () => Promise<any>;
  createCarrierShipment: (carrier: string, orderData: any) => Promise<any>;
  trackCarrierShipment: (carrier: string, trackingNumber: string) => Promise<any>;
  authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  // Customer Service functions
  createSupportTicket: (ticketData: any) => Promise<any>;
  getSupportTickets: (filters?: any) => Promise<any>;
  getSupportTicketById: (id: string) => Promise<any>;
  updateSupportTicket: (id: string, updates: any) => Promise<any>;
  sendChatMessage: (ticketId: string, message: string, attachments?: string[]) => Promise<any>;
  getChatMessages: (ticketId?: string, userId?: string) => Promise<any>;
  createCustomerNote: (userId: string, note: string, category: string, isInternal: boolean) => Promise<any>;
  getCustomerNotes: (userId?: string, category?: string) => Promise<any>;
  // Timer and Warranty functions
  timerConfigs: TimerConfig[];
  warrantyConfigs: WarrantyConfig[];
  fetchTimerConfigs: () => Promise<void>;
  fetchWarrantyConfigs: () => Promise<void>;
  getTimerForProduct: (productId: string, category?: string) => TimerConfig | null;
  getWarrantyForProduct: (productId: string, category?: string) => WarrantyConfig | null;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('ms_token'));
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches] = useState<string[]>([
    'Wireless Earbuds',
    'Smart Watch',
    'Laptop Stand',
    'USB-C Hub',
    'Mechanical Keyboard',
    'Webcam HD',
    'Portable Charger',
    'Bluetooth Speaker'
  ]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('ms_darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [alertBar, setAlertBar] = useState<{
    id?: string;
    title?: string;
    message: string;
    type: 'success' | 'warning' | 'info' | null;
    progress?: number;
    paused?: boolean;
    durationMs?: number;
  }>({
    title: '',
    message: '',
    type: null,
    progress: 0,
    paused: false,
    durationMs: 4200
  });

  const [toastQueue, setToastQueue] = useState<Array<{
    id: string;
    title?: string;
    message: string;
    type: 'success' | 'warning' | 'info';
    durationMs?: number;
  }>>([]);

  // Simple in-memory dedupe (prevents bursts of identical messages)
  const recentToastKeysRef = React.useRef<Map<string, number>>(new Map());
  const toastStartRef = React.useRef<number | null>(null);
  const toastElapsedRef = React.useRef<number>(0);

  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [timerConfigs, setTimerConfigs] = useState<TimerConfig[]>([]);
  const [warrantyConfigs, setWarrantyConfigs] = useState<WarrantyConfig[]>([]);

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      if (res.status === 401) return null; // No valid refresh token, expected for expired sessions
      const data = await res.json();
      // Handle both response formats: { token } or { data: { token } }
      const newToken = data.token || (data.data && data.data.token);
      const user = data.user || (data.data && data.data.user);
      if (newToken) {
        localStorage.setItem('ms_token', newToken);
        setToken(newToken);
        if (user) setUser(user);
        return newToken;
      }
      return null;
    } catch (error) {
      // Silently fail - this is expected for expired sessions
      return null;
    }
  };

  const authedFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const currentToken = token || localStorage.getItem('ms_token');
    if (!currentToken) {
      // Return a mock 401 response when no token is available
      return new Response(JSON.stringify({ success: false, error: 'No authentication token found' }), {
        status: 401,
        statusText: 'Unauthorized',
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${currentToken}`);
    const res = await fetch(input, { ...init, headers });

    if (res.status !== 401) return res;

    // Token may be expired: attempt one refresh rotation, then retry once.
    // Only attempt refresh if we have a token (indicates user was previously logged in)
    const nextToken = await refreshAccessToken();
    if (!nextToken) {
      logout();
      return res;
    }

    const headers2 = new Headers(init.headers || {});
    headers2.set('Authorization', `Bearer ${nextToken}`);
    return fetch(input, { ...init, headers: headers2 });
  };

  // Sync compare state to session or localStorage on load
  useEffect(() => {
    const savedCompare = localStorage.getItem('ms_compare');
    if (savedCompare) {
      try {
        setComparedProducts(JSON.parse(savedCompare));
      } catch (err) {
        console.error('Error loading compared products:', err);
      }
    }
  }, []);

  const addToCompare = (product: Product) => {
    if (comparedProducts.some(p => p.id === product.id)) {
      triggerNotification('Already in Compare', `${product.name} is already prepared for comparison.`, 'info');
      setIsCompareOpen(true);
      return;
    }
    if (comparedProducts.length >= 3) {
      triggerNotification('Compare List Full', 'You can compare up to 3 products side-by-side.', 'warning');
      return;
    }
    const nextList = [...comparedProducts, product];
    setComparedProducts(nextList);
    localStorage.setItem('ms_compare', JSON.stringify(nextList));
    triggerNotification('Added to Compare', `${product.name} prepared for comparison.`, 'success');
    setIsCompareOpen(true);
  };

  const removeFromCompare = (productId: string) => {
    const nextList = comparedProducts.filter(p => p.id !== productId);
    setComparedProducts(nextList);
    localStorage.setItem('ms_compare', JSON.stringify(nextList));
  };

  const clearCompare = () => {
    setComparedProducts([]);
    localStorage.removeItem('ms_compare');
  };

  // Sync recently viewed to localStorage on load
  useEffect(() => {
    const savedRecentlyViewed = localStorage.getItem('ms_recentlyViewed');
    if (savedRecentlyViewed) {
      try {
        setRecentlyViewed(JSON.parse(savedRecentlyViewed));
      } catch (err) {
        console.error('Error loading recently viewed:', err);
      }
    }
  }, []);

  const addToRecentlyViewed = (product: Product) => {
    setRecentlyViewed(prev => {
      // Remove if already exists, then add to front
      const filtered = prev.filter(p => p.id !== product.id);
      const next = [product, ...filtered].slice(0, 10); // Keep only last 10
      localStorage.setItem('ms_recentlyViewed', JSON.stringify(next));
      return next;
    });
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
    localStorage.removeItem('ms_recentlyViewed');
  };

  // Sync token loading
  useEffect(() => {
    const fetchUserAndLists = async () => {
      // Only try to refresh if we have a token (access token exists but might be expired)
      // Don't try to refresh for non-logged-in users to avoid 401 errors
      if (token) {
        try {
          const res = await authedFetch('/api/users/profile');
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          } else {
            // stale token
            logout();
          }
        } catch (err) {
          console.error('Error fetching profiles:', err);
        }
      }
    };

    console.log('ShopContext: Initializing data fetch');
    fetchUserAndLists().catch(() => {}); // Don't let auth errors block product loading
    fetchProducts().catch(err => console.error('Error fetching products:', err));
    fetchCategories().catch(err => console.error('Error fetching categories:', err));

    // Load static local state
    const savedCart = localStorage.getItem('ms_cart');
    if (savedCart) setCart(JSON.parse(savedCart));

    const savedWishlist = localStorage.getItem('ms_wishlist');
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

    const savedSearches = localStorage.getItem('ms_searches');
    if (savedSearches) setRecentSearches(JSON.parse(savedSearches));
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('ms_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync wishlist to localStorage
  useEffect(() => {
    localStorage.setItem('ms_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Sync dark mode to localStorage and document class
  useEffect(() => {
    localStorage.setItem('ms_darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Read notifications every 20s
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Load header config on mount
  useEffect(() => {
    fetchHeaderConfig();
    fetchTimerConfigs();
    fetchWarrantyConfigs();
  }, []);

  const fetchCategories = async () => {
    try {
      console.log('fetchCategories called');
      const res = await fetch('/api/categories');
      console.log('Categories response status:', res.status);
      const data = await res.json();
      console.log('Categories data received:', data);
      if (data.categories) {
        console.log('Setting categories:', data.categories.length);
        setCategories(data.categories);
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  };

  const fetchProducts = async (filters: any = {}) => {
    try {
      console.log('fetchProducts called with filters:', filters);
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.brand && filters.brand !== 'all') params.append('brand', filters.brand);
      if (filters.search) params.append('search', filters.search);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.rating) params.append('rating', filters.rating);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.discount) params.append('discount', 'true');
      // Set a high limit to get all products (or use filters.limit if provided)
      params.append('limit', filters.limit || '100');

      const url = `/api/products?${params.toString()}`;
      console.log('Fetching products from:', url);
      const res = await fetch(url);
      console.log('Products response status:', res.status, res.statusText);
      if (!res.ok) {
        console.error('Failed to fetch products:', res.status, res.statusText);
        return;
      }
      const data = await res.json();
      console.log('Products data received:', data);
      // Handle both response formats: { products: [] } or { data: [] }
      const productsArray = data.products || data.data || [];
      console.log('Setting products:', productsArray.length);
      setProducts(productsArray);
    } catch (e) {
      console.error('Error fetching products:', e);
    }
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await authedFetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) setNotifications(data.notifications);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHeaderConfig = async () => {
    try {
      const res = await fetch('/api/public/header-config');
      if (!res.ok) {
        console.warn('Failed to fetch header config:', res.status, res.statusText);
        return;
      }
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Unexpected content type:', contentType, '- attempting to parse as text');
        const text = await res.text();
        console.warn('Response text:', text);
        return;
      }
      
      const data = await res.json();
      if (data.data) {
        setHeaderConfig(data.data);
      }
    } catch (e) {
      console.warn('Error fetching header config:', e);
    }
  };

  const triggerNotification = (title: string, message: string, type: any) => {
    const normalizedType: 'success' | 'warning' | 'info' =
      type === 'warning' ? 'warning' : type === 'info' ? 'info' : 'success';

    const newNot: AppNotification = {
      id: `not_trig_${Date.now()}`,
      userId: user?.id || 'all',
      title,
      message,
      type: normalizedType,
      date: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNot, ...prev]);

    // Improved deduplication with longer window
    const key = `${normalizedType}::${title}::${message}`.toLowerCase();
    const now = Date.now();
    const last = recentToastKeysRef.current.get(key);
    if (last && now - last < 3000) return; // increased dedupe window to 3s
    recentToastKeysRef.current.set(key, now);

    // Clean up old dedupe keys (keep last 50)
    if (recentToastKeysRef.current.size > 50) {
      const entries = Array.from(recentToastKeysRef.current.entries());
      entries.sort((a, b) => a[1] - b[1]);
      const toDelete = entries.slice(0, entries.length - 50);
      toDelete.forEach(([k]) => recentToastKeysRef.current.delete(k));
    }

    setToastQueue(prev => [
      ...prev,
      { id: `toast_${now}_${Math.random().toString(36).slice(2, 6)}`, title, message, type: normalizedType }
    ]);
  };

  // Toast queue runner: ensure only one toast is active at a time
  useEffect(() => {
    if (alertBar.type) return; // already showing one
    if (toastQueue.length === 0) return;

    const next = toastQueue[0];
    if (!next) return;

    setToastQueue(prev => prev.slice(1));
    toastStartRef.current = Date.now();
    toastElapsedRef.current = 0;
    setAlertBar({
      id: next.id,
      title: next.title,
      message: next.message,
      type: next.type,
      progress: 100,
      paused: false,
      durationMs: next.durationMs ?? 4200
    });
  }, [toastQueue.length, alertBar.type]);

  // Progress bar + auto-dismiss
  useEffect(() => {
    if (!alertBar.type) return;
    const duration = alertBar.durationMs ?? 4200;

    const interval = window.setInterval(() => {
      if (alertBar.paused) return;
      if (toastStartRef.current == null) toastStartRef.current = Date.now();
      const elapsed = Date.now() - toastStartRef.current + toastElapsedRef.current;
      const remaining = Math.max(0, duration - elapsed);
      const progress = Math.round((remaining / duration) * 100);
      
      setAlertBar(prev => {
        if (!prev.type) return prev;
        return { ...prev, progress };
      });

      if (remaining <= 0) {
        toastStartRef.current = null;
        toastElapsedRef.current = 0;
        setAlertBar(prev => ({ ...prev, message: '', type: null, progress: 0, paused: false }));
      }
    }, 50); // Increased from 60ms to 50ms for smoother animation

    return () => window.clearInterval(interval);
  }, [alertBar.type, alertBar.paused, alertBar.durationMs]);

  // When pausing/unpausing, track elapsed time so progress is consistent
  useEffect(() => {
    if (!alertBar.type) return;
    if (alertBar.paused) {
      if (toastStartRef.current != null) {
        toastElapsedRef.current += Date.now() - toastStartRef.current;
        toastStartRef.current = null; // Reset to prevent double counting
      }
    } else {
      toastStartRef.current = Date.now();
    }
  }, [alertBar.paused, alertBar.type]);

  const login = async (email: string, password: string, rememberMe = false) => {
    try {
      console.log('ShopContext: login called with', email, 'rememberMe:', rememberMe);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
        credentials: 'include'
      });
      const data = await res.json();
      console.log('ShopContext: login API response', data);
      // Handle both response formats: { token, user } or { data: { token, user } }
      const token = data.token || (data.data && data.data.token);
      const user = data.user || (data.data && data.data.user);
      console.log('ShopContext: extracted token', token);
      console.log('ShopContext: extracted user', user);
      if (token) {
        localStorage.setItem('ms_token', token);
        setToken(token);
        setUser(user);
        // Store email in localStorage if rememberMe is checked
        if (rememberMe) {
          localStorage.setItem('ms_remember_email', email);
        } else {
          localStorage.removeItem('ms_remember_email');
        }
        console.log('ShopContext: login successful, returning', { success: true, user });
        return { success: true, user };
      }
      console.log('ShopContext: login failed, no token found');
      return { success: false, error: data.error || data.message || 'Authentication failed' };
    } catch (e: any) {
      console.log('ShopContext: login error', e);
      return { success: false, error: e.message };
    }
  };

  const register = async (regData: any) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData),
        credentials: 'include'
      });
      const data = await res.json();
      console.log('Register response:', data);
      // Handle both response formats: { token, user } or { data: { token, user } }
      const token = data.token || (data.data && data.data.token);
      const user = data.user || (data.data && data.data.user);
      if (token) {
        localStorage.setItem('ms_token', token);
        setToken(token);
        setUser(user);
        return { success: true, message: data.message, user };
      }
      return { success: false, error: data.error || 'Registration failed' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const logout = () => {
    // fire-and-forget server logout (revokes refresh token + clears cookie)
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    localStorage.removeItem('ms_token');
    setToken(null);
    setUser(null);
    setCart([]);
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, message: data.message, otp: data.otp };
      }
      return { success: false, error: data.error || 'Failed to send OTP' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const resetPassword = async (email: string, otp: string, password: string) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password }),
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || 'Failed to reset password' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const addToCart = (product: Product, quantity = 1, variant = {}) => {
    setCart(prev => {
      // Find matching item (same product ID and identical variant options)
      const existingIdx = prev.findIndex(item =>
        item.product.id === product.id &&
        JSON.stringify(item.selectedVariant) === JSON.stringify(variant)
      );

      if (existingIdx > -1) {
        const nextCart = [...prev];
        nextCart[existingIdx].quantity += quantity;
        return nextCart;
      }
      return [...prev, { product, quantity, selectedVariant: variant }];
    });
    triggerNotification('Product Appended to Cart', `${product.name} is now added.`, 'success');
  };

  const removeFromCart = (productId: string, variant = {}) => {
    setCart(prev => prev.filter(item =>
      !(item.product.id === productId && JSON.stringify(item.selectedVariant) === JSON.stringify(variant))
    ));
  };

  const updateCartQuantity = (productId: string, quantity: number, variant = {}) => {
    if (quantity <= 0) {
      removeFromCart(productId, variant);
      return;
    }
    setCart(prev => prev.map(item =>
      (item.product.id === productId && JSON.stringify(item.selectedVariant) === JSON.stringify(variant))
        ? { ...item, quantity }
        : item
    ));
  };

  const clearCart = () => setCart([]);

  const addToWishlist = (product: Product) => {
    if (!wishlist.some(p => p.id === product.id)) {
      setWishlist(prev => [...prev, product]);
      triggerNotification('Wishlist Updated', `${product.name} added to your wishlist.`, 'success');
    }
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist(prev => prev.filter(p => p.id !== productId));
  };

  const addRecentSearch = (query: string) => {
    if (!query.trim()) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== query.toLowerCase());
      const next = [query, ...filtered].slice(0, 5);
      localStorage.setItem('ms_searches', JSON.stringify(next));
      return next;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('ms_searches');
  };

  const fetchUser = async () => {
    if (!token) return;
    try {
      const res = await authedFetch('/api/users/profile', {
        method: 'GET',
        headers: {}
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch (e) {
      console.error('Error fetching user:', e);
    }
  };

  const validateCoupon = async (code: string) => {
    try {
      const subtotal = cart.reduce((sum, item) => sum + (item.product.discountPrice || item.product.price) * item.quantity, 0);
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal })
      });
      const data = await res.json();
      return data as { coupon: Coupon } | { error: string };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const createOrder = async (orderData: any) => {
    const currentToken = token || localStorage.getItem('ms_token');
    if (!currentToken && !user) return { error: 'Please sign in to place an order' };
    
    // Attempt token refresh if user is logged in but token might be stale
    if (user && !currentToken) {
      const refreshedToken = await refreshAccessToken();
      if (!refreshedToken) {
        return { error: 'Session expired. Please sign in again.' };
      }
    }
    
    try {
      const res = await authedFetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });
      const data = await res.json();
      if (data.data) {
        clearCart();
        // Refresh user data to get updated loyalty points balance
        await fetchUser();
        triggerNotification('Order Placed Successfully', `Invoice Generated: ${data.data.orderNumber}`, 'success');
        return data.data;
      }
      return { error: data.error || 'Failed to place order' };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!token) return { success: false, error: 'Unauthorized login required' };
    try {
      const res = await authedFetch(`/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: {}
      });
      const data = await res.json();
      if (data.order) {
        triggerNotification('Order Cancelled', `Order ${data.order.orderNumber} successfully cancelled`, 'info');
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to cancel order' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const addReview = async (productId: string, rating: number, comment: string) => {
    if (!token) return { success: false, error: 'Sign in to write reviews' };
    try {
      const res = await authedFetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, rating, comment })
      });
      const data = await res.json();
      if (data.review) {
        triggerNotification('Review Added', 'Thank you for your rating!', 'success');
        fetchProducts(); // Refresh listings ratings
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const refreshAdminStores = async () => {
    await fetchProducts();
    await fetchCategories();
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (!token) return;
    try {
      await authedFetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!token) return;
    try {
      await authedFetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {}
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error('Error marking all notifications as read:', e);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    // Optimistic update - remove from local state immediately
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    
    if (!token) return;
    try {
      await authedFetch('/api/notifications/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });
    } catch (e) {
      console.error('Error dismissing notification:', e);
      // Notification already removed from local state (optimistic update)
    }
  };

  const clearNotifications = async () => {
    setNotifications([]);
  };

  // Shipping and Tax API functions
  const fetchShippingRates = async (destinationAddress: any, packageDetails: any) => {
    try {
      const res = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationAddress, packageDetails })
      });
      const data = await res.json();
      if (data.success) {
        return data.data;
      }
      return { error: data.error || 'Failed to fetch shipping rates' };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const fetchTaxCalculation = async (amount: number, customerAddress: any, productCategory?: string) => {
    try {
      const res = await fetch('/api/tax/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, customerAddress, productCategory })
      });
      const data = await res.json();
      if (data.success) {
        return data.data;
      }
      return { error: data.error || 'Failed to calculate tax' };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const fetchCartTaxCalculation = async (items: any[], customerAddress: any) => {
    try {
      const res = await fetch('/api/tax/calculate-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, customerAddress })
      });
      const data = await res.json();
      if (data.success) {
        return data.data;
      }
      return { error: data.error || 'Failed to calculate cart tax' };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const validateAddress = async (pinCode: string, state?: string) => {
    try {
      const res = await fetch('/api/shipping/validate-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinCode, state })
      });
      const data = await res.json();
      if (data.success) {
        return data.data;
      }
      return { error: data.error || 'Failed to validate address' };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const validateState = async (state: string) => {
    try {
      const res = await fetch('/api/tax/validate-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state })
      });
      const data = await res.json();
      if (data.success) {
        return data.data;
      }
      return { error: data.error || 'Failed to validate state' };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const fetchAvailableCarriers = async () => {
    try {
      const res = await fetch('/api/shipping/carriers');
      const data = await res.json();
      if (data.success) {
        return data.data;
      }
      return { error: data.error || 'Failed to fetch carriers' };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const createCarrierShipment = async (carrier: string, orderData: any) => {
    try {
      const res = await authedFetch('/api/shipping/create-shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrier, orderData }),
      });
      const data = await res.json();
      if (data.success) {
        return data.data;
      }
      return { error: data.error || 'Failed to create shipment' };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const trackCarrierShipment = async (carrier: string, trackingNumber: string) => {
    try {
      const res = await authedFetch(`/api/shipping/track/${carrier}/${trackingNumber}`);
      const data = await res.json();
      if (data.success) {
        return data.data;
      }
      return { error: data.error || 'Failed to track shipment' };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  // Customer Service functions
  const createSupportTicket = async (ticketData: any) => {
    try {
      const res = await authedFetch('/api/customer-service/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData)
      });
      const data = await res.json();
      if (data.success) {
        return data.data;
      }
      return { error: data.error || 'Failed to create support ticket' };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const getSupportTickets = async (filters?: any) => {
    try {
      const queryString = new URLSearchParams(filters).toString();
      const res = await authedFetch(`/api/customer-service/tickets${queryString ? `?${queryString}` : ''}`);
      const data = await res.json();
      if (data.success) {
        return data.data.tickets;
      }
      return { error: data.error || 'Failed to fetch support tickets' };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const getSupportTicketById = async (id: string) => {
    try {
      const res = await authedFetch(`/api/customer-service/tickets/${id}`);
      const data = await res.json();
      if (data.success) {
        return data.data;
      }
      return { error: data.error || 'Failed to fetch support ticket' };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const updateSupportTicket = async (id: string, updates: any) => {
    try {
      const res = await authedFetch(`/api/customer-service/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        return data.data;
      }
      return { error: data.error || 'Failed to update support ticket' };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const sendChatMessage = async (ticketId: string, message: string, attachments?: string[]) => {
    try {
      const res = await authedFetch('/api/customer-service/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, message, attachments })
      });
      const data = await res.json();
      if (data.success) {
        return data.data;
      }
      return { error: data.error || 'Failed to send chat message' };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const getChatMessages = async (ticketId?: string, userId?: string) => {
    try {
      const queryString = new URLSearchParams({ ticketId: ticketId || '', userId: userId || '' }).toString();
      const res = await authedFetch(`/api/customer-service/chat${queryString ? `?${queryString}` : ''}`);
      const data = await res.json();
      if (data.success) {
        return data.data.messages;
      }
      return { error: data.error || 'Failed to fetch chat messages' };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const createCustomerNote = async (userId: string, note: string, category: string, isInternal: boolean) => {
    try {
      const res = await authedFetch('/api/customer-service/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, note, category, isInternal })
      });
      const data = await res.json();
      if (data.success) {
        return data.data;
      }
      return { error: data.error || 'Failed to create customer note' };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const getCustomerNotes = async (userId?: string, category?: string) => {
    try {
      const queryString = new URLSearchParams({ userId: userId || '', category: category || '' }).toString();
      const res = await authedFetch(`/api/customer-service/notes${queryString ? `?${queryString}` : ''}`);
      const data = await res.json();
      if (data.success) {
        return data.data.notes;
      }
      return { error: data.error || 'Failed to fetch customer notes' };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  // Timer and Warranty functions
  const fetchTimerConfigs = async () => {
    try {
      const res = await fetch('/api/timers');
      const data = await res.json();
      if (data.timers) {
        setTimerConfigs(data.timers);
      }
    } catch (e) {
      console.error('Error fetching timer configs:', e);
    }
  };

  const fetchWarrantyConfigs = async () => {
    try {
      const res = await fetch('/api/warranties');
      const data = await res.json();
      if (data.warranties) {
        setWarrantyConfigs(data.warranties);
      }
    } catch (e) {
      console.error('Error fetching warranty configs:', e);
    }
  };

  const getTimerForProduct = (productId: string, category?: string): TimerConfig | null => {
    // Find active timer that applies to this product
    const applicableTimer = timerConfigs.find(timer => {
      if (!timer.isActive) return false;
      
      // Check if timer applies to specific product
      if (timer.applicableProducts && timer.applicableProducts.includes(productId)) {
        return true;
      }
      
      // Check if timer applies to product's category
      if (category && timer.applicableCategories && timer.applicableCategories.includes(category)) {
        return true;
      }
      
      return false;
    });
    
    return applicableTimer || null;
  };

  const getWarrantyForProduct = (productId: string, category?: string): WarrantyConfig | null => {
    // Find active warranty that applies to this product
    const applicableWarranty = warrantyConfigs.find(warranty => {
      if (!warranty.isActive) return false;
      
      // Check if warranty applies to specific product
      if (warranty.applicableProducts && warranty.applicableProducts.includes(productId)) {
        return true;
      }
      
      // Check if warranty applies to product's category
      if (category && warranty.applicableCategories && warranty.applicableCategories.includes(category)) {
        return true;
      }
      
      return false;
    });
    
    return applicableWarranty || null;
  };

  return (
    <ShopContext.Provider value={{
      user,
      token,
      cart,
      wishlist,
      categories,
      products,
      recentSearches,
      trendingSearches,
      notifications,
      darkMode,
      setDarkMode,
      login,
      register,
      logout,
      forgotPassword,
      resetPassword,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      addToWishlist,
      removeFromWishlist,
      addRecentSearch,
      clearRecentSearches,
      fetchProducts,
      fetchCategories,
      fetchNotifications,
      fetchUser,
      triggerNotification,
      validateCoupon,
      createOrder,
      cancelOrder,
      addReview,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      dismissNotification,
      clearNotifications,
      refreshAdminStores,
      headerConfig,
      fetchHeaderConfig,
      alertBar,
      setAlertBar,
      comparedProducts,
      addToCompare,
      removeFromCompare,
      clearCompare,
      isCompareOpen,
      setIsCompareOpen,
      recentlyViewed,
      addToRecentlyViewed,
      clearRecentlyViewed,
      fetchShippingRates,
      fetchTaxCalculation,
      fetchCartTaxCalculation,
      validateAddress,
      validateState,
      fetchAvailableCarriers,
      createCarrierShipment,
      trackCarrierShipment,
      authedFetch,
      createSupportTicket,
      getSupportTickets,
      getSupportTicketById,
      updateSupportTicket,
      sendChatMessage,
      getChatMessages,
      createCustomerNote,
      getCustomerNotes,
      timerConfigs,
      warrantyConfigs,
      fetchTimerConfigs,
      fetchWarrantyConfigs,
      getTimerForProduct,
      getWarrantyForProduct
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
