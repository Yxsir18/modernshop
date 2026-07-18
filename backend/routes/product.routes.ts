import { Router } from 'express';
import { getProducts, getProductByIdOrSlug, createProductReview, updateProduct } from '../controllers/product.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { sanitizeInput } from '../middleware/security.middleware';
import { cacheResponse } from '../utils/cache';

const router = Router();

// Specific routes first
router.post('/reviews', authenticateToken, sanitizeInput, createProductReview);

// General routes
router.get('/', getProducts);
router.get('/:idOrSlug', cacheResponse(30), getProductByIdOrSlug);

// Protected routes
router.put('/:id', authenticateToken, updateProduct);

export default router;
