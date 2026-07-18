import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useShop } from '../context/ShopContext';
import { AppNotification } from '../types';

export const useNotification = () => {
  const { user, triggerNotification, fetchNotifications } = useShop();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [liveLog, setLiveLog] = useState<string[]>([]);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  
  // Track timestamps for ping measurements
  const pingStartRef = useRef<number | null>(null);

  // Trigger test-ping to verify round-trip socket timing
  const sendPing = useCallback(() => {
    if (socket && connected) {
      pingStartRef.current = Date.now();
      socket.emit('ping_hub');
      addLogEntry('Client trigger: Ping sent to server...');
    } else {
      addLogEntry('Cannot ping: Socket is not connected.');
    }
  }, [socket, connected]);

  const addLogEntry = (msg: string) => {
    setLiveLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    // Determine the socket server origin (same origin is standard since we serve from Express/Vite on same port)
    const socketUrl = window.location.origin;
    
    addLogEntry(`Initializing Socket.io connection at standard origin...`);
    const newSocket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 10000
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      addLogEntry(`Connected to server. Socket ID: ${newSocket.id}`);
      
      // If user is logged in, register immediately in their user room
      if (user?.id) {
        newSocket.emit('join', user.id);
        addLogEntry(`Registered user channel for active room: "${user.id}"`);
      }
      
      if (user?.role === 'admin') {
        newSocket.emit('join_admin');
        addLogEntry('Admin privilege verified: Joined administrative channel.');
      }
    });

    newSocket.on('disconnect', (reason) => {
      setConnected(false);
      addLogEntry(`Disconnected: ${reason}`);
    });

    newSocket.on('connect_error', (error) => {
      addLogEntry(`Connection Error: ${error.message}`);
    });

    // Pong listener for latency testing
    newSocket.on('pong_hub', () => {
      if (pingStartRef.current) {
        const latency = Date.now() - pingStartRef.current;
        setPingLatency(latency);
        addLogEntry(`Round-trip Pong received! Latency: ${latency}ms`);
        pingStartRef.current = null;
      }
    });

    // Handle high-integrity incoming real-time notifications
    newSocket.on('notification', (notif: AppNotification & { orderNumber?: string, status?: string }) => {
      addLogEntry(`Incoming real-time event: "${notif.title}" - ${notif.message}`);
      
      // Sound cue for real-time engagement (non-blocking)
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.type = 'sine';
        oscillator.frequency.value = 523.25; // High C pitch
        gainNode.gain.setValueAtTime(0, context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.08, context.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.35);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.4);
      } catch (err) {
        // Audio output silenced, continue quietly
      }

      // Fire global context notification to raise alertBar, sync notifications array
      triggerNotification(notif.title, notif.message, notif.type);
      
      // Refresh persistent notifications lists to keep view in sync
      fetchNotifications().catch(err => {
        console.error('Error syncing notifications database state:', err);
      });
    });

    return () => {
      addLogEntry('Disconnecting Socket.io connection...');
      newSocket.close();
    };
  }, [user?.id, user?.role]);

  return {
    socket,
    connected,
    liveLog,
    pingLatency,
    sendPing,
    triggerManualClientAlert: (title: string, message: string, type: 'success' | 'warning' | 'info' | 'promotion' = 'success') => {
      triggerNotification(title, message, type);
    }
  };
};
