import { Order } from '../../src/types';

export interface OrderSchema extends Omit<Order, 'status'> {
  status: 'Pending' | 'Processing' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned' | 'Refunded';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  transactionId?: string;
  refundReason?: string;
  refundAmount?: number;
  trackingNumber?: string;
  carrierName?: string;
  timeline: Array<{
    status: string;
    description: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const validateOrderSchema = (order: Partial<OrderSchema>) => {
  if (!order.items || order.items.length === 0) {
    throw new Error('At least one item must populate the active order basket.');
  }
  if (!order.shippingAddress) {
    throw new Error('Valid shipping destination address is required.');
  }
  if (order.totalAmount === undefined || order.totalAmount < 0) {
    throw new Error('Total charge quantum must exceed negative integers.');
  }
};
