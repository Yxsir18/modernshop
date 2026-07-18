import { Response } from 'express';
import { dbConnection } from '../config/db';
import { sendResponse, sendError } from '../utils/response';
import { Order, User, Product } from '../../src/types';
import { validateOrderSchema } from '../models/order.model';
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail, initEmailTransport } from '../utils/email';

export const checkoutAndPurchase = async (req: any, res: Response) => {
  const {
    items,
    shippingAddress,
    billingAddress,
    shippingMethod,
    paymentMethod,
    couponCode,
    subtotal,
    discountAmount,
    taxAmount,
    shippingAmount,
    totalAmount,
    pointsUsed
  } = req.body;

  if (!items || items.length === 0 || !shippingAddress) {
    return sendError(res, 400, 'Checkout items list and shipping location fields are required.');
  }

  // Deduct real inventory and handle out-of-stock check
  const products = dbConnection.getCollection('products');
  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      return sendError(res, 404, `Item "${item.productName}" was not matching in store directories.`);
    }
    if (product.stock < item.quantity) {
      return sendError(res, 400, `Stock clearance failure. Total available for ${product.name} is ${product.stock} units.`);
    }
    product.stock -= item.quantity;
  }
  dbConnection.updateCollection('products', products);

  // Apply Coupon mechanics
  if (couponCode) {
    const coupons = dbConnection.getCollection('coupons');
    const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
    if (coupon) {
      coupon.usedCount += 1;
      dbConnection.updateCollection('coupons', coupons);
    }
  }

  const users = dbConnection.getCollection('users');
  const user = users.find(u => u.id === req.user.id);

  const orderNum = `MS-${Math.floor(100000 + Math.random() * 900000)}-2026`;
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // Process Loyalty Points redemption (points will be awarded on delivery)
  if (user && pointsUsed) {
    const oldPoints = user.loyaltyPoints;
    user.loyaltyPoints = Math.max(0, user.loyaltyPoints - pointsUsed);
    console.log(`[LOYALTY POINTS] Order checkout redemption - userId: ${user.id}, orderId: ${orderId}, oldPoints: ${oldPoints}, pointsUsed: ${pointsUsed}, newPoints: ${user.loyaltyPoints}`);
    dbConnection.updateCollection('users', users);
  }

  const newOrder: any = {
    id: orderId,
    orderNumber: orderNum,
    userId: req.user.id,
    items,
    shippingAddress,
    billingAddress: billingAddress || shippingAddress,
    shippingMethod: shippingMethod || 'Standard Ground',
    paymentMethod: paymentMethod || 'Cash on Delivery',
    status: 'Pending',
    paymentStatus: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
    subtotal,
    discountAmount: discountAmount || 0,
    taxAmount: taxAmount || 0,
    shippingAmount: shippingAmount || 0,
    totalAmount,
    loyaltyPointsEarned: Math.floor(totalAmount / 10),
    loyaltyPointsUsed: pointsUsed || 0,
    pointsAwarded: false,
    timeline: [
      { status: 'Pending', description: 'Order submitted securely to the sovereign network.', timestamp: new Date().toISOString() }
    ],
    date: new Date().toISOString()
  };

  validateOrderSchema(newOrder);

  const orders = dbConnection.getCollection('orders');
  orders.push(newOrder);
  dbConnection.updateCollection('orders', orders);

  // Auto-send order verification and promotion news alerts
  const notifs = dbConnection.getCollection('notifications');
  notifs.push({
    id: `not_${Date.now()}`,
    userId: req.user.id,
    title: 'Order Completed Successfully',
    message: `Your trade transaction ${orderNum} has been received. Track its delivery timeline anytime on your dashboard!`,
    type: 'promotion',
    date: new Date().toISOString(),
    read: false
  });
  dbConnection.updateCollection('notifications', notifs);

  // Send email notification
  if (user && user.email) {
    initEmailTransport();
    sendOrderConfirmationEmail(user.email, orderNum, totalAmount, items);
  }

  return sendResponse(res, 201, true, 'Sovereign checkout process succeeded.', newOrder);
};

