// External dependencies
import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@utils/cn";
// UI Components
import { Card, CardContent } from "@components/Common/UI/Card";
import { toast } from "sonner";
import { ScrollArea } from "@components/Common/UI/scroll-area";
import LoadingAnimation from "@/components/Common/LoadingAnimation";
// Services
import {
  getShifts,
  getUnassignedEmployeesByShift,
  getRoutesByShift,
  getAvailableShuttles,
  createRoute,
} from "@services/api";
import { locationService } from "@services/locationService";

// Local Components
import ShiftSelection from "./components/ShiftSelection";
import LocationSelection from "./components/LocationSelection";
import RouteList from "./components/RouteList";
import EmployeeTable from "./components/EmployeeTable";
import CreateRouteForm from "./components/CreateRouteForm";
import ShuttlePreview from "./components/ShuttlePreview";
import CustomButton from "./components/CustomButton";
// Styles
import styles from "./styles/CreateRoute.module.css";

function CreateRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pageState, setPageState] = useState("initial");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [routeData, setRouteData] = useState({
    name: "",
    selectedEmployees: [],
    selectedShift: null,
    selectedShuttle: null,
    selectedLocation: null,
    shiftEndTime: null,
    setName: (name) => handleNameChange(name),
  });
  const [locations, setLocations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]); // Full list for the shift
  const [employees, setEmployees] = useState([]); // Filtered list for display
  const [routes, setRoutes] = useState([]);
  const [shuttles, setShuttles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load location from navigation state or stored state
  useEffect(() => {
    console.log('Loading useEffect: location.state?.selectedLocation:', location.state?.selectedLocation, 'locations.length:', locations.length);
    // First check location state for location data
    if (location.state?.selectedLocation) {
      const loc = location.state.selectedLocation;
      const locId = typeof loc === 'object' ? loc.id : loc;
      console.log('Loading from state, locId:', locId);
      // Validate that the location exists in current locations
      if (locations.length > 0) {
        const exists = locations.some(l => String(l.id) === String(locId));
        console.log('Location exists in locations:', exists);
        if (exists) {
          setSelectedLocation(locId);
          console.log('Set selectedLocation from state');
        }
      } else {
        // Store temporarily, will validate when locations load
        setSelectedLocation(locId);
        console.log('Set selectedLocation temporarily from state');
      }
    }
    // Then check if we have a stored location in sessionStorage (for when we return to this page)
    else {
      const storedLocation = sessionStorage.getItem("selectedCreateRouteLocation");
      console.log('Stored location:', storedLocation);
      if (storedLocation) {
        // Validate that the stored location exists in current locations
        if (locations.length > 0) {
          const exists = locations.some(l => String(l.id) === String(storedLocation));
          console.log('Stored location exists in locations:', exists);
          if (exists) {
            setSelectedLocation(storedLocation);
            console.log('Set selectedLocation from sessionStorage');
          } else {
            // Clear invalid stored location
            sessionStorage.removeItem("selectedCreateRouteLocation");
            console.log('Cleared invalid stored location');
          }
        } else {
          // Store temporarily, will validate when locations load
          setSelectedLocation(storedLocation);
          console.log('Set selectedLocation temporarily from sessionStorage');
        }
      }
    }
  }, [location.state?.selectedLocation, locations]);

  // Load shifts
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const response = await getShifts();
        const formattedShifts = response.data.map((shift) => ({
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
      } catch (error) {
        toast.error("Failed to load shifts: " + error.message);
      }
    };
    fetchShifts();
  }, []);

  // Load locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await locationService.getLocations();
        setLocations(response.data || response);
      } catch (error) {
        toast.error("Failed to load locations: " + error.message);
      }
    };
    fetchLocations();
  }, []);

  // Load shift-specific data (all employees for the shift)
  useEffect(() => {
    if (selectedShift) {
      const fetchShiftData = async () => {
        try {
          // Extract shift ID from object or use directly if it's a string
          const shiftId = typeof selectedShift === 'object' ? selectedShift.id : selectedShift;
          
          // Validate shift ID
          if (!shiftId || typeof shiftId !== 'string' || shiftId.trim() === '' || shiftId === 'NaN') {
            throw new Error("Invalid shift ID");
          }

          const [employeesResponse, routesResponse] = await Promise.all([
            getUnassignedEmployeesByShift(shiftId),
            getRoutesByShift(shiftId),
          ]);

          // Store all employees for this shift
          setAllEmployees(employeesResponse.data);
          // Initially show all employees (no location filter)
          setEmployees(employeesResponse.data);
          setRoutes(routesResponse.data);
        } catch (error) {
          toast.error("Failed to load shift data: " + error.message);
        }
      };
      fetchShiftData();
    }
  }, [selectedShift]);

  // Filter employees by location (frontend filtering)
  useEffect(() => {
    if (allEmployees.length > 0) {
      if (selectedLocation) {
        // Filter by location
        const filteredEmployees = allEmployees.filter(
          (emp) => String(emp.workLocation?.id) === String(selectedLocation)
        );
        setEmployees(filteredEmployees);
      } else {
        // No location filter - show all employees for the shift
        setEmployees(allEmployees);
      }
    }
  }, [selectedLocation, allEmployees]);

  // Save selectedLocation to sessionStorage whenever it changes
  useEffect(() => {
    if (selectedLocation) {
      sessionStorage.setItem("selectedCreateRouteLocation", selectedLocation);
    } else {
      sessionStorage.removeItem("selectedCreateRouteLocation");
    }
  }, [selectedLocation]);

  // Validate selectedLocation when locations load
  useEffect(() => {
    console.log('Validation useEffect: locations.length:', locations.length, 'selectedLocation:', selectedLocation);
    if (locations.length > 0 && selectedLocation) {
      const location = locations.find(l => String(l.id) === String(selectedLocation));
      console.log('Found location:', location);
      if (location) {
        setRouteData((prev) => ({
          ...prev,
          selectedLocation: location,
        }));
        console.log('Set routeData.selectedLocation from validation useEffect');
      } else {
        setSelectedLocation(null);
        setRouteData((prev) => ({
          ...prev,
          selectedLocation: null,
        }));
        sessionStorage.removeItem("selectedCreateRouteLocation");
        console.log('Reset selectedLocation because location not found');
      }
    }
  }, [locations, selectedLocation]);

  // Load available shuttles
  useEffect(() => {
    const fetchShuttles = async () => {
      try {
        const response = await getAvailableShuttles();
        setShuttles(response.data);
      } catch (error) {
        toast.error("Failed to load available shuttles: " + error.message);
      }
    };
    fetchShuttles();
  }, []);

  const handleLocationChange = (location) => {
    console.log('handleLocationChange called with location:', location);
    if (location) {
      setSelectedLocation(location.id);
      // Update routeData immediately with the location object
      setRouteData((prev) => ({
        ...prev,
        selectedLocation: location,
      }));
      console.log('Set routeData.selectedLocation to:', location);
    } else {
      setSelectedLocation(null);
      setRouteData((prev) => ({
        ...prev,
        selectedLocation: null,
      }));
      console.log('Set routeData.selectedLocation to null');
    }
  };

  const handleShiftChange = (shift) => {
    console.log('handleShiftChange called with shift:', shift);
    setSelectedShift(shift);
    // Reset location selection when shift changes
    setSelectedLocation(null);
    // Update routeData with the shift object
    setRouteData((prev) => ({
      ...prev,
      selectedShift: shift,
      shiftEndTime: shift?.endTime,
    }));
  };

  const handleCreateRoute = () => {
    console.log('=== handleCreateRoute DEBUG ===');
    console.log('selectedLocation:', selectedLocation);
    console.log('selectedShift:', selectedShift);
    console.log('selectedShift type:', typeof selectedShift);
    console.log('locations.length:', locations.length);
    console.log('Current routeData:', routeData);
    
    // Ensure routeData has the current selected location before opening the form
    if (selectedLocation && locations.length) {
      const currentLocation = locations.find(
        (loc) => loc.id === selectedLocation || String(loc.id) === String(selectedLocation)
      );
      console.log('Found currentLocation:', currentLocation);
      if (currentLocation) {
        // Ensure we have the full shift object
        const shiftObject = typeof selectedShift === 'object' ? selectedShift : shifts.find(s => String(s.id) === String(selectedShift));
        setRouteData((prev) => {
          const newData = {
            ...prev,
            selectedLocation: currentLocation,
            selectedShift: shiftObject, // Ensure shift object is set
          };
          console.log('Setting routeData with selectedLocation and selectedShift:', newData);
          return newData;
        });
      } else {
        console.warn('Location not found in locations array');
        toast.error("Please select a valid location");
        return;
      }
    } else {
      console.warn('No selectedLocation or locations not loaded');
      toast.error("Please select a location first");
      return;
    }
    console.log('=== End handleCreateRoute DEBUG ===');
    setPageState("creating");
  };

  const handleBackToList = () => {
    setPageState("initial");
    // Don't reset the shift or location data when going back
    setRouteData((prev) => ({
      ...prev,
      name: "",
      selectedEmployees: [],
      selectedShuttle: null,
      // Keep selectedLocation - don't reset it
      setName: (name) => handleNameChange(name),
    }));
  };

  const handlePreview = useCallback(() => {
    setPageState("preview");
  }, []);

  const handleCreateRouteSubmit = async (routeApiData) => {
    try {
      setLoading(true);
      await createRoute(routeApiData);

      // Refresh the employees list to update assignments
      const shiftId = typeof selectedShift === 'object' ? selectedShift.id : selectedShift;
      if (shiftId && typeof shiftId === 'string' && shiftId.trim() !== '') {
        const employeesResponse = await getUnassignedEmployeesByShift(
          shiftId
        );
        setAllEmployees(employeesResponse.data);

        // Re-apply location filter
        if (selectedLocation) {
          const filteredEmployees = employeesResponse.data.filter(
            (emp) => String(emp.workLocation?.id) === String(selectedLocation)
          );
          setEmployees(filteredEmployees);
        } else {
          setEmployees(employeesResponse.data);
        }
      }

      toast.success("Route created successfully!");

      // Reset route data but keep the shift selection
      setRouteData({
        name: "",
        selectedEmployees: [],
        selectedShift: routeData.selectedShift, // Keep shift data
        selectedShuttle: null,
        selectedLocation: null, // Reset location
        shiftEndTime: routeData.shiftEndTime, // Keep shift end time
        setName: (name) => handleNameChange(name),
      });

      // Go back to initial state
      setPageState("initial");

      // Refresh routes list
      const shiftIdForRoutes = typeof selectedShift === 'object' ? selectedShift.id : selectedShift;
      const updatedRoutesResponse = await getRoutesByShift(
        shiftIdForRoutes
      );
      setRoutes(updatedRoutesResponse.data);

      // Reset loading state before navigation
      setLoading(false);

      // Navigate to routes page with refresh trigger and set the activeTab to "create"
      navigate("/routes", {
        state: {
          refresh: true,
          activeTab: "create",
        },
      });
    } catch (error) {
      toast.error(
        "Failed to create route: " + (error.message || "Unknown error")
      );
      setLoading(false);
    }
  };

  const handleNameChange = (name) => {
    setRouteData((prev) => ({
      ...prev,
      name,
    }));
  };

  return (
    <Card
      className={cn(
        styles.mainCard,
        "select-none",
        "dark:select-border-transparent"
      )}
    >
      <CardContent className={styles.cardContent}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <LoadingAnimation />
            <p>Creating route...</p>
          </div>
        ) : pageState === "initial" ? (
          <>
            {/* Shift Selection with Create Route Button */}
            <div className={styles.shiftHeader}>
              <ShiftSelection
                selectedShift={selectedShift}
                onShiftChange={handleShiftChange}
                shifts={shifts}
                stats={{
                  shifts: shifts.length,
                  employees: employees.length,
                  routes: routes.length,
                  shuttlesCount: shuttles.length,
                }}
              />

              {/* Location Selection - only show when shift is selected */}
              {selectedShift && (
                <div className={styles.locationSelectionWrapper}>
                  <LocationSelection
                    selectedLocation={selectedLocation}
                    onLocationChange={handleLocationChange}
                    locations={locations}
                  />
                </div>
              )}

               {selectedShift && (
                 <div className={styles.createButtonWrapper}>
                   <CustomButton onClick={handleCreateRoute} disabled={!selectedLocation}>
                     Create Route
                   </CustomButton>
                 </div>
               )}
            </div>

            {/* Main Content Grid - Always show */}
            <div className={styles.mainGrid}>
              {/* Left Panel - Routes */}
              <div className={styles.sidePanel}>
                <div className={styles.routeListHeader}>
                  <h2 className={styles.cardTitle}>Current Routes</h2>
                  <span className={styles.cardBadge}>
                    {routes.length} routes
                  </span>
                </div>
                <ScrollArea className={styles.routeListScroll}>
                  <RouteList routes={routes} />
                </ScrollArea>
              </div>

              {/* Right Panel - Employees */}
              <div className={styles.mainContent}>
                <div className={styles.employeeTableHeader}>
                  <h2 className={styles.cardTitle}>Available Employees</h2>
                  <span className={styles.cardBadge}>
                    {employees.length} employees
                  </span>
                </div>
                <div className={styles.tableWrapper}>
                  <EmployeeTable data={employees} />
                </div>
              </div>
            </div>
          </>
        ) : (
          // Show form for both creating and preview states
          <>
            <CreateRouteForm
              key={`create-route-form-${pageState}`}
              selectedShift={routeData.selectedShift || selectedShift}
              routeData={routeData}
              setRouteData={setRouteData}
              onBack={handleBackToList}
              onPreview={handlePreview}
              employees={employees}
              shiftEndTime={routeData.shiftEndTime}
              isPreviewMode={pageState === "preview"}
              shifts={shifts}
            />
            {/* Show preview overlay when in preview state */}
            {pageState === "preview" && (
              <div className={styles.previewOverlay}>
                <ShuttlePreview
                  routeData={{
                    ...routeData,
                    selectedShift: routeData.selectedShift || selectedShift,
                    setName: handleNameChange,
                  }}
                  show={true}
                  onClose={() => setPageState("creating")}
                  onAccept={handleCreateRouteSubmit}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default CreateRoute;
