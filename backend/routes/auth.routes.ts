import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  changePassword,
  refreshAccessToken
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { sanitizeInput, rateLimiter, auditLogger } from '../middleware/security.middleware';

const router = Router();

// Rate limiting on login and registration to match Phase 10 security guides
router.post('/register', rateLimiter(100, 60000), sanitizeInput, auditLogger('Registration attempt completed'), registerUser);
router.post('/login', rateLimiter(200, 60000), sanitizeInput, auditLogger('Authentication entry completed'), loginUser);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logoutUser);
router.post('/forgot-password', rateLimiter(50, 60000), forgotPassword);
router.post('/reset-password', sanitizeInput, resetPassword);

// Protected routes
router.post('/change-password', authenticateToken, sanitizeInput, changePassword);

export default router;
