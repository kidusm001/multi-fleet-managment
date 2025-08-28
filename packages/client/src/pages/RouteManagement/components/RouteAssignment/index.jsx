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
import styles from "./RouteAssignment.module.css";

function RouteAssignment({ refreshTrigger }) {
  const navigate = useNavigate();
  // sonner toast imported globally
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [routes, setRoutes] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    unassignedInShift: 0,
    totalRoutes: 0,
    availableSeats: 0,
  });

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
      const shiftId = Number(selectedShift);
      if (isNaN(shiftId)) throw new Error("Invalid shift ID");

      const [employeesResponse, routesResponse] = await Promise.all([
        getUnassignedEmployeesByShift(shiftId),
        getRoutesByShift(shiftId),
      ]);

      const routes = routesResponse.data;
      let totalAvailableSeats = 0;

      try {
        const shuttles = await shuttleService.getShuttles();
        for (const route of routes) {
          const shuttle = shuttles.find((s) => s.id === route.shuttleId);
          if (shuttle?.capacity) {
            const assignedCount =
              route.stops?.reduce(
                (count, stop) => (stop.employee ? count + 1 : count),
                0
              ) || 0;
            totalAvailableSeats += Math.max(0, shuttle.capacity - assignedCount);
          }
        }
        setStats({
          unassignedInShift: employeesResponse.data.length,
          totalRoutes: routesResponse.data.length,
          availableSeats: totalAvailableSeats,
        });
      } catch (err) {
        toast.warning("Error calculating available seats");
      }
      
      setRoutes(routes);
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
  const availableRoutes = routes.filter(
    (route) => route.stops.length < route.shuttle.capacity
  );

  const _handleCreateNewRoute = () => {
    navigate("/route-management/create", {
      state: { selectedShift },
    });
  };

  const handleRouteUpdate = (updatedRoute) => {
    setRoutes(routes.map((r) => (r.id === updatedRoute.id ? updatedRoute : r)));
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
      <div className="max-w-[1440px] mx-auto p-8">
        <div className="mb-10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground tracking-tight mb-2">
                Route Assignment
              </h2>
              {selectedShift && selectedTime && (
                <p className="text-muted-foreground">
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
          <div className="grid grid-cols-[350px_1fr] gap-8 bg-white dark:bg-card rounded-3xl shadow-sm p-8 border border-gray-200/50 dark:border-border/50">
            <Controls
              selectedShift={selectedShift}
              setSelectedShift={setSelectedShift}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
              selectedRoute={selectedRoute}
              setSelectedRoute={setSelectedRoute}
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
            <div className={styles.availableRoutes}>
              <div className="flex items-center justify-between">
                <h5 className="font-medium">Available Routes</h5>
                <Badge variant="outline" className="text-orange-500">
                  {availableRoutes.length} routes
                </Badge>
              </div>
              <div className="space-y-2">
                {availableRoutes.map((routeOption) => (
                  <button
                    key={routeOption.id}
                    className={cn(styles.routeOption, {
                      [styles.selected]:
                        selectedRoute?.id === routeOption.id,
                    })}
                    onClick={() => setSelectedRoute(routeOption)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{routeOption.name}</Badge>
                      <Badge className="bg-orange-100 text-orange-500">
                        {routeOption.shuttle.name}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>
                        {routeOption.stops.length} / {routeOption.shuttle.capacity} Passengers
                      </span>
                    </div>
                  </button>
                ))}
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
