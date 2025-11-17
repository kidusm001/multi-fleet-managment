import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';
import { driverService } from '@services/driverService';
import ActiveRouteCard from '../components/ActiveRouteCard';
import { Calendar, Clock, MapPin, TrendingUp, Truck } from 'lucide-react';
import {
    groupRoutesByEffectiveStatus,
    sortRoutesByStartTime,
    findNextUpcomingRoute,
    getRouteStartTime,
    filterUpcomingDisplayWindow,
    getRouteDateParts
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
            const activeRoutes = sortRoutesByStartTime(grouped.ACTIVE || []);
            const upcomingFiltered = sortRoutesByStartTime(
                filterUpcomingDisplayWindow(grouped.UPCOMING || [], now)
            );
            const upcomingRaw = sortRoutesByStartTime(grouped.UPCOMING || []);
            const upcomingWindow = upcomingFiltered.length > 0 ? upcomingFiltered : upcomingRaw;

            const activeRouteData = activeRoutes[0] || null;
            const nextCandidate = findNextUpcomingRoute(upcomingWindow, now);
            const fallbackUpcoming = upcomingWindow.find((route) => route.id !== activeRouteData?.id) || null;

            setActiveRoute(activeRouteData);
            setNextRoute(activeRouteData ? fallbackUpcoming : nextCandidate);
            setUpcomingShifts(upcomingWindow.slice(0, 3));

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

        const targetRouteId = nextRoute.isVirtual && nextRoute.originalRouteId
            ? nextRoute.originalRouteId
            : nextRoute.id;

        try {
            setStartingRoute(true);
            // Update route status to IN_PROGRESS
            await driverService.updateRouteStatus(targetRouteId, 'ACTIVE');
            // Refresh dashboard data before navigation to reflect new state
            await loadDashboardData();

            // Navigate to navigation view - need to get first stop
            const routeDetails = await driverService.getRoute(targetRouteId);
            const firstStopId = routeDetails.stops?.[0]?.id || '';
            navigate(`/driver/navigate/${targetRouteId}/${firstStopId}`, {
                state: { route: routeDetails }
            });
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
            <div className="max-w-7xl mx-auto space-y-3 md:space-y-4">
                {/* Greeting Section */}
                <div className={cn(
                    "rounded-lg p-3 md:p-4 border",
                    isDark
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                )}>
                    <h1 className={cn(
                        "text-lg md:text-2xl font-bold",
                        isDark ? "text-white" : "text-gray-900"
                    )}>
                        {getGreeting()}, {session?.user?.name?.split(' ')[0] || 'Driver'}
                    </h1>
                    <p className={cn(
                        "mt-1 flex items-center gap-1.5 text-xs md:text-sm",
                        isDark ? "text-gray-400" : "text-gray-600"
                    )}>
                        <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
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
                            navigate(`/driver/navigate/${activeRoute.id}/${firstStopId}`, {
                                state: { route: activeRoute }
                            });
                        }}
                        onComplete={() => navigate(`/driver/route/${activeRoute.id}`, {
                            state: { route: activeRoute }
                        })}
                    />
                ) : nextRoute ? (
                    // Show next upcoming route with Start Tracking button
                    (() => {
                        const nextRouteStart = getRouteStartTime(nextRoute);
                        const nextRouteStartLabel = nextRouteStart
                            ? nextRouteStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                            : nextRoute.shift?.startTime
                            ? new Date(nextRoute.shift.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                            : 'Time TBD';

                        const nextRouteDateInfo = getRouteDateParts(nextRoute);
                        const nextRouteDayLabel = nextRouteDateInfo.fullLabel || nextRouteDateInfo.weekday || 'Date TBD';
                        const totalStops = nextRoute.stops?.length || 0;

                        return (
                            <div className={cn(
                                "rounded-lg border p-3 md:p-4",
                                isDark
                                    ? "bg-gray-800 border-gray-700"
                                    : "bg-white border-gray-200"
                            )}>
                                <div className="flex items-start justify-between gap-2 md:gap-4">
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
                                        <div className="flex items-center gap-1.5">
                                            <Clock className={cn(
                                                "w-4 h-4",
                                                isDark ? "text-gray-400" : "text-gray-500"
                                            )} />
                                            <span className={cn(
                                                isDark ? "text-gray-300" : "text-gray-700"
                                            )}>
                                                {nextRouteStartLabel}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Truck className={cn(
                                                "w-4 h-4",
                                                isDark ? "text-gray-400" : "text-gray-500"
                                            )} />
                                            <div>
                                                <span className={cn(
                                                    isDark ? "text-gray-300" : "text-gray-700"
                                                )}>
                                                    {nextRoute.vehicle?.name || 'No vehicle'}
                                                </span>
                                                {nextRoute.vehicle?.plateNumber && (
                                                    <span className={cn(
                                                        "text-xs ml-1",
                                                        isDark ? "text-gray-500" : "text-gray-500"
                                                    )}>
                                                        ({nextRoute.vehicle.plateNumber})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className={cn(
                                                "w-4 h-4",
                                                isDark ? "text-gray-400" : "text-gray-500"
                                            )} />
                                            <span className={cn(
                                                isDark ? "text-gray-300" : "text-gray-700"
                                            )}>
                                                {nextRouteDayLabel}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className={cn(
                                                "w-4 h-4",
                                                isDark ? "text-gray-400" : "text-gray-500"
                                            )} />
                                            <span className={cn(
                                                isDark ? "text-gray-300" : "text-gray-700"
                                            )}>
                                                {totalStops} stops
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleStartTracking}
                                disabled={startingRoute}
                                className={cn(
                                    "px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-all text-sm md:text-base",
                                    "bg-[#f3684e] hover:bg-[#e55739] text-white",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    startingRoute && "animate-pulse"
                                )}
                            >
                                {startingRoute ? 'Starting...' : 'Start Tracking'}
                            </button>
                        </div>
                    </div>
                        );
                    })()
                ) : (
                    <div className={cn(
                        "rounded-lg border p-4 md:p-6 text-center",
                        isDark
                            ? "bg-gray-800 border-gray-700"
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                        <div className={cn(
                            "rounded-lg p-4 border",
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
                            "rounded-lg p-4 border",
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
                            "rounded-lg p-4 border",
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
                            "rounded-lg p-4 border",
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
                        "rounded-lg border p-3 md:p-4",
                        isDark
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-gray-200"
                    )}>
                        <h2 className={cn(
                            "text-base md:text-lg font-semibold mb-2 md:mb-3",
                            isDark ? "text-white" : "text-gray-900"
                        )}>
                            Upcoming Routes
                        </h2>
                        <div className="space-y-3">
                            {upcomingShifts.map((shift) => {
                                const dateInfo = getRouteDateParts(shift);
                                return (
                                    <div
                                        key={shift.id}
                                        className={cn(
                                            "p-4 rounded-lg border cursor-pointer transition-colors",
                                            isDark
                                                ? "bg-gray-700 border-gray-600 hover:bg-gray-600"
                                                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                        )}
                                        onClick={() => navigate(`/driver/navigate/${shift.id}/${shift.vehicle?.id || shift.vehicleId || 'unknown'}`, {
                                            state: { route: shift }
                                        })}
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
                                                    {shift.stops?.length || 0} stops • {shift.vehicle?.name || 'No vehicle'}
                                                    {shift.vehicle?.plateNumber && (
                                                        <span className="text-xs ml-1">({shift.vehicle.plateNumber})</span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={cn(
                                                    "text-sm font-medium",
                                                    isDark ? "text-gray-300" : "text-gray-700"
                                                )}>
                                                    {dateInfo.fullLabel || dateInfo.weekday || 'Date TBD'}
                                                </p>
                                                <p className={cn(
                                                    "text-xs",
                                                    isDark ? "text-gray-500" : "text-gray-500"
                                                )}>
                                                    {shift.shift?.startTime ? new Date(shift.shift.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : shift.startTime ? new Date(shift.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'No time set'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DashboardView;
