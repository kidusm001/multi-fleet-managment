import React from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@contexts/ThemeContext';
import { useNotifications } from '@contexts/NotificationContext';

/**
 * Mobile Top Bar for Dashboard
 * Shows logo and notifications with badge
 */
function MobileTopBar() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { unreadCount } = useNotifications();
  const isDark = theme === 'dark';

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 ${
        isDark ? 'bg-gray-900' : 'bg-white'
      } border-b ${
        isDark ? 'border-gray-800' : 'border-gray-200'
      }`}
      style={{ height: '56px' }}
    >
      <div className="h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <span className={`text-xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Multi-Fleet
          </span>
        </div>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className={`relative p-2 rounded-lg transition-colors ${
            isDark 
              ? 'hover:bg-gray-800 text-gray-300' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          aria-label="Notifications"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

export default MobileTopBar;
