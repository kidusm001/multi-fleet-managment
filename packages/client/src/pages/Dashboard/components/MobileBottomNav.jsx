import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MapPin, Settings, Users } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';

const navItems = [
  { 
    path: '/dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    exact: true
  },
  { 
    path: '/routes', 
    label: 'Routes', 
    icon: MapPin 
  },
  { 
    path: '/employees', 
    label: 'Employees', 
    icon: Users 
  },
  { 
    path: '/settings', 
    label: 'Settings', 
    icon: Settings 
  },
];

/**
 * Mobile Bottom Navigation
 * Tab-based navigation for all main sections
 */
function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const isActive = (path, exact) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 z-50 ${
        isDark ? 'bg-gray-900' : 'bg-white'
      } border-t ${
        isDark ? 'border-gray-800' : 'border-gray-200'
      }`}
      style={{ 
        height: '60px',
        paddingBottom: 'env(safe-area-inset-bottom)' 
      }}
    >
      <div className="h-full px-2 flex items-center justify-around">
        {navItems.map(({ path, label, icon: Icon, exact }) => {
          const active = isActive(path, exact);
          
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active 
                  ? 'text-primary-600 dark:text-primary-500' 
                  : isDark 
                    ? 'text-gray-400 hover:text-gray-300' 
                    : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={`w-6 h-6 mb-1 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
