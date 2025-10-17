import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';
import { driverService } from '@services/driverService';
import ActiveRouteCard from '../components/ActiveRouteCard';
import { Calendar, Clock, MapPin, TrendingUp } from 'lucide-react';
import {
  groupRoutesByEffectiveStatus,
  sortRoutesByStartTime,
  findNextUpcomingRoute,
  getRouteStartTime
} from '../utils/routeStatus';

/**
 * Driver Dashboard View
 * Main landing page for drivers showing active routes and stats
 */
function DashboardView() {
  const { session } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [activeRoute, setActiveRoute] = useState(null);
  const [nextRoute, setNextRoute] = useState(null);
  const [stats, setStats] = useState({
    stopsCompleted: 0,
    totalStops: 0,
    timeElapsed: '0 min',
    distance: '0 km',
    pickups: 0
  });
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingRoute, setStartingRoute] = useState(false);

  const loadDashboardData = React.useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      const rangeStart = new Date(now);
      rangeStart.setDate(rangeStart.getDate() - 1);
      rangeStart.setHours(0, 0, 0, 0);

      const rangeEnd = new Date(now);
      rangeEnd.setDate(rangeEnd.getDate() + 30);
      rangeEnd.setHours(23, 59, 59, 999);

      const routes = await driverService.getMyRoutes({
        from: rangeStart.toISOString(),
        to: rangeEnd.toISOString(),
        limit: 200
      });

      const grouped = groupRoutesByEffectiveStatus(routes || [], now);
      const activeRoutes = sortRoutesByStartTime(grouped.IN_PROGRESS || []);
      const pendingRoutes = sortRoutesByStartTime(grouped.PENDING || []);

      const activeRouteData = activeRoutes[0] || null;
      const nextCandidate = findNextUpcomingRoute(pendingRoutes, now);
      const fallbackUpcoming = pendingRoutes.find((route) => route.id !== activeRouteData?.id) || null;

      setActiveRoute(activeRouteData);
      setNextRoute(activeRouteData ? fallbackUpcoming : nextCandidate);
      setUpcomingShifts(pendingRoutes.slice(0, 3));

      if (activeRouteData) {
        const completed = activeRouteData.stops?.filter(s => s.completed).length || 0;
        const total = activeRouteData.stops?.length || 0;

        setStats({
          stopsCompleted: completed,
          totalStops: total,
          timeElapsed: calculateElapsedTime(activeRouteData.startedAt || getRouteStartTime(activeRouteData)),
          distance: `${activeRouteData.totalDistance || 0} km`,
          pickups: completed
        });
      } else {
        setStats({
          stopsCompleted: 0,
          totalStops: 0,
          timeElapsed: '0 min',
          distance: '0 km',
          pickups: 0
        });
      }

    } catch (error) {
      console.error('Failed to load dashboard:', error);
      // Set empty state on error
      setActiveRoute(null);
      setNextRoute(null);
      setUpcomingShifts([]);
      setStats({
        stopsCompleted: 0,
        totalStops: 0,
        timeElapsed: '0 min',
        distance: '0 km',
        pickups: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStartTracking = async () => {
    if (!nextRoute) return;
    
    try {
      setStartingRoute(true);
      // Update route status to IN_PROGRESS
      await driverService.updateRouteStatus(nextRoute.id, 'IN_PROGRESS');
      // Refresh dashboard data before navigation to reflect new state
      await loadDashboardData();

      // Navigate to navigation view - need to get first stop
      const routeDetails = await driverService.getRoute(nextRoute.id);
      const firstStopId = routeDetails.stops?.[0]?.id || '';
      navigate(`/driver/navigate/${nextRoute.id}/${firstStopId}`);
    } catch (error) {
      console.error('Failed to start tracking:', error);
    } finally {
      setStartingRoute(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const calculateElapsedTime = (startTime) => {
    if (!startTime) return '0 min';
    const diff = Date.now() - new Date(startTime).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

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
        {/* Greeting Section */}
        <div className={cn(
          "rounded-2xl p-6 border",
          isDark
            ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700"
            : "bg-gradient-to-br from-white to-gray-50 border-gray-200"
        )}>
          <h1 className={cn(
            "text-2xl md:text-3xl font-bold",
            isDark ? "text-white" : "text-gray-900"
          )}>
            {getGreeting()}, {session?.user?.name?.split(' ')[0] || 'Driver'}!
          </h1>
          <p className={cn(
            "mt-2 flex items-center gap-2",
            isDark ? "text-gray-400" : "text-gray-600"
          )}>
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Active Route Card */}
        {activeRoute ? (
          <ActiveRouteCard
            route={activeRoute}
            onNavigate={() => {
              const firstStopId = activeRoute.stops?.[0]?.id || '';
              navigate(`/driver/navigate/${activeRoute.id}/${firstStopId}`);
            }}
            onComplete={() => navigate(`/driver/route/${activeRoute.id}`)}
          />
        ) : nextRoute ? (
          // Show next upcoming route with Start Tracking button
          <div className={cn(
            "rounded-2xl border p-6",
            isDark
              ? "bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-700/50"
              : "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200"
          )}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <MapPin className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className={cn(
                      "text-lg font-semibold",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      Next Route
                    </h3>
                    <p className={cn(
                      "text-sm",
                      isDark ? "text-gray-400" : "text-gray-600"
                    )}>
                      Ready to start
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <h4 className={cn(
                    "font-medium",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    {nextRoute.name || `Route ${nextRoute.id.slice(0, 8)}`}
                  </h4>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {nextRoute.shift && (
                      <div className="flex items-center gap-1.5">
                        <Clock className={cn(
                          "w-4 h-4",
                          isDark ? "text-gray-400" : "text-gray-500"
                        )} />
                        <span className={cn(
                          isDark ? "text-gray-300" : "text-gray-700"
                        )}>
                          {new Date(nextRoute.shift.startTime).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    )}
                    {nextRoute.vehicle && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className={cn(
                          "w-4 h-4",
                          isDark ? "text-gray-400" : "text-gray-500"
                        )} />
                        <span className={cn(
                          isDark ? "text-gray-300" : "text-gray-700"
                        )}>
                          {nextRoute.vehicle.plateNumber}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Calendar className={cn(
                        "w-4 h-4",
                        isDark ? "text-gray-400" : "text-gray-500"
                      )} />
                      <span className={cn(
                        isDark ? "text-gray-300" : "text-gray-700"
                      )}>
                        {nextRoute.stops?.length || 0} stops
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleStartTracking}
                disabled={startingRoute}
                className={cn(
                  "px-6 py-3 rounded-xl font-medium transition-all shadow-lg",
                  "bg-[#f3684e] hover:bg-[#e55739] text-white",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  startingRoute && "animate-pulse"
                )}
              >
                {startingRoute ? 'Starting...' : 'Start Tracking'}
              </button>
            </div>
          </div>
        ) : (
          <div className={cn(
            "rounded-2xl border p-8 text-center",
            isDark
              ? "bg-gray-800/50 border-gray-700"
              : "bg-white border-gray-200"
          )}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className={cn(
              "text-lg font-semibold mb-2",
              isDark ? "text-gray-200" : "text-gray-900"
            )}>
              No Active Route
            </h3>
            <p className={cn(
              "text-sm",
              isDark ? "text-gray-400" : "text-gray-600"
            )}>
              You don&apos;t have any routes scheduled at the moment.
            </p>
          </div>
        )}

        {/* Stats Grid */}
        {activeRoute && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={cn(
              "rounded-xl p-4 border",
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            )}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.stopsCompleted}/{stats.totalStops}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Stops</p>
                </div>
              </div>
            </div>

            <div className={cn(
              "rounded-xl p-4 border",
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            )}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.timeElapsed}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Elapsed</p>
                </div>
              </div>
            </div>

            <div className={cn(
              "rounded-xl p-4 border",
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            )}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.distance}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Distance</p>
                </div>
              </div>
            </div>

            <div className={cn(
              "rounded-xl p-4 border",
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            )}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.pickups}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Pickups</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Shifts */}
        {upcomingShifts.length > 0 && (
          <div className={cn(
            "rounded-2xl border p-6",
            isDark
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          )}>
            <h2 className={cn(
              "text-xl font-semibold mb-4",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Upcoming Routes
            </h2>
            <div className="space-y-3">
              {upcomingShifts.map((shift) => (
                <div
                  key={shift.id}
                  className={cn(
                    "p-4 rounded-xl border cursor-pointer transition-colors",
                    isDark
                      ? "bg-gray-700/50 border-gray-600 hover:bg-gray-700"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  )}
                  onClick={() => navigate(`/driver/route/${shift.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={cn(
                        "font-semibold",
                        isDark ? "text-white" : "text-gray-900"
                      )}>
                        {shift.name || `Route ${shift.id.slice(0, 8)}`}
                      </h3>
                      <p className={cn(
                        "text-sm mt-1",
                        isDark ? "text-gray-400" : "text-gray-600"
                      )}>
                        {shift.stops?.length || 0} stops • {shift.vehicle?.licensePlate || 'No vehicle'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-sm font-medium",
                        isDark ? "text-gray-300" : "text-gray-700"
                      )}>
                        {new Date(shift.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className={cn(
                        "text-xs",
                        isDark ? "text-gray-500" : "text-gray-500"
                      )}>
                        {shift.startTime || 'No time set'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardView;