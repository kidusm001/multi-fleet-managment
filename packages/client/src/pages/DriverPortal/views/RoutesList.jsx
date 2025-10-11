import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';
import { driverService } from '@services/driverService';
import RouteListCard from '../components/RouteListCard';
import { ListFilter, RefreshCw } from 'lucide-react';

function RoutesListView() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [routes, setRoutes] = useState([]);
  const [filter, setFilter] = useState('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRoutes = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await driverService.getMyRoutes({ status: filter });
      setRoutes(data || []);
    } catch (error) {
      console.error('Failed to load routes:', error);
      setRoutes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRoutes();
  };

  const tabs = [
    { id: 'ACTIVE', label: 'Active', color: 'green' },
    { id: 'PENDING', label: 'Upcoming', color: 'blue' },
    { id: 'COMPLETED', label: 'Completed', color: 'gray' }
  ];

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
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isDark ? "bg-gray-800" : "bg-white"
            )}>
              <ListFilter className="w-5 h-5 text-[#f3684e]" />
            </div>
            <div>
              <h1 className={cn(
                "text-2xl font-bold",
                isDark ? "text-white" : "text-gray-900"
              )}>
                My Routes
              </h1>
              <p className={cn(
                "text-sm",
                isDark ? "text-gray-400" : "text-gray-600"
              )}>
                {routes.length} {filter.toLowerCase()} {routes.length === 1 ? 'route' : 'routes'}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isDark
                ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
                : "bg-white text-gray-600 hover:bg-gray-100"
            )}
          >
            <RefreshCw className={cn(
              "w-5 h-5",
              refreshing && "animate-spin"
            )} />
          </button>
        </div>

        {/* Tab Filters */}
        <div className={cn(
          "flex gap-2 p-1 rounded-xl border",
          isDark
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        )}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "flex-1 py-3 px-4 rounded-lg font-medium transition-all",
                filter === tab.id
                  ? "bg-[#f3684e] text-white shadow-lg"
                  : isDark
                  ? "text-gray-400 hover:bg-gray-700/50"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Routes List */}
        {routes.length > 0 ? (
          <div className="space-y-3">
            {routes.map((route) => (
              <RouteListCard
                key={route.id}
                route={route}
                onClick={() => navigate(`/driver/route/${route.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className={cn(
            "rounded-2xl border p-12 text-center",
            isDark
              ? "bg-gray-800/50 border-gray-700"
              : "bg-white border-gray-200"
          )}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <ListFilter className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className={cn(
              "text-lg font-semibold mb-2",
              isDark ? "text-gray-200" : "text-gray-900"
            )}>
              No {filter.toLowerCase()} routes
            </h3>
            <p className={cn(
              "text-sm",
              isDark ? "text-gray-400" : "text-gray-600"
            )}>
              {filter === 'ACTIVE' && "You don't have any active routes at the moment."}
              {filter === 'PENDING' && "No upcoming routes scheduled."}
              {filter === 'COMPLETED' && "No completed routes to display."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoutesListView;