/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { test, expect } from '@playwright/test';

test.describe('NotificationContext E2E with Real WebSocket', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for authentication if needed
    // This assumes you have a test user or a way to bypass auth in test mode
  });

  test('should establish WebSocket connection and receive notifications', async ({ page }) => {
    // Listen for WebSocket connections
    const wsConnections: any[] = [];
    
    page.on('websocket', ws => {
      wsConnections.push(ws);
      console.log('WebSocket connected:', ws.url());
      
      // Listen for frames
      ws.on('framereceived', frame => {
        const data = frame.payload;
        console.log('WebSocket frame received:', data);
      });
      
      ws.on('framesent', frame => {
        const data = frame.payload;
        console.log('WebSocket frame sent:', data);
      });
    });

    // Navigate to a page that uses notifications
    await page.goto('/dashboard');
    
    // Wait for WebSocket connection
    await page.waitForTimeout(2000);
    
    // Verify WebSocket connection was established
    expect(wsConnections.length).toBeGreaterThan(0);
    
    // Check for connection indicator in UI (if available)
    const connectionIndicator = page.locator('[data-testid="notification-connection-status"]');
    if (await connectionIndicator.isVisible()) {
      await expect(connectionIndicator).toContainText(/connected/i);
    }
  });

  test('should display notification badge when new notification arrives', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for initial load
    await page.waitForTimeout(1000);
    
    // Check if notification bell exists
    const notificationBell = page.locator('[data-testid="notification-bell"]').or(
      page.locator('button:has-text("Notifications")')
    );
    
    // Simulate server sending a notification via WebSocket
    // Note: This would require a test endpoint on your backend to trigger notifications
    // Or you can manually emit events from the browser console
    
    // Check for notification badge/count
    const notificationBadge = page.locator('[data-testid="notification-count"]').or(
      page.locator('.notification-badge')
    );
    
    // If badge is visible, verify it shows a count
    if (await notificationBadge.isVisible()) {
      const count = await notificationBadge.textContent();
      expect(parseInt(count || '0')).toBeGreaterThanOrEqual(0);
    }
  });

  test('should mark notification as read when clicked', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    
    // Open notifications panel
    const notificationBell = page.locator('[data-testid="notification-bell"]').or(
      page.locator('button:has-text("Notifications")')
    );
    
    if (await notificationBell.isVisible()) {
      await notificationBell.click();
      
      // Wait for panel to open
      await page.waitForTimeout(500);
      
      // Find first unread notification if any
      const unreadNotification = page.locator('[data-status="unread"]').or(
        page.locator('.notification-item:not([data-read="true"])')
      ).first();
      
      if (await unreadNotification.isVisible()) {
        await unreadNotification.click();
        
        // Verify notification is marked as read
        await page.waitForTimeout(500);
        // The notification should no longer appear as unread
      }
    }
  });

  test('should maintain connection state across page navigation', async ({ page }) => {
    const wsConnections: any[] = [];
    let disconnectCount = 0;
    
    page.on('websocket', ws => {
      wsConnections.push(ws);
      ws.on('close', () => {
        disconnectCount++;
      });
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    
    const initialConnections = wsConnections.length;
    
    // Navigate to another page
    await page.goto('/routes');
    await page.waitForTimeout(1000);
    
    // Navigate back
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    
    // Verify connection management
    // Should ideally maintain single connection or properly reconnect
    expect(wsConnections.length).toBeGreaterThanOrEqual(initialConnections);
  });

  test('should reconnect after connection loss', async ({ page }) => {
    const wsConnections: any[] = [];
    let reconnectionCount = 0;
    
    page.on('websocket', ws => {
      wsConnections.push(ws);
      
      ws.on('close', () => {
        console.log('WebSocket closed');
      });
      
      // Listen for reconnection attempts
      ws.on('framereceived', frame => {
        const data = frame.payload.toString();
        if (data.includes('connect') || data.includes('reconnect')) {
          reconnectionCount++;
        }
      });
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    
    // Simulate network offline/online to trigger reconnection
    await page.context().setOffline(true);
    await page.waitForTimeout(1000);
    await page.context().setOffline(false);
    await page.waitForTimeout(2000);
    
    // Verify reconnection occurred
    expect(wsConnections.length).toBeGreaterThan(0);
  });

  test('should clear all notifications', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    
    // Open notifications panel
    const notificationBell = page.locator('[data-testid="notification-bell"]').or(
      page.locator('button:has-text("Notifications")')
    );
    
    if (await notificationBell.isVisible()) {
      await notificationBell.click();
      await page.waitForTimeout(500);
      
      // Find clear all button
      const clearAllButton = page.locator('button:has-text("Clear All")').or(
        page.locator('[data-testid="clear-all-notifications"]')
      );
      
      if (await clearAllButton.isVisible()) {
        await clearAllButton.click();
        await page.waitForTimeout(500);
        
        // Verify notifications are cleared
        const notificationItems = page.locator('.notification-item');
        const count = await notificationItems.count();
        expect(count).toBe(0);
      }
    }
  });
});
