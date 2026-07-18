import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../config/redis';

// local memory cache fallback with exact TTL validation
const memoryCache = new Map<string, { data: any; expiresAt: number }>();

export const CacheEngine = {
  get: async (key: string): Promise<any | null> => {
    const redis = await getRedisClient();
    if (redis) {
      const raw = await redis.get(key);
      if (!raw) return null;
      const text = typeof raw === 'string' ? raw : raw.toString();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }

    const cached = memoryCache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return cached.data;
  },

  set: async (key: string, data: any, ttlSeconds: number = 300): Promise<void> => {
    const redis = await getRedisClient();
    if (redis) {
      await redis.setEx(key, ttlSeconds, JSON.stringify(data));
      return;
    }
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    memoryCache.set(key, { data, expiresAt });
  },

  delete: async (key: string): Promise<void> => {
    const redis = await getRedisClient();
    if (redis) {
      await redis.del(key);
      return;
    }
    memoryCache.delete(key);
  },

  clearAll: async (): Promise<void> => {
    const redis = await getRedisClient();
    if (redis) {
      // Best-effort: do nothing in shared Redis to avoid nuking unrelated keys.
      return;
    }
    memoryCache.clear();
  },

  invalidatePattern: async (pattern: string): Promise<void> => {
    const redis = await getRedisClient();
    if (redis) {
      // SCAN + DEL (best-effort)
      let cursor = '0';
      const match = pattern.includes('*') ? pattern : `*${pattern}*`;
      do {
        const resp = await redis.scan(cursor, { MATCH: match, COUNT: 200 });
        cursor = typeof resp.cursor === 'string' ? resp.cursor : (resp.cursor as any).toString();
        if (resp.keys.length) {
          await redis.del(resp.keys);
        }
      } while (cursor !== '0');
      return;
    }

    const regex = new RegExp(pattern);
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    }
  }
};

/**
 * Cache middleware targeting specific API read endpoints.
 * Serves static responses instantly and bypasses controller calculations.
 */
export const cacheResponse = (ttlSeconds: number = 60) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET query operations
    if (req.method !== 'GET') {
      return next();
    }

    const key = `api-cache:${req.originalUrl}`;
    const cachedBody = await CacheEngine.get(key);

    if (cachedBody) {
      res.setHeader('X-Cache-Lookup', 'HIT');
      res.setHeader('X-Cache-TTL', `${ttlSeconds}s`);
      return res.status(200).json(cachedBody);
    }

    res.setHeader('X-Cache-Lookup', 'MISS');

    // Intercept outbound json response of express
    const originalJson = res.json;
    res.json = function (body: any): Response {
      // Save original JSON back into cache prior to dispatching
      if (res.statusCode >= 200 && res.statusCode < 300) {
        CacheEngine.set(key, body, ttlSeconds).catch(() => {});
      }
      return originalJson.call(this, body);
    };

    next();
  };
};

/**
 * Utility to clear associated cache channels automatically upon resource mutation (e.g. products modified or ordered)
 */
export const invalidateCacheChannel = (pattern: string) => {
  CacheEngine.invalidatePattern(pattern).catch(() => {});
  console.log(`[PERFORMANCE CACHE] Evicted cache channels matching pattern: ${pattern}`);
};

/**
 * Cache key generators for different entities
 */
export const CacheKeys = {
  product: (id: string) => `product:${id}`,
  products: (filters: string = '') => `products:${filters}`,
  category: (id: string) => `category:${id}`,
  categories: () => `categories:all`,
  user: (id: string) => `user:${id}`,
  userSession: (userId: string) => `session:${userId}`,
  analytics: (type: string, period: string) => `analytics:${type}:${period}`,
  rateLimit: (identifier: string, endpoint: string) => `ratelimit:${identifier}:${endpoint}`,
  coupon: (code: string) => `coupon:${code}`,
  searchResults: (query: string) => `search:${query}`,
};

/**
 * Product-specific cache operations
 */
