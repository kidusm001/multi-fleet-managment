import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Truck, Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';

/**
 * Mobile Bottom Navigation Component
 * Animated tab-based navigation for driver portal
 */

const navItems = [
  { path: '/driver', label: 'Home', icon: Home, exact: true },
  { path: '/driver/routes', label: 'Routes', icon: Truck },
  { path: '/driver/schedule', label: 'Schedule', icon: Calendar },
  { path: '/driver/profile', label: 'Profile', icon: User },
];

function MobileBottomNav() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = theme === 'dark';

  const getActiveIndex = React.useCallback(() => {
    const index = navItems.findIndex(item => {
      if (item.exact) {
        return location.pathname === item.path;
      }
      return location.pathname.startsWith(item.path);
    });
    return index >= 0 ? index : 0;
  }, [location.pathname]);

  const [activeIndex, setActiveIndex] = useState(getActiveIndex());

  useEffect(() => {
    setActiveIndex(getActiveIndex());
  }, [location.pathname, getActiveIndex]);

  const handleNavigation = (path, index) => {
    setActiveIndex(index);
    navigate(path);
  };

  return (
    <motion.nav
      initial={{ scale: 0.95, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      role="navigation"
      aria-label="Bottom Navigation"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40",
        "flex items-center justify-center p-2 pb-3"
      )}
    >
      <div className={cn(
        "flex items-center rounded-full p-1.5 gap-1 max-w-md md:max-w-lg w-full mx-2",
        "border",
        isDark
          ? "bg-gray-800 border-gray-700"
          : "bg-gray-50 border-gray-200"
      )}>
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = activeIndex === idx;

          return (
            <motion.button
              key={item.label}
              whileTap={{ scale: 0.95 }}
              className={cn(
                // Mobile: vertical (flex-col), Tablet+: horizontal (md:flex-row)
                "flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 px-2 md:px-4 py-2 md:py-2.5 rounded-full transition-colors duration-200 relative min-w-[56px] md:min-w-[80px] flex-1",
                isActive
                  ? isDark
                    ? "bg-[#ff965b]/10 text-[#ff965b]"
                    : "bg-[#f3684e]/10 text-[#f3684e]"
                  : isDark
                  ? "bg-transparent text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                  : "bg-transparent text-gray-600 hover:bg-gray-200 hover:text-gray-900",
                "focus:outline-none focus-visible:ring-0"
              )}
              onClick={() => handleNavigation(item.path, idx)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              type="button"
            >
              <Icon
                size={20}
                strokeWidth={2}
                aria-hidden
                className="md:w-6 md:h-6 transition-colors duration-200"
              />
              {/* Mobile: always show, no animation */}
              <span
                className={cn(
                  "block md:hidden font-medium text-[10px] whitespace-nowrap select-none mt-0.5",
                  isActive
                    ? isDark
                      ? "text-[#ff965b]"
                      : "text-[#f3684e]"
                    : isDark
                    ? "text-gray-400"
                    : "text-gray-600"
                )}
              >
                {item.label}
              </span>
              {/* Tablet+ only: animated label */}
              <motion.span
                initial={false}
                animate={{
                  width: isActive ? 'auto' : 0,
                  opacity: isActive ? 1 : 0,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={cn(
                  "hidden md:inline-block font-medium text-base whitespace-nowrap select-none overflow-visible",
                  isActive
                    ? isDark
                      ? "text-[#ff965b]"
                      : "text-[#f3684e]"
                    : "text-transparent"
                )}
                style={{ width: isActive ? 'auto' : 0 }}
              >
                {item.label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}

export default MobileBottomNav;
