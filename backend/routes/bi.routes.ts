import { Router } from 'express';
import { getAdvancedBIStatus, exportSalesCSVReport } from '../controllers/bi.controller';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware';

const router = Router();

// Protect completely to administrative officials
router.use(authenticateToken, requireRoles(['admin', 'super-admin']));

router.get('/analytics/advanced', getAdvancedBIStatus);
router.get('/export-sales-csv', exportSalesCSVReport);

export default router;
