import { Router } from 'express';
import {
  initiatePaymentIntent,
  verifyPaymentConfirmation,
  handlePaymentWebhook
} from '../controllers/payment.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Protected intent setups
router.post('/intent', authenticateToken, initiatePaymentIntent);
router.post('/verify', authenticateToken, verifyPaymentConfirmation);

// Public Webhook callback
router.post('/webhook', handlePaymentWebhook);

export default router;
