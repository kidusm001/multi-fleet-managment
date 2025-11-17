import React from 'react';
import { CheckCircle, Clock, MapPin, Users } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';

function QuickStatsGrid({ stats }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const statItems = [
    {
      icon: CheckCircle,
      label: 'Stops',
      value: `${stats.stopsCompleted}/${stats.totalStops}`,
      color: 'text-green-500'
    },
    {
      icon: Clock,
      label: 'Elapsed',
      value: stats.timeElapsed,
      color: 'text-blue-500'
    },
    {
      icon: MapPin,
      label: 'Distance',
      value: stats.distance,
      color: 'text-orange-500'
    },
    {
      icon: Users,
      label: 'Pickups',
      value: stats.pickups,
      color: 'text-purple-500'
    }
  ];

  return (
    <div>
      <h2 className={cn(
        "text-lg font-semibold mb-3",
        isDark ? "text-gray-100" : "text-gray-900"
      )}>
        📊 Today&apos;s Summary
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {statItems.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={cn(
                "rounded-lg p-4 flex flex-col items-center justify-center space-y-2",
                isDark ? "bg-gray-800/50" : "bg-white border border-gray-200"
              )}
            >
              <Icon className={cn("w-6 h-6", stat.color)} />
              <div className={cn(
                "text-2xl font-bold",
                isDark ? "text-gray-100" : "text-gray-900"
              )}>
                {stat.value}
              </div>
              <div className={cn(
                "text-xs",
                isDark ? "text-gray-400" : "text-gray-600"
              )}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default QuickStatsGrid;
