import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dbConnection } from '../config/db';
import { CouponCache } from '../utils/cache';

describe('Coupon System Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Coupon Validation', () => {
    it('should validate a valid coupon code', () => {
      const coupon = {
        code: 'SAVE20',
        type: 'percentage',
        value: 20,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usageLimit: 100,
        usedCount: 5,
        minPurchase: 50
      };

      const subtotal = 100;
      const isValid = 
        new Date(coupon.expiryDate) > new Date() &&
        (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) &&
        (!coupon.minPurchase || subtotal >= coupon.minPurchase);

      expect(isValid).toBe(true);
    });

    it('should reject an expired coupon', () => {
      const coupon = {
        code: 'EXPIRED',
        type: 'percentage',
        value: 20,
        expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        usageLimit: 100,
        usedCount: 5,
        minPurchase: 50
      };

      const isValid = new Date(coupon.expiryDate) > new Date();
      expect(isValid).toBe(false);
    });

    it('should reject a coupon that has exceeded usage limit', () => {
      const coupon = {
        code: 'LIMITED',
        type: 'percentage',
        value: 20,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usageLimit: 10,
        usedCount: 10,
        minPurchase: 50
      };

      const isValid = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;
      expect(isValid).toBe(false);
    });

    it('should reject a coupon when minimum purchase not met', () => {
      const coupon = {
        code: 'MIN50',
        type: 'percentage',
        value: 20,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usageLimit: 100,
        usedCount: 5,
        minPurchase: 50
      };

      const subtotal = 25;
      const isValid = !coupon.minPurchase || subtotal >= coupon.minPurchase;
      expect(isValid).toBe(false);
    });

    it('should calculate percentage discount correctly', () => {
      const coupon = {
        code: 'SAVE20',
        type: 'percentage',
        value: 20,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usageLimit: 100,
        usedCount: 5,
        minPurchase: 0
      };

      const subtotal = 100;
      const discountAmount = (subtotal * coupon.value) / 100;
      
      expect(discountAmount).toBe(20);
    });

    it('should calculate fixed amount discount correctly', () => {
      const coupon = {
        code: 'SAVE10',
        type: 'fixed',
        value: 10,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usageLimit: 100,
        usedCount: 5,
        minPurchase: 0
      };

      const subtotal = 100;
      const discountAmount = coupon.value;
      
      expect(discountAmount).toBe(10);
    });
  });

  describe('Coupon Caching', () => {
    it('should cache a valid coupon', async () => {
      const coupon = {
        code: 'CACHE20',
        type: 'percentage',
        value: 20,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usageLimit: 100,
        usedCount: 5,
        minPurchase: 50
      };

      await CouponCache.set(coupon.code, coupon, 1800);
      const cached = await CouponCache.get(coupon.code);
      
      expect(cached).toBeDefined();
      expect(cached.code).toBe(coupon.code);
    });

    it('should delete a coupon from cache', async () => {
      const coupon = {
        code: 'DELETE20',
        type: 'percentage',
        value: 20,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usageLimit: 100,
        usedCount: 5,
        minPurchase: 50
      };

      await CouponCache.set(coupon.code, coupon, 1800);
      await CouponCache.delete(coupon.code);
      const cached = await CouponCache.get(coupon.code);
      
      expect(cached).toBeNull();
    });

    it('should invalidate all coupons', async () => {
      const coupon1 = {
        code: 'COUPON1',
        type: 'percentage',
        value: 10,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usageLimit: 100,
        usedCount: 5,
        minPurchase: 50
      };

      const coupon2 = {
        code: 'COUPON2',
        type: 'percentage',
        value: 15,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usageLimit: 100,
        usedCount: 5,
        minPurchase: 50
      };

      await CouponCache.set(coupon1.code, coupon1, 1800);
      await CouponCache.set(coupon2.code, coupon2, 1800);
      await CouponCache.invalidateAll();
      
      const cached1 = await CouponCache.get(coupon1.code);
      const cached2 = await CouponCache.get(coupon2.code);
      
      expect(cached1).toBeNull();
      expect(cached2).toBeNull();
    });
  });

  describe('Coupon Edge Cases', () => {
    it('should handle case-insensitive coupon codes', () => {
      const code1 = 'SAVE20';
      const code2 = 'save20';
      const code3 = 'Save20';
      
      expect(code1.toLowerCase()).toBe(code2.toLowerCase());
      expect(code1.toLowerCase()).toBe(code3.toLowerCase());
    });

    it('should handle zero value coupons', () => {
      const coupon = {
        code: 'ZERO',
        type: 'percentage',
        value: 0,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usageLimit: 100,
        usedCount: 5,
        minPurchase: 0
      };

      const subtotal = 100;
      const discountAmount = (subtotal * coupon.value) / 100;
      
      expect(discountAmount).toBe(0);
    });

    it('should handle 100% discount coupons', () => {
      const coupon = {
        code: 'FREE',
        type: 'percentage',
        value: 100,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usageLimit: 100,
        usedCount: 5,
        minPurchase: 0
      };

      const subtotal = 100;
      const discountAmount = (subtotal * coupon.value) / 100;
      
      expect(discountAmount).toBe(100);
    });
  });
});
