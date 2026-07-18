import { Request, Response } from 'express';
import { dbConnection } from '../config/db';
import { sendResponse, sendError } from '../utils/response';
import { Product, Order, User, Coupon, HeaderConfig, HomeContent, TimerConfig, WarrantyConfig } from '../../src/types';
import { notifyUser, broadcastAlert } from '../sockets/socketService';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { getShippingRates, generateTrackingNumber, getTrackingInfo } from '../services/shipping.service';
import { calculateGST, calculateGSTForCart, validateStateName, getStateCode } from '../services/tax.service';
import { sendOrderStatusUpdateEmail, sendGeneralNotificationEmail, initEmailTransport } from '../utils/email';

interface EmailTemplate {
  id: string;
  eventName: string;
  subject: string;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'order-confirmation',
    eventName: 'order_confirmation',
    subject: 'Order Confirmation - Order #{{orderNumber}}',
    body: `Dear {{customerName}},

Thank you for your order! Your order #{{orderNumber}} has been confirmed.

Order Details:
- Total Amount: {{totalAmount}}
- Payment Method: {{paymentMethod}}
- Shipping Address: {{shippingAddress}}

You will receive a shipping confirmation email once your order is shipped.

Thank you for shopping with us!`,
    variables: ['customerName', 'orderNumber', 'totalAmount', 'paymentMethod', 'shippingAddress'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'shipping-confirmation',
    eventName: 'shipping_confirmation',
    subject: 'Your Order Has Been Shipped - Order #{{orderNumber}}',
    body: `Dear {{customerName}},

Great news! Your order #{{orderNumber}} has been shipped.

Shipping Details:
- Carrier: {{carrier}}
- Tracking Number: {{trackingNumber}}
- Estimated Delivery: {{estimatedDelivery}}

You can track your shipment using the tracking number above.

Thank you for shopping with us!`,
    variables: ['customerName', 'orderNumber', 'carrier', 'trackingNumber', 'estimatedDelivery'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'order-delivered',
    eventName: 'order_delivered',
    subject: 'Your Order Has Been Delivered - Order #{{orderNumber}}',
    body: `Dear {{customerName}},

Your order #{{orderNumber}} has been successfully delivered.

We hope you enjoy your purchase! If you have any issues with your order, please contact our customer support.

Thank you for shopping with us!`,
    variables: ['customerName', 'orderNumber'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'welcome-email',
    eventName: 'welcome_email',
    subject: 'Welcome to Our Store!',
    body: `Dear {{customerName}},

Welcome to our store! We're excited to have you as part of our community.

As a new customer, you'll receive exclusive offers and updates on our latest products.

Start shopping now and enjoy our amazing collection!

Best regards,
The Team`,
    variables: ['customerName'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'password-reset',
    eventName: 'password_reset',
    subject: 'Password Reset Request',
    body: `Dear {{customerName}},

We received a request to reset your password. Click the link below to reset your password:

{{resetLink}}

This link will expire in 1 hour. If you didn't request this, please ignore this email.

Best regards,
The Team`,
    variables: ['customerName', 'resetLink'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const DEFAULT_HERO_SLIDES = [
  {
    id: 'hero-fashion',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80',
    tagline: 'BRAND NEW EXPANSION',
    title: 'The Golden Ratio Collection',
    description: 'Elevated luxury outerwear, modern knit hoodies, and crafted Italian calf suede boots built to endure.'
  },
  {
    id: 'hero-audio',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80',
    tagline: 'PREMIUM TECH AUDIO',
    title: 'AcousticMax Horizon 2',
    description: 'Immersive soundscapes, adaptive neural noise cancelling, and an uncompromising titanium build.'
  },
  {
    id: 'hero-home',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80',
    tagline: 'ARTISAN HOME GOODS',
    title: 'Warm Basalt Interior Set',
    description: 'Sculpted volcanic lava stonewares, organic terracotta plants, and GOTS cert organic textures.'
  }
];

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
    title: 'New Arrival Ledger',
    description: 'Fresh catalog entries indexed for early-access exploration.'
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

const withHeroSlides = (config: any): HeaderConfig => ({
  ...config,
  heroSlides: Array.isArray(config?.heroSlides) && config.heroSlides.length > 0
    ? config.heroSlides
    : DEFAULT_HERO_SLIDES,
  homeContent: {
    ...DEFAULT_HOME_CONTENT,
    ...(config?.homeContent || {}),
    promoCards: Array.isArray(config?.homeContent?.promoCards) && config.homeContent.promoCards.length > 0
      ? config.homeContent.promoCards
      : DEFAULT_HOME_CONTENT.promoCards
  }
});

export const getDashboardAnalytics = async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  let orders = [...dbConnection.getCollection('orders')];
  const products = dbConnection.getCollection('products');
  const users = dbConnection.getCollection('users').filter(u => (u.role as string) !== 'admin' && (u.role as string) !== 'super-admin');
  const reviews = dbConnection.getCollection('reviews');
  const logs = dbConnection.getCollection('auditLogs');

  // Filter by Date Range if specified
  if (startDate) {
    orders = orders.filter(o => new Date(o.date) >= new Date(startDate as string));
  }
  if (endDate) {
    orders = orders.filter(o => new Date(o.date) <= new Date(endDate as string));
  }

  // Sales and Refund calculations
  const successfulOrders = orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Returned');
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled');
  const returnedOrders = orders.filter(o => (o.status as string) === 'Returned' || (o.status as string) === 'Refunded');

  const totalSales = successfulOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalTax = successfulOrders.reduce((sum, o) => sum + o.taxAmount, 0);
  const totalShipping = successfulOrders.reduce((sum, o) => sum + o.shippingAmount, 0);
  const netRevenue = totalSales - totalTax - totalShipping;

  const refundSum = returnedOrders.reduce((sum, o) => sum + ((o as any).refundAmount || o.totalAmount), 0);

  // Revenue by months analytics timeline
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueHistory = months.map((month, index) => {
    // Generate simulated monthly trends centered around total sales
    const baseMult = (index + 1) / 12;
    return {
      monthKey: month,
      revenue: parseFloat((totalSales * 0.15 * baseMult + 200).toFixed(2)),
      orders: Math.floor(orders.length * 0.1 * baseMult + 1)
    };
  });

  // Top Products catalog listing
  const topProducts = products
    .map(p => {
      // count quantity sold
      const quantitySold = orders
        .filter(o => o.status !== 'Cancelled')
        .flatMap(o => o.items)
        .filter(item => item.productId === p.id)
        .reduce((sum, item) => sum + item.quantity, 0);

      return {
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        quantitySold,
        salesRevenue: quantitySold * (p.discountPrice || p.price)
      };
    })
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 5);

  // Category revenue metrics
  const categories = dbConnection.getCollection('categories');
  const categorySummary = categories.map(cat => {
    const revenue = orders
      .filter(o => o.status !== 'Cancelled')
      .flatMap(o => o.items)
      .filter(item => {
        const matchingProd = products.find(p => p.id === item.productId);
        return matchingProd?.category === cat.slug;
      })
      .reduce((sum, item) => sum + (item.quantity * item.price), 0);

    return {
      categoryName: cat.name,
      slug: cat.slug,
      revenue: parseFloat(revenue.toFixed(2))
    };
  });

  // Customer metrics
  const activeLogsCount = logs.length;
  const recentCustomers = users.slice(-5).map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    loyaltyPoints: u.loyaltyPoints,
    dateJoined: new Date().toISOString()
  }));

  const metricsReport = {
    revenue: {
      totalSales: parseFloat(totalSales.toFixed(2)),
      netRevenue: parseFloat(netRevenue.toFixed(2)),
      totalTax: parseFloat(totalTax.toFixed(2)),
      totalShipping: parseFloat(totalShipping.toFixed(2)),
      refundSum: parseFloat(refundSum.toFixed(2))
    },
    counts: {
      ordersCount: orders.length,
      customersCount: users.length,
      inventoryCount: products.reduce((sum, p) => sum + p.stock, 0),
      reviewsCount: reviews.length,
      auditLogsCount: activeLogsCount
    },
    growthTrends: {
      organicCustomers: users.filter(u => !u.referredBy).length,
      referredCustomers: users.filter(u => u.referredBy).length
    },
    recentAuditLogs: logs.slice(-10),
    revenueHistory,
    topProducts,
    categorySummary,
    recentCustomers
  };

  return sendResponse(res, 200, true, 'Analytics metrics configured.', metricsReport);
};

// Admin coupon creators
export const createDiscountCoupon = async (req: Request, res: Response) => {
  const { code, type, value, expiryDate, minPurchase, usageLimit } = req.body;

  if (!code || !type || !value) {
    return sendError(res, 400, 'Code keyword, reduction type (percentage or fixed), and value are required.');
  }

  const coupons = dbConnection.getCollection('coupons');
  if (coupons.some(c => c.code.toUpperCase() === code.toUpperCase())) {
    return sendError(res, 400, 'Coupon code signature is already registered.');
  }

  const newCoupon: Coupon = {
    id: `cp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    code: code.toUpperCase(),
    type,
    value: parseFloat(value),
    expiryDate: expiryDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    minPurchase: minPurchase ? parseFloat(minPurchase) : undefined,
    usageLimit: usageLimit ? parseInt(usageLimit) : undefined,
    usedCount: 0
  };

  coupons.push(newCoupon);
  dbConnection.updateCollection('coupons', coupons);

  return sendResponse(res, 201, true, 'Promo coupon saved.', newCoupon);
};

export const toggleCouponStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendError(res, 400, 'Coupon ID is required.');
    }

    const coupons = dbConnection.getCollection('coupons');
    const couponIndex = coupons.findIndex(c => c.id === id);

    if (couponIndex === -1) {
      return sendError(res, 404, 'Coupon not found.');
    }

    // Toggle the active status (use active field, fallback to isActive)
    const currentStatus = coupons[couponIndex].active ?? coupons[couponIndex].isActive ?? true;
    coupons[couponIndex].active = !currentStatus;
    coupons[couponIndex].isActive = !currentStatus;

    dbConnection.updateCollection('coupons', coupons);

    return sendResponse(res, 200, true, 'Coupon status updated successfully.', coupons[couponIndex]);
  } catch (error) {
    console.error('Error toggling coupon status:', error);
    return sendError(res, 500, 'Internal server error while toggling coupon status.');
  }
};

// Update order track
export const updateOrderCarrierTrack = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, carrierName, trackingNumber } = req.body;

  if (!status) {
    return sendError(res, 400, 'Status field is mandatory.');
  }

  const orders = dbConnection.getCollection('orders');
  const order = orders.find(o => o.id === id);

  if (!order) {
    return sendError(res, 404, 'Associated order index was not found.');
  }

  order.status = status;
  if (carrierName) (order as any).carrierName = carrierName;
  if (trackingNumber) (order as any).trackingNumber = trackingNumber;

  (order as any).timeline.push({
    status,
    description: `Order processed to state: ${status}. Tracking detail updated. Carrier: ${carrierName || 'TBA'} TrackRef: ${trackingNumber || 'TBA'}`,
    timestamp: new Date().toISOString()
  });

  dbConnection.updateCollection('orders', orders);

  // Get user for notifications
  const users = dbConnection.getCollection('users');
  const user = users.find(u => u.id === order.userId);

  // Send email notification
  if (user && user.email) {
    initEmailTransport();
    sendOrderStatusUpdateEmail(user.email, order.orderNumber, status);
  }

  // Trigger enterprise Socket.io tracking notifications
  notifyUser(order.userId, {
    title: 'Delivery Progress Updated',
    message: `Your package (ID: ${order.orderNumber}) was processed to status: ${status}. Carrier: ${carrierName || 'TBA'} Tracking #: ${trackingNumber || 'TBA'}`,
    type: 'success',
    orderId: order.id,
    orderNumber: order.orderNumber,
    status
  });

