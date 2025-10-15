import React, { useState, useCallback, useMemo, Suspense, useEffect, useRef } from "react";
import { MapPin, Users, Bus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useTheme } from "@contexts/ThemeContext";
import { useAuth } from "@contexts/AuthContext";
import { useRole } from "@contexts/RoleContext";
import { ErrorBoundary } from "@components/Common/ErrorBoundary";
import { routeService } from "@services/routeService";
import { ROLES } from "@data/constants";

import SearchAndFilter from "./SearchAndFilter";
import RouteList from "./RouteList";
import StatsCards from "./StatsCards";
import RouteDetails from "./RouteDetails";
import "../styles.css";
import { resolveOriginCoordinates, toMapStops, withOrderedStops } from "../utils/sortStops";

// Lazy load the map component
const MapComponent = React.lazy(() =>
  import("@components/Common/Map/MapComponent")
);

/**
 * Tablet Dashboard View
 * Combines best of desktop and mobile:
 * - Full map view like desktop
 * - Compact sidebar for routes (left side)
 * - Stats overlay on map
 * - Collapsible route details (right side, can expand)
 */
function TabletDashboardView() {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();
  const { role: activeRole, userRole: accountRole } = useRole();
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
        setError("Failed to fetch routes data");
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  // Transform route for map component
  const transformRouteForMap = useCallback((route) => {
    if (!route || !Array.isArray(route.stops) || route.stops.length === 0) {
      return null;
    }

    const originCoords = resolveOriginCoordinates(route);
    const mapStops = toMapStops(route.stops, originCoords);

    return {
      id: route.id,
      coordinates: mapStops.coordinates,
      areas: mapStops.areas,
      employeeUserIds: mapStops.employeeUserIds.map((id) => (id == null ? null : String(id))),
      stopNumbers: mapStops.stopNumbers,
      location: route.location,
    };
  }, []);

  // Memoize the transformed route for map component
  const mapRouteData = useMemo(() => {
    return transformRouteForMap(selectedRoute);
  }, [selectedRoute, transformRouteForMap]);

  const mapCurrentUserId = useMemo(() => {
    const normalizedRoles = Array.isArray(user?.roles)
      ? user.roles
          .map((role) => (typeof role === "string" ? role.trim().toLowerCase() : null))
          .filter(Boolean)
      : [];

    const fallbackRole = typeof user?.role === "string" ? user.role.trim().toLowerCase() : null;
    const calculatedRole = activeRole ?? accountRole ?? normalizedRoles.find(Boolean) ?? fallbackRole;

    if (calculatedRole !== ROLES.EMPLOYEE) {
      return null;
    }

    return user?.id != null ? String(user.id) : null;
  }, [activeRole, accountRole, user?.roles, user?.role, user?.id]);

  // Handle map refresh when style or selectedRoute changes
  useEffect(() => {
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

  // Map style based on theme
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
      {/* Stats Cards - Overlay on map, optimized for tablet */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none w-full max-w-4xl px-4">
        <div className="pointer-events-auto">
          <StatsCards stats={stats} />
        </div>
      </div>

      {/* Main Content - Map + Sidebars */}
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
                mapStyle={mapStyle}
                initialZoom={11.5}
                enableOptimization={false}
                currentUserId={mapCurrentUserId}
              />
            </div>
          </Suspense>
        </ErrorBoundary>

        {/* Left Sidebar - Compact for tablet */}
        <div className="absolute left-4 top-20 bottom-4 w-72 z-10 pointer-events-auto">
          <div className="h-full space-y-3">
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

        {/* Route Details Panel - Right side, tablet optimized */}
        <AnimatePresence>
          {selectedRoute && (
            <RouteDetails
              selectedRoute={selectedRoute}
              isDetailsExpanded={isDetailsExpanded}
              toggleRouteDetails={toggleRouteDetails}
              onRouteUpdate={handleRouteUpdate}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default React.memo(TabletDashboardView);
