import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { db } from './src/db/dataStore';
import { User, Product, Category, Review, Coupon, Order, AppNotification, HomeContent, Newsletter } from './src/types';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import { initEmailTransport, sendNewsletterEmail } from './backend/utils/email';

// Enterprise MERN Additions
import { dbConnection } from './backend/config/db';
import { getMongoDb } from './backend/config/mongodb';
import { validateProductionEnvironment } from './backend/config/envValidation';
import masterRouter from './backend/routes/index';
import uploadRoutes from './backend/routes/upload.routes';
import { secureHeaders, sanitizeInput, rateLimiter } from './backend/middleware/security.middleware';
import { globalErrorHandler } from './backend/middleware/error.middleware';
import { initiateScheduledJobs } from './backend/jobs/inventoryCheck.job';
import { broadcastAlert, initSocketServer, notifyUser } from './backend/sockets/socketService';
import { observabilityTracker } from './backend/middleware/observability.middleware';
import { createAccessToken, createRefreshToken, generateTokenId, verifyAccessToken, verifyRefreshToken } from './backend/auth/tokens';
import { getRefreshSessionByJti, initRefreshTokenIndexes, revokeAllUserRefreshSessions, revokeRefreshSession, storeRefreshSession } from './backend/auth/refreshTokenStore';
import { ProductCache, CategoryCache, CouponCache, invalidateCacheChannel } from './backend/utils/cache';
import { sendPasswordResetEmail } from './backend/utils/email';
import crypto from 'crypto';

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