  return sendResponse(res, 200, true, 'Delivery tracking timeline upgraded.', order);
};

// Admin data exports (supporting Phase 7 CSV layout structures)
export const exportMetricsReport = async (req: Request, res: Response) => {
  const orders = dbConnection.getCollection('orders');
  
  // Format items array into raw tabular rows for Excel/CSV parsing triggers
  const tabularLines = orders.map(o => ({
    orderNumber: o.orderNumber,
    customerId: o.userId,
    date: o.date,
    status: o.status,
    grandTotal: o.totalAmount,
    tax: o.taxAmount,
    shippingFee: o.shippingAmount,
    paymentMethod: o.paymentMethod
  }));

  return sendResponse(res, 200, true, 'Sales report formulated for tabular stream.', tabularLines);
};

// Header configuration management
export const getHeaderConfig = async (req: Request, res: Response) => {
  const headerConfigs = dbConnection.getCollection('headerConfig');
  
  if (headerConfigs.length === 0) {
    // Return default config if none exists
    const defaultConfig: HeaderConfig = {
      logoText: 'ModernShop',
      logoIcon: 'M',
      searchPlaceholder: 'Search products, brands, categories...',
      showAIBadge: true,
      aiBadgeText: 'AI Recommendations',
      announcementBanner: {
        enabled: false,
        text: '',
        backgroundColor: '#10b981',
        textColor: '#ffffff'
      },
      navigationLinks: [],
      heroSlides: DEFAULT_HERO_SLIDES,
      homeContent: DEFAULT_HOME_CONTENT
    };
    return sendResponse(res, 200, true, 'Default header configuration retrieved.', defaultConfig);
  }
  
  return sendResponse(res, 200, true, 'Header configuration retrieved.', withHeroSlides(headerConfigs[0]));
};

