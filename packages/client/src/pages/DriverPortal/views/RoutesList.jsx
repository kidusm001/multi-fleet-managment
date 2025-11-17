import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';
import { driverService } from '@services/driverService';
import RouteListCard from '../components/RouteListCard';
import { ListFilter, RefreshCw } from 'lucide-react';
import {
  groupRoutesByEffectiveStatus,
  sortRoutesByStartTime,
  sortRoutesByEndTime,
  filterUpcomingDisplayWindow,
  filterRecentCompletedWindow
} from '../utils/routeStatus';

const buildQueryWindow = () => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 14);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setDate(end.getDate() + 45);
  end.setHours(23, 59, 59, 999);

  return {
    from: start.toISOString(),
    to: end.toISOString(),
    limit: 200
  };
};

function RoutesListView() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [groupedRoutes, setGroupedRoutes] = useState({
    ACTIVE: [],
    UPCOMING: [],
    COMPLETED: [],
    CANCELLED: [],
  });
  const [filter, setFilter] = useState('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRoutes = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = buildQueryWindow();
      const data = await driverService.getMyRoutes(params);
      const now = new Date();
      const grouped = groupRoutesByEffectiveStatus(data || [], now);

      const activeRoutes = sortRoutesByStartTime(grouped.ACTIVE || []);

      const upcomingRaw = sortRoutesByStartTime(grouped.UPCOMING || []);
      const upcomingWindow = sortRoutesByStartTime(
        filterUpcomingDisplayWindow(grouped.UPCOMING || [], now)
      );
      const upcomingRoutes = upcomingWindow.length > 0
        ? upcomingWindow
        : upcomingRaw.slice(0, 3);

      const completedFiltered = filterRecentCompletedWindow(grouped.COMPLETED || [], now);
      const completedSorted = sortRoutesByEndTime(completedFiltered);
      const completedFallback = sortRoutesByEndTime(grouped.COMPLETED || []);
      const completedRoutes = (completedSorted.length > 0 ? completedSorted : completedFallback.slice(-3))
        .reverse();

      setGroupedRoutes({
        ACTIVE: activeRoutes,
        UPCOMING: upcomingRoutes,
        COMPLETED: completedRoutes,
        CANCELLED: sortRoutesByStartTime(grouped.CANCELLED || []),
      });
    } catch (error) {
      console.error('Failed to load routes:', error);
      setGroupedRoutes({
        ACTIVE: [],
        UPCOMING: [],
        COMPLETED: [],
        CANCELLED: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRoutes();
  };

  const tabs = [
    { id: 'ACTIVE', label: 'Active' },
    { id: 'UPCOMING', label: 'Upcoming' },
    { id: 'COMPLETED', label: 'Completed' }
  ];

  const routesForFilter = groupedRoutes[filter] || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f3684e]" />
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen p-4 md:p-6",
      isDark ? "bg-gray-900" : "bg-gray-50"
    )}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className={cn(
              "p-1.5 md:p-2 rounded-lg",
              isDark ? "bg-gray-800" : "bg-white"
            )}>
              <ListFilter className="w-4 h-4 md:w-5 md:h-5 text-[#f3684e]" />
            </div>
            <div>
              <h1 className={cn(
                "text-lg md:text-2xl font-bold",
                isDark ? "text-white" : "text-gray-900"
              )}>
                My Routes
              </h1>
              <p className={cn(
                "text-xs md:text-sm",
                isDark ? "text-gray-400" : "text-gray-600"
              )}>
                {routesForFilter.length} {filter.toLowerCase()} {routesForFilter.length === 1 ? 'route' : 'routes'}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={cn(
              "p-1.5 md:p-2 rounded-lg transition-colors",
              isDark
                ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
                : "bg-white text-gray-600 hover:bg-gray-100"
            )}
          >
            <RefreshCw className={cn(
              "w-4 h-4 md:w-5 md:h-5",
              refreshing && "animate-spin"
            )} />
          </button>
        </div>

        {/* Tab Filters */}
        <div className={cn(
          "flex gap-1 md:gap-2 p-1 rounded-xl border",
          isDark
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        )}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "flex-1 py-2 md:py-3 px-2 md:px-4 rounded-lg font-medium transition-all text-xs md:text-sm",
                filter === tab.id
                  ? "bg-[#f3684e] text-white shadow-lg"
                  : isDark
                  ? "text-gray-400 hover:bg-gray-700/50"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <span className="inline-flex items-center justify-center gap-1 md:gap-2">
                <span>{tab.label}</span>
                <span className={cn(
                  "text-[10px] md:text-xs font-semibold px-1.5 md:px-2 py-0.5 rounded-full",
                  filter === tab.id
                    ? "bg-white/20"
                    : isDark
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-100 text-gray-600"
                )}>
                  {routesForFilter.length && tab.id === filter
                    ? routesForFilter.length
                    : (groupedRoutes[tab.id] || []).length}
                </span>
              </span>
            </button>
          ))}
        </div>

        {/* Routes List */}
        {routesForFilter.length > 0 ? (
          <div className="space-y-2 md:space-y-3">
            {routesForFilter.map((route) => (
              <RouteListCard
                key={route.id}
                route={route}
                onClick={() => navigate(`/driver/navigate/${route.id}/${route.vehicle?.id || route.vehicleId || 'unknown'}`, {
                  state: { route }
                })}
              />
            ))}
          </div>
        ) : (
          <div className={cn(
            "rounded-2xl border p-6 md:p-12 text-center",
            isDark
              ? "bg-gray-800/50 border-gray-700"
              : "bg-white border-gray-200"
          )}>
            <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-2 md:mb-4">
              <ListFilter className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
            </div>
            <h3 className={cn(
              "text-sm md:text-lg font-semibold mb-1 md:mb-2",
              isDark ? "text-gray-200" : "text-gray-900"
            )}>
              No {filter.toLowerCase()} routes
            </h3>
            <p className={cn(
              "text-xs md:text-sm",
              isDark ? "text-gray-400" : "text-gray-600"
            )}>
              {filter === 'ACTIVE' && "You don't have any active routes at the moment."}
              {filter === 'UPCOMING' && "No upcoming routes scheduled."}
              {filter === 'COMPLETED' && "No completed routes to display."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoutesListView;