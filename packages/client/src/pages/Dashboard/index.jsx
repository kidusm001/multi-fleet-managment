import React, { useState, useCallback, useMemo, Suspense, useEffect, useRef } from "react";
import { MapPin, Users, Bus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useTheme } from "@contexts/ThemeContext";
import { useAuth } from "@contexts/AuthContext";
import { ErrorBoundary } from "@components/Common/ErrorBoundary";
import { routeService } from "@services/routeService";
import { useViewport } from "@hooks/useViewport";

import SearchAndFilter from "./components/SearchAndFilter";
import RouteList from "./components/RouteList";
import StatsCards from "./components/StatsCards";
import RouteDetails from "./components/RouteDetails";
import MobileDashboardView from "./components/MobileDashboardView";
import TabletDashboardView from "./components/TabletDashboardView";
import "./styles.css";
import { resolveOriginCoordinates, toMapStops, withOrderedStops } from "./utils/sortStops";

// Lazy load the map component
const MapComponent = React.lazy(() =>
  import("@components/Common/Map/MapComponent")
);

function DashboardDesktop() {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const mapRefreshCounter = useRef(0);

  // Fetch routes data on component mount
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        const routesData = await routeService.getAllRoutes();
        setRoutes(routesData);
        if (routesData.length > 0) {
          setSelectedRoute(withOrderedStops(routesData[0]));
        } else {
          setSelectedRoute(null);
        }
      } catch (err) {
        console.error("Error fetching routes:", err);
        // If error is due to no active organization, treat as unassigned (empty routes)
        if (err.message?.includes('Active organization not found') || err.message?.includes('organization')) {
          setRoutes([]);
        } else {
          setError("Failed to fetch routes data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  // Transform route stops to map-compatible format
  const transformRouteForMap = useCallback((route) => {
    if (!route?.stops) return null;

    const originCoords = resolveOriginCoordinates(route);
    const mapStops = toMapStops(route.stops, originCoords);

    const parsedLongitude = Number.parseFloat(route.location?.longitude);
    const parsedLatitude = Number.parseFloat(route.location?.latitude);

    const sanitizedLocation = route.location
      ? {
          ...route.location,
          coords: route.location?.coords || originCoords,
          longitude: Number.isFinite(parsedLongitude)
            ? parsedLongitude
            : originCoords[0],
          latitude: Number.isFinite(parsedLatitude)
            ? parsedLatitude
            : originCoords[1],
          type: route.location?.type || "HQ",
        }
      : {
          coords: originCoords,
          longitude: originCoords[0],
          latitude: originCoords[1],
          type: "HQ",
        };

    return {
      id: route.id,
      coordinates: mapStops.coordinates,
      areas: mapStops.areas,
      employeeUserIds: mapStops.employeeUserIds,
      dropOffOrder: mapStops.coordinates.map((_, index) => index),
      stops: mapStops.coordinates.length,
      passengers: route.stops?.filter((stop) => stop.employee).length || 0,
      status: route.status,
      location: sanitizedLocation,
    };
  }, []);

  // Memoize the transformed route for map component
  const mapRouteData = useMemo(() => {
    return transformRouteForMap(selectedRoute);
  }, [selectedRoute, transformRouteForMap]);

  const selectedShuttleInfo = useMemo(() => {
    if (!selectedRoute) return null;

    const shuttle = selectedRoute.shuttle || selectedRoute.vehicle;
    if (!shuttle) return null;

    const capacityCandidate = shuttle.capacity ?? shuttle.category?.capacity ?? shuttle.seatingCapacity;

    return {
      id: String(shuttle.id || shuttle.name || "shuttle"),
      name: shuttle.name,
      capacity: Number.isFinite(Number(capacityCandidate)) ? Number(capacityCandidate) : 0,
      driver:
        shuttle.driver?.name ||
        shuttle.driverName ||
        selectedRoute.driver?.name ||
        selectedRoute.driverName ||
        null,
    };
  }, [selectedRoute]);

  // Handle map refresh when style or selectedRoute changes
  useEffect(() => {
    // Increment counter to force map component re-render
    mapRefreshCounter.current += 1;
  }, [theme, selectedRoute]);

  // Route selection handler
  const handleRouteSelect = useCallback((route) => {
    setSelectedRoute(route ? withOrderedStops(route) : null);
  }, []);

  // Toggle details panel
  const toggleRouteDetails = useCallback((e) => {
    if (e) e.stopPropagation();
    setIsDetailsExpanded(!isDetailsExpanded);
  }, [isDetailsExpanded]);

  const handleRouteUpdate = useCallback(async () => {
    try {
      const routesData = await routeService.getAllRoutes();
      setRoutes(routesData);
      if (selectedRoute) {
        const updatedRoute = routesData.find(r => r.id === selectedRoute.id);
        if (updatedRoute) {
          setSelectedRoute(withOrderedStops(updatedRoute));
        } else {
          setSelectedRoute(null);
        }
      }
    } catch (err) {
      console.error("Error refreshing routes:", err);
    }
  }, [selectedRoute]);

  // Filter routes
  const filteredRoutes = useMemo(() => {
    if (!routes) return [];
    
    let filtered = routes;

    if (statusFilter !== "all") {
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

  const handleSearch = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  // Dynamically select mapStyle based on theme
  const mapStyle = theme === "dark" 
    ? "mapbox://styles/skywalkertew/cm3gy93ro005g01se5hube11j"
    : "mapbox://styles/skywalkertew/cm3oo0bb3007e01qw3rd7gdcl";

  // Calculate stats from actual route data
  const stats = useMemo(() => [
    {
      title: "Active Routes",
      value: routes?.filter((r) => r.status === "ACTIVE").length.toString() || "0",
      change: "+1",
      icon: <MapPin className="h-5 w-5 text-[#f3684e] dark:text-[#ff965b]" />,
    },
    {
      title: "Total Passengers",
      value: routes?.reduce((sum, route) => 
        sum + (route.stops?.filter(stop => stop.employee)?.length || 0), 0
      ).toString() || "0",
      change: "+12",
      icon: <Users className="h-5 w-5 text-[#f3684e] dark:text-[#ff965b]" />,
    },
    {
      title: "Total Stops",
      value: routes?.reduce((sum, route) => 
        sum + (route.stops?.length || 0), 0
      ).toString() || "0",
      change: "+3",
      icon: <Bus className="h-5 w-5 text-[#f3684e] dark:text-[#ff965b]" />,
    },
  ], [routes]);

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Stats Cards - Outside on mobile, top of desktop */}
      <div className="md:absolute md:top-6 md:left-1/2 md:transform md:-translate-x-1/2 md:z-10 md:pointer-events-none w-full md:w-auto">
        <div className="block md:hidden p-4">
          <StatsCards stats={stats} />
        </div>
        <div className="hidden md:block md:pointer-events-auto">
          <StatsCards stats={stats} />
        </div>
      </div>

      {/* Main Content - Map + Sidebar */}
      <div className="flex-1 relative">
        {/* Main Map Container */}
        <ErrorBoundary fallback={<div>Error loading map</div>}>
          <Suspense
            fallback={
              <div className="map-loading">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f3684e]"></div>
              </div>
            }
          >
            <div className="absolute inset-0 z-0" key={`map-${mapRefreshCounter.current}`}>
              <MapComponent
                selectedRoute={mapRouteData}
                selectedShuttle={selectedShuttleInfo}
                mapStyle={mapStyle}
                initialZoom={11.5}
                enableOptimization
                currentUserId={user?.id}
              />
            </div>
          </Suspense>
        </ErrorBoundary>

        {/* Left Sidebar - Desktop only */}
        <div className="hidden md:block absolute left-6 top-20 bottom-6 w-80 z-10 pointer-events-auto">
          <div className="h-full space-y-4">
            <SearchAndFilter
              searchQuery={searchQuery}
              onSearchChange={handleSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
            <div className="flex-1 overflow-hidden">
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

        {/* Mobile Route Selector - Bottom sheet style */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 z-10 pointer-events-auto">
          <div className="bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 rounded-t-xl">
            <div className="p-4 space-y-3">
              <SearchAndFilter
                searchQuery={searchQuery}
                onSearchChange={handleSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />
              <div className="max-h-32 overflow-y-auto">
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

        {/* Route Details Panel - Desktop only, hidden on mobile */}
        <AnimatePresence>
          {selectedRoute && (
            <div className="hidden md:block">
              <RouteDetails
                selectedRoute={selectedRoute}
                isDetailsExpanded={isDetailsExpanded}
                toggleRouteDetails={toggleRouteDetails}
                onRouteUpdate={handleRouteUpdate}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Main Dashboard Component with Responsive Logic
function Dashboard() {
  const viewport = useViewport();
  const isMobile = viewport === 'mobile';
  const isTablet = viewport === 'tablet';

  // Mobile view: Show mobile-optimized dashboard
  if (isMobile) {
    return <MobileDashboardView />;
  }

  // Tablet view: Show tablet-optimized dashboard (compact sidebar + route details)
  if (isTablet) {
    return <TabletDashboardView />;
  }

  // Desktop view: Show full map-based dashboard
  return <DashboardDesktop />;
}

export default React.memo(Dashboard);
