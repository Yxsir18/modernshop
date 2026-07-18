import { Request, Response } from 'express';
import { dbConnection } from '../config/db';
import { sendResponse, sendError } from '../utils/response';

export const initiatePaymentIntent = async (req: Request, res: Response) => {
  const { provider, orderAmount, currency, paymentMethod } = req.body;

  if (!provider || !orderAmount) {
    return sendError(res, 400, 'Payment merchant provider (stripe or razorpay) and charges metric required.');
  }

  const transactionMockId = `${provider === 'stripe' ? 'ch_' : 'pay_'}${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // For UPI payments, use the merchant UPI ID from environment variable
  const merchantUpiId = process.env.MERCHANT_UPI_ID || 'khanyasirraza1-1@okhdfcbank';

  // Simulates robust payload elements
  const gatewayState = {
    provider,
    transactionMockId,
    clientSecretOrKeyToken: `token_key_spec_${Math.random().toString(36).substring(2, 10)}`,
    amount: parseFloat(orderAmount),
    currency: currency || 'INR',
    merchantEntityName: 'MODERNSHOP_ENTERPRISE_SECURE',
    merchantUpiId: paymentMethod === 'UPI' ? merchantUpiId : undefined
  };

  return sendResponse(res, 200, true, 'Payment session authorized.', gatewayState);
};

export const verifyPaymentConfirmation = async (req: Request, res: Response) => {
  const { transactionMockId, orderNumber, responseStatus } = req.body;

  if (!transactionMockId || !orderNumber) {
    return sendError(res, 400, 'A confirmation checkout index must supply target order ID.');
  }

  const orders = dbConnection.getCollection('orders');
  const order = orders.find(o => o.orderNumber === orderNumber);

  if (!order) {
    return sendError(res, 404, 'Associated transaction invoice missing.');
  }

  if (responseStatus === 'failure') {
    (order as any).paymentStatus = 'Failed';
    (order as any).timeline.push({
      status: 'Payment Failed',
      description: `Payment intent failed via gateway with transaction: ${transactionMockId}`,
      timestamp: new Date().toISOString()
    });
    dbConnection.updateCollection('orders', orders);
    return sendResponse(res, 202, true, 'Transaction failure recorded. Retry active.');
  }

  (order as any).paymentStatus = 'Paid';
  order.status = 'Processing';
  (order as any).transactionId = transactionMockId;
  (order as any).timeline.push({
    status: 'Paid',
    description: `Payment confirmed securely. Reference transaction logged: ${transactionMockId}`,
    timestamp: new Date().toISOString()
  });

  dbConnection.updateCollection('orders', orders);

  return sendResponse(res, 200, true, 'Payment verification successfully completed.', order);
};

// Phase 5 Webhooks handling
export const handlePaymentWebhook = async (req: Request, res: Response) => {
  // Simulates external callback from Stripe/Razorpay
  const webhookBody = req.body;
  console.log('[SECURE WEBHOOK TRIGGERED]:', webhookBody);

  return res.status(200).send({ received: true });
};
