"use client";

import { useState, useEffect } from "react";
import { Bell, ChevronLeft, ChevronRight, Route, Bus, Users, UserCog, AlertTriangle, FileText } from "lucide-react";
import { NotificationType } from "../types/notifications";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "./ui/date-range-picker";
import { Button } from "./ui/button";
import { NotificationFilters } from "./notification-filters";
import { NotificationList } from "./notification-list";
import { Card } from "./ui/card";
import { getImportanceLevel } from "../lib/importance-levels";
import { ExpandableTabs } from "./ui/expandable-tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { TooltipProvider } from "./ui/tooltip";
import "../styles/notifications.css";
import { cn } from "@/lib/utils";
import { notificationApi, ApiNotificationItem, ApiNotificationResponse } from "@/services/notificationApi";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";

type SortOption = "time" | "importance";

export function NotificationDashboard() {
  const { user } = useAuth();
  const { stats, refreshStats } = useNotifications();
  const [notifications, setNotifications] = useState<ApiNotificationItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, perPage: 10, currentPage: 1, totalPages: 1 });
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<"all" | "read" | "unread">("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortBy, setSortBy] = useState("time");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);

  // Handle date range change with logging
  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    console.log('Date range changed:', newDateRange);
    setDateRange(newDateRange);
    setCurrentPage(1); // Reset to first page when date filter changes
    setRefreshTrigger(prev => prev + 1); // Force refresh
  };

  // Map frontend type filter to backend notification type pattern
  const getBackendType = (frontendType: string): string => {
    switch (frontendType) {
      case "ROUTE":
        return "ROUTE";
      case "VEHICLE":
        return "VEHICLE";
      case "EMPLOYEE":
        return "EMPLOYEE";
      case "DRIVER":
        return "DRIVER";
      case "REQUEST":
        return "REQUEST";
      case "SYSTEM":
        return "SYSTEM";
      default:
        return frontendType;
    }
  };

  const _isNotificationSeen = (notification: ApiNotificationItem): boolean => {
    const userId = user && 'id' in user ? (user as unknown as { id: string }).id : undefined;
    if (!userId) return false;
    return notification.seenBy?.some(seen => seen.userId === userId) ?? false;
  };

  const isNotificationRead = (notification: ApiNotificationItem): boolean => {
    const userId = user && 'id' in user ? (user as unknown as { id: string }).id : undefined;
    if (!userId) return false;
    return notification.seenBy?.some(seen => seen.userId === userId && seen.readAt !== null) ?? false;
  };

  // Fetch notifications based on filters and pagination
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        let response: ApiNotificationResponse;
        const query = {
          page: currentPage,
          limit: pagination.perPage,
          type: typeFilter !== "all" ? getBackendType(typeFilter) : undefined,
          importance: (severityFilter !== "all" ? severityFilter : undefined) as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | undefined,
          fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
          toDate: dateRange?.to ? new Date(dateRange.to.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString() : undefined, // End of selected day
        };

        console.log('Fetching notifications with query:', query);

        if (sortBy === "importance") {
          // Use sorted-by-importance endpoint when the sort option is set to "importance"
          response = await notificationApi.getSortedByImportance(query);
        } else if (readFilter === "unread") {
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
  }, [currentPage, pagination.perPage, typeFilter, severityFilter, dateRange, readFilter, sortBy, refreshTrigger]);

  // Fetch stats when filters change
  useEffect(() => {
    refreshStats({
      type: typeFilter !== "all" ? getBackendType(typeFilter) : undefined,
      importance: severityFilter !== "all" ? severityFilter : undefined,
      fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
      toDate: dateRange?.to ? new Date(dateRange.to.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString() : undefined, // End of selected day
    });
  }, [typeFilter, severityFilter, dateRange, refreshStats]);

  // Listen for external notification updates (from nav dropdown)
  useEffect(() => {
    const handleNotificationUpdate = () => {
      setRefreshTrigger(prev => prev + 1);
      refreshStats({
        type: typeFilter !== "all" ? getBackendType(typeFilter) : undefined,
        importance: severityFilter !== "all" ? severityFilter : undefined,
        fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
        toDate: dateRange?.to ? new Date(dateRange.to.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString() : undefined, // End of selected day
      });
    };

    window.addEventListener('notification-updated', handleNotificationUpdate);
    return () => {
      window.removeEventListener('notification-updated', handleNotificationUpdate);
    };
  }, [refreshStats, typeFilter, severityFilter, dateRange]);

  // Map importance string to a numeric level (handles both backend ENUM and frontend labels)
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
      const query = { page: currentPage, limit: pagination.perPage };
      const response: ApiNotificationResponse = await notificationApi.getAll(query);
      setNotifications(response.notifications);
      setSelectedIds([]);
      await refreshStats();
      // Emit event to update nav dropdown
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const handleMarkUnread = async () => {
    try {
      // Mark each selected notification as unread
      for (const id of selectedIds) {
        await notificationApi.markAsUnread(id);
      }
      // Refresh the notifications list
      const query = {
        page: currentPage,
        limit: pagination.perPage,
        type: typeFilter !== "all" ? getBackendType(typeFilter) : undefined,
        fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
        toDate: dateRange?.to ? new Date(dateRange.to.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString() : undefined, // End of selected day
      };
      const response: ApiNotificationResponse = await notificationApi.getAll(query);
      setNotifications(response.notifications);
      setSelectedIds([]);
      // Refresh stats to update read/unread counts
      await refreshStats();
      // Emit event to update nav dropdown
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
          type: typeFilter !== "all" ? getBackendType(typeFilter) : undefined,
          importance: (severityFilter !== "all" ? severityFilter : undefined) as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | undefined,
          fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
          toDate: dateRange?.to ? new Date(dateRange.to.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString() : undefined, // End of selected day
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
    setCurrentPage(1); // Reset current page to 1 when changing the filter
  };

  const tabs = [
    { title: "All Notifications", icon: Bell },
    { title: "Routes", icon: Route },
    { title: "Vehicles", icon: Bus },
    { title: "Employees", icon: Users },
    { type: "separator" as const },
    { title: "Drivers", icon: UserCog },
    { title: "Requests", icon: FileText },
    { title: "System", icon: AlertTriangle },
  ];

  const handleTabChange = (index: number | null) => {
    setSelectedTab(index ?? 0);
    const tabTypes: Record<number, string> = {
      0: "all",
      1: "ROUTE",
      2: "VEHICLE",
      3: "EMPLOYEE",
      5: "DRIVER",
      6: "REQUEST",
      7: "SYSTEM",
    };
    const selectedType = tabTypes[index ?? 0] || "all";
    setTypeFilter(selectedType);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    console.log(`Navigating to page ${newPage}`);
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="notifications-page p-6 min-h-screen flex justify-center">
      <Card className={cn("dashboard-notification-card p-6 rounded-xl border", "!w-[85%]")} style={{ width: '75%' }}>
        <div className="space-y-6">
          <div className="flex justify-between items-center gap-4">
            <h2 className="gradient-text-header text-2xl font-semibold">
              Notifications
            </h2>
            <div className="flex items-center gap-4">
              <ExpandableTabs 
                tabs={tabs} 
                activeColor="text-white"
                className="border-[#e2e8f0] dark:border-[#334155]"
                onChange={handleTabChange}
                initialTab={selectedTab}
              />
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-[140px] text-foreground">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">Sort by Time</SelectItem>
                  <SelectItem value="importance">Sort by Importance</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="CRITICAL">🔴 Critical</SelectItem>
                  <SelectItem value="HIGH">🟠 High</SelectItem>
                  <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                  <SelectItem value="LOW">🔵 Low</SelectItem>
                </SelectContent>
              </Select>
              <TooltipProvider>
                <DateRangePicker date={dateRange} onDateChange={handleDateRangeChange} className="w-[300px]" />
              </TooltipProvider>
            </div>
          </div>
          <div className="list-container rounded-lg overflow-hidden border">
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
            <div className="list-content p-4">
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
                <div className="text-center py-12 text-gray-500">
                  No notifications found matching your filters
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between px-4">
            <div className="text-sm text-muted">
              Showing {((currentPage - 1) * pagination.perPage) + 1} to{" "}
              {Math.min(currentPage * pagination.perPage, pagination.total)} of{" "}
              {pagination.total}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="nav-button hover:bg-[#3b82f6]/10 hover:text-[#3b82f6]"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {pagination.totalPages <= 7 ? (
                Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className={
                      currentPage === page
                        ? "bg-[#3b82f6] text-black dark:text-white hover:bg-[#2563eb] border-2 border-black dark:border-white"
                        : "hover:bg-[#3b82f6]/10 hover:text-[#3b82f6]"
                    }
                  >
                    {page}
                  </Button>
                ))
              ) : (
                <>
                  <Button
                    variant={currentPage === 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    className={
                      currentPage === 1
                        ? "bg-[#3b82f6] text-white hover:bg-[#2563eb] border-2 border-blue-700"
                        : "hover:bg-[#3b82f6]/10 hover:text-[#3b82f6]"
                    }
                  >
                    1
                  </Button>
      
                  {currentPage > 3 && <span className="px-2">...</span>}
      
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      if (currentPage <= 3) {
                        return page > 1 && page < 5;
                      } else if (currentPage >= pagination.totalPages - 2) {
                        return page > pagination.totalPages - 4 && page < pagination.totalPages;
                      } else {
                        return Math.abs(page - currentPage) <= 1;
                      }
                    })
                    .map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={
                          currentPage === page
                            ? "bg-[#3b82f6] text-black dark:text-white hover:bg-[#2563eb] border-2 border-black dark:border-white"
                            : "hover:bg-[#3b82f6]/10 hover:text-[#3b82f6]"
                        }
                      >
                        {page}
                      </Button>
                    ))
                  }
      
                  {currentPage < pagination.totalPages - 2 && <span className="px-2">...</span>}
      
                  {pagination.totalPages > 1 && (
                    <Button
                      variant={currentPage === pagination.totalPages ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pagination.totalPages)}
                      className={
                        currentPage === pagination.totalPages
                          ? "bg-[#3b82f6] text-white hover:bg-[#2563eb] border-2 border-blue-700"
                          : "hover:bg-[#3b82f6]/10 hover:text-[#3b82f6]"
                      }
                    >
                      {pagination.totalPages}
                    </Button>
                  )}
                </>
              )}
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages || pagination.totalPages === 0}
                className="nav-button hover:bg-[#3b82f6]/10 hover:text-[#3b82f6]"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
