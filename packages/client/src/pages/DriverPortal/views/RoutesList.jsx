import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';
import { driverService } from '@services/driverService';
import RouteListCard from '../components/RouteListCard';

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
      const data = await driverService.getRoutes({ status: filter });
      setRoutes(data || []);
    } catch (error) {
      console.error('Failed to load routes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const tabs = [
    { id: 'ACTIVE', label: 'Active' },
    { id: 'PENDING', label: 'Upcoming' },
    { id: 'COMPLETED', label: 'Completed' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f3684e]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      {/* Tab Filters */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg font-medium transition-all",
              filter === tab.id
                ? "bg-[#f3684e] text-white"
                : isDark
                ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
          "rounded-xl border p-8 text-center",
          isDark
            ? "bg-gray-800/50 border-gray-700"
            : "bg-white border-gray-200"
        )}>
          <p className={cn(
            "text-base",
            isDark ? "text-gray-400" : "text-gray-600"
          )}>
            No {filter.toLowerCase()} routes found.
          </p>
        </div>
      )}

      {/* Pull to Refresh Indicator */}
      {refreshing && (
        <div className="text-center py-2">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#f3684e]" />
        </div>
      )}
    </div>
  );
}

export default RoutesListView;
