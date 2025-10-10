import React, { useState, useEffect, useCallback, useMemo, Suspense, useRef } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { routeService } from '@services/routeService';
import { ErrorBoundary } from '@components/Common/ErrorBoundary';
import { MapPin, Users, Bus, Info } from 'lucide-react';
import SearchAndFilter from './SearchAndFilter';
import RouteList from './RouteList';
import StatsCards from './StatsCards';
import MobileRouteDetailsModal from './MobileRouteDetailsModal';

// Lazy load the map component
const MapComponent = React.lazy(() =>
  import('@components/Common/Map/MapComponent')
);

/**
 * Mobile Dashboard View
 * Map-based view with route list - same as desktop but mobile-optimized
 * Shows: Map (top 40%), Stats (overlay), Search/Filter + Routes (bottom 60%)
 */
function MobileDashboardView() {
  const { theme } = useTheme();
  
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const mapRefreshCounter = useRef(0);

  // Fetch routes
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        const routesData = await routeService.getAllRoutes();
        setRoutes(routesData || []);
        if (routesData && routesData.length > 0) {
          setSelectedRoute(routesData[0]); // Select first route
        }
      } catch (err) {
        console.error('Error fetching routes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  // Transform route for map component
  const transformRouteForMap = useCallback((route) => {
    if (!route || !route.stops || route.stops.length === 0) return null;

    return {
      id: route.id,
      coordinates: route.stops
        .map((stop) => [
          stop.longitude || stop.stop?.longitude,
          stop.latitude || stop.stop?.latitude,
        ])
        .filter((coord) => coord[0] && coord[1]),
      areas: route.stops.map((stop) => {
        const employee = stop.employee;
        if (!employee) return 'Unassigned Stop';
        return `${employee.name}\n${employee.location || ''}`;
      }),
    };
  }, []);

  // Map route data
  const mapRouteData = useMemo(() => {
    return transformRouteForMap(selectedRoute);
  }, [selectedRoute, transformRouteForMap]);

  // Handle map refresh when theme or route changes
  useEffect(() => {
    mapRefreshCounter.current += 1;
  }, [theme, selectedRoute]);

  // Route selection handler
  const handleRouteSelect = useCallback((route) => {
    setSelectedRoute(route);
  }, []);

  // Handle route update after status change
  const handleRouteUpdate = useCallback(async () => {
    try {
      const routesData = await routeService.getAllRoutes();
      setRoutes(routesData || []);
      // Update selected route with fresh data
      if (selectedRoute) {
        const updatedRoute = routesData.find(r => r.id === selectedRoute.id);
        if (updatedRoute) {
          setSelectedRoute(updatedRoute);
        }
      }
    } catch (err) {
      console.error('Error refreshing routes:', err);
    }
  }, [selectedRoute]);

  // Search handler
  const handleSearch = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  // Filter routes based on search and status
  const filteredRoutes = useMemo(() => {
    if (!routes) return [];
    
    let filtered = routes;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((route) => route.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((route) => {
        if (route.name?.toLowerCase().includes(query)) return true;
        if (route.shuttle?.name?.toLowerCase().includes(query)) return true;
        if (route.status?.toLowerCase().includes(query)) return true;
        if (route.stops?.some(stop => 
          stop.employee?.name?.toLowerCase().includes(query) ||
          stop.employee?.location?.toLowerCase().includes(query)
        )) return true;
        if (route.id.toString().toLowerCase().includes(query)) return true;
        return false;
      });
    }

    return filtered;
  }, [routes, searchQuery, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => [
    {
      title: 'Active Routes',
      value: routes?.filter((r) => r.status === 'ACTIVE').length.toString() || '0',
      change: '+1',
      icon: <MapPin className="h-5 w-5 text-[#f3684e] dark:text-[#ff965b]" />,
    },
    {
      title: 'Total Passengers',
      value: routes?.reduce((sum, route) => 
        sum + (route.stops?.filter(stop => stop.employee)?.length || 0), 0
      ).toString() || '0',
      change: '+12',
      icon: <Users className="h-5 w-5 text-[#f3684e] dark:text-[#ff965b]" />,
    },
    {
      title: 'Total Stops',
      value: routes?.reduce((sum, route) => 
        sum + (route.stops?.length || 0), 0
      ).toString() || '0',
      change: '+3',
      icon: <Bus className="h-5 w-5 text-[#f3684e] dark:text-[#ff965b]" />,
    },
  ], [routes]);

  // Map style based on theme
  const mapStyle = theme === 'dark' 
    ? 'mapbox://styles/skywalkertew/cm3gy93ro005g01se5hube11j'
    : 'mapbox://styles/skywalkertew/cm3oo0bb3007e01qw3rd7gdcl';

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Map Container - 75% of available space */}
      <div className="relative flex-[3] min-h-[400px]">
        <ErrorBoundary fallback={<div>Error loading map</div>}>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f3684e]"></div>
              </div>
            }
          >
            <div className="absolute inset-0" key={`map-${mapRefreshCounter.current}`}>
              <MapComponent
                selectedRoute={mapRouteData}
                mapStyle={mapStyle}
                initialZoom={11.5}
              />
            </div>
          </Suspense>
        </ErrorBoundary>

        {/* Stats Overlay on Map */}
        <div className="absolute top-2 left-0 right-0 z-10 pointer-events-none">
          <div className="pointer-events-auto px-2">
            <StatsCards stats={stats} />
          </div>
        </div>

        {/* Floating Route Details Button */}
        {selectedRoute && (
          <button
            onClick={() => setIsDetailsModalOpen(true)}
            className="absolute bottom-4 right-4 z-20 bg-[#f3684e] hover:bg-[#e05a42] dark:bg-[#ff965b] dark:hover:bg-[#ff8547] text-white rounded-full p-3 shadow-lg transition-all active:scale-95 flex items-center gap-2"
          >
            <Info className="w-5 h-5" />
            <span className="text-sm font-medium pr-1">Route Details</span>
          </button>
        )}
      </div>

      {/* Route List Container - Fixed height for 5 routes */}
      <div className="bg-white dark:bg-gray-900 overflow-hidden">
        <div className="flex flex-col">
          {/* Search and Filter - Fixed */}
          <div className="flex-shrink-0 p-4 pb-2">
            <SearchAndFilter
              searchQuery={searchQuery}
              onSearchChange={handleSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
          </div>

          {/* Route List - Fixed height for 5 routes, then scroll */}
          <div className="px-4 pb-4" style={{ height: '600px' }}>
            <div className="h-full overflow-y-auto">
              <RouteList
                filteredRoutes={filteredRoutes}
                selectedRoute={selectedRoute}
                handleRouteSelect={handleRouteSelect}
                searchQuery={searchQuery}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Route Details Modal */}
      <MobileRouteDetailsModal
        selectedRoute={selectedRoute}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onRouteUpdate={handleRouteUpdate}
      />
    </div>
  );
}

export default MobileDashboardView;
