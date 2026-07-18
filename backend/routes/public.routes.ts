import { Router } from 'express';
import { getHeaderConfig } from '../controllers/admin.controller';

const router = Router();

// Public header configuration endpoint (no authentication required)
router.get('/header-config', getHeaderConfig);

export default router;
