import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { socketClient, ShuttleNotification } from "@lib/socket";
import { useRole } from "@contexts/RoleContext";
import { notificationApi } from '@services/notificationApi';
import { useAuth } from '@contexts/AuthContext';
import { useOrganization } from '@contexts/OrganizationContext';

const STORAGE_KEY = 'shuttle_notifications';
const MAX_STORED_NOTIFICATIONS = 50;
const DEBUG = true; // Enable debug logging
const log = (...args: unknown[]) => {
  if (DEBUG) console.log('[NotificationContext]:', ...args);
};

const isReadStatus = (status?: ShuttleNotification['status']) => (status ?? '').toString().toUpperCase() === 'READ';

interface NotificationContextType {
  notifications: ShuttleNotification[];
  unreadCount: number;
  isConnected: boolean;
  stats: { total: number; unread: number; read: number };
  refreshStats: (filters?: { type?: string; importance?: string; fromDate?: string; toDate?: string }) => Promise<void>;
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
  stats: { total: 0, unread: 0, read: 0 },
  refreshStats: async () => {},
  markAsSeen: () => {},
  markAsRead: () => {},
  markAllAsSeen: () => {},
  clearAll: () => {},
  removeNotification: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const { role, isReady: isRoleReady } = useRole();
  const { activeOrganization, isLoading: isOrganizationLoading } = useOrganization();
  const storageKey = useMemo(() => {
    // Ensure we access a typed user id so TypeScript does not infer `never`
    const userId = (user as { id?: string } | null | undefined)?.id;
    if (!userId) {
      return null;
    }
    const orgSegment = activeOrganization?.id ? `:${activeOrganization.id}` : '';
    return `${STORAGE_KEY}:${userId}${orgSegment}`;
  }, [user, activeOrganization?.id]);

