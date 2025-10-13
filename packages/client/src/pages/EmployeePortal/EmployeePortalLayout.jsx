import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@contexts/ThemeContext';
import { LayoutDashboard, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Employee Portal Layout
 * Provides tabbed navigation for Dashboard and Request views
 */
export default function EmployeePortalLayout() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/employee-portal' },
    { id: 'request', label: 'Request Shuttle', icon: Send, path: '/employee-portal/request' },
  ];

  const activeTab = location.pathname === '/employee-portal/request' ? 'request' : 'dashboard';

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Tab Navigation */}
      <div className={cn(
        "border-b",
        isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={cn(
                    "group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors",
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
                      "mr-2 h-5 w-5 transition-colors",
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
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
