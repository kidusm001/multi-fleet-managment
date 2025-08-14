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

// Local Components
import ShiftSelection from "./components/ShiftSelection";
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
  const [selectedShift, setSelectedShift] = useState(null);
  const [routeData, setRouteData] = useState({
    name: "",
    selectedEmployees: [],
    selectedShift: null,
    selectedShuttle: null,
    shiftEndTime: null,
    setName: (name) => handleNameChange(name),
  });
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [shuttles, setShuttles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load shift from navigation state or stored state
  useEffect(() => {
    // First check location state for shift data
    if (location.state?.selectedShift) {
      setSelectedShift(location.state.selectedShift);
    }
    // Then check if we have a stored shift in sessionStorage (for when we return to this page)
    else {
      const storedShift = sessionStorage.getItem("selectedCreateRouteShift");
      if (storedShift) {
        setSelectedShift(storedShift);
      }
    }
  }, [location.state]);

  // Update routeData with shift information whenever selectedShift or shifts change
  useEffect(() => {
    if (selectedShift && shifts.length) {
      // Store selected shift in session storage for persistence
      sessionStorage.setItem("selectedCreateRouteShift", selectedShift);

      // Find the selected shift data
      const selectedShiftData = shifts.find(
        (s) => s.id === parseInt(selectedShift)
      );

      if (selectedShiftData) {
        setRouteData((prev) => ({
          ...prev,
          selectedShift: {
            id: parseInt(selectedShift),
            name: selectedShiftData.name,
            startTime: selectedShiftData.startTime,
            endTime: selectedShiftData.endTime,
          },
          shiftStartTime: selectedShiftData.startTime,
          shiftEndTime: selectedShiftData.endTime,
        }));
      }
    }
  }, [selectedShift, shifts]);

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

  // Load shift-specific data
  useEffect(() => {
    if (selectedShift) {
      const fetchShiftData = async () => {
        try {
          const shiftId = Number(selectedShift);
          if (isNaN(shiftId)) {
            throw new Error("Invalid shift ID");
          }

          const [employeesResponse, routesResponse] = await Promise.all([
            getUnassignedEmployeesByShift(shiftId),
            getRoutesByShift(shiftId),
          ]);

          setEmployees(employeesResponse.data);
          setRoutes(routesResponse.data);
        } catch (error) {
          toast.error("Failed to load shift data: " + error.message);
        }
      };
      fetchShiftData();
    }
  }, [selectedShift]);

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

  const handleShiftChange = (shift) => {
    setSelectedShift(shift);
    // Route data will update via the useEffect that watches selectedShift
  };

  const handleCreateRoute = () => {
    setPageState("creating");
  };

  const handleBackToList = () => {
    setPageState("initial");
    // Don't reset the shift data when going back
    setRouteData((prev) => ({
      ...prev,
      name: "",
      selectedEmployees: [],
      selectedShuttle: null,
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
      if (selectedShift) {
        const employeesResponse = await getUnassignedEmployeesByShift(
          Number(selectedShift)
        );
        setEmployees(employeesResponse.data);
      }

      toast.success("Route created successfully!");

      // Reset route data but keep the shift selection
      setRouteData({
        name: "",
        selectedEmployees: [],
        selectedShift: routeData.selectedShift, // Keep shift data
        selectedShuttle: null,
        shiftEndTime: routeData.shiftEndTime, // Keep shift end time
        setName: (name) => handleNameChange(name),
      });

      // Go back to initial state
      setPageState("initial");

      // Refresh routes list
      const updatedRoutesResponse = await getRoutesByShift(
        Number(selectedShift)
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
              {selectedShift && (
                <div className={styles.createButtonWrapper}>
                  <CustomButton onClick={handleCreateRoute}>
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
              selectedShift={selectedShift}
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
