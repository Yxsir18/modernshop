import { Coupon } from '../../src/types';

export interface CouponSchema extends Coupon {
  id: string;
  isActive: boolean;
  minPurchase?: number;
  usageLimit?: number;
  usedCount: number;
}

export const validateCouponSchema = (coupon: Partial<CouponSchema>) => {
  if (!coupon.code || coupon.code.trim().length === 0) {
    throw new Error('Promo coupon code cannot be blank.');
  }
  if (coupon.value === undefined || coupon.value <= 0) {
    throw new Error('Discount worth must be high and positive.');
  }
};
