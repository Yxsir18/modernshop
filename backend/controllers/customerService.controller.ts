import { Request, Response } from 'express';
import { dbConnection } from '../config/db';
import { sendResponse, sendError } from '../utils/response';
import { notifyUser } from '../sockets/socketService';
import { ChatMessage, SupportTicket, CustomerNote } from '../../src/types';

// Generate unique ticket number
const generateTicketNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${timestamp}-${random}`;
};

// TICKET MANAGEMENT
export const createSupportTicket = async (req: Request, res: Response) => {
  const { userId, subject, category, priority, description, orderId, productId } = req.body;
  const requestingUserId = (req as any).user?.id;

  if (!subject || !category || !description) {
    return sendError(res, 400, 'Subject, category, and description are required.');
  }

  // Get user info if userId is provided (for admin creating tickets on behalf of users)
  let targetUserId = requestingUserId;
  let userName = (req as any).user?.name || 'Unknown';
  let userEmail = (req as any).user?.email || 'unknown@example.com';

  if (userId && (req as any).user?.role === 'admin') {
    const users = dbConnection.getCollection('users');
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) {
      return sendError(res, 404, 'User not found.');
    }
    targetUserId = userId;
    userName = targetUser.name;
    userEmail = targetUser.email;
  }

  const tickets = dbConnection.getCollection('supportTickets') as SupportTicket[] || [];
  
  const newTicket: SupportTicket = {
    id: `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ticketNumber: generateTicketNumber(),
    userId: targetUserId,
    userName,
    userEmail,
    subject,
    category,
    priority: priority || 'Medium',
    status: 'Open',
    description,
    orderId,
    productId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  tickets.push(newTicket);
  dbConnection.updateCollection('supportTickets', tickets);

  // Notify user about ticket creation
  notifyUser(targetUserId, {
    title: 'Support Ticket Created',
    message: `Your ticket ${newTicket.ticketNumber} has been created successfully.`,
    type: 'success'
  });

  return sendResponse(res, 201, true, 'Support ticket created successfully.', newTicket);
};

export const getAllSupportTickets = async (req: Request, res: Response) => {
  const { status, category, priority, userId } = req.query;
  
  let tickets = dbConnection.getCollection('supportTickets') as SupportTicket[] || [];

  // Filter by status
  if (status) {
    tickets = tickets.filter((t: SupportTicket) => t.status === status);
  }

  // Filter by category
  if (category) {
    tickets = tickets.filter((t: SupportTicket) => t.category === category);
  }

  // Filter by priority
  if (priority) {
    tickets = tickets.filter((t: SupportTicket) => t.priority === priority);
  }

  // Filter by user ID (for customers viewing their own tickets)
  if (userId) {
    tickets = tickets.filter((t: SupportTicket) => t.userId === userId);
  }

  // Sort by creation date (newest first)
  tickets.sort((a: SupportTicket, b: SupportTicket) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return sendResponse(res, 200, true, 'Support tickets retrieved successfully.', { tickets });
};

export const getSupportTicketById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestingUserId = (req as any).user?.id;
  const requestingUserRole = (req as any).user?.role;

  const tickets = dbConnection.getCollection('supportTickets') as SupportTicket[] || [];
  const ticket = tickets.find((t: SupportTicket) => t.id === id);

  if (!ticket) {
    return sendError(res, 404, 'Ticket not found.');
  }

  // Check access: admin can view all, users can only view their own
  if (requestingUserRole !== 'admin' && requestingUserRole !== 'super-admin' && ticket.userId !== requestingUserId) {
    return sendError(res, 403, 'Access denied.');
  }

  return sendResponse(res, 200, true, 'Ticket retrieved successfully.', ticket);
};

export const updateSupportTicket = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, priority, assignedTo, resolution } = req.body;
  const requestingUserId = (req as any).user?.id;
  const requestingUserRole = (req as any).user?.role;

  const tickets = dbConnection.getCollection('supportTickets') as SupportTicket[] || [];
  const ticketIndex = tickets.findIndex((t: SupportTicket) => t.id === id);

  if (ticketIndex === -1) {
    return sendError(res, 404, 'Ticket not found.');
  }

  const ticket = tickets[ticketIndex];

  // Only admins can update ticket status, priority, assignment
  if (requestingUserRole !== 'admin' && requestingUserRole !== 'super-admin') {
    return sendError(res, 403, 'Only admins can update tickets.');
  }

  // Update fields
  if (status) ticket.status = status;
  if (priority) ticket.priority = priority;
  if (assignedTo !== undefined) ticket.assignedTo = assignedTo;
  if (resolution) ticket.resolution = resolution;

  // Set resolved timestamp if status is Resolved or Closed
  if ((status === 'Resolved' || status === 'Closed') && !ticket.resolvedAt) {
    ticket.resolvedAt = new Date().toISOString();
  }

  ticket.updatedAt = new Date().toISOString();

  tickets[ticketIndex] = ticket;
  dbConnection.updateCollection('supportTickets', tickets);

  // Notify user about ticket update
  notifyUser(ticket.userId, {
    title: 'Support Ticket Updated',
    message: `Your ticket ${ticket.ticketNumber} status has been updated to ${ticket.status}.`,
    type: 'info'
  });

  return sendResponse(res, 200, true, 'Ticket updated successfully.', ticket);
};

