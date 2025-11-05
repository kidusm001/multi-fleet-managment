import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Send } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';
import ThemeToggle from '@components/Common/UI/ThemeToggle';
import { NotificationDropdown } from '@components/Common/Notifications/NotificationDropdown';
import { UserDropdown } from './user-dropdown-menu';

export function EmployeeTopBar() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/employee-portal' },
    { id: 'request', label: 'Request', icon: Send, path: '/employee-portal/request' },
  ];

  const activeTab = location.pathname === '/employee-portal/request' ? 'request' : 'dashboard';

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 border-b h-[60px]",
      isDark ? "bg-slate-900/95 border-slate-700" : "bg-white/95 border-gray-200"
    )}>
      <div className="flex items-center justify-between h-full px-4">
        {/* Logo/Brand */}
        <div className="flex items-center">
          <Link to="/employee-portal" className="flex items-center space-x-2">
            <img
              src={isDark ? "/assets/images/logo-light.png" : "/assets/images/logo-dark.PNG"}
              alt="Fleet Management"
              className="h-6 sm:h-8 w-auto"
            />
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-4 sm:space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "group inline-flex items-center py-1.5 sm:py-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : cn(
                        "border-transparent",
                        isDark
                          ? "text-gray-400 hover:text-gray-300 hover:border-gray-600"
                          : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      )
                )}
              >
                <Icon
                  className={cn(
                    "mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 transition-colors",
                    isActive
                      ? "text-primary"
                      : isDark
                      ? "text-gray-400 group-hover:text-gray-300"
                      : "text-gray-400 group-hover:text-gray-500"
                  )}
                  aria-hidden="true"
                />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-1 sm:space-x-3">
          <ThemeToggle compact />
          <NotificationDropdown compact />
          <UserDropdown compact="mobile" redirectTo="/profile" />
        </div>
      </div>
    </div>
  );
}
