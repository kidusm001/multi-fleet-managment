import React from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';

function DriverGreeting({ greeting, driverName, activeRouteCount }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="space-y-1">
      <h1 className={cn(
        "text-2xl font-bold",
        isDark ? "text-gray-100" : "text-gray-900"
      )}>
        {greeting}, {driverName}!
      </h1>
      <p className={cn(
        "text-sm",
        isDark ? "text-gray-400" : "text-gray-600"
      )}>
        {activeRouteCount > 0
          ? `You have ${activeRouteCount} active route`
          : 'No active routes today'}
      </p>
    </div>
  );
}

export default DriverGreeting;
