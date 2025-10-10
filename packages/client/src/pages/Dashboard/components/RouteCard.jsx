import React from 'react';
import PropTypes from 'prop-types';
import { MapPin, Users, Clock } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';

/**
 * Mobile-optimized route card
 * Touch-friendly with clear visual hierarchy
 * Used by RouteList component - does not handle navigation
 */
function RouteCard({ route, isActive = false, onClick }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const stopCount = route.stops?.length || 0;
  const employeeCount = route.stops?.filter(stop => stop.employee)?.length || 0;
  const completedCount = route.stops?.filter(stop => stop.status === 'COMPLETED')?.length || 0;
  const progress = stopCount > 0 ? (completedCount / stopCount) * 100 : 0;

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'PENDING':
        return 'bg-blue-500';
      case 'COMPLETED':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl transition-all border ${
        isActive
          ? isDark
            ? 'bg-primary-600/20 border-primary-600'
            : 'bg-primary-50 border-primary-600'
          : isDark
            ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
            : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
      style={{ minHeight: '120px' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className={`font-semibold text-base truncate ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {route.name}
          </h3>
          {route.shuttle?.name && (
            <p className={`text-sm mt-1 truncate ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {route.shuttle.name}
            </p>
          )}
        </div>
        
        {/* Status Badge */}
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold text-white ${
          getStatusColor(route.status)
        }`}>
          {route.status}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-3">
        <div className={`flex items-center gap-1.5 text-sm ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <MapPin className="w-4 h-4" />
          <span>{stopCount} stops</span>
        </div>
        <div className={`flex items-center gap-1.5 text-sm ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <Users className="w-4 h-4" />
          <span>{employeeCount} passengers</span>
        </div>
        {route.nextDeparture && (
          <div className={`flex items-center gap-1.5 text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{new Date(route.nextDeparture).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</span>
          </div>
        )}
      </div>

      {/* Progress Bar (for active routes) */}
      {route.status === 'ACTIVE' && stopCount > 0 && (
        <div className="space-y-1">
          <div className={`w-full h-2 rounded-full overflow-hidden ${
            isDark ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {completedCount} of {stopCount} stops completed
          </p>
        </div>
      )}
    </button>
  );
}

RouteCard.propTypes = {
  route: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.string,
    shuttle: PropTypes.shape({
      name: PropTypes.string,
    }),
    stops: PropTypes.arrayOf(PropTypes.shape({
      employee: PropTypes.object,
      status: PropTypes.string,
    })),
    nextDeparture: PropTypes.string,
  }).isRequired,
  isActive: PropTypes.bool,
  onClick: PropTypes.func,
};

export default RouteCard;
