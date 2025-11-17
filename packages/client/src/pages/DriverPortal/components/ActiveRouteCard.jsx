import React from 'react';
import { Truck, Users, MapPin, Clock } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';

function ActiveRouteCard({ route, onNavigate, onComplete }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "rounded-xl border-2 p-5 space-y-4",
      "border-green-500/50 bg-gradient-to-br",
      isDark
        ? "from-green-900/20 to-green-800/10"
        : "from-green-50 to-green-100/50"
    )}>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
        <span className={cn(
          "text-sm font-semibold uppercase tracking-wide",
          isDark ? "text-green-400" : "text-green-700"
        )}>
          Active Route
        </span>
      </div>

      <div className="space-y-2">
        <h3 className={cn(
          "text-xl font-bold",
          isDark ? "text-gray-100" : "text-gray-900"
        )}>
          {route.shift?.name} - {route.name}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-500" />
            <span className={cn(
              "text-sm",
              isDark ? "text-gray-300" : "text-gray-700"
            )}>
              {route.vehicle?.name || 'No vehicle'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className={cn(
              "text-sm",
              isDark ? "text-gray-300" : "text-gray-700"
            )}>
              {route.stops?.length || 0} Passengers
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className={cn(
              "text-sm",
              isDark ? "text-gray-300" : "text-gray-700"
            )}>
              Next: {route.nextStop?.name || 'N/A'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className={cn(
              "text-sm",
              isDark ? "text-gray-300" : "text-gray-700"
            )}>
              ETA: {route.nextStopETA || 'Calculating...'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onNavigate}
          className="flex-1 bg-[#f3684e] hover:bg-[#e55a28] text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          Navigate →
        </button>
        <button
          onClick={onComplete}
          className={cn(
            "flex-1 font-semibold py-3 px-4 rounded-lg transition-colors",
            isDark
              ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
              : "bg-gray-200 hover:bg-gray-300 text-gray-800"
          )}
        >
          Mark Complete
        </button>
      </div>
    </div>
  );
}

export default ActiveRouteCard;
