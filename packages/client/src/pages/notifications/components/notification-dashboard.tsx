"use client";

import { useState, useEffect } from "react";
import { Bell, ChevronLeft, ChevronRight, Route, Bus } from "lucide-react";
import { UserRole, NotificationSource, NotificationType } from "../types/notifications";
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
import { notificationApi } from "@/services/notificationApi";

type SortOption = "time" | "importance";

interface ApiNotificationItem {
  id: string;
  toRoles: string[];
  fromRole: string;
  notificationType: string;
  subject: string;
  message: string;
  importance: string;
  createdAt: string;
  localTime: string;
  relatedEntityId: string;
  status: string;
  seenBy: { id: string }[];
}

interface ApiNotificationResponse {
  notifications: ApiNotificationItem[];
  pagination: {
    total: number;
    pages: number;
    perPage: number;
  };
}

interface NotificationDashboardProps {
  userRole?: UserRole;
}

export function NotificationDashboard({ userRole: _userRole = "admin" }: NotificationDashboardProps) {
  const [readFilter, setReadFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("time");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<ApiNotificationItem[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    perPage: 10,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    read: 0,
    unread: 0,
  });

  // Helper function to check if notification is read
  const isNotificationSeen = (notification: ApiNotificationItem): boolean => {
    // For now, assume any item in seenBy means it's read
    return notification.seenBy.length > 0;
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
          type: typeFilter !== "all" ? typeFilter : undefined,
          fromDate: dateRange?.from,
          toDate: dateRange?.to,
        };

        if (sortBy === "importance") {
          // Use sorted-by-importance endpoint when the sort option is set to "importance"
          response = await notificationApi.getSortedByImportance(query);
        } else if (readFilter === "unread") {
          response = await notificationApi.getUnread(currentPage, pagination.perPage);
        } else if (readFilter === "read") {
          response = await notificationApi.getRead(currentPage, pagination.perPage);
        } else if (typeFilter !== "all") {
          response = await notificationApi.getByType(typeFilter, currentPage, pagination.perPage);
        } else {
          response = await notificationApi.getAll(query);
        }

        setNotifications(response.notifications);
        setPagination({
          total: response.pagination.total,
          pages: response.pagination.pages,
          perPage: response.pagination.perPage,
        });
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentPage, pagination.perPage, typeFilter, dateRange, readFilter, sortBy]);

  // Define a reusable function for fetching stats to update counts
  const fetchStats = async () => {
    try {
      const allQuery = { page: 1, limit: 1 };
      const allResponse = await notificationApi.getAll(allQuery);
      const unreadResponse = await notificationApi.getUnread(1, 1);
      const total = allResponse.pagination.total;
      const unread = unreadResponse.pagination.total;
      setStats({
        total,
        unread,
        read: total - unread,
      });
    } catch (error) {
      console.error("Failed to fetch notification stats:", error);
    }
  };

  // Fetch stats (overall counts) when typeFilter or dateRange change
  useEffect(() => {
    fetchStats();
  }, [typeFilter, dateRange]);

  // Mount/unmount debug only (reload hack removed after routing refactor)
  useEffect(() => {
    return () => {};
  }, []);

  // Map importance string to a numeric level
  const mapImportance = (importanceStr: string) => {
    switch (importanceStr) {
      case "Urgent": return 5;
      case "High": return 4;
      case "Medium": return 3;
      case "Low": return 2;
      default: return 1;
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
    source: notification.fromRole as NotificationSource,
    isRead: isNotificationSeen(notification),
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
        await notificationApi.markAsSeen(id);
      }
      const query = { page: currentPage, limit: pagination.perPage };
      const response: ApiNotificationResponse = await notificationApi.getAll(query);
      setNotifications(response.notifications);
      setSelectedIds([]);
      // Update stats after marking as read
      const markedCount = selectedIds.filter(id => notifications.find(n => n.id === id && !isNotificationSeen(n))).length;
      setStats(prev => ({
        ...prev,
        read: prev.read + markedCount,
        unread: prev.unread - markedCount,
      }));
    } catch (error) {
      console.error("Failed to mark notifications as seen:", error);
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
        type: typeFilter !== "all" ? typeFilter : undefined,
        fromDate: dateRange?.from,
        toDate: dateRange?.to,
      };
      const response: ApiNotificationResponse = await notificationApi.getAll(query);
      setNotifications(response.notifications);
      setSelectedIds([]);
      // Refresh stats to update read/unread counts
      await fetchStats();
    } catch (error) {
      console.error("Failed to mark notifications as unread:", error);
    }
  };

  const handleSelectAllToggle = async () => {
    if (selectedIds.length === stats.total && stats.total > 0) {
      setSelectedIds([]);
    } else {
      try {
        let response: ApiNotificationResponse;
        if (readFilter === "read") {
          response = await notificationApi.getRead(1, stats.total);
        } else if (readFilter === "unread") {
          response = await notificationApi.getUnread(1, stats.total);
        } else if (typeFilter !== "all") {
          response = await notificationApi.getByType(typeFilter, 1, stats.total);
        } else {
          const query = {
            page: 1,
            limit: stats.total,
            type: typeFilter !== "all" ? typeFilter : undefined,
            importance: undefined,
            fromDate: dateRange?.from,
            toDate: dateRange?.to,
          };
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
    setReadFilter(newFilter);
    setCurrentPage(1); // Reset current page to 1 when changing the filter
  };

  const tabs = [
    { title: "All Notifications", icon: Bell },
    { title: "Routes", icon: Route },
    { type: "separator" as const },
    { title: "Shuttles", icon: Bus },
  ];

  const handleTabChange = (index: number | null) => {
    setSelectedTab(index ?? 0);
    const tabTypes: Record<number, string> = {
      0: "all",
      1: "route",
      3: "shuttle",
    };
    setTypeFilter(tabTypes[index ?? 0] || "all");
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    console.log(`Navigating to page ${newPage}`);
    if (newPage >= 1 && newPage <= pagination.pages) {
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
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">Sort by Time</SelectItem>
                  <SelectItem value="importance">Sort by Importance</SelectItem>
                </SelectContent>
              </Select>
              <TooltipProvider>
                <DateRangePicker date={dateRange} onDateChange={setDateRange} className="w-[300px]" />
              </TooltipProvider>
            </div>
          </div>
          <div className="list-container rounded-lg overflow-hidden border">
            <NotificationFilters
              {...stats}
              currentFilter={readFilter}
              onFilterChange={handleReadFilterChange}
              onMarkRead={handleMarkRead}
              onMarkUnread={handleMarkUnread} // now calling the updated function
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
              
              {pagination.pages <= 7 ? (
                Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
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
      
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter(page => {
                      if (currentPage <= 3) {
                        return page > 1 && page < 5;
                      } else if (currentPage >= pagination.pages - 2) {
                        return page > pagination.pages - 4 && page < pagination.pages;
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
      
                  {currentPage < pagination.pages - 2 && <span className="px-2">...</span>}
      
                  {pagination.pages > 1 && (
                    <Button
                      variant={currentPage === pagination.pages ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pagination.pages)}
                      className={
                        currentPage === pagination.pages
                          ? "bg-[#3b82f6] text-white hover:bg-[#2563eb] border-2 border-blue-700"
                          : "hover:bg-[#3b82f6]/10 hover:text-[#3b82f6]"
                      }
                    >
                      {pagination.pages}
                    </Button>
                  )}
                </>
              )}
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.pages || pagination.pages === 0}
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