export const getMyOrders = async (req: any, res: Response) => {
  const orders = dbConnection.getCollection('orders')
    .filter(o => o.userId === req.user.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return sendResponse(res, 200, true, 'User purchase timeline completed.', orders);
};

export const cancelMyOrder = async (req: any, res: Response) => {
  const { id } = req.params;
  const orders = dbConnection.getCollection('orders');
  const order = orders.find(o => o.id === id && o.userId === req.user.id);

  if (!order) {
    return sendError(res, 404, 'The target purchase index was not detected.');
  }

  if (order.status !== 'Pending' && order.status !== 'Processing') {
    return sendError(res, 400, 'Security protocol error: Shipped orders cannot be cancelled directly.');
  }

  // Restore inventory values
  const products = dbConnection.getCollection('products');
  order.items.forEach(item => {
    const p = products.find(prod => prod.id === item.productId);
    if (p) p.stock += item.quantity;
  });
  dbConnection.updateCollection('products', products);

  order.status = 'Cancelled';
  (order as any).timeline.push({
    status: 'Cancelled',
    description: 'Order cancelled by customer.',
    timestamp: new Date().toISOString()
  });

  dbConnection.updateCollection('orders', orders);

  // Get user for notifications
  const users = dbConnection.getCollection('users');
  const user = users.find(u => u.id === req.user.id);

  // Send email notification
  if (user && user.email) {
    initEmailTransport();
    sendOrderStatusUpdateEmail(user.email, order.orderNumber, 'Cancelled');
  }

  return sendResponse(res, 200, true, 'Order was successfully cancelled, inventory holds released.', order);
};

export const requestOrderReturn = async (req: any, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return sendError(res, 400, 'Please formulate a return logic reason.');
  }

  const orders = dbConnection.getCollection('orders');
  const order = orders.find(o => o.id === id && o.userId === req.user.id);

  if (!order) {
    return sendError(res, 404, 'No corresponding invoice logged.');
  }

  if (order.status !== 'Delivered') {
    return sendError(res, 400, 'Returns are only permitted for delivered physical items.');
  }

  order.status = 'Returned';
  (order as any).refundReason = reason;
  (order as any).timeline.push({
    status: 'Returned',
    description: `Return requested. Reason logic cataloged: "${reason}"`,
    timestamp: new Date().toISOString()
  });

  dbConnection.updateCollection('orders', orders);

  // Get user for notifications
  const users = dbConnection.getCollection('users');
  const user = users.find(u => u.id === req.user.id);

  // Send email notification
  if (user && user.email) {
    initEmailTransport();
    sendOrderStatusUpdateEmail(user.email, order.orderNumber, 'Returned');
  }

  return sendResponse(res, 200, true, 'Your refund request has been logged successfully and is processing.', order);
};

// Simulated Invoice PDF Content Generator
export const fetchInvoiceMetadata = async (req: any, res: Response) => {
  const { id } = req.params;
  const order = dbConnection.getCollection('orders').find(o => o.id === id && (o.userId === req.user.id || req.user.role === 'admin'));

  if (!order) {
    return sendError(res, 404, 'Invoice payload missing.');
  }

  // Generate plain string representing professional PDF metadata for printable invoice layout
  const printableInvoiceText = `
=============================================
             MODERN SHOP INVOICE             
=============================================
Invoice Order: ${order.orderNumber}
Billing Date:  ${new Date(order.date).toLocaleString()}
Customer ID:   ${order.userId}
Order Status:  ${order.status}

SHIPPING INFORMATION:
${order.shippingAddress.street}, ${order.shippingAddress.city},
${order.shippingAddress.state}, ${order.shippingAddress.zipCode}, ${order.shippingAddress.country}

---------------------------------------------
ITEMS DETAILS:
${order.items.map(item => `* ${item.productName} [Qty: ${item.quantity}] - $${item.price.toFixed(2)}`).join('\n')}

---------------------------------------------
Subtotal:      $${order.subtotal.toFixed(2)}
Discounts Applied: -$${order.discountAmount.toFixed(2)}
Tax:            $${order.taxAmount.toFixed(2)}
Freight Charge: $${order.shippingAmount.toFixed(2)}
=============================================
TOTAL AMOUNT SECURED: $${order.totalAmount.toFixed(2)}
Payment Engine:       ${order.paymentMethod}
=============================================
  `;

  return sendResponse(res, 200, true, 'Bill statement drafted.', {
    plainTextDoc: printableInvoiceText,
    order
  });
};
