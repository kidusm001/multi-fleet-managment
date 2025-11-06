/**
 * Embeddable Notification Panel Component
 * Can be embedded in driver portal or other pages
 * Displays notifications in a compact, reusable format
 */

import { useState, useEffect } from "react";
import { NotificationType } from "../types/notifications";
import { NotificationFilters } from "./notification-filters";
import { NotificationList } from "./notification-list";
import { getImportanceLevel } from "../lib/importance-levels";
import { cn } from "@/lib/utils";
import { notificationApi, ApiNotificationItem, ApiNotificationResponse } from "@/services/notificationApi";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";

interface NotificationPanelProps {
  /** Optional custom class name */
  className?: string;
  /** Show filters toolbar */
  showFilters?: boolean;
  /** Show pagination */
  showPagination?: boolean;
  /** Items per page */
  itemsPerPage?: number;
  /** Default filter */
  defaultFilter?: "all" | "read" | "unread";
  /** Compact mode for smaller displays */
  compact?: boolean;
}

export function NotificationPanel({
  className,
  showFilters = true,
  showPagination = false,
  itemsPerPage = 10,
  defaultFilter = "all",
  compact = false,
}: NotificationPanelProps) {
  const { user } = useAuth();
  const { stats, refreshStats } = useNotifications();
  const [notifications, setNotifications] = useState<ApiNotificationItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, perPage: itemsPerPage, currentPage: 1, totalPages: 1 });
  const [readFilter, setReadFilter] = useState<"all" | "read" | "unread">(defaultFilter);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isNotificationRead = (notification: ApiNotificationItem): boolean => {
    const userId = user && 'id' in user ? (user as unknown as { id: string }).id : undefined;
    if (!userId) return false;
    return notification.seenBy?.some(seen => seen.userId === userId && seen.readAt !== null) ?? false;
  };

  // Map importance string to a numeric level
  const mapImportance = (importanceStr: string) => {
    const importance = importanceStr.toUpperCase();
    switch (importance) {
      case "CRITICAL":
      case "URGENT": return 5;
      case "HIGH": return 4;
      case "MEDIUM": return 3;
      case "LOW": return 2;
      default: return 1;
    }
  };

  // Map fromRole to user-friendly source label
  const getSourceLabel = (fromRole: string): string => {
    switch (fromRole?.toLowerCase()) {
      case "admin":
      case "administrator":
        return "Admin";
      case "manager":
      case "shuttle_manager":
      case "fleetmanager":
        return "Fleet Manager";
      case "system":
      default:
        return "System";
    }
  };

  // Fetch notifications based on filters
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        let response: ApiNotificationResponse;
        const query = {
          page: currentPage,
          limit: itemsPerPage,
        };

        if (readFilter === "unread") {
          response = await notificationApi.getUnread(query);
        } else if (readFilter === "read") {
          response = await notificationApi.getRead(query);
        } else {
          response = await notificationApi.getAll(query);
        }

        setNotifications(response.notifications);
        setPagination({
          total: response.pagination.total,
          totalPages: response.pagination.pages,
          perPage: response.pagination.perPage,
          currentPage: currentPage,
        });
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentPage, itemsPerPage, readFilter, refreshTrigger]);

  // Listen for external notification updates (including socket events from NotificationContext)
  useEffect(() => {
    const handleNotificationUpdate = () => {
      console.log('[NotificationPanel] Notification update event received, refreshing...');
      setRefreshTrigger(prev => prev + 1);
      refreshStats();
    };

    // Listen to both custom events and the notification context updates
    window.addEventListener('notification-updated', handleNotificationUpdate);
    
    // Also trigger refresh when NotificationContext gets new notifications via socket
    const handleNewNotification = () => {
      console.log('[NotificationPanel] New notification received via socket, refreshing...');
      setRefreshTrigger(prev => prev + 1);
      refreshStats();
    };
    
    window.addEventListener('new-notification', handleNewNotification);
    
    return () => {
      window.removeEventListener('notification-updated', handleNotificationUpdate);
      window.removeEventListener('new-notification', handleNewNotification);
    };
  }, [refreshStats]);

  // Transform API notifications for UI consumption
  const transformedNotifications = notifications.map(notification => ({
    id: notification.id,
    type: notification.notificationType as NotificationType,
    title: notification.subject,
    description: notification.message,
    timestamp: new Date(notification.createdAt),
    importance: getImportanceLevel(mapImportance(notification.importance)),
    source: getSourceLabel(notification.fromRole),
    isRead: isNotificationRead(notification),
    metadata: {
      relatedEntityId: notification.relatedEntityId,
    }
  }));

  const handleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleMarkRead = async () => {
    try {
      for (const id of selectedIds) {
        await notificationApi.markAsRead(id);
      }
      setRefreshTrigger(prev => prev + 1);
      setSelectedIds([]);
      await refreshStats();
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const handleMarkUnread = async () => {
    try {
      for (const id of selectedIds) {
        await notificationApi.markAsUnread(id);
      }
      setRefreshTrigger(prev => prev + 1);
      setSelectedIds([]);
      await refreshStats();
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (error) {
      console.error("Failed to mark notifications as unread:", error);
    }
  };

  const handleSelectAllToggle = async () => {
    if (selectedIds.length === pagination.total && pagination.total > 0) {
      setSelectedIds([]);
    } else {
      try {
        let response: ApiNotificationResponse;
        const query = {
          page: 1,
          limit: pagination.total,
        };
        
        if (readFilter === "read") {
          response = await notificationApi.getRead(query);
        } else if (readFilter === "unread") {
          response = await notificationApi.getUnread(query);
        } else {
          response = await notificationApi.getAll(query);
        }
        const allIds = response.notifications.map(n => n.id);
        setSelectedIds(allIds);
      } catch (error) {
        console.error("Failed to select all notifications:", error);
      }
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleReadFilterChange = (newFilter: string) => {
    setReadFilter(newFilter as "all" | "read" | "unread");
    setCurrentPage(1);
  };

  return (
    <div className={cn("notification-panel", compact && "notification-panel-compact", className)}>
      {showFilters && (
        <NotificationFilters
          total={readFilter === "all" ? stats.total : pagination.total}
          read={readFilter === "read" ? pagination.total : stats.read}
          unread={readFilter === "unread" ? pagination.total : stats.unread}
          currentFilter={readFilter}
          onFilterChange={handleReadFilterChange}
          onMarkRead={handleMarkRead}
          onMarkUnread={handleMarkUnread}
          onSelectAll={handleSelectAllToggle}
          onClearSelection={handleClearSelection}
          selectedCount={selectedIds.length}
        />
      )}
      
      <div className={cn("notification-panel-content", compact ? "p-2" : "p-4")}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : transformedNotifications.length > 0 ? (
          <NotificationList
            notifications={transformedNotifications}
            selectedIds={selectedIds}
            onSelect={handleSelect}
          />
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No notifications found
          </div>
        )}
      </div>

      {showPagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((currentPage - 1) * pagination.perPage) + 1} to{" "}
            {Math.min(currentPage * pagination.perPage, pagination.total)} of{" "}
            {pagination.total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border dark:border-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">{currentPage} / {pagination.totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              disabled={currentPage === pagination.totalPages}
              className="px-3 py-1 rounded border dark:border-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
