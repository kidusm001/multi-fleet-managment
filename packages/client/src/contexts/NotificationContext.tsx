import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { socketClient, ShuttleNotification } from "@lib/socket";
import { useRole } from "@contexts/RoleContext";
import { notificationApi } from '@services/notificationApi';
import { useAuth } from '@contexts/AuthContext';

const STORAGE_KEY = 'shuttle_notifications';
const MAX_STORED_NOTIFICATIONS = 50;
const DEBUG = true; // Enable debug logging
const log = (...args: unknown[]) => {
  if (DEBUG) console.log('[NotificationContext]:', ...args);
};

interface NotificationContextType {
  notifications: ShuttleNotification[];
  unreadCount: number;
  isConnected: boolean;
  markAsSeen: (notificationId: string) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsSeen: () => void;
  clearAll: () => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  markAsSeen: () => {},
  markAsRead: () => {},
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
  const { isAuthenticated } = useAuth();

  // Load initial notifications and unread count
  const loadInitialData = useCallback(async () => {
    if (!isAuthenticated) {
      log('Not authenticated, skipping initial notifications fetch');
      return;
    }
    
    try {
      log('Loading initial notifications and unread count');
      const [notificationsData, unseenCount] = await Promise.all([
        notificationApi.getAll(),
        notificationApi.getUnseenCount()
      ]);
      
      setNotifications(notificationsData.notifications as unknown as ShuttleNotification[] || []);
      setUnreadCount(unseenCount);
      log('Loaded notifications:', notificationsData.notifications?.length, 'Unread count:', unseenCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, [isAuthenticated]);

  // Load initial data when authenticated
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Persist notifications to local storage
  useEffect(() => {
    const limitedNotifications = notifications
      .slice(0, MAX_STORED_NOTIFICATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedNotifications));
  }, [notifications]);

  // Initialize socket connection and listeners only when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      log('Not authenticated, skipping socket connection');
      return;
    }
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

    const unsubNew = socketClient.onNewNotification(async (notification) => {
      log('Received new notification:', notification);
      
      // Play notification sound if enabled
      try {
        const audio = new Audio('/assets/sounds/notification.mp3');
        await audio.play().catch(e => log('Sound play error:', e));
      } catch (err) {
        log('Audio error:', err);
      }
      
      setNotifications(prev => {
        const exists = prev.some(n => n.id === notification.id);
        if (exists) {
          log('Duplicate notification, skipping');
          return prev;
        }
        log('Adding new notification to state');
        return [notification, ...prev].slice(0, MAX_STORED_NOTIFICATIONS);
      });
      
      // Re-fetch unread count to ensure accuracy
      try {
        const unseenCount = await notificationApi.getUnseenCount();
        log('Updated unread count from API:', unseenCount);
        setUnreadCount(unseenCount);
      } catch (error) {
        log('Failed to refresh unseen count:', error);
        // Fallback: check if notification is unread and increment
        const isUnread = notification.status === 'UNREAD' || 
                        notification.status === 'Pending' ||
                        !notification.seenBy || 
                        notification.seenBy.length === 0;
        if (isUnread) {
          log('Fallback: Incrementing unread count');
          setUnreadCount(prev => prev + 1);
        }
      }
    });

    const unsubSeen = socketClient.onNotificationSeen(({ notificationId, userId, userName }) => {
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
    
    socket.on('disconnect', (reason) => {
      log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      log('Socket error:', error);
    });

    socket.io.on('reconnect', (attemptNumber) => {
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
  }, [role, isAuthenticated]);

  const markAsSeen = useCallback(async (notificationId: string) => {
    try {
      await notificationApi.markAsSeen(notificationId);
      socketClient.markNotificationSeen(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as seen:', error);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, status: 'Read' as const } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsSeen = useCallback(async () => {
    try {
      log('Marking all notifications as seen/read');
      await notificationApi.markAllAsRead(); // This marks as both seen AND read
      setUnreadCount(0);
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'Read' as const }))
      );
      log('Successfully marked all as seen/read');
    } catch (error) {
      console.error('Failed to mark all notifications as seen:', error);
    }
  }, []);

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
    markAsRead,
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