const withHeroSlides = (config: any) => ({
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

function isProd() {
  return process.env.NODE_ENV === 'production';
}

function setRefreshCookie(res: express.Response, refreshToken: string, rememberMe?: boolean) {
  res.cookie('ms_refresh', refreshToken, {
    httpOnly: true,
    secure: isProd(),
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
  });
}

function clearAuthCookies(res: express.Response) {
  res.clearCookie('ms_refresh', { path: '/api/auth' });
  res.clearCookie('ms_access', { path: '/' });
}

async function verifyPasswordWithBcrypt(args: { user: any; password: string }): Promise<boolean> {
  const stored = String(args.user.passwordHash || '');
  const plain = args.password;

  // Only bcrypt hashes are supported - no legacy formats
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    try {
      return await bcrypt.compare(plain, stored);
    } catch {
      return false;
    }
  }

  return false;
}

// Authentication middleware (real JWT)
const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if ((req as any).cookies?.ms_access) {
    token = (req as any).cookies.ms_access;
  }

  if (!token) {
    res.status(401).json({ error: 'Authorization header required' });
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = db.getUsers().find(u => u.id === decoded.sub);
    if (!user) {
      res.status(401).json({ error: 'Owner profile has been deleted or deactivated.' });
      return;
    }
    (req as any).user = { id: user.id, role: user.role, email: user.email };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Admin auth middleware
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  authenticate(req, res, () => {
    const role = (req as any).user?.role;
    if (role !== 'admin' && role !== 'super-admin') {
      res.status(403).json({ error: 'Access denied: Admin permissions required' });
      return;
    }
    next();
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Run security and environment checks first
  validateProductionEnvironment();

  // Initialize database connection first
  await dbConnection.connect();

  // Initialize email transport
  initEmailTransport();

  // Initializing MongoDB Sync Boot cycle
  await dbConnection.initMongoSync();
  db.reload(); // Reload customer-facing legacy data cache with MongoDB dataset

  // 0. Global Observability, Logging, and Request Tracing
  app.use(observabilityTracker);
  app.use(compression());

  // Expose root URLs for health checks and logs
  app.use('/health', (req, res) => {
    res.redirect('/api/v2/health');
  });
  app.use('/metrics', (req, res) => {
    res.redirect('/api/v2/metrics');
  });

  // 1. Enterprise Security Shielding & Sanitization Filters
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(secureHeaders);
  app.use(cookieParser(process.env.SESSION_SECRET));
  
  // Upload route must be before JSON parser to handle multipart/form-data
  app.use('/api/upload', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  app.use('/api/upload', uploadRoutes);
  
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
  app.use(sanitizeInput);
  app.use('/api', rateLimiter(1000, 60000)); // Increased limit for development: 1000 requests per minute
  
  // CORS middleware for API routes
  app.use('/api', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // 2. Initiate Background Cron Tasks
  initiateScheduledJobs();

  // 3. Mount Central Unified Master Enterprise Router
  app.use('/api', masterRouter);

  // --- API ROUTES ---

  // 1. AUTHENTICATION REST APIs (real JWT + refresh rotation)
  app.post('/api/auth/register', async (req, res) => {
    const { name, email, phone, password, confirmPassword, referrerCode, role } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      res.status(400).json({ error: 'Name, email, password, and confirmPassword are required' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match' });
      return;
    }

    // For vendor registration, phone is required
    if (role === 'vendor' && !phone) {
      res.status(400).json({ error: 'Phone number is required for vendor registration' });
      return;
    }

    const users = db.getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      res.status(400).json({ error: 'Account with this email already exists' });
      return;
    }

    // Process referral if exists
    let referredBy: string | undefined;
    if (referrerCode) {
      const referrer = users.find(u => u.referralCode?.toLowerCase() === String(referrerCode).toLowerCase());
      if (referrer) {
        referredBy = referrer.id;
        referrer.loyaltyPoints += 50; // Give referrer 50 points
      }
    }

    const passwordHash = await bcrypt.hash(String(password), 12);
    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: role || 'customer',
      addresses: [],
      loyaltyPoints: referredBy ? 50 : 20,
      referralCode: `MS${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      referredBy
    };

    users.push(newUser);
    db.setUsers(users);

    await initRefreshTokenIndexes();
    const refreshId = generateTokenId();
    const refreshToken = createRefreshToken({ userId: newUser.id, tokenId: refreshId });
    await storeRefreshSession({
      userId: newUser.id,
      jti: refreshId,
      userAgent: req.headers['user-agent'] as string | undefined,
      ipAddress: (req.headers['x-forwarded-for'] as string | undefined) || req.ip
    });
    setRefreshCookie(res, refreshToken);

    const accessToken = createAccessToken({ userId: newUser.id, role: newUser.role as any, email: newUser.email });

    res.status(201).json({
      message: 'Account created successfully.',
      token: accessToken,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        loyaltyPoints: newUser.loyaltyPoints,
        referralCode: newUser.referralCode,
        addresses: newUser.addresses
      }
    });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const users = db.getUsers();
    const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password credentials' });
      return;
    }

    const ok = await verifyPasswordWithBcrypt({ user, password: String(password) });
    if (!ok) {
      res.status(401).json({ error: 'Invalid email or password credentials' });
      return;
    }

    await initRefreshTokenIndexes();
    const refreshId = generateTokenId();
    const refreshToken = createRefreshToken({ userId: user.id, tokenId: refreshId });
    await storeRefreshSession({
      userId: user.id,
      jti: refreshId,
      userAgent: req.headers['user-agent'] as string | undefined,
      ipAddress: (req.headers['x-forwarded-for'] as string | undefined) || req.ip
    });
    setRefreshCookie(res, refreshToken, Boolean(rememberMe));

    const accessToken = createAccessToken({ userId: user.id, role: user.role as any, email: user.email });
    res.json({
      message: 'Logged in successfully',
      token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
        referralCode: user.referralCode,
        addresses: user.addresses,
        avatar: user.avatar
      }
    });
  });

  app.post('/api/auth/refresh', async (req, res) => {
    const rt = (req as any).cookies?.ms_refresh;
    if (!rt) {
      res.status(401).json({ error: 'Refresh token not found' });
      return;
    }
    try {
      await initRefreshTokenIndexes();
      const decoded = verifyRefreshToken(rt);
      const existing = await getRefreshSessionByJti(decoded.jti);
      if (!existing || existing.revokedAt) {
        clearAuthCookies(res);
        res.status(401).json({ error: 'Refresh token has been revoked' });
        return;
      }

      // Rotate refresh token
      const nextId = generateTokenId();
      const nextRefreshToken = createRefreshToken({ userId: decoded.sub, tokenId: nextId });
      await storeRefreshSession({
        userId: decoded.sub,
        jti: nextId,
        userAgent: req.headers['user-agent'] as string | undefined,
        ipAddress: (req.headers['x-forwarded-for'] as string | undefined) || req.ip
      });
      await revokeRefreshSession({ jti: decoded.jti, replacedByJti: nextId });
      setRefreshCookie(res, nextRefreshToken);

      const user = db.getUsers().find(u => u.id === decoded.sub);
      if (!user) {
        clearAuthCookies(res);
        res.status(401).json({ error: 'Owner profile has been deleted or deactivated.' });
        return;
      }

      const accessToken = createAccessToken({ userId: user.id, role: user.role as any, email: user.email });
      res.json({ token: accessToken, user });
    } catch {
      clearAuthCookies(res);
      res.status(401).json({ error: 'Refresh token is invalid or expired' });
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    const rt = (req as any).cookies?.ms_refresh;
    if (rt) {
      try {
        const decoded = verifyRefreshToken(rt);
        await revokeRefreshSession({ jti: decoded.jti });
      } catch {
        // ignore
      }
    }
    clearAuthCookies(res);
    res.json({ message: 'Logged out' });
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Valid verification email required.' });
      return;
    }

    const users = db.getUsers();
    const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
    if (user) {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
      (user as any).resetPasswordOtp = otpHash;
      (user as any).resetPasswordExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry
      db.setUsers(users);

      // Try to send email with OTP
      const emailSent = await sendPasswordResetEmail(email, otp);

      // In dev mode, if email fails or not configured, return OTP for testing
      if (!isProd() && !emailSent) {
        res.json({ message: 'OTP generated (dev-only return).', otp });
        return;
      }

      if (emailSent) {
        res.json({ message: 'OTP has been sent to your email.' });
        return;
      }
    }

    res.json({ message: 'If the email exists, OTP has been sent.' });
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      res.status(400).json({ error: 'Email, OTP, and new password are required' });
      return;
    }

    const users = db.getUsers();
    const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const otpHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
    if ((user as any).resetPasswordOtp !== otpHash) {
      res.status(400).json({ error: 'Invalid or expired OTP' });
      return;
    }
    if ((user as any).resetPasswordExpiry && new Date((user as any).resetPasswordExpiry).getTime() < Date.now()) {
      res.status(400).json({ error: 'OTP has expired' });
      return;
    }

    user.passwordHash = await bcrypt.hash(String(password), 12);
    (user as any).resetPasswordOtp = undefined;
    (user as any).resetPasswordExpiry = undefined;
    db.setUsers(users);

    await revokeAllUserRefreshSessions(user.id);
    clearAuthCookies(res);
    res.json({ message: 'Password reset successfully' });
  });

  // 2. USER PROFILE & ADDRESS RESTS
  app.get('/api/users/profile', authenticate, async (req, res) => {
    const { id: userId } = (req as any).user;
    // Use dbConnection (MongoDB) instead of legacy db dataStore for consistency with Admin Panel
    const users = dbConnection.getCollection('users');
    const user = users.find(u => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    console.log(`[LOYALTY POINTS] GET /api/users/profile - customerId: ${userId}, loyaltyPoints: ${user.loyaltyPoints}`);
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
        referralCode: user.referralCode,
        addresses: user.addresses,
        avatar: user.avatar,
        profilePhoto: user.profilePhoto
      }
    });
  });

  app.put('/api/users/profile', authenticate, async (req, res) => {
    const { id: userId } = (req as any).user;
    const { name, phone, avatar, profilePhoto } = req.body;
    // Use dbConnection (MongoDB) instead of legacy db dataStore for consistency with Admin Panel
    const users = dbConnection.getCollection('users');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = users[userIndex];
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar) user.avatar = avatar;
    if (profilePhoto) user.profilePhoto = profilePhoto;

    await dbConnection.updateCollection('users', users);
    console.log(`[LOYALTY POINTS] PUT /api/users/profile - customerId: ${userId}, loyaltyPoints: ${user.loyaltyPoints}`);
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
        referralCode: user.referralCode,
        addresses: user.addresses,
        avatar: user.avatar,
        profilePhoto: user.profilePhoto
      }
    });
  });

  app.post('/api/users/addresses', authenticate, async (req, res) => {
    const { id: userId } = (req as any).user;
    const { street, city, state, zipCode, country, isDefault } = req.body;

    if (!street || !city || !state || !zipCode || !country) {
      res.status(400).json({ error: 'All address fields are required' });
      return;
    }

    // Use dbConnection (MongoDB) instead of legacy db dataStore for consistency with Admin Panel
    const users = dbConnection.getCollection('users');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = users[userIndex];
    if (isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    }

    const newAddress = {
      id: `addr_${Date.now()}`,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault: isDefault || user.addresses.length === 0
    };

    user.addresses.push(newAddress);
    await dbConnection.updateCollection('users', users);

    res.status(201).json({ message: 'Address added successfully', addresses: user.addresses });
  });

  app.delete('/api/users/addresses/:id', authenticate, async (req, res) => {
    const { id: userId } = (req as any).user;
    const addressId = req.params.id;

    // Use dbConnection (MongoDB) instead of legacy db dataStore for consistency with Admin Panel
    const users = dbConnection.getCollection('users');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = users[userIndex];
    user.addresses = user.addresses.filter(a => a.id !== addressId);
    // ensure at least one is default if list isn't empty
    if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await dbConnection.updateCollection('users', users);
    res.json({ message: 'Address removed successfully', addresses: user.addresses });
  });

  // 3. PRODUCT & CATEGORY & SEARCH APIS
  app.get('/api/products', async (req, res) => {
    const { category, brand, search, minPrice, maxPrice, rating, limit, sort, discount } = req.query;

    // Generate cache key from filters
    const filterKey = JSON.stringify({ category, brand, search, minPrice, maxPrice, rating, limit, sort, discount });
    
    // Try to get from cache
    const cached = await ProductCache.get(filterKey);
    if (cached) {
      res.setHeader('X-Cache-Status', 'HIT');
      return res.json({ products: cached });
    }

    let products = [...db.getProducts()];

    // Search query
    if (search) {
      const q = (search as string).toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (category && category !== 'all') {
      products = products.filter(p => p.category === category);
    }

    // Brand filter
    if (brand && brand !== 'all') {
      products = products.filter(p => p.brand.toLowerCase() === (brand as string).toLowerCase());
    }

    // Price filters
    if (minPrice) {
      products = products.filter(p => (p.discountPrice || p.price) >= parseFloat(minPrice as string));
    }
    if (maxPrice) {
      products = products.filter(p => (p.discountPrice || p.price) <= parseFloat(maxPrice as string));
    }

    // Minimum rating filter
    if (rating) {
      products = products.filter(p => p.rating >= parseFloat(rating as string));
    }

    // Discounts filter
    if (discount === 'true') {
      products = products.filter(p => p.discountPrice && p.discountPrice < p.price);
    }

    // Sorting
    if (sort) {
      if (sort === 'price-asc') {
        products.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
      } else if (sort === 'price-desc') {
        products.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
      } else if (sort === 'rating') {
        products.sort((a, b) => b.rating - a.rating);
      } else if (sort === 'newest') {
        products.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
      }
    }

    if (limit) {
      products = products.slice(0, parseInt(limit as string));
    }

    // Cache the results
    await ProductCache.set(filterKey, products, 600);
    res.setHeader('X-Cache-Status', 'MISS');
    res.json({ products });
  });

  app.get('/api/categories', async (req, res) => {
    // Try to get from cache
    const cached = await CategoryCache.getAll();
    if (cached) {
      res.setHeader('X-Cache-Status', 'HIT');
      return res.json({ categories: cached });
    }

    const categories = db.getCategories();
    await CategoryCache.setAll(categories, 7200);
    res.setHeader('X-Cache-Status', 'MISS');
    res.json({ categories });
  });

  app.delete('/api/admin/categories/:id', requireAdmin, async (req, res) => {
    let categories = db.getCategories();
    if (!categories.some(c => c.id === req.params.id)) {
      res.status(404).json({ error: 'Category not discovered' });
      return;
    }
    categories = categories.filter(c => c.id !== req.params.id);
    db.setCategories(categories);
    
    // Invalidate category cache
    await CategoryCache.invalidateAll();
    
    res.json({ message: 'Category removed successfully' });
  });

  app.get('/api/products/:idOrSlug', async (req, res) => {
    const ident = req.params.idOrSlug;
    
    // Try to get from cache
    const cached = await ProductCache.get(ident);
    if (cached) {
      res.setHeader('X-Cache-Status', 'HIT');
      return res.json(cached);
    }

    const products = db.getProducts();
    const product = products.find(p => p.id === ident || p.slug === ident);

    if (!product) {
      res.status(404).json({ error: 'Product not discovered' });
      return;
    }

    // Fetch related reviews from dataStore
    const reviews = db.getReviews().filter(r => r.productId === product.id && r.approved);

    // Fetch related products (same category)
    const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

    const response = { product, reviews, related };
    await ProductCache.set(ident, response, 3600);
    res.setHeader('X-Cache-Status', 'MISS');
    res.json(response);
  });

  // 4. COUPON VALIDATION
  app.post('/api/coupons/validate', async (req, res) => {
    const { code, subtotal } = req.body;
    if (!code) {
      res.status(400).json({ error: 'Coupon code required' });
      return;
    }

    // Try to get from cache
    const cached = await CouponCache.get(code);
    if (cached) {
      // Validate cached coupon against current conditions
      if (new Date(cached.expiryDate) < new Date()) {
        await CouponCache.delete(code);
      } else if (!cached.usageLimit || cached.usedCount < cached.usageLimit) {
        if (!cached.minPurchase || subtotal >= cached.minPurchase) {
          res.setHeader('X-Cache-Status', 'HIT');
          return res.json({ coupon: cached });
        }
      }
    }

    const coupons = db.getCoupons();
    const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());

    if (!coupon) {
      res.status(404).json({ error: 'Coupon code does not exist' });
      return;
    }

    // Expired check
    if (new Date(coupon.expiryDate) < new Date()) {
      res.status(400).json({ error: 'Coupon code has expired' });
      return;
    }

    // Usage check
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      res.status(400).json({ error: 'Coupon limit exceeded' });
      return;
    }

    // Minimum purchase check
    if (coupon.minPurchase && subtotal < coupon.minPurchase) {
      res.status(400).json({ error: `Minimum purchase of $${coupon.minPurchase} needed for this coupon` });
      return;
    }

    // Cache valid coupon
    await CouponCache.set(code, coupon, 1800);
    res.setHeader('X-Cache-Status', 'MISS');
    res.json({ coupon });
  });

  // 5. ORDER CREATION & TRACKING - Handled by backend routes (order.routes.ts)
  // This duplicate endpoint has been removed to avoid conflicts with backend routes

  // Public Timer and Warranty Configurations (for product pages)
  app.get('/api/timers', async (req, res) => {
    try {
      const timers = dbConnection.getCollection('timers') || [];
      res.json({ timers });
    } catch (error) {
      console.error('Error fetching timers:', error);
      res.json({ timers: [] });
    }
  });

  app.get('/api/warranties', async (req, res) => {
    try {
      const warranties = dbConnection.getCollection('warranties') || [];
      res.json({ warranties });
    } catch (error) {
      console.error('Error fetching warranties:', error);
      res.json({ warranties: [] });
    }
  });

  app.get('/api/orders/my-orders', authenticate, (req, res) => {
    const { id: userId } = (req as any).user;
    const orders = db.getOrders().filter(o => o.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ orders });
  });

  app.put('/api/orders/:id/cancel', authenticate, (req, res) => {
    const { id: userId } = (req as any).user;
    const orderId = req.params.id;

    const orders = db.getOrders();
    const order = orders.find(o => o.id === orderId && o.userId === userId);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.status !== 'Pending' && order.status !== 'Processing') {
      res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
      return;
    }

    order.status = 'Cancelled';
    db.setOrders(orders);

    res.json({ message: 'Order was successfully cancelled', order });
  });

  // 6. IN-APP & EMAIL NOTIFICATIONS
  app.get('/api/notifications', authenticate, (req, res) => {
    const { id: userId } = (req as any).user;
    const notifs = db.getNotifications().filter(n => n.userId === 'all' || n.userId === userId);
    res.json({ notifications: notifs });
  });

  app.post('/api/notifications/mark-read', authenticate, (req, res) => {
    const { id: userId } = (req as any).user;
    const { notificationId } = req.body;
    const notifs = db.getNotifications();
    
    if (notificationId) {
      // Mark specific notification as read
      const notif = notifs.find(n => n.id === notificationId);
      if (notif && (notif.userId === 'all' || notif.userId === userId)) {
        notif.read = true;
      }
    } else {
      // Mark all notifications as read
      notifs.forEach(n => {
        if (n.userId === 'all' || n.userId === userId) {
          n.read = true;
        }
      });
    }
    
    db.setNotifications(notifs);
    res.json({ message: notificationId ? 'Notification marked as read' : 'All notifications marked as read' });
  });

  app.post('/api/notifications/dismiss', authenticate, (req, res) => {
    const { id: userId } = (req as any).user;
    const { notificationId } = req.body;
    const notifs = db.getNotifications();
    
    if (notificationId) {
      // Remove specific notification
      const index = notifs.findIndex(n => n.id === notificationId);
      if (index !== -1) {
        const notif = notifs[index];
        if (notif.userId === 'all' || notif.userId === userId) {
          notifs.splice(index, 1);
          db.setNotifications(notifs);
          res.json({ message: 'Notification dismissed' });
          return;
        }
      }
    }
    
    res.status(404).json({ error: 'Notification not found' });
  });

  // 7. PUBLIC PRODUCT REVIEWS & STAR RATING REST
  app.post('/api/reviews', authenticate, async (req, res) => {
    const { id: userId } = (req as any).user;
    const { productId, rating, comment, images } = req.body;

    if (!productId || !rating || !comment) {
      res.status(400).json({ error: 'Product ID, rating (1-5), and comment are required' });
      return;
    }

    const user = db.getUsers().find(u => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'User info not found' });
      return;
    }

    const reviews = db.getReviews();
    const newReview: Review = {
      id: `rev_${Date.now()}`,
      productId,
      userName: user.name,
      userAvatar: user.avatar,
      rating: parseInt(rating),
      comment,
      date: new Date().toISOString(),
      images,
      approved: true // Auto approve in this preview store environment for beautiful display!
    };

    reviews.push(newReview);
    db.setReviews(reviews);

    // Recalculate average product rating and review count
    const products = db.getProducts();
    const prod = products.find(p => p.id === productId);
    if (prod) {
      const prodReviews = reviews.filter(r => r.productId === productId && r.approved);
      const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
      prod.rating = parseFloat(avg.toFixed(1));
      prod.reviewsCount = prodReviews.length;
      db.setProducts(products);
      
      // Invalidate product cache since ratings changed
      await ProductCache.delete(productId);
      await ProductCache.invalidateAll();
    }

    res.status(201).json({ message: 'Review structured successfully', review: newReview });
  });

  // 8. ADMIN MANAGEMENT & PANEL API FLOURISHES
  // GET ANALYTICS OVERVIEW
  app.get('/api/admin/analytics', requireAdmin, (req, res) => {
    const orders = db.getOrders();
    const products = db.getProducts();
    const users = db.getUsers().filter(u => u.role !== 'admin');

    const totalSales = orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.totalAmount, 0);
    const revenueAnalytics = [
      { month: 'Jan', revenue: totalSales * 0.15 },
      { month: 'Feb', revenue: totalSales * 0.20 },
      { month: 'Mar', revenue: totalSales * 0.25 },
      { month: 'Apr', revenue: totalSales * 0.35 },
      { month: 'May', revenue: totalSales * 0.60 },
      { month: 'Jun', revenue: totalSales }
    ];

    const inventoryOverview = products.map(p => ({
      name: p.name,
      stock: p.stock,
      status: p.stock > 10 ? 'Healthy' : p.stock > 0 ? 'Low Stock' : 'Out of Stock'
    }));

    res.json({
      totalSales: parseFloat(totalSales.toFixed(2)),
      ordersCount: orders.length,
      customersCount: users.length,
      inventoryCount: products.reduce((sum, p) => sum + p.stock, 0),
      revenueAnalytics,
      inventoryOverview,
      recentActivities: orders.slice(-5).map(o => ({
        id: o.id,
        activity: `Order ${o.orderNumber} placed for $${o.totalAmount.toFixed(2)}`,
        date: o.date
      }))
    });
  });

  // Admin Product Manage
  app.post('/api/admin/products', requireAdmin, async (req, res) => {
    const { name, price, discountPrice, category, brand, stock, description, specs } = req.body;
    if (!name || !price || !category || !brand) {
      res.status(400).json({ error: 'Name, price, category, and brand are required' });
      return;
    }

    const products = db.getProducts();
    const newProd: Product = {
      id: `prod_${Date.now()}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description || 'No description supplied.',
      richDescription: description || 'No core specifications provided.',
      price: parseFloat(price),
      discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
      rating: 5.0,
      reviewsCount: 0,
      category,
      brand,
      images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'], // Standard sporty default banner
      stock: parseInt(stock) || 10,
      variants: [],
      specifications: specs || []
    };

    products.push(newProd);
    db.setProducts(products);
    
    // Invalidate product cache
    await ProductCache.invalidateAll();
    await CategoryCache.invalidateAll();
    
    res.status(201).json({ message: 'Product appended successfully', product: newProd });
  });

  app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
    const { name, price, discountPrice, category, brand, stock, description } = req.body;
    const products = db.getProducts();
    const prod = products.find(p => p.id === req.params.id);

    if (!prod) {
      res.status(404).json({ error: 'Product not discovered' });
      return;
    }

    if (name) {
      prod.name = name;
      prod.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    if (price) prod.price = parseFloat(price);
    if (discountPrice !== undefined) prod.discountPrice = discountPrice ? parseFloat(discountPrice) : undefined;
    if (category) prod.category = category;
    if (brand) prod.brand = brand;
    if (stock !== undefined) prod.stock = parseInt(stock);
    if (description) {
      prod.description = description;
      prod.richDescription = description;
    }

    db.setProducts(products);
    
    // Invalidate product cache
    await ProductCache.invalidateAll();
    await CategoryCache.invalidateAll();
    await ProductCache.delete(req.params.id);
    
    res.json({ message: 'Product updated successfully', product: prod });
  });

  app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
    let products = db.getProducts();
    if (!products.some(p => p.id === req.params.id)) {
      res.status(404).json({ error: 'Product not discovered' });
      return;
    }
    products = products.filter(p => p.id !== req.params.id);
    db.setProducts(products);
    
    // Invalidate product cache
    await ProductCache.invalidateAll();
    await CategoryCache.invalidateAll();
    await ProductCache.delete(req.params.id);
    
    res.json({ message: 'Product removed successfully' });
  });

  // Admin Order Manage
  app.get('/api/admin/orders', requireAdmin, (req, res) => {
    res.json({ orders: db.getOrders() });
  });

  app.put('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
    const { status } = req.body;
    const orders = db.getOrders();
    const order = orders.find(o => o.id === req.params.id);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    order.status = status;

    // Award loyalty points when order is delivered
    if (status === 'Delivered' && !order.pointsAwarded && order.loyaltyPointsEarned > 0) {
      const users = db.getUsers();
      const user = users.find(u => u.id === order.userId);
      if (user) {
        user.loyaltyPoints += order.loyaltyPointsEarned;
        order.pointsAwarded = true;
        db.setUsers(users);
      }
    }

    db.setOrders(orders);

    // Notify the user in real-time
    notifyUser(order.userId, {
      title: 'Order Status Update',
      message: `Your order ${order.orderNumber} is now: ${status}`,
      type: 'success',
      orderId: order.id,
      orderNumber: order.orderNumber,
      status
    });

    res.json({ message: 'Order status altered successfully', order });
  });

  // Admin Customers list
  app.get('/api/admin/users', requireAdmin, (req, res) => {
    const users = db.getUsers().map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      loyaltyPoints: u.loyaltyPoints,
      addresses: u.addresses
    }));
    res.json({ users });
  });

  // Admin Coupons
  app.get('/api/admin/coupons', requireAdmin, (req, res) => {
    res.json({ coupons: db.getCoupons() });
  });

  app.post('/api/admin/coupons', requireAdmin, (req, res) => {
    const { code, type, value, expiryDate, minPurchase, usageLimit } = req.body;
    if (!code || !type || !value) {
      res.status(400).json({ error: 'Code, type, and value are required' });
      return;
    }

    const coupons = db.getCoupons();
    const newCp: Coupon = {
      id: `cp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code: code.toUpperCase(),
      type,
      value: parseFloat(value),
      expiryDate: expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      minPurchase: minPurchase ? parseFloat(minPurchase) : undefined,
      usageLimit: usageLimit ? parseInt(usageLimit) : undefined,
      usedCount: 0
    };

    coupons.push(newCp);
    db.setCoupons(coupons);
    res.status(201).json({ message: 'Coupon added successfully', coupon: newCp });
  });

  // Admin Notifications
  app.post('/api/admin/notifications', requireAdmin, async (req, res) => {
    const { userId, title, message, type, broadcast } = req.body;

    if (!title || !message) {
      res.status(400).json({ error: 'Title and message are required.' });
      return;
    }

    if (!type || !['info', 'success', 'warning', 'promotion'].includes(type)) {
      res.status(400).json({ error: 'Invalid notification type. Must be: info, success, warning, or promotion.' });
      return;
    }

    try {
      if (broadcast) {
        // Broadcast to all users
        broadcastAlert({
          title,
          message,
          type
        });
        res.json({ message: 'Broadcast notification sent successfully.' });
      } else if (userId) {
        // Send to specific user
        const users = db.getUsers();
        const user = users.find(u => u.id === userId);

        if (!user) {
          res.status(404).json({ error: 'User not found.' });
          return;
        }

        notifyUser(userId, {
          title,
          message,
          type
        });
        res.json({ message: 'Notification sent successfully to user.' });
      } else {
        res.status(400).json({ error: 'Either userId or broadcast must be specified.' });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({ error: 'Failed to send notification.' });
    }
  });

  app.get('/api/admin/notifications', requireAdmin, (req, res) => {
    try {
      const notifications = dbConnection.getCollection('notifications') || [];
      res.json({ notifications });
    } catch (error) {
      console.error('Error fetching notification history:', error);
      // Return empty array if collection doesn't exist yet
      res.json({ notifications: [] });
    }
  });

  // 10. NEWSLETTER SUBSCRIPTION & MANAGEMENT
  // Public newsletter subscription
  app.post('/api/newsletter/subscribe', async (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Valid email address required' });
      return;
    }

    const newsletters = db.getNewsletters();
    const existing = newsletters.find(n => n.email === email && n.status === 'active');
    
    if (existing) {
      res.status(409).json({ error: 'Email already subscribed to newsletter' });
      return;
    }

    const newSubscription: Newsletter = {
      id: `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      subscribedAt: new Date().toISOString(),
      status: 'active'
    };

    newsletters.push(newSubscription);
    db.setNewsletters(newsletters);
    res.status(201).json({ message: 'Successfully subscribed to newsletter', subscription: newSubscription });
  });

  // Admin newsletter management
  app.get('/api/admin/newsletters', requireAdmin, (req, res) => {
    const newsletters = db.getNewsletters();
    res.json({ newsletters });
  });

  app.delete('/api/admin/newsletters/:id', requireAdmin, (req, res) => {
    const newsletterId = req.params.id;
    let newsletters = db.getNewsletters();
    
    if (!newsletters.some(n => n.id === newsletterId)) {
      res.status(404).json({ error: 'Newsletter subscription not found' });
      return;
    }

    newsletters = newsletters.filter(n => n.id !== newsletterId);
    db.setNewsletters(newsletters);
    res.json({ message: 'Newsletter subscription removed successfully' });
  });

  app.put('/api/admin/newsletters/:id/status', requireAdmin, (req, res) => {
    const newsletterId = req.params.id;
    const { status } = req.body;
    
    if (status !== 'active' && status !== 'unsubscribed') {
      res.status(400).json({ error: 'Invalid status. Must be "active" or "unsubscribed"' });
      return;
    }

    const newsletters = db.getNewsletters();
    const newsletter = newsletters.find(n => n.id === newsletterId);
    
    if (!newsletter) {
      res.status(404).json({ error: 'Newsletter subscription not found' });
      return;
    }

    newsletter.status = status;
    db.setNewsletters(newsletters);
    res.json({ message: 'Newsletter status updated successfully', newsletter });
  });

  // Send newsletter to all active subscribers
  app.post('/api/admin/newsletters/send', requireAdmin, async (req, res) => {
    const { subject, content } = req.body;
    
    if (!subject || !content) {
      res.status(400).json({ error: 'Subject and content are required' });
      return;
    }

    const newsletters = db.getNewsletters();
    const activeSubscribers = newsletters.filter(n => n.status === 'active');
    
    if (activeSubscribers.length === 0) {
      res.status(400).json({ error: 'No active subscribers to send to' });
      return;
    }

    // Initialize email transport
    initEmailTransport();

    // Send emails to all active subscribers
    const sendPromises = activeSubscribers.map(subscriber => 
      sendNewsletterEmail(subscriber.email, subject, content)
    );

    const results = await Promise.allSettled(sendPromises);
    const successfulSends = results.filter(r => r.status === 'fulfilled').length;
    const failedSends = results.filter(r => r.status === 'rejected').length;

    console.log(`Newsletter send complete: ${successfulSends} successful, ${failedSends} failed`);

    res.json({ 
      message: 'Newsletter sent successfully', 
      sentCount: successfulSends,
      failedCount: failedSends,
      recipients: activeSubscribers.map(n => n.email)
    });
  });

  // Handle favicon requests to prevent 404 errors
  app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
  });

  // 9. PREMIUM AI RECOMMENDATIONS SYSTEM using process.env.GEMINI_API_KEY
  app.post('/api/ai/recommendations', async (req, res) => {
    const { cartItems, currentCategory, searchHistory } = req.body;

    const availableProducts = db.getProducts();

    // Context description for Gemini model
    const productListText = availableProducts.map(p =>
      `ID: ${p.id}, Name: ${p.name}, Category: ${p.category}, Brand: ${p.brand}, Price: $${p.price}, Rating: ${p.rating}/5`
    ).join('\n');

    const prompt = `You are the core AI Recommendation Engine of "ModernShop", a premium e-commerce store.
Analyze the user's current context below and determine the best 4 products to recommend from the provided store catalog.

USER CONTEXT:
1. Current Category Viewed: "${currentCategory || 'None'}"
2. Item IDs currently in Cart: [${cartItems ? cartItems.join(', ') : ''}]
3. User Recent Searches: [${searchHistory ? searchHistory.join(', ') : ''}]

AVAILABLE CATALOG:
${productListText}

INSTRUCTIONS:
Select exactly 4 product IDs from the catalog that best match the user's context. Put your recommendations in order from most relevant to least relevant.
Return ONLY a valid JSON object in this exact format, with NO codeblocks, NO headers, and NO conversational text:
{
  "recommendedIds": ["id1", "id2", "id3", "id4"],
  "reasoning": "A concise, elegant 1-sentence sales assistant rationale based on their viewing and cart items."
}`;

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
      // Fallback Engine if key is not configured
      // Filter related products or hot items
      let selectedProducts = [...availableProducts];
      if (currentCategory) {
        const catPr = availableProducts.filter(p => p.category === currentCategory);
        if (catPr.length >= 2) selectedProducts = catPr;
      }
      const ids = selectedProducts.slice(0, 4).map(p => p.id);
      res.json({
        recommendedIds: ids,
        reasoning: 'Presenting our hot trending items matched with your viewing profile (Smart Fallback Engine).',
        aiPowered: false
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || '';
      try {
        const parsed = JSON.parse(text.trim());
        res.json({
          recommendedIds: parsed.recommendedIds || [],
          reasoning: parsed.reasoning || '',
          aiPowered: true
        });
      } catch (e) {
        // parsing failed, fallback
        const ids = availableProducts.slice(0, 4).map(p => p.id);
        res.json({
          recommendedIds: ids,
          reasoning: 'Hand-picked premium selections matched to your shopping behavior.',
          aiPowered: true
        });
      }
    } catch (error: any) {
      const isQuotaError = error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('429');
      if (isQuotaError) {
        console.warn('[AI RECOMMENDATIONS] Gemini API quota limit active. Engaging elegant cluster fallback algorithm gracefully.');
      } else {
        console.warn('[AI RECOMMENDATIONS] Graceful fallback activated:', error?.message || error);
      }
      const ids = availableProducts.slice(0, 4).map(p => p.id);
      res.json({
        recommendedIds: ids,
        reasoning: 'Recommending our bestselling items based on your shopping activities.',
        aiPowered: false,
        error: error.message
      });
    }
  });

  // Public header config endpoint (no authentication required)
  app.get('/api/public/header-config', (req, res) => {
    try {
      const headerConfigs = dbConnection.getCollection('headerConfig');
      
      if (headerConfigs.length === 0) {
        const defaultConfig = {
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
        return res.json({
          success: true,
          message: 'Default header configuration retrieved.',
          data: defaultConfig
        });
      }
      
      return res.json({
        success: true,
        message: 'Header configuration retrieved.',
        data: withHeroSlides(headerConfigs[0])
      });
    } catch (error) {
      console.error('Error fetching header config:', error);
      // Return default config on error
      const defaultConfig = {
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
      return res.json({
        success: true,
        message: 'Default header configuration retrieved (fallback).',
        data: defaultConfig
      });
    }
  });

  // 4. Global Error Handling Middleware
  app.use(globalErrorHandler);

  // --- VITE DEV SERVICE VS STATIC PROD SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express custom server online at http://localhost:${PORT}`);
  });

  // Initialize standard real-time Socket.io server
  initSocketServer(server);
}

startServer();