export const updateHeaderConfig = async (req: Request, res: Response) => {
  const configData = req.body;
  
  const headerConfigs = dbConnection.getCollection('headerConfig');
  
  const newConfig: HeaderConfig = {
    logoText: configData.logoText || 'ModernShop',
    logoIcon: configData.logoIcon || 'M',
    searchPlaceholder: configData.searchPlaceholder || 'Search products, brands, categories...',
    showAIBadge: configData.showAIBadge !== undefined ? configData.showAIBadge : true,
    aiBadgeText: configData.aiBadgeText || 'AI Recommendations',
    announcementBanner: {
      enabled: configData.announcementBanner?.enabled || false,
      text: configData.announcementBanner?.text || '',
      backgroundColor: configData.announcementBanner?.backgroundColor || '#10b981',
      textColor: configData.announcementBanner?.textColor || '#ffffff'
    },
    navigationLinks: configData.navigationLinks || [],
    heroSlides: Array.isArray(configData.heroSlides) && configData.heroSlides.length > 0
      ? configData.heroSlides
      : DEFAULT_HERO_SLIDES,
    homeContent: configData.homeContent || DEFAULT_HOME_CONTENT
  };
  
  if (headerConfigs.length === 0) {
    headerConfigs.push(newConfig);
  } else {
    headerConfigs[0] = newConfig;
  }
  
  dbConnection.updateCollection('headerConfig', headerConfigs);
  
  return sendResponse(res, 200, true, 'Header configuration updated successfully.', newConfig);
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const orders = dbConnection.getCollection('orders');
  const orderIndex = orders.findIndex(o => o.id === id);

  if (orderIndex === -1) {
    return sendError(res, 404, 'Order not found.');
  }

  const oldStatus = orders[orderIndex].status;
  orders[orderIndex].status = status;
  
  // Award loyalty points when order is delivered
  if (status === 'Delivered' && oldStatus !== 'Delivered') {
    const users = dbConnection.getCollection('users');
    const user = users.find(u => u.id === orders[orderIndex].userId);
    
    if (user) {
      const pointsToAward = orders[orderIndex].loyaltyPointsEarned || Math.floor(orders[orderIndex].totalAmount / 10);
      const oldPoints = user.loyaltyPoints;
      user.loyaltyPoints += pointsToAward;
      dbConnection.updateCollection('users', users);
      console.log(`[LOYALTY POINTS] Order delivery award - userId: ${user.id}, orderId: ${id}, oldPoints: ${oldPoints}, pointsAwarded: ${pointsToAward}, newPoints: ${user.loyaltyPoints}`);
      
      // Update order to reflect points were awarded
      (orders[orderIndex] as any).pointsAwarded = true;
    }
  }
  
  dbConnection.updateCollection('orders', orders);

  // Get user for notifications
  const users = dbConnection.getCollection('users');
  const user = users.find(u => u.id === orders[orderIndex].userId);

  // Send email notification
  if (user && user.email) {
    initEmailTransport();
    sendOrderStatusUpdateEmail(user.email, orders[orderIndex].orderNumber, status);
  }

  // Notify user about status change
  if (orders[orderIndex].userId) {
    notifyUser(orders[orderIndex].userId, {
      title: 'Order Status Update',
      message: `Your order ${orders[orderIndex].orderNumber} is now: ${status}${status === 'Delivered' ? '. Loyalty points have been credited to your account!' : ''}`,
      type: 'success'
    });
  }

  return sendResponse(res, 200, true, 'Order status updated successfully.', orders[orderIndex]);
};

