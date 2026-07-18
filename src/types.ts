export interface Variant {
  name: string;
  options: string[];
  images?: { [key: string]: string[] }; // Map color name to array of images
}

export interface Specification {
  label: string;
  value: string;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  images?: string[];
  approved: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  richDescription: string;
  price: number;
  discountPrice?: number;
  rating: number;
  reviewsCount: number;
  category: string; // Slug of category
  brand: string;
  images: string[];
  stock: number;
  weight?: number; // Weight in kg for shipping calculation
  lowStockThreshold?: number; // Alert threshold for low stock (default: 5)
  variants: Variant[];
  specifications: Specification[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  inventory?: { [key: string]: number }; // Stock per variant combination (e.g., "Color:Black|Size:M": 10)
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
}

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'admin' | 'customer' | 'super-admin' | 'user';
  avatar?: string;
  profilePhoto?: string;
  addresses: Address[];
  loyaltyPoints: number;
  referralCode: string;
  referredBy?: string;
  // Password reset flow (stored hashed token + expiry)
  resetPasswordToken?: string;
  resetPasswordExpiry?: string;
  // Additional properties for admin panel
  isActive?: boolean;
  createdAt?: string;
  totalSpent?: number;
  orderCount?: number;
}

export interface Coupon {
  id?: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  expiryDate: string;
  minPurchase?: number;
  usageLimit?: number;
  usedCount: number;
  // Backward/forward compatibility for admin UI fields
  isActive?: boolean;
  active?: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  variant?: { [key: string]: string };
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  shippingMethod: string;
  paymentMethod: string;
  paymentDetails?: {
    upiId?: string;
    phoneNumber?: string;
    walletNumber?: string;
    bankName?: string;
    accountNumber?: string;
    cardNumber?: string;
    cardExpiry?: string;
  };
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  loyaltyPointsEarned: number;
  loyaltyPointsUsed: number;
  pointsAwarded?: boolean;
  date: string;
  // Analytics / export compatibility
  createdAt?: string;
  total?: number;
  paymentStatus?: 'Pending' | 'Paid' | 'Failed' | string;
  refundAmount?: number;
}

export interface AppNotification {
  id: string;
  userId: string; // "all" or specific
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'promotion';
  date: string;
  read: boolean;
}

export interface HeroSlide {
  id: string;
  image: string;
  tagline: string;
  title: string;
  description: string;
  imageSizing?: {
    objectFit?: 'cover' | 'contain' | 'fill' | 'none';
    objectPosition?: string;
    customWidth?: string;
    customHeight?: string;
  };
}

export interface HomeSectionCopy {
  title: string;
  description: string;
}

export interface HomePromoCard {
  id: string;
  accent: 'emerald' | 'amber';
  eyebrow: string;
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
}

export interface HomeContent {
  trending: HomeSectionCopy;
  featured: HomeSectionCopy;
  bestSellers: HomeSectionCopy;
  newArrivals: HomeSectionCopy;
  promoCards: HomePromoCard[];
  featuredProductIds?: string[];
  bestSellerProductIds?: string[];
  newArrivalProductIds?: string[];
  newsletter?: {
    enabled: boolean;
    title: string;
    description: string;
  };
  brandShowcase?: {
    enabled: boolean;
    brands: string[];
  };
}

export interface Newsletter {
  id: string;
  email: string;
  subscribedAt: string;
  status: 'active' | 'unsubscribed';
}

export interface HeaderConfig {
  logoText: string;
  logoIcon: string;
  searchPlaceholder: string;
  showAIBadge: boolean;
  aiBadgeText: string;
  announcementBanner: {
    enabled: boolean;
    text: string;
    backgroundColor: string;
    textColor: string;
  };
  navigationLinks: Array<{
    label: string;
    url: string;
  }>;
  heroSlides: HeroSlide[];
  homeContent: HomeContent;
}

// Customer Service Types
export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: 'Order' | 'Payment' | 'Product' | 'Shipping' | 'Returns' | 'Account' | 'Other';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  description: string;
  orderId?: string;
  productId?: string;
  assignedTo?: string; // Admin user ID
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface ChatMessage {
  id: string;
  ticketId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  sender: 'customer' | 'admin';
  timestamp: string;
  isRead: boolean;
  attachments?: string[];
}

export interface CustomerNote {
  id: string;
  userId: string;
  adminId: string;
  adminName: string;
  note: string;
  category: 'General' | 'Order History' | 'Payment Issues' | 'Behavior' | 'VIP' | 'Risk';
  isInternal: boolean; // If true, only visible to admins
  createdAt: string;
  updatedAt: string;
}

// Timer Configuration Types
export interface TimerConfig {
  id: string;
  name: string;
  description: string;
  duration: number; // Duration in hours
  isActive: boolean;
  applicableProducts?: string[]; // Product IDs this timer applies to
  applicableCategories?: string[]; // Category slugs this timer applies to
  startDate?: string; // Optional start date
  endDate?: string; // Optional end date
  template: 'flash-sale' | 'limited-offer' | 'countdown-deal' | 'custom';
  customTemplate?: {
    title: string;
    subtitle: string;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Warranty Configuration Types
export interface WarrantyConfig {
  id: string;
  name: string;
  description: string;
  duration: number; // Duration in months
  coverage: string[]; // Coverage details (e.g., ['Parts', 'Labor', 'Shipping'])
  terms: string; // Full terms and conditions
  isActive: boolean;
  applicableProducts?: string[]; // Product IDs this warranty applies to
  applicableCategories?: string[]; // Category slugs this warranty applies to
  template: 'standard' | 'premium' | 'extended' | 'custom';
  customTemplate?: {
    title: string;
    subtitle: string;
    icon: string;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
  };
  createdAt: string;
  updatedAt: string;
}
