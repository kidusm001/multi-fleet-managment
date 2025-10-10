import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Truck, Calendar, User } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';

/**
 * Mobile Bottom Navigation Component
 * Tab-based navigation for driver portal
 */
function MobileBottomNav({ tabletMode }) {
  const { theme } = useTheme();
  const location = useLocation();
  const isDark = theme === 'dark';

  const navItems = [
    { path: '/driver', label: 'Home', icon: Home, exact: true },
    { path: '/driver/routes', label: 'Routes', icon: Truck },
    { path: '/driver/schedule', label: 'Schedule', icon: Calendar },
    { path: '/driver/profile', label: 'Profile', icon: User },
  ];

  const isActive = (path, exact) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40",
        "h-16 px-2 pb-safe-bottom",
        "flex items-center justify-around",
        "backdrop-blur-xl border-t",
        isDark
          ? "bg-[#0c1222]/95 border-gray-800"
          : "bg-white/95 border-gray-200"
      )}
    >
      {navItems.map(({ path, label, icon: Icon, exact }) => {
        const active = isActive(path, exact);
        
        return (
          <NavLink
            key={path}
            to={path}
            className={cn(
              "flex flex-col items-center justify-center",
              "min-w-[60px] h-12 rounded-lg transition-all",
              tabletMode ? "min-w-[80px]" : "min-w-[60px]",
              active
                ? isDark
                  ? "text-[#ff965b]"
                  : "text-[#f3684e]"
                : isDark
                ? "text-gray-400 hover:text-gray-200"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Icon className={cn(
              "w-5 h-5 mb-1",
              tabletMode && "w-6 h-6"
            )} />
            <span className={cn(
              "text-xs font-medium",
              tabletMode && "text-sm"
            )}>
              {label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default MobileBottomNav;
