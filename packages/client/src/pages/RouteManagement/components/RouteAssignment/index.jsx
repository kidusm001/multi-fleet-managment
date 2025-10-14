import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/Common/UI/Badge";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import Controls from "./Controls";
import DataSection from "./DataSection";
import { shuttleService } from "@/services/shuttleService";
import { shiftService } from "@/services/shiftService";
import { getUnassignedEmployeesByShift, getRoutesByShift } from "@/services/api";
import { toast } from "sonner";
import LoadingAnimation from "@/components/Common/LoadingAnimation";
import { withOrderedStops } from "../../../Dashboard/utils/sortStops";

function RouteAssignment({ refreshTrigger }) {
  const navigate = useNavigate();
  // sonner toast imported globally
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    unassignedInShift: 0,
    totalRoutes: 0,
    availableSeats: 0,
  });
  const [_shuttles, setShuttles] = useState([]);

  const fetchShifts = useCallback(async () => {
    try {
      const shiftsData = await shiftService.getAllShifts();
      const formattedShifts = shiftsData.map((shift) => ({
        ...shift,
        startTime: new Date(shift.startTime).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        endTime: new Date(shift.endTime).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      }));
      setShifts(formattedShifts);
    } catch (err) {
      console.error("Error fetching shifts:", err);
      toast.error("Failed to load shifts. Please try again.");
    }
  }, []);

  const fetchRoutesAndStats = useCallback(async () => {
    if (!selectedShift) {
      setRoutes([]);
      setShuttles([]);
      setStats({
        unassignedInShift: 0,
        totalRoutes: 0,
        availableSeats: 0,
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Validate selectedShift is a valid string ID
      if (!selectedShift || typeof selectedShift !== 'string' || selectedShift.trim() === '' || selectedShift === 'NaN') {
        throw new Error("Invalid shift ID");
      }

      const [employeesResponse, routesResponse] = await Promise.all([
        getUnassignedEmployeesByShift(selectedShift),
        getRoutesByShift(selectedShift),
      ]);

      const routes = routesResponse.data;
      let totalAvailableSeats = 0;

      try {
        const shuttlesData = await shuttleService.getShuttles();
        setShuttles(shuttlesData); // Store shuttles data for use in availableRoutes filter
        
        // Transform routes to include shuttle property (backend returns 'vehicle')
        const transformedRoutes = routes.map(route => ({
          ...route,
          shuttle: route.vehicle || shuttlesData.find((s) => s.id === route.vehicleId)
        }));

        const normalizedRoutes = transformedRoutes.map((route) => withOrderedStops(route));
        
        for (const route of transformedRoutes) {
          const shuttleCapacity = route.shuttle?.capacity || route.shuttle?.category?.capacity;
          if (shuttleCapacity) {
            const assignedCount =
              route.stops?.reduce(
                (count, stop) => (stop.employee ? count + 1 : count),
                0
              ) || 0;
            totalAvailableSeats += Math.max(0, shuttleCapacity - assignedCount);
          }
        }
        setStats({
          unassignedInShift: employeesResponse.data.length,
          totalRoutes: normalizedRoutes.length,
          availableSeats: totalAvailableSeats,
        });
        
        setRoutes(normalizedRoutes);
      } catch (err) {
        toast.warning("Error calculating available seats");
        setShuttles([]); // Clear shuttles on error
        // Still set routes even if shuttle data fails, but with vehicle as shuttle
        const transformedRoutes = routes.map(route => ({
          ...route,
          shuttle: route.vehicle
        }));
        setRoutes(transformedRoutes.map((route) => withOrderedStops(route)));
      }
    } catch (err) {
      setError("Failed to load routes. Please try again.");
      setRoutes([]);
      toast.error("Failed to load routes");
    } finally {
      setLoading(false);
    }
  }, [selectedShift]);

  // Fetch shifts on component mount and when refresh triggered
  useEffect(() => {
    fetchShifts();
  }, [fetchShifts, refreshTrigger]);

  // Fetch routes and stats when shift is selected or when refresh triggered
  useEffect(() => {
    fetchRoutesAndStats();
  }, [fetchRoutesAndStats, refreshTrigger]);

  // Add: filter out routes that are full based on stops count vs shuttle capacity
  // Also filter by location if one is selected
  const availableRoutes = routes.filter((route) => {
    const shuttleCapacity = route.shuttle?.capacity || route.shuttle?.category?.capacity;
    if (!shuttleCapacity) {
      return true; // Include routes without shuttle data to avoid crashes
    }
    const hasCapacity = route.stops.length < shuttleCapacity;
    
    // Filter by location if one is selected
    if (selectedLocation) {
      const matchesLocation = String(route.locationId) === String(selectedLocation);
      return hasCapacity && matchesLocation;
    }
    
    return hasCapacity;
  });

  const _handleCreateNewRoute = () => {
    navigate("/route-management/create", {
      state: { selectedShift },
    });
  };

  const handleRouteUpdate = (updatedRoute) => {
    const normalizedRoute = withOrderedStops(updatedRoute);
    setRoutes(routes.map((r) => (r.id === normalizedRoute.id ? normalizedRoute : r)));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen flex-col gap-3">
        <LoadingAnimation />
        <p>Loading route assignments...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1440px] mx-auto p-4 md:p-8">
        <div className="mb-6 md:mb-10">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-2">
                Route Assignment
              </h2>
              {selectedShift && selectedTime && (
                <p className="text-muted-foreground text-sm md:text-base">
                  {shifts.find((s) => s.id === selectedShift)?.name} -{" "}
                  {selectedTime}
                </p>
              )}
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 md:gap-8 bg-white dark:bg-card rounded-2xl md:rounded-3xl shadow-sm p-4 md:p-8 border border-gray-200/50 dark:border-border/50">
            <Controls
              selectedShift={selectedShift}
              setSelectedShift={setSelectedShift}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
              selectedRoute={selectedRoute}
              setSelectedRoute={setSelectedRoute}
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
              routes={routes}
              shifts={shifts}
              loading={loading}
              stats={stats}
            />
            <DataSection
              selectedShift={selectedShift}
              selectedTime={selectedTime}
              selectedRoute={selectedRoute}
              routes={routes}
              loading={loading}
              onRouteUpdate={handleRouteUpdate}
            />

            {/* Available Routes List - using filtered availableRoutes */}
            <div className="lg:col-span-2 mt-6 lg:mt-0">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-medium text-base md:text-lg">Available Routes</h5>
                <Badge variant="outline" className="text-orange-500">
                  {availableRoutes.length} routes
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {availableRoutes.map((routeOption) => {
                  const shuttleCapacity = routeOption.shuttle?.capacity || routeOption.shuttle?.category?.capacity || 0;
                  const shuttleName = routeOption.shuttle?.name || routeOption.shuttle?.plateNumber || 'Unknown Vehicle';
                  
                  return (
                    <button
                      key={routeOption.id}
                      className={cn(
                        "p-3 md:p-4 rounded-xl border transition-all duration-200 text-left",
                        selectedRoute?.id === routeOption.id
                          ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600"
                      )}
                      onClick={() => setSelectedRoute(withOrderedStops(routeOption))}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">{routeOption.name}</Badge>
                        <Badge className="bg-orange-100 text-orange-700 text-xs">
                          {shuttleName}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span className="text-xs md:text-sm">
                          {routeOption.stops.length} / {shuttleCapacity} Passengers
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

RouteAssignment.propTypes = {
  refreshTrigger: PropTypes.any,
};

export default RouteAssignment;
