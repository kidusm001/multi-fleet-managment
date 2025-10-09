import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { X, CheckCircle2, XCircle, MapPin, Clock, Users, Wand2 } from "lucide-react";
import { Badge } from "@/components/Common/UI/Badge";
import { Button } from "@components/Common/UI/Button";
import LoadingWrapper from "@components/Common/LoadingAnimation/LoadingWrapper";
import Map from "@components/Common/Map/MapComponent";
import { toast } from "sonner";
import { MAP_CONFIG } from "@data/constants";
import { Input } from "@/components/Common/UI/Input";
import { optimizeRoute } from "@services/routeOptimization";

import styles from "../styles/ShuttlePreview.module.css";

const ShuttlePreview = ({ routeData, onClose, onAccept, show }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [routeMetrics, setRouteMetrics] = useState(null);

  const { selectedEmployees = [], selectedShift, selectedShuttle } = routeData;

  useEffect(() => {
    if (show) {
      document.body.classList.add("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [show]);

  useEffect(() => {
    if (!show || !selectedEmployees.length) return;

    /**
     * Calculate optimal route using Mapbox Directions API
     * This provides exact travel time and distance metrics
     */
    const calculateOptimalRoute = async () => {
      setIsLoading(true);
      try {
        // Filter out employees without valid stops
        const validEmployees = selectedEmployees.filter(
          (emp) => emp.stop && emp.stop.latitude && emp.stop.longitude
        );

          if (validEmployees.length === 0) {
            throw new Error("No valid employee stops found");
          }

        // Prepare data for optimization including HQ location and employee stops
        const routeForOptimization = {
          coordinates: [
            MAP_CONFIG.HQ_LOCATION.coords, // Start at HQ
            ...validEmployees.map((emp) => [
              emp.stop.longitude,
              emp.stop.latitude,
            ]),
            MAP_CONFIG.HQ_LOCATION.coords, // Return to HQ
          ],
          areas: [
            "HQ",
            ...validEmployees.map((emp) => (emp.stop?.address || emp.location || "Unknown").replace(', Ethiopia', '')),
            "HQ",
          ],
        };

        // Get optimized route with exact Mapbox metrics
        const optimized = await optimizeRoute(routeForOptimization);

        if (!optimized || !optimized.coordinates || !optimized.metrics) {
          throw new Error("Failed to optimize route");
        }

        // Create the optimized route data - use original waypoints to avoid excessive markers
        const optimizedRouteData = {
          id: "preview-route",
          coordinates: optimized.coordinates, // These are the original waypoints
          areas: optimized.areas,
          // Create dropOffOrder based on original waypoints
          dropOffOrder: validEmployees.map((_, i) => i),
          stops: validEmployees.length,
          passengers: validEmployees.length,
          status: "preview",
          // We can use the full route geometry for drawing the route line if needed
          fullRouteGeometry: optimized.fullRouteGeometry
        };

        // Use the exact metrics from Mapbox
        setRouteMetrics({
          totalDistance: optimized.metrics.totalDistance,
          totalTime: optimized.metrics.totalTime,
          // Store raw data for potential future use
          raw: optimized.metrics.rawData
        });

        setOptimizedRoute(optimizedRouteData);
      } catch (error) {
          toast.error("Failed to create route preview: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    calculateOptimalRoute();
    }, [selectedEmployees, show]);

  // Get valid employees (with stops)
  const validEmployees = selectedEmployees.filter(
    (emp) => emp.stop && emp.stop.latitude && emp.stop.longitude
  );

  // Early return if no valid data
  if (!show || !selectedShuttle || !validEmployees.length) {
    return null;
  }

  // Function to generate suggested route name based on furthest location
  const getSuggestedRouteName = () => {
    if (!routeData.selectedEmployees?.length) return "";
    
    // Use company HQ location from environment variables
    const HQ_LOCATION = { 
      lat: parseFloat(import.meta.env.VITE_HQ_LATITUDE || "9.016465390275195"), 
      lng: parseFloat(import.meta.env.VITE_HQ_LONGITUDE || "38.76856893855111")
    };
    
    let furthestDistance = 0;
    let furthestArea = '';
    
    // Find the furthest employee from HQ using Haversine formula
    routeData.selectedEmployees.forEach(employee => {
      if (employee.stop?.latitude && employee.stop?.longitude) {
        const R = 6371; // Earth's radius in km
        const lat1 = HQ_LOCATION.lat * Math.PI / 180;
        const lat2 = employee.stop.latitude * Math.PI / 180;
        const dLat = lat2 - lat1;
        const dLon = (employee.stop.longitude - HQ_LOCATION.lng) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1) * Math.cos(lat2) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        if (distance > furthestDistance) {
          furthestDistance = distance;
          // Use stop address and extract first part (Main District part)
          const fullAddress = (employee.stop?.address || employee.location || '').replace(', Ethiopia', '');
          const addressParts = fullAddress.split(',');
          furthestArea = addressParts.length > 1 ? addressParts[0].trim() : fullAddress;
        }
      }
    });
    
    // Format shift time if available
    const shiftTime = routeData.shiftEndTime 
      ? ` - ${routeData.shiftEndTime.split(':')[0]}${routeData.shiftEndTime.includes('PM') ? 'PM' : ''}`
      : '';
      
    return `${furthestArea}${shiftTime}`;
  };
  
  // Handle name suggestion click with improved feedback
  const handleNameSuggestion = () => {
    const name = getSuggestedRouteName();
    if (name) {
      routeData.setName(name);
    toast.info("Route name has been updated based on the furthest stop.");
    }
  };

  const handleCreateRoute = async () => {
    // Validate route name
    if (!routeData.name.trim()) {
      toast.error("Please enter a route name");
      return;
    }

    // Validate required data
    const validationErrors = [];
    if (!selectedShuttle?.id) {
      validationErrors.push("Missing or invalid shuttle ID");
    }

    if (!selectedShift?.id) {
      validationErrors.push("Missing or invalid shift ID");
    }
    if (!routeData.selectedLocation?.id) {
      validationErrors.push("Missing or invalid location ID");
    }
    if (!routeMetrics) {
      validationErrors.push("Missing route metrics");
    }
    if (!validEmployees.length) {
      validationErrors.push("No valid employees selected");
    }

    if (validationErrors.length > 0) {
      toast.error(`Missing required data: ${validationErrors.join(", ")}`);
      return;
    }

    try {
      console.log('=== ShuttlePreview handleAccept DEBUG ===');
      console.log('routeData:', routeData);
      console.log('selectedShift:', selectedShift);
      console.log('selectedShift type:', typeof selectedShift);
      console.log('selectedShuttle:', selectedShuttle);
      console.log('selectedShuttle.id:', selectedShuttle?.id);
      console.log('routeData.selectedLocation:', routeData.selectedLocation);
      console.log('validEmployees:', validEmployees);
      
      // Create base date for tomorrow at start of day in ISO format
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 1);
      baseDate.setHours(0, 0, 0, 0); // Set to start of day
      const dateStr = baseDate.toISOString(); // Full ISO datetime format

      const routeApiData = {
        name: routeData.name.trim(),
        vehicleId: selectedShuttle.id, // Backend expects vehicleId, not shuttleId
        shiftId: selectedShift.id,
        locationId: routeData.selectedLocation?.id,
        date: dateStr, // ISO datetime format
        // Use precise Mapbox metrics for distance and time
        totalDistance: parseFloat(routeMetrics.totalDistance.toFixed(2)),
        totalTime: Math.round(routeMetrics.totalTime),
        employees: validEmployees.map((employee) => ({
          employeeId: employee.id,
          stopId: employee.stop.id,
        })),
      };
      
      console.log('routeApiData being sent:', routeApiData);
      console.log('routeApiData.shiftId:', routeApiData.shiftId);
      console.log('routeApiData.shiftId type:', typeof routeApiData.shiftId);
      console.log('routeApiData.vehicleId:', routeApiData.vehicleId);
      console.log('routeApiData.date:', routeApiData.date);
      console.log('=== End ShuttlePreview handleAccept DEBUG ===');

      // Create the route using the data
      await onAccept(routeApiData);

  toast.success(`Route ${routeData.name} has been created successfully`);
    } catch (error) {
  toast.error(error.message || "Failed to create route");
    }
  };

  const handleClose = () => {
    document.body.classList.remove("modal-open");
    onClose();
  };

  // Render employee list safely
  const renderEmployeeList = () => {
    if (!validEmployees.length) {
      return <div className={styles.noData}>No valid employees to display</div>;
    }

    return validEmployees.map((employee, index) => (
      <div key={employee.id} className={styles.employeeItem}>
        <div className={styles.orderNumber}>{index + 1}</div>
        <div className={styles.employeeDetails}>
          <div className={styles.employeeName}>{employee.name}</div>
          <div className={styles.employeeLocation}>
            <Badge variant="secondary" className={styles.locationBadge}>
              {(employee.stop?.address || employee.workLocation?.address || 'N/A').replace(', Ethiopia', '')}
            </Badge>
            <span className={styles.department}>
              {employee.department.name}
            </span>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <LoadingWrapper isLoading={isLoading}>
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <div className={styles.inputGroup}>
                <span className={styles.inputLabel}>Name:</span>
                <Input
                  type="text"
                  value={routeData.name}
                  onChange={(e) => routeData.setName(e.target.value)}
                  placeholder="Enter route name"
                  className={`${styles.routeNameInput} ${
                    !routeData.name.trim() ? styles.error : ""
                  }`}
                />
                <Button
                  type="button"
                  onClick={handleNameSuggestion}
                  className={styles.suggestButton}
                  title="Suggest name based on furthest location"
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
              <p className={styles.subtitle}>
                {!routeData.name.trim() ? (
                  <span style={{ color: "var(--error)" }}>
                    Please enter a route name
                  </span>
                ) : (
                  "Review and confirm your route"
                )}
              </p>
            </div>
            <button onClick={handleClose} className={styles.closeButton}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className={styles.content}>
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Route Details</h4>
              <div className={styles.employeeList}>
                {/* Shuttle Info */}
                <div className={styles.shuttleInfo}>
                  <div className={styles.shuttleDetails}>
                    <div className={styles.shuttleHeader}>
                      <Badge variant="outline" className={styles.shuttleBadge}>
                        {selectedShuttle.name}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={styles.categoryBadge}
                      >
                        {selectedShuttle.category.name}
                      </Badge>
                    </div>
                    <div className={styles.routeMetrics}>
                      <div className={styles.metricCard}>
                        <span className={styles.metricIcon}>
                          <MapPin size={16} />
                        </span>
                        <div className={styles.metricContent}>
                          <span className={styles.metricValue}>
                            {routeMetrics?.totalDistance} km
                          </span>
                          <span className={styles.metricLabel}>
                            Total Distance
                          </span>
                        </div>
                      </div>
                      <div className={styles.metricCard}>
                        <span className={styles.metricIcon}>
                          <Clock size={16} />
                        </span>
                        <div className={styles.metricContent}>
                          <span className={styles.metricValue}>
                            {routeMetrics?.totalTime} min
                          </span>
                          <span className={styles.metricLabel}>
                            Travel Time
                          </span>
                        </div>
                      </div>
                      <div className={styles.metricCard}>
                        <span className={styles.metricIcon}>
                          <Users size={16} />
                        </span>
                        <div className={styles.metricContent}>
                          <span className={styles.metricValue}>
                            {validEmployees.length} /{" "}
                            {selectedShuttle.category.capacity}
                          </span>
                          <span className={styles.metricLabel}>Passengers</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employee List Section */}
                <div className={styles.employeeSection}>
                  <div className={styles.employeeHeader}>
                    <h5 className={styles.employeeTitle}>Assigned Employees</h5>
                    <span className={styles.employeeCount}>
                      {validEmployees.length} employees
                    </span>
                  </div>
                  <div className={styles.employeeListContainer}>
                    <div className={styles.orderedList}>
                      {renderEmployeeList()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Route Map</h4>
              <div className={styles.mapContainer}>
                <Map
                  selectedRoute={optimizedRoute}
                  selectedShuttle={{
                    id: String(selectedShuttle.id),
                    name: selectedShuttle.name,
                    capacity: selectedShuttle.category.capacity,
                  }}
                  center={MAP_CONFIG.HQ_LOCATION.coords}
                  zoom={11}
                  showDirections={true}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <div className={styles.actions}>
              <button onClick={handleClose} className={styles.cancelButton}>
                <XCircle size={20} />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleCreateRoute}
                disabled={
                  isLoading ||
                  routeMetrics?.totalTime > 90 ||
                  !validEmployees.length ||
                  !routeData.name.trim()
                }
                className={styles.createButton}
              >
                <CheckCircle2 size={20} />
                <span>Create Route</span>
              </button>
            </div>
            {routeMetrics?.totalTime > 90 && (
              <div className={styles.error}>
                Route duration exceeds 90 minutes limit
              </div>
            )}
          </div>
        </div>
      </div>
    </LoadingWrapper>
  );
};

ShuttlePreview.propTypes = {
  routeData: PropTypes.shape({
    name: PropTypes.string.isRequired,
    selectedEmployees: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
        name: PropTypes.string.isRequired,
        stop: PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired,
          latitude: PropTypes.number.isRequired,
          longitude: PropTypes.number.isRequired,
        }),
        location: PropTypes.string,
        department: PropTypes.shape({
          name: PropTypes.string.isRequired,
        }).isRequired,
      })
    ),
    selectedShift: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    }),
    selectedShuttle: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      category: PropTypes.shape({
        name: PropTypes.string.isRequired,
        capacity: PropTypes.number.isRequired,
      }).isRequired,
    }),
    shiftEndTime: PropTypes.string,
    setName: PropTypes.func.isRequired,
    coordinates: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onAccept: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
};

export default ShuttlePreview;
