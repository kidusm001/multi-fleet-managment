import React from 'react';
import { Truck, MapPin, Clock, TrendingUp } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';

function RouteListCard({ route, onClick }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const status = (route?.driverStatus || route?.effectiveStatus || route?.status || '').toUpperCase();

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'border-green-500/50 bg-green-900/10';
      case 'UPCOMING':
        return 'border-blue-500/50 bg-blue-900/10';
      case 'COMPLETED':
        return 'border-gray-500/50 bg-gray-900/10';
      case 'CANCELLED':
        return 'border-red-500/40 bg-red-900/10';
      default:
        return 'border-gray-500/50 bg-gray-900/10';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="text-xs font-semibold text-green-500">🟢 ACTIVE</span>;
      case 'UPCOMING':
        return <span className="text-xs font-semibold text-blue-500">🔵 UPCOMING</span>;
      case 'COMPLETED':
        return <span className="text-xs font-semibold text-gray-500">⚪ COMPLETED</span>;
      case 'CANCELLED':
        return <span className="text-xs font-semibold text-red-500">🔴 CANCELLED</span>;
      default:
        return null;
    }
  };

  const completedStops = route.stops?.filter(s => s.completed).length || 0;
  const totalStops = route.stops?.length || 0;
  const progress = totalStops > 0 ? (completedStops / totalStops) * 100 : 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg border p-4 cursor-pointer transition-all",
        getStatusColor(status),
        isDark ? "hover:bg-gray-800/50" : "hover:shadow-md"
      )}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {getStatusBadge(status)}
            <h3 className={cn(
              "text-lg font-bold mt-1",
              isDark ? "text-gray-100" : "text-gray-900"
            )}>
              {route.name}
            </h3>
            <p className={cn(
              "text-sm",
              isDark ? "text-gray-400" : "text-gray-600"
            )}>
              {route.shift?.name || 'No shift assigned'}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-500" />
            <span className={isDark ? "text-gray-300" : "text-gray-700"}>
              {route.vehicle?.name || 'N/A'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className={isDark ? "text-gray-300" : "text-gray-700"}>
              {status === 'ACTIVE' ? 'Started' : route.startTime || 'TBD'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className={isDark ? "text-gray-300" : "text-gray-700"}>
              {totalStops} stops
            </span>
          </div>

          {status === 'ACTIVE' && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                {completedStops}/{totalStops}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar (for active routes) */}
        {status === 'ACTIVE' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                Progress
              </span>
              <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* CTA Button */}
        <button className={cn(
          "w-full py-2 px-4 rounded-lg font-medium transition-colors",
          status === 'ACTIVE'
            ? "bg-[#f3684e] hover:bg-[#e55a28] text-white"
            : isDark
            ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
            : "bg-gray-200 hover:bg-gray-300 text-gray-800"
        )}>
          {status === 'ACTIVE' ? 'Continue →' : 'View Details →'}
        </button>
      </div>
    </div>
  );
}

export default RouteListCard;
