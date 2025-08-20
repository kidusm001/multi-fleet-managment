import { io, Socket } from 'socket.io-client';

const DEBUG = true;
const log = (...args: unknown[]) => DEBUG && console.log('[SocketClient]:', ...args);

// Update notification types to match Prisma model
export interface ShuttleNotification {
  id: string;
  toRoles: string[];
  fromRole: string;
  notificationType: string;
  subject: string;
  message: string;
  importance: 'Low' | 'Medium' | 'High' | 'Critical';
  createdAt: string;
  localTime: string;
  relatedEntityId?: string;
  status: 'Pending' | 'Delivered' | 'Read';
  seenBy: Array<{
    id: string;
    name: string;
  }>;
}

// Update server-to-client events
interface ServerToClientEvents {
  'notification:new': (data: ShuttleNotification) => void;
  'notification': (data: ShuttleNotification) => void; // Add legacy event name
  'notification:update': (data: Partial<ShuttleNotification> & { id: string }) => void;
  'notification:seen': (data: { notificationId: string; userId: string; userName: string }) => void;
  'notification:status': (data: { notificationId: string; status: ShuttleNotification['status'] }) => void;
  'shuttle:location': (data: { shuttleId: string; lat: number; lng: number }) => void;
  'route:update': (data: { routeId: string; status: string }) => void;
}

// Update client-to-server events
interface ClientToServerEvents {
  'notification:mark-seen': (notificationId: string) => void;
  'notification:subscribe-role': (role: string) => void;
  'notification:unsubscribe-role': (role: string) => void;
  'notification:mark-read': (id: string) => void;
  'notification:mark-all-read': () => void;
  'shuttle:track': (shuttleId: string) => void;
  'route:subscribe': (routeId: string) => void;
  'client:ready': () => void;
}

class SocketManager {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private static instance: SocketManager;

  private constructor() {}

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  connect() {
    if (this.socket?.connected) {
      log('Reusing existing connection');
      return this.socket;
    }

    log('Creating new socket connection');
  const base = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:3001');
  this.socket = io(base, {
      withCredentials: true,
      // Prefer WebSocket to avoid polling overhead in dev
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 10000,
      autoConnect: true
    });

    this.setupConnectionListeners();
    return this.socket;
  }

  private setupConnectionListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      log('Socket connected');
      this.socket?.emit('client:ready'); // Tell server we're ready for notifications
    });

    this.socket.io.on('reconnect_attempt', () => {
      log('Attempting to reconnect...');
    });

    this.socket.io.on('reconnect_failed', () => {
      log('Reconnection failed');
    });

    this.socket.on('connect_error', (error: Error) => {
      log('Socket error:', error.message);
    });

    this.socket.on('disconnect', (reason: Socket.DisconnectReason) => {
      console.log('Disconnected from shuttle management system:', reason);
    });

    // Add debug event listener for all incoming events
    if (DEBUG) {
      this.socket.onAny((event: string, ...args: unknown[]) => {
        log('Received event:', event, 'with data:', args);
        if (event === 'notification' || event === 'notification:new') {
          try {
            log('Notification data:', JSON.stringify(args[0], null, 2));
          } catch {
            // ignore stringify errors
          }
        }
      });
    }
  }

  // Notification methods
  onNewNotification(callback: (notification: ShuttleNotification) => void) {
    log('Setting up notification listeners');
    const wrappedCallback = (notification: ShuttleNotification) => {
      log('New notification received:', notification);
      callback(notification);
    };
    
    // Listen for both event names
    this.socket?.on('notification:new', wrappedCallback);
    this.socket?.on('notification', wrappedCallback);
    
    return () => {
      log('Removing notification listeners');
      this.socket?.off('notification:new', wrappedCallback);
      this.socket?.off('notification', wrappedCallback);
    };
  }

  onNotificationUpdate(callback: (update: Partial<ShuttleNotification> & { id: string }) => void) {
    this.socket?.on('notification:update', callback);
    return () => this.socket?.off('notification:update', callback);
  }

  onNotificationSeen(callback: (data: { notificationId: string; userId: string; userName: string }) => void) {
    this.socket?.on('notification:seen', callback);
    return () => this.socket?.off('notification:seen', callback);
  }

  onNotificationStatusChange(callback: (data: { notificationId: string; status: ShuttleNotification['status'] }) => void) {
    this.socket?.on('notification:status', callback);
    return () => this.socket?.off('notification:status', callback);
  }

  markNotificationAsRead(notificationId: string) {
    this.socket?.emit('notification:mark-read', notificationId);
  }

  markAllNotificationsAsRead() {
    this.socket?.emit('notification:mark-all-read');
  }

  markNotificationSeen(notificationId: string) {
    this.socket?.emit('notification:mark-seen', notificationId);
  }

  subscribeToRole(role: string) {
    log('Subscribing to role:', role);
    this.socket?.emit('notification:subscribe-role', role);
  }

  unsubscribeFromRole(role: string) {
    this.socket?.emit('notification:unsubscribe-role', role);
  }

  // Shuttle tracking methods
  startTrackingShuttle(shuttleId: string) {
    this.socket?.emit('shuttle:track', shuttleId);
  }

  onShuttleLocationUpdate(callback: (data: { shuttleId: string; lat: number; lng: number }) => void) {
    this.socket?.on('shuttle:location', callback);
    return () => this.socket?.off('shuttle:location', callback);
  }

  // Route monitoring methods
  subscribeToRoute(routeId: string) {
    this.socket?.emit('route:subscribe', routeId);
  }

  onRouteUpdate(callback: (data: { routeId: string; status: string }) => void) {
    this.socket?.on('route:update', callback);
    return () => this.socket?.off('route:update', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }
}

// Export singleton instance
export const socketClient = SocketManager.getInstance();

// Update event constants
export const SocketEvents = {
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_SEEN: 'notification:seen',
  NOTIFICATION_STATUS: 'notification:status',
  NOTIFICATION_SUBSCRIBE_ROLE: 'notification:subscribe-role',
  NOTIFICATION_UNSUBSCRIBE_ROLE: 'notification:unsubscribe-role',
  SHUTTLE_LOCATION: 'shuttle:location',
  ROUTE_UPDATE: 'route:update'
} as const;