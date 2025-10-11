import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';
import { NotificationFilters } from './notification-filters';
import { NotificationList } from './notification-list';
import { getImportanceLevel } from '../lib/importance-levels';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from './ui/date-range-picker';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TooltipProvider } from './ui/tooltip';
import { notificationApi, ApiNotificationItem, ApiNotificationResponse } from '@/services/notificationApi';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationType } from '../types/notifications';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from './ui/badge';

type SortOption = 'time' | 'importance';

/**
 * Mobile-optimized notification dashboard with all desktop features
 * Beautiful, responsive UI with bottom sheet filters
 */
export function MobileNotificationWrapper() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { stats, refreshStats } = useNotifications();
  const isDark = theme === 'dark';

  const [notifications, setNotifications] = useState<ApiNotificationItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, perPage: 10, currentPage: 1, totalPages: 1 });
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortBy, setSortBy] = useState<SortOption>('time');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const getBackendType = (frontendType: string): string => {
    switch (frontendType) {
      case 'ROUTE': return 'ROUTE';
      case 'VEHICLE': return 'VEHICLE';
      case 'EMPLOYEE': return 'EMPLOYEE';
      case 'DRIVER': return 'DRIVER';
      case 'REQUEST': return 'REQUEST';
      case 'SYSTEM': return 'SYSTEM';
      default: return frontendType;
    }
  };

  const isNotificationRead = (notification: ApiNotificationItem): boolean => {
    const userId = user && 'id' in user ? (user as unknown as { id: string }).id : undefined;
    if (!userId) return false;
    return notification.seenBy?.some(seen => seen.userId === userId && seen.readAt !== null) ?? false;
  };

  const mapImportance = (importanceStr: string) => {
    const importance = importanceStr.toUpperCase();
    switch (importance) {
      case 'CRITICAL':
      case 'URGENT': return 5;
      case 'HIGH': return 4;
      case 'MEDIUM': return 3;
      case 'LOW': return 2;
      default: return 1;
    }
  };

  const getSourceLabel = (fromRole: string): string => {
    switch (fromRole?.toLowerCase()) {
      case 'admin':
      case 'administrator': return 'Admin';
      case 'manager':
      case 'shuttle_manager':
      case 'fleetmanager': return 'Fleet Manager';
      case 'system':
      default: return 'System';
    }
  };

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
    setCurrentPage(1);
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        let response: ApiNotificationResponse;
        const query = {
          page: currentPage,
          limit: pagination.perPage,
          type: typeFilter !== 'all' ? getBackendType(typeFilter) : undefined,
          importance: (severityFilter !== 'all' ? severityFilter : undefined) as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | undefined,
          fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
          toDate: dateRange?.to ? new Date(dateRange.to.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString() : undefined,
        };

        if (sortBy === 'importance') {
          response = await notificationApi.getSortedByImportance(query);
        } else if (readFilter === 'unread') {
          response = await notificationApi.getUnread(query);
        } else if (readFilter === 'read') {
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
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentPage, pagination.perPage, typeFilter, severityFilter, dateRange, readFilter, sortBy, refreshTrigger]);

  useEffect(() => {
    refreshStats({
      type: typeFilter !== 'all' ? getBackendType(typeFilter) : undefined,
      importance: severityFilter !== 'all' ? severityFilter : undefined,
      fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
      toDate: dateRange?.to ? new Date(dateRange.to.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString() : undefined,
    });
  }, [typeFilter, severityFilter, dateRange, refreshStats]);

  useEffect(() => {
    const handleNotificationUpdate = () => {
      setRefreshTrigger(prev => prev + 1);
      refreshStats({
        type: typeFilter !== 'all' ? getBackendType(typeFilter) : undefined,
        importance: severityFilter !== 'all' ? severityFilter : undefined,
        fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
        toDate: dateRange?.to ? new Date(dateRange.to.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString() : undefined,
      });
    };

    window.addEventListener('notification-updated', handleNotificationUpdate);
    return () => window.removeEventListener('notification-updated', handleNotificationUpdate);
  }, [refreshStats, typeFilter, severityFilter, dateRange]);

  const transformedNotifications = notifications.map(notification => ({
    id: notification.id,
    type: notification.notificationType as NotificationType,
    title: notification.subject,
    description: notification.message,
    timestamp: new Date(notification.createdAt),
    importance: getImportanceLevel(mapImportance(notification.importance)),
    source: getSourceLabel(notification.fromRole),
    isRead: isNotificationRead(notification),
    metadata: { relatedEntityId: notification.relatedEntityId }
  }));

  const handleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleMarkRead = async () => {
    try {
      for (const id of selectedIds) await notificationApi.markAsRead(id);
      const query = { page: currentPage, limit: pagination.perPage };
      const response = await notificationApi.getAll(query);
      setNotifications(response.notifications);
      setSelectedIds([]);
      await refreshStats();
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkUnread = async () => {
    try {
      for (const id of selectedIds) await notificationApi.markAsUnread(id);
      const query = {
        page: currentPage,
        limit: pagination.perPage,
        type: typeFilter !== 'all' ? getBackendType(typeFilter) : undefined,
        fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
        toDate: dateRange?.to ? new Date(dateRange.to.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString() : undefined,
      };
      const response = await notificationApi.getAll(query);
      setNotifications(response.notifications);
      setSelectedIds([]);
      await refreshStats();
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (error) {
      console.error('Failed to mark as unread:', error);
    }
  };

  const handleSelectAllToggle = async () => {
    if (selectedIds.length === pagination.total && pagination.total > 0) {
      setSelectedIds([]);
    } else {
      try {
        const query = {
          page: 1,
          limit: pagination.total,
          type: typeFilter !== 'all' ? getBackendType(typeFilter) : undefined,
          importance: (severityFilter !== 'all' ? severityFilter : undefined) as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | undefined,
          fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
          toDate: dateRange?.to ? new Date(dateRange.to.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString() : undefined,
        };
        
        let response: ApiNotificationResponse;
        if (readFilter === 'read') response = await notificationApi.getRead(query);
        else if (readFilter === 'unread') response = await notificationApi.getUnread(query);
        else response = await notificationApi.getAll(query);
        
        setSelectedIds(response.notifications.map(n => n.id));
      } catch (error) {
        console.error('Failed to select all:', error);
      }
    }
  };

  const handleClearSelection = () => setSelectedIds([]);
  const handleReadFilterChange = (newFilter: string) => {
    setReadFilter(newFilter as 'all' | 'read' | 'unread');
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) setCurrentPage(newPage);
  };

  const typeOptions = [
    { value: 'all', label: 'All Types', icon: Bell },
    { value: 'ROUTE', label: 'Routes' },
    { value: 'VEHICLE', label: 'Vehicles' },
    { value: 'EMPLOYEE', label: 'Employees' },
    { value: 'DRIVER', label: 'Drivers' },
    { value: 'REQUEST', label: 'Requests' },
    { value: 'SYSTEM', label: 'System' },
  ];

  return (
    <div className={cn(
      "min-h-screen pb-20",
      isDark ? "bg-[#0c1222]" : "bg-gray-50"
    )}>
      {/* Mobile Header - Compact & Beautiful */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 backdrop-blur-xl",
        "h-14 px-3 flex items-center justify-between gap-2",
        isDark ? "bg-[#0c1222]/95 border-b border-gray-800" : "bg-white/95 border-b border-gray-200"
      )}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isDark ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-700"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className={cn("text-lg font-semibold", isDark ? "text-gray-100" : "text-gray-900")}>
            Notifications
          </h1>
          {stats.unread > 0 && (
            <Badge variant="destructive" className="ml-1 px-2 py-0.5 text-xs">
              {stats.unread}
            </Badge>
          )}
        </div>

        {/* Filter Button */}
        <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className={cn("gap-2", isDark ? "text-gray-300" : "text-gray-700")}>
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm">Filters</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className={cn("h-[85vh] rounded-t-3xl", isDark ? "bg-[#0c1222]" : "bg-white")}>
            <SheetHeader>
              <SheetTitle className={cn(isDark ? "text-gray-100" : "text-gray-900")}>Filter Notifications</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4 overflow-y-auto max-h-[calc(85vh-80px)] pb-6">
              {/* Type Filter */}
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                  Notification Type
                </label>
                <Select value={typeFilter} onValueChange={(value) => { setTypeFilter(value); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Severity Filter */}
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                  Severity Level
                </label>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="CRITICAL">🔴 Critical</SelectItem>
                    <SelectItem value="HIGH">🟠 High</SelectItem>
                    <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                    <SelectItem value="LOW">🔵 Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">Time (Newest First)</SelectItem>
                    <SelectItem value="importance">Importance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                  Date Range
                </label>
                <TooltipProvider>
                  <DateRangePicker date={dateRange} onDateChange={handleDateRangeChange} className="w-full" />
                </TooltipProvider>
              </div>

              {/* Apply Button */}
              <Button onClick={() => setFilterSheetOpen(false)} className="w-full mt-4">
                Apply Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Content Area */}
      <div className="pt-16 px-3 pb-6">
        <Card className={cn("rounded-2xl border overflow-hidden", isDark ? "bg-gray-900/50" : "bg-white")}>
          <div className="space-y-4">
            {/* Filters Bar */}
            <NotificationFilters
              total={readFilter === 'all' ? stats.total : pagination.total}
              read={readFilter === 'read' ? pagination.total : stats.read}
              unread={readFilter === 'unread' ? pagination.total : stats.unread}
              currentFilter={readFilter}
              onFilterChange={handleReadFilterChange}
              onMarkRead={handleMarkRead}
              onMarkUnread={handleMarkUnread}
              onSelectAll={handleSelectAllToggle}
              onClearSelection={handleClearSelection}
              selectedCount={selectedIds.length}
            />

            {/* Notification List */}
            <div className="px-3">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
                </div>
              ) : transformedNotifications.length > 0 ? (
                <NotificationList
                  notifications={transformedNotifications}
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                />
              ) : (
                <div className={cn("text-center py-12", isDark ? "text-gray-500" : "text-gray-400")}>
                  No notifications found
                </div>
              )}
            </div>

            {/* Pagination - Mobile Optimized */}
            <div className="flex flex-col items-center gap-3 px-3 pb-4">
              <div className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-600")}>
                Showing {((currentPage - 1) * pagination.perPage) + 1} to {Math.min(currentPage * pagination.perPage, pagination.total)} of {pagination.total}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-9 w-9"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {pagination.totalPages <= 5 ? (
                  Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={cn(
                        "h-9 min-w-[36px]",
                        currentPage === page && "bg-blue-600 text-white hover:bg-blue-700"
                      )}
                    >
                      {page}
                    </Button>
                  ))
                ) : (
                  <>
                    <Button
                      variant={currentPage === 1 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      className={cn("h-9 min-w-[36px]", currentPage === 1 && "bg-blue-600 text-white")}
                    >
                      1
                    </Button>
                    {currentPage > 3 && <span className="px-1">...</span>}
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        if (currentPage <= 3) return page > 1 && page < 5;
                        if (currentPage >= pagination.totalPages - 2) return page > pagination.totalPages - 4 && page < pagination.totalPages;
                        return Math.abs(page - currentPage) <= 1;
                      })
                      .map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className={cn("h-9 min-w-[36px]", currentPage === page && "bg-blue-600 text-white")}
                        >
                          {page}
                        </Button>
                      ))
                    }
                    {currentPage < pagination.totalPages - 2 && <span className="px-1">...</span>}
                    {pagination.totalPages > 1 && (
                      <Button
                        variant={currentPage === pagination.totalPages ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pagination.totalPages)}
                        className={cn("h-9 min-w-[36px]", currentPage === pagination.totalPages && "bg-blue-600 text-white")}
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
                  className="h-9 w-9"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