export const getAllOrders = async (req: Request, res: Response) => {
  const orders = dbConnection.getCollection('orders');
  return sendResponse(res, 200, true, 'Orders retrieved successfully.', { orders });
};

export const getAllUsers = async (req: Request, res: Response) => {
  const users = dbConnection.getCollection('users');
  const orders = dbConnection.getCollection('orders');
  
  // Calculate additional fields for each user
  const enrichedUsers = users.map(user => {
    const userOrders = orders.filter(o => o.userId === user.id);
    const totalSpent = userOrders
      .filter(o => o.status !== 'Cancelled' && o.status !== 'Returned')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const orderCount = userOrders.length;
    
    return {
      ...user,
      totalSpent,
      orderCount,
      createdAt: user.createdAt || new Date().toISOString(),
      isActive: user.isActive !== false
    };
  });
  
  return sendResponse(res, 200, true, 'Users retrieved successfully.', { users: enrichedUsers });
};

export const getAllCoupons = async (req: Request, res: Response) => {
  const coupons = dbConnection.getCollection('coupons');
  return sendResponse(res, 200, true, 'Coupons retrieved successfully.', { coupons });
};

export const createProduct = async (req: Request, res: Response) => {
  const { name, brand, price, discountPrice, category, stock, lowStockThreshold, description, images, variants, specifications } = req.body;

  if (!name || !price || !category) {
    return sendError(res, 400, 'Product name, price, and category are required.');
  }

  const products = dbConnection.getCollection('products');
  const categories = dbConnection.getCollection('categories');
  
  console.log(`[CREATE PRODUCT] Current products in database: ${products.length}`);
  console.log(`[CREATE PRODUCT] Existing product IDs:`, products.map(p => p.id));
  
  // Verify category exists
  const categoryExists = categories.some(c => c.slug === category);
  if (!categoryExists) {
    return sendError(res, 400, 'Invalid category specified.');
  }

  const newProduct: Product = {
    id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    description: description || '',
    richDescription: description || '',
    price: parseFloat(price),
    discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
    category,
    brand: brand || '',
    images: Array.isArray(images) ? images.filter((image: string) => typeof image === 'string' && image.trim().length > 0) : [],
    stock: parseInt(stock) || 0,
    lowStockThreshold: parseInt(lowStockThreshold) || 5,
    variants: Array.isArray(variants)
      ? variants
          .filter(variant => variant?.name && Array.isArray(variant.options))
          .map(variant => ({
            name: String(variant.name).trim(),
            options: variant.options
              .filter((option: string) => typeof option === 'string' && option.trim().length > 0)
              .map((option: string) => option.trim())
          }))
          .filter(variant => variant.name.length > 0 && variant.options.length > 0)
      : [],
    specifications: Array.isArray(specifications)
      ? specifications.filter(spec => spec?.label && String(spec.label).trim().length > 0)
      : [],
    rating: 0,
    reviewsCount: 0,
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true
  };

  console.log(`[CREATE PRODUCT] Creating new product with ID: ${newProduct.id}`);
  products.push(newProduct);
  dbConnection.updateCollection('products', products);
  
  console.log(`[CREATE PRODUCT] After creation - Total products: ${products.length}`);

  return sendResponse(res, 201, true, 'Product created successfully.', newProduct);
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return sendError(res, 400, 'Product ID is required.');
  }

  const products = dbConnection.getCollection('products');
  console.log(`[DELETE PRODUCT] Looking for product with ID: ${id}`);
  console.log(`[DELETE PRODUCT] Total products in database: ${products.length}`);
  console.log(`[DELETE PRODUCT] Available product IDs:`, products.map(p => p.id));

  const productIndex = products.findIndex(p => p.id === id);

  if (productIndex === -1) {
    console.log(`[DELETE PRODUCT] Product not found with ID: ${id}`);
    return sendError(res, 404, `Product not found. ID: ${id}`);
  }

  const deletedProduct = products[productIndex];
  console.log(`[DELETE PRODUCT] Deleting product:`, deletedProduct.name);
  products.splice(productIndex, 1);
  dbConnection.updateCollection('products', products);

  return sendResponse(res, 200, true, 'Product deleted successfully.', { deletedId: id });
};

