import { Router } from 'express';
import {
  checkoutAndPurchase,
  getMyOrders,
  cancelMyOrder,
  requestOrderReturn,
  fetchInvoiceMetadata
} from '../controllers/order.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { sanitizeInput, auditLogger } from '../middleware/security.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/', sanitizeInput, auditLogger('New order transaction structured'), checkoutAndPurchase);
router.get('/my-orders', getMyOrders);
router.put('/:id/cancel', auditLogger('Transactional cancellation requested'), cancelMyOrder);
router.put('/:id/return', sanitizeInput, auditLogger('Order refund dispatch requested'), requestOrderReturn);
router.get('/:id/invoice', fetchInvoiceMetadata);

export default router;
