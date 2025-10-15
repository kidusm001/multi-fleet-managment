// External dependencies
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { ArrowLeft, RotateCcw, Eye, Wand2, AlertTriangle, RefreshCw } from "lucide-react";
// UI Components
import { Input } from "@/components/Common/UI/Input";
import { Badge } from "@/components/Common/UI/Badge";
import { toast } from 'sonner';
import LoadingWrapper from "@components/Common/LoadingAnimation/LoadingWrapper";
// Services
import { clusterService } from "@services/clusterService";
import { shuttleAvailabilityService } from "@services/shuttleAvailabilityService";
import { getRoutesByShift } from "@services/api";
import { formatDisplayAddress } from "@/utils/address";

// Local components
import SortableEmployeeTable from "./SortableEmployeeTable";
import EmployeeClusterVisualization from "./EmployeeClusterVisualization";

export default function MobileCreateRouteForm({
  selectedShift = null,
  routeData,
  setRouteData,
  onBack,
  onPreview,
  employees,
  shiftEndTime = "",
  isPreviewMode = false,
  shifts: _shifts = [],
}) {
  const [selectedShuttle, setSelectedShuttle] = useState(null);
  const [shuttleClusters, setShuttleClusters] = useState({});
  const [originalClusters, setOriginalClusters] = useState({});
  const [_swappedEmployees, setSwappedEmployees] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [availableShuttles, setAvailableShuttles] = useState([]);
  const [isLoadingShuttles, setIsLoadingShuttles] = useState(false);
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [pendingEmployeeSelection, setPendingEmployeeSelection] =
    useState(null);
  const initialFetchDone = useRef(false);
  const [_existingRoutes, setExistingRoutes] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [hasClusterResults, setHasClusterResults] = useState(false);
  const [highlightKey, setHighlightKey] = useState(0); // Force re-render key
  // Add reference to track previous shift ID for change detection
  const previousShiftId = useRef(null);

  // Add state for browser detection
  const [isFirefox, setIsFirefox] = useState(false);

  // Detect Firefox browser on component mount
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    setIsFirefox(userAgent.includes('firefox') || userAgent.includes('mozilla'));
  }, []);

  // Debug: Log routeData on mount and when it changes
  useEffect(() => {
    console.log('MobileCreateRouteForm mounted/updated with routeData:', routeData);
    console.log('  - selectedLocation:', routeData?.selectedLocation);
  }, [routeData]);

  // Get shift ID whether it's passed as an object or number
  const getShiftId = useCallback(() => {
    if (!selectedShift) return null;
    return typeof selectedShift === "object" ? selectedShift.id : selectedShift;
  }, [selectedShift]);

  // Get shift name from various sources
  const getShiftName = useCallback(() => {
    // First try to get name from selectedShift if it's an object
    if (selectedShift?.name) {
      return selectedShift.name;
    }

    // Then try to get from routeData
    if (routeData?.selectedShift?.name) {
      return routeData.selectedShift.name;
    }

    // Finally try to find in shifts array using the ID
    const shiftId = getShiftId();
    if (shiftId && _shifts.length > 0) {
      const foundShift = _shifts.find(
        (s) => s.id === shiftId || String(s.id) === String(shiftId)
      );
      return foundShift?.name;
    }

    return 'Selected Shift';
  }, [selectedShift, routeData, getShiftId, _shifts]);

  // Update the shift change detection logic
  useEffect(() => {
    const shiftId = getShiftId();

    // Check if shift has changed
    if (shiftId !== previousShiftId.current && previousShiftId.current !== null) {

      // Reset all cluster-related state for the new shift
      setShuttleClusters({});
      setOriginalClusters({});
      setSelectedShuttle(null);
      setHasClusterResults(false);
      setHighlightKey(prev => prev + 1);
      initialFetchDone.current = false;

      // Reset route data on shift change (but don't reset location - parent manages that)
      setRouteData((prev) => ({
        ...prev,
        selectedShuttle: null,
        selectedEmployees: [],
      }));

      // Update previous shift ID
      previousShiftId.current = shiftId;
    } else if (previousShiftId.current === null) {
      // First time initialization
      previousShiftId.current = shiftId;
    }
  }, [selectedShift, getShiftId, setRouteData]);

  // Fetch existing routes when shift changes
  useEffect(() => {
    const fetchExistingRoutes = async () => {
      if (!selectedShift) {
        setExistingRoutes([]);
        return;
      }

      try {
        const shiftId =
          typeof selectedShift === "object" ? selectedShift.id : selectedShift;
        const response = await getRoutesByShift(shiftId);
        setExistingRoutes(response.data || []);
      } catch (error) {
        console.error("Error fetching existing routes:", error);
        toast.error("Failed to fetch existing routes");
      }
    };

    fetchExistingRoutes();
  }, [selectedShift]);

  // Enhance the fetchShuttlesAndClusters function to use non-cached API calls
  useEffect(() => {
    const fetchShuttlesAndClusters = async () => {
      const shiftId = getShiftId();
      if (!shiftId || initialFetchDone.current) {
        return;
      }

      setIsLoadingShuttles(true);
      setIsLoading(true);
      try {
        // Add timestamp to force fresh data
        const timestamp = new Date().getTime();
        const result =
          await shuttleAvailabilityService.getAvailableShuttlesForShift(
            shiftId,
            { cache: false, timestamp }
          );

        // Filter out non-available shuttles - API returns "vehicles" array with "AVAILABLE" status
        const activeShuttles =
          result.vehicles?.filter(
            (shuttle) => shuttle.status?.toLowerCase() === "available"
          ) || [];

        if (result.vehicles?.length > 0 && activeShuttles.length === 0) {
          toast.warning("No Available Shuttles", {
            description: "There are shuttles but none are currently available. Please check shuttle status."
          });
        }

        setAvailableShuttles(activeShuttles);

        // Calculate total capacity
        const capacity = activeShuttles.reduce(
          (sum, shuttle) => sum + (shuttle.category?.capacity || 0),
          0
        );
        setTotalCapacity(capacity);
        setTotalEmployees(employees.filter((emp) => !emp.assigned).length);

        // Only proceed with clustering if we have shuttles and employees
        const unassignedEmployees = employees.filter((emp) => !emp.assigned);
        if (activeShuttles.length && unassignedEmployees.length) {
          try {
            // Force fresh cluster data with timestamp
            const clusters = await clusterService.optimizeClusters(
              unassignedEmployees,
              activeShuttles,
              {
                cache: false,
                timestamp,
                location: routeData.selectedLocation
              }
            );

            if (Object.keys(clusters).length > 0) {
              setShuttleClusters(clusters);
              setOriginalClusters(JSON.parse(JSON.stringify(clusters))); // Deep copy
              setHasClusterResults(true); // Set flag when clusters are received
            }
          } catch (error) {
            // Don't show error toast for clustering failures - it's not critical
            console.warn("Clustering service unavailable, continuing without optimization:", error);
            // Set empty clusters so the component continues to work
            setShuttleClusters({});
            setOriginalClusters({});
          }
        }
      } catch (error) {
        toast.error("Failed to fetch available shuttles");
        setHasClusterResults(false);
      } finally {
        // Always reset loading states regardless of success or failure
        setIsLoadingShuttles(false);
        setIsLoading(false);
        initialFetchDone.current = true;
      }
    };

    fetchShuttlesAndClusters();
  }, [selectedShift, getShiftId, employees, routeData.selectedLocation]);

  // Get current shuttle's cluster
  const getCurrentShuttleCluster = useCallback(() => {
    if (!selectedShuttle) return [];
    return shuttleClusters[selectedShuttle.id] || [];
  }, [selectedShuttle, shuttleClusters]);

  const handleShuttleSelect = async (shuttle) => {
    // If same shuttle is clicked, unselect it
    if (selectedShuttle?.id === shuttle.id) {
      setSelectedShuttle(null);
      setRouteData((prev) => ({
        ...prev,
        selectedShuttle: null,
        selectedEmployees: [],
      }));
      return;
    }

    // Clear selected employees when switching shuttles
    setRouteData((prev) => ({
      ...prev,
      selectedShuttle: shuttle,
      selectedEmployees: [], // Clear selected employees
    }));
    setSelectedShuttle(shuttle);
    const currentCluster = shuttleClusters[shuttle.id] || [];

    toast.success(`Selected ${shuttle.name}`, {
      description: `${currentCluster.length} employees recommended for this shuttle`
    });
  };

  // Handle employee selection updates
  useEffect(() => {
    if (!pendingEmployeeSelection) return;

    const { employee, action } = pendingEmployeeSelection;

    if (action === "select") {
      const employeeWithStop = {
        ...employee,
        stop: employee.stop ? {
          id: employee.stop.id,
          latitude: employee.stop.latitude,
          longitude: employee.stop.longitude,
          address: employee.stop.address, // Use stop address, not location field
        } : null,
      };

      setRouteData((prev) => ({
        ...prev,
        selectedEmployees: [...prev.selectedEmployees, employeeWithStop],
      }));
    } else if (action === "unselect") {
      setRouteData((prev) => ({
        ...prev,
        selectedEmployees: prev.selectedEmployees.filter(
          (emp) => emp.id !== employee.id
        ),
      }));
    }

    setPendingEmployeeSelection(null);
  }, [pendingEmployeeSelection, setRouteData]);

  const handleEmployeeSelect = (employee) => {
    if (!selectedShuttle) {
      toast.error("Please select a shuttle first");
      return;
    }

    // Check if employee has valid stop data for route creation
    if (!employee.stop && !routeData.selectedEmployees.some(emp => emp.id === employee.id)) {
      toast.error("Cannot select employee without stop location data");
      return;
    }

    const isSelected = routeData.selectedEmployees.some(
      (emp) => emp.id === employee.id
    );

    setPendingEmployeeSelection({
      employee,
      action: isSelected ? "unselect" : "select",
    });
  };

  const handleClear = (e) => {
    e.preventDefault();
    setShuttleClusters(originalClusters);
    setSwappedEmployees({});
    setRouteData((prev) => ({ ...prev, selectedEmployees: [] }));
    toast.success("Selection cleared", {
      description: "All selected employees have been cleared"
    });
  };

  // Generate suggested route name
  const getSuggestedRouteName = useCallback(() => {
    if (!routeData.selectedEmployees.length) return "";

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
          // Use stop location and extract first two parts after removing the leading segment
          const formattedAddress = formatDisplayAddress(
            employee.stop?.address || employee.location || ''
          );
          const addressParts = formattedAddress
            .split(',')
            .map(part => part.trim())
            .filter(part => part);
          // Take first two parts and join them
          furthestArea = addressParts.slice(0, 2).join(' ');
        }
      }
    });

    // Format shift time if available
    const shiftTime = shiftEndTime
      ? ` - ${shiftEndTime.split(':')[0]}${shiftEndTime.includes('PM') ? 'PM' : ''}`
      : '';

    return `${furthestArea}${shiftTime}`;
  }, [routeData.selectedEmployees, shiftEndTime]);

  // Handle route name suggestion
  const handleNameSuggestion = useCallback(() => {
    const suggestedName = getSuggestedRouteName();
    if (suggestedName) {
      setRouteData((prev) => ({ ...prev, name: suggestedName }));
      toast.success("Name Updated", {
        description: "Route name has been updated based on the furthest stop."
      });
    }
  }, [getSuggestedRouteName, setRouteData]);

  // Sort employees
  const sortedEmployees = useMemo(() => {
    if (!selectedShuttle) return employees;

    const currentCluster = shuttleClusters[selectedShuttle.id] || [];
    const clusterEmployeeIds = currentCluster.map((emp) => emp.id);

    return [...employees].sort((a, b) => {
      const aInCluster = clusterEmployeeIds.includes(a.id);
      const bInCluster = clusterEmployeeIds.includes(b.id);
      const aSelected = routeData.selectedEmployees.some(
        (emp) => emp.id === a.id
      );
      const bSelected = routeData.selectedEmployees.some(
        (emp) => emp.id === b.id
      );

      if (aInCluster !== bInCluster) return aInCluster ? -1 : 1;
      if (aSelected !== bSelected) return aSelected ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [
    employees,
    selectedShuttle,
    shuttleClusters,
    routeData.selectedEmployees,
  ]);

  const requestSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  };

  // Calculate department stats
  const departmentCounts = useMemo(() => {
    const counts = employees.reduce((acc, emp) => {
      const dept = emp.department?.name || "Unknown";
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    // Find department with max employees
    let maxDept = { name: "", count: 0 };
    Object.entries(counts).forEach(([dept, count]) => {
      if (count > maxDept.count) {
        maxDept = { name: dept, count: count };
      }
    });

    return maxDept;
  }, [employees]);

  // Add this sorting logic before the shuttle list rendering
  const sortedShuttles = useMemo(() => {
    if (!availableShuttles.length || !shuttleClusters) return availableShuttles;

    return [...availableShuttles].sort((a, b) => {
      const aClusterSize = shuttleClusters[a.id]?.length || 0;
      const bClusterSize = shuttleClusters[b.id]?.length || 0;
      return bClusterSize - aClusterSize;
    });
  }, [availableShuttles, shuttleClusters]);

  const validateForm = () => {
    console.log('Validating form:');
    console.log('  - routeData.selectedLocation:', routeData?.selectedLocation);
    console.log('  - routeData.selectedEmployees.length:', routeData?.selectedEmployees?.length);
    console.log('  - selectedShift:', selectedShift);
    console.log('  - Full routeData:', routeData);

    const errors = {};
    if (!routeData.selectedEmployees?.length) {
      errors.employees = "At least one employee must be selected";
    }
    if (!selectedShift) {
      errors.shift = "Shift must be selected";
    }
    if (!routeData?.selectedLocation) {
      console.log('Location validation failed: routeData.selectedLocation is falsy');
      errors.location = "Location must be selected";
    } else {
      console.log('Location validation passed: routeData.selectedLocation =', routeData.selectedLocation);
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePreview = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onPreview();
    } else {
      toast.error("Validation Error", {
        description: "Please fix the errors before continuing"
      });
    }
  };

  // Update the resetAndReapplyClusters function to force fresh data
  const resetAndReapplyClusters = useCallback(() => {
    // Store current shuttle ID
    const currentShuttleId = selectedShuttle?.id;
    const shiftId = getShiftId();

    // First completely reset the state
    setIsLoading(true);
    setShuttleClusters({});
    setSelectedShuttle(null);

    // Force refetch of fresh cluster data
    setTimeout(async () => {
      try {
        if (!shiftId) {
          throw new Error("No shift selected");
        }

        // Get fresh data without using cache
        const timestamp = new Date().getTime();
        const result = await shuttleAvailabilityService.getAvailableShuttlesForShift(
          shiftId,
          { cache: false, timestamp }
        );

        const activeShuttles = result.vehicles?.filter(
          shuttle => shuttle.status?.toLowerCase() === "available"
        ) || [];

        const unassignedEmployees = employees.filter(emp => !emp.assigned);

        if (activeShuttles.length && unassignedEmployees.length) {
          // Get fresh clusters
          const clusters = await clusterService.optimizeClusters(
            unassignedEmployees,
            activeShuttles,
            { cache: false, timestamp }
          );

          // Apply fresh data
          setShuttleClusters(clusters);
          setOriginalClusters(JSON.parse(JSON.stringify(clusters)));

          // Re-select shuttle if it still exists
          const shuttle = activeShuttles.find(s => s.id === currentShuttleId);
          if (shuttle) {
            setSelectedShuttle(shuttle);
          }

          setHighlightKey(prev => prev + 1);
        }
      } catch (error) {
        console.warn("Clustering service unavailable during refresh:", error);
        // Set empty clusters but don't show error toast
        setShuttleClusters({});
        setOriginalClusters({});
      } finally {
        setIsLoading(false);
      }
    }, 50);
  }, [selectedShuttle, getShiftId, employees]);

  // Replace the old handleRefreshHighlights with the new one
  const handleRefreshHighlights = useCallback((e) => {
    e.preventDefault();
    resetAndReapplyClusters();
  }, [resetAndReapplyClusters]);

  return (
    <LoadingWrapper isLoading={isLoading} overlay={false}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft size={14} />
              <span className="text-[11px] font-medium">Back</span>
            </button>
            <div className="text-center">
              <h1 className="text-xs font-semibold text-gray-900 dark:text-gray-100">Create Route</h1>
            </div>
            <div className="w-12"></div> {/* Spacer for centering */}
          </div>
        </div>

        <div className="px-3 py-3 space-y-3 w-[90%] mx-auto">
          {/* Route Info Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-sm space-y-2">
            {/* Route Name Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Route Name</label>
              <div className="flex gap-1">
                <Input
                  type="text"
                  value={routeData.name}
                  onChange={(e) =>
                    setRouteData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter route name"
                  className={`flex-1 text-[11px] h-7 ${formErrors.name ? 'border-red-500' : ''}`}
                />
                {routeData.selectedEmployees.length > 0 && (
                  <button
                    type="button"
                    onClick={handleNameSuggestion}
                    className="p-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  >
                    <Wand2 size={12} />
                  </button>
                )}
              </div>
              {formErrors.name && (
                <span className="text-[9px] text-red-500">{formErrors.name}</span>
              )}
            </div>

            {/* Shift and Location Info */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-gray-500 dark:text-gray-400 text-[9px]">Shift</span>
                <div className="font-medium text-gray-900 dark:text-gray-100 text-[11px]">{getShiftName()}</div>
                <div className="text-[9px] text-gray-500 dark:text-gray-400">{shiftEndTime}</div>
                {formErrors.shift && (
                  <span className="text-[9px] text-red-500">{formErrors.shift}</span>
                )}
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 text-[9px]">Location</span>
                <div className="font-medium text-gray-900 dark:text-gray-100 text-[9px] leading-tight">
                  {formatDisplayAddress(routeData?.selectedLocation?.address) || 'No location selected'}
                </div>
                {formErrors.location && (
                  <span className="text-[9px] text-red-500">{formErrors.location}</span>
                )}
              </div>
            </div>

            {/* Capacity Warning */}
            {totalEmployees > totalCapacity && (
              <div className="flex items-center gap-1 p-1.5 bg-red-50 dark:bg-red-900/20 rounded-md">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span className="text-[9px] text-red-700 dark:text-red-300">
                  {totalEmployees}/{totalCapacity} Capacity Exceeded
                </span>
              </div>
            )}

            {/* Department Stats */}
            <div className="text-[9px] text-gray-500 dark:text-gray-400">
              Largest Dept: <span className="font-medium text-gray-900 dark:text-gray-100">{departmentCounts.name} ({departmentCounts.count})</span>
            </div>
          </div>

          {/* Shuttles Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">Available Shuttles</h3>
            <div className="space-y-1.5">
              {isLoadingShuttles ? (
                <div className="text-center py-2 text-[10px] text-gray-500 dark:text-gray-400">Loading shuttles...</div>
              ) : availableShuttles.length === 0 ? (
                <div className="text-center py-2 text-[10px] text-gray-500 dark:text-gray-400">
                  {selectedShift?.id
                    ? "No active shuttles available for this shift"
                    : "Please select a shift first"}
                </div>
              ) : (
                sortedShuttles.map((shuttle) => {
                  const selectedCount = routeData.selectedEmployees.length;
                  const isSelected = selectedShuttle?.id === shuttle.id;
                  const isRecommended = shuttleClusters[shuttle.id]?.length > 0;

                  return (
                    <button
                      type="button"
                      key={shuttle.id}
                      className={`w-full p-2 rounded-md border text-left transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : isRecommended
                          ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => handleShuttleSelect(shuttle)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-[11px]">{shuttle.name}</div>
                          <div className="text-[9px] text-gray-500 dark:text-gray-400">{shuttle.category?.name || "Unknown Type"}</div>
                          {shuttle.dailyRate > 0 && (
                            <div className="text-[9px] text-gray-600 dark:text-gray-300 mt-0.5">
                              Daily Rate: {shuttle.dailyRate} ETB
                            </div>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0.5 ${
                            isSelected
                              ? 'border-blue-500 text-blue-700 dark:text-blue-300'
                              : 'border-gray-300 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {isSelected
                            ? `${selectedCount}/${shuttle.category?.capacity || 0}`
                            : `0/${shuttle.category?.capacity || 0}`} Seats
                        </Badge>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Route Visualization - only show when shuttle is selected */}
            {selectedShuttle && (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-[10px] font-medium text-gray-900 dark:text-gray-100 mb-1">Route Visualization</h4>
                <div className="h-20 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
                  <EmployeeClusterVisualization
                    employees={employees}
                    selectedEmployees={routeData.selectedEmployees}
                    optimalCluster={getCurrentShuttleCluster()}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Employees Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100">Select Employees</h3>
              <span className="text-[9px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full">
                {routeData.selectedEmployees.length} selected
              </span>
            </div>

            {/* Action Buttons */}
            {!isPreviewMode && (
              <div className="flex gap-1 mb-2">
                {/* Show refresh button only in Firefox browsers */}
                {isFirefox && hasClusterResults && (
                  <button
                    type="button"
                    onClick={handleRefreshHighlights}
                    className="flex items-center gap-0.5 px-1.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-[9px] hover:bg-gray-200 dark:hover:bg-gray-600"
                    title="Refresh employee highlights (Firefox only)"
                  >
                    <RefreshCw size={10} />
                    <span>Refresh</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedShuttle) {
                      toast.error("Please select a shuttle first");
                      return;
                    }
                    const currentCluster = getCurrentShuttleCluster();
                    setRouteData((prev) => ({
                      ...prev,
                      selectedEmployees: currentCluster.map((emp) => ({
                        ...emp,
                        stop: emp.stop ? {
                          id: emp.stop.id,
                          latitude: emp.stop.latitude,
                          longitude: emp.stop.longitude,
                          address: emp.stop.address, // Use stop address, not location field
                        } : null,
                      })),
                    }));
                    toast.success("Recommended employees selected", {
                      description: `${currentCluster.length} employees have been selected`
                    });
                  }}
                  className="flex items-center gap-0.5 px-1.5 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md text-[9px] hover:bg-blue-200 dark:hover:bg-blue-900/30"
                  disabled={!selectedShuttle || getCurrentShuttleCluster().length === 0}
                >
                  <Wand2 size={10} />
                  <span>Recommend</span>
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-0.5 px-1.5 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md text-[9px] hover:bg-red-200 dark:hover:bg-red-900/30"
                  disabled={!selectedShuttle || routeData.selectedEmployees.length === 0}
                >
                  <RotateCcw size={10} />
                  <span>Clear</span>
                </button>
              </div>
            )}

            {/* Employee Table */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
              <SortableEmployeeTable
                key={highlightKey} // Add key to force re-render
                data={sortedEmployees}
                onEmployeeSelect={handleEmployeeSelect}
                selectedEmployees={routeData.selectedEmployees}
                optimalCluster={getCurrentShuttleCluster()}
                isDisabled={!selectedShuttle}
                maxCapacity={selectedShuttle?.category?.capacity}
                isLoading={isLoading}
                sortConfig={sortConfig}
                onRequestSort={requestSort}
              />
            </div>

            {formErrors.employees && (
              <span className="text-[9px] text-red-500 mt-1 block">{formErrors.employees}</span>
            )}

            {/* Preview Button */}
            {routeData.selectedEmployees.length > 0 && (
              <button
                type="submit"
                onClick={handlePreview}
                className="w-full mt-2 bg-blue-600 text-white py-1.5 px-2.5 rounded-md font-medium text-[11px] hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
              >
                <Eye size={12} />
                <span>Preview Route</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </LoadingWrapper>
  );
}

MobileCreateRouteForm.propTypes = {
  selectedShift: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string, // Added string support for UUID shift IDs
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), // Support both number and string IDs
      name: PropTypes.string,
      startTime: PropTypes.string,
      endTime: PropTypes.string,
    }),
  ]),
  routeData: PropTypes.shape({
    name: PropTypes.string,
    selectedEmployees: PropTypes.array,
    selectedShift: PropTypes.object,
    selectedShuttle: PropTypes.object,
    shiftStartTime: PropTypes.string,
    shiftEndTime: PropTypes.string,
  }).isRequired,
  setRouteData: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onPreview: PropTypes.func.isRequired,
  employees: PropTypes.array.isRequired,
  shiftEndTime: PropTypes.string,
  isPreviewMode: PropTypes.bool,
  shifts: PropTypes.array,
};