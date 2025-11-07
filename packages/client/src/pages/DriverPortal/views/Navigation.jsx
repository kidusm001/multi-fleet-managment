import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Loader2, 
  MapPin, 
  Navigation as NavigationIcon, 
  Route as RouteIcon, 
  AlertTriangle,
  Play,
  ExternalLink,
  ArrowLeft,
  StopCircle,
  CheckCircle2
} from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { driverService } from '@services/driverService';
import { routeCompletionService } from '@services/routeCompletionService';
import { cn } from '@lib/utils';
import { MAP_STYLES } from '@components/Common/Map/config';
import { transformRouteForMap, buildGoogleMapsUrl } from '../utils/mapHelpers';
import { getEffectiveRouteStatus } from '../utils/routeStatus';

const MapComponent = React.lazy(() => import('@components/Common/Map/MapComponent'));

function NavigationView() {
  const { routeId, stopId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { session } = useAuth();
  const isDark = theme === 'dark';

  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);

  const watchIdRef = useRef(null);
  const lastUpdateRef = useRef(0);

  const mapStyle = useMemo(() => {
    const candidate = MAP_STYLES?.[isDark ? 'dark' : 'light'];
    if (candidate && candidate.length > 0) {
      return candidate;
    }
    return isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
  }, [isDark]);

  useEffect(() => {
    if (!routeId) {
      setRoute(null);
      setLoading(false);
      setError('Route id is missing.');
      return;
    }

    let isMounted = true;

    const loadRoute = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await driverService.getRoute(routeId);

        if (!isMounted) {
          return;
        }

        if (!data) {
          setRoute(null);
          setError('Route not found for your account.');
        } else {
          setRoute(data);
        }
      } catch (err) {
        console.error('Failed to load driver route:', err);
        if (isMounted) {
          setError('Unable to load route details right now.');
          setRoute(null);
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
  }, [routeId]);

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

  const currentStop = useMemo(() => {
    if (!stops.length) {
      return null;
    }

    if (stopId) {
      const match = stops.find((stop) => String(stop.id) === String(stopId));
      if (match) {
        return match;
      }
    }

    return stops.find((stop) => !stop.completedAt) || stops[0];
  }, [stops, stopId]);

  const mapRoute = useMemo(() => {
    if (!route) {
      return null;
    }

    return transformRouteForMap({ ...route, stops });
  }, [route, stops]);

  const rawStatus = route ? getEffectiveRouteStatus(route) : 'UPCOMING';
  // In navigation view, treat CANCELLED routes as UPCOMING (they shouldn't be accessible anyway)
  const driverStatus = rawStatus === 'CANCELLED' ? 'UPCOMING' : rawStatus;
  const isRouteActive = driverStatus === 'ACTIVE';
  const isRouteCompleted = driverStatus === 'COMPLETED';
  const isRouteUpcoming = driverStatus === 'UPCOMING';
  // const canStartRoute = isRouteUpcoming || isRouteActive; // Can start if UPCOMING or already ACTIVE
const canStartRoute =  isRouteActive;
  const statusLabel = isRouteCompleted
    ? 'Completed'
    : isRouteActive
    ? 'In Progress'
    : 'Scheduled';
  const StatusIcon = isRouteCompleted ? CheckCircle2 : isRouteActive ? NavigationIcon : RouteIcon;

  const driverLocationMarker = driverLocation
    ? {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        name: 'Current Location',
      }
    : null;

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/driver/routes');
    }
  };

  const handleStopTracking = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
  }, []);

  // GPS Tracking
  useEffect(() => {
    if (!tracking || !route) {
      return undefined;
    }

    if (!('geolocation' in navigator)) {
      setGpsError('GPS is not available on this device.');
      setTracking(false);
      return undefined;
    }

    const handleSuccess = async (position) => {
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };

      setDriverLocation(coords);
      setGpsError(null);

      const now = Date.now();
      const elapsed = now - lastUpdateRef.current;

      if (elapsed >= 10000) {
        lastUpdateRef.current = now;
        try {
          await driverService.updateLocation({
            routeId: route.id,
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            recordedAt: new Date(position.timestamp || Date.now()).toISOString(),
          });
        } catch (err) {
          console.error('Failed to sync driver location', err);
        }
      }
    };

    const handleError = (geoError) => {
      console.error('GPS tracking error:', geoError);
      setGpsError(geoError.message || 'Unable to track GPS.');
      if (geoError.code === geoError.PERMISSION_DENIED) {
        handleStopTracking();
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [tracking, route, handleStopTracking]);

  const handleStartRoute = async () => {
    if (!route) return;

    try {
      setGpsError(null);

      // Ensure the route is marked as active for the driver when tracking begins
      const currentStatus = (route.driverStatus || route.status || '').toUpperCase();
      if (currentStatus !== 'ACTIVE') {
        const updatedRoute = await driverService.updateRouteStatus(route.id, 'ACTIVE');
        setRoute(updatedRoute);
      }

      lastUpdateRef.current = 0;
      setTracking(true);

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            };
            setDriverLocation(coords);
            try {
              await driverService.updateLocation({
                routeId: route.id,
                latitude: coords.latitude,
                longitude: coords.longitude,
                accuracy: coords.accuracy,
                recordedAt: new Date(position.timestamp || Date.now()).toISOString(),
              });
            } catch (err) {
              console.error('Failed to sync initial location', err);
            }
          },
          (geoError) => {
            console.error('Failed to get initial location:', geoError);
            setGpsError(geoError.message || 'Unable to access GPS.');
            setTracking(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          }
        );
      } else {
        setGpsError('GPS is not available on this device.');
        setTracking(false);
      }
    } catch (startError) {
      console.error('Failed to start route:', startError);
      setGpsError('Failed to start route. Please try again.');
      setTracking(false);
    }
  };

  const handleCompleteRoute = async () => {
    if (!route) return;

    try {
      // Update route status to COMPLETED
      const updatedRoute = await driverService.updateRouteStatus(route.id, 'COMPLETED');
      setRoute(updatedRoute);
      
      // Record the route completion
      try {
        await routeCompletionService.completeRoute(route.id);
      } catch (completionError) {
        console.warn('Failed to record route completion:', completionError);
        // Don't fail the whole operation if completion record fails
      }
      
      handleStopTracking();
    } catch (completeError) {
      console.error('Failed to complete route:', completeError);
      setGpsError('Unable to mark the route as completed right now.');
    }
  };

  const handleOpenInGoogleMaps = () => {
    const url = buildGoogleMapsUrl(mapRoute);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const shuttle = useMemo(() => {
    if (!route?.vehicle) {
      return null;
    }

    const { id, capacity, driver, plateNumber, make, model } = route.vehicle;
    const label = make || model ? `${make || ''} ${model || ''}`.trim() : plateNumber || id;

    return {
      id: plateNumber || id,
      capacity: capacity || 0,
      driver: driver?.name || route.driverName || 'Assigned Driver',
      label,
    };
  }, [route]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#f3684e]" />
          <p className="text-sm text-muted-foreground">Loading your route map…</p>
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
            Navigation Unavailable
          </h2>
          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!route) {
    return null;
  }

  return (
    <div className="py-4 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleGoBack}
          className={cn(
            'inline-flex items-center gap-2 self-start rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
            isDark ? 'border-gray-700 bg-gray-900/70 text-gray-200 hover:bg-gray-800' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to routes
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
              isRouteCompleted
                ? 'bg-emerald-500/10 text-emerald-500'
                : isRouteActive
                ? 'bg-blue-500/10 text-blue-500'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            )}
          >
            <StatusIcon className="h-4 w-4" />
            {statusLabel}
          </span>
          {tracking && (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
              <NavigationIcon className="h-4 w-4 animate-pulse" />
              Tracking active
            </span>
          )}
        </div>
      </div>

      <div className={cn(
        'rounded-2xl border overflow-hidden',
        isDark ? 'bg-gray-900/60 border-gray-700' : 'bg-white border-gray-200'
      )}>
        <div className="h-[420px]">
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
                newStop={driverLocationMarker}
              />
            </Suspense>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <MapPin className={cn('h-10 w-10', isDark ? 'text-gray-400' : 'text-gray-500')} />
              <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                This route does not contain map coordinates yet. Please contact dispatch for an updated manifest.
              </p>
            </div>
          )}
        </div>
      </div>

      {gpsError && (
        <div className={cn(
          'rounded-xl border px-4 py-3 text-sm',
          isDark ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'
        )}>
          {gpsError}
        </div>
      )}

      {driverLocation && (
        <div className={cn(
          'rounded-2xl border p-4',
          isDark ? 'bg-gray-900/60 border-gray-700' : 'bg-white border-gray-200'
        )}>
          <p className={cn('text-xs uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')}>
            Last GPS update
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
            <span className={cn('font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
              {new Date(driverLocation.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className={cn('text-xs font-medium uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Lat: {driverLocation.latitude.toFixed(5)}
            </span>
            <span className={cn('text-xs font-medium uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Lng: {driverLocation.longitude.toFixed(5)}
            </span>
            {Number.isFinite(driverLocation.accuracy) && (
              <span className={cn('text-xs font-medium uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-600')}>
                ± {Math.round(driverLocation.accuracy)} m accuracy
              </span>
            )}
          </div>
        </div>
      )}

      <div className={cn(
        'rounded-2xl border p-5 space-y-4',
        isDark ? 'bg-gray-900/60 border-gray-700' : 'bg-white border-gray-200'
      )}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={cn('text-xs uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')}>
              Active Route
            </p>
            <h2 className={cn('mt-1 text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
              {route.name || `Route ${String(route.id).slice(0, 6)}`}
            </h2>
            <p className={cn('mt-1 text-sm flex items-center gap-2', isDark ? 'text-gray-300' : 'text-gray-600')}>
              <RouteIcon className="h-4 w-4" />
              {stops.length} stops • {route.vehicle?.name || 'No shuttle assigned'}
              {route.vehicle?.plateNumber && (
                <span className="text-xs text-gray-500">({route.vehicle.plateNumber})</span>
              )}
            </p>
          </div>
          {currentStop && (
            <div className={cn('rounded-xl px-4 py-3 text-right', isDark ? 'bg-amber-500/10 text-amber-200' : 'bg-amber-50 text-amber-700')}>
              <p className="text-xs font-semibold uppercase">Current Stop</p>
              <p className="text-sm font-medium">
                {currentStop?.employee?.name || currentStop?.name || 'Stop'}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={tracking ? handleStopTracking : handleStartRoute}
            disabled={!canStartRoute && !tracking}
            className={cn(
              'flex-1 rounded-lg px-4 py-3 font-semibold transition-colors flex items-center justify-center gap-2',
              !canStartRoute && !tracking
                ? 'cursor-not-allowed bg-gray-400/40 text-gray-500 dark:bg-gray-800/40 dark:text-gray-600'
                : tracking
                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                : 'bg-[#f3684e] text-white hover:bg-[#e55a28]'
            )}
          >
            {tracking ? <StopCircle className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {tracking ? 'Pause Tracking' : 'Start Route'}
          </button>

          <button
            type="button"
            onClick={handleOpenInGoogleMaps}
            disabled={!mapRoute?.coordinates?.length}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold transition-colors',
              mapRoute?.coordinates?.length
                ? isDark
                  ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'cursor-not-allowed bg-gray-200/60 text-gray-400 dark:bg-gray-800/60 dark:text-gray-600'
            )}
          >
            <ExternalLink className="h-4 w-4" />
            Open in Google Maps
          </button>

          {!isRouteCompleted && (
            <button
              type="button"
              onClick={handleCompleteRoute}
              disabled={!isRouteActive && !tracking}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold transition-colors',
                !isRouteActive && !tracking
                  ? 'cursor-not-allowed bg-gray-400/40 text-gray-500 dark:bg-gray-800/40 dark:text-gray-600'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              Complete Route
            </button>
          )}
        </div>
      </div>

      <div className={cn(
        'rounded-2xl border',
        isDark ? 'bg-gray-900/60 border-gray-700' : 'bg-white border-gray-200'
      )}>
        <div className={cn('border-b px-5 py-4', isDark ? 'border-gray-800' : 'border-gray-100')}>
          <p className={cn('text-sm font-semibold uppercase tracking-wide', isDark ? 'text-gray-300' : 'text-gray-700')}>
            Stop Manifest
          </p>
        </div>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {stops.map((stop, index) => {
            const isActiveStop = currentStop && stop.id === currentStop.id;
            return (
              <li
                key={stop.id || index}
                className={cn(
                  'px-5 py-4 flex items-start gap-3 transition-colors',
                  isActiveStop
                    ? isDark
                      ? 'bg-emerald-500/10'
                      : 'bg-emerald-50'
                    : ''
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                    isActiveStop
                      ? 'bg-emerald-500 text-white'
                      : isDark
                        ? 'bg-gray-800 text-gray-300'
                        : 'bg-gray-100 text-gray-700'
                  )}
                >
                  {index + 1}
                </div>
                <div className="flex-1 space-y-1">
                  <p className={cn('font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                    {stop.employee?.name || stop.name || `Stop ${index + 1}`}
                    {stop.completedAt && (
                      <span className="ml-2 text-xs font-normal text-emerald-500">✓ Completed</span>
                    )}
                  </p>
                  {(stop.address || stop.estimatedArrivalTime) && (
                    <p className={cn('text-sm flex flex-wrap items-center gap-2', isDark ? 'text-gray-400' : 'text-gray-600')}>
                      {stop.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {stop.address}
                        </span>
                      )}
                      {stop.estimatedArrivalTime && (
                        <span className="flex items-center gap-1">
                          <NavigationIcon className="h-3.5 w-3.5" />
                          {new Date(stop.estimatedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </p>
                  )}
                  {stop.notes && (
                    <p className={cn('text-xs italic', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      {stop.notes}
                    </p>
                  )}
                  {tracking && !stop.completedAt && isRouteActive && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await driverService.checkinStop(route.id, stop.id);
                            const updatedRoute = await driverService.getRoute(route.id);
                            setRoute(updatedRoute);
                          } catch (err) {
                            console.error('Failed to mark stop as completed:', err);
                          }
                        }}
                        className={cn(
                          'flex-1 text-xs py-1.5 px-3 rounded-lg font-medium transition-colors',
                          'bg-emerald-500 text-white hover:bg-emerald-600'
                        )}
                      >
                        Mark Dropped
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await driverService.checkinStop(route.id, stop.id, { skipped: true });
                            const updatedRoute = await driverService.getRoute(route.id);
                            setRoute(updatedRoute);
                          } catch (err) {
                            console.error('Failed to skip stop:', err);
                          }
                        }}
                        className={cn(
                          'text-xs py-1.5 px-3 rounded-lg font-medium transition-colors',
                          isDark
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        )}
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default NavigationView;
