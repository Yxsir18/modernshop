import { Router } from 'express';
import {
  createSupportTicket,
  getAllSupportTickets,
  getSupportTicketById,
  updateSupportTicket,
  deleteSupportTicket,
  sendChatMessage,
  getChatMessages,
  markChatAsRead,
  createCustomerNote,
  getCustomerNotes,
  updateCustomerNote,
  deleteCustomerNote,
  getCustomerServiceStats
} from '../controllers/customerService.controller';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware';
import { sanitizeInput, auditLogger } from '../middleware/security.middleware';

const router = Router();

// Customer Service Dashboard Stats (Admin only)
router.get('/stats', authenticateToken, requireRoles(['admin', 'super-admin']), getCustomerServiceStats);

// TICKET ROUTES
// Create ticket (both customers and admins can create)
router.post('/tickets', authenticateToken, sanitizeInput, auditLogger('Support ticket created'), createSupportTicket);

// Get all tickets (filtered by role)
router.get('/tickets', authenticateToken, getAllSupportTickets);

// Get specific ticket
router.get('/tickets/:id', authenticateToken, getSupportTicketById);

// Update ticket (Admin only)
router.put('/tickets/:id', authenticateToken, requireRoles(['admin', 'super-admin']), sanitizeInput, auditLogger('Support ticket updated'), updateSupportTicket);

// Delete ticket (Admin only)
router.delete('/tickets/:id', authenticateToken, requireRoles(['admin', 'super-admin']), auditLogger('Support ticket deleted'), deleteSupportTicket);

// CHAT MESSAGE ROUTES
// Send chat message
router.post('/chat', authenticateToken, sanitizeInput, auditLogger('Chat message sent'), sendChatMessage);

// Get chat messages
router.get('/chat', authenticateToken, getChatMessages);

// Mark chat as read
router.post('/chat/read', authenticateToken, markChatAsRead);

// CUSTOMER NOTES ROUTES (Admin only)
router.post('/notes', authenticateToken, requireRoles(['admin', 'super-admin']), sanitizeInput, auditLogger('Customer note created'), createCustomerNote);

// Get customer notes
router.get('/notes', authenticateToken, getCustomerNotes);

// Update customer note (Admin only)
router.put('/notes/:id', authenticateToken, requireRoles(['admin', 'super-admin']), sanitizeInput, auditLogger('Customer note updated'), updateCustomerNote);

// Delete customer note (Admin only)
router.delete('/notes/:id', authenticateToken, requireRoles(['admin', 'super-admin']), auditLogger('Customer note deleted'), deleteCustomerNote);

export default router;