export const deleteSupportTicket = async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestingUserRole = (req as any).user?.role;

  if (requestingUserRole !== 'admin' && requestingUserRole !== 'super-admin') {
    return sendError(res, 403, 'Only admins can delete tickets.');
  }

  const tickets = dbConnection.getCollection('supportTickets') as SupportTicket[] || [];
  const ticketIndex = tickets.findIndex((t: SupportTicket) => t.id === id);

  if (ticketIndex === -1) {
    return sendError(res, 404, 'Ticket not found.');
  }

  tickets.splice(ticketIndex, 1);
  dbConnection.updateCollection('supportTickets', tickets);

  return sendResponse(res, 200, true, 'Ticket deleted successfully.');
};

// CHAT MESSAGE MANAGEMENT
export const sendChatMessage = async (req: Request, res: Response) => {
  const { ticketId, message, attachments } = req.body;
  const requestingUserId = (req as any).user?.id;
  const requestingUserName = (req as any).user?.name;
  const requestingUserAvatar = (req as any).user?.avatar;
  const requestingUserRole = (req as any).user?.role;

  if (!message) {
    return sendError(res, 400, 'Message is required.');
  }

  const chats = dbConnection.getCollection('chatMessages') as ChatMessage[] || [];
  
  const newMessage: ChatMessage = {
    id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ticketId,
    userId: requestingUserId,
    userName: requestingUserName || 'Unknown',
    userAvatar: requestingUserAvatar,
    message,
    sender: requestingUserRole === 'admin' || requestingUserRole === 'super-admin' ? 'admin' : 'customer',
    timestamp: new Date().toISOString(),
    isRead: false,
    attachments
  };

  chats.push(newMessage);
  dbConnection.updateCollection('chatMessages', chats);

  // If message is from admin, notify the customer
  if (newMessage.sender === 'admin' && ticketId) {
    const tickets = dbConnection.getCollection('supportTickets') as SupportTicket[] || [];
    const ticket = tickets.find((t: SupportTicket) => t.id === ticketId);
    if (ticket) {
      notifyUser(ticket.userId, {
        title: 'New Message from Support',
        message: `You have a new message regarding ticket ${ticket.ticketNumber}.`,
        type: 'info'
      });
    }
  }

  return sendResponse(res, 201, true, 'Message sent successfully.', newMessage);
};

