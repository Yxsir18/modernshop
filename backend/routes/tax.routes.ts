import { Router } from 'express';
import {
  calculateTax,
  calculateCartTax,
  getTaxInvoice,
  validateState,
  getProductTaxInfo
} from '../controllers/tax.controller';
import { sanitizeInput, auditLogger } from '../middleware/security.middleware';

const router = Router();

// Public routes - no authentication required for tax calculation
router.post('/calculate', sanitizeInput, auditLogger('Tax calculation requested'), calculateTax);
router.post('/calculate-cart', sanitizeInput, auditLogger('Cart tax calculation requested'), calculateCartTax);
router.post('/invoice', sanitizeInput, auditLogger('Tax invoice requested'), getTaxInvoice);
router.post('/validate-state', sanitizeInput, auditLogger('State validation requested'), validateState);
router.post('/product-info', sanitizeInput, auditLogger('Product tax info requested'), getProductTaxInfo);

export default router;
