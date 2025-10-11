import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';
import { NotificationDashboard } from './notification-dashboard';

/**
 * Mobile-optimized wrapper for notifications
 * Adds proper mobile header and spacing
 */
export function MobileNotificationWrapper() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "min-h-screen pb-20",
      isDark ? "bg-[#0c1222]" : "bg-gray-50"
    )}>
      {/* Mobile Header */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 backdrop-blur-xl",
        "h-14 px-4 flex items-center gap-3",
        isDark
          ? "bg-[#0c1222]/90 border-b border-gray-800"
          : "bg-white/90 border-b border-gray-200"
      )}>
        <button
          onClick={() => navigate(-1)}
          className={cn(
            "p-2 rounded-lg transition-colors",
            isDark
              ? "hover:bg-white/10 text-gray-300"
              : "hover:bg-gray-100 text-gray-700"
          )}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className={cn(
          "text-lg font-semibold",
          isDark ? "text-gray-100" : "text-gray-900"
        )}>
          Notifications
        </h1>
      </div>

      {/* Notification Dashboard with top padding */}
      <div className="pt-14">
        <NotificationDashboard />
      </div>
    </div>
  );
}
