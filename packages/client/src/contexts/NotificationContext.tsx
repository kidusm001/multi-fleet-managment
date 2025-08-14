import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { socketClient } from "@lib/socket";
import type { ShuttleNotification } from "@lib/socket";
import { useRole } from "@contexts/RoleContext";
import { notificationApi } from '@services/notificationApi';

const STORAGE_KEY = 'shuttle_notifications';
const MAX_STORED_NOTIFICATIONS = 50;
const DEBUG = true;
const log = (...args: any[]) => DEBUG && console.log('[NotificationContext]:', ...args);

interface NotificationContextType {
  notifications: ShuttleNotification[];
  unreadCount: number;
  isConnected: boolean;
  markAsSeen: (notificationId: string) => void;
  markAllAsSeen: () => void;
  clearAll: () => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  markAsSeen: () => {},
  markAllAsSeen: () => {},
  clearAll: () => {},
  removeNotification: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  // Initialize state from local storage
  const [notifications, setNotifications] = useState<ShuttleNotification[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const { role } = useRole();

  // Load initial notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const { notifications: initialNotifications } = await notificationApi.getAll();
        const unseenCount = await notificationApi.getUnseenCount();
        setNotifications(initialNotifications);
        setUnreadCount(unseenCount);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    loadNotifications();
  }, []);

  // Persist notifications to local storage
  useEffect(() => {
    const limitedNotifications = notifications
      .slice(0, MAX_STORED_NOTIFICATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedNotifications));
  }, [notifications]);

  // Initialize socket connection and listeners
  useEffect(() => {
    if (!role) {
      log('No role available, skipping socket connection');
      return;
    }

    log('Initializing socket connection for role:', role);
    const socket = socketClient.connect();
    
    // Immediate connection check
    setIsConnected(socket.connected);
    log('Initial connection status:', socket.connected);

    // Subscribe to role channel
    socketClient.subscribeToRole(role);
    log('Subscribed to role channel:', role);

  const unsubNew = socketClient.onNewNotification((notification: ShuttleNotification) => {
      log('Received new notification:', notification);
      // Play notification sound if enabled
      const audio = new Audio('/assets/sounds/notification.mp3');
      audio.play().catch(e => log('Sound play error:', e));
      
      setNotifications(prev => {
        const exists = prev.some(n => n.id === notification.id);
        if (exists) {
          log('Duplicate notification, skipping');
          return prev;
        }
        log('Adding new notification to state');
        // Add at beginning of array and limit size
        return [notification, ...prev].slice(0, MAX_STORED_NOTIFICATIONS);
      });
      
      if (notification.status === 'Pending') {
        log('Incrementing unread count');
        setUnreadCount(prev => prev + 1);
      }
    });

  const unsubSeen = socketClient.onNotificationSeen(({ notificationId, userId, userName }: { notificationId: string; userId: string; userName: string; }) => {
      setNotifications(prev => prev.map(n => 
        n.id === notificationId 
          ? { 
              ...n, 
              status: 'Read',
              seenBy: [...(n.seenBy || []), { id: userId, name: userName }]
            } 
          : n
      ));
    });

    // Enhanced connection event handlers
    socket.on('connect', () => {
      log('Socket connected, resubscribing to role:', role);
      setIsConnected(true);
      socketClient.subscribeToRole(role); // Resubscribe on reconnection
    });
    
  socket.on('disconnect', (reason: string) => {
      log('Socket disconnected:', reason);
      setIsConnected(false);
    });

  socket.on('connect_error', (error: unknown) => {
      log('Socket error:', error);
    });

  socket.io.on('reconnect', (attemptNumber: number) => {
      log('Socket reconnected after', attemptNumber, 'attempts');
    });

    return () => {
      log('Cleaning up socket listeners');
      unsubNew();
      unsubSeen();
      if (socket.connected) {
        socketClient.unsubscribeFromRole(role);
        socketClient.disconnect();
      }
    };
  }, [role]);

  const markAsSeen = useCallback(async (notificationId: string) => {
    try {
      await notificationApi.markAsSeen(notificationId);
      socketClient.markNotificationSeen(notificationId);
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as seen:', error);
    }
  }, []);

  const markAllAsSeen = useCallback(async () => {
    try {
      await notificationApi.markAllAsSeen();
      setUnreadCount(0);
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'Read' }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as seen:', error);
    }
  }, [notifications]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const value = {
    notifications,
    unreadCount,
    isConnected,
    markAsSeen,
    markAllAsSeen,
    clearAll,
    removeNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}