// Send notification to specific user or broadcast to all users
export const sendNotification = async (req: Request, res: Response) => {
  const { userId, title, message, type, broadcast, sendEmail } = req.body;

  if (!title || !message) {
    return sendError(res, 400, 'Title and message are required.');
  }

  if (!type || !['info', 'success', 'warning', 'promotion'].includes(type)) {
    return sendError(res, 400, 'Invalid notification type. Must be: info, success, warning, or promotion.');
  }

  try {
    if (broadcast) {
      // Broadcast to all users via Socket.io
      broadcastAlert({
        title,
        message,
        type
      });

      // Send email to all users if requested
      if (sendEmail) {
        initEmailTransport();
        const users = dbConnection.getCollection('users').filter(u => (u.role as string) !== 'admin' && (u.role as string) !== 'super-admin');
        
        for (const user of users) {
          if (user.email) {
            try {
              await sendGeneralNotificationEmail(user.email, title, message);
            } catch (emailError) {
              console.error(`Failed to send email to ${user.email}:`, emailError);
            }
          }
        }
      }

      return sendResponse(res, 200, true, `Broadcast notification sent successfully.${sendEmail ? ' Emails sent to all users.' : ''}`);
    } else if (userId) {
      // Send to specific user
      const users = dbConnection.getCollection('users');
      const user = users.find(u => u.id === userId);

      if (!user) {
        return sendError(res, 404, 'User not found.');
      }

      // Send Socket.io notification
      notifyUser(userId, {
        title,
        message,
        type
      });

      // Send email notification if requested or by default for specific users
      if (sendEmail !== false && user.email) {
        initEmailTransport();
        sendGeneralNotificationEmail(user.email, title, message);
      }

      return sendResponse(res, 200, true, 'Notification sent successfully to user.');
    } else {
      return sendError(res, 400, 'Either userId or broadcast must be specified.');
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    return sendError(res, 500, 'Failed to send notification.');
  }
};

// Get notification history
export const getNotificationHistory = async (req: Request, res: Response) => {
  try {
    const notifications = dbConnection.getCollection('notifications') || [];
    return sendResponse(res, 200, true, 'Notification history retrieved.', { notifications });
  } catch (error) {
    console.error('Error fetching notification history:', error);
    return sendError(res, 500, 'Failed to fetch notification history.');
  }
};

// Admin Shipping Management
export const getShippingConfiguration = async (req: Request, res: Response) => {
  try {
    const headerConfigs = dbConnection.getCollection('headerConfig');
    
    // Check if shipping config exists in header config
    const existingConfig = headerConfigs.length > 0 ? (headerConfigs[0] as any).shippingConfig : null;
    
    if (!existingConfig) {
      const defaultConfig = {
        warehouseAddress: {
          street: process.env.WAREHOUSE_ADDRESS || 'Warehouse Complex',
          city: process.env.WAREHOUSE_CITY || 'Mumbai',
          state: process.env.WAREHOUSE_STATE || 'Maharashtra',
          zipCode: process.env.WAREHOUSE_PINCODE || '400001',
          country: 'India'
        },
        enabledCarriers: ['Delhivery', 'Blue Dart', 'FedEx India', 'DTDC', 'Ecom Express'],
        freeShippingThreshold: 999,
        defaultCarrier: 'Delhivery'
      };
      return sendResponse(res, 200, true, 'Default shipping configuration retrieved.', defaultConfig);
    }
    
    return sendResponse(res, 200, true, 'Shipping configuration retrieved.', existingConfig);
  } catch (error) {
    console.error('Error fetching shipping configuration:', error);
    return sendError(res, 500, 'Failed to fetch shipping configuration.');
  }
};

export const updateShippingConfiguration = async (req: Request, res: Response) => {
  try {
    const configData = req.body;
    const headerConfigs = dbConnection.getCollection('headerConfig');
    
    const newConfig = {
      warehouseAddress: configData.warehouseAddress || {
        street: 'Warehouse Complex',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India'
      },
      enabledCarriers: configData.enabledCarriers || ['Delhivery', 'Blue Dart', 'FedEx India'],
      freeShippingThreshold: configData.freeShippingThreshold || 999,
      defaultCarrier: configData.defaultCarrier || 'Delhivery'
    };
    
    if (headerConfigs.length === 0) {
      headerConfigs.push({ shippingConfig: newConfig } as any);
    } else {
      (headerConfigs[0] as any).shippingConfig = newConfig;
    }
    
    dbConnection.updateCollection('headerConfig', headerConfigs);
    return sendResponse(res, 200, true, 'Shipping configuration updated successfully.', newConfig);
  } catch (error) {
    console.error('Error updating shipping configuration:', error);
    return sendError(res, 500, 'Failed to update shipping configuration.');
  }
};

export const adminGetShippingRates = async (req: Request, res: Response) => {
  try {
    const { destinationAddress, packageDetails } = req.body;
    
    if (!destinationAddress || !packageDetails) {
      return sendError(res, 400, 'Destination address and package details are required.');
    }
    
    const headerConfigs = dbConnection.getCollection('headerConfig');
    const config = headerConfigs.length > 0 ? (headerConfigs[0] as any).shippingConfig : null;
    
    const originAddress = config?.warehouseAddress || {
      street: 'Warehouse Complex',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India'
    };
    
    const rates = await getShippingRates(originAddress, destinationAddress, packageDetails);
    
    return sendResponse(res, 200, true, 'Shipping rates calculated successfully.', {
      origin: originAddress,
      destination: destinationAddress,
      rates,
      currency: 'INR'
    });
  } catch (error) {
    console.error('Error calculating shipping rates:', error);
    return sendError(res, 500, 'Failed to calculate shipping rates.');
  }
};

export const adminGenerateTracking = async (req: Request, res: Response) => {
  try {
    const { carrier, orderId } = req.body;
    
    if (!carrier || !orderId) {
      return sendError(res, 400, 'Carrier and order ID are required.');
    }
    
    const trackingNumber = generateTrackingNumber(carrier, orderId);
    
    return sendResponse(res, 200, true, 'Tracking number generated successfully.', {
      trackingNumber,
      carrier,
      orderId
    });
  } catch (error) {
    console.error('Error generating tracking number:', error);
    return sendError(res, 500, 'Failed to generate tracking number.');
  }
};

export const adminTrackShipment = async (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.params;

    if (!trackingNumber) {
      return sendError(res, 400, 'Tracking number is required.');
    }

    const trackingInfo = await getTrackingInfo(trackingNumber);

    return sendResponse(res, 200, true, 'Shipment tracking information retrieved.', trackingInfo);
  } catch (error) {
    console.error('Error tracking shipment:', error);
    return sendError(res, 500, 'Failed to track shipment.');
  }
};

