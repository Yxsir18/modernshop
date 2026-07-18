import React, { useEffect, useState } from 'react';
import { useShop } from '../context/ShopContext';
import { useNavigate, Link } from 'react-router-dom';
import { Product, Category, Order, User as UserType, Coupon, HeaderConfig, HeroSlide, HomeContent, HomePromoCard, Newsletter, TimerConfig, WarrantyConfig } from '../types';
import { CustomerService } from '../components/CustomerService';
import {
  ShieldAlert,
  TrendingUp,
  ShoppingBag,
  Users,
  Percent,
  Truck,
  PlusCircle,
  Plus,
  Tag,
  ListFilter,
  Trash2,
  Edit2,
  Layers,
  Upload,
  CheckCircle,
  Lock,
  Layout,
  X,
  Star,
  MapPin,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Bell,
  Mail,
  Eye,
  Download,
  Calendar,
  BarChart3,
  Package,
  UserCircle,
  Award,
  XCircle,
  FileText,
  Share2,
  Calculator,
  Settings,
  RefreshCw,
  Timer,
  Shield
} from 'lucide-react';
import { formatPrice } from '../utils/currency';

const DEFAULT_HOME_CONTENT: HomeContent = {
  trending: {
    title: 'Trending Galleries',
    description: 'Discover refined products mapped across global categories.'
  },
  featured: {
    title: 'Featured Additions',
    description: 'Sovereign essentials handcrafted with modern durability matrices.'
  },
  bestSellers: {
    title: 'Bestselling Classics',
    description: 'The historical crowd-favorites backed by verified customer logs.'
  },
  newArrivals: {
    title: 'Fresh Arrivals',
    description: 'The newest inclusions fresh from physical manufacturing.'
  },
  promoCards: [
    {
      id: 'promo-referral',
      accent: 'emerald',
      eyebrow: 'Early Subscriber Promotion',
      title: 'Refer a friend & capture 50 store points',
      description: 'Generate custom invite links inside your secure guest dashboard instantly.',
      buttonText: 'Access My Invitation URL',
      buttonUrl: '/dashboard'
    },
    {
      id: 'promo-flash',
      accent: 'amber',
      eyebrow: 'Seasonal Discount Vouchers',
      title: 'Deploy code FLASH20 at active checkout',
      description: 'Unlocks a flat 20% discount off AcousticLabs headphones, bags, and luxury items.',
      buttonText: 'Browse Active Flash Sales',
      buttonUrl: '/catalog'
    }
  ]
};

