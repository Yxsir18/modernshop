import { Server as SocketIoServer } from 'socket.io';
import { db } from '../../src/db/dataStore';
import { dbConnection } from '../config/db';

let io: SocketIoServer | null = null;

// Track active online users mapped to socket ids for presence indicators
const activeUsers = new Map<string, string>(); // userId -> socketId

export const initSocketServer = (httpServer: any) => {
  io = new SocketIoServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);

    // Handle user registration / join room
    socket.on('join', (userId: string) => {
      if (userId) {
        socket.join(userId);
        activeUsers.set(userId, socket.id);
        console.log(`[SOCKET] User ${userId} joined room ${userId}`);

        // Send a cozy welcome alert through real-time push
        socket.emit('notification', {
          id: `welcome_${Date.now()}`,
          title: 'Secure Sync Active',
          message: 'Real-time order tracking and security monitors are active.',
          type: 'success',
          date: new Date().toISOString(),
          read: false
        });
      }
    });

    // Handle admin room join
    socket.on('join_admin', () => {
      socket.join('admin_room');
      console.log(`[SOCKET] Admin connected and joined 'admin_room'`);
    });

    // Echo/ping check
    socket.on('ping_hub', () => {
      socket.emit('pong_hub', { time: Date.now() });
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET] Client disconnected: ${socket.id}`);
      // Clean up mapping
      for (const [uid, sid] of activeUsers.entries()) {
        if (sid === socket.id) {
          activeUsers.delete(uid);
          break;
        }
      }
    });
  });

  console.log('[SOCKET ENGINE] Socket.io active on standard integration hub.');
  return io;
};

export const getIo = (): SocketIoServer => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet. Call initSocketServer(server) first.');
  }
  return io;
};

// High-integrity wrapper to trigger a real-time order update or in-app alert
export const notifyUser = (userId: string, alertPayload: {
  id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'promotion';
  orderId?: string;
  orderNumber?: string;
  status?: string;
}) => {
  try {
    const activeIo = getIo();
    const cleanAlert = {
      id: alertPayload.id || `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: alertPayload.title,
      message: alertPayload.message,
      type: alertPayload.type,
      orderId: alertPayload.orderId,
      orderNumber: alertPayload.orderNumber,
      status: alertPayload.status,
      date: new Date().toISOString(),
      read: false
    };

    // 1. Send via Socket.io to individual user room
    activeIo.to(userId).emit('notification', cleanAlert);
    console.log(`[SOCKET NOTIFICATION] Dispatched to user ${userId}:`, cleanAlert);

    // 2. Persist the alert in the persistent data stores for both baseline db and enterprise dbConnection
    // Under db (dataStore.ts):
    try {
      const dbNotifs = db.getNotifications() || [];
      dbNotifs.push({
        id: cleanAlert.id,
        userId,
        title: cleanAlert.title,
        message: cleanAlert.message,
        type: cleanAlert.type,
        date: cleanAlert.date,
        read: false
      });
      db.setNotifications(dbNotifs);
    } catch (e) {
      console.error('Error persisting notification in local dataStore:', e);
    }

    // Under dbConnection (enterprise db.ts):
    try {
      const enterpriseNotifs = dbConnection.getCollection('notifications') || [];
      enterpriseNotifs.push({
        id: cleanAlert.id,
        userId,
        title: cleanAlert.title,
        message: cleanAlert.message,
        type: cleanAlert.type,
        date: cleanAlert.date,
        read: false
      });
      dbConnection.updateCollection('notifications', enterpriseNotifs);
    } catch (e) {
      console.error('Error persisting notification in enterprise database:', e);
    }

  } catch (err) {
    console.warn('[SOCKET ENGINE] Socket connection was unavailable for direct routing. Logging local notification only.', err);
  }
};

// Admin broadcast helper
export const broadcastAlert = (alertPayload: {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'promotion';
}) => {
  try {
    const activeIo = getIo();
    const cleanAlert = {
      id: `broadcast_${Date.now()}`,
      title: alertPayload.title,
      message: alertPayload.message,
      type: alertPayload.type,
      date: new Date().toISOString(),
      read: false
    };
    
    // 1. Send via Socket.io to all connected clients
    activeIo.emit('notification', cleanAlert);
    console.log(`[SOCKET BROADCAST] Dispatched to all online clients:`, cleanAlert);

    // 2. Persist the alert in the persistent data stores for offline users
    // Under db (dataStore.ts):
    try {
      const dbNotifs = db.getNotifications() || [];
      dbNotifs.push({
        id: cleanAlert.id,
        userId: 'all', // Broadcast to all users (online and offline)
        title: cleanAlert.title,
        message: cleanAlert.message,
        type: cleanAlert.type,
        date: cleanAlert.date,
        read: false
      });
      db.setNotifications(dbNotifs);
    } catch (e) {
      console.error('Error persisting broadcast notification in local dataStore:', e);
    }

    // Under dbConnection (enterprise db.ts):
    try {
      const enterpriseNotifs = dbConnection.getCollection('notifications') || [];
      enterpriseNotifs.push({
        id: cleanAlert.id,
        userId: 'all', // Broadcast to all users (online and offline)
        title: cleanAlert.title,
        message: cleanAlert.message,
        type: cleanAlert.type,
        date: cleanAlert.date,
        read: false
      });
      dbConnection.updateCollection('notifications', enterpriseNotifs);
    } catch (e) {
      console.error('Error persisting broadcast notification in enterprise database:', e);
    }

  } catch (err) {
    console.error('Error broadcasting alert:', err);
  }
};

export const getActiveSocketCount = (): number => {
  if (!io) return 0;
  return io.sockets.sockets.size;
};
