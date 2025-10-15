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
import { formatDisplayAddress } from "@/utils/address";
import {
  resolveOriginCoordinates,
  sortStopsBySequence,
  toMapStops,
  withOrderedStops,
} from "../../../Dashboard/utils/sortStops";

import styles from "./AssignmentModal.module.css";

const buildStopDisplayName = (stop) => {
  if (!stop) return "";
  const primary = formatDisplayAddress(
    stop.employee?.stop?.address || stop.employee?.area || stop.location || stop.area
  );
  const employeeName = stop.employee?.name;

  if (employeeName) {
    return primary ? `${employeeName} (${primary})` : employeeName;
  }

  return primary || "";
};

const getStopCoordinates = (stop) => {
  const longitude = stop?.longitude ?? stop?.stop?.longitude;
  const latitude = stop?.latitude ?? stop?.stop?.latitude;

  const lon = typeof longitude === "string" ? Number.parseFloat(longitude) : longitude;
  const lat = typeof latitude === "string" ? Number.parseFloat(latitude) : latitude;

  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    return null;
  }

  return [lon, lat];
};

const AssignmentModal = ({ employee, routes, onClose, onAssign, show }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [routeMetrics, setRouteMetrics] = useState(null);
  const [isStopsExpanded, setIsStopsExpanded] = useState(false);

  const employeeStopAddress = formatDisplayAddress(
    employee.stop?.address || employee.area || employee.location
  );
  const employeeWorkAddress = formatDisplayAddress(employee.workLocation?.address);
  const employeeFallbackLocation = formatDisplayAddress(employee.location);
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

  const fallbackStops = useMemo(() => {
    if (!selectedRoute?.stops) {
      return [];
    }

    return selectedRoute.stops.map((stop, index) => ({
      stop,
      stopNumber: index + 1,
      isNew: false,
      displayLabel:
        buildStopDisplayName(stop) ||
  formatDisplayAddress(stop.location || stop.area || stop.displayName),
    }));
  }, [selectedRoute]);

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

        const existingStops = (selectedRoute.stops || []).map((stop) => {
            const displayName = buildStopDisplayName(stop);
            const normalizedLocation = formatDisplayAddress(
              stop.location || stop.area || stop.employee?.area
            );

            return {
              ...stop,
              displayName: displayName || normalizedLocation,
              area: normalizedLocation || displayName,
              location: normalizedLocation || displayName,
            };
          });

        const employeeStopAsRouteStop = employeeStopForOptimization
          ? {
              ...employeeStopForOptimization,
              employee: {
                ...employee,
                name: employee.name,
                location:
                  displayStopAddress ||
                  displayWorkAddress ||
                  employeeFallbackLocation ||
                  "",
                userId: employee.userId || employee.id,
              },
            }
          : null;

        const allStops = employeeStopAsRouteStop
          ? [...existingStops, employeeStopAsRouteStop]
          : existingStops;

        // Filter out stops without valid coordinates
        const validStops = allStops.filter(
          (stop) => stop.latitude && stop.longitude
        );

        if (validStops.length === 0) {
          throw new Error("No valid stops found");
        }

        const originCoords = resolveOriginCoordinates(selectedRoute);
        const routeLocationLabel = formatDisplayAddress(
          selectedRoute?.location?.address || selectedRoute?.location?.name
        ) || "HQ";

        // Prepare data for optimization
        const dropOffCoordinates = validStops.map((stop) => [
          stop.longitude,
          stop.latitude,
        ]);

        const routeForOptimization = {
          coordinates: [
            originCoords,
            ...dropOffCoordinates,
            originCoords,
          ],
          areas: [
            routeLocationLabel,
            ...validStops.map(
              (stop) => stop.displayName || stop.area || stop.location || ""
            ),
            routeLocationLabel,
          ],
        };

        // Optimize the route
        const optimized = await optimizeRoute(routeForOptimization);

        const mapStops = toMapStops(allStops, originCoords);
        const sortedStops = sortStopsBySequence(allStops, originCoords);

        const mappedStopsWithNumbers = [];
        const unmappedStops = [];

        sortedStops.forEach((stop) => {
          const coordinates = getStopCoordinates(stop);
          const displayLabel =
            buildStopDisplayName(stop) ||
            formatDisplayAddress(stop.location || stop.area || stop.displayName);

          if (coordinates) {
            const mapIndex = mappedStopsWithNumbers.length;
            const stopNumber =
              mapStops.stopNumbers?.[mapIndex] ?? mapIndex + 1;
            mappedStopsWithNumbers.push({
              stop,
              stopNumber,
              isNew: Boolean(stop.isNew),
              displayLabel,
            });
          } else {
            unmappedStops.push({
              stop,
              displayLabel,
              isNew: Boolean(stop.isNew),
              stopNumber: null,
            });
          }
        });

        const optimizedRouteData = {
          id: selectedRoute.id,
          coordinates: mapStops.coordinates,
          areas: mapStops.areas,
          employeeUserIds: mapStops.employeeUserIds,
          stopNumbers: mapStops.stopNumbers,
          orderedStops: mappedStopsWithNumbers,
          unmappedStops,
          stops: mappedStopsWithNumbers.map((entry) => entry.stop),
          passengers: mappedStopsWithNumbers.filter((entry) => entry.stop.employee).length,
          status: "preview",
          location: selectedRoute.location,
        };

        // Calculate metrics for optimized route
        const totalDistance = optimized.metrics?.totalDistance ?? 0;
        const totalTime = optimized.metrics?.totalTime ?? 0;

        setRouteMetrics({
          totalDistance,
          totalTime,
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
    employeeFallbackLocation,
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

  const previewStops = optimizedRoute?.orderedStops ?? [];
  const previewUnmappedStops = optimizedRoute?.unmappedStops ?? [];
  const hasPreviewStops = previewStops.length > 0 || previewUnmappedStops.length > 0;
  const displayStops = hasPreviewStops ? previewStops : fallbackStops;
  const displayUnmappedStops = hasPreviewStops ? previewUnmappedStops : [];
  const fallbackNewStopLabel = hasPreviewStops
    ? null
    : employeeStopForOptimization
    ? employeeStopForOptimization.displayName ||
      employeeStopForOptimization.location ||
      `${employee.name} (Work Location)`
    : null;
  const totalRouteStopCount =
    displayStops.length +
    displayUnmappedStops.length +
    (fallbackNewStopLabel ? 1 : 0);

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
                        stopNumbers: optimizedRoute.stopNumbers,
                        dropOffOrder: Array.isArray(optimizedRoute.stopNumbers)
                          ? optimizedRoute.stopNumbers.map((number) => number - 1)
                          : optimizedRoute.coordinates.map((_, index) => index),
                        stops: optimizedRoute.stops.length,
                        passengers: optimizedRoute.stops.filter((stop) => stop.employee).length,
                        employeeUserIds: optimizedRoute.employeeUserIds,
                        status: optimizedRoute.status,
                        location: optimizedRoute.location,
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
                          {totalRouteStopCount}
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
                          {displayStops.map((entry, index) => (
                            <div
                              key={entry.stop?.id || `ordered-${index}`}
                              className={styles.stopItem}
                            >
                              <span className={styles.stopNumber}>
                                {entry.stopNumber ?? index + 1}
                              </span>
                              <div className="flex w-full items-center justify-between gap-2">
                                <span className={styles.stopLocation}>
                                  {entry.displayLabel || "Location unavailable"}
                                </span>
                                {entry.isNew && (
                                  <Badge className={styles.newBadge}>New</Badge>
                                )}
                              </div>
                            </div>
                          ))}

                          {displayUnmappedStops.map((entry, index) => (
                            <div
                              key={entry.stop?.id || `unmapped-${index}`}
                              className={styles.stopItem}
                            >
                              <span className={styles.stopNumber}>—</span>
                              <div className="flex w-full items-center justify-between gap-2">
                                <span className={styles.stopLocation}>
                                  {entry.displayLabel || "Location needs update"}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="border-orange-200 text-orange-500"
                                >
                                  Location Needed
                                </Badge>
                              </div>
                            </div>
                          ))}

                          {fallbackNewStopLabel && (
                            <div className={styles.newStop}>
                              <span className={styles.newStopIcon}>
                                <Plus className="w-3 h-3" />
                              </span>
                              <span className={styles.stopLocation}>
                                {fallbackNewStopLabel}
                              </span>
                              <Badge className={styles.newBadge}>New</Badge>
                            </div>
                          )}
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
                        onClick={() => setSelectedRoute(withOrderedStops(routeOption))}
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
    location: PropTypes.string,
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
