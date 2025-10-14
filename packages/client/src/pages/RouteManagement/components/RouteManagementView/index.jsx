import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";
import { routeService } from "@services/routeService";
import { shuttleService } from "@services/shuttleService";
import { shiftService } from "@services/shiftService";
import { departmentService } from "@services/departmentService";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@components/Common/UI/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@lib/utils";
import { RefreshCcw } from "lucide-react";
import { Button } from "@components/Common/UI/Button";
import { Skeleton } from "@components/Common/UI/skeleton";
import { useTheme } from "@contexts/ThemeContext/index";

// Import our components
import Header from "./components/Header";
import SearchAndFilterBar from "./components/SearchAndFilterBar";
import RouteCard from "./components/RouteCard";
import MapPreviewModal from "./components/MapPreviewModal";
import Pagination from "./components/Pagination";
import RouteDetailDrawer from "./components/RouteDetailDrawer";
import RouteTable from "./components/RouteTable";
import StatsPanel from "./components/StatsPanel";
import {
  resolveOriginCoordinates,
  toMapStops,
  withOrderedStops
} from "../../../Dashboard/utils/sortStops";

// Constants for pagination
const ITEMS_PER_PAGE = {
  GRID: 6,
  LIST: 10,
  TABLE: 1000, // High number to effectively show all items in table mode
};

