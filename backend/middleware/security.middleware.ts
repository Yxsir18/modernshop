import { Request, Response, NextFunction } from 'express';
import { dbConnection } from '../config/db';
import { getRedisClient } from '../config/redis';

// Custom rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (limit: number = 120, windowMs: number = 60 * 1000) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Exclude static asset calls if any
    if (req.path.includes('.') && !req.path.startsWith('/api')) {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    // Prefer Redis store when available (shared rate limits across instances)
    try {
      const redis = await getRedisClient();
      if (redis) {
        const key = `ratelimit:${ip}`;
        const count = Number(await redis.incr(key));
        if (count === 1) {
          await redis.pExpire(key, windowMs);
        }

        const ttlMs = Number(await (redis as any).pTTL(key));
        const remaining = Math.max(0, limit - count);
        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', remaining);
        if (ttlMs > 0) res.setHeader('Retry-After', Math.ceil(ttlMs / 1000));

        if (count > limit) {
          if (count === limit + 1) {
            logSuspiciousEvent(
              (req as any).user?.id,
              ip,
              `Rate limit threshold (${limit} req/min) breached on path "${req.path}". Temporarily throttling requests from this vector.`
            );
          }
          return res.status(429).json({
            success: false,
            message: 'Security Alert: Express limit reached. Access throttled.',
            error: 'Too many queries generated. Please try again shortly.'
          });
        }

        return next();
      }
    } catch {
      // If Redis errors, fall back to in-memory.
    }

    const rateData = rateLimitMap.get(ip);

    if (!rateData || now > rateData.resetTime) {
      rateLimitMap.set(ip, {
        count: 1,
        resetTime: now + windowMs
      });
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', limit - 1);
      return next();
    }

    if (rateData.count >= limit) {
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('Retry-After', Math.ceil((rateData.resetTime - now) / 1000));
      
      // Suspect Rate Breach Logged
      if (rateData.count === limit) {
        logSuspiciousEvent(
          (req as any).user?.id,
          ip,
          `Rate limit threshold (${limit} req/min) breached on path "${req.path}". Temporarily throttling requests from this vector.`
        );
      }

      return res.status(429).json({
        success: false,
        message: 'Security Alert: Express limit reached. Access throttled.',
        error: 'Too many queries generated. Please try again shortly.'
      });
    }

    rateData.count += 1;
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', limit - rateData.count);
    next();
  };
};

export const logSuspiciousEvent = (userId: string | undefined, ip: string, message: string) => {
  try {
    dbConnection.logAudit(
      userId || 'GUEST',
      'security-alerts@modernshop.com',
      `[SECURITY ALERT] ${message}`,
      ip,
      'Sovereign Security Engine'
    );
  } catch (e) {
    console.error('Failed to log suspicious event:', e);
  }
};

// NoSQL Inject & XSS sanitizer middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeValue = (val: any): any => {
    if (typeof val === 'string') {
      // Remove mongo injection operator indicators ($) but preserve dots (.) for email domains, decimal numbers, etc.
      let clean = val.replace(/[\$]/g, ''); // anti-injection
      clean = clean.replace(/<[^>]*>/g, ''); // anti-XSS
      return clean;
    }
    if (typeof val === 'object' && val !== null) {
      const cleanedObj: any = Array.isArray(val) ? [] : {};
      Object.keys(val).forEach(k => {
        // Sanitize keys as well for ultimate security
        const cleanKey = k.replace(/[\$\.]/g, '');
        cleanedObj[cleanKey] = sanitizeValue(val[k]);
      });
      return cleanedObj;
    }
    return val;
  };

  req.body = sanitizeValue(req.body);
  req.query = sanitizeValue(req.query);
  req.params = sanitizeValue(req.params);

  next();
};

// Security headers (Helmet replica)
export const secureHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://images.unsplash.com https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' ws://localhost:3000 ws://localhost:24678; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' blob:;");
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  next();
};

// Auditor middleware
export const auditLogger = (actionDescription: string) => {
  return (req: any, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        dbConnection.logAudit(
          req.user?.id,
          req.user?.email,
          `${actionDescription} (Success - Status ${res.statusCode})`,
          req.ip || '127.0.0.1',
          req.headers['user-agent'] || 'Sovereign Agent'
        );
      }
    });
    next();
  };
};