  const [notifications, setNotifications] = useState<ShuttleNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0 });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!storageKey) {
      setNotifications([]);
      setUnreadCount(0);
      setStats({ total: 0, unread: 0, read: 0 });
      return;
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as ShuttleNotification[];
        setNotifications(parsed);
        const unreadTotal = parsed.filter(item => !isReadStatus(item.status)).length;
        const derivedStats = {
          total: parsed.length,
          unread: unreadTotal,
          read: parsed.length - unreadTotal,
        };
        setUnreadCount(unreadTotal);
        setStats(derivedStats);
      } else {
        setNotifications([]);
        setUnreadCount(0);
        setStats({ total: 0, unread: 0, read: 0 });
      }
    } catch (error) {
      console.warn('[NotificationContext]: Failed to parse cached notifications', error);
      setNotifications([]);
      setUnreadCount(0);
      setStats({ total: 0, unread: 0, read: 0 });
    }
  }, [storageKey]);

  const readyForRequests = useMemo(() => {
    if (!isAuthenticated) {
      return false;
    }

    if (!isRoleReady || !role) {
      log('Role context not ready, deferring notification queries');
      return false;
    }

    if (isOrganizationLoading) {
      log('Organization context loading, deferring notification queries');
      return false;
    }

    if (!activeOrganization?.id) {
      log('No active organization, deferring notification queries');
      return false;
    }

    return true;
  }, [isAuthenticated, isRoleReady, role, isOrganizationLoading, activeOrganization?.id]);

  // Shared function to refresh stats (used by both nav and dashboard)
  const refreshStats = useCallback(async (filters?: { type?: string; importance?: string; fromDate?: string; toDate?: string }) => {
    if (!readyForRequests) {
      log('Notification context not yet ready, skipping stats refresh');
      return;
    }
    
    try {
      log('Refreshing stats with filters:', filters);
      const baseQuery = {
        page: 1,
        limit: 1,
        type: filters?.type && filters.type !== "all" ? filters.type : undefined,
        importance: filters?.importance && filters.importance !== "all" ? filters.importance as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" : undefined,
        fromDate: filters?.fromDate,
        toDate: filters?.toDate,
      };
      
      log('API query being sent:', baseQuery);
      
      const [allResponse, unreadResponse, readResponse] = await Promise.all([
        notificationApi.getAll(baseQuery),
        notificationApi.getUnread(baseQuery),
        notificationApi.getRead(baseQuery),
      ]);
      
      log('API responses received - all:', allResponse.pagination.total, 'unread:', unreadResponse.pagination.total, 'read:', readResponse.pagination.total);
      
      const newStats = {
        total: allResponse.pagination.total,
        unread: unreadResponse.pagination.total,
        read: readResponse.pagination.total,
      };
      
      setStats(newStats);
      setUnreadCount(newStats.unread);
      log('Stats refreshed:', newStats);
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  }, [readyForRequests]);

  // Load initial notifications and unread count
  const loadInitialData = useCallback(async () => {
    if (!readyForRequests) {
      log('Notification context not yet ready, skipping initial fetch');
      return;
    }
    
    try {
      log('Loading initial notifications and stats');
      const [notificationsData] = await Promise.all([
        notificationApi.getAll(),
        refreshStats(), // Use shared stats refresh
      ]);
      
      setNotifications(notificationsData.notifications as unknown as ShuttleNotification[] || []);
      log('Loaded notifications:', notificationsData.notifications?.length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, [readyForRequests, refreshStats]);

  // Load initial data when authenticated
  useEffect(() => {
    if (!readyForRequests) {
      return;
    }

    loadInitialData();
  }, [loadInitialData, readyForRequests]);

  // Listen for external notification updates (from dashboard)
  useEffect(() => {
    const handleNotificationUpdate = async () => {
      log('External update detected, refreshing context...');
      await loadInitialData();
    };

    window.addEventListener('notification-updated', handleNotificationUpdate);
    return () => {
      window.removeEventListener('notification-updated', handleNotificationUpdate);
    };
  }, [loadInitialData]);

  // Persist notifications to local storage
  useEffect(() => {
    if (!storageKey) {
      return;
    }
    const limitedNotifications = notifications.slice(0, MAX_STORED_NOTIFICATIONS);
    localStorage.setItem(storageKey, JSON.stringify(limitedNotifications));
  }, [notifications, storageKey]);

  // Initialize socket connection and listeners only when authenticated
  useEffect(() => {
    if (!readyForRequests) {
      log('Notification context not ready, skipping socket connection');
      return;
    }

    const roleChannel = role ?? '';
    if (!roleChannel) {
      log('Resolved role channel was empty, skipping socket setup');
      return;
    }

    log('Initializing socket connection for role:', roleChannel);
    const socket = socketClient.connect();
    
    // Immediate connection check
    setIsConnected(socket.connected);
    log('Initial connection status:', socket.connected);

    // Subscribe to role channel
    socketClient.subscribeToRole(roleChannel);
    log('Subscribed to role channel:', roleChannel);

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
        const isUnread = !isReadStatus(notification.status) ||
                        !notification.seenBy ||
                        notification.seenBy.length === 0;
        if (isUnread) {
          log('Fallback: Incrementing unread count');
          setUnreadCount(prev => prev + 1);
        }
      }
      
      // Emit event to notify other components (like NotificationPanel) about new notification
      log('Emitting new-notification event for other components');
      window.dispatchEvent(new CustomEvent('new-notification', { detail: notification }));
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
      log('Socket connected, resubscribing to role:', roleChannel);
      setIsConnected(true);
      socketClient.subscribeToRole(roleChannel); // Resubscribe on reconnection
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
        socketClient.unsubscribeFromRole(roleChannel);
        socketClient.disconnect();
      }
    };
  }, [readyForRequests, role, isAuthenticated]);

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
      
      // Get current user ID if available
      const userId = (window as unknown as { __userId?: string }).__userId || 'current-user';
      
      setNotifications(prev => 
        prev.map(n => {
          if (n.id === notificationId) {
            // Update both status and seenBy array
            const updatedSeenBy = n.seenBy?.length 
              ? n.seenBy.map(seen => 
                  seen.userId === userId 
                    ? { ...seen, readAt: new Date().toISOString() }
                    : seen
                )
              : [{ id: userId, userId, name: 'You', seenAt: new Date().toISOString(), readAt: new Date().toISOString() }];
            
            return { 
              ...n, 
              status: 'Read' as const,
              seenBy: updatedSeenBy
            };
          }
          return n;
        })
      );
      // Refresh stats to sync counts
      await refreshStats();
      // Emit event to update dashboard
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [refreshStats]);

  const markAllAsSeen = useCallback(async () => {
    try {
      log('Marking all notifications as seen/read');
      await notificationApi.markAllAsRead(); // This marks as both seen AND read
      
      // Get current user ID if available
      const userId = (window as unknown as { __userId?: string }).__userId || 'current-user';
      
      setNotifications(prev => 
        prev.map(n => {
          // Update both status and seenBy array for all notifications
          const updatedSeenBy = n.seenBy?.length 
            ? n.seenBy.map(seen => 
                seen.userId === userId 
                  ? { ...seen, readAt: new Date().toISOString() }
                  : seen
              )
            : [{ id: userId, userId, name: 'You', seenAt: new Date().toISOString(), readAt: new Date().toISOString() }];
          
          return { 
            ...n, 
            status: 'Read' as const,
            seenBy: updatedSeenBy
          };
        })
      );
      // Refresh stats to sync counts
      await refreshStats();
      // Emit event to update dashboard
      window.dispatchEvent(new CustomEvent('notification-updated'));
      log('Successfully marked all as seen/read');
    } catch (error) {
      console.error('Failed to mark all notifications as seen:', error);
    }
  }, [refreshStats]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    setStats({ total: 0, unread: 0, read: 0 });
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const value = {
    notifications,
    unreadCount,
    isConnected,
    stats,
    refreshStats,
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