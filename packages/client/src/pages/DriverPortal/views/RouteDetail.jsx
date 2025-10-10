import React from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';

function RouteDetailView() {
  const { id } = useParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="py-4">
      <div className={cn(
        "rounded-xl border p-6 text-center",
        isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"
      )}>
        <h2 className={cn(
          "text-xl font-bold mb-2",
          isDark ? "text-gray-100" : "text-gray-900"
        )}>
          Route Details
        </h2>
        <p className={cn(
          "text-sm",
          isDark ? "text-gray-400" : "text-gray-600"
        )}>
          Route ID: {id}
        </p>
        <p className={cn(
          "text-sm mt-4",
          isDark ? "text-gray-400" : "text-gray-600"
        )}>
          Detailed view with stop-by-stop progress coming soon...
        </p>
      </div>
    </div>
  );
}

export default RouteDetailView;
