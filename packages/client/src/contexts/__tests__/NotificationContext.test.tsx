import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { NotificationProvider, useNotifications } from '../NotificationContext';

// Mock dependencies
jest.mock('@lib/socket', () => ({
  socketClient: {
    connect: jest.fn(() => ({
      connected: true,
      id: 'mock-socket',
      on: jest.fn((event, callback) => {
        if (event === 'connect') setTimeout(() => callback(), 0);
        return { connected: true, on: jest.fn(), off: jest.fn(), emit: jest.fn(), disconnect: jest.fn() };
      }),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      io: {
        on: jest.fn(), // For reconnect event
        off: jest.fn(),
      },
    })),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    subscribeToRole: jest.fn(),
    unsubscribeFromRole: jest.fn(),
    disconnect: jest.fn(),
    markNotificationSeen: jest.fn(),
    onNewNotification: jest.fn(() => jest.fn()), // Returns unsubscribe function
    onNotificationSeen: jest.fn(() => jest.fn()), // Returns unsubscribe function
  },
}));

jest.mock('@contexts/RoleContext', () => ({
  useRole: jest.fn(() => ({ role: 'admin' })),
}));

jest.mock('@contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({ 
    isAuthenticated: true,
    user: { id: 'user1', email: 'test@example.com' }
  })),
}));

jest.mock('@contexts/OrganizationContext', () => ({
  useOrganization: jest.fn(() => ({
    activeOrganization: { id: 'org1', name: 'Test Org' },
    isLoading: false,
  })),
}));

jest.mock('@services/notificationApi', () => ({
  notificationApi: {
    getAll: jest.fn().mockResolvedValue({ notifications: [] }),
    getUnseenCount: jest.fn().mockResolvedValue(0),
    markAsSeen: jest.fn().mockResolvedValue({}),
    markAllAsSeen: jest.fn().mockResolvedValue({}),
  },
}));

// Test component
function TestComponent() {
  const { notifications, unreadCount, markAsSeen, clearAll } = useNotifications();
  
  return (
    <div>
      <div data-testid="notification-count">{notifications.length}</div>
      <div data-testid="unread-count">{unreadCount}</div>
      <button onClick={() => markAsSeen('1')}>Mark as seen</button>
      <button onClick={clearAll}>Clear all</button>
    </div>
  );
}

describe('NotificationContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should provide default notification context', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    expect(screen.getByTestId('notification-count')).toHaveTextContent('0');
    expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
  });

  it('should load notifications from localStorage', () => {
    const mockNotifications = [
      { id: '1', type: 'shuttle_assigned', message: 'Test notification', seen: false }
    ];
    localStorage.setItem('shuttle_notifications:user1:org1', JSON.stringify(mockNotifications));

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
  });

  it('should mark notification as seen', async () => {
    const user = userEvent.setup();
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const markButton = screen.getByText('Mark as seen');
    await user.click(markButton);

    await waitFor(() => {
      expect(screen.getByTestId('unread-count')).toBeInTheDocument();
    });
  });

  it('should clear all notifications', async () => {
    const user = userEvent.setup();
    const mockNotifications = [
      { id: '1', type: 'shuttle_assigned', message: 'Test 1', seen: false },
      { id: '2', type: 'route_updated', message: 'Test 2', seen: false }
    ];
    localStorage.setItem('shuttle_notifications:user1:org1', JSON.stringify(mockNotifications));

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const clearButton = screen.getByText('Clear all');
    await user.click(clearButton);

    await waitFor(() => {
      expect(screen.getByTestId('notification-count')).toHaveTextContent('0');
    });
  });
});
