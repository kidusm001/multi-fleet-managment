import { useEffect } from 'react';
import { useRouteCompletion } from '@/hooks/useRouteCompletion';
import { useTheme } from '@/contexts/ThemeContext';
import { CheckCircle, TrendingUp, Calendar, User } from 'lucide-react';

/**
 * RouteCompletionsDashboard
 * Example dashboard showing route completion statistics and history
 */
const RouteCompletionsDashboard = ({ driverId = null }) => {
  const { theme } = useTheme();
  const {
    loading,
    completions,
    stats,
    fetchCompletions,
    fetchStats,
    fetchDriverCompletions
  } = useRouteCompletion();

  useEffect(() => {
    // Load data on mount
    if (driverId) {
      fetchDriverCompletions(driverId, { limit: 20 });
    } else {
      fetchCompletions({ limit: 20 });
    }
    fetchStats();
  }, [driverId]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="route-completions-dashboard space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={<CheckCircle className="h-6 w-6" />}
            title="Total Completions"
            value={stats.totalCompletions}
            theme={theme}
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Total Distance"
            value={`${stats.totalDistance.toFixed(1)} km`}
            theme={theme}
          />
          <StatCard
            icon={<Calendar className="h-6 w-6" />}
            title="Avg Distance"
            value={`${stats.averageDistance.toFixed(1)} km`}
            theme={theme}
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Avg Time"
            value={`${stats.averageTime.toFixed(0)} min`}
            theme={theme}
          />
        </div>
      )}

      {/* Driver Breakdown */}
      {stats && stats.byDriver && !driverId && (
        <div className={`rounded-lg p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            By Driver
          </h3>
          <div className="space-y-3">
            {stats.byDriver.map((driver) => (
              <div
                key={driver.driverId}
                className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{driver.driverName}</span>
                  <span className="text-sm text-gray-500">
                    {driver.completions} completions
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Distance: </span>
                    <span className="font-medium">{driver.totalDistance.toFixed(1)} km</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Time: </span>
                    <span className="font-medium">{driver.totalTime.toFixed(0)} min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Completions */}
      {completions && completions.length > 0 && (
        <div className={`rounded-lg p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <h3 className="text-lg font-semibold mb-4">Recent Completions</h3>
          <div className="space-y-3">
            {completions.map((completion) => (
              <div
                key={completion.id}
                className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">
                      {completion.route?.name || `Route ${completion.routeId.slice(0, 8)}`}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{completion.driver.name}</span>
                      {completion.vehicle && (
                        <span>{completion.vehicle.plateNumber}</span>
                      )}
                      {completion.route?.totalDistance && (
                        <span>{completion.route.totalDistance} km</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {new Date(completion.completedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && completions.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No route completions yet</p>
        </div>
      )}
    </div>
  );
};

/**
 * StatCard Component
 */
const StatCard = ({ icon, title, value, theme }) => (
  <div className={`rounded-lg p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
    <div className="flex items-center gap-3 mb-2">
      <div className="text-primary-500">{icon}</div>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    </div>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

export default RouteCompletionsDashboard;
