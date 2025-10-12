import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { CheckCircle2, XCircle, MapPin, Clock, Users, Wand2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/Common/UI/Badge";
import { Button } from "@components/Common/UI/Button";
import LoadingWrapper from "@components/Common/LoadingAnimation/LoadingWrapper";
import Map from "@components/Common/Map/MapComponent";
import { toast } from "sonner";
import { MAP_CONFIG } from "@data/constants";
import { Input } from "@/components/Common/UI/Input";
import { optimizeRoute } from "@services/routeOptimization";

const MobileShuttlePreview = ({ routeData, onClose, onAccept, show }) => {
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
          // Use stop address and extract first two parts (excluding Addis Ababa and Ethiopia)
          let fullAddress = (employee.stop?.address || employee.location || '');
          // Remove Ethiopia and Addis Ababa
          fullAddress = fullAddress.replace(/, Ethiopia/g, '').replace(/, Addis Ababa/g, '');
          const addressParts = fullAddress.split(',').map(part => part.trim()).filter(part => part);
          // Take first two parts and join them
          furthestArea = addressParts.slice(0, 2).join(' ');
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
      console.log('=== MobileShuttlePreview handleAccept DEBUG ===');
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
      console.log('=== End MobileShuttlePreview handleAccept DEBUG ===');

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

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
      <LoadingWrapper isLoading={isLoading} overlay={true}>
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={handleClose}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Route Preview</h1>
            </div>
            <div className="w-16"></div> {/* Spacer for centering */}
          </div>
        </div>

        <div className="flex flex-col h-[calc(100vh-64px)]">
          {/* Route Name Section */}
          <div className="px-4 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={routeData.name}
                  onChange={(e) => routeData.setName(e.target.value)}
                  placeholder="Enter route name"
                  className={`flex-1 text-sm ${
                    !routeData.name.trim() ? 'border-red-500' : ''
                  }`}
                />
                <Button
                  type="button"
                  onClick={handleNameSuggestion}
                  className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  title="Suggest name based on furthest location"
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
              {!routeData.name.trim() && (
                <p className="text-sm text-red-500">Please enter a route name</p>
              )}
            </div>
          </div>

          {/* Route Details Section */}
          <div className="px-4 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Route Details</h3>

            {/* Shuttle Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-sm">
                  {selectedShuttle.name}
                </Badge>
                <Badge variant="secondary" className="text-sm">
                  {selectedShuttle.category.name}
                </Badge>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
                    <MapPin size={14} />
                    <span className="text-xs">Distance</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {routeMetrics?.totalDistance} km
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
                    <Clock size={14} />
                    <span className="text-xs">Time</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {routeMetrics?.totalTime} min
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
                    <Users size={14} />
                    <span className="text-xs">Passengers</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {validEmployees.length} / {selectedShuttle.category.capacity}
                  </div>
                </div>
              </div>
            </div>

            {/* Employee List */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Assigned Employees</h4>
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                  {validEmployees.length} employees
                </span>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {validEmployees.map((employee, index) => (
                  <div key={employee.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {employee.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {employee.department.name}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {(employee.stop?.address || employee.workLocation?.address || 'N/A').replace(', Ethiopia', '')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Map Section - Takes remaining space */}
          <div className="flex-1 px-4 py-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Route Map</h3>
            <div className="h-full bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
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

          {/* Action Buttons - Fixed at bottom */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-4">
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XCircle size={18} />
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
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 size={18} />
                <span>Create Route</span>
              </button>
            </div>

            {routeMetrics?.totalTime > 90 && (
              <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300 text-center">
                  Route duration exceeds 90 minutes limit
                </p>
              </div>
            )}
          </div>
        </div>
      </LoadingWrapper>
    </div>
  );
};

MobileShuttlePreview.propTypes = {
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

export default MobileShuttlePreview;