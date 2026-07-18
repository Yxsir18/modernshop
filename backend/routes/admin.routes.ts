import { Router } from 'express';
import {
  getDashboardAnalytics,
  createDiscountCoupon,
  toggleCouponStatus,
  updateOrderCarrierTrack,
  exportMetricsReport,
  getHeaderConfig,
  updateHeaderConfig,
  updateOrderStatus,
  getAllOrders,
  getAllUsers,
  getAllCoupons,
  createProduct,
  deleteProduct,
  getShippingConfiguration,
  updateShippingConfiguration,
  adminGetShippingRates,
  adminGenerateTracking,
  adminTrackShipment,
  getTaxConfiguration,
  updateTaxConfiguration,
  adminCalculateTax,
  adminValidateState,
  getEmailTemplates,
  getEmailTemplate,
  updateEmailTemplate,
  createEmailTemplate,
  deleteEmailTemplate,
  previewEmailTemplate,
  sendNotification,
  getNotificationHistory,
  getTimerConfigs,
  createTimerConfig,
  updateTimerConfig,
  deleteTimerConfig,
  getWarrantyConfigs,
  createWarrantyConfig,
  updateWarrantyConfig,
  deleteWarrantyConfig
} from '../controllers/admin.controller';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware';
import { sanitizeInput, auditLogger } from '../middleware/security.middleware';

const router = Router();

// Protect completely to administrators only (Super-Admin also has master credentials)
router.use(authenticateToken, requireRoles(['admin', 'super-admin']));

router.get('/analytics', getDashboardAnalytics);
router.post('/coupons', sanitizeInput, auditLogger('New discount coupon registered'), createDiscountCoupon);
router.put('/coupons/:id/toggle', sanitizeInput, auditLogger('Coupon status toggled'), toggleCouponStatus);
router.put('/orders/:id/track-carrier', sanitizeInput, auditLogger('Delivery tracking status updated'), updateOrderCarrierTrack);
router.put('/orders/:id/status', sanitizeInput, auditLogger('Order status updated'), updateOrderStatus);
router.get('/orders', getAllOrders);
router.get('/users', getAllUsers);
router.get('/coupons', getAllCoupons);
router.get('/export-sales', exportMetricsReport);

// Product management routes
router.post('/products', sanitizeInput, auditLogger('New product created'), createProduct);
router.delete('/products/:id', auditLogger('Product deleted'), deleteProduct);

// Header / Hero Configuration Routes (both require admin)
router.get('/header-config', getHeaderConfig);
router.put('/header-config', sanitizeInput, auditLogger('Header configuration updated'), updateHeaderConfig);
router.get('/hero-config', getHeaderConfig);
router.put('/hero-config', sanitizeInput, auditLogger('Hero slider updated'), updateHeaderConfig);

// Shipping Management Routes
router.get('/shipping/config', getShippingConfiguration);
router.put('/shipping/config', sanitizeInput, auditLogger('Shipping configuration updated'), updateShippingConfiguration);
router.post('/shipping/rates', sanitizeInput, auditLogger('Shipping rates calculated'), adminGetShippingRates);
router.post('/shipping/generate-tracking', sanitizeInput, auditLogger('Tracking number generated'), adminGenerateTracking);
router.get('/shipping/track/:trackingNumber', adminTrackShipment);

// Tax Management Routes
router.get('/tax/config', getTaxConfiguration);
router.put('/tax/config', sanitizeInput, auditLogger('Tax configuration updated'), updateTaxConfiguration);
router.post('/tax/calculate', sanitizeInput, auditLogger('Tax calculated'), adminCalculateTax);
router.post('/tax/validate-state', sanitizeInput, auditLogger('State validated'), adminValidateState);

// Email Template Management Routes
router.get('/email-templates', getEmailTemplates);
router.get('/email-templates/:templateId', getEmailTemplate);
router.put('/email-templates/:templateId', sanitizeInput, auditLogger('Email template updated'), updateEmailTemplate);
router.post('/email-templates', sanitizeInput, auditLogger('Email template created'), createEmailTemplate);
router.delete('/email-templates/:templateId', auditLogger('Email template deleted'), deleteEmailTemplate);
router.post('/email-templates/preview', sanitizeInput, previewEmailTemplate);

// Notification Management Routes
router.post('/notifications', sanitizeInput, auditLogger('Notification sent'), sendNotification);
router.get('/notifications', getNotificationHistory);

// Timer Configuration Management Routes
router.get('/timers', getTimerConfigs);
router.post('/timers', sanitizeInput, auditLogger('Timer configuration created'), createTimerConfig);
router.put('/timers/:id', sanitizeInput, auditLogger('Timer configuration updated'), updateTimerConfig);
router.delete('/timers/:id', auditLogger('Timer configuration deleted'), deleteTimerConfig);

// Warranty Configuration Management Routes
router.get('/warranties', getWarrantyConfigs);
router.post('/warranties', sanitizeInput, auditLogger('Warranty configuration created'), createWarrantyConfig);
router.put('/warranties/:id', sanitizeInput, auditLogger('Warranty configuration updated'), updateWarrantyConfig);
router.delete('/warranties/:id', auditLogger('Warranty configuration deleted'), deleteWarrantyConfig);

export default router;
