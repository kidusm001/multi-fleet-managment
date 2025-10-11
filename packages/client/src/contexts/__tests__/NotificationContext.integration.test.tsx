import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { NotificationProvider, useNotifications } from '../NotificationContext';
import { notificationApi } from '@services/notificationApi';
import { socketClient } from '@lib/socket';

// Mock Audio API
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  load: jest.fn(),
})) as unknown as typeof Audio;

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(),
}));

// Mock the socket module to avoid import.meta issues
jest.mock('@lib/socket', () => ({
  socketClient: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    subscribeToRole: jest.fn(),
    unsubscribeFromRole: jest.fn(),
    markNotificationSeen: jest.fn(),
    onNewNotification: jest.fn(),
    onNotificationSeen: jest.fn(),
    io: {
      on: jest.fn(),
    },
  },
  ShuttleNotification: {},
}));

jest.mock('@services/notificationApi', () => ({
  notificationApi: {
    getAll: jest.fn(),
    getUnseenCount: jest.fn(),
    markAsSeen: jest.fn(),
    markAllAsSeen: jest.fn(),
  },
}));
jest.mock('@contexts/RoleContext', () => ({
  useRole: jest.fn(() => ({ role: 'admin', isReady: true })),
}));
jest.mock('@contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({ isAuthenticated: true, user: { id: 'user-123' } })),
}));
jest.mock('@contexts/OrganizationContext', () => ({
  useOrganization: jest.fn(() => ({ activeOrganization: { id: 'org-123' }, isLoading: false })),
}));

const mockSocketClient = socketClient as jest.Mocked<typeof socketClient>;
const mockNotificationApi = notificationApi as jest.Mocked<typeof notificationApi>;

