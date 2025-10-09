import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { X, ChevronDown, MapPin, Clock, Users, Plus } from "lucide-react";
import { Badge } from "@/components/Common/UI/Badge";
import { Button } from "@/components/Common/UI/Button";
import LoadingWrapper from "@/components/Common/LoadingAnimation/LoadingWrapper";
import Map from "@/components/Common/Map/MapComponent";
// migrated from custom useToast to sonner
import { toast } from "sonner";
import { MAP_CONFIG } from "@/data/constants";
import { optimizeRoute } from "@/services/routeOptimization";
import { cn } from "@/lib/utils";

import styles from "./AssignmentModal.module.css";

const formatAddress = (address) => {
  if (!address || typeof address !== "string") return "";
  return address.replace(/,?\s*Ethiopia$/i, "").trim();
};

const buildStopDisplayName = (stop) => {
  if (!stop) return "";
  const primary = formatAddress(
    stop.employee?.stop?.address || stop.employee?.area || stop.location || stop.area
  );
  const employeeName = stop.employee?.name;

  if (employeeName) {
    return primary ? `${employeeName} (${primary})` : employeeName;
  }

  return primary || "";
};

const AssignmentModal = ({ employee, routes, onClose, onAssign, show }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [routeMetrics, setRouteMetrics] = useState(null);
  const [isStopsExpanded, setIsStopsExpanded] = useState(false);

  const employeeStopAddress = formatAddress(
    employee.stop?.address || employee.area || employee.location
  );
  const employeeWorkAddress = formatAddress(employee.workLocation?.address);
  const employeeFallbackLocation = formatAddress(employee.location);
  const displayStopAddress = employeeStopAddress || employeeFallbackLocation;
  const displayWorkAddress = employeeWorkAddress || employeeFallbackLocation;
  const { employeeStopForOptimization, mapNewStop, mapCenter } = useMemo(() => {
    const hasStopCoordinates =
      employee.stopId &&
      employee.stop &&
      typeof employee.stop.latitude === "number" &&
      typeof employee.stop.longitude === "number";

    const hasWorkCoordinates =
      employee.workLocation &&
      typeof employee.workLocation.latitude === "number" &&
      typeof employee.workLocation.longitude === "number";

    const computedStop = hasStopCoordinates
      ? {
          id: employee.stopId,
          latitude: employee.stop.latitude,
          longitude: employee.stop.longitude,
          location: displayStopAddress,
          area: displayStopAddress,
          displayName: displayStopAddress
            ? `${employee.name} (${displayStopAddress})`
            : employee.name,
          isNew: true,
        }
      : hasWorkCoordinates
      ? {
          id: `worklocation-${employee.id}`,
          latitude: employee.workLocation.latitude,
          longitude: employee.workLocation.longitude,
          location: displayWorkAddress,
          area: displayWorkAddress,
          displayName: displayWorkAddress
            ? `${employee.name} (${displayWorkAddress})`
            : `${employee.name} (Work Location)`,
          isNew: true,
        }
      : null;

    const center = computedStop
      ? [computedStop.longitude, computedStop.latitude]
      : MAP_CONFIG.HQ_LOCATION.coords;

    const computedMapStop = computedStop
      ? {
          latitude: computedStop.latitude,
          longitude: computedStop.longitude,
          name:
            computedStop.displayName ||
            computedStop.location ||
            employee.name,
          isNew: true,
        }
      : null;

    return {
      employeeStopForOptimization: computedStop,
      mapNewStop: computedMapStop,
      mapCenter: center,
    };
  }, [employee, displayStopAddress, displayWorkAddress]);

  const primaryLocationLabel =
    displayStopAddress || displayWorkAddress || employeeFallbackLocation || "Location unavailable";

  useEffect(() => {
    if (show) {
      document.body.classList.add("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [show]);

  useEffect(() => {
    if (!show || !selectedRoute) return;

    const calculateOptimalRoute = async () => {
      setIsLoading(true);
      try {
        if (!employeeStopForOptimization) {
          throw new Error(
            "Employee must have a valid stop location or work location"
          );
        }

        const allStops = [
          ...selectedRoute.stops.map((stop) => {
            const displayName = buildStopDisplayName(stop);
            const normalizedLocation = formatAddress(
              stop.location || stop.area || stop.employee?.area
            );

            return {
              ...stop,
              displayName: displayName || normalizedLocation,
              area: normalizedLocation || displayName,
              location: normalizedLocation || displayName,
            };
          }),
          employeeStopForOptimization,
        ];

        // Filter out stops without valid coordinates
        const validStops = allStops.filter(
          (stop) => stop.latitude && stop.longitude
        );

        if (validStops.length === 0) {
          throw new Error("No valid stops found");
        }

        // Prepare data for optimization
        const routeForOptimization = {
          coordinates: validStops.map((stop) => [
            stop.longitude,
            stop.latitude,
          ]),
          areas: validStops.map((stop) => stop.displayName || stop.area || stop.location || ""),
        };

        // Optimize the route
        const optimized = await optimizeRoute(routeForOptimization);

        // Create the optimized route data
        const optimizedRouteData = {
          id: selectedRoute.id,
          coordinates: optimized.coordinates,
          areas: optimized.areas.map(formatAddress),
          stops: validStops,
          status: "preview",
        };

        // Calculate metrics for optimized route
        let totalDistance = 0;
        for (let i = 0; i < optimized.coordinates.length - 1; i++) {
          const [lon1, lat1] = optimized.coordinates[i];
          const [lon2, lat2] = optimized.coordinates[i + 1];

          // Haversine formula for approximate distance
          const R = 6371; // Earth's radius in km
          const dLat = ((lat2 - lat1) * Math.PI) / 180;
          const dLon = ((lon2 - lon1) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
              Math.cos((lat2 * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          totalDistance += R * c;
        }

        // Estimate time based on average speed of 30 km/h
        const estimatedTime = Math.ceil((totalDistance / 30) * 60); // Convert to minutes

        setRouteMetrics({
          totalDistance: parseFloat(totalDistance.toFixed(2)),
          totalTime: estimatedTime,
        });

        setOptimizedRoute(optimizedRouteData);
      } catch (error) {
        toast.error("Failed to create route preview: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    calculateOptimalRoute();
  }, [
    selectedRoute,
    show,
    employee,
    displayStopAddress,
    displayWorkAddress,
    employeeStopForOptimization,
  ]);

  const handleConfirm = async () => {
    if (!selectedRoute || !employee) return;

    try {
      // Validate employee has either a stop or workLocation
      if ((!employee.stopId || !employee.stop) && !employee.workLocation) {
        throw new Error("Employee must have a valid stop location or work location to be assigned to a route.");
      }

      // Ensure we have route metrics
      if (!routeMetrics) {
        throw new Error("Route metrics not calculated");
      }

      await onAssign(selectedRoute.id, employee.id, routeMetrics);
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to assign employee to route");
    }
  };

  if (!show) return null;

  // Filter out routes that are at full capacity
  const availableRoutes = routes.filter(route => 
    route.stops.length < route.shuttle.capacity
  );

  // Update the no routes check to use availableRoutes
  if (availableRoutes.length === 0) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.header}>
            <h3 className={styles.title}>No Available Routes</h3>
            <button onClick={onClose} className={styles.closeButton}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className={styles.content}>
            <div className="flex flex-col items-center justify-center p-8">
              <div className="text-center mb-4">
                <p className="text-lg font-medium mb-2">
                  There are no routes with available capacity
                </p>
                <p className="text-muted-foreground">
                  Please create a new route or wait for capacity to become available
                </p>
              </div>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LoadingWrapper isLoading={isLoading}>
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h3 className={styles.title}>Assign Employee to Route</h3>
              <p className={styles.subtitle}>
                Review and confirm the assignment
              </p>
            </div>
            <button onClick={onClose} className={styles.closeButton}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className={styles.content}>
            <div className={styles.contentGrid}>
              {/* Map Section - Left Side */}
              <div className={styles.mapSection}>
                <div className={styles.mapContainer}>
                  {selectedRoute && optimizedRoute ? (
                    <Map
                      key={selectedRoute.id}
                      selectedRoute={{
                        id: optimizedRoute.id,
                        coordinates: optimizedRoute.coordinates,
                        areas: optimizedRoute.areas,
                        dropOffOrder: optimizedRoute.stops.map((_, i) => i),
                        stops: optimizedRoute.stops.length,
                        passengers: optimizedRoute.stops.filter((stop) => stop.employee).length,
                        status: optimizedRoute.status,
                      }}
                      selectedShuttle={selectedRoute?.shuttle}
                      center={mapCenter}
                      zoom={11}
                      showDirections={true}
                      isLoading={isLoading}
                      newStop={mapNewStop}
                    />
                  ) : (
                    <Map
                      center={mapCenter}
                      zoom={11}
                      showDirections={false}
                      isLoading={false}
                      newStop={mapNewStop}
                    />
                  )}
                </div>
              </div>

              {/* Routes Section - Right Side */}
              <div className={styles.routesSection}>
                {/* Employee Info */}
                <div className={styles.employeeInfo}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold truncate">
                      {employee.name}
                    </h4>
                    <Badge className="bg-orange-500 text-white text-sm px-3 py-1 flex-shrink-0">
                      {employee.department.name}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 mt-2">
                    <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span className="truncate">{primaryLocationLabel}</span>
                  </div>
                </div>                {/* Route Metrics */}
                {selectedRoute && routeMetrics && (
                  <div className={styles.routeMetrics}>
                    <div className={styles.metricCard}>
                      <div className="flex items-center gap-2 text-orange-500 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">Total Time</span>
                      </div>
                      <p className="text-2xl font-semibold">
                        {routeMetrics.totalTime}{" "}
                        <span className="text-sm text-gray-500">min</span>
                      </p>
                    </div>
                    <div className={styles.metricCard}>
                      <div className="flex items-center gap-2 text-orange-500 mb-1">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">Distance</span>
                      </div>
                      <p className="text-2xl font-semibold">
                        {routeMetrics.totalDistance}{" "}
                        <span className="text-sm text-gray-500">km</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Stops List */}
                {selectedRoute && (
                  <div className={styles.stopsContainer}>
                    <button
                      onClick={() => setIsStopsExpanded(!isStopsExpanded)}
                      className={styles.stopsHeader}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">Route Stops</span>
                        <Badge className="bg-orange-100 text-orange-500">
                          {selectedRoute.stops.length + 1}
                        </Badge>
                      </div>
                      <ChevronDown
                        className={cn("w-4 h-4 transition-transform", {
                          "rotate-180": isStopsExpanded,
                        })}
                      />
                    </button>

                    {isStopsExpanded && (
                      <div className={styles.stopsList}>
                        <div className={styles.stopsGrid}>
                          {selectedRoute.stops.map((stop, index) => (
                            <div key={stop.id} className={styles.stopItem}>
                              <span className={styles.stopNumber}>
                                {index + 1}
                              </span>
                              <span className={styles.stopLocation}>
                                {buildStopDisplayName(stop) ||
                                  formatAddress(stop.location || stop.area)}
                              </span>
                            </div>
                          ))}
                          <div className={styles.newStop}>
                            <span className={styles.newStopIcon}>
                              <Plus className="w-3 h-3" />
                            </span>
                            <span className={styles.stopLocation}>
                              {employeeStopForOptimization?.displayName ||
                                `${employee.name} (Work Location)`}
                            </span>
                            <Badge className={styles.newBadge}>New</Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Available Routes List */}
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
                            {routeOption.stops.length} /{" "}
                            {routeOption.shuttle.capacity} Passengers
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isLoading || !selectedRoute}
                className={styles.confirmButton}
              >
                Confirm Assignment
              </Button>
            </div>
          </div>
        </div>
      </div>
    </LoadingWrapper>
  );
};

AssignmentModal.propTypes = {
  employee: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    stopId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    stop: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      latitude: PropTypes.number,
      longitude: PropTypes.number,
      address: PropTypes.string,
    }),
    workLocation: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      latitude: PropTypes.number,
      longitude: PropTypes.number,
      address: PropTypes.string,
      type: PropTypes.string,
    }),
    department: PropTypes.shape({
        name: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  routes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      shuttle: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
        name: PropTypes.string.isRequired,
        capacity: PropTypes.number.isRequired,
      }).isRequired,
      stops: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired,
          location: PropTypes.string,
          latitude: PropTypes.number,
          longitude: PropTypes.number,
        })
      ).isRequired,
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
  onAssign: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
};

export default AssignmentModal;
