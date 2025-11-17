import React from 'react';
import { Bell } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';
import { useNotifications } from '@contexts/NotificationContext';
import { NotificationPanel } from '@pages/notifications/components/NotificationPanel';
import { cn } from '@lib/utils';

/**
 * Driver Portal Notifications View
 * Displays driver's notifications in a mobile-optimized format
 */
function Notifications() {
  const { theme } = useTheme();
  const { stats } = useNotifications();
  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "min-h-screen pb-6",
      isDark ? "bg-[#0c1222]" : "bg-gray-50"
    )}>
      {/* Header */}
      <div className={cn(
        "p-4 mb-4 rounded-lg",
        isDark
          ? "bg-gradient-to-r from-blue-900/30 to-blue-800/30 border border-blue-800/50"
          : "bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-full",
            isDark ? "bg-blue-500/20" : "bg-blue-500/10"
          )}>
            <Bell className={cn(
              "w-6 h-6",
              isDark ? "text-blue-400" : "text-blue-600"
            )} />
          </div>
          <div>
            <h1 className={cn(
              "text-xl font-bold",
              isDark ? "text-gray-100" : "text-gray-900"
            )}>
              Notifications
            </h1>
            <p className={cn(
              "text-sm",
              isDark ? "text-gray-400" : "text-gray-600"
            )}>
              {stats.unread} unread • {stats.total} total
            </p>
          </div>
        </div>
      </div>

      {/* Notification Panel */}
      <NotificationPanel
        showFilters={true}
        showPagination={false}
        itemsPerPage={20}
        defaultFilter="all"
        compact={true}
        className={cn(
          "rounded-lg border shadow-sm",
          isDark
            ? "bg-[#1e293b] border-gray-800"
            : "bg-white border-gray-200"
        )}
      />
    </div>
  );
}

export default Notifications;
