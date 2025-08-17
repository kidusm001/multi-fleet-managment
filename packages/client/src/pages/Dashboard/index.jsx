import React, { useState, useCallback, useMemo, Suspense, useEffect, useRef } from "react";
import { MapPin, Users, Bus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useTheme } from "@contexts/ThemeContext";
import { ErrorBoundary } from "@components/Common/ErrorBoundary";
import { routeService } from "@services/routeService";

import SearchAndFilter from "./components/SearchAndFilter";
import RouteList from "./components/RouteList";
import StatsCards from "./components/StatsCards";
import RouteDetails from "./components/RouteDetails";
import "./styles.css";

// Lazy load the map component
const MapComponent = React.lazy(() =>
  import("@components/Common/Map/MapComponent")
);

function Dashboard() {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRefreshCounter = useRef(0);

  // Fetch routes data on component mount
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        const routesData = await routeService.getAllRoutes();
        setRoutes(routesData);
        if (routesData.length > 0) {
          setSelectedRoute(routesData[0]); // Set first route as selected
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

  // Transform route for map component using the same approach as RouteManagementView
  const transformRouteForMap = useCallback((route) => {
    if (!route || !route.stops || route.stops.length === 0) return null;

    // Transform route data to match what the MapComponent expects
    return {
      id: route.id,
      coordinates: route.stops
        .map((stop) => [
          stop.longitude || stop.stop?.longitude,
          stop.latitude || stop.stop?.latitude,
        ])
        .filter((coord) => coord[0] && coord[1]), // Filter out invalid coordinates
      areas: route.stops.map((stop) => {
        const employee = stop.employee;
        if (!employee) return "Unassigned Stop";
        return `${employee.name}\n${employee.location || ""}`;
      }),
    };
  }, []);

  // Memoize the transformed route for map component
  const mapRouteData = useMemo(() => {
    return transformRouteForMap(selectedRoute);
  }, [selectedRoute, transformRouteForMap]);

  // Handle map refresh when style or selectedRoute changes
  useEffect(() => {
    // Increment counter to force map component re-render
    mapRefreshCounter.current += 1;
  }, [theme, selectedRoute]);

  // Route selection handler
  const handleRouteSelect = useCallback((route) => {
    setSelectedRoute(route);
  }, []);

  // Toggle details panel
  const toggleRouteDetails = useCallback((e) => {
    if (e) e.stopPropagation();
    setIsDetailsExpanded((prev) => !prev);
  }, []);

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
      value: routes?.filter((r) => r.status === "active").length.toString() || "0",
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
    <div className="relative h-[calc(100vh-60px)] w-11/12 mx-auto">
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
            />
          </div>
        </Suspense>
      </ErrorBoundary>

      {/* Overlay Content */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="grid grid-cols-12 gap-6 p-6 h-full">
          {/* Left Section */}
          <div className="col-span-3 space-y-4 pointer-events-auto relative z-50 h-2/3">
            <SearchAndFilter
              searchQuery={searchQuery}
              onSearchChange={handleSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
            <RouteList
              filteredRoutes={filteredRoutes}
              selectedRoute={selectedRoute}
              handleRouteSelect={handleRouteSelect}
              searchQuery={searchQuery}
              loading={loading}
            />
          </div>

          {/* Top Stats */}
          <div className="col-span-6 pointer-events-none relative z-50">
            <StatsCards stats={stats} />
          </div>
        </div>
      </div>

      {/* Route Details Panel */}
      <AnimatePresence>
        {selectedRoute && (
          <RouteDetails
            selectedRoute={selectedRoute}
            isDetailsExpanded={isDetailsExpanded}
            toggleRouteDetails={toggleRouteDetails}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default React.memo(Dashboard);