export const AdminPanel: React.FC = () => {
  const { user, token, products, categories, cancelOrder, triggerNotification, fetchHeaderConfig: fetchGlobalHeaderConfig, refreshAdminStores, authedFetch, fetchAvailableCarriers, createCarrierShipment, trackCarrierShipment } = useShop();
  const navigate = useNavigate();

  // Guard access. Only admin allowed
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (user && user.role !== 'admin') {
      triggerNotification('Access Denied', 'Sovereign credentials required to view this panel.', 'warning');
      navigate('/dashboard');
    }
  }, [user, token]);

  // Sidebar Tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'orders' | 'categories' | 'coupons' | 'customers' | 'hero' | 'notifications' | 'newsletter' | 'reports' | 'shipping' | 'tax' | 'email-templates' | 'customer-service' | 'timers' | 'warranties'>(() => {
    const savedTab = localStorage.getItem('admin_active_tab');
    return (savedTab as any) || 'analytics';
  });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    dashboard: true,
    store: false,
    orders: false,
    customers: true,
    marketing: false,
    operations: false,
    reports: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Backend state arrays fetched for Admin view
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminCoupons, setAdminCoupons] = useState<Coupon[]>([]);
  const [adminUsers, setAdminUsers] = useState<UserType[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [revenueHistory, setRevenueHistory] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [categorySummary, setCategorySummary] = useState<any[]>([]);
  const [growthTrends, setGrowthTrends] = useState<any>(null);
  const [recentAuditLogs, setRecentAuditLogs] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig | null>(null);
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterContent, setNewsletterContent] = useState('');
  const [isSendingNewsletter, setIsSendingNewsletter] = useState(false);
  const [newsletterSearch, setNewsletterSearch] = useState('');
  const [newsletterStatusFilter, setNewsletterStatusFilter] = useState<'all' | 'active' | 'unsubscribed'>('all');
  const [showAddSubscriber, setShowAddSubscriber] = useState(false);
  const [newSubscriberEmail, setNewSubscriberEmail] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewSubject, setPreviewSubject] = useState('');
  const [previewContent, setPreviewContent] = useState('');

  // Timer Management State
  const [timers, setTimers] = useState<TimerConfig[]>([]);
  const [showAddTimer, setShowAddTimer] = useState(false);
  const [editingTimer, setEditingTimer] = useState<TimerConfig | null>(null);
  const [timerName, setTimerName] = useState('');
  const [timerDescription, setTimerDescription] = useState('');
  const [timerDuration, setTimerDuration] = useState('24');
  const [timerIsActive, setTimerIsActive] = useState(true);
  const [timerApplicableProducts, setTimerApplicableProducts] = useState<string[]>([]);
  const [timerApplicableCategories, setTimerApplicableCategories] = useState<string[]>([]);
  const [timerStartDate, setTimerStartDate] = useState('');
  const [timerEndDate, setTimerEndDate] = useState('');
  const [timerTemplate, setTimerTemplate] = useState<'flash-sale' | 'limited-offer' | 'countdown-deal' | 'custom'>('flash-sale');
  const [timerCustomTitle, setTimerCustomTitle] = useState('');
  const [timerCustomSubtitle, setTimerCustomSubtitle] = useState('');
  const [timerCustomBgColor, setTimerCustomBgColor] = useState('#fef2f2');
  const [timerCustomTextColor, setTimerCustomTextColor] = useState('#991b1b');
  const [timerCustomAccentColor, setTimerCustomAccentColor] = useState('#dc2626');

  // Warranty Management State
  const [warranties, setWarranties] = useState<WarrantyConfig[]>([]);
  const [showAddWarranty, setShowAddWarranty] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState<WarrantyConfig | null>(null);
  const [warrantyName, setWarrantyName] = useState('');
  const [warrantyDescription, setWarrantyDescription] = useState('');
  const [warrantyDuration, setWarrantyDuration] = useState('12');
  const [warrantyCoverage, setWarrantyCoverage] = useState<string[]>(['Parts', 'Labor']);
  const [warrantyTerms, setWarrantyTerms] = useState('');
  const [warrantyIsActive, setWarrantyIsActive] = useState(true);
  const [warrantyApplicableProducts, setWarrantyApplicableProducts] = useState<string[]>([]);
  const [warrantyApplicableCategories, setWarrantyApplicableCategories] = useState<string[]>([]);
  const [warrantyTemplate, setWarrantyTemplate] = useState<'standard' | 'premium' | 'extended' | 'custom'>('standard');
  const [warrantyCustomTitle, setWarrantyCustomTitle] = useState('');
  const [warrantyCustomSubtitle, setWarrantyCustomSubtitle] = useState('');
  const [warrantyCustomIcon, setWarrantyCustomIcon] = useState('shield');
  const [warrantyCustomBgColor, setWarrantyCustomBgColor] = useState('#ecfdf5');
  const [warrantyCustomTextColor, setWarrantyCustomTextColor] = useState('#065f46');
  const [warrantyCustomAccentColor, setWarrantyCustomAccentColor] = useState('#059669');

  // Reports state
  const [reportType, setReportType] = useState<'sales' | 'inventory' | 'customers'>('sales');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [reportFormat, setReportFormat] = useState<'json' | 'csv' | 'excel'>('json');
  const [reportData, setReportData] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    category: 'all',
    status: 'all',
    paymentMethod: 'all',
    minAmount: '',
    maxAmount: ''
  });
  const [comparePeriod, setComparePeriod] = useState(false);
  const [compareData, setCompareData] = useState<any>(null);
  const [scheduleReport, setScheduleReport] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [scheduleEmail, setScheduleEmail] = useState('');

  // Shipping Management State
  const [shippingConfig, setShippingConfig] = useState<any>(null);
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingInfo, setTrackingInfo] = useState<any>(null);
  const [shippingTestAddress, setShippingTestAddress] = useState({
    city: 'Delhi',
    state: 'Delhi',
    zipCode: '110001',
    country: 'India'
  });
  const [shippingTestWeight, setShippingTestWeight] = useState('1');
  const [availableCarriers, setAvailableCarriers] = useState<any[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<string>('delhivery');
  const [loadingCarriers, setLoadingCarriers] = useState(false);

  // Tax Management State
  const [taxConfig, setTaxConfig] = useState<any>(null);
  const [taxTestAmount, setTaxTestAmount] = useState('1000');
  const [taxTestAddress, setTaxTestAddress] = useState({
    state: 'Delhi'
  });
  const [taxTestCategory, setTaxTestCategory] = useState('general');
  const [taxCalculationResult, setTaxCalculationResult] = useState<any>(null);
  const [stateValidation, setStateValidation] = useState<any>(null);

  const newsletterTemplates = [
    {
      id: 'promo',
      name: 'Promotional Sale',
      subject: '🔥 Exclusive Sale - Limited Time Only!',
      content: `Dear Subscriber,

We're excited to announce our exclusive sale happening now! Get up to 50% off on selected items across all categories.

✨ Highlights:
- Premium electronics at unbeatable prices
- Free shipping on orders over $50
- Extended return policy

Shop now and save big before the offer ends!

Best regards,
The ModernShop Team`
    },
    {
      id: 'new-arrival',
      name: 'New Arrivals',
      subject: '🆕 New Products Just Arrived!',
      content: `Dear Subscriber,

Check out our latest collection of new arrivals! We've added fresh products to our catalog just for you.

📦 What's New:
- Latest tech gadgets
- Trending fashion items
- Home essentials

Be the first to explore and shop the newest additions.

Happy shopping!
The ModernShop Team`
    },
    {
      id: 'seasonal',
      name: 'Seasonal Collection',
      subject: '🍂 Seasonal Collection - Shop Now',
      content: `Dear Subscriber,

Our seasonal collection is here! Discover curated products perfect for the season.

🌟 Seasonal Favorites:
- Cozy home decor
- Weather-ready apparel
- Seasonal accessories

Update your style with our handpicked selection.

Warm regards,
The ModernShop Team`
    },
    {
      id: 'custom',
      name: 'Custom Message',
      subject: '',
      content: ''
    }
  ];

  // Order filter state
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSortBy, setOrderSortBy] = useState<'date' | 'amount' | 'status'>('date');

  // Reset orders page when filters change
  useEffect(() => {
    setOrdersPage(1);
  }, [orderSearch, orderStatusFilter, orderSortBy]);

  // Product filter state
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productSortBy, setProductSortBy] = useState<'name' | 'price' | 'stock' | 'date'>('name');

  // Category filter state
  const [categorySearch, setCategorySearch] = useState('');

  // Reset products page when filters change
  useEffect(() => {
    setProductsPage(1);
  }, [productSearch, productCategoryFilter, productSortBy]);

  // Pagination state
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [productsPage, setProductsPage] = useState(1);
  const [productsPerPage] = useState(6);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [couponsPage, setCouponsPage] = useState(1);
  const [couponsPerPage] = useState(10);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [categoriesPerPage] = useState(6);
  const [notificationsPage, setNotificationsPage] = useState(1);
  const [notificationsPerPage] = useState(5);

  // Search and sort state for customers
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSortField, setUserSortField] = useState<'name' | 'loyaltyPoints' | 'role' | 'email' | 'createdAt' | 'totalSpent'>('name');
  const [userSortDirection, setUserSortDirection] = useState<'asc' | 'desc'>('asc');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'super-admin' | 'admin' | 'user'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [userDateFrom, setUserDateFrom] = useState('');
  const [userDateTo, setUserDateTo] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<UserType | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Forms state
  // 1. Create Product
  const [pName, setPName] = useState('');
  const [pBrand, setPBrand] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pDiscountPrice, setPDiscountPrice] = useState('');
  const [pCategory, setPCategory] = useState('');
  const [pStock, setPStock] = useState('20');
  const [pLowStockThreshold, setPLowStockThreshold] = useState('5');
  const [pDescription, setPDescription] = useState('');
  const [pImages, setPImages] = useState<string[]>(['']);
  const [pImagesColor, setPImagesColor] = useState<string>('');
  const [pColors, setPColors] = useState<string[]>(['']);
  const [pColorImages, setPColorImages] = useState<{ [key: string]: string[] }>({});
  const [pColorImageUrls, setPColorImageUrls] = useState<{ [key: string]: string }>({});
  const [pSizes, setPSizes] = useState<string[]>(['']);
  const [pInventory, setPInventory] = useState<{ [key: string]: number }>({});
  const [pSpecs, setPSpecs] = useState<{ label: string; value: string }[]>([{ label: '', value: '' }]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showVariantSection, setShowVariantSection] = useState(false);

  // Edit Product state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDiscountPrice, setEditDiscountPrice] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editLowStockThreshold, setEditLowStockThreshold] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImages, setEditImages] = useState<string[]>(['']);
  const [editImagesColor, setEditImagesColor] = useState<string>('');
  const [editColors, setEditColors] = useState<string[]>(['']);
  const [editColorImages, setEditColorImages] = useState<{ [key: string]: string[] }>({});
  const [editColorImageUrls, setEditColorImageUrls] = useState<{ [key: string]: string }>({});
  const [editSizes, setEditSizes] = useState<string[]>(['']);
  const [editInventory, setEditInventory] = useState<{ [key: string]: number }>({});
  const [editSpecs, setEditSpecs] = useState<{ label: string; value: string }[]>([{ label: '', value: '' }]);

  // 2. Create Category
  const [cName, setCName] = useState('');
  const [cDescription, setCDescription] = useState('');
  const [cImage, setCImage] = useState('');
  const [cImageFile, setCImageFile] = useState<File | null>(null);
  const [cImagePreview, setCImagePreview] = useState<string>('');
  const [cUploading, setCUploading] = useState(false);

  // 3. Create Coupon
  const [coCode, setCoCode] = useState('');
  const [coType, setCoType] = useState<'percentage' | 'fixed'>('percentage');
  const [coValue, setCoValue] = useState('');
  const [coMinCart, setCoMinCart] = useState('');
  const [coLimit, setCoLimit] = useState('');

  // 4. Header Config
  const [hcLogoText, setHcLogoText] = useState('');
  const [hcLogoIcon, setHcLogoIcon] = useState('');
  const [hcSearchPlaceholder, setHcSearchPlaceholder] = useState('');
  const [hcShowAIBadge, setHcShowAIBadge] = useState(true);
  const [hcAIBadgeText, setHcAIBadgeText] = useState('');
  const [hcBannerEnabled, setHcBannerEnabled] = useState(false);
  const [hcBannerText, setHcBannerText] = useState('');
  const [hcBannerBgColor, setHcBannerBgColor] = useState('#10b981');
  const [hcBannerTextColor, setHcBannerTextColor] = useState('#ffffff');
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [homeContent, setHomeContent] = useState<HomeContent>(DEFAULT_HOME_CONTENT);
  const [slideImageFiles, setSlideImageFiles] = useState<Record<number, File>>({});
  const [slideImagePreviews, setSlideImagePreviews] = useState<Record<number, string>>({});
  const [expandedHeroSlides, setExpandedHeroSlides] = useState<Record<string, boolean>>({});
  const [heroEditorTab, setHeroEditorTab] = useState<'sections' | 'promos' | 'products' | 'newsletter' | 'brands'>('sections');
  
  // Product selection for home page sections
  const [selectedFeaturedProducts, setSelectedFeaturedProducts] = useState<string[]>([]);
  const [selectedBestSellers, setSelectedBestSellers] = useState<string[]>([]);
  const [selectedNewArrivals, setSelectedNewArrivals] = useState<string[]>([]);
  const [heroProductSearch, setHeroProductSearch] = useState('');
  
  // Newsletter configuration
  const [newsletterEnabled, setNewsletterEnabled] = useState(true);
  const [newsletterTitle, setNewsletterTitle] = useState('Get Exclusive Deals');
  const [newsletterDescription, setNewsletterDescription] = useState('Subscribe to our newsletter and be the first to know about new arrivals, exclusive offers, and style tips.');
  
  // Brand showcase configuration
  const [brandShowcaseEnabled, setBrandShowcaseEnabled] = useState(true);
  const [brandNames, setBrandNames] = useState<string[]>(['ACOUSTICLABS', 'APEXSYS', 'FOLIAGE', 'AURASOLID', 'NORDENTAILORS']);
  const [newBrandName, setNewBrandName] = useState('');

  // 5. Notification Form
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'info' | 'success' | 'warning' | 'promotion'>('info');
  const [notifRecipient, setNotifRecipient] = useState<'broadcast' | 'specific'>('broadcast');
  const [notifUserId, setNotifUserId] = useState('');
  const [notifSendEmail, setNotifSendEmail] = useState(false);

  // 5. Product Image Upload
  const [pImageFiles, setPImageFiles] = useState<File[]>([]);
  const [pImagePreviews, setPImagePreviews] = useState<string[]>([]);
  const [pUploading, setUploading] = useState(false);

  const fetchNotificationHistory = async () => {
    try {
      const res = await fetch('/api/admin/notifications', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        console.error('Failed to fetch notification history:', res.status, res.statusText);
        return;
      }
      const data = await res.json();
      if (data.notifications && Array.isArray(data.notifications)) {
        setNotificationHistory(data.notifications);
      }
    } catch (e) {
      console.error('Error fetching notification history:', e);
    }
  };

  useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchAdminStats();
      fetchAdminOrders();
      fetchAdminCoupons();
      fetchAdminUsers();
      fetchHeaderConfig();
      fetchNotificationHistory();
      fetchNewsletters();
      fetchShippingConfig();
      fetchTaxConfig();
    }
  }, [token, user]);

  // Fetch shipping config when shipping tab is active
  useEffect(() => {
    if (activeTab === 'shipping' && token && user?.role === 'admin') {
      fetchShippingConfig();
      loadCarriers();
    }
  }, [activeTab, token, user]);

  const loadCarriers = async () => {
    setLoadingCarriers(true);
    try {
      const carriersData = await fetchAvailableCarriers();
      if (!carriersData.error && carriersData) {
        setAvailableCarriers(carriersData);
      }
    } catch (error) {
      console.error('Error fetching carriers:', error);
    } finally {
      setLoadingCarriers(false);
    }
  };

  // Fetch tax config when tax tab is active
  useEffect(() => {
    if (activeTab === 'tax' && token && user?.role === 'admin') {
      fetchTaxConfig();
    }
  }, [activeTab, token, user]);

  // Fetch email templates when email-templates tab is active
  useEffect(() => {
    if (activeTab === 'email-templates' && token && user?.role === 'admin') {
      fetchEmailTemplates();
    }
  }, [activeTab, token, user]);

  // Auto-refresh analytics every 30 seconds when on analytics tab
  useEffect(() => {
    if (activeTab === 'analytics' && token && user?.role === 'admin') {
      const interval = setInterval(() => {
        fetchAdminStats();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [activeTab, token, user]);

  // Save active tab to localStorage
  useEffect(() => {
    localStorage.setItem('admin_active_tab', activeTab);
  }, [activeTab]);

  const fetchAdminStats = async () => {
    try {
      console.log('Fetching admin analytics...');
      const res = await fetch('/api/admin/analytics', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      console.log('Analytics response:', data);

      // Handle response format: { data: { revenue: {...}, counts: {...} } }
      const metrics = data.data || data;

      if (metrics) {
        setAdminStats({
          revenue: metrics.revenue?.totalSales || metrics.totalSales || metrics.revenue || 0,
          netRevenue: metrics.revenue?.netRevenue || 0,
          totalTax: metrics.revenue?.totalTax || 0,
          totalShipping: metrics.revenue?.totalShipping || 0,
          refundSum: metrics.revenue?.refundSum || 0,
          ordersCount: metrics.counts?.ordersCount || metrics.ordersCount || 0,
          usersCount: metrics.counts?.customersCount || metrics.customersCount || metrics.usersCount || 0,
          productsCount: metrics.counts?.inventoryCount || metrics.inventoryCount || products.length,
          reviewsCount: metrics.counts?.reviewsCount || 0,
          auditLogsCount: metrics.counts?.auditLogsCount || 0
        });
        
        // Set additional analytics data
        if (metrics.revenueHistory) {
          setRevenueHistory(metrics.revenueHistory);
        } else if (adminOrders.length > 0) {
          const monthlyRevenue = generateMonthlyRevenueData(adminOrders);
          setRevenueHistory(monthlyRevenue);
        }
        
        if (metrics.topProducts) {
          setTopProducts(metrics.topProducts);
        }
        
        if (metrics.categorySummary) {
          setCategorySummary(metrics.categorySummary);
        }
        
        if (metrics.growthTrends) {
          setGrowthTrends(metrics.growthTrends);
        }
        
        if (metrics.recentAuditLogs) {
          setRecentAuditLogs(metrics.recentAuditLogs);
        }
        
        setLastUpdated(new Date());
      } else {
        console.error('No metrics in analytics response');
        // Set default metrics if API fails
        setAdminStats({
          revenue: 0,
          ordersCount: 0,
          usersCount: 0,
          productsCount: products.length
        });
      }
    } catch (e) {
      console.error('Error fetching admin stats:', e);
      // Set default metrics if API fails
      setAdminStats({
        revenue: 0,
        ordersCount: 0,
        usersCount: 0,
        productsCount: products.length
      });
    }
  };

  const generateMonthlyRevenueData = (orders: Order[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const monthlyData = months.map((month, index) => {
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate.getFullYear() === currentYear && orderDate.getMonth() === index;
      });
      const revenue = monthOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      return { month, revenue };
    });
    return monthlyData;
  };

  const fetchAdminOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        console.error('Failed to fetch orders:', res.status, res.statusText);
        return;
      }
      const data = await res.json();
      if (data.data?.orders && Array.isArray(data.data.orders)) {
        setAdminOrders(data.data.orders);
        const monthlyRevenue = generateMonthlyRevenueData(data.data.orders);
        setRevenueHistory(monthlyRevenue);
      } else if (data.orders && Array.isArray(data.orders)) {
        setAdminOrders(data.orders);
        const monthlyRevenue = generateMonthlyRevenueData(data.orders);
        setRevenueHistory(monthlyRevenue);
      } else if (data.data && Array.isArray(data.data)) {
        setAdminOrders(data.data);
        const monthlyRevenue = generateMonthlyRevenueData(data.data);
        setRevenueHistory(monthlyRevenue);
      } else {
        console.log('No orders found in response');
        setAdminOrders([]);
        setRevenueHistory([]);
      }
    } catch (e) {
      console.error('Error fetching admin orders:', e);
    }
  };

  const fetchAdminCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        console.error('Failed to fetch coupons:', res.status, res.statusText);
        return;
      }
      const data = await res.json();
      if (data.data?.coupons && Array.isArray(data.data.coupons)) setAdminCoupons(data.data.coupons);
      else if (data.coupons && Array.isArray(data.coupons)) setAdminCoupons(data.coupons);
      else console.error('Unexpected coupons response format:', data);
    } catch (e) {
      console.error('Error fetching coupons:', e);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        console.error('Failed to fetch users:', res.status, res.statusText);
        return;
      }
      const data = await res.json();
      if (data.data?.users && Array.isArray(data.data.users)) setAdminUsers(data.data.users);
      else if (data.users && Array.isArray(data.users)) setAdminUsers(data.users);
      else console.error('Unexpected users response format:', data);
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  const fetchNewsletters = async () => {
    try {
      const res = await fetch('/api/admin/newsletters', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        console.error('Failed to fetch newsletters:', res.status, res.statusText);
        return;
      }
      const data = await res.json();
      if (data.newsletters && Array.isArray(data.newsletters)) setNewsletters(data.newsletters);
      else console.error('Unexpected newsletters response format:', data);
    } catch (e) {
      console.error('Error fetching newsletters:', e);
    }
  };

  const deleteNewsletter = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/newsletters/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        triggerNotification('Delete Failed', 'Could not remove newsletter subscription.', 'error');
        return;
      }
      triggerNotification('Deleted', 'Newsletter subscription removed successfully.', 'success');
      fetchNewsletters();
    } catch (e) {
      triggerNotification('Delete Failed', 'Network error occurred.', 'error');
    }
  };

  const updateNewsletterStatus = async (id: string, status: 'active' | 'unsubscribed') => {
    try {
      const res = await fetch(`/api/admin/newsletters/${id}/status`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        triggerNotification('Update Failed', 'Could not update newsletter status.', 'error');
        return;
      }
      triggerNotification('Updated', 'Newsletter status updated successfully.', 'success');
      fetchNewsletters();
    } catch (e) {
      triggerNotification('Update Failed', 'Network error occurred.', 'error');
    }
  };

  const sendNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterSubject.trim() || !newsletterContent.trim()) {
      triggerNotification('Validation Error', 'Subject and content are required.', 'error');
      return;
    }

    const activeSubscribers = newsletters.filter(n => n.status === 'active');
    if (activeSubscribers.length === 0) {
      triggerNotification('No Subscribers', 'There are no active subscribers to send to.', 'warning');
      return;
    }

    setIsSendingNewsletter(true);
    try {
      const res = await fetch('/api/admin/newsletters/send', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          subject: newsletterSubject,
          content: newsletterContent
        })
      });

      const data = await res.json();
      if (!res.ok) {
        triggerNotification('Send Failed', data.error || 'Failed to send newsletter.', 'error');
        return;
      }

      triggerNotification('Newsletter Sent', `Successfully sent to ${data.sentCount} subscribers.`, 'success');
      setNewsletterSubject('');
      setNewsletterContent('');
    } catch (e) {
      triggerNotification('Send Failed', 'Network error occurred.', 'error');
    } finally {
      setIsSendingNewsletter(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = newsletterTemplates.find(t => t.id === templateId);
    if (template) {
      setNewsletterSubject(template.subject);
      setNewsletterContent(template.content);
    }
  };

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubscriberEmail.trim()) {
      triggerNotification('Validation Error', 'Email is required.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newSubscriberEmail)) {
      triggerNotification('Invalid Email', 'Please enter a valid email address.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/newsletters', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: newSubscriberEmail })
      });

      const data = await res.json();
      if (!res.ok) {
        triggerNotification('Add Failed', data.error || 'Failed to add subscriber.', 'error');
        return;
      }

      triggerNotification('Subscriber Added', `${newSubscriberEmail} has been added to the newsletter.`, 'success');
      setNewSubscriberEmail('');
      setShowAddSubscriber(false);
      fetchNewsletters();
    } catch (e) {
      triggerNotification('Add Failed', 'Network error occurred.', 'error');
    }
  };

  const handleExportSubscribers = () => {
    const headers = ['Email', 'Status', 'Subscribed At'];
    const csvContent = [
      headers.join(','),
      ...newsletters.map(n => 
        `${n.email},${n.status},${new Date(n.subscribedAt).toLocaleDateString()}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    triggerNotification('Export Successful', 'Subscriber list exported to CSV.', 'success');
  };

  // Timer Management Functions
  const resetTimerForm = () => {
    setTimerName('');
    setTimerDescription('');
    setTimerDuration('24');
    setTimerIsActive(true);
    setTimerApplicableProducts([]);
    setTimerApplicableCategories([]);
    setTimerStartDate('');
    setTimerEndDate('');
    setTimerTemplate('flash-sale');
    setTimerCustomTitle('');
    setTimerCustomSubtitle('');
    setTimerCustomBgColor('#fef2f2');
    setTimerCustomTextColor('#991b1b');
    setTimerCustomAccentColor('#dc2626');
  };

  const handleSaveTimer = async (e: React.FormEvent) => {
    e.preventDefault();

    const timerData: TimerConfig = {
      id: editingTimer?.id || `timer-${Date.now()}`,
      name: timerName,
      description: timerDescription,
      duration: parseInt(timerDuration),
      isActive: timerIsActive,
      applicableProducts: timerApplicableProducts.length > 0 ? timerApplicableProducts : undefined,
      applicableCategories: timerApplicableCategories.length > 0 ? timerApplicableCategories : undefined,
      startDate: timerStartDate || undefined,
      endDate: timerEndDate || undefined,
      template: timerTemplate,
      customTemplate: timerTemplate === 'custom' ? {
        title: timerCustomTitle,
        subtitle: timerCustomSubtitle,
        backgroundColor: timerCustomBgColor,
        textColor: timerCustomTextColor,
        accentColor: timerCustomAccentColor
      } : undefined,
      createdAt: editingTimer?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const url = editingTimer
        ? `/api/admin/timers/${editingTimer.id}`
        : '/api/admin/timers';
      const method = editingTimer ? 'PUT' : 'POST';

      const res = await authedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(timerData)
      });

      if (!res.ok) {
        throw new Error('Failed to save timer configuration');
      }

      const data = await res.json();

      if (editingTimer) {
        setTimers(prev => prev.map(t => t.id === editingTimer.id ? data.data || timerData : t));
        triggerNotification('Timer Updated', 'Timer configuration has been updated successfully.', 'success');
      } else {
        setTimers(prev => [...prev, data.data || timerData]);
        triggerNotification('Timer Created', 'New timer has been created successfully.', 'success');
      }

      setShowAddTimer(false);
      setEditingTimer(null);
      resetTimerForm();
    } catch (error) {
      console.error('Error saving timer:', error);
      triggerNotification('Error', 'Failed to save timer configuration.', 'error');
    }
  };

  // Warranty Management Functions
  const resetWarrantyForm = () => {
    setWarrantyName('');
    setWarrantyDescription('');
    setWarrantyDuration('12');
    setWarrantyCoverage(['Parts', 'Labor']);
    setWarrantyTerms('');
    setWarrantyIsActive(true);
    setWarrantyApplicableProducts([]);
    setWarrantyApplicableCategories([]);
    setWarrantyTemplate('standard');
    setWarrantyCustomTitle('');
    setWarrantyCustomSubtitle('');
    setWarrantyCustomIcon('shield');
    setWarrantyCustomBgColor('#ecfdf5');
    setWarrantyCustomTextColor('#065f46');
    setWarrantyCustomAccentColor('#059669');
  };

  const handleSaveWarranty = async (e: React.FormEvent) => {
    e.preventDefault();

    const warrantyData: WarrantyConfig = {
      id: editingWarranty?.id || `warranty-${Date.now()}`,
      name: warrantyName,
      description: warrantyDescription,
      duration: parseInt(warrantyDuration),
      coverage: warrantyCoverage,
      terms: warrantyTerms,
      isActive: warrantyIsActive,
      applicableProducts: warrantyApplicableProducts.length > 0 ? warrantyApplicableProducts : undefined,
      applicableCategories: warrantyApplicableCategories.length > 0 ? warrantyApplicableCategories : undefined,
      template: warrantyTemplate,
      customTemplate: warrantyTemplate === 'custom' ? {
        title: warrantyCustomTitle,
        subtitle: warrantyCustomSubtitle,
        icon: warrantyCustomIcon,
        backgroundColor: warrantyCustomBgColor,
        textColor: warrantyCustomTextColor,
        accentColor: warrantyCustomAccentColor
      } : undefined,
      createdAt: editingWarranty?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const url = editingWarranty
        ? `/api/admin/warranties/${editingWarranty.id}`
        : '/api/admin/warranties';
      const method = editingWarranty ? 'PUT' : 'POST';

      const res = await authedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(warrantyData)
      });

      if (!res.ok) {
        throw new Error('Failed to save warranty configuration');
      }

      const data = await res.json();

      if (editingWarranty) {
        setWarranties(prev => prev.map(w => w.id === editingWarranty.id ? data.data || warrantyData : w));
        triggerNotification('Warranty Updated', 'Warranty configuration has been updated successfully.', 'success');
      } else {
        setWarranties(prev => [...prev, data.data || warrantyData]);
        triggerNotification('Warranty Created', 'New warranty has been created successfully.', 'success');
      }

      setShowAddWarranty(false);
      setEditingWarranty(null);
      resetWarrantyForm();
    } catch (error) {
      console.error('Error saving warranty:', error);
      triggerNotification('Error', 'Failed to save warranty configuration.', 'error');
    }
  };

  // Shipping Management Functions
  const fetchShippingConfig = async () => {
    try {
      const res = await authedFetch('/api/admin/shipping/config');
      const data = await res.json();
      if (data.success) {
        setShippingConfig(data.data);
      }
    } catch (e) {
      console.error('Error fetching shipping config:', e);
    }
  };

  const updateShippingConfig = async () => {
    try {
      const res = await authedFetch('/api/admin/shipping/config', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(shippingConfig)
      });
      const data = await res.json();
      if (data.success) {
        triggerNotification('Success', 'Shipping configuration updated successfully.', 'success');
        fetchShippingConfig();
      } else {
        triggerNotification('Error', data.error || 'Failed to update shipping configuration.', 'error');
      }
    } catch (e) {
      triggerNotification('Error', 'Network error occurred.', 'error');
    }
  };

  const calculateShippingRates = async () => {
    try {
      const res = await authedFetch('/api/admin/shipping/rates', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          destinationAddress: shippingTestAddress,
          packageDetails: { weight: parseFloat(shippingTestWeight) }
        })
      });
      const data = await res.json();
      if (data.success) {
        setShippingRates(data.data.rates);
        triggerNotification('Success', 'Shipping rates calculated successfully.', 'success');
      } else {
        triggerNotification('Error', data.error || 'Failed to calculate shipping rates.', 'error');
      }
    } catch (e) {
      triggerNotification('Error', 'Network error occurred.', 'error');
    }
  };

  const fetchTrackingInfo = async () => {
    try {
      const res = await authedFetch(`/api/admin/shipping/track/${trackingNumber}`);
      const data = await res.json();
      if (data.success) {
        setTrackingInfo(data.data);
        triggerNotification('Success', 'Tracking information retrieved.', 'success');
      } else {
        triggerNotification('Error', data.error || 'Failed to fetch tracking information.', 'error');
      }
    } catch (e) {
      triggerNotification('Error', 'Network error occurred.', 'error');
    }
  };

  // Tax Management Functions
  const fetchTaxConfig = async () => {
    try {
      const res = await authedFetch('/api/admin/tax/config');
      const data = await res.json();
      if (data.success) {
        setTaxConfig(data.data);
      }
    } catch (e) {
      console.error('Error fetching tax config:', e);
    }
  };

  const updateTaxConfig = async () => {
    try {
      const res = await authedFetch('/api/admin/tax/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taxConfig)
      });
      const data = await res.json();
      if (data.success) {
        triggerNotification('Success', 'Tax configuration updated successfully.', 'success');
        fetchTaxConfig();
      } else {
        triggerNotification('Error', data.error || 'Failed to update tax configuration.', 'error');
      }
    } catch (e) {
      triggerNotification('Error', 'Network error occurred.', 'error');
    }
  };

  const calculateTax = async () => {
    try {
      const res = await authedFetch('/api/admin/tax/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(taxTestAmount),
          customerAddress: taxTestAddress,
          productCategory: taxTestCategory
        })
      });
      const data = await res.json();
      if (data.success) {
        setTaxCalculationResult(data.data.taxCalculation);
        triggerNotification('Success', 'Tax calculated successfully.', 'success');
      } else {
        triggerNotification('Error', data.error || 'Failed to calculate tax.', 'error');
      }
    } catch (e) {
      triggerNotification('Error', 'Network error occurred.', 'error');
    }
  };

  const validateState = async () => {
    try {
      const res = await authedFetch('/api/admin/tax/validate-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ state: taxTestAddress.state })
      });
      const data = await res.json();
      if (data.success) {
        setStateValidation(data.data);
        triggerNotification('Success', 'State validated successfully.', 'success');
      } else {
        triggerNotification('Error', data.error || 'Failed to validate state.', 'error');
      }
    } catch (e) {
      triggerNotification('Error', 'Network error occurred.', 'error');
    }
  };

  // Email Template Management Functions
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<any>(null);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const fetchEmailTemplates = async () => {
    try {
      const res = await authedFetch('/api/admin/email-templates');
      const data = await res.json();
      if (data.success) {
        setEmailTemplates(data.data.emailTemplates);
      }
    } catch (e) {
      console.error('Error fetching email templates:', e);
    }
  };

  const updateEmailTemplate = async (templateId: string, updates: any) => {
    try {
      const res = await authedFetch(`/api/admin/email-templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        triggerNotification('Success', 'Email template updated successfully.', 'success');
        fetchEmailTemplates();
        setShowTemplateEditor(false);
      } else {
        triggerNotification('Error', data.error || 'Failed to update email template.', 'error');
      }
    } catch (e) {
      triggerNotification('Error', 'Network error occurred.', 'error');
    }
  };

  const createEmailTemplate = async (templateData: any) => {
    try {
      const res = await authedFetch('/api/admin/email-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateData)
      });
      const data = await res.json();
      if (data.success) {
        triggerNotification('Success', 'Email template created successfully.', 'success');
        fetchEmailTemplates();
        setShowTemplateEditor(false);
      } else {
        triggerNotification('Error', data.error || 'Failed to create email template.', 'error');
      }
    } catch (e) {
      triggerNotification('Error', 'Network error occurred.', 'error');
    }
  };

  const deleteEmailTemplate = async (templateId: string) => {
    try {
      const res = await authedFetch(`/api/admin/email-templates/${templateId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        triggerNotification('Success', 'Email template deleted successfully.', 'success');
        fetchEmailTemplates();
      } else {
        triggerNotification('Error', data.error || 'Failed to delete email template.', 'error');
      }
    } catch (e) {
      triggerNotification('Error', 'Network error occurred.', 'error');
    }
  };

  const previewEmailTemplate = async (templateId: string, variables: any) => {
    try {
      const res = await authedFetch('/api/admin/email-templates/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templateId, variables })
      });
      const data = await res.json();
      if (data.success) {
        setPreviewData(data.data);
        setShowTemplatePreview(true);
      } else {
        triggerNotification('Error', data.error || 'Failed to preview email template.', 'error');
      }
    } catch (e) {
      triggerNotification('Error', 'Network error occurred.', 'error');
    }
  };

  // Report generation functions
  const generateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const endpoint = reportType === 'sales' ? '/api/reports/sales' : 
                      reportType === 'inventory' ? '/api/reports/inventory' : 
                      '/api/reports/customers';
      
      const res = await fetch(`${endpoint}?range=${dateRange}&format=${reportFormat}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (reportFormat === 'csv') {
        // Handle CSV download
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report_${dateRange}_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        triggerNotification('Report Downloaded', 'CSV file has been downloaded.', 'success');
      } else if (reportFormat === 'excel') {
        // Handle Excel download (using CSV with .xlsx extension for now)
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report_${dateRange}_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        triggerNotification('Report Downloaded', 'Excel file has been downloaded.', 'success');
      } else {
        // Handle JSON response
        const data = await res.json();
        if (data.data) {
          setReportData(data.data);
          triggerNotification('Report Generated', `${data.data.reportType} generated successfully.`, 'success');
        }
      }
    } catch (e) {
      console.error(e);
      triggerNotification('Report Error', 'Failed to generate report.', 'warning');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const downloadCSV = (data: any) => {
    const dataArray = data.orders || data.products || data.customers;
    if (!dataArray || dataArray.length === 0) return;
    
    const headers = Object.keys(dataArray[0]);
    const csvRows = [];
    
    csvRows.push(headers.join(','));
    
    for (const row of dataArray) {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        const stringValue = String(value);
        return stringValue.includes(',') || stringValue.includes('"') 
          ? `"${stringValue.replace(/"/g, '""')}"` 
          : stringValue;
      });
      csvRows.push(values.join(','));
    }
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${dateRange}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handlePreviewNewsletter = () => {
    setPreviewSubject(newsletterSubject);
    setPreviewContent(newsletterContent);
    setShowPreview(true);
  };

  const fetchHeaderConfig = async () => {
    try {
      const res = await fetch('/api/public/header-config');
      if (!res.ok) {
        console.error('Failed to fetch header config:', res.status, res.statusText);
        return;
      }

      const contentType = res.headers.get('content-type');
      let data;

      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Unexpected content type:', contentType, '- attempting to parse as text');
        const text = await res.text();
        console.warn('Response text:', text);
        return;
      }

      data = await res.json();
      if (data.data) {
        setHeaderConfig(data.data);
        setHcLogoText(data.data.logoText || '');
        setHcLogoIcon(data.data.logoIcon || '');
        setHcSearchPlaceholder(data.data.searchPlaceholder || '');
        setHcShowAIBadge(data.data.showAIBadge !== undefined ? data.data.showAIBadge : true);
        setHcAIBadgeText(data.data.aiBadgeText || '');
        setHcBannerEnabled(data.data.announcementBanner?.enabled || false);
        setHcBannerText(data.data.announcementBanner?.text || '');
        setHcBannerBgColor(data.data.announcementBanner?.backgroundColor || '#10b981');
        setHcBannerTextColor(data.data.announcementBanner?.textColor || '#ffffff');
        setHeroSlides(data.data.heroSlides || []);
        const loadedHomeContent = {
          ...DEFAULT_HOME_CONTENT,
          ...(data.data.homeContent || {}),
          promoCards: data.data.homeContent?.promoCards?.length ? data.data.homeContent.promoCards : DEFAULT_HOME_CONTENT.promoCards
        };
        setHomeContent(loadedHomeContent);
        
        // Load product selections
        setSelectedFeaturedProducts(loadedHomeContent.featuredProductIds || []);
        setSelectedBestSellers(loadedHomeContent.bestSellerProductIds || []);
        setSelectedNewArrivals(loadedHomeContent.newArrivalProductIds || []);
        
        // Load newsletter config
        setNewsletterEnabled(loadedHomeContent.newsletter?.enabled ?? true);
        setNewsletterTitle(loadedHomeContent.newsletter?.title || 'Get Exclusive Deals');
        setNewsletterDescription(loadedHomeContent.newsletter?.description || 'Subscribe to our newsletter and be the first to know about new arrivals, exclusive offers, and style tips.');
        
        // Load brand showcase config
        setBrandShowcaseEnabled(loadedHomeContent.brandShowcase?.enabled ?? true);
        setBrandNames(loadedHomeContent.brandShowcase?.brands || ['ACOUSTICLABS', 'APEXSYS', 'FOLIAGE', 'AURASOLID', 'NORDENTAILORS']);
      }
    } catch (e) {
      console.error('Error fetching header config:', e);
    }
  };

  // Mutators
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.order) {
        triggerNotification('Status Updated', `Order state updated successfully to "${status}"`, 'success');
        fetchAdminOrders();
        fetchAdminStats(); // refresh graphs
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter and sort orders
  const filteredOrders = adminOrders
    .filter(ord => {
      const matchesSearch = orderSearch === '' ||
        ord.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
        ord.shippingAddress?.city?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        ord.shippingAddress?.street?.toLowerCase().includes(orderSearch.toLowerCase());
      const matchesStatus = orderStatusFilter === 'all' || ord.status === orderStatusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (orderSortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (orderSortBy === 'amount') {
        return b.totalAmount - a.totalAmount;
      } else if (orderSortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

  // Pagination for orders
  const ordersTotalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = filteredOrders.slice((ordersPage - 1) * ordersPerPage, ordersPage * ordersPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Shipped': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return '⏳';
      case 'Processing': return '⚙️';
      case 'Shipped': return '🚚';
      case 'Delivered': return '✅';
      case 'Cancelled': return '❌';
      default: return '📦';
    }
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(p => {
      const matchesSearch = productSearch === '' ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory = productCategoryFilter === 'all' || p.category === productCategoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (productSortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (productSortBy === 'price') {
        return (a.discountPrice || a.price) - (b.discountPrice || b.price);
      } else if (productSortBy === 'stock') {
        return a.stock - b.stock;
      }
      return 0;
    });

  // Pagination for products
  const productsTotalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = filteredProducts.slice((productsPage - 1) * productsPerPage, productsPage * productsPerPage);
  const homepageSelectableProducts = products.filter(product => {
    const search = heroProductSearch.trim().toLowerCase();
    if (!search) return true;

    return (
      product.name.toLowerCase().includes(search) ||
      product.brand.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search)
    );
  });
  const homeSectionMeta = {
    trending: {
      name: 'Trending section',
      purpose: 'Shown above the trending products area on the homepage.',
      titlePlaceholder: 'Trending right now',
      descriptionPlaceholder: 'A short line that tells shoppers what they will see here.'
    },
    featured: {
      name: 'Featured section',
      purpose: 'Shown above your featured products area.',
      titlePlaceholder: 'Featured picks',
      descriptionPlaceholder: 'Briefly explain why these products are highlighted.'
    },
    bestSellers: {
      name: 'Best sellers section',
      purpose: 'Shown above the best-selling products area.',
      titlePlaceholder: 'Customer favorites',
      descriptionPlaceholder: 'Use a short sentence about top-selling items.'
    },
    newArrivals: {
      name: 'New arrivals section',
      purpose: 'Shown above newly added products on the homepage.',
      titlePlaceholder: 'Just arrived',
      descriptionPlaceholder: 'Tell shoppers these are the latest additions.'
    }
  } as const;
  const readyHeroSlidesCount = heroSlides.filter(slide => slide.image.trim() && slide.title.trim()).length;
  const completedSectionCopyCount = (Object.keys(homeSectionMeta) as Array<keyof typeof homeSectionMeta>).filter(
    section => homeContent[section].title.trim() && homeContent[section].description.trim()
  ).length;
  const completedPromoCardsCount = homeContent.promoCards.slice(0, 2).filter(
    card => card.eyebrow.trim() && card.title.trim() && card.description.trim() && card.buttonText.trim() && card.buttonUrl.trim()
  ).length;
  const heroWorkspaceSummary = [
    {
      id: 'slides',
      label: 'Slides ready',
      value: `${readyHeroSlidesCount}/${heroSlides.length || 0}`,
      done: heroSlides.length > 0 && readyHeroSlidesCount === heroSlides.length
    },
    {
      id: 'sections',
      label: 'Section copy',
      value: `${completedSectionCopyCount}/4`,
      done: completedSectionCopyCount === 4
    },
    {
      id: 'promos',
      label: 'Promo cards',
      value: `${completedPromoCardsCount}/2`,
      done: completedPromoCardsCount === 2
    },
    {
      id: 'newsletter',
      label: 'Newsletter',
      value: newsletterEnabled ? (newsletterTitle.trim() && newsletterDescription.trim() ? 'Ready' : 'Needs copy') : 'Hidden',
      done: !newsletterEnabled || Boolean(newsletterTitle.trim() && newsletterDescription.trim())
    },
    {
      id: 'brands',
      label: 'Brand showcase',
      value: brandShowcaseEnabled ? `${brandNames.length} brands` : 'Hidden',
      done: !brandShowcaseEnabled || brandNames.length > 0
    }
  ];

  // Filter and sort users
  const filteredUsers = adminUsers
    .filter(u => {
      const matchesSearch = userSearchQuery === '' ||
        u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.referralCode.toLowerCase().includes(userSearchQuery.toLowerCase());
      
      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      
      const matchesStatus = userStatusFilter === 'all' || 
        (userStatusFilter === 'active' && u.isActive !== false) ||
        (userStatusFilter === 'inactive' && u.isActive === false);
      
      let matchesDateRange = true;
      if (userDateFrom && u.createdAt) {
        matchesDateRange = matchesDateRange && new Date(u.createdAt) >= new Date(userDateFrom);
      }
      if (userDateTo && u.createdAt) {
        matchesDateRange = matchesDateRange && new Date(u.createdAt) <= new Date(userDateTo);
      }
      
      return matchesSearch && matchesRole && matchesStatus && matchesDateRange;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (userSortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (userSortField === 'loyaltyPoints') {
        comparison = (a.loyaltyPoints || 0) - (b.loyaltyPoints || 0);
      } else if (userSortField === 'role') {
        comparison = a.role.localeCompare(b.role);
      } else if (userSortField === 'email') {
        comparison = a.email.localeCompare(b.email);
      } else if (userSortField === 'createdAt') {
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      } else if (userSortField === 'totalSpent') {
        comparison = (a.totalSpent || 0) - (b.totalSpent || 0);
      }
      return userSortDirection === 'desc' ? -comparison : comparison;
    });

  // Pagination for users
  const usersTotalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice((usersPage - 1) * usersPerPage, usersPage * usersPerPage);

  // Pagination for coupons
  const couponsTotalPages = Math.ceil(adminCoupons.length / couponsPerPage);
  const paginatedCoupons = adminCoupons.slice((couponsPage - 1) * couponsPerPage, couponsPage * couponsPerPage);

  // Filter and paginate categories
  const filteredCategories = categories.filter(cat =>
    categorySearch === '' ||
    cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
    cat.description.toLowerCase().includes(categorySearch.toLowerCase())
  );
  const categoriesTotalPages = Math.ceil(filteredCategories.length / categoriesPerPage);
  const paginatedCategories = filteredCategories.slice((categoriesPage - 1) * categoriesPerPage, categoriesPage * categoriesPerPage);

  // Pagination for notification history
  const sortedNotifications = notificationHistory.slice().reverse();
  const notificationsTotalPages = Math.ceil(sortedNotifications.length / notificationsPerPage);
  const paginatedNotifications = sortedNotifications.slice(
    (notificationsPage - 1) * notificationsPerPage,
    notificationsPage * notificationsPerPage
  );

  const getStockLevel = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700 border-red-200', icon: '🚫' };
    if (stock <= 5) return { label: 'Low Stock', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '⚠️' };
    if (stock <= 20) return { label: 'Medium Stock', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '📊' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-700 border-green-200', icon: '✅' };
  };

  const normalizeStringList = (values: string[]) => values.map(value => value.trim()).filter(Boolean);

  const extractColorOptions = (variants: Product['variants'] = []) => {
    const colorVariant = variants.find(variant => /color/i.test(variant.name));
    return colorVariant?.options?.length ? colorVariant.options : [''];
  };

  const extractColorImages = (variants: Product['variants'] = []) => {
    const colorVariant = variants.find(variant => /color/i.test(variant.name));
    return colorVariant?.images || {};
  };

  const extractSizeOptions = (variants: Product['variants'] = []) => {
    const sizeVariant = variants.find(variant => /size/i.test(variant.name));
    return sizeVariant?.options?.length ? sizeVariant.options : [''];
  };

  const extractInventory = (inventory: Product['inventory'] = {}) => {
    return inventory || {};
  };

  const withColorVariant = (variants: Product['variants'] = [], colors: string[], colorImages: { [key: string]: string[] } = {}) => {
    const normalizedColors = normalizeStringList(colors);
    const nonColorVariants = variants.filter(variant => !/color/i.test(variant.name));
    if (normalizedColors.length === 0) {
      return nonColorVariants;
    }

    const colorVariantImages: { [key: string]: string[] } = {};
    normalizedColors.forEach(color => {
      if (colorImages[color]) {
        colorVariantImages[color] = colorImages[color];
      }
    });

    return [
      ...nonColorVariants,
      { name: 'Color', options: normalizedColors, images: colorVariantImages }
    ];
  };

  const withSizeVariant = (variants: Product['variants'] = [], sizes: string[]) => {
    const normalizedSizes = normalizeStringList(sizes);
    const nonSizeVariants = variants.filter(variant => !/size/i.test(variant.name));
    if (normalizedSizes.length === 0) {
      return nonSizeVariants;
    }

    return [
      ...nonSizeVariants,
      { name: 'Size', options: normalizedSizes }
    ];
  };

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Previous
        </button>
        {pages.map((page, idx) => (
          typeof page === 'number' ? (
            <button
              key={idx}
              onClick={() => onPageChange(page)}
              className={`px-3 py-2 rounded-lg border text-xs font-semibold ${currentPage === page
                  ? 'bg-black text-white border-black'
                  : 'border-gray-200 hover:bg-gray-50'
                }`}
            >
              {page}
            </button>
          ) : (
            <span key={idx} className="px-2 text-gray-400">...</span>
          )
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    );
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !pCategory || !pPrice) {
      triggerNotification('Missing Fields', 'Please fulfill core specifications fields.', 'warning');
      return;
    }

    try {
      let imageUrls = normalizeStringList(pImages);

      // Upload images if files are selected
      if (pImageFiles.length > 0) {
        setUploading(true);
        const formData = new FormData();
        pImageFiles.forEach((file) => formData.append('images', file));
        formData.append('folder', 'products');

        try {
          const uploadRes = await fetch('/api/upload/multiple', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
          });
          const uploadData = await uploadRes.json();
          if (Array.isArray(uploadData.images)) {
            imageUrls = [
              ...uploadData.images.map((image: { url: string }) => image.url).filter(Boolean),
              ...imageUrls
            ];
          }
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
          triggerNotification('Upload Failed', 'Some product images could not be uploaded.', 'warning');
        }
        setUploading(false);
      }

      // Upload color images if they contain base64 data
      const uploadedColorImages: { [key: string]: string[] } = {};
      for (const color of Object.keys(pColorImages)) {
        const colorImgs = pColorImages[color];
        const uploadedUrls: string[] = [];
        
        for (const img of colorImgs) {
          // Check if it's a base64 data URL
          if (img.startsWith('data:')) {
            try {
              // Convert base64 to blob and upload
              const response = await fetch(img);
              const blob = await response.blob();
              const formData = new FormData();
              formData.append('images', blob, `${color}-${Date.now()}.jpg`);
              formData.append('folder', 'products');
              
              const uploadRes = await fetch('/api/upload/multiple', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
              });
              const uploadData = await uploadRes.json();
              if (Array.isArray(uploadData.images) && uploadData.images[0]?.url) {
                uploadedUrls.push(uploadData.images[0].url);
              } else {
                // Fallback to original URL if upload fails
                uploadedUrls.push(img);
              }
            } catch (err) {
              console.error('Color image upload failed:', err);
              uploadedUrls.push(img); // Fallback to original
            }
          } else {
            // It's already a URL, use as-is
            uploadedUrls.push(img);
          }
        }
        
        if (uploadedUrls.length > 0) {
          uploadedColorImages[color] = uploadedUrls;
        }
      }

      // If main images have a color selected, add them to color images instead
      if (pImagesColor && pImagesColor.trim() !== '') {
        uploadedColorImages[pImagesColor] = [
          ...(uploadedColorImages[pImagesColor] || []),
          ...imageUrls
        ];
        // Clear main images since they're now in color images
        imageUrls = [];
      }

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: pName,
          brand: pBrand,
          price: parseFloat(pPrice),
          discountPrice: pDiscountPrice ? parseFloat(pDiscountPrice) : undefined,
          category: pCategory,
          stock: parseInt(pStock),
          lowStockThreshold: parseInt(pLowStockThreshold),
          description: pDescription,
          images: imageUrls,
          variants: withSizeVariant(withColorVariant([], pColors, uploadedColorImages), pSizes),
          inventory: pInventory,
          specifications: pSpecs.filter(s => s.label.trim() !== '')
        })
      });
      const data = await res.json();
      console.log('[CREATE PRODUCT RESPONSE]', data);
      if (data.data) {
        triggerNotification('Product Discovered', `Appended "${pName}" to catalogs databases!`, 'success');
        // Reset Form
        setPName(''); setPBrand(''); setPPrice(''); setPDiscountPrice(''); setPDescription('');
        setPColors(['']);
        setPColorImages({});
        setPSizes(['']);
        setPInventory({});
        setPImages(['']); setPSpecs([{ label: '', value: '' }]);
        setPImageFiles([]);
        setPImagePreviews([]);
        setPImagesColor('');
        fetchAdminStats();
        await refreshAdminStores();
        // Reset category filter to show all products including the new one
        setProductCategoryFilter('all');
      } else {
        console.error('[CREATE PRODUCT ERROR]', data);
        triggerNotification('Creation Failed', data.message || 'Failed to create product.', 'error');
      }
    } catch (err) {
      console.error('[CREATE PRODUCT CATCH]', err);
      triggerNotification('Network Error', 'Failed to connect to server.', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        triggerNotification('Product Deleted', 'Catalogs items unregistered successfully.', 'info');
        fetchAdminStats();
        refreshAdminStores();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.message) {
        triggerNotification('Category Deleted', 'Collection removed successfully.', 'info');
        fetchAdminStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleCoupon = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Toggle coupon error:', res.status, errorText);
        triggerNotification('Error', `Failed to toggle coupon: ${res.status}`, 'error');
        return;
      }

      const data = await res.json();
      if (data.success) {
        triggerNotification('Coupon Status Updated', 'Coupon status has been toggled successfully.', 'success');
        fetchAdminCoupons();
      }
    } catch (e) {
      console.error(e);
      triggerNotification('Error', 'Failed to toggle coupon. Please try again.', 'error');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditBrand(product.brand);
    setEditPrice(product.price.toString());
    setEditDiscountPrice(product.discountPrice?.toString() || '');
    setEditCategory(product.category);
    setEditStock(product.stock.toString());
    setEditLowStockThreshold((product.lowStockThreshold || 5).toString());
    setEditDescription(product.description);
    setEditImages(product.images.length > 0 ? product.images : ['']);
    setEditImagesColor(''); // Reset color selection
    setEditColors(extractColorOptions(product.variants));
    setEditColorImages(extractColorImages(product.variants));
    setEditSizes(extractSizeOptions(product.variants));
    setEditInventory(extractInventory(product.inventory));
    setEditSpecs(product.specifications || [{ label: '', value: '' }]);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      // Upload color images if they contain base64 data
      const uploadedColorImages: { [key: string]: string[] } = {};
      for (const color of Object.keys(editColorImages)) {
        const colorImgs = editColorImages[color];
        const uploadedUrls: string[] = [];
        
        for (const img of colorImgs) {
          // Check if it's a base64 data URL
          if (img.startsWith('data:')) {
            try {
              // Convert base64 to blob and upload
              const response = await fetch(img);
              const blob = await response.blob();
              const formData = new FormData();
              formData.append('images', blob, `${color}-${Date.now()}.jpg`);
              formData.append('folder', 'products');
              
              const uploadRes = await fetch('/api/upload/multiple', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
              });
              const uploadData = await uploadRes.json();
              if (Array.isArray(uploadData.images) && uploadData.images[0]?.url) {
                uploadedUrls.push(uploadData.images[0].url);
              } else {
                // Fallback to original URL if upload fails
                uploadedUrls.push(img);
              }
            } catch (err) {
              console.error('Color image upload failed:', err);
              uploadedUrls.push(img); // Fallback to original
            }
          } else {
            // It's already a URL, use as-is
            uploadedUrls.push(img);
          }
        }
        
        if (uploadedUrls.length > 0) {
          uploadedColorImages[color] = uploadedUrls;
        }
      }

      // If main images have a color selected, add them to color images instead
      const filteredEditImages = editImages.filter(img => img.trim() !== '');
      if (editImagesColor && editImagesColor.trim() !== '') {
        uploadedColorImages[editImagesColor] = [
          ...(uploadedColorImages[editImagesColor] || []),
          ...filteredEditImages
        ];
        // Clear main images since they're now in color images
        filteredEditImages.length = 0;
      }

      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: editName,
          brand: editBrand,
          price: parseFloat(editPrice),
          discountPrice: editDiscountPrice ? parseFloat(editDiscountPrice) : undefined,
          category: editCategory,
          stock: parseInt(editStock),
          lowStockThreshold: parseInt(editLowStockThreshold) || 5,
          description: editDescription,
          images: filteredEditImages,
          variants: withSizeVariant(withColorVariant(editingProduct.variants || [], editColors, uploadedColorImages), editSizes),
          inventory: editInventory,
          specifications: editSpecs.filter(s => s.label.trim() !== '')
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerNotification('Product Updated', `Product "${editName}" has been updated successfully.`, 'success');
        setEditingProduct(null);
        fetchAdminStats();
        refreshAdminStores();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = cImage;

      // Upload image if file is selected
      if (cImageFile) {
        setCUploading(true);
        const formData = new FormData();
        formData.append('images', cImageFile);
        formData.append('folder', 'categories');

        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
          });
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            imageUrl = uploadData.url;
          }
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
          triggerNotification('Upload Failed', 'Category image could not be uploaded.', 'warning');
          setCUploading(false);
          return;
        }
        setCUploading(false);
      }

      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: cName, description: cDescription, image: imageUrl })
      });
      const data = await res.json();
      if (data.category) {
        triggerNotification('Category Saved', `Department "${cName}" spawned.`, 'success');
        setCName(''); setCDescription(''); setCImage('');
        setCImageFile(null); setCImagePreview('');
        await refreshAdminStores();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          code: coCode.toUpperCase(),
          type: coType,
          value: parseFloat(coValue),
          minCartValue: coMinCart ? parseFloat(coMinCart) : 0,
          usageLimit: coLimit ? parseInt(coLimit) : 100
        })
      });
      const data = await res.json();
      if (data.coupon) {
        triggerNotification('Coupon Spawned', `Code "${data.coupon.code}" is now live and valid.`, 'success');
        setCoCode(''); setCoValue(''); setCoMinCart(''); setCoLimit('');
        fetchAdminCoupons();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateHeroConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Upload images if files are selected
      const updatedSlides = await Promise.all(heroSlides.map(async (slide, idx) => {
        let imageUrl = slide.image;

        if (slideImageFiles[idx]) {
          const formData = new FormData();
          formData.append('file', slideImageFiles[idx]);

          try {
            const uploadRes = await fetch('/api/upload', {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: formData
            });
            const uploadData = await uploadRes.json();
            if (uploadData.url) {
              imageUrl = uploadData.url;
            }
          } catch (uploadErr) {
            console.error('Image upload failed:', uploadErr);
            triggerNotification('Upload Failed', `Failed to upload slide ${idx + 1} image.`, 'warning');
          }
        }

        return {
          ...slide,
          image: imageUrl
        };
      }));

      const res = await fetch('/api/admin/header-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          logoText: headerConfig?.logoText || hcLogoText || 'ModernShop',
          logoIcon: headerConfig?.logoIcon || hcLogoIcon || 'M',
          searchPlaceholder: headerConfig?.searchPlaceholder || hcSearchPlaceholder || 'Search products, brands, categories...',
          showAIBadge: headerConfig?.showAIBadge ?? hcShowAIBadge,
          aiBadgeText: headerConfig?.aiBadgeText || hcAIBadgeText || 'AI Recommendations',
          announcementBanner: {
            enabled: headerConfig?.announcementBanner?.enabled ?? hcBannerEnabled,
            text: headerConfig?.announcementBanner?.text || hcBannerText,
            backgroundColor: headerConfig?.announcementBanner?.backgroundColor || hcBannerBgColor,
            textColor: headerConfig?.announcementBanner?.textColor || hcBannerTextColor
          },
          navigationLinks: headerConfig?.navigationLinks || [],
          heroSlides: updatedSlides
            .filter(slide => slide.image.trim() && slide.title.trim())
            .map(slide => ({
              ...slide,
              tagline: slide.tagline.trim(),
              title: slide.title.trim(),
              description: slide.description.trim(),
              image: slide.image.trim()
            })),
          homeContent: {
            ...homeContent,
            featuredProductIds: selectedFeaturedProducts,
            bestSellerProductIds: selectedBestSellers,
            newArrivalProductIds: selectedNewArrivals,
            newsletter: {
              enabled: newsletterEnabled,
              title: newsletterTitle,
              description: newsletterDescription
            },
            brandShowcase: {
              enabled: brandShowcaseEnabled,
              brands: brandNames
            }
          }
        })
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Hero config update failed:', text);
        triggerNotification('Update Failed', 'Failed to update hero slides.', 'warning');
        return;
      }

      const data = await res.json();
      if (data.data) {
        triggerNotification('Hero Updated', 'Hero slider cards have been updated successfully.', 'success');
        setHeaderConfig(data.data);
        setHeroSlides(data.data.heroSlides || []);
        setHomeContent(data.data.homeContent || DEFAULT_HOME_CONTENT);
        setSlideImageFiles({});
        setSlideImagePreviews({});
        // Refetch header config to update ShopContext for all components
        await fetchGlobalHeaderConfig();
      }
    } catch (e) {
      console.error(e);
      triggerNotification('Update Failed', 'Failed to update hero slides.', 'warning');
    }
  };

  const updateHeroSlide = (index: number, field: keyof HeroSlide, value: string) => {
    setHeroSlides(prev => prev.map((slide, idx) => idx === index ? { ...slide, [field]: value } : slide));
  };

  const updateHeroSlideSizing = (index: number, field: keyof NonNullable<HeroSlide['imageSizing']>, value: string) => {
    setHeroSlides(prev => prev.map((slide, idx) => {
      if (idx !== index) return slide;
      return {
        ...slide,
        imageSizing: {
          ...slide.imageSizing,
          [field]: value
        }
      };
    }));
  };

  const toggleHeroSlideExpanded = (slideKey: string) => {
    setExpandedHeroSlides(prev => ({
      ...prev,
      [slideKey]: !(prev[slideKey] ?? false)
    }));
  };

  const expandAllHeroSlides = () => {
    setExpandedHeroSlides(
      heroSlides.reduce<Record<string, boolean>>((acc, slide, index) => {
        acc[slide.id || `hero-${index}`] = true;
        return acc;
      }, {})
    );
  };

  const collapseAllHeroSlides = () => {
    setExpandedHeroSlides(
      heroSlides.reduce<Record<string, boolean>>((acc, slide, index) => {
        acc[slide.id || `hero-${index}`] = false;
        return acc;
      }, {})
    );
  };

  const addHeroSlide = () => {
    setHeroSlides(prev => [
      ...prev,
      {
        id: `hero-${Date.now()}`,
        image: '',
        tagline: '',
        title: '',
        description: '',
        imageSizing: {
          objectFit: 'cover',
          objectPosition: 'center'
        }
      }
    ]);
  };

  const duplicateHeroSlide = (index: number) => {
    const slideToDuplicate = heroSlides[index];
    if (!slideToDuplicate) return;

    const duplicatedSlide: HeroSlide = {
      ...slideToDuplicate,
      id: `hero-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: slideToDuplicate.title ? `${slideToDuplicate.title} Copy` : ''
    };

    setHeroSlides(prev => {
      const next = [...prev];
      next.splice(index + 1, 0, duplicatedSlide);
      return next;
    });

    setExpandedHeroSlides(prev => ({
      ...prev,
      [duplicatedSlide.id]: true
    }));
  };

  const moveHeroSlide = (index: number, direction: 'up' | 'down') => {
    setHeroSlides(prev => {
      const nextIndex = direction === 'up' ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;

      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const removeHeroSlide = (index: number) => {
    setHeroSlides(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateHomeSection = (section: keyof Omit<HomeContent, 'promoCards'>, field: 'title' | 'description', value: string) => {
    setHomeContent(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updatePromoCard = (index: number, field: keyof HomePromoCard, value: string) => {
    setHomeContent(prev => ({
      ...prev,
      promoCards: prev.promoCards.map((card, idx) => idx === index ? { ...card, [field]: value } : card)
    }));
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMessage) {
      triggerNotification('Missing Fields', 'Please provide title and message for the notification.', 'warning');
      return;
    }

    if (notifRecipient === 'specific' && !notifUserId) {
      triggerNotification('Missing Recipient', 'Please select a user to send the notification to.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userId: notifRecipient === 'specific' ? notifUserId : undefined,
          title: notifTitle,
          message: notifMessage,
          type: notifType,
          broadcast: notifRecipient === 'broadcast',
          sendEmail: notifSendEmail
        })
      });

      const data = await res.json();
      if (res.ok) {
        triggerNotification('Notification Sent', data.message || 'Notification sent successfully.', 'success');
        setNotifTitle('');
        setNotifMessage('');
        setNotifUserId('');
        setNotifSendEmail(false);
        fetchNotificationHistory();
      } else {
        triggerNotification('Send Failed', data.error || 'Failed to send notification.', 'error');
      }
    } catch (e) {
      console.error(e);
      triggerNotification('Send Failed', 'Failed to send notification.', 'error');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-yellow-500 mx-auto" />
        <h2 className="font-display font-extrabold text-2xl tracking-tight text-gray-900">Credential Verification Required</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
          Accessing this secure directory is strictly catalogued. Sovereign admin role clearances are missing.
        </p>
        <Link to="/" className="bg-black text-white px-6 py-2.5 rounded-full text-xs font-semibold inline-block">Return to Home Screen</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Title */}
        <div className="mb-8 text-left border-b border-gray-200/60 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-extrabold text-4xl tracking-tight text-gray-900 flex items-center gap-3">
              <div className="bg-gradient-to-br from-black to-gray-800 p-3 rounded-2xl shadow-lg">
                <Lock className="w-7 h-7 text-white" />
              </div>
              Management Command
            </h1>
            <p className="text-sm text-gray-600 mt-2 font-medium">Sovereign administrative panel monitoring analytic grids, catalog creations, and coupon parameters.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-full font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow-md">
              <CheckCircle className="w-4 h-4" /> Host Connection Verified
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 text-left items-start">

          {/* Left Side: Sidebar navigation */}
          <aside className="lg:col-span-1 space-y-2 bg-white/80 backdrop-blur-xl border border-gray-200/60 p-5 rounded-3xl shadow-xl shadow-gray-200/50">
            
            {/* Dashboard Section */}
            <div className="space-y-1">
              <button
                onClick={() => toggleSection('dashboard')}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:bg-gray-100 text-gray-600"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  Dashboard
                </div>
                {expandedSections.dashboard ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {expandedSections.dashboard && (
                <div className="pl-4 space-y-1">
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 ${activeTab === 'analytics' ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    Live Analytics
                  </button>
                </div>
              )}
            </div>

            {/* Store Management Section */}
            <div className="space-y-1">
              <button
                onClick={() => toggleSection('store')}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:bg-gray-100 text-gray-600"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4 text-gray-500" />
                  Store Management
                </div>
                {expandedSections.store ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {expandedSections.store && (
                <div className="pl-4 space-y-1">
                  <button
                    onClick={() => setActiveTab('products')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 ${activeTab === 'products' ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    Products & Inventory
                  </button>
                  <button
                    onClick={() => setActiveTab('categories')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 ${activeTab === 'categories' ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    Store Collections
                  </button>
                  <button
                    onClick={() => setActiveTab('coupons')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 ${activeTab === 'coupons' ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    Coupon Vouchers
                  </button>
                  <button
                    onClick={() => setActiveTab('timers')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 ${activeTab === 'timers' ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    Timer Configurations
                  </button>
                  <button
                    onClick={() => setActiveTab('warranties')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 ${activeTab === 'warranties' ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    Warranty Templates
                  </button>
                </div>
              )}
            </div>

            {/* Orders Section */}
            <div className="space-y-1">
              <button
                onClick={() => toggleSection('orders')}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:bg-gray-100 text-gray-600"
              >
                <div className="flex items-center gap-3">
                  <PlusCircle className="w-4 h-4 text-gray-500" />
                  Orders
                </div>
                {expandedSections.orders ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {expandedSections.orders && (
                <div className="pl-4 space-y-1">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 ${activeTab === 'orders' ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    Orders Register
                  </button>
                </div>
              )}
            </div>

            {/* Customers Section */}
            <div className="space-y-1">
              <button
                onClick={() => toggleSection('customers')}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:bg-gray-100 text-gray-600"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-gray-500" />
                  Customers
                </div>
                {expandedSections.customers ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {expandedSections.customers && (
                <div className="pl-4 space-y-1">
                  <button
                    onClick={() => setActiveTab('customers')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 ${activeTab === 'customers' ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    Customers Directory
                  </button>
                  <button
                    onClick={() => setActiveTab('customer-service')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 ${activeTab === 'customer-service' ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    Customer Service
                  </button>
                </div>
              )}
            </div>

            {/* Marketing Section */}
            <div className="space-y-1">
              <button
                onClick={() => toggleSection('marketing')}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:bg-gray-100 text-gray-600"
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  Marketing
                </div>
                {expandedSections.marketing ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {expandedSections.marketing && (
                <div className="pl-4 space-y-1">
                  <button
                    onClick={() => setActiveTab('hero')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 ${activeTab === 'hero' ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    Hero Slider
                  </button>
                  <button
                    onClick={() => setActiveTab('newsletter')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 ${activeTab === 'newsletter' ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    Newsletter
                  </button>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 ${activeTab === 'notifications' ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    Notifications
                  </button>
                </div>
              )}
            </div>

            {/* Operations Section */}
            <div className="space-y-1">
              <button
                onClick={() => toggleSection('operations')}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:bg-gray-100 text-gray-600"
              >
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-gray-500" />
                  Operations
                </div>
                {expandedSections.operations ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {expandedSections.operations && (
                <div className="pl-4 space-y-1">
                  <button
                    onClick={() => setActiveTab('shipping')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 ${activeTab === 'shipping' ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    Shipping
                  </button>
                  <button
                    onClick={() => setActiveTab('tax')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 ${activeTab === 'tax' ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    Tax GST
                  </button>
                  <button
                    onClick={() => setActiveTab('email-templates')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 ${activeTab === 'email-templates' ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    Email Templates
                  </button>
                </div>
              )}
            </div>

            {/* Reports Section */}
            <div className="space-y-1">
              <button
                onClick={() => toggleSection('reports')}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:bg-gray-100 text-gray-600"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                  Reports
                </div>
                {expandedSections.reports ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {expandedSections.reports && (
                <div className="pl-4 space-y-1">
                  <button
                    onClick={() => setActiveTab('reports')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 ${activeTab === 'reports' ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    Reports
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* Right Side: Main display box */}
          <div className="lg:col-span-4 bg-white/80 backdrop-blur-xl border border-gray-200/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-gray-200/50 min-h-[500px]">

            {/* 1. ANALYTICS GRIDS */}
            {activeTab === 'analytics' && (
              <div className="space-y-8 text-left">
                {!adminStats ? (
                  <div className="space-y-6">
                    {/* Header Skeleton */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-8 w-64 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse" />
                        <div className="h-4 w-48 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg animate-pulse" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-20 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse" />
                        <div className="h-8 w-32 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse" />
                      </div>
                    </div>
                    {/* Core Metrics Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl p-5 animate-pulse">
                          <div className="h-10 w-10 bg-gray-200 rounded-xl mb-3" />
                          <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                          <div className="h-8 w-32 bg-gray-200 rounded" />
                        </div>
                      ))}
                    </div>
                    {/* Secondary Metrics Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 animate-pulse">
                          <div className="h-12 w-12 bg-gray-200 rounded-xl mb-3" />
                          <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
                          <div className="h-6 w-24 bg-gray-200 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-display font-extrabold text-3xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">Live Analytics Dashboard</h2>
                        <p className="text-sm text-gray-500 mt-1 font-medium">Real-time performance metrics and insights</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-300">
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
                          <span className="text-[11px] font-bold text-green-700 uppercase tracking-wider">Live</span>
                        </div>
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-300">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-[11px] font-bold text-gray-600">Updated: {lastUpdated.toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Core metrics counters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-5 text-white shadow-2xl shadow-gray-900/50 hover:shadow-3xl hover:shadow-gray-900/70 transition-all duration-500 group overflow-hidden border border-white/5 hover:border-white/10">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/3 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)' }} />
                        <div className="relative flex items-center justify-between mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-white/25 to-white/5 rounded-xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-6 group-hover:from-white/35 group-hover:to-white/10 transition-all duration-500 backdrop-blur-md border border-white/15 shadow-lg group-hover:shadow-xl group-hover:shadow-white/20">
                            <TrendingUp className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-500" />
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50" />
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400/50 animate-pulse delay-100" />
                          </div>
                        </div>
                        <span className="relative text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors duration-300">Total Revenue</span>
                        <p className="relative text-2xl font-extrabold text-white mt-1 group-hover:tracking-wide transition-all duration-300">₹{adminStats.revenue.toFixed(2)}</p>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:h-1.5 transition-all duration-300" />
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-5 text-white shadow-2xl shadow-gray-900/50 hover:shadow-3xl hover:shadow-gray-900/70 transition-all duration-500 group overflow-hidden border border-white/5 hover:border-white/10">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/3 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)' }} />
                        <div className="relative flex items-center justify-between mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-white/25 to-white/5 rounded-xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-6 group-hover:from-white/35 group-hover:to-white/10 transition-all duration-500 backdrop-blur-md border border-white/15 shadow-lg group-hover:shadow-xl group-hover:shadow-white/20">
                            <ShoppingBag className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-500" />
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-lg shadow-blue-400/50" />
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400/50 animate-pulse delay-100" />
                          </div>
                        </div>
                        <span className="relative text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors duration-300">Total Orders</span>
                        <p className="relative text-2xl font-extrabold text-white mt-1 group-hover:tracking-wide transition-all duration-300">{adminStats.ordersCount}</p>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:h-1.5 transition-all duration-300" />
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-5 text-white shadow-2xl shadow-gray-900/50 hover:shadow-3xl hover:shadow-gray-900/70 transition-all duration-500 group overflow-hidden border border-white/5 hover:border-white/10">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/3 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)' }} />
                        <div className="relative flex items-center justify-between mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-white/25 to-white/5 rounded-xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-6 group-hover:from-white/35 group-hover:to-white/10 transition-all duration-500 backdrop-blur-md border border-white/15 shadow-lg group-hover:shadow-xl group-hover:shadow-white/20">
                            <Users className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-500" />
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-lg shadow-purple-400/50" />
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50 animate-pulse delay-100" />
                          </div>
                        </div>
                        <span className="relative text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors duration-300">Active Users</span>
                        <p className="relative text-2xl font-extrabold text-white mt-1 group-hover:tracking-wide transition-all duration-300">{adminStats.usersCount}</p>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:h-1.5 transition-all duration-300" />
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-5 text-white shadow-2xl shadow-gray-900/50 hover:shadow-3xl hover:shadow-gray-900/70 transition-all duration-500 group overflow-hidden border border-white/5 hover:border-white/10">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/3 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)' }} />
                        <div className="relative flex items-center justify-between mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-white/25 to-white/5 rounded-xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-6 group-hover:from-white/35 group-hover:to-white/10 transition-all duration-500 backdrop-blur-md border border-white/15 shadow-lg group-hover:shadow-xl group-hover:shadow-white/20">
                            <Layers className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-500" />
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shadow-lg shadow-orange-400/50" />
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400/50 animate-pulse delay-100" />
                          </div>
                        </div>
                        <span className="relative text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors duration-300">Categories</span>
                        <p className="relative text-2xl font-extrabold text-white mt-1 group-hover:tracking-wide transition-all duration-300">{categories.length}</p>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:h-1.5 transition-all duration-300" />
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>

                    {/* Secondary metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="relative bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-2xl hover:shadow-gray-300/50 transition-all duration-500 group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-300 rounded-xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-6 group-hover:from-gray-200 group-hover:to-gray-400 transition-all duration-500 shadow-lg group-hover:shadow-xl group-hover:shadow-gray-400/30 border border-gray-200">
                            <Percent className="w-6 h-6 text-gray-700 group-hover:rotate-12 transition-transform duration-500" />
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-gray-600 transition-colors duration-300">Conversion Rate</span>
                            <p className="text-xl font-extrabold text-gray-900 group-hover:tracking-wide transition-all duration-300">
                              {adminStats.usersCount > 0
                                ? ((adminStats.ordersCount / adminStats.usersCount) * 100).toFixed(1)
                                : '0.0'}%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="relative bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-2xl hover:shadow-gray-300/50 transition-all duration-500 group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-300 rounded-xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-6 group-hover:from-gray-200 group-hover:to-gray-400 transition-all duration-500 shadow-lg group-hover:shadow-xl group-hover:shadow-gray-400/30 border border-gray-200">
                            <Star className="w-6 h-6 text-gray-700 fill-gray-700 group-hover:rotate-12 transition-transform duration-500" />
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-gray-600 transition-colors duration-300">Avg. Order Value</span>
                            <p className="text-xl font-extrabold text-gray-900 group-hover:tracking-wide transition-all duration-300">₹{(adminStats.revenue / Math.max(adminStats.ordersCount, 1)).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="relative bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-2xl hover:shadow-gray-300/50 transition-all duration-500 group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-300 rounded-xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-6 group-hover:from-gray-200 group-hover:to-gray-400 transition-all duration-500 shadow-lg group-hover:shadow-xl group-hover:shadow-gray-400/30 border border-gray-200">
                            <CheckCircle className="w-6 h-6 text-gray-700 group-hover:rotate-12 transition-transform duration-500" />
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-gray-600 transition-colors duration-300">Products Count</span>
                            <p className="text-xl font-extrabold text-gray-900 group-hover:tracking-wide transition-all duration-300">{products.length}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Designer SVG Line Chart (Dynamic Revenue Analytics) */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-gray-400">Revenue Analytics (2026)</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Monthly revenue progression and growth trends</p>
                      </div>

                      <div className="bg-gradient-to-br from-gray-50/50 to-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                        {/* Dynamic SVG Line graph */}
                        <svg viewBox="0 0 500 200" className="w-full h-48 overflow-visible">
                          <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          {/* Grids lines */}
                          <line x1="50" y1="20" x2="450" y2="20" stroke="#f3f4f6" strokeWidth="1" />
                          <line x1="50" y1="60" x2="450" y2="60" stroke="#f3f4f6" strokeWidth="1" />
                          <line x1="50" y1="100" x2="450" y2="100" stroke="#f3f4f6" strokeWidth="1" />
                          <line x1="50" y1="140" x2="450" y2="140" stroke="#f3f4f6" strokeWidth="1" />
                          <line x1="50" y1="180" x2="450" y2="180" stroke="#e5e7eb" strokeWidth="1.5" />

                          {/* Dynamic chart data */}
                          {(() => {
                            if (!revenueHistory || revenueHistory.length === 0) {
                              return null;
                            }

                            const maxRevenue = Math.max(...revenueHistory.map(d => d.revenue), 1);
                            const chartData = revenueHistory.map((d, i) => ({
                              x: 50 + (i * 400 / (revenueHistory.length - 1 || 1)),
                              y: 180 - (d.revenue / maxRevenue * 160),
                              revenue: d.revenue
                            }));

                            if (chartData.length === 0) {
                              return null;
                            }

                            const pathD = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${d.x} ${d.y}`).join(' ');
                            const areaPath = `${pathD} L ${chartData[chartData.length - 1].x} 180 L 50 180 Z`;

                            return (
                              <>
                                <path d={areaPath} fill="url(#chartGrad)" />
                                <path
                                  d={pathD}
                                  fill="none"
                                  stroke="#3b82f6"
                                  strokeWidth="3.5"
                                  strokeLinecap="round"
                                />
                                {chartData.map((d, i) => (
                                  <circle
                                    key={i}
                                    cx={d.x}
                                    cy={d.y}
                                    r={4.5}
                                    fill={i === chartData.length - 1 ? '#22c55e' : '#3b82f6'}
                                    stroke="#fff"
                                    strokeWidth="2"
                                  />
                                ))}
                              </>
                            );
                          })()}

                          {/* Axes text */}
                          <text x="45" y="185" className="text-[9px] font-mono font-bold text-gray-400" textAnchor="end">₹0</text>
                          <text x="45" y="105" className="text-[9px] font-mono font-bold text-gray-400" textAnchor="end">
                            ₹{(Math.max(...revenueHistory.map(d => d.revenue), 1) / 2).toFixed(0)}k
                          </text>
                          <text x="45" y="25" className="text-[9px] font-mono font-bold text-gray-400" textAnchor="end">
                            ₹{(Math.max(...revenueHistory.map(d => d.revenue), 1) / 1000).toFixed(0)}k
                          </text>

                          {revenueHistory.map((d, i) => (
                            <text
                              key={i}
                              x={50 + (i * 400 / (revenueHistory.length - 1 || 1))}
                              y="195"
                              className="text-[8px] font-bold text-gray-400"
                              textAnchor="middle"
                            >
                              {d.month}
                            </text>
                          ))}
                        </svg>
                      </div>
                    </div>

                    {/* Additional Metrics Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="relative group bg-gradient-to-br from-white to-red-50/30 border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-red-100/50 transition-all duration-500 hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                        <div className="relative flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-50 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg group-hover:shadow-red-200/50">
                            <XCircle className="w-6 h-6 text-red-600" />
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-red-500 transition-colors duration-300">Refunds</span>
                            <p className="text-xl font-extrabold text-gray-900 group-hover:text-red-700 transition-colors duration-300">₹{adminStats.refundSum?.toFixed(2) || '0.00'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="relative group bg-gradient-to-br from-white to-yellow-50/30 border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-yellow-100/50 transition-all duration-500 hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                        <div className="relative flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg group-hover:shadow-yellow-200/50">
                            <Star className="w-6 h-6 text-yellow-600" />
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-yellow-500 transition-colors duration-300">Reviews</span>
                            <p className="text-xl font-extrabold text-gray-900 group-hover:text-yellow-700 transition-colors duration-300">{adminStats.reviewsCount || 0}</p>
                          </div>
                        </div>
                      </div>
                      <div className="relative group bg-gradient-to-br from-white to-purple-50/30 border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-500 hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                        <div className="relative flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg group-hover:shadow-purple-200/50">
                            <Package className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-purple-500 transition-colors duration-300">Inventory</span>
                            <p className="text-xl font-extrabold text-gray-900 group-hover:text-purple-700 transition-colors duration-300">{adminStats.productsCount || 0}</p>
                          </div>
                        </div>
                      </div>
                      <div className="relative group bg-gradient-to-br from-white to-blue-50/30 border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-500 hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                        <div className="relative flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg group-hover:shadow-blue-200/50">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-blue-500 transition-colors duration-300">Audit Logs</span>
                            <p className="text-xl font-extrabold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">{adminStats.auditLogsCount || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top Products Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-display font-bold text-base uppercase tracking-wider bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Top Products</h3>
                          <p className="text-xs text-gray-500 mt-0.5 font-medium">Best-selling products by quantity sold</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[10px] text-green-600 font-semibold uppercase tracking-wider">Live</span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-white to-gray-50/50 border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500">
                        {topProducts && topProducts.length > 0 ? (
                          <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                              <tr>
                                <th className="text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider px-5 py-4">Product</th>
                                <th className="text-right text-[11px] font-bold text-gray-600 uppercase tracking-wider px-5 py-4">Sold</th>
                                <th className="text-right text-[11px] font-bold text-gray-600 uppercase tracking-wider px-5 py-4">Revenue</th>
                              </tr>
                            </thead>
                            <tbody>
                              {topProducts.map((product, index) => (
                                <tr key={product.id || index} className="border-b border-gray-100 last:border-0 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-300 group">
                                  <td className="px-5 py-4">
                                    <div className="flex items-center gap-4">
                                      <div className={`w-10 h-10 bg-gradient-to-br rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg ${
                                        index === 0 ? 'from-yellow-400 to-yellow-600' :
                                        index === 1 ? 'from-gray-300 to-gray-500' :
                                        index === 2 ? 'from-orange-300 to-orange-500' :
                                        'from-gray-200 to-gray-400'
                                      } group-hover:scale-110 transition-transform duration-300`}>
                                        {index + 1}
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">{product.name}</p>
                                        <p className="text-[11px] text-gray-500 font-medium">₹{product.price?.toFixed(2)}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-5 py-4 text-right">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold group-hover:bg-blue-100 transition-colors duration-300">
                                      {product.quantitySold || 0}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4 text-right">
                                    <span className="text-sm font-bold text-green-600 group-hover:text-green-700 transition-colors duration-300">₹{product.salesRevenue?.toFixed(2) || '0.00'}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">No product data available</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Category Performance Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-display font-bold text-base uppercase tracking-wider bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Category Performance</h3>
                          <p className="text-xs text-gray-500 mt-0.5 font-medium">Revenue breakdown by category</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">Live</span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-white to-gray-50/50 border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-500">
                        {categorySummary && categorySummary.length > 0 ? (
                          <div className="space-y-5">
                            {categorySummary.map((cat, index) => {
                              const maxRevenue = Math.max(...categorySummary.map(c => c.revenue), 1);
                              const percentage = (cat.revenue / maxRevenue) * 100;
                              const colors = [
                                'from-blue-500 to-indigo-600',
                                'from-purple-500 to-pink-600',
                                'from-green-500 to-emerald-600',
                                'from-orange-500 to-red-600',
                                'from-cyan-500 to-blue-600'
                              ];
                              return (
                                <div key={cat.slug || index} className="space-y-3 group">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center text-white text-xs font-bold shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                        {index + 1}
                                      </div>
                                      <span className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">{cat.categoryName}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors duration-300">₹{cat.revenue?.toFixed(2) || '0.00'}</span>
                                  </div>
                                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                                    <div 
                                      className={`bg-gradient-to-r ${colors[index % colors.length]} h-full rounded-full transition-all duration-700 ease-out shadow-lg group-hover:shadow-xl`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center">
                              <Layers className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">No category data available</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Customer Growth Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-display font-bold text-base uppercase tracking-wider bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Customer Growth</h3>
                          <p className="text-xs text-gray-500 mt-0.5 font-medium">Organic vs referred customer acquisition</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                          <span className="text-[10px] text-purple-600 font-semibold uppercase tracking-wider">Live</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="relative group bg-gradient-to-br from-green-50 via-emerald-50 to-green-100/50 border-2 border-green-200 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:shadow-green-200/50 transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                          <div className="relative flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                              <Users className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <span className="text-[11px] text-green-700 font-bold uppercase tracking-wider">Organic</span>
                              <p className="text-2xl font-extrabold text-green-900 group-hover:scale-105 transition-transform duration-300">{growthTrends?.organicCustomers || 0}</p>
                            </div>
                          </div>
                          <div className="relative w-full bg-green-200 rounded-full h-3 overflow-hidden shadow-inner">
                            <div 
                              className="bg-gradient-to-r from-green-400 to-emerald-600 h-full rounded-full transition-all duration-700 ease-out shadow-lg group-hover:shadow-xl"
                              style={{ width: `${growthTrends ? (growthTrends.organicCustomers / (growthTrends.organicCustomers + growthTrends.referredCustomers) * 100) : 50}%` }}
                            />
                          </div>
                          <div className="relative mt-2 text-[10px] text-green-600 font-semibold">
                            {growthTrends ? ((growthTrends.organicCustomers / (growthTrends.organicCustomers + growthTrends.referredCustomers) * 100).toFixed(1)) : '50.0'}% of total
                          </div>
                        </div>
                        <div className="relative group bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100/50 border-2 border-purple-200 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:shadow-purple-200/50 transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                          <div className="relative flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                              <Share2 className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <span className="text-[11px] text-purple-700 font-bold uppercase tracking-wider">Referred</span>
                              <p className="text-2xl font-extrabold text-purple-900 group-hover:scale-105 transition-transform duration-300">{growthTrends?.referredCustomers || 0}</p>
                            </div>
                          </div>
                          <div className="relative w-full bg-purple-200 rounded-full h-3 overflow-hidden shadow-inner">
                            <div 
                              className="bg-gradient-to-r from-purple-400 to-violet-600 h-full rounded-full transition-all duration-700 ease-out shadow-lg group-hover:shadow-xl"
                              style={{ width: `${growthTrends ? (growthTrends.referredCustomers / (growthTrends.organicCustomers + growthTrends.referredCustomers) * 100) : 50}%` }}
                            />
                          </div>
                          <div className="relative mt-2 text-[10px] text-purple-600 font-semibold">
                            {growthTrends ? ((growthTrends.referredCustomers / (growthTrends.organicCustomers + growthTrends.referredCustomers) * 100).toFixed(1)) : '50.0'}% of total
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Status Distribution Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-display font-bold text-base uppercase tracking-wider bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Order Status Distribution</h3>
                          <p className="text-xs text-gray-500 mt-0.5 font-medium">Current order status breakdown</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                          <span className="text-[10px] text-orange-600 font-semibold uppercase tracking-wider">Live</span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-white to-gray-50/50 border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-500">
                        {(() => {
                          const statusCounts = adminOrders.reduce((acc: any, order: Order) => {
                            acc[order.status] = (acc[order.status] || 0) + 1;
                            return acc;
                          }, {});
                          
                          const totalOrders = adminOrders.length || 1;
                          const statusColors: Record<string, { bg: string, gradient: string, text: string }> = {
                            'Pending': { bg: 'bg-yellow-500', gradient: 'from-yellow-400 to-yellow-600', text: 'text-yellow-700' },
                            'Processing': { bg: 'bg-blue-500', gradient: 'from-blue-400 to-blue-600', text: 'text-blue-700' },
                            'Shipped': { bg: 'bg-purple-500', gradient: 'from-purple-400 to-purple-600', text: 'text-purple-700' },
                            'Delivered': { bg: 'bg-green-500', gradient: 'from-green-400 to-green-600', text: 'text-green-700' },
                            'Cancelled': { bg: 'bg-red-500', gradient: 'from-red-400 to-red-600', text: 'text-red-700' }
                          };
                          
                          const statuses = Object.keys(statusCounts);
                          
                          return statuses.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Donut Chart */}
                              <div className="flex items-center justify-center">
                                <div className="relative w-48 h-48">
                                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                    {(() => {
                                      let cumulativePercentage = 0;
                                      return statuses.map((status, index) => {
                                        const count = statusCounts[status];
                                        const percentage = (count / totalOrders) * 100;
                                        const startAngle = cumulativePercentage;
                                        const endAngle = cumulativePercentage + percentage;
                                        cumulativePercentage = endAngle;
                                        
                                        const startX = 50 + 40 * Math.cos((startAngle * 3.6) * Math.PI / 180);
                                        const startY = 50 + 40 * Math.sin((startAngle * 3.6) * Math.PI / 180);
                                        const endX = 50 + 40 * Math.cos((endAngle * 3.6) * Math.PI / 180);
                                        const endY = 50 + 40 * Math.sin((endAngle * 3.6) * Math.PI / 180);
                                        const largeArcFlag = percentage > 50 ? 1 : 0;
                                        
                                        return (
                                          <path
                                            key={status}
                                            d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                                            fill={statusColors[status]?.bg || '#9ca3af'}
                                            className="hover:opacity-80 transition-opacity duration-300 cursor-pointer"
                                          />
                                        );
                                      });
                                    })()}
                                    <circle cx="50" cy="50" r="25" fill="white" />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                      <p className="text-2xl font-extrabold text-gray-900">{totalOrders}</p>
                                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Legend */}
                              <div className="space-y-3">
                                {statuses.map((status) => {
                                  const count = statusCounts[status];
                                  const percentage = (count / totalOrders) * 100;
                                  const colors = statusColors[status] || { bg: 'bg-gray-500', gradient: 'from-gray-400 to-gray-600', text: 'text-gray-700' };
                                  return (
                                    <div key={status} className="flex items-center justify-between group">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded-full ${colors.bg} shadow-md group-hover:scale-125 transition-transform duration-300`} />
                                        <span className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">{status}</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors duration-300">{count}</span>
                                        <span className={`text-xs font-bold ${colors.text} bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>{percentage.toFixed(1)}%</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center">
                                <ShoppingBag className="w-8 h-8 text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-500 font-medium">No order data available</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Recent Activity Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-display font-bold text-base uppercase tracking-wider bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Recent Activity</h3>
                          <p className="text-xs text-gray-500 mt-0.5 font-medium">Latest system audit logs</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">Live</span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-white to-gray-50/50 border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500">
                        {recentAuditLogs && recentAuditLogs.length > 0 ? (
                          <div className="divide-y divide-gray-100">
                            {recentAuditLogs.slice(0, 5).map((log, index) => (
                              <div key={index} className="px-5 py-4 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-300 group cursor-pointer">
                                <div className="flex items-start gap-4">
                                  <div className="relative">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-md group-hover:scale-125 transition-transform duration-300" />
                                    <div className="absolute top-3 left-1/2 w-px h-full bg-gradient-to-b from-blue-200 to-transparent -translate-x-1/2" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300 truncate">{log.action || log.message || 'System action'}</p>
                                    <p className="text-[11px] text-gray-500 mt-1 font-medium flex items-center gap-2">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                                    </p>
                                  </div>
                                  <div className="flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                      <FileText className="w-4 h-4 text-blue-600" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center">
                              <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">No recent activity</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 2. PRODUCTS INVENTORY */}
            {activeTab === 'products' && (
              <div className="space-y-8">

                {/* Product creator expansion form */}
                <form onSubmit={handleCreateProduct} className="bg-white border border-gray-200 shadow-sm p-6 rounded-2xl text-xs font-semibold text-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display font-extrabold text-base text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <PlusCircle className="text-black w-5 h-5" /> Add New Product
                    </h3>
                    <span className="text-[10px] text-gray-400 bg-gray-50 px-3 py-1 rounded-full">Create new inventory item</span>
                  </div>

                  {/* Basic Information Section */}
                  <div className="mb-6">
                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-black rounded-full"></div>
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2 lg:col-span-2">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block font-medium">Product Name</label>
                        <input type="text" placeholder="e.g., AcousticMax Horizon Headphones" value={pName} onChange={(e) => setPName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all font-medium" required />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block font-medium">Brand</label>
                        <input type="text" placeholder="e.g., ACOUSTICLABS" value={pBrand} onChange={(e) => setPBrand(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all font-semibold" required />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block font-medium">Category</label>
                        <select value={pCategory} onChange={(e) => setPCategory(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all font-semibold">
                          <option value="">Select Category</option>
                          {categories.map((c, idx) => (
                            <option key={c.id || `c-opt-${idx}`} value={c.slug}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block font-medium">Price (₹)</label>
                        <input type="number" step="0.01" placeholder="e.g., 2999.99" value={pPrice} onChange={(e) => setPPrice(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all font-bold" required />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block font-medium">Sale Price (₹)</label>
                        <input type="number" step="0.01" placeholder="Optional" value={pDiscountPrice} onChange={(e) => setPDiscountPrice(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all font-bold" />
                      </div>
                    </div>
                  </div>

                  {/* Inventory Section */}
                  <div className="mb-6">
                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-black rounded-full"></div>
                      Inventory Management
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block font-medium">Stock Quantity</label>
                        <input type="number" placeholder="e.g., 20" value={pStock} onChange={(e) => setPStock(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all font-bold" required />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block font-medium">Low Stock Alert</label>
                        <input type="number" placeholder="e.g., 5" value={pLowStockThreshold} onChange={(e) => setPLowStockThreshold(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all font-bold" required />
                        <p className="text-[9px] text-gray-400">Alert when stock falls below this value</p>
                      </div>
                    </div>
                  </div>

                  {/* Product Images Section */}
                  <div className="mb-6">
                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-black rounded-full"></div>
                      Product Images
                    </h4>
                    <div className="space-y-4">
                      {/* Color selection for main images */}
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block font-medium">Color for these images</label>
                        <select
                          value={pImagesColor}
                          onChange={(e) => setPImagesColor(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all font-medium"
                        >
                          <option value="">No color (main images)</option>
                          {pColors.filter(c => c.trim()).map((color) => (
                            <option key={color} value={color}>{color}</option>
                          ))}
                        </select>
                      </div>

                      {/* File Upload */}
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                setPImageFiles(files);
                                setPImagePreviews(files.map((file) => URL.createObjectURL(file)));
                              }}
                              className="w-full text-xs text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 transition-colors"
                            />
                          </div>
                          {pUploading && (
                            <div className="text-xs text-gray-500 animate-pulse flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                              Uploading...
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Image Preview */}
                      {pImagePreviews.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {pImagePreviews.map((preview, index) => (
                            <div key={`${preview}-${index}`} className="relative group w-full h-28 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                              <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  setPImageFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
                                  setPImagePreviews((prev) => prev.filter((_, previewIndex) => previewIndex !== index));
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 shadow-lg"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[9px] px-2 py-0.5 rounded-full">
                                {index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Or enter URL manually */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-[10px] text-gray-500 mb-3 font-medium">Or paste image URLs manually:</p>
                        <div className="space-y-2">
                          {pImages.map((image, index) => (
                            <div key={`create-image-${index}`} className="flex gap-2">
                              <input
                                type="text"
                                placeholder="https://images.unsplash.com/..."
                                value={image}
                                onChange={(e) => {
                                  const nextImages = [...pImages];
                                  nextImages[index] = e.target.value;
                                  setPImages(nextImages);
                                }}
                                className="flex-1 bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all font-medium"
                              />
                              {pImages.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setPImages((prev) => prev.filter((_, imageIndex) => imageIndex !== index))}
                                  className="px-3 rounded-lg border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => setPImages((prev) => [...prev, ''])}
                            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add another image URL
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Variants Section */}
                  <div className="mb-6">
                    <button
                      type="button"
                      onClick={() => setShowVariantSection(!showVariantSection)}
                      className="w-full flex items-center justify-between mb-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-black rounded-full"></div>
                        Product Variants (Optional)
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showVariantSection ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showVariantSection && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Colors */}
                      <div className="space-y-3">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block font-medium">Available Colors</label>
                        <div className="space-y-3">
                          {pColors.map((color, index) => (
                            <div key={`create-color-${index}`} className="space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="e.g., Black"
                                  value={color}
                                  onChange={(e) => {
                                    const nextColors = [...pColors];
                                    nextColors[index] = e.target.value;
                                    setPColors(nextColors);
                                  }}
                                  className="flex-1 bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all font-medium"
                                />
                                {pColors.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPColors((prev) => prev.filter((_, colorIndex) => colorIndex !== index));
                                      setPColorImages((prev) => {
                                        const updated = { ...prev };
                                        delete updated[color];
                                        return updated;
                                      });
                                    }}
                                    className="px-3 rounded-lg border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider block font-medium">
                                  {color ? `Images for ${color}` : 'Images for this color'}
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                  {(pColorImages[color] || []).map((img, imgIndex) => (
                                    <div key={imgIndex} className="relative w-16 h-16 group">
                                      <img src={img} alt={`${color} variant`} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPColorImages((prev) => ({
                                            ...prev,
                                            [color]: (prev[color] || []).filter((_, i) => i !== imgIndex)
                                          }));
                                        }}
                                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex gap-2 items-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = 'image/*';
                                      input.multiple = true;
                                      input.onchange = (e) => {
                                        const files = (e.target as HTMLInputElement).files;
                                        if (files) {
                                          Array.from(files).forEach(file => {
                                            const reader = new FileReader();
                                            reader.onload = (e) => {
                                              setPColorImages((prev) => ({
                                                ...prev,
                                                [color]: [...(prev[color] || []), e.target?.result as string]
                                              }));
                                            };
                                            reader.readAsDataURL(file);
                                          });
                                        }
                                      };
                                      input.click();
                                    }}
                                    className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                  >
                                    <Upload className="w-3.5 h-3.5" />
                                    Upload
                                  </button>
                                  <div className="flex-1 flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="Paste image URL..."
                                      value={pColorImageUrls[color] || ''}
                                      onChange={(e) => setPColorImageUrls(prev => ({ ...prev, [color]: e.target.value }))}
                                      className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all font-medium"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const url = pColorImageUrls[color];
                                        if (url && url.trim()) {
                                          setPColorImages((prev) => ({
                                            ...prev,
                                            [color]: [...(prev[color] || []), url.trim()]
                                          }));
                                          setPColorImageUrls(prev => ({ ...prev, [color]: '' }));
                                        }
                                      }}
                                      className="px-3 py-2 bg-green-600 text-white rounded-lg text-[10px] font-semibold hover:bg-green-700 transition-colors"
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => setPColors((prev) => [...prev, ''])}
                            className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add another color
                          </button>
                        </div>
                      </div>

                      {/* Sizes */}
                      <div className="space-y-3">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block font-medium">Available Sizes</label>
                        <div className="space-y-2">
                          {pSizes.map((size, index) => (
                            <div key={`create-size-${index}`} className="flex gap-2">
                              <input
                                type="text"
                                placeholder="e.g., M, L, XL"
                                value={size}
                                onChange={(e) => {
                                  const nextSizes = [...pSizes];
                                  nextSizes[index] = e.target.value;
                                  setPSizes(nextSizes);
                                }}
                                className="flex-1 bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all font-medium"
                              />
                              {pSizes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setPSizes((prev) => prev.filter((_, sizeIndex) => sizeIndex !== index))}
                                  className="px-3 rounded-lg border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => setPSizes((prev) => [...prev, ''])}
                            className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add another size
                          </button>
                        </div>
                      </div>
                    </div>
                    )}
                  </div>

                  {/* Stock per Variant Section */}
                  {showVariantSection && (
                  <div className="mb-6">
                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-black rounded-full"></div>
                      Variant Stock Management
                    </h4>
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                      {pColors.filter(c => c.trim()).length > 0 && pSizes.filter(s => s.trim()).length > 0 ? (
                        <>
                          <p className="text-xs text-gray-500 mb-4 font-medium">Set stock for each color and size combination:</p>
                          <div className="space-y-4">
                            {pColors.filter(c => c.trim()).map(color => (
                              <div key={`inv-color-${color}`} className="space-y-2">
                                <span className="text-xs font-bold text-gray-700 bg-white px-3 py-1 rounded-lg inline-block border border-gray-200">{color}</span>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 ml-2">
                                  {pSizes.filter(s => s.trim()).map(size => {
                                    const key = `Color:${color}|Size:${size}`;
                                    return (
                                      <div key={`inv-${key}`} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
                                        <span className="text-[10px] text-gray-500 font-medium w-8">{size}</span>
                                        <input
                                          type="number"
                                          min="0"
                                          placeholder="0"
                                          value={pInventory[key] || ''}
                                          onChange={(e) => setPInventory(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
                                          className="flex-1 bg-gray-50 border border-gray-200 rounded p-1.5 text-xs focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all font-bold text-center"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-xs text-gray-400">Add colors and sizes above to manage stock per variant</p>
                        </div>
                      )}
                    </div>
                  </div>
                  )}

                  {/* Description Section */}
                  <div className="mb-6">
                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-black rounded-full"></div>
                      Product Description
                    </h4>
                    <textarea 
                      rows={3} 
                      placeholder="Summarise craftsmanship, materials, features, etc." 
                      value={pDescription} 
                      onChange={(e) => setPDescription(e.target.value)} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all resize-none" 
                      required 
                    />
                  </div>

                  {/* Specifications Section - Collapsible */}
                  <div className="mb-6">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                      className="w-full flex items-center justify-between mb-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-black rounded-full"></div>
                        Product Specifications (Optional)
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showAdvancedOptions && (
                      <div className="space-y-3">
                        {pSpecs.map((spec, index) => (
                          <div key={`create-spec-${index}`} className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Label (e.g., Material)"
                              value={spec.label}
                              onChange={(e) => {
                                const nextSpecs = [...pSpecs];
                                nextSpecs[index] = { ...nextSpecs[index], label: e.target.value };
                                setPSpecs(nextSpecs);
                              }}
                              className="flex-1 bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all font-medium"
                            />
                            <input
                              type="text"
                              placeholder="Value (e.g., Cotton)"
                              value={spec.value}
                              onChange={(e) => {
                                const nextSpecs = [...pSpecs];
                                nextSpecs[index] = { ...nextSpecs[index], value: e.target.value };
                                setPSpecs(nextSpecs);
                              }}
                              className="flex-1 bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all font-medium"
                            />
                            {pSpecs.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setPSpecs((prev) => prev.filter((_, specIndex) => specIndex !== index))}
                                className="px-3 rounded-lg border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setPSpecs((prev) => [...prev, { label: '', value: '' }])}
                          className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add another specification
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                    <button type="submit" className="bg-black hover:bg-gray-800 text-white font-semibold text-xs px-6 py-3 rounded-xl transition-all hover:shadow-lg flex items-center gap-2">
                      <PlusCircle className="w-4 h-4" />
                      Add Product to Catalog
                    </button>
                  </div>
                </form>

                {/* Low Stock Alerts Section */}
                <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 border border-orange-200 p-6 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-display font-extrabold text-sm text-red-800 uppercase tracking-wider flex items-center gap-2">
                      <span className="text-lg">⚠️</span> Low Stock Alerts
                    </h3>
                    <span className="text-[10px] bg-white/60 px-3 py-1 rounded-full text-orange-700 font-semibold">
                      {products.filter(p => {
                        const threshold = (p.lowStockThreshold || 5);
                        return p.stock <= threshold;
                      }).length} items
                    </span>
                  </div>
                  {products.filter(p => {
                    const threshold = (p.lowStockThreshold || 5);
                    return p.stock <= threshold;
                  }).length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">✅</div>
                      <p className="text-xs text-gray-600 font-medium">All products have healthy stock levels.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {products.filter(p => {
                        const threshold = (p.lowStockThreshold || 5);
                        return p.stock <= threshold;
                      }).map(product => {
                        const threshold = (product.lowStockThreshold || 5);
                        const isOutOfStock = product.stock === 0;
                        return (
                          <div key={product.id} className={`flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm ${isOutOfStock ? 'border-red-300' : 'border-orange-200'}`}>
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isOutOfStock ? 'bg-red-100' : 'bg-orange-100'}`}>
                                <span className={`text-lg ${isOutOfStock ? 'text-red-600' : 'text-orange-600'}`}>
                                  {isOutOfStock ? '🚫' : '⚡'}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-xs text-gray-800">{product.name}</p>
                                <p className="text-[10px] text-gray-500">
                                  Stock: <span className={`font-bold ${isOutOfStock ? 'text-red-600' : 'text-orange-600'}`}>{product.stock}</span>
                                  {isOutOfStock ? ' (OUT OF STOCK)' : ` (Threshold: ${threshold})`}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-sm hover:shadow"
                            >
                              Restock
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Current Catalogs and deletion mapping lists */}
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="font-display font-extrabold text-base text-gray-900 uppercase tracking-wider flex items-center gap-2">
                          <Package className="text-black w-5 h-5" /> Products Inventory
                        </h3>
                        <p className="text-[10px] text-gray-500 mt-1">{filteredProducts.length} total products</p>
                      </div>

                      {/* Search and Filters */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search products..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all w-48"
                          />
                        </div>

                        <select
                          value={productCategoryFilter}
                          onChange={(e) => setProductCategoryFilter(e.target.value)}
                          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all font-medium"
                        >
                          <option value="all">All Categories</option>
                          {categories.map((c, idx) => (
                            <option key={c.id || `cat-opt-${idx}`} value={c.slug}>{c.name}</option>
                          ))}
                        </select>

                        <select
                          value={productSortBy}
                          onChange={(e) => setProductSortBy(e.target.value as any)}
                          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all font-medium"
                        >
                          <option value="name">Sort by Name</option>
                          <option value="price">Sort by Price</option>
                          <option value="stock">Sort by Stock</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {paginatedProducts.map((p, idx) => {
                        const stockLevel = getStockLevel(p.stock);
                        return (
                          <div key={p.id || `p-card-${idx}`} className="group border border-gray-200 rounded-2xl overflow-hidden bg-white hover:shadow-xl hover:border-gray-300 transition-all duration-300">
                            {/* Product Image */}
                            <div className="relative h-48 bg-gray-50 overflow-hidden">
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <div className="absolute top-3 right-3">
                                <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${stockLevel.color}`}>
                                  {stockLevel.icon} {stockLevel.label}
                                </span>
                              </div>
                              <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow-lg transition-colors"
                                  title="Delete product"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Product Info */}
                            <div className="p-5">
                              <div className="mb-3">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{p.brand}</p>
                                <p className="font-bold text-gray-900 text-sm line-clamp-2 mt-1">{p.name}</p>
                              </div>

                              <div className="flex items-center gap-2 mb-4">
                                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-semibold uppercase">{p.category}</span>
                              </div>

                              <div className="flex items-center justify-between mb-4 bg-gray-50 rounded-xl p-3">
                                <div>
                                  <p className="text-[9px] text-gray-500 uppercase tracking-wider font-medium">Price</p>
                                  <p className="font-bold text-gray-900 text-sm">{formatPrice(p.discountPrice || p.price)}</p>
                                  {p.discountPrice && (
                                    <p className="text-[10px] text-gray-400 line-through">{formatPrice(p.price)}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-[9px] text-gray-500 uppercase tracking-wider font-medium">Stock</p>
                                  <p className="font-bold text-gray-900 text-sm">{p.stock}</p>
                                </div>
                              </div>

                              <button
                                onClick={() => handleEditProduct(p)}
                                className="w-full bg-black hover:bg-gray-800 text-white font-semibold text-xs px-4 py-3 rounded-xl transition-all hover:shadow-lg flex items-center justify-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit Product
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <Pagination
                  currentPage={productsPage}
                  totalPages={productsTotalPages}
                  onPageChange={setProductsPage}
                />

              </div>
            )}

            {/* 3. ORDERS REGISTER MANAGER */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <h3 className="font-display font-extrabold text-sm text-gray-800 uppercase tracking-wider">
                    Orders Register ({filteredOrders.length} total)
                  </h3>

                  {/* Search and Filters */}
                  <div className="flex flex-wrap gap-3">
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-black w-48"
                    />

                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-black"
                    >
                      <option value="all">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>

                    <select
                      value={orderSortBy}
                      onChange={(e) => setOrderSortBy(e.target.value as any)}
                      className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-black"
                    >
                      <option value="date">Sort by Date</option>
                      <option value="amount">Sort by Amount</option>
                      <option value="status">Sort by Status</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-sm">No orders found matching your criteria.</p>
                    </div>
                  ) : (
                    filteredOrders.map((ord, idx) => (
                      <div key={ord.id || `ord-card-${idx}`} className="border border-gray-200 rounded-2xl text-xs overflow-hidden text-left bg-white hover:shadow-lg transition-shadow">

                        {/* Header bar with gradient */}
                        <div className="bg-gradient-to-r from-gray-50 to-white p-5 border-b border-gray-100">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex-1 min-w-[200px]">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(ord.status)}`}>
                                  {getStatusIcon(ord.status)} {ord.status}
                                </span>
                                <span className="text-[9px] text-gray-400 font-mono">{new Date(ord.date).toLocaleDateString()}</span>
                              </div>
                              <p className="text-gray-900 font-mono font-bold text-sm select-all">{ord.orderNumber}</p>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-[9px] text-gray-400 uppercase tracking-wider">Total</p>
                                <p className="text-black font-bold text-lg">${ord.totalAmount.toFixed(2)}</p>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => navigate(`/order-tracking/${ord.id}`)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <Truck className="w-3 h-3" />
                                  Track
                                </button>
                                <select
                                  value={ord.status}
                                  onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-black shadow-sm"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Processing">Processing</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Order details */}
                        <div className="p-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            {/* Customer Info */}
                            <div className="bg-gray-50 rounded-xl p-4">
                              <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-2">Customer Information</p>
                              <p className="text-gray-900 font-semibold">{ord.shippingAddress?.street || 'N/A'}</p>
                              <p className="text-gray-600">{ord.shippingAddress?.city}, {ord.shippingAddress?.state} {ord.shippingAddress?.zipCode}</p>
                              <p className="text-gray-600">{ord.shippingAddress?.country}</p>
                            </div>

                            {/* Payment Info */}
                            <div className="bg-gray-50 rounded-xl p-4">
                              <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-2">Payment Details</p>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="text-gray-900 font-semibold">${ord.subtotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-600">Discount</span>
                                <span className="text-green-600 font-semibold">-${ord.discountAmount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-600">Tax</span>
                                <span className="text-gray-900 font-semibold">${ord.taxAmount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-600">Shipping</span>
                                <span className="text-gray-900 font-semibold">${ord.shippingAmount.toFixed(2)}</span>
                              </div>
                              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between items-center">
                                <span className="text-gray-900 font-bold">Total</span>
                                <span className="text-black font-bold text-lg">${ord.totalAmount.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Items */}
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-3">Order Items ({ord.items.length})</p>
                            <div className="space-y-2">
                              {ord.items.map((item, idx) => (
                                <div key={`${ord.id || 'ord'}-item-${idx}`} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                      📦
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900">{item.productName}</p>
                                      <p className="text-gray-500 text-[10px]">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                                    </div>
                                  </div>
                                  <span className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>
                    ))
                  )}
                </div>

                <Pagination
                  currentPage={ordersPage}
                  totalPages={ordersTotalPages}
                  onPageChange={setOrdersPage}
                />

              </div>
            )}

            {/* 4. STORE COLLECTIONS */}
            {activeTab === 'categories' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <h3 className="font-display font-extrabold text-sm text-gray-800 uppercase tracking-wider">
                    Store Collections ({filteredCategories.length} total)
                  </h3>

                  <input
                    type="text"
                    placeholder="Search collections..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-black w-48"
                  />
                </div>

                <form onSubmit={handleCreateCategory} className="bg-gray-50 p-6 border border-gray-100 rounded-2xl text-xs font-semibold text-gray-700 space-y-4">
                  <h3 className="font-display font-extrabold text-sm text-gray-850 uppercase tracking-wider">Create New Collection</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Collection Title</label>
                      <input type="text" placeholder="e.g., Audio Gadgets" value={cName} onChange={(e) => setCName(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none" required />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Background Image</label>
                      <div className="space-y-3">
                        {/* File Upload */}
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setCImageFile(file);
                                    setCImagePreview(URL.createObjectURL(file));
                                  }
                                }}
                                className="w-full text-xs text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 transition-colors"
                              />
                            </div>
                            {cUploading && (
                              <div className="text-xs text-gray-500 animate-pulse flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                                Uploading...
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Image Preview */}
                        {cImagePreview && (
                          <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                            <img src={cImagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                setCImageFile(null);
                                setCImagePreview('');
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {/* Or enter URL manually */}
                        <div className="bg-white rounded-xl p-3">
                          <p className="text-[10px] text-gray-500 mb-2 font-medium">Or paste image URL:</p>
                          <input
                            type="text"
                            placeholder="https://images.unsplash.com/..."
                            value={cImage}
                            onChange={(e) => setCImage(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 col-span-2">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Detailed Category Description</label>
                      <input type="text" placeholder="e.g., Premium acoustic headphones..." value={cDescription} onChange={(e) => setCDescription(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none" required />
                    </div>
                  </div>

                  <button type="submit" className="bg-black hover:bg-neutral-800 text-white font-semibold text-xs px-5 py-2.5 rounded-xl">
                    Create Collection
                  </button>
                </form>

                {/* Active Collections mapping */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedCategories.map((cat, idx) => (
                    <div key={cat.id || `cat-card-${idx}`} className="border border-gray-200 rounded-2xl overflow-hidden bg-white hover:shadow-lg transition-shadow">
                      <div className="relative h-32 bg-gray-50">
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <h4 className="font-bold text-white text-sm">{cat.name}</h4>
                        </div>
                      </div>

                      <div className="p-4">
                        <p className="text-gray-600 text-xs line-clamp-2 mb-3">{cat.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-blue-500 font-mono bg-blue-50 px-2 py-1 rounded">/{cat.slug}</span>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="Delete collection"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination
                  currentPage={categoriesPage}
                  totalPages={categoriesTotalPages}
                  onPageChange={setCategoriesPage}
                />

              </div>
            )}

            {/* 5. COUPON CREATOR */}
            {activeTab === 'coupons' && (
              <div className="space-y-10">

                <form onSubmit={handleCreateCoupon} className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-700 space-y-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Tag className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-display font-extrabold text-sm text-gray-800 uppercase tracking-wider">Create New Coupon</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Coupon Code</label>
                      <input type="text" placeholder="e.g., SUMMER20" value={coCode} onChange={(e) => setCoCode(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase font-bold transition-all" required />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Discount Type</label>
                      <select value={coType} onChange={(e) => setCoType(e.target.value as any)} className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold transition-all">
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount ($)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Discount Value</label>
                      <input type="number" placeholder="e.g., 20" value={coValue} onChange={(e) => setCoValue(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-bold transition-all" required />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Min Purchase (Optional)</label>
                      <input type="number" placeholder="e.g., 50" value={coMinCart} onChange={(e) => setCoMinCart(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-bold transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Usage Limit (Optional)</label>
                      <input type="number" placeholder="e.g., 100" value={coLimit} onChange={(e) => setCoLimit(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-bold transition-all" />
                    </div>
                  </div>

                  <button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-xs px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Create Coupon
                  </button>
                </form>

                {/* Coupons List */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="font-display font-extrabold text-sm text-gray-800 uppercase tracking-wider flex items-center gap-2">
                      <Tag className="w-4 h-4 text-purple-600" />
                      Active Coupons ({adminCoupons.length})
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4 text-left">Coupon Code</th>
                          <th className="px-6 py-4 text-left">Type</th>
                          <th className="px-6 py-4 text-left">Value</th>
                          <th className="px-6 py-4 text-left">Min Purchase</th>
                          <th className="px-6 py-4 text-left">Usage</th>
                          <th className="px-6 py-4 text-left">Expiry</th>
                          <th className="px-6 py-4 text-left">Status</th>
                          <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedCoupons.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-xs">
                              No coupons found. Create your first coupon above.
                            </td>
                          </tr>
                        ) : (
                          paginatedCoupons.map((cp, idx) => (
                            <tr key={`${cp.id || `cp-${idx}`}-${idx}`} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                                    <Tag className="w-3.5 h-3.5 text-purple-600" />
                                  </div>
                                  <span className="font-mono font-bold text-black text-sm select-all">{cp.code}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${cp.type === 'percentage' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                  {cp.type === 'percentage' ? '%' : '$'}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-bold text-gray-900 text-sm">
                                {cp.type === 'percentage' ? `${cp.value}%` : `$${cp.value}`}
                              </td>
                              <td className="px-6 py-4 text-gray-600 text-xs">
                                {cp.minPurchase ? `$${cp.minPurchase}` : '-'}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="font-semibold text-gray-900">{cp.usedCount}</span>
                                  {cp.usageLimit && (
                                    <span className="text-gray-400">/ {cp.usageLimit}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-600 text-xs">
                                {new Date(cp.expiryDate).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => handleToggleCoupon(cp.id!)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${cp.active || cp.isActive ? 'bg-purple-600' : 'bg-gray-300'}`}
                                >
                                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${cp.active || cp.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => handleToggleCoupon(cp.id!)}
                                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${cp.active || cp.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                >
                                  {cp.active || cp.isActive ? 'Disable' : 'Enable'}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Pagination
                  currentPage={couponsPage}
                  totalPages={couponsTotalPages}
                  onPageChange={setCouponsPage}
                />

              </div>
            )}

            {/* 6. TIMER CONFIGURATIONS */}
            {activeTab === 'timers' && (
              <div className="space-y-10">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 border border-gray-700 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg flex items-center justify-center">
                      <Timer className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-display font-extrabold text-sm text-white uppercase tracking-wider">Timer Configuration Management</h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">Create and manage countdown timers for products with built-in templates. These timers will appear on product detail pages.</p>

                  <button
                    onClick={() => setShowAddTimer(true)}
                    className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white font-semibold text-xs px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Timer
                  </button>
                </div>

                {/* Timer Templates */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { id: 'flash-sale', name: 'Flash Sale', icon: '⚡', color: 'from-gray-700 to-gray-600', desc: 'Urgent 24h countdown' },
                    { id: 'limited-offer', name: 'Limited Offer', icon: '🎯', color: 'from-gray-700 to-gray-600', desc: 'Special promotion timer' },
                    { id: 'countdown-deal', name: 'Countdown Deal', icon: '⏰', color: 'from-gray-700 to-gray-600', desc: 'Deal expiration timer' },
                    { id: 'custom', name: 'Custom Timer', icon: '🎨', color: 'from-gray-700 to-gray-600', desc: 'Fully customizable' }
                  ].map((template) => (
                    <div
                      key={template.id}
                      onClick={() => {
                        setTimerTemplate(template.id as any);
                        setShowAddTimer(true);
                      }}
                      className="bg-gray-900 border border-gray-700 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:border-gray-600 transition-all group"
                    >
                      <div className={`w-10 h-10 bg-gradient-to-r ${template.color} rounded-lg flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition-transform`}>
                        {template.icon}
                      </div>
                      <h4 className="font-bold text-sm text-white mb-1">{template.name}</h4>
                      <p className="text-[10px] text-gray-400">{template.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Active Timers List */}
                <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4 border-b border-gray-700">
                    <h3 className="font-display font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                      <Timer className="w-4 h-4 text-gray-300" />
                      Active Timers ({timers.length})
                    </h3>
                  </div>

                  <div className="divide-y divide-gray-700">
                    {timers.length === 0 ? (
                      <div className="px-6 py-12 text-center text-gray-400 text-xs">
                        No timers configured. Select a template above to create your first timer.
                      </div>
                    ) : (
                      timers.map((timer) => (
                        <div key={timer.id} className="p-4 hover:bg-gray-800 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-sm text-white">{timer.name}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${timer.isActive ? 'bg-green-900 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                                  {timer.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mb-2">{timer.description}</p>
                              <div className="flex items-center gap-4 text-[10px] text-gray-500">
                                <span>Duration: {timer.duration}h</span>
                                <span>Template: {timer.template}</span>
                                {timer.applicableProducts?.length && <span>Products: {timer.applicableProducts.length}</span>}
                                {timer.applicableCategories?.length && <span>Categories: {timer.applicableCategories.length}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingTimer(timer);
                                  setShowAddTimer(true);
                                }}
                                className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setTimers(prev => prev.filter(t => t.id !== timer.id));
                                  triggerNotification('Timer Deleted', 'Timer has been removed.', 'success');
                                }}
                                className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Timer Form Modal */}
                {showAddTimer && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-gray-700 shadow-2xl">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-display font-extrabold text-lg text-white">
                          {editingTimer ? 'Edit Timer' : 'Create New Timer'}
                        </h3>
                        <button
                          onClick={() => {
                            setShowAddTimer(false);
                            setEditingTimer(null);
                            resetTimerForm();
                          }}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveTimer} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Timer Name</label>
                            <input
                              type="text"
                              value={timerName}
                              onChange={(e) => setTimerName(e.target.value)}
                              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-white placeholder-gray-500"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Duration (hours)</label>
                            <input
                              type="number"
                              value={timerDuration}
                              onChange={(e) => setTimerDuration(e.target.value)}
                              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-white placeholder-gray-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Description</label>
                          <textarea
                            value={timerDescription}
                            onChange={(e) => setTimerDescription(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm h-20 resize-none text-white placeholder-gray-500"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Applicable Products</label>
                          <select
                            multiple
                            value={timerApplicableProducts}
                            onChange={(e) => {
                              const selected = Array.from(e.target.selectedOptions, option => option.value);
                              setTimerApplicableProducts(selected);
                            }}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm h-32 text-white"
                          >
                            {products.map(product => (
                              <option key={product.id} value={product.id} className="text-gray-900">
                                {product.name}
                              </option>
                            ))}
                          </select>
                          <p className="text-[10px] text-gray-500">Hold Ctrl/Cmd to select multiple products</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Template</label>
                          <select
                            value={timerTemplate}
                            onChange={(e) => setTimerTemplate(e.target.value as any)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-white"
                          >
                            <option value="flash-sale" className="text-gray-900">Flash Sale</option>
                            <option value="limited-offer" className="text-gray-900">Limited Offer</option>
                            <option value="countdown-deal" className="text-gray-900">Countdown Deal</option>
                            <option value="custom" className="text-gray-900">Custom</option>
                          </select>
                        </div>

                        {timerTemplate === 'custom' && (
                          <div className="space-y-4 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Custom Title</label>
                                <input
                                  type="text"
                                  value={timerCustomTitle}
                                  onChange={(e) => setTimerCustomTitle(e.target.value)}
                                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-white placeholder-gray-500"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Custom Subtitle</label>
                                <input
                                  type="text"
                                  value={timerCustomSubtitle}
                                  onChange={(e) => setTimerCustomSubtitle(e.target.value)}
                                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-white placeholder-gray-500"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Background Color</label>
                                <input
                                  type="color"
                                  value={timerCustomBgColor}
                                  onChange={(e) => setTimerCustomBgColor(e.target.value)}
                                  className="w-full h-10 rounded-lg cursor-pointer bg-gray-800 border border-gray-700"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Text Color</label>
                                <input
                                  type="color"
                                  value={timerCustomTextColor}
                                  onChange={(e) => setTimerCustomTextColor(e.target.value)}
                                  className="w-full h-10 rounded-lg cursor-pointer bg-gray-800 border border-gray-700"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Accent Color</label>
                                <input
                                  type="color"
                                  value={timerCustomAccentColor}
                                  onChange={(e) => setTimerCustomAccentColor(e.target.value)}
                                  className="w-full h-10 rounded-lg cursor-pointer bg-gray-800 border border-gray-700"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Start Date (Optional)</label>
                            <input
                              type="datetime-local"
                              value={timerStartDate}
                              onChange={(e) => setTimerStartDate(e.target.value)}
                              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] text-gray-400 uppercase tracking-wider block">End Date (Optional)</label>
                            <input
                              type="datetime-local"
                              value={timerEndDate}
                              onChange={(e) => setTimerEndDate(e.target.value)}
                              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-white"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="timerActive"
                            checked={timerIsActive}
                            onChange={(e) => setTimerIsActive(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-600 focus:ring-red-500 focus:ring-offset-gray-900"
                          />
                          <label htmlFor="timerActive" className="text-sm text-gray-300">Active</label>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddTimer(false);
                              setEditingTimer(null);
                              resetTimerForm();
                            }}
                            className="flex-1 px-6 py-3 border border-gray-700 rounded-xl text-sm font-semibold text-gray-300 hover:bg-gray-800 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                          >
                            {editingTimer ? 'Update Timer' : 'Create Timer'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 7. WARRANTY TEMPLATES */}
            {activeTab === 'warranties' && (
              <div className="space-y-10">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 border border-gray-700 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-display font-extrabold text-sm text-white uppercase tracking-wider">Warranty Template Management</h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">Create and manage warranty templates for products with built-in templates. These warranties will appear on product detail pages.</p>
                  
                  <button
                    onClick={() => setShowAddWarranty(true)}
                    className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white font-semibold text-xs px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Warranty
                  </button>
                </div>

                {/* Warranty Templates */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { id: 'standard', name: 'Standard Warranty', icon: '🛡️', color: 'from-gray-700 to-gray-600', desc: 'Basic 12-month coverage' },
                    { id: 'premium', name: 'Premium Warranty', icon: '⭐', color: 'from-gray-700 to-gray-600', desc: 'Extended 24-month coverage' },
                    { id: 'extended', name: 'Extended Warranty', icon: '🔒', color: 'from-gray-700 to-gray-600', desc: 'Comprehensive 36-month coverage' },
                    { id: 'custom', name: 'Custom Warranty', icon: '🎨', color: 'from-gray-700 to-gray-600', desc: 'Fully customizable' }
                  ].map((template) => (
                    <div
                      key={template.id}
                      onClick={() => {
                        setWarrantyTemplate(template.id as any);
                        setShowAddWarranty(true);
                      }}
                      className="bg-gray-900 border border-gray-700 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:border-gray-600 transition-all group"
                    >
                      <div className={`w-10 h-10 bg-gradient-to-r ${template.color} rounded-lg flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition-transform`}>
                        {template.icon}
                      </div>
                      <h4 className="font-bold text-sm text-white mb-1">{template.name}</h4>
                      <p className="text-[10px] text-gray-400">{template.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Active Warranties List */}
                <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4 border-b border-gray-700">
                    <h3 className="font-display font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-300" />
                      Active Warranties ({warranties.length})
                    </h3>
                  </div>

                  <div className="divide-y divide-gray-700">
                    {warranties.length === 0 ? (
                      <div className="px-6 py-12 text-center text-gray-400 text-xs">
                        No warranties configured. Select a template above to create your first warranty.
                      </div>
                    ) : (
                      warranties.map((warranty) => (
                        <div key={warranty.id} className="p-4 hover:bg-gray-800 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-sm text-white">{warranty.name}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${warranty.isActive ? 'bg-green-900 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                                  {warranty.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mb-2">{warranty.description}</p>
                              <div className="flex items-center gap-4 text-[10px] text-gray-500">
                                <span>Duration: {warranty.duration} months</span>
                                <span>Template: {warranty.template}</span>
                                {warranty.coverage?.length && <span>Coverage: {warranty.coverage.join(', ')}</span>}
                                {warranty.applicableProducts?.length && <span>Products: {warranty.applicableProducts.length}</span>}
                                {warranty.applicableCategories?.length && <span>Categories: {warranty.applicableCategories.length}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingWarranty(warranty);
                                  setShowAddWarranty(true);
                                }}
                                className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setWarranties(prev => prev.filter(w => w.id !== warranty.id));
                                  triggerNotification('Warranty Deleted', 'Warranty has been removed.', 'success');
                                }}
                                className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Warranty Form Modal */}
                {showAddWarranty && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-gray-700 shadow-2xl">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-display font-extrabold text-lg text-white">
                          {editingWarranty ? 'Edit Warranty' : 'Create New Warranty'}
                        </h3>
                        <button
                          onClick={() => {
                            setShowAddWarranty(false);
                            setEditingWarranty(null);
                            resetWarrantyForm();
                          }}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveWarranty} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Warranty Name</label>
                            <input
                              type="text"
                              value={warrantyName}
                              onChange={(e) => setWarrantyName(e.target.value)}
                              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm text-white placeholder-gray-500"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Duration (months)</label>
                            <input
                              type="number"
                              value={warrantyDuration}
                              onChange={(e) => setWarrantyDuration(e.target.value)}
                              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm text-white placeholder-gray-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Description</label>
                          <textarea
                            value={warrantyDescription}
                            onChange={(e) => setWarrantyDescription(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm h-20 resize-none text-white placeholder-gray-500"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Coverage (comma-separated)</label>
                          <input
                            type="text"
                            value={warrantyCoverage.join(', ')}
                            onChange={(e) => setWarrantyCoverage(e.target.value.split(',').map(c => c.trim()).filter(c => c))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm text-white placeholder-gray-500"
                            placeholder="e.g., Parts, Labor, Shipping"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Applicable Products</label>
                          <select
                            multiple
                            value={warrantyApplicableProducts}
                            onChange={(e) => {
                              const selected = Array.from(e.target.selectedOptions, option => option.value);
                              setWarrantyApplicableProducts(selected);
                            }}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm h-32 text-white"
                          >
                            {products.map(product => (
                              <option key={product.id} value={product.id} className="text-gray-900">
                                {product.name}
                              </option>
                            ))}
                          </select>
                          <p className="text-[10px] text-gray-500">Hold Ctrl/Cmd to select multiple products</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Terms & Conditions</label>
                          <textarea
                            value={warrantyTerms}
                            onChange={(e) => setWarrantyTerms(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm h-20 resize-none text-white placeholder-gray-500"
                            placeholder="Enter warranty terms and conditions..."
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Template</label>
                          <select
                            value={warrantyTemplate}
                            onChange={(e) => setWarrantyTemplate(e.target.value as any)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm text-white"
                          >
                            <option value="standard" className="text-gray-900">Standard</option>
                            <option value="premium" className="text-gray-900">Premium</option>
                            <option value="extended" className="text-gray-900">Extended</option>
                            <option value="custom" className="text-gray-900">Custom</option>
                          </select>
                        </div>

                        {warrantyTemplate === 'custom' && (
                          <div className="space-y-4 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Custom Title</label>
                                <input
                                  type="text"
                                  value={warrantyCustomTitle}
                                  onChange={(e) => setWarrantyCustomTitle(e.target.value)}
                                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm text-white placeholder-gray-500"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Custom Subtitle</label>
                                <input
                                  type="text"
                                  value={warrantyCustomSubtitle}
                                  onChange={(e) => setWarrantyCustomSubtitle(e.target.value)}
                                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm text-white placeholder-gray-500"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Icon</label>
                                <input
                                  type="text"
                                  value={warrantyCustomIcon}
                                  onChange={(e) => setWarrantyCustomIcon(e.target.value)}
                                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm text-white placeholder-gray-500"
                                  placeholder="shield"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Background Color</label>
                                <input
                                  type="color"
                                  value={warrantyCustomBgColor}
                                  onChange={(e) => setWarrantyCustomBgColor(e.target.value)}
                                  className="w-full h-10 rounded-lg cursor-pointer bg-gray-800 border border-gray-700"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Text Color</label>
                                <input
                                  type="color"
                                  value={warrantyCustomTextColor}
                                  onChange={(e) => setWarrantyCustomTextColor(e.target.value)}
                                  className="w-full h-10 rounded-lg cursor-pointer bg-gray-800 border border-gray-700"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Accent Color</label>
                                <input
                                  type="color"
                                  value={warrantyCustomAccentColor}
                                  onChange={(e) => setWarrantyCustomAccentColor(e.target.value)}
                                  className="w-full h-10 rounded-lg cursor-pointer bg-gray-800 border border-gray-700"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="warrantyActive"
                            checked={warrantyIsActive}
                            onChange={(e) => setWarrantyIsActive(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-gray-500 focus:ring-gray-500 focus:ring-offset-gray-900"
                          />
                          <label htmlFor="warrantyActive" className="text-sm text-gray-300">Active</label>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddWarranty(false);
                              setEditingWarranty(null);
                              resetWarrantyForm();
                            }}
                            className="flex-1 px-6 py-3 border border-gray-700 rounded-xl text-sm font-semibold text-gray-300 hover:bg-gray-800 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                          >
                            {editingWarranty ? 'Update Warranty' : 'Create Warranty'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 8. CUSTOMERS DIRECTORY */}
            {activeTab === 'customers' && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex items-center justify-center shadow-lg border border-gray-700 hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-lg text-gray-900 uppercase tracking-wider">Customer Directory</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{adminUsers.length} registered accounts</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const csvContent = [
                        ['Name', 'Email', 'Phone', 'Role', 'Loyalty Points', 'Referral Code', 'Addresses', 'Status', 'Registration Date', 'Total Spent', 'Order Count'],
                        ...filteredUsers.map(u => [
                          u.name,
                          u.email,
                          u.phone || '',
                          u.role,
                          u.loyaltyPoints || 0,
                          u.referralCode,
                          u.addresses?.length || 0,
                          u.isActive !== false ? 'Active' : 'Inactive',
                          u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A',
                          u.totalSpent || 0,
                          u.orderCount || 0
                        ])
                      ].map(row => row.join(',')).join('\n');
                      
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                      triggerNotification('Export Successful', 'Customer data exported to CSV', 'success');
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl text-xs font-semibold hover:shadow-lg transition-all duration-300 border border-gray-700 hover:scale-105 hover:border-gray-600 group"
                  >
                    <Download className="w-4 h-4 group-hover:animate-bounce" />
                    Export CSV
                  </button>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 shadow-lg border border-gray-700 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider group-hover:text-gray-300 transition-colors">Total Customers</p>
                        <p className="text-white text-2xl font-extrabold mt-1 group-hover:scale-110 transition-transform duration-300 inline-block">{adminUsers.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10 group-hover:bg-white/20 transition-colors">
                        <Users className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-5 shadow-lg border border-gray-600 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-300 text-xs font-semibold uppercase tracking-wider group-hover:text-gray-200 transition-colors">New This Month</p>
                        <p className="text-white text-2xl font-extrabold mt-1 group-hover:scale-110 transition-transform duration-300 inline-block">
                          {adminUsers.filter(u => {
                            const createdAt = new Date(u.createdAt || 0);
                            const now = new Date();
                            const thisMonth = createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
                            return thisMonth;
                          }).length}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10 group-hover:bg-white/20 transition-colors">
                        <TrendingUp className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-2xl p-5 shadow-lg border border-gray-500 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-200 text-xs font-semibold uppercase tracking-wider group-hover:text-gray-100 transition-colors">Total Loyalty Points</p>
                        <p className="text-white text-2xl font-extrabold mt-1 group-hover:scale-110 transition-transform duration-300 inline-block">
                          {adminUsers.reduce((sum, u) => sum + (u.loyaltyPoints || 0), 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10 group-hover:bg-white/20 transition-colors">
                        <Star className="w-6 h-6 text-white fill-white group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 border-b border-gray-700">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <h3 className="font-display font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-300" />
                        All Customers
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20">
                          <span className="text-[10px] font-semibold text-gray-300">{filteredUsers.length} of {adminUsers.length}</span>
                        </div>
                        {selectedCustomers.size > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-300">{selectedCustomers.size} selected</span>
                            <button
                              onClick={() => {
                                if (confirm(`Delete ${selectedCustomers.size} selected customers?`)) {
                                  triggerNotification('Bulk Delete', 'This feature requires backend implementation', 'warning');
                                }
                              }}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-all border border-red-500"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="flex flex-col lg:flex-row gap-3">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Search by name, email, or referral code..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                          />
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <select
                            value={userRoleFilter}
                            onChange={(e) => setUserRoleFilter(e.target.value as any)}
                            className="px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                          >
                            <option value="all" className="text-gray-900">All Roles</option>
                            <option value="super-admin" className="text-gray-900">Super Admin</option>
                            <option value="admin" className="text-gray-900">Admin</option>
                            <option value="user" className="text-gray-900">User</option>
                          </select>
                          <select
                            value={userStatusFilter}
                            onChange={(e) => setUserStatusFilter(e.target.value as any)}
                            className="px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                          >
                            <option value="all" className="text-gray-900">All Status</option>
                            <option value="active" className="text-gray-900">Active</option>
                            <option value="inactive" className="text-gray-900">Inactive</option>
                          </select>
                          <input
                            type="date"
                            value={userDateFrom}
                            onChange={(e) => setUserDateFrom(e.target.value)}
                            className="px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all [color-scheme:dark]"
                          />
                          <input
                            type="date"
                            value={userDateTo}
                            onChange={(e) => setUserDateTo(e.target.value)}
                            className="px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all [color-scheme:dark]"
                          />
                          <select
                            value={userSortField}
                            onChange={(e) => setUserSortField(e.target.value as any)}
                            className="px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                          >
                            <option value="name" className="text-gray-900">Sort by Name</option>
                            <option value="loyaltyPoints" className="text-gray-900">Sort by Points</option>
                            <option value="role" className="text-gray-900">Sort by Role</option>
                            <option value="email" className="text-gray-900">Sort by Email</option>
                            <option value="createdAt" className="text-gray-900">Sort by Date</option>
                            <option value="totalSpent" className="text-gray-900">Sort by Spent</option>
                          </select>
                          <button
                            onClick={() => setUserSortDirection(userSortDirection === 'asc' ? 'desc' : 'asc')}
                            className="px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-xs font-semibold text-white hover:bg-white/20 transition-all flex items-center gap-2"
                          >
                            {userSortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                            {userSortDirection === 'asc' ? 'Asc' : 'Desc'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 text-left w-10">
                            <input
                              type="checkbox"
                              checked={selectedCustomers.size === paginatedUsers.length && paginatedUsers.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCustomers(new Set(paginatedUsers.map(u => u.id || `u-${u.name}`)));
                                } else {
                                  setSelectedCustomers(new Set());
                                }
                              }}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                          </th>
                          <th className="px-4 py-3 text-left">Customer</th>
                          <th className="px-4 py-3 text-left">Role</th>
                          <th className="px-4 py-3 text-left">Loyalty Points</th>
                          <th className="px-4 py-3 text-left">Referral Code</th>
                          <th className="px-4 py-3 text-left">Addresses</th>
                          <th className="px-4 py-3 text-left">Joined</th>
                          <th className="px-4 py-3 text-left">Total Spent</th>
                          <th className="px-4 py-3 text-left">Orders</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedUsers.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="px-6 py-16 text-center">
                              <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                  <Users className="w-8 h-8 text-gray-400" />
                                </div>
                                <div>
                                  <p className="text-gray-500 text-sm font-semibold">No customers found</p>
                                  <p className="text-gray-400 text-xs mt-1">Try adjusting your filters or search terms</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          paginatedUsers.map((u, idx) => (
                            <tr 
                              key={`${u.id || `u-${idx}`}-${idx}`} 
                              className="hover:bg-gray-50 transition-all duration-200 hover:shadow-sm group"
                            >
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={selectedCustomers.has(u.id || `u-${u.name}`)}
                                  onChange={(e) => {
                                    const newSelected = new Set(selectedCustomers);
                                    if (e.target.checked) {
                                      newSelected.add(u.id || `u-${u.name}`);
                                    } else {
                                      newSelected.delete(u.id || `u-${u.name}`);
                                    }
                                    setSelectedCustomers(newSelected);
                                  }}
                                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="relative group cursor-pointer">
                                    <img
                                      src={u.profilePhoto || u.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80'}
                                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md group-hover:scale-110 transition-transform duration-200"
                                      alt={u.name}
                                    />
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${u.role === 'admin' || u.role === 'super-admin' ? 'bg-purple-500' : 'bg-green-500'}`} />
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{u.name}</p>
                                    <p className="text-[10px] text-gray-400">{u.email}</p>
                                    {u.phone && (
                                      <p className="text-[9px] text-gray-400">{u.phone}</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all hover:scale-105 ${u.role === 'super-admin'
                                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                    : u.role === 'admin'
                                      ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                    <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                                  </div>
                                  <span className="font-extrabold text-gray-900 text-sm">{u.loyaltyPoints ?? 0}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="bg-gray-100 px-2 py-1 rounded-lg group-hover:bg-gray-200 transition-colors">
                                    <span className="font-mono text-[10px] font-bold text-gray-700 select-all">{u.referralCode}</span>
                                  </div>
                                  {u.referredBy && (
                                    <span className="text-[9px] text-gray-400">Referred</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                  <span className="text-xs font-semibold text-gray-700">{u.addresses?.length || 0}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors">
                                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                                  {formatPrice(u.totalSpent || 0)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                                  {u.orderCount || 0}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all hover:scale-105 ${u.isActive !== false ? 'bg-green-50 border border-green-200 hover:bg-green-100' : 'bg-red-50 border border-red-200 hover:bg-red-100'}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${u.isActive !== false ? 'bg-green-500' : 'bg-red-500'}`} />
                                  <span className={`text-[10px] font-semibold ${u.isActive !== false ? 'text-green-700' : 'text-red-700'}`}>
                                    {u.isActive !== false ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => {
                                    setSelectedCustomerForDetails(u);
                                    setShowCustomerDetails(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-xs font-semibold hover:underline transition-all hover:scale-105 inline-block"
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Pagination
                  currentPage={usersPage}
                  totalPages={usersTotalPages}
                  onPageChange={setUsersPage}
                />

              </div>
            )}

            {/* Customer Details Modal */}
            {showCustomerDetails && selectedCustomerForDetails && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700">
                  <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-t-3xl z-10 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                          <UserCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="font-display font-bold text-lg text-white">Customer Details</h2>
                          <p className="text-[10px] text-gray-400 font-medium">View complete customer profile</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowCustomerDetails(false);
                          setSelectedCustomerForDetails(null);
                        }}
                        className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                    <div className="flex items-center gap-4 mb-6">
                      <img
                        src={selectedCustomerForDetails.profilePhoto || selectedCustomerForDetails.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80'}
                        className="w-20 h-20 rounded-full object-cover border-4 border-gray-700 shadow-lg"
                        alt={selectedCustomerForDetails.name}
                      />
                      <div>
                        <h3 className="font-bold text-xl text-white">{selectedCustomerForDetails.name}</h3>
                        <p className="text-sm text-gray-400">{selectedCustomerForDetails.email}</p>
                        {selectedCustomerForDetails.phone && (
                          <p className="text-sm text-gray-400">{selectedCustomerForDetails.phone}</p>
                        )}
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase mt-2 ${selectedCustomerForDetails.role === 'super-admin'
                            ? 'bg-purple-900/50 text-purple-300 border border-purple-700'
                            : selectedCustomerForDetails.role === 'admin'
                              ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-700'
                              : 'bg-gray-800 text-gray-300 border border-gray-600'
                        }`}>
                          {selectedCustomerForDetails.role}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-4 border border-gray-600">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Loyalty Points</span>
                        </div>
                        <p className="text-2xl font-extrabold text-white">{selectedCustomerForDetails.loyaltyPoints ?? 0}</p>
                      </div>
                      <div className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-xl p-4 border border-gray-500">
                        <div className="flex items-center gap-2 mb-2">
                          <ShoppingBag className="w-5 h-5 text-green-400" />
                          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Total Spent</span>
                        </div>
                        <p className="text-2xl font-extrabold text-white">{formatPrice(selectedCustomerForDetails.totalSpent || 0)}</p>
                      </div>
                      <div className="bg-gradient-to-br from-gray-600 to-gray-500 rounded-xl p-4 border border-gray-400">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-5 h-5 text-blue-400" />
                          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Order Count</span>
                        </div>
                        <p className="text-2xl font-extrabold text-white">{selectedCustomerForDetails.orderCount || 0}</p>
                      </div>
                      <div className="bg-gradient-to-br from-gray-500 to-gray-400 rounded-xl p-4 border border-gray-300">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-5 h-5 text-purple-400" />
                          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Addresses</span>
                        </div>
                        <p className="text-2xl font-extrabold text-white">{selectedCustomerForDetails.addresses?.length || 0}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <h4 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          Account Information
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs">Referral Code</p>
                            <p className="font-mono font-semibold text-white">{selectedCustomerForDetails.referralCode}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Registration Date</p>
                            <p className="font-semibold text-white">
                              {selectedCustomerForDetails.createdAt ? new Date(selectedCustomerForDetails.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Status</p>
                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${selectedCustomerForDetails.isActive !== false ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-red-900/50 text-red-300 border border-red-700'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${selectedCustomerForDetails.isActive !== false ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="text-[10px] font-semibold">
                                {selectedCustomerForDetails.isActive !== false ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Referred By</p>
                            <p className="font-semibold text-white">{selectedCustomerForDetails.referredBy || 'None'}</p>
                          </div>
                        </div>
                      </div>

                      {selectedCustomerForDetails.addresses && selectedCustomerForDetails.addresses.length > 0 && (
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                          <h4 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            Saved Addresses
                          </h4>
                          <div className="space-y-2">
                            {selectedCustomerForDetails.addresses.map((addr: any, idx: number) => (
                              <div key={idx} className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                                <p className="text-sm font-semibold text-white">{addr.fullName || 'Address ' + (idx + 1)}</p>
                                <p className="text-xs text-gray-400">{addr.street}, {addr.city}, {addr.state} {addr.zip}</p>
                                <p className="text-xs text-gray-500">{addr.phone}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 7. CUSTOMER SERVICE */}
            {activeTab === 'customer-service' && (
              <CustomerService authedFetch={authedFetch} triggerNotification={triggerNotification} />
            )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl z-50 w-[700px] max-h-[90vh] overflow-hidden">
          <div className="sticky top-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-200/20 p-6 rounded-t-3xl z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/5 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10">
                  <Edit2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-white">Edit Product</h2>
                  <p className="text-[10px] text-gray-400 font-medium">Update product details and inventory</p>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 pb-8 overflow-y-auto max-h-[calc(90vh-100px)]">
            <form onSubmit={handleUpdateProduct} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Product Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black font-medium text-sm transition-all duration-300"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Brand</label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black font-semibold text-sm transition-all duration-300"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black font-bold text-sm transition-all duration-300"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Discount Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Optional"
                    value={editDiscountPrice}
                    onChange={(e) => setEditDiscountPrice(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black font-bold text-sm transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black font-semibold text-sm transition-all duration-300"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((c, idx) => (
                      <option key={c.id || `c-opt-${idx}`} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Stock</label>
                  <input
                    type="number"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black font-bold text-sm transition-all duration-300"
                    required
                  />
                </div>

                <div className="space-y-2 sm:col-span-3">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    value={editLowStockThreshold}
                    onChange={(e) => setEditLowStockThreshold(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black font-bold text-sm transition-all duration-300"
                    required
                  />
                  <p className="text-[10px] text-gray-400">Alert when stock falls below this value</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Color for these images</label>
                <select
                  value={editImagesColor}
                  onChange={(e) => setEditImagesColor(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black font-medium text-sm transition-all duration-300"
                >
                  <option value="">No color (main images)</option>
                  {editColors.filter(c => c.trim()).map((color) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Image URLs</label>
                <div className="space-y-2">
                  {editImages.map((image, index) => (
                    <div key={`edit-image-${index}`} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        value={image}
                        onChange={(e) => {
                          const nextImages = [...editImages];
                          nextImages[index] = e.target.value;
                          setEditImages(nextImages);
                        }}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black font-medium text-sm transition-all duration-300"
                      />
                      {editImages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEditImages((prev) => prev.filter((_, imageIndex) => imageIndex !== index))}
                          className="px-3 rounded-xl border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all duration-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditImages((prev) => [...prev, ''])}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add another image URL
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Available Colors</label>
                <div className="space-y-3">
                  {editColors.map((color, index) => (
                    <div key={`edit-color-${index}`} className="space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g., Black"
                          value={color}
                          onChange={(e) => {
                            const nextColors = [...editColors];
                            nextColors[index] = e.target.value;
                            setEditColors(nextColors);
                          }}
                          className="flex-1 bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black font-medium text-sm transition-all duration-300"
                        />
                        {editColors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditColors((prev) => prev.filter((_, colorIndex) => colorIndex !== index));
                              setEditColorImages((prev) => {
                                const updated = { ...prev };
                                delete updated[color];
                                return updated;
                              });
                            }}
                            className="px-3 rounded-xl border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all duration-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">
                          {color ? `Images for ${color}` : 'Images for this color'}
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {(editColorImages[color] || []).map((img, imgIndex) => (
                            <div key={imgIndex} className="relative w-20 h-20 group">
                              <img src={img} alt={`${color} variant`} className="w-full h-full object-cover rounded-xl border border-gray-200 shadow-sm" />
                              <button
                                type="button"
                                onClick={() => {
                                  setEditColorImages((prev) => ({
                                    ...prev,
                                    [color]: (prev[color] || []).filter((_, i) => i !== imgIndex)
                                  }));
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-all duration-300 shadow-lg opacity-0 group-hover:opacity-100"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 items-center">
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.multiple = true;
                              input.onchange = (e) => {
                                const files = (e.target as HTMLInputElement).files;
                                if (files) {
                                  Array.from(files).forEach(file => {
                                    const reader = new FileReader();
                                    reader.onload = (e) => {
                                      setEditColorImages((prev) => ({
                                        ...prev,
                                        [color]: [...(prev[color] || []), e.target?.result as string]
                                      }));
                                    };
                                    reader.readAsDataURL(file);
                                  });
                                }
                              };
                              input.click();
                            }}
                            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Upload className="w-4 h-4" />
                            Upload
                          </button>
                          <div className="flex-1 flex gap-2">
                            <input
                              type="text"
                              placeholder="Paste image URL..."
                              value={editColorImageUrls[color] || ''}
                              onChange={(e) => setEditColorImageUrls(prev => ({ ...prev, [color]: e.target.value }))}
                              className="flex-1 bg-white border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black font-medium transition-all duration-300"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const url = editColorImageUrls[color];
                                if (url && url.trim()) {
                                  setEditColorImages((prev) => ({
                                    ...prev,
                                    [color]: [...(prev[color] || []), url.trim()]
                                  }));
                                  setEditColorImageUrls(prev => ({ ...prev, [color]: '' }));
                                }
                              }}
                              className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-xs font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditColors((prev) => [...prev, ''])}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add another color
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Available Sizes</label>
                <div className="space-y-2">
                  {editSizes.map((size, index) => (
                    <div key={`edit-size-${index}`} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g., M, L, XL"
                        value={size}
                        onChange={(e) => {
                          const nextSizes = [...editSizes];
                          nextSizes[index] = e.target.value;
                          setEditSizes(nextSizes);
                        }}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black font-medium text-sm transition-all duration-300"
                      />
                      {editSizes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEditSizes((prev) => prev.filter((_, sizeIndex) => sizeIndex !== index))}
                          className="px-3 rounded-xl border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all duration-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditSizes((prev) => [...prev, ''])}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add another size
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Stock per Variant</label>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200 space-y-4">
                  {editColors.filter(c => c.trim()).length > 0 && editSizes.filter(s => s.trim()).length > 0 ? (
                    <>
                      <p className="text-xs text-gray-600 font-medium">Set stock for each color and size combination:</p>
                      {editColors.filter(c => c.trim()).map(color => (
                        <div key={`edit-inv-color-${color}`} className="space-y-3">
                          <span className="text-sm font-bold text-gray-800">{color}</span>
                          {editSizes.filter(s => s.trim()).map(size => {
                            const key = `Color:${color}|Size:${size}`;
                            return (
                              <div key={`edit-inv-${key}`} className="flex items-center gap-3 ml-4">
                                <span className="text-xs text-gray-600 w-14 font-medium">{size}:</span>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={editInventory[key] || ''}
                                  onChange={(e) => setEditInventory(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
                                  className="w-28 bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black font-bold transition-all duration-300"
                                />
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="text-xs text-gray-400">Add colors and sizes above to manage stock per variant</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Description</label>
                <textarea
                  rows={4}
                  placeholder="Product description..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black font-medium text-sm transition-all duration-300 resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 px-6 rounded-xl transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. HERO SLIDER */}
      {activeTab === 'hero' && (
        <div className="space-y-8 text-left">
          <div className="bg-gradient-to-r from-emerald-50 via-white to-cyan-50 border border-emerald-100 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Layout className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-display font-extrabold text-2xl text-gray-900">Hero Tab</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Manage homepage banners, section copy, promo cards, featured products, newsletter content, and brand showcase from one screen.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-full lg:min-w-[420px]">
                <div className="bg-white/90 border border-emerald-100 rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Slides</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1">{heroSlides.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Total hero banners</p>
                </div>
                <div className="bg-white/90 border border-emerald-100 rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Ready</p>
                  <p className="text-2xl font-extrabold text-emerald-600 mt-1">{readyHeroSlidesCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Slides ready to publish</p>
                </div>
                <div className="bg-white/90 border border-emerald-100 rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Product Picks</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1">
                    {selectedFeaturedProducts.length + selectedBestSellers.length + selectedNewArrivals.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Items selected for homepage</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Layout className="w-5 h-5 text-emerald-600" />
                <h3 className="font-display font-extrabold text-2xl text-gray-900">Hero Slider</h3>
              </div>
              <p className="text-sm text-gray-500 mt-1">Manage the sliding hero cards shown on the home page</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                Tip: duplicate similar slides and move them to reorder.
              </div>
              <button
                type="button"
                onClick={expandAllHeroSlides}
                className="px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Expand all
              </button>
              <button
                type="button"
                onClick={collapseAllHeroSlides}
                className="px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Collapse all
              </button>
              <button
                type="button"
                onClick={addHeroSlide}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Add Slide
              </button>
            </div>
          </div>

          <form onSubmit={handleUpdateHeroConfig} className="space-y-6">
            <div className="sticky top-4 z-20">
              <div className="bg-white/95 backdrop-blur border border-emerald-100 rounded-2xl px-4 py-3 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">Homepage content editor</p>
                  <p className="text-xs text-gray-500">Save after editing slides, section copy, product selection, and optional homepage blocks.</p>
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold px-5 py-3 rounded-xl transition-all shadow-md"
                >
                  Save Hero Changes
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
              <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Workspace summary</p>
                    <p className="text-xs text-gray-500 mt-1">Quick status for slides and homepage content.</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {heroWorkspaceSummary.filter(item => item.done).length}/{heroWorkspaceSummary.length} ready
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {heroWorkspaceSummary.map(item => (
                    <div key={item.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-3 py-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900">{item.label}</p>
                        <p className="text-[11px] text-gray-500 mt-1">{item.value}</p>
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full ${item.done ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Quick slide access</p>
                    <p className="text-xs text-gray-500 mt-1">Open only the slide you want to edit.</p>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{heroSlides.length} slides</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {heroSlides.map((slide, idx) => {
                    const slideKey = slide.id || `hero-${idx}`;
                    const isReady = slide.image.trim() && slide.title.trim();
                    const isExpanded = expandedHeroSlides[slideKey] ?? idx === 0;
                    return (
                      <button
                        key={`quick-${slideKey}`}
                        type="button"
                        onClick={() => setExpandedHeroSlides(prev => ({ ...prev, [slideKey]: !isExpanded }))}
                        className={`px-3 py-2 rounded-2xl text-xs font-semibold border transition-colors ${
                          isExpanded
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Slide {idx + 1} {isReady ? '• Ready' : '• Draft'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {heroSlides.map((slide, idx) => {
              const slideKey = slide.id || `hero-${idx}`;
              const isExpanded = expandedHeroSlides[slideKey] ?? idx === 0;
              const isReady = slide.image.trim() && slide.title.trim();

              return (
                <div key={slideKey} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {idx + 1}
                        </div>
                        <div className="space-y-2">
                          <div>
                            <h4 className="font-display font-bold text-sm text-gray-900">Hero Slide {idx + 1}</h4>
                            <p className="text-[10px] text-gray-500">{slide.title || 'Untitled slide'}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              isReady
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {isReady ? 'Ready to publish' : 'Needs image or title'}
                            </span>
                            {slide.tagline.trim() && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-200">
                                Tagline added
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => moveHeroSlide(idx, 'up')}
                          disabled={idx === 0}
                          className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="Move up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveHeroSlide(idx, 'down')}
                          disabled={idx === heroSlides.length - 1}
                          className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="Move down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateHeroSlide(idx)}
                          className="px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold transition-colors flex items-center gap-2"
                        >
                          <Layers className="w-4 h-4" />
                          Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => removeHeroSlide(idx)}
                          disabled={heroSlides.length <= 1}
                          className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="Remove slide"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleHeroSlideExpanded(slideKey)}
                          className="px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold transition-colors flex items-center gap-2"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          {isExpanded ? 'Collapse' : 'Expand'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Preview</label>
                            <div className="aspect-video rounded-2xl overflow-hidden bg-neutral-900 border-2 border-gray-200 shadow-inner relative group">
                              {slide.image ? (
                                <img
                                  src={slide.image}
                                  alt={slide.title || `Hero slide ${idx + 1}`}
                                  className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                                  style={{
                                    objectFit: slide.imageSizing?.objectFit || 'cover',
                                    objectPosition: slide.imageSizing?.objectPosition || 'center'
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-xs text-gray-400 gap-2">
                                  <Upload className="w-8 h-8 opacity-50" />
                                  <span>Image preview</span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent p-4 flex flex-col justify-end">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-white/85 font-bold">
                                  {slide.tagline || 'Tagline'}
                                </span>
                                <p className="text-white font-bold text-lg leading-tight mt-1">
                                  {slide.title || 'Slide title'}
                                </p>
                                <p className="text-white/80 text-xs mt-1 line-clamp-2">
                                  {slide.description || 'Slide description preview'}
                                </p>
                              </div>
                              {slide.image && (
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-lg flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {slide.imageSizing?.objectFit || 'cover'} • {slide.imageSizing?.objectPosition || 'center'}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Editing notes</p>
                            <ul className="space-y-1 text-xs text-gray-600">
                              <li>Keep titles short for better mobile readability.</li>
                              <li>`Cover` usually works best for banner images.</li>
                              <li>Only slides with image and title are saved to the homepage.</li>
                            </ul>
                          </div>
                        </div>

                        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2 sm:col-span-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Image Upload</label>
                            <div className="flex flex-col xl:flex-row gap-3">
                              <div className="flex-1">
                                <div className="relative">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        setSlideImageFiles(prev => ({ ...prev, [idx]: file }));
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          const preview = reader.result as string;
                                          setSlideImagePreviews(prev => ({ ...prev, [idx]: preview }));
                                          updateHeroSlide(idx, 'image', preview);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    className="w-full bg-white border-2 border-dashed border-gray-300 hover:border-emerald-400 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium text-xs transition-colors cursor-pointer"
                                  />
                                  <Upload className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-2">Upload a banner image for this slide.</p>
                              </div>
                              <div className="flex-1">
                                <input
                                  type="url"
                                  value={slide.image && !slideImagePreviews[idx] ? slide.image : ''}
                                  onChange={(e) => {
                                    updateHeroSlide(idx, 'image', e.target.value);
                                    if (e.target.value && !slideImageFiles[idx]) {
                                      setSlideImagePreviews(prev => ({ ...prev, [idx]: e.target.value }));
                                    }
                                  }}
                                  className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium text-xs transition-colors"
                                  placeholder="Or paste image URL..."
                                />
                                <p className="text-[10px] text-gray-500 mt-2">Paste a direct image URL instead of uploading.</p>
                              </div>
                            </div>
                            {slideImageFiles[idx] && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSlideImageFiles(prev => {
                                    const newFiles = { ...prev };
                                    delete newFiles[idx];
                                    return newFiles;
                                  });
                                  setSlideImagePreviews(prev => {
                                    const newPreviews = { ...prev };
                                    delete newPreviews[idx];
                                    return newPreviews;
                                  });
                                  updateHeroSlide(idx, 'image', '');
                                }}
                                className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                              >
                                <X className="w-3 h-3" /> Remove uploaded file
                              </button>
                            )}
                          </div>

                          <div className="space-y-2 sm:col-span-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Image Sizing</label>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[9px] text-gray-500 uppercase tracking-wider block mb-1">Object Fit</label>
                                <select
                                  value={slide.imageSizing?.objectFit || 'cover'}
                                  onChange={(e) => updateHeroSlideSizing(idx, 'objectFit', e.target.value)}
                                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 text-xs transition-colors"
                                >
                                  <option value="cover">Cover (Fill)</option>
                                  <option value="contain">Contain (Fit)</option>
                                  <option value="fill">Fill (Stretch)</option>
                                  <option value="none">None (Original)</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[9px] text-gray-500 uppercase tracking-wider block mb-1">Position</label>
                                <select
                                  value={slide.imageSizing?.objectPosition || 'center'}
                                  onChange={(e) => updateHeroSlideSizing(idx, 'objectPosition', e.target.value)}
                                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 text-xs transition-colors"
                                >
                                  <option value="center">Center</option>
                                  <option value="top">Top</option>
                                  <option value="bottom">Bottom</option>
                                  <option value="left">Left</option>
                                  <option value="right">Right</option>
                                  <option value="top left">Top Left</option>
                                  <option value="top right">Top Right</option>
                                  <option value="bottom left">Bottom Left</option>
                                  <option value="bottom right">Bottom Right</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tagline</label>
                            <input
                              type="text"
                              value={slide.tagline}
                              onChange={(e) => updateHeroSlide(idx, 'tagline', e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-bold text-xs transition-colors"
                              placeholder="BRAND NEW EXPANSION"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Title *</label>
                            <input
                              type="text"
                              value={slide.title}
                              onChange={(e) => updateHeroSlide(idx, 'title', e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-bold text-xs transition-colors"
                              placeholder="The Golden Ratio Collection"
                              required
                            />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Description</label>
                            <textarea
                              value={slide.description}
                              onChange={(e) => updateHeroSlide(idx, 'description', e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium text-xs min-h-[84px] resize-none transition-colors"
                              placeholder="Short copy for the hero slide..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="bg-white border border-gray-200 rounded-3xl p-3 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'sections', label: 'Section Copy', icon: Tag },
                  { id: 'promos', label: 'Promo Cards', icon: Percent },
                  { id: 'products', label: 'Product Picks', icon: ShoppingBag },
                  { id: 'newsletter', label: 'Newsletter', icon: Mail },
                  { id: 'brands', label: 'Brands', icon: Award }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = heroEditorTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setHeroEditorTab(tab.id as 'sections' | 'promos' | 'products' | 'newsletter' | 'brands')}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {heroEditorTab === 'sections' && (
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 p-6 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Tag className="w-4 h-4 text-emerald-600" />
                <h4 className="font-display font-bold text-sm text-gray-900">Section Copy</h4>
              </div>
              <p className="text-xs text-gray-500">Edit the heading and short intro text that shoppers see above each homepage product block.</p>
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">How to use this</p>
                <p className="text-xs text-blue-900 mt-1">
                  `Title` is the main heading. `Description` is the smaller supporting sentence underneath it.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['trending', 'featured', 'bestSellers', 'newArrivals'] as const).map(section => (
                  <div key={section} className="space-y-3 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        {homeSectionMeta[section].name}
                      </label>
                      <span className="text-[9px] text-gray-400">
                        {homeContent[section].title.length + homeContent[section].description.length} chars
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">{homeSectionMeta[section].purpose}</p>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-gray-500">Section title</label>
                    <input
                      type="text"
                      value={homeContent[section].title}
                      onChange={(e) => updateHomeSection(section, 'title', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-bold text-xs transition-colors"
                      placeholder={homeSectionMeta[section].titlePlaceholder}
                    />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-gray-500">Section description</label>
                    <textarea
                      value={homeContent[section].description}
                      onChange={(e) => updateHomeSection(section, 'description', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium text-xs min-h-[72px] resize-none transition-colors"
                      placeholder={homeSectionMeta[section].descriptionPlaceholder}
                    />
                    </div>
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/70 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Homepage preview</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{homeContent[section].title || 'Section title'}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{homeContent[section].description || 'Section description'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}

            {heroEditorTab === 'promos' && (
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 p-6 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Percent className="w-4 h-4 text-emerald-600" />
                <h4 className="font-display font-bold text-sm text-gray-900">Promotional Cards</h4>
              </div>
              <p className="text-xs text-gray-500">Edit the small marketing cards shown on the homepage. Each card has a label, headline, short message, and button.</p>
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">What each field means</p>
                <p className="text-xs text-blue-900 mt-1">
                  `Eyebrow` is the small top label, `Title` is the main message, `Description` gives extra detail, and the button fields control the call to action.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {homeContent.promoCards.slice(0, 2).map((card, idx) => (
                  <div key={card.id || idx} className="space-y-3 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                    <div className={`rounded-2xl p-4 text-white ${card.accent === 'amber' ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
                      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/80">{card.eyebrow || 'Eyebrow'}</p>
                      <p className="text-lg font-extrabold mt-2">{card.title || `Promo ${idx + 1}`}</p>
                      <p className="text-xs text-white/85 mt-2 line-clamp-2">{card.description || 'Promo description preview'}</p>
                      <div className="inline-flex mt-3 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold">
                        {card.buttonText || 'Button text'}
                      </div>
                    </div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Promo card {idx + 1}</label>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-gray-500">Card color</label>
                    <select
                      value={card.accent}
                      onChange={(e) => updatePromoCard(idx, 'accent', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-bold text-xs transition-colors"
                    >
                      <option value="emerald">Emerald</option>
                      <option value="amber">Amber</option>
                    </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-gray-500">Top label</label>
                    <input
                      type="text"
                      value={card.eyebrow}
                      onChange={(e) => updatePromoCard(idx, 'eyebrow', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-bold text-xs transition-colors"
                      placeholder="For example: Limited offer"
                    />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-gray-500">Main title</label>
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => updatePromoCard(idx, 'title', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-bold text-xs transition-colors"
                      placeholder="For example: Save 20% this week"
                    />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-gray-500">Supporting text</label>
                    <textarea
                      value={card.description}
                      onChange={(e) => updatePromoCard(idx, 'description', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium text-xs min-h-[72px] resize-none transition-colors"
                      placeholder="Explain the offer or why shoppers should click."
                    />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-500">Button text</label>
                        <input
                          type="text"
                          value={card.buttonText}
                          onChange={(e) => updatePromoCard(idx, 'buttonText', e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-bold text-xs transition-colors"
                          placeholder="For example: Shop now"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-500">Button link</label>
                        <input
                          type="text"
                          value={card.buttonUrl}
                          onChange={(e) => updatePromoCard(idx, 'buttonUrl', e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-bold text-xs transition-colors"
                          placeholder="For example: /catalog"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}

            {heroEditorTab === 'products' && (
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 p-6 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <h4 className="font-display font-bold text-sm text-gray-900">Product Selection</h4>
              </div>
              <p className="text-xs text-gray-500">Pick up to 4 products for each homepage section.</p>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={heroProductSearch}
                  onChange={(e) => setHeroProductSearch(e.target.value)}
                  placeholder="Search products by name, brand, or category..."
                  className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-3 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Featured Products</label>
                    <span className="text-[9px] text-emerald-600 font-semibold">{selectedFeaturedProducts.length}/4</span>
                  </div>
                  {selectedFeaturedProducts.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedFeaturedProducts.map(id => {
                        const product = products.find(p => p.id === id);
                        if (!product) return null;
                        return <span key={id} className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">{product.name}</span>;
                      })}
                    </div>
                  )}
                  <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                    {homepageSelectableProducts.map(p => (
                      <label key={p.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedFeaturedProducts.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (selectedFeaturedProducts.length < 4) {
                                setSelectedFeaturedProducts([...selectedFeaturedProducts, p.id]);
                              }
                            } else {
                              setSelectedFeaturedProducts(selectedFeaturedProducts.filter(id => id !== p.id));
                            }
                          }}
                          disabled={!selectedFeaturedProducts.includes(p.id) && selectedFeaturedProducts.length >= 4}
                          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                          <p className="text-[9px] text-gray-500">{p.brand}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Best Sellers</label>
                    <span className="text-[9px] text-emerald-600 font-semibold">{selectedBestSellers.length}/4</span>
                  </div>
                  {selectedBestSellers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedBestSellers.map(id => {
                        const product = products.find(p => p.id === id);
                        if (!product) return null;
                        return <span key={id} className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">{product.name}</span>;
                      })}
                    </div>
                  )}
                  <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                    {homepageSelectableProducts.map(p => (
                      <label key={p.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedBestSellers.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (selectedBestSellers.length < 4) {
                                setSelectedBestSellers([...selectedBestSellers, p.id]);
                              }
                            } else {
                              setSelectedBestSellers(selectedBestSellers.filter(id => id !== p.id));
                            }
                          }}
                          disabled={!selectedBestSellers.includes(p.id) && selectedBestSellers.length >= 4}
                          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                          <p className="text-[9px] text-gray-500">{p.brand}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">New Arrivals</label>
                    <span className="text-[9px] text-emerald-600 font-semibold">{selectedNewArrivals.length}/4</span>
                  </div>
                  {selectedNewArrivals.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedNewArrivals.map(id => {
                        const product = products.find(p => p.id === id);
                        if (!product) return null;
                        return <span key={id} className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">{product.name}</span>;
                      })}
                    </div>
                  )}
                  <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                    {homepageSelectableProducts.map(p => (
                      <label key={p.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedNewArrivals.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (selectedNewArrivals.length < 4) {
                                setSelectedNewArrivals([...selectedNewArrivals, p.id]);
                              }
                            } else {
                              setSelectedNewArrivals(selectedNewArrivals.filter(id => id !== p.id));
                            }
                          }}
                          disabled={!selectedNewArrivals.includes(p.id) && selectedNewArrivals.length >= 4}
                          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                          <p className="text-[9px] text-gray-500">{p.brand}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            )}

            {heroEditorTab === 'newsletter' && (
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 p-6 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4 text-emerald-600" />
                <h4 className="font-display font-bold text-sm text-gray-900">Newsletter Configuration</h4>
              </div>
              <p className="text-xs text-gray-500">Control whether the newsletter block appears on the homepage.</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4">
                    <input
                      type="checkbox"
                      id="newsletter-enabled"
                      checked={newsletterEnabled}
                      onChange={(e) => setNewsletterEnabled(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="newsletter-enabled" className="text-sm font-medium text-gray-700">Enable Newsletter Section</label>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Title</label>
                    <input
                      type="text"
                      value={newsletterTitle}
                      onChange={(e) => setNewsletterTitle(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-bold text-xs transition-colors"
                      placeholder="Get Exclusive Deals"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Description</label>
                    <textarea
                      value={newsletterDescription}
                      onChange={(e) => setNewsletterDescription(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium text-xs min-h-[72px] resize-none transition-colors"
                      placeholder="Subscribe to our newsletter..."
                    />
                  </div>
                </div>
                <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">Preview</p>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${newsletterEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {newsletterEnabled ? 'Enabled' : 'Hidden'}
                    </span>
                  </div>
                  <div className="mt-4 rounded-2xl bg-white border border-emerald-100 p-5 shadow-sm">
                    <p className="text-xl font-extrabold text-gray-900">{newsletterTitle || 'Newsletter title'}</p>
                    <p className="text-sm text-gray-500 mt-2">{newsletterDescription || 'Newsletter description preview'}</p>
                    <div className="mt-4 flex gap-2">
                      <div className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-400">Enter your email</div>
                      <div className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white">Subscribe</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {heroEditorTab === 'brands' && (
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 p-6 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-emerald-600" />
                <h4 className="font-display font-bold text-sm text-gray-900">Brand Showcase</h4>
              </div>
              <p className="text-xs text-gray-500">Add the brand names you want highlighted on the homepage.</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4">
                    <input
                      type="checkbox"
                      id="brand-showcase-enabled"
                      checked={brandShowcaseEnabled}
                      onChange={(e) => setBrandShowcaseEnabled(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="brand-showcase-enabled" className="text-sm font-medium text-gray-700">Enable Brand Showcase</label>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Brand Names</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {brandNames.map((brand, idx) => (
                        <div key={idx} className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-700">{brand}</span>
                          <button
                            type="button"
                            onClick={() => setBrandNames(prev => prev.filter((_, i) => i !== idx))}
                            className="text-emerald-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium text-xs transition-colors"
                        placeholder="Add brand name..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newBrandName.trim()) {
                            e.preventDefault();
                            setBrandNames(prev => [...prev, newBrandName.trim().toUpperCase()]);
                            setNewBrandName('');
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newBrandName.trim()) {
                            setBrandNames(prev => [...prev, newBrandName.trim().toUpperCase()]);
                            setNewBrandName('');
                          }
                        }}
                        className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-5 py-3 rounded-xl text-xs font-semibold transition-all shadow-md"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">Preview</p>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${brandShowcaseEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {brandShowcaseEnabled ? 'Enabled' : 'Hidden'}
                    </span>
                  </div>
                  <div className="mt-4 rounded-2xl bg-white border border-emerald-100 p-5 shadow-sm">
                    <p className="text-sm font-bold text-gray-900">Brand row preview</p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {brandNames.length > 0 ? brandNames.map((brand, idx) => (
                        <span key={`${brand}-${idx}`} className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700">
                          {brand}
                        </span>
                      )) : (
                        <span className="text-xs text-gray-400">No brands added yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            <div className="flex justify-end">
              <button type="submit" className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold text-sm px-6 py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Save Home Page Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 8. NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="space-y-6 text-left">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-gray-900">Notification Center</h2>
              <p className="text-xs text-gray-500 mt-1">Create and send notifications to users or broadcast announcements</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <Bell className="w-3 h-3 text-blue-600" />
                <span className="text-[10px] font-semibold text-blue-700">{notificationHistory.length} Sent</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Notification Form */}
            <form onSubmit={handleSendNotification} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200/60 p-5 rounded-3xl shadow-xl shadow-gray-200/50 space-y-5 h-fit">

              {/* Recipient Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-gray-600" />
                  <h4 className="font-display font-bold text-sm text-gray-800 uppercase tracking-wider">Target Audience</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className={`relative cursor-pointer transition-all duration-300 ${notifRecipient === 'broadcast' ? 'scale-105' : ''}`}>
                    <input
                      type="radio"
                      name="recipient"
                      value="broadcast"
                      checked={notifRecipient === 'broadcast'}
                      onChange={() => setNotifRecipient('broadcast')}
                      className="sr-only"
                    />
                    <div className={`p-5 rounded-2xl border-2 transition-all duration-300 ${notifRecipient === 'broadcast'
                        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-500 shadow-lg shadow-blue-200'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${notifRecipient === 'broadcast' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">Broadcast to All</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Send to every user</p>
                        </div>
                      </div>
                    </div>
                  </label>
                  <label className={`relative cursor-pointer transition-all duration-300 ${notifRecipient === 'specific' ? 'scale-105' : ''}`}>
                    <input
                      type="radio"
                      name="recipient"
                      value="specific"
                      checked={notifRecipient === 'specific'}
                      onChange={() => setNotifRecipient('specific')}
                      className="sr-only"
                    />
                    <div className={`p-5 rounded-2xl border-2 transition-all duration-300 ${notifRecipient === 'specific'
                        ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-500 shadow-lg shadow-purple-200'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${notifRecipient === 'specific' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">Specific User</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Send to individual</p>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>

                {notifRecipient === 'specific' && (
                  <div className="space-y-2 mt-4 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Select Recipient</label>
                    <select
                      value={notifUserId}
                      onChange={(e) => setNotifUserId(e.target.value)}
                      className="w-full bg-white border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 font-medium text-sm transition-all"
                      required
                    >
                      <option value="">Choose a user from the list...</option>
                      {adminUsers.filter(u => u.role !== 'admin' && u.role !== 'super-admin').map(u => (
                        <option key={u.id} value={u.id} className="py-2">
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Notification Type */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-gray-600" />
                  <h4 className="font-display font-bold text-sm text-gray-800 uppercase tracking-wider">Notification Type</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['info', 'success', 'warning', 'promotion'] as const).map(type => (
                    <label key={type} className={`cursor-pointer transition-all duration-300 ${notifType === type ? 'scale-105' : ''}`}>
                      <input
                        type="radio"
                        name="type"
                        value={type}
                        checked={notifType === type}
                        onChange={() => setNotifType(type)}
                        className="sr-only"
                      />
                      <div className={`px-4 py-4 rounded-2xl border-2 text-center font-bold text-xs transition-all ${notifType === type
                          ? type === 'info' ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-500 text-white shadow-lg shadow-blue-200'
                            : type === 'success' ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-500 text-white shadow-lg shadow-green-200'
                              : type === 'warning' ? 'bg-gradient-to-br from-amber-500 to-orange-600 border-amber-500 text-white shadow-lg shadow-amber-200'
                                : 'bg-gradient-to-br from-purple-500 to-pink-600 border-purple-500 text-white shadow-lg shadow-purple-200'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }`}>
                        <div className="flex flex-col items-center gap-2">
                          {type === 'info' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                          {type === 'success' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                          {type === 'warning' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                          {type === 'promotion' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>}
                          <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notification Content */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Edit2 className="w-4 h-4 text-gray-600" />
                  <h4 className="font-display font-bold text-sm text-gray-800 uppercase tracking-wider">Message Content</h4>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Title</label>
                    <input
                      type="text"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      className="w-full bg-white border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:border-black focus:ring-4 focus:ring-gray-100 font-bold text-sm transition-all"
                      placeholder="Enter an attention-grabbing title..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Message</label>
                    <textarea
                      value={notifMessage}
                      onChange={(e) => setNotifMessage(e.target.value)}
                      className="w-full bg-white border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:border-black focus:ring-4 focus:ring-gray-100 font-medium text-sm min-h-[120px] resize-none transition-all"
                      placeholder="Write your notification message here..."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email Notification Option */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={notifSendEmail}
                      onChange={(e) => setNotifSendEmail(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-6 h-6 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${notifSendEmail ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-500' : 'border-gray-300 group-hover:border-gray-400'}`}>
                      {notifSendEmail && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-900">Send Email Notification</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {notifRecipient === 'broadcast' ? 'Send email to all users' : 'Send email to this user'}
                    </p>
                  </div>
                </label>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white font-bold text-sm px-6 py-4 rounded-xl transition-all duration-300 shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/30 flex items-center justify-center gap-2">
                <Bell className="w-4 h-4" />
                Send Notification
              </button>
            </form>

            {/* Right: Notification History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-display font-extrabold text-sm text-gray-800 uppercase tracking-wider">Recent Notifications</h3>
                </div>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  {notificationHistory.length} total
                </span>
              </div>
              <div className="bg-white border border-gray-200/60 rounded-3xl overflow-hidden shadow-lg shadow-gray-200/50">
                {notificationHistory.length === 0 ? (
                  <div className="p-8 text-center space-y-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                      <Bell className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-400">No notifications sent yet</p>
                    <p className="text-xs text-gray-400">Your notification history will appear here</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {paginatedNotifications.map(notif => (
                      <div key={notif.id} className="p-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${notif.type === 'info' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                              : notif.type === 'success' ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                                : notif.type === 'warning' ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                                  : 'bg-gradient-to-br from-purple-500 to-pink-600 text-white'
                            }`}>
                            {notif.type === 'info' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            {notif.type === 'success' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            {notif.type === 'warning' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                            {notif.type === 'promotion' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${notif.type === 'info' ? 'bg-blue-100 text-blue-700'
                                  : notif.type === 'success' ? 'bg-green-100 text-green-700'
                                    : notif.type === 'warning' ? 'bg-amber-100 text-amber-700'
                                      : 'bg-purple-100 text-purple-700'
                                }`}>
                                {notif.type}
                              </span>
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {new Date(notif.date).toLocaleString()}
                              </span>
                            </div>
                            <p className="font-bold text-gray-900 text-sm mb-1">{notif.title}</p>
                            <p className="text-xs text-gray-600 leading-relaxed">{notif.message}</p>
                            {notif.userId && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <p className="text-[10px] text-gray-500 font-medium">
                                  {adminUsers.find(u => u.id === notif.userId)?.name || notif.userId}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Pagination
                currentPage={notificationsPage}
                totalPages={notificationsTotalPages}
                onPageChange={setNotificationsPage}
              />
            </div>
          </div>
        </div>
            )}

      {/* 9. NEWSLETTER MANAGEMENT */}
      {activeTab === 'newsletter' && (
        <div className="space-y-6 text-left">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-gray-900">Newsletter Subscribers</h2>
              <p className="text-xs text-gray-500 mt-1">Manage newsletter subscriptions and send newsletters to subscribers</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <Mail className="w-3 h-3 text-emerald-600" />
                <span className="text-[10px] font-semibold text-emerald-700">{newsletters.filter(n => n.status === 'active').length} Active</span>
              </div>
              <div className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span className="text-[10px] font-semibold text-gray-600">{newsletters.length} Total</span>
              </div>
              <div className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span className="text-[10px] font-semibold text-red-600">{newsletters.filter(n => n.status === 'unsubscribed').length} Unsubscribed</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Send Newsletter Form */}
            <form onSubmit={sendNewsletter} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200/60 p-5 rounded-3xl shadow-xl shadow-gray-200/50 space-y-5 h-fit">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-gray-600" />
                <h4 className="font-display font-bold text-sm text-gray-800 uppercase tracking-wider">Send Newsletter</h4>
              </div>
              
              {/* Template Selection */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Quick Templates</label>
                <div className="grid grid-cols-2 gap-2">
                  {newsletterTemplates.map(template => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => handleTemplateSelect(template.id)}
                      disabled={isSendingNewsletter}
                      className="p-3 rounded-xl border-2 text-left transition-all border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <p className="font-bold text-xs">{template.name}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Subject</label>
                  <input
                    type="text"
                    value={newsletterSubject}
                    onChange={(e) => setNewsletterSubject(e.target.value)}
                    placeholder="Newsletter subject..."
                    disabled={isSendingNewsletter}
                    className="w-full bg-white border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Content</label>
                  <textarea
                    value={newsletterContent}
                    onChange={(e) => setNewsletterContent(e.target.value)}
                    placeholder="Write your newsletter content here..."
                    disabled={isSendingNewsletter}
                    rows={6}
                    className="w-full bg-white border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 font-medium text-sm transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePreviewNewsletter}
                  disabled={!newsletterSubject.trim() || !newsletterContent.trim() || isSendingNewsletter}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs px-5 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  type="submit"
                  disabled={isSendingNewsletter || newsletters.filter(n => n.status === 'active').length === 0}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold text-xs px-5 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2"
                >
                  {isSendingNewsletter ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send to {newsletters.filter(n => n.status === 'active').length}
                    </>
                  )}
                </button>
              </div>

              {newsletters.filter(n => n.status === 'active').length === 0 && (
                <p className="text-[10px] text-amber-600 text-center">No active subscribers to send to</p>
              )}
            </form>

            {/* Right: Newsletter List */}
            <div className="bg-white border border-gray-200/60 rounded-3xl overflow-hidden shadow-xl shadow-gray-200/50">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-display font-bold text-sm text-gray-800 uppercase tracking-wider">Subscriber List</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAddSubscriber(true)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <PlusCircle className="w-3 h-3" />
                      Add
                    </button>
                    <button
                      onClick={handleExportSubscribers}
                      disabled={newsletters.length === 0}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      Export
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search by email..."
                      value={newsletterSearch}
                      onChange={(e) => setNewsletterSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <select
                    value={newsletterStatusFilter}
                    onChange={(e) => setNewsletterStatusFilter(e.target.value as any)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-all"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="unsubscribed">Unsubscribed</option>
                  </select>
                </div>
              </div>
              {newsletters.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                    <Mail className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-400">No newsletter subscribers yet</p>
                  <p className="text-xs text-gray-400">Subscribers will appear here when they sign up</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                  {newsletters
                    .filter(n => {
                      const matchesSearch = newsletterSearch === '' || n.email.toLowerCase().includes(newsletterSearch.toLowerCase());
                      const matchesStatus = newsletterStatusFilter === 'all' || n.status === newsletterStatusFilter;
                      return matchesSearch && matchesStatus;
                    })
                    .map(newsletter => (
                    <div key={newsletter.id} className="p-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-300">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${newsletter.status === 'active' ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                            <Mail className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-bold text-gray-900 text-xs truncate">{newsletter.email}</p>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${newsletter.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                {newsletter.status}
                              </span>
                            </div>
                            <p className="text-[9px] text-gray-400 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {new Date(newsletter.subscribedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {newsletter.status === 'active' ? (
                            <button
                              onClick={() => updateNewsletterStatus(newsletter.id, 'unsubscribed')}
                              className="p-1.5 hover:bg-amber-50 rounded-lg transition-colors group"
                              title="Mark as unsubscribed"
                            >
                              <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              onClick={() => updateNewsletterStatus(newsletter.id, 'active')}
                              className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors group"
                              title="Mark as active"
                            >
                              <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => deleteNewsletter(newsletter.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group"
                            title="Delete subscriber"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Subscriber Modal */}
      {showAddSubscriber && (
        <div className="fixed top-2/3 right-4 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 w-[400px] max-h-[80vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-2xl z-10">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-gray-900">Add Subscriber</h3>
              <button
                onClick={() => setShowAddSubscriber(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-4 pb-6">
            <form onSubmit={handleAddSubscriber} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Email Address</label>
                <input
                  type="email"
                  value={newSubscriberEmail}
                  onChange={(e) => setNewSubscriberEmail(e.target.value)}
                  placeholder="subscriber@example.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 font-medium text-sm"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubscriber(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Add Subscriber
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Newsletter Preview Modal */}
      {showPreview && (
        <div className="fixed top-2/3 right-4 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 w-[600px] max-h-[80vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-2xl z-10">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-gray-900">Newsletter Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-4 pb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="border-b border-gray-200 pb-4">
                <h4 className="font-display font-bold text-lg text-gray-900">{previewSubject || 'No Subject'}</h4>
                <p className="text-xs text-gray-400 mt-1">From: ModernShop Team</p>
              </div>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">{previewContent || 'No content'}</pre>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                }}
                disabled={isSendingNewsletter || newsletters.filter(n => n.status === 'active').length === 0}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Newsletter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. REPORTS GENERATION */}
      {activeTab === 'reports' && (
        <div className="space-y-8 text-left">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-gray-900">Reports Dashboard</h2>
              <p className="text-xs text-gray-500 mt-1">Generate comprehensive sales, inventory, and customer reports with advanced analytics</p>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-5 text-white shadow-2xl shadow-gray-900/50 hover:shadow-3xl hover:shadow-gray-900/70 transition-all duration-500 group overflow-hidden border border-white/5 hover:border-white/10">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/3 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
              <div className="relative flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-white/25 to-white/5 rounded-xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-6 group-hover:from-white/35 group-hover:to-white/10 transition-all duration-500 backdrop-blur-md border border-white/15 shadow-lg group-hover:shadow-xl group-hover:shadow-white/20">
                  <TrendingUp className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-500" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400/50 animate-pulse delay-100" />
                </div>
              </div>
              <span className="relative text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors duration-300">Total Revenue</span>
              <p className="relative text-2xl font-extrabold text-white mt-1 group-hover:tracking-wide transition-all duration-300">₹{adminStats?.revenue?.toLocaleString() || '0'}</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:h-1.5 transition-all duration-300" />
            </div>
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-5 text-white shadow-2xl shadow-gray-900/50 hover:shadow-3xl hover:shadow-gray-900/70 transition-all duration-500 group overflow-hidden border border-white/5 hover:border-white/10">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/3 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
              <div className="relative flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-white/25 to-white/5 rounded-xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-6 group-hover:from-white/35 group-hover:to-white/10 transition-all duration-500 backdrop-blur-md border border-white/15 shadow-lg group-hover:shadow-xl group-hover:shadow-white/20">
                  <ShoppingBag className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-500" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-lg shadow-blue-400/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400/50 animate-pulse delay-100" />
                </div>
              </div>
              <span className="relative text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors duration-300">Total Orders</span>
              <p className="relative text-2xl font-extrabold text-white mt-1 group-hover:tracking-wide transition-all duration-300">{adminStats?.ordersCount || '0'}</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:h-1.5 transition-all duration-300" />
            </div>
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-5 text-white shadow-2xl shadow-gray-900/50 hover:shadow-3xl hover:shadow-gray-900/70 transition-all duration-500 group overflow-hidden border border-white/5 hover:border-white/10">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/3 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
              <div className="relative flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-white/25 to-white/5 rounded-xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-6 group-hover:from-white/35 group-hover:to-white/10 transition-all duration-500 backdrop-blur-md border border-white/15 shadow-lg group-hover:shadow-xl group-hover:shadow-white/20">
                  <Users className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-500" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-lg shadow-purple-400/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50 animate-pulse delay-100" />
                </div>
              </div>
              <span className="relative text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors duration-300">Customers</span>
              <p className="relative text-2xl font-extrabold text-white mt-1 group-hover:tracking-wide transition-all duration-300">{adminStats?.usersCount || '0'}</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:h-1.5 transition-all duration-300" />
            </div>
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-5 text-white shadow-2xl shadow-gray-900/50 hover:shadow-3xl hover:shadow-gray-900/70 transition-all duration-500 group overflow-hidden border border-white/5 hover:border-white/10">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/3 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
              <div className="relative flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-white/25 to-white/5 rounded-xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-6 group-hover:from-white/35 group-hover:to-white/10 transition-all duration-500 backdrop-blur-md border border-white/15 shadow-lg group-hover:shadow-xl group-hover:shadow-white/20">
                  <Package className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-500" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shadow-lg shadow-orange-400/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400/50 animate-pulse delay-100" />
                </div>
              </div>
              <span className="relative text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors duration-300">Products</span>
              <p className="relative text-2xl font-extrabold text-white mt-1 group-hover:tracking-wide transition-all duration-300">{adminStats?.productsCount || '0'}</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:h-1.5 transition-all duration-300" />
            </div>
          </div>

          {/* Report Configuration */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
            {/* Report Type Selection - Visual Cards */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Select Report Type</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setReportType('sales')}
                  className={`p-5 rounded-2xl border-2 transition-all duration-300 ${reportType === 'sales' ? 'border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-900/20' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${reportType === 'sales' ? 'bg-white/20' : 'bg-gray-100'}`}>
                      <TrendingUp className={`w-5 h-5 ${reportType === 'sales' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">Sales Report</p>
                      <p className={`text-[10px] ${reportType === 'sales' ? 'text-gray-300' : 'text-gray-500'}`}>Revenue, orders & trends</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setReportType('inventory')}
                  className={`p-5 rounded-2xl border-2 transition-all duration-300 ${reportType === 'inventory' ? 'border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-900/20' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${reportType === 'inventory' ? 'bg-white/20' : 'bg-gray-100'}`}>
                      <Package className={`w-5 h-5 ${reportType === 'inventory' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">Inventory Report</p>
                      <p className={`text-[10px] ${reportType === 'inventory' ? 'text-gray-300' : 'text-gray-500'}`}>Stock levels & health</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setReportType('customers')}
                  className={`p-5 rounded-2xl border-2 transition-all duration-300 ${reportType === 'customers' ? 'border-gray-900 bg-gray-900 text-white shadow-lg shadow-gray-900/20' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${reportType === 'customers' ? 'bg-white/20' : 'bg-gray-100'}`}>
                      <UserCircle className={`w-5 h-5 ${reportType === 'customers' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">Customer Report</p>
                      <p className={`text-[10px] ${reportType === 'customers' ? 'text-gray-300' : 'text-gray-500'}`}>Segments & behavior</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Date Range & Format */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  Date Range
                </label>
                <div className="flex gap-2">
                  {[
                    { value: '7d', label: '7 Days' },
                    { value: '30d', label: '30 Days' },
                    { value: '90d', label: '90 Days' },
                    { value: 'all', label: 'All Time' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDateRange(option.value as any)}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${dateRange === option.value ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-2">
                  <Download className="w-3 h-3" />
                  Export Format
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'json', label: 'JSON' },
                    { value: 'csv', label: 'CSV' },
                    { value: 'excel', label: 'Excel' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setReportFormat(option.value as any)}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${reportFormat === option.value ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setAdvancedFilters({...advancedFilters, category: advancedFilters.category === 'all' ? 'electronics' : 'all'})}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2"
                >
                  <ListFilter className="w-3 h-3" />
                  {advancedFilters.category === 'all' ? 'Show Advanced Filters' : 'Hide Advanced Filters'}
                </button>
                
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer bg-gray-50 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all">
                    <input
                      type="checkbox"
                      checked={comparePeriod}
                      onChange={(e) => setComparePeriod(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                    />
                    <span>Compare Period</span>
                  </label>
                  
                  <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer bg-gray-50 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all">
                    <input
                      type="checkbox"
                      checked={scheduleReport}
                      onChange={(e) => setScheduleReport(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                    />
                    <span>Schedule Report</span>
                  </label>
                </div>
              </div>
              
              {advancedFilters.category !== 'all' && (
                <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
                  <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <ListFilter className="w-3 h-3" />
                    Filter Options
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {reportType === 'sales' && (
                      <>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Status</label>
                          <select
                            value={advancedFilters.status}
                            onChange={(e) => setAdvancedFilters({...advancedFilters, status: e.target.value})}
                            className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-gray-900 text-xs font-semibold transition-all"
                          >
                            <option value="all">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Payment Method</label>
                          <select
                            value={advancedFilters.paymentMethod}
                            onChange={(e) => setAdvancedFilters({...advancedFilters, paymentMethod: e.target.value})}
                            className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-gray-900 text-xs font-semibold transition-all"
                          >
                            <option value="all">All Methods</option>
                            <option value="Cash on Delivery">Cash on Delivery</option>
                            <option value="Stripe Credit Card">Credit Card</option>
                            <option value="UPI">UPI</option>
                          </select>
                        </div>
                      </>
                    )}
                    {reportType === 'inventory' && (
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Stock Status</label>
                        <select
                          value={advancedFilters.status}
                          onChange={(e) => setAdvancedFilters({...advancedFilters, status: e.target.value})}
                          className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-gray-900 text-xs font-semibold transition-all"
                        >
                          <option value="all">All Products</option>
                          <option value="low">Low Stock</option>
                          <option value="out">Out of Stock</option>
                          <option value="healthy">Healthy Stock</option>
                        </select>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Min Amount</label>
                      <input
                        type="number"
                        value={advancedFilters.minAmount}
                        onChange={(e) => setAdvancedFilters({...advancedFilters, minAmount: e.target.value})}
                        placeholder="Min"
                        className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-gray-900 text-xs font-semibold transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Max Amount</label>
                      <input
                        type="number"
                        value={advancedFilters.maxAmount}
                        onChange={(e) => setAdvancedFilters({...advancedFilters, maxAmount: e.target.value})}
                        placeholder="Max"
                        className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-gray-900 text-xs font-semibold transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule Report Section */}
              {scheduleReport && (
                <div className="mt-4 p-5 bg-gray-50 rounded-2xl border-2 border-gray-200">
                  <h5 className="font-bold text-xs text-gray-700 mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-900" />
                    Schedule Report
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Frequency</label>
                      <div className="flex gap-2">
                        {[
                          { value: 'daily', label: 'Daily' },
                          { value: 'weekly', label: 'Weekly' },
                          { value: 'monthly', label: 'Monthly' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setScheduleFrequency(option.value as any)}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${scheduleFrequency === option.value ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300'}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Email (Optional)</label>
                      <input
                        type="email"
                        value={scheduleEmail}
                        onChange={(e) => setScheduleEmail(e.target.value)}
                        placeholder="admin@example.com"
                        className="w-full bg-white border-2 border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-gray-900 text-xs font-semibold transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={generateReport}
              disabled={isGeneratingReport}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm px-6 py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-900/20 hover:shadow-xl shadow-gray-900/30 flex items-center justify-center gap-3"
            >
              {isGeneratingReport ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating Report...</span>
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5" />
                  <span>Generate Report</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Report Results */}
          {reportData && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-gray-900 px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-white uppercase tracking-wider flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-white" />
                      {reportData.reportType}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      Generated: {new Date(reportData.generatedAt).toLocaleString()} | Range: {reportData.dateRange}
                    </p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <h4 className="font-display font-bold text-xs text-gray-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-900" />
                  Key Metrics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(reportData.summary).map(([key, value]) => {
                    const isMonetary = key.includes('Amount') || key.includes('Value') || key.includes('Spent') || key.includes('Revenue');
                    
                    return (
                      <div key={key} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{key}</p>
                        <p className="text-xl font-extrabold text-gray-900 mt-2">
                          {typeof value === 'number' ? (isMonetary ? `₹${value.toLocaleString()}` : value.toLocaleString()) : JSON.stringify(value)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Visual Charts Section */}
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <h4 className="font-display font-bold text-xs text-gray-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gray-900" />
                  Visual Analytics
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bar Chart for Status Breakdown */}
                  {reportData.summary.statusBreakdown && (
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <h5 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-gray-900" />
                        Order Status Distribution
                      </h5>
                      <div className="space-y-3">
                        {Object.entries(reportData.summary.statusBreakdown).map(([status, count]) => {
                          const maxCount = Math.max(...Object.values(reportData.summary.statusBreakdown) as number[]);
                          const percentage = (count as number / maxCount) * 100;
                          const colors: Record<string, string> = {
                            'Pending': 'bg-gray-400',
                            'Processing': 'bg-gray-500',
                            'Shipped': 'bg-gray-600',
                            'Delivered': 'bg-gray-700',
                            'Cancelled': 'bg-gray-800'
                          };
                          return (
                            <div key={status} className="flex items-center gap-3">
                              <span className="text-[11px] font-semibold text-gray-700 w-28 truncate">{status}</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${colors[status] || 'bg-gray-400'}`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-bold text-gray-800 w-10 text-right">{count as number}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pie Chart for Customer Breakdown */}
                  {reportData.summary.customerBreakdown && (
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <h5 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-900" />
                        Customer Segments
                      </h5>
                      <div className="space-y-3">
                        {Object.entries(reportData.summary.customerBreakdown).map(([segment, count]) => {
                          const total = Object.values(reportData.summary.customerBreakdown as Record<string, number>).reduce((sum: number, val) => sum + val, 0);
                          const percentage = ((count as number) / total) * 100;
                          const colors: Record<string, string> = {
                            'newCustomers': 'bg-gray-400',
                            'oneTimeCustomers': 'bg-gray-500',
                            'repeatCustomers': 'bg-gray-600'
                          };
                          const labels: Record<string, string> = {
                            'newCustomers': 'New Customers',
                            'oneTimeCustomers': 'One-time Buyers',
                            'repeatCustomers': 'Repeat Buyers'
                          };
                          return (
                            <div key={segment} className="flex items-center gap-3">
                              <span className="text-[11px] font-semibold text-gray-700 w-32 truncate">{labels[segment] || segment}</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${colors[segment] || 'bg-gray-400'}`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-bold text-gray-800 w-12 text-right">{percentage.toFixed(0)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Inventory Health Chart */}
                  {reportData.summary.lowStockProducts !== undefined && (
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <h5 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-900" />
                        Inventory Health
                      </h5>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-semibold text-gray-700 w-28">Low Stock</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-gray-500"
                              style={{ width: `${(reportData.summary.lowStockProducts / reportData.summary.totalProducts) * 100}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-gray-800 w-10 text-right">{reportData.summary.lowStockProducts}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-semibold text-gray-700 w-28">Out of Stock</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-gray-700"
                              style={{ width: `${(reportData.summary.outOfStockProducts / reportData.summary.totalProducts) * 100}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-gray-800 w-10 text-right">{reportData.summary.outOfStockProducts}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-semibold text-gray-700 w-28">Healthy</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-gray-400"
                              style={{ width: `${((reportData.summary.totalProducts - reportData.summary.lowStockProducts - reportData.summary.outOfStockProducts) / reportData.summary.totalProducts) * 100}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-gray-800 w-10 text-right">{reportData.summary.totalProducts - reportData.summary.lowStockProducts - reportData.summary.outOfStockProducts}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Revenue Trend */}
                  {reportData.summary.totalRevenue && (
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <h5 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-900" />
                        Revenue Overview
                      </h5>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                          <span className="text-[11px] font-semibold text-gray-600">Total Revenue</span>
                          <span className="text-xl font-extrabold text-gray-900">₹{reportData.summary.totalRevenue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                          <span className="text-[11px] font-semibold text-gray-600">Avg Order Value</span>
                          <span className="text-sm font-bold text-gray-800">₹{reportData.summary.averageOrderValue?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                          <span className="text-[11px] font-semibold text-gray-600">Total Orders</span>
                          <span className="text-sm font-bold text-gray-800">{reportData.summary.totalOrders || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Table */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="font-display font-bold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-900" />
                    Detailed Data
                  </h4>
                  {reportFormat === 'json' && (
                    <button
                      onClick={() => downloadCSV(reportData)}
                      className="text-xs bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-lg shadow-gray-900/20 flex items-center gap-2"
                    >
                      <Download className="w-3 h-3" />
                      Download CSV
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-xl border border-gray-200">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        {reportData.orders && Object.keys(reportData.orders[0] || {}).map(key => (
                          <th key={key} className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider text-[10px] border-b-2 border-gray-300">{key}</th>
                        ))}
                        {reportData.products && Object.keys(reportData.products[0] || {}).map(key => (
                          <th key={key} className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider text-[10px] border-b-2 border-gray-300">{key}</th>
                        ))}
                        {reportData.customers && Object.keys(reportData.customers[0] || {}).map(key => (
                          <th key={key} className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider text-[10px] border-b-2 border-gray-300">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {reportData.orders && reportData.orders.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          {Object.values(row).map((value: any, cellIdx: number) => (
                            <td key={cellIdx} className="px-4 py-3 text-gray-700 font-medium">{typeof value === 'number' && (row.orderNumber || row.stock !== undefined) ? (row.orderNumber ? value : value) : String(value)}</td>
                          ))}
                        </tr>
                      ))}
                      {reportData.products && reportData.products.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          {Object.values(row).map((value: any, cellIdx: number) => (
                            <td key={cellIdx} className="px-4 py-3 text-gray-700 font-medium">{typeof value === 'boolean' ? (value ? '✅ Yes' : '❌ No') : String(value)}</td>
                          ))}
                        </tr>
                      ))}
                      {reportData.customers && reportData.customers.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          {Object.values(row).map((value: any, cellIdx: number) => (
                            <td key={cellIdx} className="px-4 py-3 text-gray-700 font-medium">{typeof value === 'number' && row.totalSpent ? `₹${value.toFixed(2)}` : String(value)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 11. SHIPPING MANAGEMENT */}
      {activeTab === 'shipping' && (
        <div className="space-y-6 text-left">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-3xl text-gray-900 tracking-tight">Shipping Management</h2>
              <p className="text-sm text-gray-500 mt-1.5">Configure shipping carriers, rates, and tracking for Indian market</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchShippingConfig}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg shadow-gray-800/30">
                  <Truck className="w-5.5 h-5.5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-gray-700 bg-gray-200 px-2.5 py-1 rounded-full uppercase tracking-wider">Active</span>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{shippingConfig?.freeShippingThreshold || 999}</p>
              <p className="text-xs text-gray-600 mt-1">Free Shipping Threshold (₹)</p>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg shadow-gray-800/30">
                  <Package className="w-5.5 h-5.5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-gray-700 bg-gray-200 px-2.5 py-1 rounded-full uppercase tracking-wider">Rates</span>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{shippingRates.length}</p>
              <p className="text-xs text-gray-600 mt-1">Available Carriers</p>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg shadow-gray-800/30">
                  <MapPin className="w-5.5 h-5.5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-gray-700 bg-gray-200 px-2.5 py-1 rounded-full uppercase tracking-wider">Warehouse</span>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{shippingConfig?.warehouseAddress?.city || 'N/A'}</p>
              <p className="text-xs text-gray-600 mt-1">Origin City</p>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg shadow-gray-800/30">
                  <Search className="w-5.5 h-5.5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-gray-700 bg-gray-200 px-2.5 py-1 rounded-full uppercase tracking-wider">Tracking</span>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{trackingInfo ? 'Active' : 'Ready'}</p>
              <p className="text-xs text-gray-600 mt-1">Tracking Status</p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Carrier Selection */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-4">
                <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                    <Truck className="w-4 h-4 text-white" />
                  </div>
                  Carrier Selection
                </h3>
                <p className="text-xs text-gray-500 mt-1 ml-10.5">Select your preferred shipping carrier</p>
              </div>
              <div className="p-6">
                {loadingCarriers ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                    </div>
                    <p className="text-xs text-gray-500">Loading carriers...</p>
                  </div>
                ) : availableCarriers.length > 0 ? (
                  <div className="space-y-3">
                    {availableCarriers.map((carrier) => (
                      <button
                        key={carrier.id}
                        onClick={() => setSelectedCarrier(carrier.id)}
                        className={`w-full border p-4 rounded-xl text-left transition-all ${
                          selectedCarrier === carrier.id
                            ? 'border-black bg-neutral-50/50 shadow'
                            : 'border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                            <Truck className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <span className="block font-bold text-gray-800 text-xs">{carrier.name}</span>
                            <span className="text-[10px] text-gray-400 block">Real-time tracking available</span>
                          </div>
                          {selectedCarrier === carrier.id && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-xs text-gray-500">No carriers available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Configuration */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden lg:col-span-2">
              <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-4">
                <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  Warehouse & Carrier Configuration
                </h3>
                <p className="text-xs text-gray-500 mt-1 ml-10.5">Configure your warehouse location and shipping settings</p>
              </div>
              <div className="p-6">
                {shippingConfig ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          Warehouse City
                        </label>
                        <input
                          type="text"
                          value={shippingConfig.warehouseAddress?.city || ''}
                          onChange={(e) => setShippingConfig({ ...shippingConfig, warehouseAddress: { ...shippingConfig.warehouseAddress, city: e.target.value } })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                          placeholder="Enter city"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          Warehouse State
                        </label>
                        <input
                          type="text"
                          value={shippingConfig.warehouseAddress?.state || ''}
                          onChange={(e) => setShippingConfig({ ...shippingConfig, warehouseAddress: { ...shippingConfig.warehouseAddress, state: e.target.value } })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                          placeholder="Enter state"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          PIN Code
                        </label>
                        <input
                          type="text"
                          value={shippingConfig.warehouseAddress?.zipCode || ''}
                          onChange={(e) => setShippingConfig({ ...shippingConfig, warehouseAddress: { ...shippingConfig.warehouseAddress, zipCode: e.target.value } })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                          placeholder="Enter PIN code"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-gray-400" />
                          Free Shipping Threshold (₹)
                        </label>
                        <input
                          type="number"
                          value={shippingConfig.freeShippingThreshold || 999}
                          onChange={(e) => setShippingConfig({ ...shippingConfig, freeShippingThreshold: parseFloat(e.target.value) })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                          placeholder="999"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={updateShippingConfig}
                        className="flex items-center gap-2 bg-gradient-to-r from-black to-gray-800 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Save Configuration
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                    </div>
                    <p className="text-sm text-gray-500">Loading configuration...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Rate Calculator */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-4">
                <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                    <Calculator className="w-4 h-4 text-white" />
                  </div>
                  Rate Calculator
                </h3>
                <p className="text-xs text-gray-500 mt-1 ml-10.5">Calculate shipping rates for any destination</p>
              </div>
              <div className="p-6">
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        Destination City
                      </label>
                      <input
                        type="text"
                        value={shippingTestAddress.city}
                        onChange={(e) => setShippingTestAddress({ ...shippingTestAddress, city: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                        placeholder="Enter city"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        Destination State
                      </label>
                      <input
                        type="text"
                        value={shippingTestAddress.state}
                        onChange={(e) => setShippingTestAddress({ ...shippingTestAddress, state: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                        placeholder="Enter state"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                        Package Weight (kg)
                      </label>
                      <input
                        type="number"
                        value={shippingTestWeight}
                        onChange={(e) => setShippingTestWeight(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                        placeholder="1"
                      />
                    </div>
                  </div>
                  <button
                    onClick={calculateShippingRates}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-black to-gray-800 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 transition-all"
                  >
                    <Calculator className="w-4 h-4" />
                    Calculate Rates
                  </button>
                  {shippingRates.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Available Rates</p>
                      {shippingRates.map((rate, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-xl hover:border-gray-200 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                              <Truck className="w-5 h-5 text-gray-700" />
                            </div>
                            <div>
                              <span className="block font-bold text-sm text-gray-900">{rate.carrier}</span>
                              <span className="text-xs text-gray-500">{rate.service}</span>
                            </div>
                          </div>
                          <span className={`font-bold text-sm px-3 py-1.5 rounded-lg ${rate.rate === 0 ? 'bg-gray-200 text-gray-700' : 'bg-gray-900 text-white'}`}>
                            {rate.rate === 0 ? 'FREE' : `₹${rate.rate}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tracking Lookup - Full Width */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-4">
              <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                  <Search className="w-4 h-4 text-white" />
                </div>
                Track Shipment
              </h3>
              <p className="text-xs text-gray-500 mt-1 ml-10.5">Track any shipment using carrier tracking number</p>
            </div>
            <div className="p-6">
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number (e.g., 1Z999AA10123456784)"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 pl-12 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                  />
                </div>
                <button
                  onClick={fetchTrackingInfo}
                  className="flex items-center gap-2 bg-gradient-to-r from-black to-gray-800 text-white px-8 py-4 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 transition-all"
                >
                  <Search className="w-4 h-4" />
                  Track Shipment
                </button>
              </div>
              {trackingInfo && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg shadow-gray-800/30">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Tracking Information Found</p>
                      <p className="text-xs text-gray-600">Last updated: {trackingInfo.lastUpdate}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Status</p>
                      <p className="text-sm font-bold text-gray-900">{trackingInfo.status}</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Carrier</p>
                      <p className="text-sm font-bold text-gray-900">{trackingInfo.carrier}</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Estimated Delivery</p>
                      <p className="text-sm font-bold text-gray-900">{trackingInfo.estimatedDelivery}</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Last Update</p>
                      <p className="text-sm font-bold text-gray-900">{trackingInfo.lastUpdate}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 12. TAX MANAGEMENT */}
      {activeTab === 'tax' && (
        <div className="space-y-6 text-left">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-3xl text-gray-900 tracking-tight">GST Tax Management</h2>
              <p className="text-sm text-gray-500 mt-1.5">Configure GST rates and tax calculation for Indian market</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchTaxConfig}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg shadow-gray-800/30">
                  <Calculator className="w-5.5 h-5.5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-gray-700 bg-gray-200 px-2.5 py-1 rounded-full uppercase tracking-wider">Default</span>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{taxConfig?.defaultTaxRate || 18}%</p>
              <p className="text-xs text-gray-600 mt-1">Default Tax Rate</p>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg shadow-gray-800/30">
                  <MapPin className="w-5.5 h-5.5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-gray-700 bg-gray-200 px-2.5 py-1 rounded-full uppercase tracking-wider">Location</span>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{taxConfig?.businessState || 'N/A'}</p>
              <p className="text-xs text-gray-600 mt-1">Business State</p>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg shadow-gray-800/30">
                  <Award className="w-5.5 h-5.5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-gray-700 bg-gray-200 px-2.5 py-1 rounded-full uppercase tracking-wider">Code</span>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{taxConfig?.businessStateCode || 'N/A'}</p>
              <p className="text-xs text-gray-600 mt-1">State GST Code</p>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg shadow-gray-800/30">
                  <CheckCircle className="w-5.5 h-5.5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-gray-700 bg-gray-200 px-2.5 py-1 rounded-full uppercase tracking-wider">Status</span>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{stateValidation?.isValid ? 'Valid' : 'Check'}</p>
              <p className="text-xs text-gray-600 mt-1">State Validation</p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tax Configuration */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-4">
                <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  Business Tax Configuration
                </h3>
                <p className="text-xs text-gray-500 mt-1 ml-10.5">Configure your business location and default GST settings</p>
              </div>
              <div className="p-6">
                {taxConfig ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          Business State
                        </label>
                        <input
                          type="text"
                          value={taxConfig.businessState || ''}
                          onChange={(e) => setTaxConfig({ ...taxConfig, businessState: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                          placeholder="Enter state"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-gray-400" />
                          State Code
                        </label>
                        <input
                          type="text"
                          value={taxConfig.businessStateCode || ''}
                          onChange={(e) => setTaxConfig({ ...taxConfig, businessStateCode: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                          placeholder="e.g., DL"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Calculator className="w-3.5 h-3.5 text-gray-400" />
                          Default Tax Rate (%)
                        </label>
                        <input
                          type="number"
                          value={taxConfig.defaultTaxRate || 18}
                          onChange={(e) => setTaxConfig({ ...taxConfig, defaultTaxRate: parseFloat(e.target.value) })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                          placeholder="18"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={updateTaxConfig}
                        className="flex items-center gap-2 bg-gradient-to-r from-black to-gray-800 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Save Configuration
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                    </div>
                    <p className="text-sm text-gray-500">Loading configuration...</p>
                  </div>
                )}
              </div>
            </div>

            {/* GST Calculator */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-4">
                <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                    <Calculator className="w-4 h-4 text-white" />
                  </div>
                  GST Calculator
                </h3>
                <p className="text-xs text-gray-500 mt-1 ml-10.5">Calculate GST for any transaction</p>
              </div>
              <div className="p-6">
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-1">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Calculator className="w-3.5 h-3.5 text-gray-400" />
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={taxTestAmount}
                        onChange={(e) => setTaxTestAmount(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                        placeholder="1000"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        Customer State
                      </label>
                      <input
                        type="text"
                        value={taxTestAddress.state}
                        onChange={(e) => setTaxTestAddress({ ...taxTestAddress, state: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                        placeholder="Enter state"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                        Product Category
                      </label>
                      <select
                        value={taxTestCategory}
                        onChange={(e) => setTaxTestCategory(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                      >
                        <option value="general">General (18%)</option>
                        <option value="essential">Essential (0%)</option>
                        <option value="textiles">Textiles (5%)</option>
                        <option value="electronics">Electronics (18%)</option>
                        <option value="luxury_cars">Luxury Cars (28%)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={calculateTax}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-black to-gray-800 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 transition-all"
                    >
                      <Calculator className="w-4 h-4" />
                      Calculate Tax
                    </button>
                    <button
                      onClick={validateState}
                      className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Validate State
                    </button>
                  </div>
                  {taxCalculationResult && (
                    <div className="mt-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg shadow-gray-800/30">
                          <Calculator className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Tax Calculation Result</p>
                          <p className="text-xs text-gray-600">{taxCalculationResult.isInterstate ? 'Interstate (IGST)' : 'Intrastate (CGST + SGST)'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tax Type</p>
                          <p className="text-sm font-bold text-gray-900">{taxCalculationResult.isInterstate ? 'IGST' : 'CGST + SGST'}</p>
                        </div>
                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tax Rate</p>
                          <p className="text-sm font-bold text-gray-900">{taxCalculationResult.taxRate}%</p>
                        </div>
                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">CGST</p>
                          <p className="text-sm font-bold text-gray-900">₹{taxCalculationResult.cgst?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">SGST</p>
                          <p className="text-sm font-bold text-gray-900">₹{taxCalculationResult.sgst?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200 col-span-2">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">IGST</p>
                          <p className="text-sm font-bold text-gray-900">₹{taxCalculationResult.igst?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-3 col-span-2">
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Total Tax</p>
                            <p className="text-lg font-extrabold text-white">₹{taxCalculationResult.totalTax?.toFixed(2) || '0.00'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {stateValidation && (
                    <div className="mt-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg shadow-gray-800/30">
                          {stateValidation.isValid ? <CheckCircle className="w-5 h-5 text-white" /> : <X className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">State Validation Result</p>
                          <p className="text-xs text-gray-600">{stateValidation.isValid ? 'Valid Indian state' : 'Invalid state'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">State</p>
                          <p className="text-sm font-bold text-gray-900">{stateValidation.state}</p>
                        </div>
                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Valid</p>
                          <p className={`text-sm font-bold ${stateValidation.isValid ? 'text-gray-900' : 'text-gray-900'}`}>
                            {stateValidation.isValid ? '✅ Yes' : '❌ No'}
                          </p>
                        </div>
                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200 col-span-2">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">State Code</p>
                          <p className="text-sm font-bold text-gray-900">{stateValidation.stateCode || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 13. EMAIL TEMPLATES MANAGEMENT */}
      {activeTab === 'email-templates' && (
        <div className="space-y-8 text-left">
          <div className="relative bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-gray-300/50 transition-all duration-500 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-gray-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex items-center justify-center shadow-md group-hover:scale-125 group-hover:rotate-6 group-hover:shadow-xl transition-all duration-500">
                  <Mail className="w-7 h-7 text-white group-hover:rotate-12 transition-transform duration-500" />
                </div>
                <div>
                  <h2 className="font-display font-extrabold text-2xl text-gray-900 group-hover:tracking-wide transition-all duration-300">Email Templates</h2>
                  <p className="text-xs text-gray-600 mt-1 font-medium">Customize email templates for different events and notifications</p>
                </div>
              </div>
              <button
                onClick={() => { setEditingTemplate(null); setShowTemplateEditor(true); }}
                className="bg-gradient-to-r from-black to-gray-800 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-gray-900/30 transition-all duration-300 flex items-center gap-2 group-hover:scale-105"
              >
                <Plus className="w-4 h-4" /> Create Template
              </button>
            </div>
          </div>

          {/* Email Templates List */}
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden">
            <div className="p-6 border-b border-gray-200/60 bg-gradient-to-r from-gray-50 to-white">
              <h3 className="font-display font-bold text-sm text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-600" /> Available Templates ({emailTemplates.length})
              </h3>
            </div>
            <div className="p-6">
              {emailTemplates.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {emailTemplates.map((template) => (
                    <div key={template.id} className="relative bg-gradient-to-br from-white to-gray-50 border border-gray-200/60 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-gray-300/50 transition-all duration-500 group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gray-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                      <div className="relative flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                              <Mail className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-500" />
                            </div>
                            <div>
                              <h4 className="font-display font-bold text-gray-900 group-hover:tracking-wide transition-all duration-300">{template.eventName}</h4>
                              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${template.isActive ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md shadow-green-500/30' : 'bg-gray-200 text-gray-600'}`}>
                                {template.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 font-medium bg-gray-50/50 px-3 py-2 rounded-xl border border-gray-100">{template.subject}</p>
                          <div className="flex gap-2 flex-wrap">
                            {template.variables && template.variables.map((variable: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg text-[10px] font-mono text-gray-700 border border-gray-200">
                                {`{{${variable}}}`}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setSelectedEmailTemplate(template); setShowTemplatePreview(true); }}
                            className="p-2.5 bg-gray-100 hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 rounded-xl transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/30"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                          </button>
                          <button
                            onClick={() => { setEditingTemplate(template); setShowTemplateEditor(true); }}
                            className="p-2.5 bg-gray-100 hover:bg-gradient-to-r hover:from-purple-500 hover:to-purple-600 rounded-xl transition-all duration-300 group-hover:shadow-lg group-hover:shadow-purple-500/30"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                          </button>
                          {!template.id.startsWith('order-') && !template.id.startsWith('shipping-') && !template.id.startsWith('welcome-') && !template.id.startsWith('password-') && (
                            <button
                              onClick={() => deleteEmailTemplate(template.id)}
                              className="p-2.5 bg-gray-100 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 rounded-xl transition-all duration-300 group-hover:shadow-lg group-hover:shadow-red-500/30"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 text-center bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Mail className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">No email templates found</p>
                  <p className="text-xs text-gray-400 mt-1">Create your first template to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template Editor Modal */}
      {showTemplateEditor && (
        <div className="fixed top-2/3 right-4 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 w-[600px] max-h-[80vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-2xl z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Edit2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-gray-900">{editingTemplate ? 'Edit Template' : 'Create Template'}</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">{editingTemplate ? 'Modify existing email template' : 'Design a new email template'}</p>
                </div>
              </div>
              <button
                onClick={() => { setShowTemplateEditor(false); setEditingTemplate(null); }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-4 pb-6">
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const templateData = {
                eventName: formData.get('eventName') as string,
                subject: formData.get('subject') as string,
                body: formData.get('body') as string,
                variables: formData.get('variables') as string ? (formData.get('variables') as string).split(',').map(v => v.trim()) : []
              };
              if (editingTemplate) {
                updateEmailTemplate(editingTemplate.id, { subject: templateData.subject, body: templateData.body });
              } else {
                createEmailTemplate(templateData);
              }
            }} className="space-y-5">
              {!editingTemplate && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Event Name</label>
                  <input
                    name="eventName"
                    type="text"
                    defaultValue={editingTemplate?.eventName || ''}
                    className="w-full bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-medium"
                    placeholder="e.g., order_confirmation"
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Subject Line</label>
                <input
                  name="subject"
                  type="text"
                  defaultValue={editingTemplate?.subject || ''}
                  className="w-full bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-medium"
                  placeholder="Email subject line"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Email Body</label>
                <textarea
                  name="body"
                  defaultValue={editingTemplate?.body || ''}
                  className="w-full bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-4 text-sm min-h-[200px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-medium"
                  placeholder="Email body content. Use {{variableName}} for dynamic content."
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Variables (comma-separated)</label>
                <input
                  name="variables"
                  type="text"
                  defaultValue={editingTemplate?.variables?.join(', ') || ''}
                  className="w-full bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-medium"
                  placeholder="e.g., customerName, orderNumber, totalAmount"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/60">
                <button
                  type="button"
                  onClick={() => { setShowTemplateEditor(false); setEditingTemplate(null); }}
                  className="px-6 py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {showTemplatePreview && selectedEmailTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-900/20 max-w-2xl w-full p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-gray-200/60">
            <div className="flex items-center justify-between border-b border-gray-200/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-gray-900">Template Preview</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Preview email template content</p>
                </div>
              </div>
              <button
                onClick={() => { setShowTemplatePreview(false); setSelectedEmailTemplate(null); setPreviewData(null); }}
                className="w-10 h-10 bg-gray-100 hover:bg-red-100 rounded-xl flex items-center justify-center transition-all duration-300 group"
              >
                <svg className="w-5 h-5 text-gray-500 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-5">
              <div className="relative bg-gradient-to-br from-gray-50 to-white border border-gray-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 relative">Subject Line</p>
                <p className="font-bold text-sm text-gray-900 bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">{selectedEmailTemplate.subject}</p>
              </div>
              
              <div className="relative bg-gradient-to-br from-gray-50 to-white border border-gray-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 relative">Email Body</p>
                <pre className="text-sm whitespace-pre-wrap font-sans text-gray-700 bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">{selectedEmailTemplate.body}</pre>
              </div>
              
              <div className="relative bg-gradient-to-br from-gray-50 to-white border border-gray-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-100/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 relative">Available Variables</p>
                <div className="flex gap-2 flex-wrap">
                  {selectedEmailTemplate.variables && selectedEmailTemplate.variables.map((variable: string, idx: number) => (
                    <span key={idx} className="px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg text-[10px] font-mono text-gray-700 border border-gray-200 shadow-sm">
                      {`{{${variable}}}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