// Timer Configuration Management
export const getTimerConfigs = async (req: Request, res: Response) => {
  try {
    const timers = dbConnection.getCollection('timers') || [];
    return sendResponse(res, 200, true, 'Timer configurations retrieved.', { timers });
  } catch (error) {
    console.error('Error fetching timer configs:', error);
    return sendError(res, 500, 'Failed to fetch timer configurations.');
  }
};

export const createTimerConfig = async (req: Request, res: Response) => {
  try {
    const timerData: TimerConfig = req.body;

    if (!timerData.name || !timerData.duration) {
      return sendError(res, 400, 'Timer name and duration are required.');
    }

    const timers = dbConnection.getCollection('timers') || [];
    const newTimer: TimerConfig = {
      id: timerData.id || `timer-${Date.now()}`,
      name: timerData.name,
      description: timerData.description || '',
      duration: timerData.duration,
      isActive: timerData.isActive !== undefined ? timerData.isActive : true,
      applicableProducts: timerData.applicableProducts || [],
      applicableCategories: timerData.applicableCategories || [],
      startDate: timerData.startDate,
      endDate: timerData.endDate,
      template: timerData.template || 'flash-sale',
      customTemplate: timerData.customTemplate,
      createdAt: timerData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    timers.push(newTimer);
    dbConnection.updateCollection('timers', timers);

    return sendResponse(res, 201, true, 'Timer configuration created successfully.', newTimer);
  } catch (error) {
    console.error('Error creating timer config:', error);
    return sendError(res, 500, 'Failed to create timer configuration.');
  }
};

export const updateTimerConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const timerData: TimerConfig = req.body;

    if (!id) {
      return sendError(res, 400, 'Timer ID is required.');
    }

    const timers = dbConnection.getCollection('timers') || [];
    const timerIndex = timers.findIndex(t => t.id === id);

    if (timerIndex === -1) {
      return sendError(res, 404, 'Timer configuration not found.');
    }

    timers[timerIndex] = {
      ...timers[timerIndex],
      ...timerData,
      id: timers[timerIndex].id, // Preserve original ID
      createdAt: timers[timerIndex].createdAt, // Preserve original creation date
      updatedAt: new Date().toISOString()
    };

    dbConnection.updateCollection('timers', timers);

    return sendResponse(res, 200, true, 'Timer configuration updated successfully.', timers[timerIndex]);
  } catch (error) {
    console.error('Error updating timer config:', error);
    return sendError(res, 500, 'Failed to update timer configuration.');
  }
};

export const deleteTimerConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendError(res, 400, 'Timer ID is required.');
    }

    const timers = dbConnection.getCollection('timers') || [];
    const timerIndex = timers.findIndex(t => t.id === id);

    if (timerIndex === -1) {
      return sendError(res, 404, 'Timer configuration not found.');
    }

    timers.splice(timerIndex, 1);
    dbConnection.updateCollection('timers', timers);

    return sendResponse(res, 200, true, 'Timer configuration deleted successfully.');
  } catch (error) {
    console.error('Error deleting timer config:', error);
    return sendError(res, 500, 'Failed to delete timer configuration.');
  }
};

// Warranty Configuration Management
export const getWarrantyConfigs = async (req: Request, res: Response) => {
  try {
    const warranties = dbConnection.getCollection('warranties') || [];
    return sendResponse(res, 200, true, 'Warranty configurations retrieved.', { warranties });
  } catch (error) {
    console.error('Error fetching warranty configs:', error);
    return sendError(res, 500, 'Failed to fetch warranty configurations.');
  }
};

export const createWarrantyConfig = async (req: Request, res: Response) => {
  try {
    const warrantyData: WarrantyConfig = req.body;

    if (!warrantyData.name || !warrantyData.duration) {
      return sendError(res, 400, 'Warranty name and duration are required.');
    }

    const warranties = dbConnection.getCollection('warranties') || [];
    const newWarranty: WarrantyConfig = {
      id: warrantyData.id || `warranty-${Date.now()}`,
      name: warrantyData.name,
      description: warrantyData.description || '',
      duration: warrantyData.duration,
      coverage: warrantyData.coverage || [],
      terms: warrantyData.terms || '',
      isActive: warrantyData.isActive !== undefined ? warrantyData.isActive : true,
      applicableProducts: warrantyData.applicableProducts || [],
      applicableCategories: warrantyData.applicableCategories || [],
      template: warrantyData.template || 'standard',
      customTemplate: warrantyData.customTemplate,
      createdAt: warrantyData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    warranties.push(newWarranty);
    dbConnection.updateCollection('warranties', warranties);

    return sendResponse(res, 201, true, 'Warranty configuration created successfully.', newWarranty);
  } catch (error) {
    console.error('Error creating warranty config:', error);
    return sendError(res, 500, 'Failed to create warranty configuration.');
  }
};

export const updateWarrantyConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const warrantyData: WarrantyConfig = req.body;

    if (!id) {
      return sendError(res, 400, 'Warranty ID is required.');
    }

    const warranties = dbConnection.getCollection('warranties') || [];
    const warrantyIndex = warranties.findIndex(w => w.id === id);

    if (warrantyIndex === -1) {
      return sendError(res, 404, 'Warranty configuration not found.');
    }

    warranties[warrantyIndex] = {
      ...warranties[warrantyIndex],
      ...warrantyData,
      id: warranties[warrantyIndex].id, // Preserve original ID
      createdAt: warranties[warrantyIndex].createdAt, // Preserve original creation date
      updatedAt: new Date().toISOString()
    };

    dbConnection.updateCollection('warranties', warranties);

    return sendResponse(res, 200, true, 'Warranty configuration updated successfully.', warranties[warrantyIndex]);
  } catch (error) {
    console.error('Error updating warranty config:', error);
    return sendError(res, 500, 'Failed to update warranty configuration.');
  }
};

