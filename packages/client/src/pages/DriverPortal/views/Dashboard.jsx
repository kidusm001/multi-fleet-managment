import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';
import { driverService } from '@services/driverService';
import ActiveRouteCard from '../components/ActiveRouteCard';
import QuickStatsGrid from '../components/QuickStatsGrid';
import UpcomingShiftsList from '../components/UpcomingShiftsList';
import DriverGreeting from '../components/DriverGreeting';

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
  const [stats, setStats] = useState({
    stopsCompleted: 0,
    totalStops: 0,
    timeElapsed: '0 min',
    distance: '0 km',
    pickups: 0
  });
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch active route
      const route = await driverService.getActiveRoute();
      setActiveRoute(route);

      // Calculate stats if route exists
      if (route) {
        const completed = route.stops?.filter(s => s.completed).length || 0;
        const total = route.stops?.length || 0;
        
        setStats({
          stopsCompleted: completed,
          totalStops: total,
          timeElapsed: calculateElapsedTime(route.startedAt),
          distance: `${route.totalDistance || 0} km`,
          pickups: completed
        });
      }

      // Fetch upcoming shifts
      const shifts = await driverService.getUpcomingShifts(3);
      setUpcomingShifts(shifts);

    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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
    <div className="space-y-6 py-4">
      {/* Greeting */}
      <DriverGreeting
        greeting={getGreeting()}
        driverName={session?.user?.name || 'Driver'}
        activeRouteCount={activeRoute ? 1 : 0}
      />

      {/* Active Route Card */}
      {activeRoute ? (
        <ActiveRouteCard
          route={activeRoute}
          onNavigate={() => navigate(`/driver/navigate/${activeRoute.id}/${activeRoute.nextStopId}`)}
          onComplete={() => navigate(`/driver/route/${activeRoute.id}`)}
        />
      ) : (
        <div className={cn(
          "rounded-xl border p-6 text-center",
          isDark
            ? "bg-gray-800/50 border-gray-700"
            : "bg-white border-gray-200"
        )}>
          <p className={cn(
            "text-base",
            isDark ? "text-gray-400" : "text-gray-600"
          )}>
            No active route. Awaiting assignment.
          </p>
        </div>
      )}

      {/* Stats Grid */}
      {activeRoute && <QuickStatsGrid stats={stats} />}

      {/* Upcoming Shifts */}
      <UpcomingShiftsList shifts={upcomingShifts} />
    </div>
  );
}

export default DashboardView;
