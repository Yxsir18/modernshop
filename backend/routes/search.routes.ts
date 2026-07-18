import { Router } from 'express';
import { enterpriseSearch } from '../controllers/search.controller';
import { cacheResponse } from '../utils/cache';

const router = Router();

// Cache intermediate search queries for 15 seconds to maximize database safety
router.get('/', cacheResponse(15), enterpriseSearch);

export default router;
