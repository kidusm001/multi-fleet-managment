import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Loader2, 
  MapPin, 
  Navigation as NavigationIcon, 
  Route as RouteIcon, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { driverService } from '@services/driverService';
import { cn } from '@lib/utils';
import { MAP_STYLES } from '@components/Common/Map/config';
import { transformRouteForMap, buildGoogleMapsUrl } from '../utils/mapHelpers';

const MapComponent = React.lazy(() => import('@components/Common/Map/MapComponent'));

function RouteDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const { session } = useAuth();
  const isDark = theme === 'dark';
  const mapStyle = useMemo(() => {
    const candidate = MAP_STYLES?.[isDark ? 'dark' : 'light'];
    if (candidate && candidate.length > 0) {
      return candidate;
    }
    return isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
  }, [isDark]);

  const locationRoute = location.state?.route || null;

  const [route, setRoute] = useState(locationRoute || null);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(() => (id ? !locationRoute : true));
  const [error, setError] = useState(null);

  // If no ID, load today's routes
  useEffect(() => {
    if (id) {
      // Load specific route
      let isMounted = true;

      if (locationRoute) {
        setRoute(locationRoute);
        if (locationRoute.isVirtual) {
          setLoading(false);
          setError(null);
          return () => {
            isMounted = false;
          };
        }
      }

      const loadRoute = async () => {
        try {
          setLoading(true);
          setError(null);

          const data = await driverService.getRoute(id);

          if (!isMounted) {
            return;
          }

          if (!data) {
            setRoute(null);
            setError('Route not found.');
          } else {
            setRoute(data);
          }
        } catch (err) {
          console.error('Failed to load route:', err);
          if (isMounted) {
            if (locationRoute) {
              setRoute(locationRoute);
              setError(null);
            } else {
              setError('Unable to load route details.');
              setRoute(null);
            }
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      loadRoute();

      return () => {
        isMounted = false;
      };
    } else {
      // Load today's active routes
      let isMounted = true;

      const loadTodayRoutes = async () => {
        try {
          setLoading(true);
          setError(null);

          const today = new Date().toISOString().split('T')[0];
          const data = await driverService.getMyRoutes({ date: today, status: 'ACTIVE' });

          if (!isMounted) {
            return;
          }

          if (!data || data.length === 0) {
            setRoutes([]);
            setError('No active routes for today.');
          } else {
            setRoutes(data);
          }
        } catch (err) {
          console.error('Failed to load today routes:', err);
          if (isMounted) {
            setError('Unable to load routes for today.');
            setRoutes([]);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      loadTodayRoutes();

      return () => {
        isMounted = false;
      };
    }
  }, [id, locationRoute]);

  const stops = useMemo(() => {
    if (!route?.stops) {
      return [];
    }

    return [...route.stops]
      .map((stop, index) => {
        const sequences = [stop.routeOrder, stop.sequence, stop.order];
        const resolvedOrder = sequences.find((value) =>
          typeof value === 'number' && Number.isFinite(value)
        );

        return {
          ...stop,
          order: resolvedOrder ?? index,
        };
      })
      .sort((a, b) => a.order - b.order);
  }, [route]);

  const mapRoute = useMemo(() => {
    if (!route) {
      return null;
    }

    return transformRouteForMap({ ...route, stops });
  }, [route, stops]);

  const shuttle = useMemo(() => {
    if (!route?.vehicle) {
      return null;
    }

    const { id: vehicleId, capacity, driver, plateNumber, make, model } = route.vehicle;
    const label = make || model ? `${make || ''} ${model || ''}`.trim() : plateNumber || vehicleId;

    return {
      id: plateNumber || vehicleId,
      capacity: capacity || 0,
      driver: driver?.name || route.driverName || 'Assigned Driver',
      label,
    };
  }, [route]);

  const handleOpenInGoogleMaps = () => {
    const url = buildGoogleMapsUrl(mapRoute);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };
  const isVirtualRoute = Boolean(route?.isVirtual);


  const completedStops = stops.filter(stop => stop.completedAt || stop.pickedUp).length;
  const totalStops = stops.length;
  const progress = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#f3684e]" />
          <p className="text-sm text-muted-foreground">Loading route details…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4">
        <div className={cn(
          'rounded-xl border p-6 text-center',
          isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
        )}>
          <AlertTriangle className={cn('mx-auto mb-3 h-10 w-10', isDark ? 'text-yellow-400' : 'text-yellow-500')} />
          <h2 className={cn('text-lg font-semibold mb-1', isDark ? 'text-gray-100' : 'text-gray-900')}>
            Route Unavailable
          </h2>
          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  // If no ID param, show list of today's routes
  if (!id) {
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
                <RouteIcon className="w-5 h-5 text-[#f3684e]" />
              </div>
              <div>
                <h1 className={cn(
                  "text-2xl font-bold",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  Today&apos;s Routes
                </h1>
                <p className={cn(
                  "text-sm",
                  isDark ? "text-gray-400" : "text-gray-600"
                )}>
                  {routes.length} active {routes.length === 1 ? 'route' : 'routes'}
                </p>
              </div>
            </div>
          </div>

          {/* Routes List */}
          {routes.length > 0 ? (
            <div className="space-y-3">
              {routes.map((r) => {
                const stopCount = r.stops?.length || 0;
                const completedCount = r.stops?.filter(s => s.completedAt || s.pickedUp).length || 0;
                const progressPct = stopCount > 0 ? Math.round((completedCount / stopCount) * 100) : 0;

                return (
                  <button
                    key={r.id}
                    onClick={() => navigate(`/driver/route/${r.id}`, {
                      state: { route: r }
                    })}
                    className={cn(
                      "w-full rounded-2xl border p-5 text-left transition-all hover:shadow-lg",
                      isDark
                        ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className={cn(
                          "text-lg font-semibold mb-1",
                          isDark ? "text-white" : "text-gray-900"
                        )}>
                          {r.name || `Route ${r.id.slice(0, 8)}`}
                        </h3>
                        <p className={cn(
                          "text-sm flex items-center gap-2 mb-2",
                          isDark ? "text-gray-400" : "text-gray-600"
                        )}>
                          <MapPin className="h-4 w-4" />
                          {stopCount} {stopCount === 1 ? 'stop' : 'stops'}
                          {r.vehicle?.plateNumber && ` • ${r.vehicle.plateNumber}`}
                        </p>
                        {r.startTime && (
                          <p className={cn(
                            "text-sm flex items-center gap-2",
                            isDark ? "text-gray-400" : "text-gray-600"
                          )}>
                            <Clock className="h-4 w-4" />
                            {new Date(r.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-semibold",
                          progressPct === 100
                            ? "bg-green-500/10 text-green-400"
                            : "bg-blue-500/10 text-blue-400"
                        )}>
                          {progressPct}% Complete
                        </div>
                        <ArrowRight className={cn(
                          "h-5 w-5",
                          isDark ? "text-gray-500" : "text-gray-400"
                        )} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className={cn(
              "rounded-2xl border p-12 text-center",
              isDark
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white border-gray-200"
            )}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                <RouteIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className={cn(
                "text-lg font-semibold mb-2",
                isDark ? "text-gray-200" : "text-gray-900"
              )}>
                No active routes for today
              </h3>
              <p className={cn(
                "text-sm",
                isDark ? "text-gray-400" : "text-gray-600"
              )}>
                Check the Routes tab to see all your scheduled routes.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!route) {
    return null;
  }

  return (
    <div className="py-4 space-y-4">
      {/* Route Header */}
      <div className={cn(
        'rounded-2xl border p-5',
        isDark ? 'bg-gray-900/60 border-gray-700' : 'bg-white border-gray-200'
      )}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <p className={cn('text-xs uppercase tracking-wide mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
              Route Details
            </p>
            <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
              {route.name || `Route ${route.id.slice(0, 8)}`}
            </h2>
            <p className={cn('mt-1 text-sm flex items-center gap-2', isDark ? 'text-gray-300' : 'text-gray-600')}>
              <RouteIcon className="h-4 w-4" />
              {totalStops} stops • {route.vehicle?.plateNumber || 'No shuttle assigned'}
            </p>
          </div>
          
          {/* Progress Badge */}
          <div className={cn(
            'rounded-xl px-4 py-3 text-right',
            progress === 100
              ? isDark ? 'bg-green-500/10 text-green-200' : 'bg-green-50 text-green-700'
              : isDark ? 'bg-blue-500/10 text-blue-200' : 'bg-blue-50 text-blue-700'
          )}>
            <p className="text-xs font-semibold uppercase">Progress</p>
            <p className="text-lg font-bold">{progress}%</p>
            <p className="text-xs">{completedStops}/{totalStops} stops</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (isVirtualRoute) {
                return;
              }
              navigate(`/driver/navigate/${route.id}/${stops[0]?.id || ''}`, {
                state: { route }
              });
            }}
            disabled={isVirtualRoute}
            className={cn(
              "flex-1 bg-[#f3684e] hover:bg-[#e55a28] text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            <NavigationIcon className="h-4 w-4" />
            Navigate
          </button>
          
          {mapRoute?.coordinates?.length > 0 && (
            <button
              onClick={handleOpenInGoogleMaps}
              className={cn(
                'flex-1 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2',
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              )}
            >
              <ExternalLink className="h-4 w-4" />
              Google Maps
            </button>
          )}
        </div>
      </div>

      {/* Map Preview */}
      <div className={cn(
        'rounded-2xl border overflow-hidden',
        isDark ? 'bg-gray-900/60 border-gray-700' : 'bg-white border-gray-200'
      )}>
        <div className="h-[350px]">
          {mapRoute ? (
            <Suspense
              fallback={(
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#f3684e]" />
                </div>
              )}
            >
              <MapComponent
                selectedRoute={mapRoute}
                selectedShuttle={shuttle}
                initialZoom={12}
                showDirections
                enableOptimization
                currentUserId={session?.user?.id || null}
                mapStyle={mapStyle}
              />
            </Suspense>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center px-4">
              <MapPin className={cn('h-10 w-10', isDark ? 'text-gray-400' : 'text-gray-500')} />
              <div>
                <p className={cn('text-sm font-medium mb-1', isDark ? 'text-gray-300' : 'text-gray-700')}>
                  No Map Available
                </p>
                <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  This route does not have map coordinates yet.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stops List */}
      <div className={cn(
        'rounded-2xl border',
        isDark ? 'bg-gray-900/60 border-gray-700' : 'bg-white border-gray-200'
      )}>
        <div className={cn('border-b px-5 py-4', isDark ? 'border-gray-800' : 'border-gray-100')}>
          <p className={cn('text-sm font-semibold uppercase tracking-wide', isDark ? 'text-gray-300' : 'text-gray-700')}>
            Stop List ({totalStops})
          </p>
        </div>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {stops.map((stop, index) => {
            const isCompleted = stop.completedAt || stop.pickedUp;
            return (
              <li
                key={stop.id || index}
                className={cn(
                  'px-5 py-4 flex items-start gap-3 transition-colors',
                  isCompleted
                    ? isDark
                      ? 'bg-green-500/5'
                      : 'bg-green-50/50'
                    : ''
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold flex-shrink-0',
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isDark
                        ? 'bg-gray-800 text-gray-300'
                        : 'bg-gray-100 text-gray-700'
                  )}
                >
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <p className={cn('font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>
                    {stop.employee?.name || stop.name || `Stop ${index + 1}`}
                  </p>
                  {(stop.address || stop.estimatedArrivalTime) && (
                    <div className={cn('text-sm flex flex-wrap items-center gap-x-3 gap-y-1', isDark ? 'text-gray-400' : 'text-gray-600')}>
                      {stop.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" /> 
                          <span className="truncate">{stop.address}</span>
                        </span>
                      )}
                      {stop.estimatedArrivalTime && (
                        <span className="flex items-center gap-1 flex-shrink-0">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(stop.estimatedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  )}
                  {stop.notes && (
                    <p className={cn('text-xs italic', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      {stop.notes}
                    </p>
                  )}
                  {isCompleted && stop.completedAt && (
                    <p className={cn('text-xs flex items-center gap-1', isDark ? 'text-green-400' : 'text-green-600')}>
                      <CheckCircle2 className="h-3 w-3" />
                      Completed at {new Date(stop.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Route Info */}
      {(route.totalDistance || route.totalTime || route.description) && (
        <div className={cn(
          'rounded-2xl border p-5',
          isDark ? 'bg-gray-900/60 border-gray-700' : 'bg-white border-gray-200'
        )}>
          <p className={cn('text-sm font-semibold uppercase tracking-wide mb-3', isDark ? 'text-gray-300' : 'text-gray-700')}>
            Route Information
          </p>
          <div className="space-y-2 text-sm">
            {route.totalDistance && (
              <div className="flex justify-between">
                <span className={cn(isDark ? 'text-gray-400' : 'text-gray-600')}>Total Distance</span>
                <span className={cn('font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                  {route.totalDistance} km
                </span>
              </div>
            )}
            {route.totalTime && (
              <div className="flex justify-between">
                <span className={cn(isDark ? 'text-gray-400' : 'text-gray-600')}>Estimated Time</span>
                <span className={cn('font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                  {route.totalTime} min
                </span>
              </div>
            )}
            {route.description && (
              <div>
                <span className={cn('block mb-1', isDark ? 'text-gray-400' : 'text-gray-600')}>Description</span>
                <p className={cn(isDark ? 'text-gray-300' : 'text-gray-700')}>
                  {route.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RouteDetailView;
