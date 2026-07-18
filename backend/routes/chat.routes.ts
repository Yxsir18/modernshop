import { Router } from 'express';
import { getChatMessages, postChatMessage, adminMarkChatRead } from '../controllers/chat.controller';
import { authenticateToken, requireRoles, optionalAuth } from '../middleware/auth.middleware';
import { sanitizeInput } from '../middleware/security.middleware';

const router = Router();

router.get('/', optionalAuth, getChatMessages);
router.post('/', optionalAuth, sanitizeInput, postChatMessage);
router.post('/mark-read', authenticateToken, requireRoles(['admin', 'super-admin']), adminMarkChatRead);

export default router;