function RouteManagementView({ refreshTrigger }) {
  const location = useLocation();
  const [routes, setRoutes] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [activeRouteId, _setActiveRouteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterShuttle, setFilterShuttle] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterShift, setFilterShift] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [routeToDelete, setRouteToDelete] = useState(null);
  const [employeeToRemove, setEmployeeToRemove] = useState(null);
  const [shuttles, setShuttles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid");
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE.GRID);
  const [showMap, setShowMap] = useState(false);
  const [selectedRouteForMap, setSelectedRouteForMap] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRoutes, setSelectedRoutes] = useState(new Set());
  const [selectedRoute, setSelectedRoute] = useState(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Update itemsPerPage when viewMode changes
  useEffect(() => {
    switch (viewMode) {
      case "grid":
        setItemsPerPage(ITEMS_PER_PAGE.GRID);
        break;
      case "list":
        setItemsPerPage(ITEMS_PER_PAGE.LIST);
        break;
      case "table":
        setItemsPerPage(ITEMS_PER_PAGE.TABLE);
        break;
      default:
        setItemsPerPage(ITEMS_PER_PAGE.GRID);
    }
    // Reset to first page when changing view modes
    setCurrentPage(1);
  }, [viewMode]);

  // Add refresh dependency
  useEffect(() => {
    fetchInitialData();
  }, [refreshTrigger]);

  // Check location state for selectedRouteId and openDrawer flag
  useEffect(() => {
    if (location.state?.selectedRouteId && location.state?.openDrawer) {
      console.log(
        "Opening route drawer for ID:",
        location.state.selectedRouteId
      );
      const routeId = String(location.state.selectedRouteId);

      // Find the route with the matching ID if routes are loaded
      if (routes.length > 0) {
        const foundRoute = routes.find((route) => String(route.id) === routeId);
        if (foundRoute) {
          console.log("Found route in current routes:", foundRoute);
          setSelectedRoute(foundRoute);
          return;
        }
      }

      // If route not found in current routes or routes not loaded yet, fetch it individually
      console.log("Route not found in current routes, fetching individually");
      const fetchRouteById = async () => {
        try {
          const response = await routeService.getRouteById(routeId);
          if (response && response.data) {
            console.log("Successfully fetched route by ID:", response.data);
            setSelectedRoute(response.data);
          }
        } catch (error) {
          console.error("Failed to fetch route by ID:", error);
        }
      };
      fetchRouteById();
    }
  }, [location.state, routes]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Use useCache=false to ensure fresh data when refreshing
      const [routesData, shuttlesData, departmentsData, shiftsData] =
        await Promise.all([
          routeService.getAllRoutes(false),
          shuttleService.getShuttles(),
          departmentService.getAllDepartments(),
          shiftService.getAllShifts(),
        ]);

      // Map departments for quick lookup
      const departmentsMap = new Map(
        departmentsData.map((dept) => [dept.id, dept])
      );

      // Enhance routes with department data
      const enhancedRoutes = routesData.map((route) => ({
        ...route,
        stops: route.stops?.map((stop) => ({
          ...stop,
          employee: stop.employee
            ? {
                ...stop.employee,
                department: departmentsMap.get(stop.employee.departmentId),
              }
            : null,
        })),
      }));

  const normalizedRoutes = enhancedRoutes.map((route) => withOrderedStops(route));

  setRoutes(normalizedRoutes);
  setFilteredRoutes(normalizedRoutes);
      setShuttles(shuttlesData);
      setDepartments(departmentsData);
      setShifts(shiftsData);
    } catch (err) {
      setError("Failed to fetch data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter routes based on search and filters
  useEffect(() => {
    let filtered = [...routes];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (route) =>
          route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          route.id.toString().includes(searchQuery.toLowerCase()) ||
          route.shuttle?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          route.vehicle?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          route.vehicle?.plateNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((route) => route.status === filterStatus);
    }

    // Apply shuttle filter
    if (filterShuttle !== "all") {
      filtered = filtered.filter(
        (route) => (route.shuttleId === filterShuttle || route.vehicleId === filterShuttle)
      );
    }

    // Apply department filter
    if (filterDepartment !== "all") {
      filtered = filtered.filter((route) =>
        route.stops.some(
          (stop) => stop.employee?.departmentId === filterDepartment
        )
      );
    }

    // Apply shift filter
    if (filterShift !== "all") {
      filtered = filtered.filter(
        (route) => route.shiftId === filterShift
      );
    }

    setFilteredRoutes(filtered);
  }, [
    routes,
    searchQuery,
    filterStatus,
    filterShuttle,
    filterDepartment,
    filterShift,
  ]);

  // Ensure current page is valid
  useEffect(() => {
    const maxPage = Math.ceil(filteredRoutes.length / itemsPerPage);
    if (currentPage > maxPage && maxPage > 0) {
      setCurrentPage(maxPage);
    }
  }, [filteredRoutes.length, itemsPerPage, currentPage]);

  const handleDelete = (routeId) => {
    setRouteToDelete(routeId); // This will trigger the AlertDialog
  };

  const handleRemoveEmployee = async (employeeData) => {
    if (!employeeData?.employee?.id || !employeeData?.routeId) {
  toast.error("Invalid employee data. Missing employee ID or route ID.");
      return;
    }

    try {
      const result = await routeService.removeEmployeeFromRoute(employeeData);

      // Get updated route with new metrics
      const updatedRoute = await routeService.getRouteById(
        employeeData.routeId
      );

      // Update local state
      setRoutes((prevRoutes) =>
        prevRoutes.map((route) =>
          route.id === employeeData.routeId ? updatedRoute : route
        )
      );

      setEmployeeToRemove(null);

      toast.success(
        result.message || "Employee removed and route metrics updated successfully"
      );
    } catch (err) {
      console.error("Error removing employee:", err);
      toast.error(err.message || "Failed to remove employee");
    }
  };

  const handleRouteUpdate = async () => {
    try {
      await fetchInitialData();
      // Update selected route with fresh data
      if (selectedRoute) {
        const updatedRoute = await routeService.getRouteById(selectedRoute.id);
        setSelectedRoute(withOrderedStops(updatedRoute));
      }
    } catch (err) {
      console.error("Error refreshing routes:", err);
    }
  };

  const handleMapPreview = (route) => {
    const orderedRoute = withOrderedStops(route);
    const originCoords = resolveOriginCoordinates(orderedRoute);
    const mapStops = toMapStops(orderedRoute.stops, originCoords);

    const routeForMap = {
      id: orderedRoute.id,
      coordinates: mapStops.coordinates,
      areas: mapStops.areas,
      employeeUserIds: mapStops.employeeUserIds,
      dropOffOrder: mapStops.coordinates.map((_, index) => index),
      stops: mapStops.coordinates.length,
      passengers: orderedRoute.stops.filter((stop) => stop.employee).length,
      status: orderedRoute.status,
      location: orderedRoute.location,
    };

    setSelectedRouteForMap(routeForMap);
    setShowMap(true);
  };

  // Calculate pagination values
  const totalPages = Math.ceil(filteredRoutes.length / itemsPerPage);

  // Get paginated routes based on view mode
  // For table mode, we don't paginate (show all filtered routes)
  // For grid/list mode, we paginate normally
  const paginatedRoutes =
    viewMode === "table"
      ? filteredRoutes
      : filteredRoutes.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage
        );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
    exit: {
      y: -20,
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  // Add handler for bulk delete
  const handleBulkDelete = () => {
    // Convert Set to array for confirmation dialog
    const routeIds = Array.from(selectedRoutes);
    setRouteToDelete(routeIds); // Pass array of IDs for bulk delete
  };

  // Add handler for toggling selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedRoutes(new Set());
    }
  };

  // Add handler for selecting/deselecting a route
  const handleRouteSelect = (routeId) => {
    setSelectedRoutes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(routeId)) {
        newSet.delete(routeId);
      } else {
        newSet.add(routeId);
      }
      return newSet;
    });
  };

  const handleRouteClick = (route) => {
    setSelectedRoute(withOrderedStops(route));
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-12 w-[300px]" />
          <Skeleton className="h-12 w-[200px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-[1.6/1] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-[60vh] space-y-4"
      >
        <div className="text-red-500 text-lg">{error}</div>
        <Button onClick={fetchInitialData} variant="outline" className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Retry
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 p-4 md:p-6 flex flex-col">
      {/* Header Section - Update with improved styling and spacing */}
      <div className="flex flex-col gap-4 md:gap-6 sticky top-0 z-10 bg-background/80 backdrop-blur-lg pb-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <Header
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            showItemsPerPageSelector={
              viewMode !== "table"
            }
          />
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
            {/* Only show selection mode options in grid or list view */}
            {viewMode !== "table" &&
              (isSelectionMode ? (
                <>
                  <Button
                    variant="outline"
                    onClick={toggleSelectionMode}
                    className="gap-2 rounded-lg border-border/30 hover:bg-background/90 text-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleBulkDelete}
                    disabled={selectedRoutes.size === 0}
                    className="gap-2 rounded-lg text-sm"
                  >
                    Delete Selected ({selectedRoutes.size})
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={toggleSelectionMode}
                  className={cn(
                    "gap-2 rounded-lg shadow-sm text-sm",
                    isDark
                      ? "bg-primary/15 text-primary border-primary/20 hover:bg-primary/20"
                      : "bg-blue-500/90 text-white border-blue-600/50 hover:bg-blue-600 hover:text-white"
                  )}
                >
                  Select Routes
                </Button>
              ))}
          </div>
        </div>

        {/* Stats Panel - Now with enhanced visual design */}
        <StatsPanel
          routes={filteredRoutes}
          shifts={shifts}
          shuttles={shuttles}
        />

        <SearchAndFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
          filterShuttle={filterShuttle}
          onShuttleChange={setFilterShuttle}
          filterDepartment={filterDepartment}
          onDepartmentChange={setFilterDepartment}
          filterShift={filterShift}
          onShiftChange={setFilterShift}
          shuttles={shuttles}
          departments={departments}
          shifts={shifts}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-4 md:gap-6">
        {viewMode === "table" ? (
          // Wrap table in a container that constrains width on mobile but allows overflow on desktop
          <div className="w-full overflow-x-auto md:overflow-x-visible" style={{ maxWidth: '90vw' }}>
            <RouteTable
              routes={paginatedRoutes}
              onRouteClick={handleRouteClick}
              onExportClick={() => {}}
              onMapPreview={handleMapPreview}
              onDeleteRoute={handleDelete}
              filterDepartment={filterDepartment} // Pass the main filter to RouteTable
            />
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={cn(
              "grid gap-4 md:gap-6 w-full",
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                : viewMode === "list"
                ? "grid-cols-1"
                : "grid-cols-1"
            )}
          >
            <AnimatePresence mode="popLayout">
              {paginatedRoutes.map((route) => (
                <motion.div
                  key={route.id}
                  variants={itemVariants}
                  layoutId={`route-${route.id}`}
                  layout="position"
                  className={cn("group w-full", viewMode === "list" && "col-span-full")}
                >
                  <motion.div layout>
                    <RouteCard
                      route={route}
                      isActive={activeRouteId === route.id}
                      viewMode={viewMode}
                      onRouteClick={() => handleRouteClick(route)}
                      onMapPreview={handleMapPreview}
                      onDeleteRoute={handleDelete}
                      onRemoveEmployee={setEmployeeToRemove}
                      isSelected={selectedRoutes.has(route.id)}
                      onSelect={handleRouteSelect}
                      isSelectionMode={isSelectionMode}
                    />
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Pagination - Only show in grid or list mode */}
        {viewMode !== "table" && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredRoutes.length}
          />
        )}
      </div>

      {/* Dialogs */}
      <AlertDialog
        open={!!routeToDelete}
        onOpenChange={() => setRouteToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Route{Array.isArray(routeToDelete) && "s"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {Array.isArray(routeToDelete)
                ? `Are you sure you want to delete ${routeToDelete.length} routes? This action cannot be undone.`
                : "Are you sure you want to delete this route? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (Array.isArray(routeToDelete)) {
                  // Bulk delete
                  await Promise.all(
                    routeToDelete.map((id) => routeService.deleteRoute(id))
                  );
                  setRoutes(
                    routes.filter((r) => !routeToDelete.includes(r.id))
                  );
                  setIsSelectionMode(false);
                  setSelectedRoutes(new Set());
                } else {
                  // Single delete
                  await routeService.deleteRoute(routeToDelete);
                  setRoutes(routes.filter((r) => r.id !== routeToDelete));
                }
                setRouteToDelete(null);
                setSelectedRoute(null); // Close drawer if open

                toast.success("Route(s) deleted successfully");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!employeeToRemove}
        onOpenChange={() => setEmployeeToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Employee from Route</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {employeeToRemove?.employee?.name}{" "}
              from this route? Their stop will be unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleRemoveEmployee(employeeToRemove)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Map Preview Modal */}
      <AnimatePresence>
        {showMap && (
          <MapPreviewModal
            selectedRoute={selectedRouteForMap}
            onClose={() => {
              setShowMap(false);
              setSelectedRouteForMap(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Route Detail Drawer */}
      <RouteDetailDrawer
        route={selectedRoute}
        isOpen={!!selectedRoute}
        onClose={() => setSelectedRoute(null)}
        onMapPreview={handleMapPreview}
        onRemoveEmployee={handleRemoveEmployee}
        onDeleteRoute={handleDelete}
        onRouteUpdate={handleRouteUpdate}
      />
    </div>
  );
}

RouteManagementView.propTypes = {
  refreshTrigger: PropTypes.any,
};

export default RouteManagementView;