export const getChatMessages = async (req: Request, res: Response) => {
  const { ticketId, userId } = req.query;
  const requestingUserId = (req as any).user?.id;
  const requestingUserRole = (req as any).user?.role;

  let messages = dbConnection.getCollection('chatMessages') as ChatMessage[] || [];

  // Filter by ticket ID
  if (ticketId) {
    messages = messages.filter((m: ChatMessage) => m.ticketId === ticketId);
  }

  // Filter by user ID (for customers viewing their own messages)
  if (userId && requestingUserRole !== 'admin' && requestingUserRole !== 'super-admin') {
    messages = messages.filter((m: ChatMessage) => m.userId === userId);
  }

  // Sort by timestamp (oldest first for chat history)
  messages.sort((a: ChatMessage, b: ChatMessage) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return sendResponse(res, 200, true, 'Chat messages retrieved successfully.', { messages });
};

export const markChatAsRead = async (req: Request, res: Response) => {
  const { ticketId } = req.body;
  const requestingUserId = (req as any).user?.id;
  const requestingUserRole = (req as any).user?.role;

  const chats = dbConnection.getCollection('chatMessages') as ChatMessage[] || [];
  
  // Mark messages as read based on role
  chats.forEach((message: ChatMessage) => {
    if (ticketId && message.ticketId !== ticketId) return;
    
    // Admins mark customer messages as read
    if (requestingUserRole === 'admin' || requestingUserRole === 'super-admin') {
      if (message.sender === 'customer') {
        message.isRead = true;
      }
    } else {
      // Customers mark admin messages as read
      if (message.sender === 'admin') {
        message.isRead = true;
      }
    }
  });

  dbConnection.updateCollection('chatMessages', chats);

  return sendResponse(res, 200, true, 'Messages marked as read successfully.');
};

// CUSTOMER NOTES MANAGEMENT
export const createCustomerNote = async (req: Request, res: Response) => {
  const { userId, note, category, isInternal } = req.body;
  const requestingUserId = (req as any).user?.id;
  const requestingUserName = (req as any).user?.name;
  const requestingUserRole = (req as any).user?.role;

  if (requestingUserRole !== 'admin' && requestingUserRole !== 'super-admin') {
    return sendError(res, 403, 'Only admins can create customer notes.');
  }

  if (!userId || !note) {
    return sendError(res, 400, 'User ID and note are required.');
  }

  // Verify user exists
  const users = dbConnection.getCollection('users');
  const targetUser = users.find(u => u.id === userId);
  if (!targetUser) {
    return sendError(res, 404, 'User not found.');
  }

  const notes = dbConnection.getCollection('customerNotes') as CustomerNote[] || [];
  
  const newNote: CustomerNote = {
    id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    adminId: requestingUserId,
    adminName: requestingUserName || 'Admin',
    note,
    category: category || 'General',
    isInternal: isInternal || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  notes.push(newNote);
  dbConnection.updateCollection('customerNotes', notes);

  return sendResponse(res, 201, true, 'Customer note created successfully.', newNote);
};

export const getCustomerNotes = async (req: Request, res: Response) => {
  const { userId, category } = req.query;
  const requestingUserRole = (req as any).user?.role;

  let notes = dbConnection.getCollection('customerNotes') as CustomerNote[] || [];

  // Filter by user ID
  if (userId) {
    notes = notes.filter((n: CustomerNote) => n.userId === userId);
  }

  // Filter by category
  if (category) {
    notes = notes.filter((n: CustomerNote) => n.category === category);
  }

  // Non-admins should not see internal notes
  if (requestingUserRole !== 'admin' && requestingUserRole !== 'super-admin') {
    notes = notes.filter((n: CustomerNote) => !n.isInternal);
  }

  // Sort by creation date (newest first)
  notes.sort((a: CustomerNote, b: CustomerNote) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return sendResponse(res, 200, true, 'Customer notes retrieved successfully.', { notes });
};

export const updateCustomerNote = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { note, category, isInternal } = req.body;
  const requestingUserRole = (req as any).user?.role;

  if (requestingUserRole !== 'admin' && requestingUserRole !== 'super-admin') {
    return sendError(res, 403, 'Only admins can update customer notes.');
  }

  const notes = dbConnection.getCollection('customerNotes') as CustomerNote[] || [];
  const noteIndex = notes.findIndex((n: CustomerNote) => n.id === id);

  if (noteIndex === -1) {
    return sendError(res, 404, 'Note not found.');
  }

  const customerNote = notes[noteIndex];

  if (note) customerNote.note = note;
  if (category) customerNote.category = category;
  if (isInternal !== undefined) customerNote.isInternal = isInternal;
  customerNote.updatedAt = new Date().toISOString();

  notes[noteIndex] = customerNote;
  dbConnection.updateCollection('customerNotes', notes);

  return sendResponse(res, 200, true, 'Customer note updated successfully.', customerNote);
};

export const deleteCustomerNote = async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestingUserRole = (req as any).user?.role;

  if (requestingUserRole !== 'admin' && requestingUserRole !== 'super-admin') {
    return sendError(res, 403, 'Only admins can delete customer notes.');
  }

  const notes = dbConnection.getCollection('customerNotes') as CustomerNote[] || [];
  const noteIndex = notes.findIndex((n: CustomerNote) => n.id === id);

  if (noteIndex === -1) {
    return sendError(res, 404, 'Note not found.');
  }

  notes.splice(noteIndex, 1);
  dbConnection.updateCollection('customerNotes', notes);

  return sendResponse(res, 200, true, 'Customer note deleted successfully.');
};

// Get customer service dashboard stats
export const getCustomerServiceStats = async (req: Request, res: Response) => {
  const requestingUserRole = (req as any).user?.role;

  if (requestingUserRole !== 'admin' && requestingUserRole !== 'super-admin') {
    return sendError(res, 403, 'Access denied.');
  }

  const tickets = dbConnection.getCollection('supportTickets') as SupportTicket[] || [];
  const chats = dbConnection.getCollection('chatMessages') as ChatMessage[] || [];
  const notes = dbConnection.getCollection('customerNotes') as CustomerNote[] || [];

  const openTickets = tickets.filter((t: SupportTicket) => t.status === 'Open').length;
  const inProgressTickets = tickets.filter((t: SupportTicket) => t.status === 'In Progress').length;
  const resolvedTickets = tickets.filter((t: SupportTicket) => t.status === 'Resolved').length;
  const closedTickets = tickets.filter((t: SupportTicket) => t.status === 'Closed').length;
  
  const highPriorityTickets = tickets.filter((t: SupportTicket) => t.priority === 'High' || t.priority === 'Urgent').length;
  const unreadMessages = chats.filter((m: ChatMessage) => !m.isRead && m.sender === 'customer').length;

  const stats = {
    tickets: {
      total: tickets.length,
      open: openTickets,
      inProgress: inProgressTickets,
      resolved: resolvedTickets,
      closed: closedTickets,
      highPriority: highPriorityTickets
    },
    chats: {
      total: chats.length,
      unread: unreadMessages
    },
    notes: {
      total: notes.length
    }
  };

  return sendResponse(res, 200, true, 'Customer service stats retrieved successfully.', stats);
};