export const deleteWarrantyConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendError(res, 400, 'Warranty ID is required.');
    }

    const warranties = dbConnection.getCollection('warranties') || [];
    const warrantyIndex = warranties.findIndex(w => w.id === id);

    if (warrantyIndex === -1) {
      return sendError(res, 404, 'Warranty configuration not found.');
    }

    warranties.splice(warrantyIndex, 1);
    dbConnection.updateCollection('warranties', warranties);

    return sendResponse(res, 200, true, 'Warranty configuration deleted successfully.');
  } catch (error) {
    console.error('Error deleting warranty config:', error);
    return sendError(res, 500, 'Failed to delete warranty configuration.');
  }
};

// Admin Tax Management
export const getTaxConfiguration = async (req: Request, res: Response) => {
  try {
    const headerConfigs = dbConnection.getCollection('headerConfig');
    
    // Check if tax config exists in header config
    const existingConfig = headerConfigs.length > 0 ? (headerConfigs[0] as any).taxConfig : null;
    
    if (!existingConfig) {
      const defaultConfig = {
        businessState: process.env.BUSINESS_STATE || 'Maharashtra',
        businessStateCode: 'MH',
        defaultTaxRate: 18,
        taxRates: {
          essential: 0,
          books: 0,
          grains: 0,
          textiles: 5,
          footwear_under_1000: 5,
          medicines: 5,
          coal: 5,
          footwear_over_1000: 12,
          mobile_phones: 12,
          processed_food: 12,
          butter: 12,
          cheese: 12,
          soaps: 12,
          electronics: 18,
          computers: 18,
          appliances: 18,
          furniture: 18,
          clothing: 18,
          cosmetics: 18,
          restaurant_service: 18,
          telecom: 18,
          it_services: 18,
          general: 18,
          luxury_cars: 28,
          tobacco: 28,
          aerated_drinks: 28,
          ac_hotels: 28,
          luxury_watches: 28
        }
      };
      return sendResponse(res, 200, true, 'Default tax configuration retrieved.', defaultConfig);
    }
    
    return sendResponse(res, 200, true, 'Tax configuration retrieved.', existingConfig);
  } catch (error) {
    console.error('Error fetching tax configuration:', error);
    return sendError(res, 500, 'Failed to fetch tax configuration.');
  }
};

export const updateTaxConfiguration = async (req: Request, res: Response) => {
  try {
    const configData = req.body;
    const headerConfigs = dbConnection.getCollection('headerConfig');
    
    const newConfig = {
      businessState: configData.businessState || 'Maharashtra',
      businessStateCode: configData.businessStateCode || 'MH',
      defaultTaxRate: configData.defaultTaxRate || 18,
      taxRates: configData.taxRates || {
        general: 18
      }
    };
    
    if (headerConfigs.length === 0) {
      headerConfigs.push({ taxConfig: newConfig } as any);
    } else {
      (headerConfigs[0] as any).taxConfig = newConfig;
    }
    
    dbConnection.updateCollection('headerConfig', headerConfigs);
    return sendResponse(res, 200, true, 'Tax configuration updated successfully.', newConfig);
  } catch (error) {
    console.error('Error updating tax configuration:', error);
    return sendError(res, 500, 'Failed to update tax configuration.');
  }
};

export const adminCalculateTax = async (req: Request, res: Response) => {
  try {
    const { amount, customerAddress, productCategory } = req.body;
    
    if (!amount || !customerAddress) {
      return sendError(res, 400, 'Amount and customer address are required.');
    }
    
    const taxCalculation = calculateGST(amount, customerAddress, productCategory || 'general');
    
    return sendResponse(res, 200, true, 'Tax calculated successfully.', {
      amount,
      customerAddress,
      taxCalculation,
      currency: 'INR'
    });
  } catch (error) {
    console.error('Error calculating tax:', error);
    return sendError(res, 500, 'Failed to calculate tax.');
  }
};

export const adminValidateState = async (req: Request, res: Response) => {
  try {
    const { state } = req.body;

    if (!state) {
      return sendError(res, 400, 'State name is required.');
    }

    const isValid = validateStateName(state);
    const stateCode = isValid ? getStateCode(state) : null;

    return sendResponse(res, 200, true, 'State validation completed.', {
      state,
      isValid,
      stateCode
    });
  } catch (error) {
    console.error('Error validating state:', error);
    return sendError(res, 500, 'Failed to validate state.');
  }
};

// Email Template Management Functions
export const getEmailTemplates = async (req: Request, res: Response) => {
  try {
    const headerConfigs = dbConnection.getCollection('headerConfig');

    let emailTemplates: EmailTemplate[] = [];

    if (headerConfigs.length > 0 && (headerConfigs[0] as any).emailTemplates) {
      emailTemplates = (headerConfigs[0] as any).emailTemplates;
    } else {
      // Initialize with default templates
      emailTemplates = DEFAULT_EMAIL_TEMPLATES;
      const updatedConfig = { ...headerConfigs[0], emailTemplates: DEFAULT_EMAIL_TEMPLATES };
      dbConnection.updateCollection('headerConfig', [updatedConfig]);
    }

    return sendResponse(res, 200, true, 'Email templates retrieved successfully.', { emailTemplates });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return sendError(res, 500, 'Failed to fetch email templates.');
  }
};

export const getEmailTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;

    if (!templateId) {
      return sendError(res, 400, 'Template ID is required.');
    }

    const headerConfigs = dbConnection.getCollection('headerConfig');

    if (headerConfigs.length === 0 || !(headerConfigs[0] as any).emailTemplates) {
      return sendError(res, 404, 'Email templates not found.');
    }

    const emailTemplates = (headerConfigs[0] as any).emailTemplates;
    const template = emailTemplates.find((t: EmailTemplate) => t.id === templateId);

    if (!template) {
      return sendError(res, 404, 'Email template not found.');
    }

    return sendResponse(res, 200, true, 'Email template retrieved successfully.', { template });
  } catch (error) {
    console.error('Error fetching email template:', error);
    return sendError(res, 500, 'Failed to fetch email template.');
  }
};