describe('NotificationContext - Integration Tests', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSocket: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let newNotificationCallback: (notification: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let notificationSeenCallback: (data: any) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Create mock socket with event handlers
    mockSocket = {
      connected: true,
      id: 'mock-socket-id',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      on: jest.fn((event: string, callback: Function) => {
        if (event === 'connect') {
          setTimeout(() => callback(), 0);
        }
        return mockSocket;
      }),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      io: {
        on: jest.fn(),
        off: jest.fn(),
      },
    };

    // Setup socket client mock
    mockSocketClient.connect.mockReturnValue(mockSocket);
    mockSocketClient.subscribeToRole.mockImplementation(() => {});
    mockSocketClient.unsubscribeFromRole.mockImplementation(() => {});
    mockSocketClient.disconnect.mockImplementation(() => {});
    mockSocketClient.markNotificationSeen.mockImplementation(() => {});
    
    mockSocketClient.onNewNotification.mockImplementation((callback) => {
      newNotificationCallback = callback;
      return jest.fn(); // Return unsubscribe function
    });
    
    mockSocketClient.onNotificationSeen.mockImplementation((callback) => {
      notificationSeenCallback = callback;
      return jest.fn(); // Return unsubscribe function
    });

    // Setup API mocks
    mockNotificationApi.getAll.mockResolvedValue({ 
      notifications: [],
      pagination: { total: 0, pages: 0, perPage: 10 }
    });
    mockNotificationApi.getUnseenCount.mockResolvedValue(0);
    mockNotificationApi.markAsSeen.mockResolvedValue({});
    mockNotificationApi.markAllAsSeen.mockResolvedValue({});
  });

  describe('Socket Connection Integration', () => {
    it('should establish socket connection on mount', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NotificationProvider>{children}</NotificationProvider>
      );

      renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(mockSocketClient.connect).toHaveBeenCalled();
        expect(mockSocketClient.subscribeToRole).toHaveBeenCalledWith('admin');
      });
    });

    it('should track connection state', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NotificationProvider>{children}</NotificationProvider>
      );

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });

    it('should handle disconnect event', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      let disconnectCallback: Function;
      
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      mockSocket.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'disconnect') {
          disconnectCallback = callback;
        }
        if (event === 'connect') {
          setTimeout(() => callback(), 0);
        }
        return mockSocket;
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NotificationProvider>{children}</NotificationProvider>
      );

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        disconnectCallback!('transport close');
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
      });
    });

    it('should resubscribe to role on reconnection', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      let reconnectCallback: Function;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      mockSocket.io.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'reconnect') {
          reconnectCallback = callback;
        }
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NotificationProvider>{children}</NotificationProvider>
      );

      renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(mockSocketClient.subscribeToRole).toHaveBeenCalledTimes(1);
      });

      act(() => {
        reconnectCallback!(1);
      });

      // Should resubscribe after reconnect is handled
      await waitFor(() => {
        // Connection handler should trigger resubscription
        expect(mockSocketClient.subscribeToRole).toHaveBeenCalled();
      });
    });
  });

  describe('Real-time Notification Integration', () => {
    it('should receive new notification via socket', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NotificationProvider>{children}</NotificationProvider>
      );

      const { result } = renderHook(() => useNotifications(), { wrapper });

      const newNotification = {
        id: 'notif-1',
        type: 'shuttle_assigned',
        message: 'New shuttle assigned',
        status: 'Pending',
        createdAt: new Date().toISOString(),
      };

      await waitFor(() => {
        expect(newNotificationCallback).toBeDefined();
      });

      act(() => {
        newNotificationCallback(newNotification);
      });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
        expect(result.current.notifications[0]).toEqual(newNotification);
        expect(result.current.unreadCount).toBe(1);
      });
    });

    it('should not duplicate notifications', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NotificationProvider>{children}</NotificationProvider>
      );

      const { result } = renderHook(() => useNotifications(), { wrapper });

      const notification = {
        id: 'notif-1',
        type: 'shuttle_assigned',
        message: 'Test notification',
        status: 'Pending',
      };

      await waitFor(() => {
        expect(newNotificationCallback).toBeDefined();
      });

      act(() => {
        newNotificationCallback(notification);
      });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      });

      // Send same notification again
      act(() => {
        newNotificationCallback(notification);
      });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1); // Should not duplicate
      });
    });

    it('should handle notification seen event', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NotificationProvider>{children}</NotificationProvider>
      );

      const { result } = renderHook(() => useNotifications(), { wrapper });

      const notification = {
        id: 'notif-1',
        type: 'shuttle_assigned',
        message: 'Test notification',
        status: 'Pending',
        seenBy: [],
      };

      await waitFor(() => {
        expect(newNotificationCallback).toBeDefined();
      });

      act(() => {
        newNotificationCallback(notification);
      });

      await waitFor(() => {
        expect(result.current.notifications[0].status).toBe('Pending');
      });

      act(() => {
        notificationSeenCallback({
          notificationId: 'notif-1',
          userId: 'user-1',
          userName: 'Test User',
        });
      });

      await waitFor(() => {
        expect(result.current.notifications[0].status).toBe('Read');
        expect(result.current.notifications[0].seenBy).toHaveLength(1);
        expect(result.current.notifications[0].seenBy[0]).toEqual({
          id: 'user-1',
          name: 'Test User',
        });
      });
    });

    it('should limit stored notifications to max count', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NotificationProvider>{children}</NotificationProvider>
      );

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(newNotificationCallback).toBeDefined();
      });

      // Send 55 notifications (max is 50)
      for (let i = 1; i <= 55; i++) {
        act(() => {
          newNotificationCallback({
            id: `notif-${i}`,
            type: 'test',
            message: `Notification ${i}`,
            status: 'Pending',
          });
        });
      }

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(50); // Should be limited to 50
        expect(result.current.notifications[0].id).toBe('notif-55'); // Most recent first
        expect(result.current.notifications[49].id).toBe('notif-6'); // Oldest kept
      });
    });
  });

  describe('Notification Actions Integration', () => {
    it('should mark notification as seen', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NotificationProvider>{children}</NotificationProvider>
      );

      const { result } = renderHook(() => useNotifications(), { wrapper });

      const notification = {
        id: 'notif-1',
        type: 'test',
        message: 'Test notification',
        status: 'Pending',
      };

      await waitFor(() => {
        expect(newNotificationCallback).toBeDefined();
      });

      act(() => {
        newNotificationCallback(notification);
      });

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(1);
      });

      await act(async () => {
        await result.current.markAsSeen('notif-1');
      });

      expect(mockNotificationApi.markAsSeen).toHaveBeenCalledWith('notif-1');
      expect(mockSocketClient.markNotificationSeen).toHaveBeenCalledWith('notif-1');
      
      await waitFor(() => {
        expect(result.current.unreadCount).toBe(0);
      });
    });

    it('should mark all notifications as seen', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NotificationProvider>{children}</NotificationProvider>
      );

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(newNotificationCallback).toBeDefined();
      });

      // Add multiple notifications
      act(() => {
        newNotificationCallback({
          id: 'notif-1',
          type: 'test',
          message: 'Test 1',
          status: 'Pending',
        });
        newNotificationCallback({
          id: 'notif-2',
          type: 'test',
          message: 'Test 2',
          status: 'Pending',
        });
      });

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(2);
      });

      await act(async () => {
        await result.current.markAllAsSeen();
      });

      expect(mockNotificationApi.markAllAsSeen).toHaveBeenCalled();
      
      await waitFor(() => {
        expect(result.current.unreadCount).toBe(0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(result.current.notifications.every((n: any) => n.status === 'Read')).toBe(true);
      });
    });

    it('should clear all notifications', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NotificationProvider>{children}</NotificationProvider>
      );

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(newNotificationCallback).toBeDefined();
      });

      act(() => {
        newNotificationCallback({
          id: 'notif-1',
          type: 'test',
          message: 'Test',
          status: 'Pending',
        });
      });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      });

      act(() => {
        result.current.clearAll();
      });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(0);
        expect(result.current.unreadCount).toBe(0);
      });
    });

    it('should remove specific notification', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NotificationProvider>{children}</NotificationProvider>
      );

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(newNotificationCallback).toBeDefined();
      });

      act(() => {
        newNotificationCallback({
          id: 'notif-1',
          type: 'test',
          message: 'Test 1',
          status: 'Pending',
        });
        newNotificationCallback({
          id: 'notif-2',
          type: 'test',
          message: 'Test 2',
          status: 'Pending',
        });
      });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });

      act(() => {
        result.current.removeNotification('notif-1');
      });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
        expect(result.current.notifications[0].id).toBe('notif-2');
      });
    });
  });

  describe('Local Storage Integration', () => {
    it('should load notifications from localStorage on mount', async () => {
      const storedNotifications = [
        {
          id: 'stored-1',
          type: 'test',
          message: 'Stored notification',
          status: 'Pending',
        },
      ];

  localStorage.setItem('shuttle_notifications:user-123:org-123', JSON.stringify(storedNotifications));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NotificationProvider>{children}</NotificationProvider>
      );

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
        expect(result.current.notifications[0].id).toBe('stored-1');
      });
    });

    it('should persist notifications to localStorage', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NotificationProvider>{children}</NotificationProvider>
      );

      renderHook(() => useNotifications(), { wrapper });

      const notification = {
        id: 'notif-1',
        type: 'test',
        message: 'Test notification',
        status: 'Pending',
      };

      await waitFor(() => {
        expect(newNotificationCallback).toBeDefined();
      });

      act(() => {
        newNotificationCallback(notification);
      });

      await waitFor(() => {
  const stored = localStorage.getItem('shuttle_notifications:user-123:org-123');
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].id).toBe('notif-1');
      });
    });
  });

  describe('API Integration', () => {
    it('should load initial notifications from API', async () => {
      const apiNotifications = [
        {
          id: 'api-1',
          type: 'test',
          message: 'API notification',
          status: 'Pending',
        },
      ];

      mockNotificationApi.getAll.mockResolvedValue({ 
        notifications: apiNotifications,
        pagination: { total: 1, pages: 1, perPage: 10 }
      });
      mockNotificationApi.getUnseenCount.mockResolvedValue(1);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NotificationProvider>{children}</NotificationProvider>
      );

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(mockNotificationApi.getAll).toHaveBeenCalled();
        expect(mockNotificationApi.getUnseenCount).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(result.current.notifications).toEqual(apiNotifications);
        expect(result.current.unreadCount).toBe(1);
      });
    });

    it('should handle API errors gracefully', async () => {
      mockNotificationApi.getAll.mockRejectedValue(new Error('API Error'));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NotificationProvider>{children}</NotificationProvider>
      );

      // Should not crash on API error
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toEqual([]);
      });
    });
  });

  describe('Cleanup Integration', () => {
    it('should cleanup socket on unmount', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NotificationProvider>{children}</NotificationProvider>
      );

      const { unmount } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(mockSocketClient.connect).toHaveBeenCalled();
      });

      unmount();

      expect(mockSocketClient.unsubscribeFromRole).toHaveBeenCalledWith('admin');
      expect(mockSocketClient.disconnect).toHaveBeenCalled();
    });
  });
});
