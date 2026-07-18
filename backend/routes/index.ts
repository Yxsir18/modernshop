import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';
import paymentRoutes from './payment.routes';
import adminRoutes from './admin.routes';
import aiRoutes from './ai.routes';
import chatRoutes from './chat.routes';
import observabilityRoutes from './observability.routes';
import searchRoutes from './search.routes';
import biRoutes from './bi.routes';
import publicRoutes from './public.routes';
import reportRoutes from './report.routes';
import shippingRoutes from './shipping.routes';
import taxRoutes from './tax.routes';
import customerServiceRoutes from './customerService.routes';

const router = Router();

// Mount system diagnostics at top level
router.use('/', observabilityRoutes);

// Prefix all subroutes logically
router.use('/search', searchRoutes);
router.use('/bi', biRoutes);
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);
router.use('/ai', aiRoutes);
router.use('/chat', chatRoutes);
router.use('/public', publicRoutes);
router.use('/shipping', shippingRoutes);
router.use('/tax', taxRoutes);
router.use('/customer-service', customerServiceRoutes);

export default router;
