import React from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';
import { useNotifications } from '@contexts/NotificationContext';
import { cn } from '@lib/utils';
import ThemeToggle from '@components/Common/UI/ThemeToggle';

/**
 * Mobile Top Bar Component
 * Compact header for driver portal
 */
function MobileTopBar({ tabletMode }) {
  const { theme } = useTheme();
  const { unreadCount } = useNotifications();
  const isDark = theme === 'dark';

  const logoSrc = isDark
    ? '/assets/images/logo-light.png'
    : '/assets/images/logo-dark.PNG';

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 backdrop-blur-xl",
        "h-14 px-4 flex items-center justify-between",
        isDark
          ? "bg-[#0c1222]/90 border-b border-gray-800"
          : "bg-white/90 border-b border-gray-200"
      )}
    >
      {/* Logo */}
      <Link to="/driver" className="flex items-center gap-2">
        <img
          src={logoSrc}
          alt="Routegna"
          className={cn(
            "h-8 w-auto",
            tabletMode && "h-10"
          )}
        />
        <span className={cn(
          "font-semibold text-sm",
          isDark ? "text-gray-100" : "text-gray-900",
          tabletMode && "text-base"
        )}>
          Driver Portal
        </span>
      </Link>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notification Bell */}
        <Link
          to="/driver/notifications"
          className={cn(
            "relative p-2 rounded-lg transition-colors",
            isDark
              ? "hover:bg-white/10 text-gray-300"
              : "hover:bg-gray-100 text-gray-700"
          )}
        >
          <Bell className={cn("w-5 h-5", tabletMode && "w-6 h-6")} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#f3684e] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

export default MobileTopBar;
