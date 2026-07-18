import { Router, Request, Response, NextFunction } from 'express';
import { generateSalesReport, generateInventoryReport, generateCustomerReport } from '../controllers/report.controller';

const router = Router();

// Admin authentication middleware
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }
  // For now, we'll skip detailed token validation since the main router handles it
  // In production, you'd verify the token and check admin role
  next();
};

// All report routes require admin authentication
router.use(requireAdmin);

// Sales report
router.get('/sales', generateSalesReport);

// Inventory report
router.get('/inventory', generateInventoryReport);

// Customer report
router.get('/customers', generateCustomerReport);

export default router;
