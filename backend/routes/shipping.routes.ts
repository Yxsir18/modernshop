import { Router } from 'express';
import {
  fetchShippingRates,
  generateShipmentTracking,
  fetchTrackingInfo,
  validateAddress,
  createCarrierShipment,
  trackCarrierShipment,
  handleCarrierWebhook,
  getAvailableCarriers
} from '../controllers/shipping.controller';
import { sanitizeInput, auditLogger } from '../middleware/security.middleware';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public routes - no authentication required for rate calculation
router.post('/rates', sanitizeInput, auditLogger('Shipping rates requested'), fetchShippingRates);
router.post('/validate-address', sanitizeInput, auditLogger('Address validation requested'), validateAddress);
router.get('/track/:trackingNumber', fetchTrackingInfo);
router.get('/carriers', getAvailableCarriers);

// Protected routes - require authentication
router.post('/generate-tracking', authenticateToken, sanitizeInput, auditLogger('Tracking number generated'), generateShipmentTracking);
router.post('/create-shipment', authenticateToken, sanitizeInput, auditLogger('Carrier shipment created'), createCarrierShipment);
router.get('/track/:carrier/:trackingNumber', authenticateToken, trackCarrierShipment);

// Webhook routes - public endpoints for carrier callbacks
router.post('/webhook/:carrier', handleCarrierWebhook);

export default router;