export const updateEmailTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const { subject, body, isActive } = req.body;

    if (!templateId) {
      return sendError(res, 400, 'Template ID is required.');
    }

    if (!subject || !body) {
      return sendError(res, 400, 'Subject and body are required.');
    }

    const headerConfigs = dbConnection.getCollection('headerConfig');

    if (headerConfigs.length === 0 || !(headerConfigs[0] as any).emailTemplates) {
      return sendError(res, 404, 'Email templates not found.');
    }

    const emailTemplates = (headerConfigs[0] as any).emailTemplates;
    const templateIndex = emailTemplates.findIndex((t: EmailTemplate) => t.id === templateId);

    if (templateIndex === -1) {
      return sendError(res, 404, 'Email template not found.');
    }

    // Update template
    emailTemplates[templateIndex] = {
      ...emailTemplates[templateIndex],
      subject,
      body,
      isActive: isActive !== undefined ? isActive : emailTemplates[templateIndex].isActive,
      updatedAt: new Date()
    };

    const updatedConfig = { ...headerConfigs[0], emailTemplates };
    dbConnection.updateCollection('headerConfig', [updatedConfig]);

    return sendResponse(res, 200, true, 'Email template updated successfully.', { template: emailTemplates[templateIndex] });
  } catch (error) {
    console.error('Error updating email template:', error);
    return sendError(res, 500, 'Failed to update email template.');
  }
};

export const createEmailTemplate = async (req: Request, res: Response) => {
  try {
    const { eventName, subject, body, variables } = req.body;

    if (!eventName || !subject || !body) {
      return sendError(res, 400, 'Event name, subject, and body are required.');
    }

    const headerConfigs = dbConnection.getCollection('headerConfig');

    let emailTemplates: EmailTemplate[] = [];

    if (headerConfigs.length > 0 && (headerConfigs[0] as any).emailTemplates) {
      emailTemplates = (headerConfigs[0] as any).emailTemplates;
    }

    // Check if template with same event name already exists
    const existingTemplate = emailTemplates.find((t: EmailTemplate) => t.eventName === eventName);
    if (existingTemplate) {
      return sendError(res, 400, 'Email template with this event name already exists.');
    }

    const newTemplate: EmailTemplate = {
      id: `custom-${Date.now()}`,
      eventName,
      subject,
      body,
      variables: variables || [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    emailTemplates.push(newTemplate);

    const updatedConfig = headerConfigs.length > 0 ? { ...headerConfigs[0], emailTemplates } : headerConfigs[0];
    dbConnection.updateCollection('headerConfig', [updatedConfig]);

    return sendResponse(res, 201, true, 'Email template created successfully.', { template: newTemplate });
  } catch (error) {
    console.error('Error creating email template:', error);
    return sendError(res, 500, 'Failed to create email template.');
  }
};

export const deleteEmailTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;

    if (!templateId) {
      return sendError(res, 400, 'Template ID is required.');
    }

    const headerConfigs = dbConnection.getCollection('headerConfig');

    if (headerConfigs.length === 0 || !(headerConfigs[0] as any).emailTemplates) {
      return sendError(res, 404, 'Email templates not found.');
    }

    const emailTemplates = (headerConfigs[0] as any).emailTemplates;
    const templateIndex = emailTemplates.findIndex((t: EmailTemplate) => t.id === templateId);

    if (templateIndex === -1) {
      return sendError(res, 404, 'Email template not found.');
    }

    // Don't allow deletion of default templates
    if (DEFAULT_EMAIL_TEMPLATES.some(t => t.id === templateId)) {
      return sendError(res, 400, 'Cannot delete default email templates.');
    }

    emailTemplates.splice(templateIndex, 1);

    const updatedConfig = { ...headerConfigs[0], emailTemplates };
    dbConnection.updateCollection('headerConfig', [updatedConfig]);

    return sendResponse(res, 200, true, 'Email template deleted successfully.');
  } catch (error) {
    console.error('Error deleting email template:', error);
    return sendError(res, 500, 'Failed to delete email template.');
  }
};

export const previewEmailTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId, variables } = req.body;

    if (!templateId) {
      return sendError(res, 400, 'Template ID is required.');
    }

    const headerConfigs = dbConnection.getCollection('headerConfig');

    if (headerConfigs.length === 0 || !(headerConfigs[0] as any).emailTemplates) {
      return sendError(res, 404, 'Email templates not found.');
    }

    const emailTemplates = (headerConfigs[0] as any).emailTemplates;
    const template = emailTemplates.find((t: EmailTemplate) => t.id === templateId);

    if (!template) {
      return sendError(res, 404, 'Email template not found.');
    }

    // Replace variables in subject and body
    let previewSubject = template.subject;
    let previewBody = template.body;

    if (variables) {
      Object.keys(variables).forEach(key => {
        const placeholder = `{{${key}}}`;
        previewSubject = previewSubject.replace(new RegExp(placeholder, 'g'), variables[key]);
        previewBody = previewBody.replace(new RegExp(placeholder, 'g'), variables[key]);
      });
    }

    return sendResponse(res, 200, true, 'Email template preview generated successfully.', {
      subject: previewSubject,
      body: previewBody
    });
  } catch (error) {
    console.error('Error previewing email template:', error);
    return sendError(res, 500, 'Failed to preview email template.');
  }
};