export const ProductCache = {
  get: async (id: string) => CacheEngine.get(CacheKeys.product(id)),
  set: async (id: string, data: any, ttl: number = 3600) => CacheEngine.set(CacheKeys.product(id), data, ttl),
  delete: async (id: string) => CacheEngine.delete(CacheKeys.product(id)),
  invalidateAll: async () => CacheEngine.invalidatePattern('product:*'),
};

/**
 * Products list cache operations
 */
export const ProductsListCache = {
  get: async (filters: string = '') => CacheEngine.get(CacheKeys.products(filters)),
  set: async (filters: string, data: any, ttl: number = 600) => CacheEngine.set(CacheKeys.products(filters), data, ttl),
  invalidateAll: async () => CacheEngine.invalidatePattern('products:*'),
};

/**
 * Category cache operations
 */
export const CategoryCache = {
  get: async (id: string) => CacheEngine.get(CacheKeys.category(id)),
  set: async (id: string, data: any, ttl: number = 7200) => CacheEngine.set(CacheKeys.category(id), data, ttl),
  getAll: async () => CacheEngine.get(CacheKeys.categories()),
  setAll: async (data: any, ttl: number = 7200) => CacheEngine.set(CacheKeys.categories(), data, ttl),
  delete: async (id: string) => CacheEngine.delete(CacheKeys.category(id)),
  invalidateAll: async () => CacheEngine.invalidatePattern('category:*'),
};

/**
 * User session cache operations
 */
export const SessionCache = {
  get: async (userId: string) => CacheEngine.get(CacheKeys.userSession(userId)),
  set: async (userId: string, data: any, ttl: number = 86400) => CacheEngine.set(CacheKeys.userSession(userId), data, ttl),
  delete: async (userId: string) => CacheEngine.delete(CacheKeys.userSession(userId)),
};

/**
 * Analytics cache operations
 */
export const AnalyticsCache = {
  get: async (type: string, period: string) => CacheEngine.get(CacheKeys.analytics(type, period)),
  set: async (type: string, period: string, data: any, ttl: number = 300) => CacheEngine.set(CacheKeys.analytics(type, period), data, ttl),
  invalidateType: async (type: string) => CacheEngine.invalidatePattern(`analytics:${type}:*`),
};

/**
 * Rate limiting cache operations
 */
export const RateLimitCache = {
  check: async (identifier: string, endpoint: string, limit: number, window: number): Promise<{ allowed: boolean; remaining: number }> => {
    const key = CacheKeys.rateLimit(identifier, endpoint);
    const current = await CacheEngine.get(key);
    const now = Date.now();
    
    if (!current) {
      await CacheEngine.set(key, { count: 1, resetAt: now + (window * 1000) }, window);
      return { allowed: true, remaining: limit - 1 };
    }
    
    if (now > current.resetAt) {
      await CacheEngine.set(key, { count: 1, resetAt: now + (window * 1000) }, window);
      return { allowed: true, remaining: limit - 1 };
    }
    
    if (current.count >= limit) {
      return { allowed: false, remaining: 0 };
    }
    
    const newCount = current.count + 1;
    await CacheEngine.set(key, { count: newCount, resetAt: current.resetAt }, window);
    return { allowed: true, remaining: limit - newCount };
  },
  reset: async (identifier: string, endpoint: string) => CacheEngine.delete(CacheKeys.rateLimit(identifier, endpoint)),
};

/**
 * Coupon cache operations
 */
export const CouponCache = {
  get: async (code: string) => CacheEngine.get(CacheKeys.coupon(code)),
  set: async (code: string, data: any, ttl: number = 1800) => CacheEngine.set(CacheKeys.coupon(code), data, ttl),
  delete: async (code: string) => CacheEngine.delete(CacheKeys.coupon(code)),
  invalidateAll: async () => CacheEngine.invalidatePattern('coupon:*'),
};

/**
 * Search results cache operations
 */
export const SearchCache = {
  get: async (query: string) => CacheEngine.get(CacheKeys.searchResults(query)),
  set: async (query: string, data: any, ttl: number = 1800) => CacheEngine.set(CacheKeys.searchResults(query), data, ttl),
  invalidateAll: async () => CacheEngine.invalidatePattern('search:*'),
};
