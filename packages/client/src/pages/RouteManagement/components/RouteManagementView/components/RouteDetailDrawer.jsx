import { useState } from "react";
import { format } from "date-fns";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@components/Common/UI/drawer";
import { Button } from "@components/Common/UI/Button";
import { ScrollArea } from "@components/Common/UI/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@components/Common/UI/Tabs";
import {
  MapPin,
  Clock,
  Users,
  Bus,
  Building2,
  UserMinus,
  X,
  Check,
  Trash2,
  Power,
} from "lucide-react";
import PropTypes from "prop-types";
import { cn } from "@lib/utils";
import { calculateRouteMetrics } from "@services/routeCalculationService";
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
import { toast } from "sonner";
import { routeService } from "@services/routeService";

const styles = `
@keyframes slideOutDown {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100%);
  }
}

@keyframes drawerOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`;

if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

const RouteDetailDrawer = ({
  route,
  isOpen,
  onClose,
  onMapPreview,
  onRemoveEmployee,
  onDeleteRoute,
  onRouteUpdate,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeeToRemove, setEmployeeToRemove] = useState(null);
  const [employeesToRemove, setEmployeesToRemove] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  // sonner toast imported directly

  if (!route) return null;

  const _updateRouteMetrics = async (stops) => {
    try {
      // Filter out stops without employees
      const activeStops = stops.filter((stop) => stop.employee);

      if (activeStops.length < 2) return null;

      // Extract coordinates for calculation - ensure they're in [longitude, latitude] format
      const coordinates = activeStops
        .map((stop) => [parseFloat(stop.longitude), parseFloat(stop.latitude)])
        .filter(
          (coord) =>
            !isNaN(coord[0]) &&
            !isNaN(coord[1]) &&
            coord[0] !== null &&
            coord[1] !== null
        );

      if (coordinates.length < 2) {
        console.error("Not enough valid coordinates after filtering");
        return null;
      }

      // Get route's location coordinates or fallback to null (will use HQ)
      const startLocation = route.location?.longitude && route.location?.latitude
        ? [route.location.longitude, route.location.latitude]
        : null;

      // Calculate new metrics
      const metrics = await calculateRouteMetrics(coordinates, startLocation);
      return metrics;
    } catch (error) {
      console.error("Error updating route metrics:", error);
      return null;
    }
  };

  const handleSingleEmployeeRemove = async (employeeData) => {
    try {
      // Get remaining stops after removal
      const updatedStops = route.stops.filter(
        (stop) => stop.employee?.id !== employeeData.employee.id
      );

      const remainingEmployees = updatedStops.filter((stop) => stop.employee);

      // If we'll have at least 2 employees after removal, calculate new metrics
      if (remainingEmployees.length >= 2) {
        const coordinates = remainingEmployees.map((stop) => [
          stop.longitude,
          stop.latitude,
        ]);

        // Get route's location coordinates
        const startLocation = route.location?.longitude && route.location?.latitude
          ? [route.location.longitude, route.location.latitude]
          : null;

        const newMetrics = await calculateRouteMetrics(coordinates, startLocation);

        if (newMetrics) {
          // Remove employee with updated metrics
          await onRemoveEmployee({
            ...employeeData,
            totalDistance: newMetrics.totalDistance,
            totalTime: newMetrics.totalTime,
          });

          // Update local state
          route.totalDistance = newMetrics.totalDistance;
          route.totalTime = newMetrics.totalTime;
        }
      } else if (remainingEmployees.length === 1) {
        // If only one employee will remain, calculate distance from HQ to that employee and back
  const _lastEmployee = remainingEmployees[0];
        await onRemoveEmployee({
          ...employeeData,
          totalDistance: 0, // These will be updated by backend
          totalTime: 0,
        });

        // Simple distance calculation for single employee
        const simpleMetrics = {
          totalDistance: 0, // Calculate simple A to B distance if needed
          totalTime: 15, // Default minimum time
        };
        route.totalDistance = simpleMetrics.totalDistance;
        route.totalTime = simpleMetrics.totalTime;
      } else {
        // No employees will remain, just remove without metrics
        await onRemoveEmployee({
          ...employeeData,
          totalDistance: 0,
          totalTime: 0,
        });
      }

      // Update local stops state
      route.stops = updatedStops;
      setEmployeeToRemove(null);

      toast.success("Employee removed from route successfully");

      // Check if route should be deleted
      if (remainingEmployees.length === 0) {
        handleClose();
        if (onDeleteRoute) {
          await onDeleteRoute(route.id);
        }
      }
    } catch (error) {
      console.error("Error removing employee:", error);
      toast.error(error.message || "Failed to remove employee");
    }
  };

  const handleRemoveSelected = async () => {
    try {
      // Calculate remaining stops after removing selected employees
      const updatedStops = route.stops.filter(
        (stop) => !selectedEmployees.includes(stop.employee?.id)
      );

      const remainingEmployees = updatedStops.filter((stop) => stop.employee);

      // Calculate new metrics based on remaining employees
      let newMetrics = null;
      if (remainingEmployees.length >= 2) {
        const coordinates = remainingEmployees.map((stop) => [
          stop.longitude,
          stop.latitude,
        ]);

        // Get route's location coordinates
        const startLocation = route.location?.longitude && route.location?.latitude
          ? [route.location.longitude, route.location.latitude]
          : null;

        newMetrics = await calculateRouteMetrics(coordinates, startLocation);
        if (!newMetrics) {
          throw new Error("Failed to calculate new route metrics");
        }
      } else if (remainingEmployees.length === 1) {
        newMetrics = {
          totalDistance: 0,
          totalTime: 15, // Default minimum time
        };
      }

      // Remove each selected employee with the same metrics
      for (const employeeId of selectedEmployees) {
        const stop = route.stops.find((s) => s.employee?.id === employeeId);
        if (stop) {
          await onRemoveEmployee({
            employee: stop.employee,
            routeId: route.id,
            totalDistance: newMetrics ? newMetrics.totalDistance : 0,
            totalTime: newMetrics ? newMetrics.totalTime : 0,
          });
        }
      }

      // Update local state
      route.stops = updatedStops;
      if (newMetrics) {
        route.totalDistance = newMetrics.totalDistance;
        route.totalTime = newMetrics.totalTime;
      }

      setSelectedEmployees([]);
      setEmployeesToRemove(null);

  toast.success(`Successfully removed ${selectedEmployees.length} employees`);

      // Check if route should be deleted
      if (remainingEmployees.length === 0) {
        handleClose();
        if (onDeleteRoute) {
          await onDeleteRoute(route.id);
        }
      }
    } catch (error) {
      console.error("Error removing employees:", error);
  toast.error(error.message || "Failed to remove employees");
    }
  };

  const handleViewMap = (e) => {
    e.preventDefault();
    onClose(); // Close drawer first
    setTimeout(() => {
      onMapPreview(route); // Open map after drawer closes
    }, 300); // Match drawer close animation duration
  };

  const handleClose = () => {
    const drawerContent = document.querySelector('[role="dialog"]');
    const drawerOverlay = document.querySelector(".drawer-overlay");

    if (drawerContent) {
      drawerContent.style.animation = "slideOutDown 0.2s ease-out forwards";
      if (drawerOverlay) {
        drawerOverlay.style.animation = "drawerOut 0.2s ease-out forwards";
      }
      setTimeout(() => {
        onClose();
      }, 180);
    } else {
      onClose();
    }
  };

  const handleDelete = (e) => {
    e?.stopPropagation();
    onClose(); // Close drawer first
    setTimeout(() => {
      onDeleteRoute(route.id); // This will trigger the confirmation dialog
    }, 200);
  };

  const handleToggleStatus = async (e) => {
    e?.stopPropagation();
    try {
      setIsUpdatingStatus(true);
      const newStatus = route.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await routeService.updateRouteStatus(route.id, newStatus);
      toast.success(`Route ${newStatus === "ACTIVE" ? "activated" : "deactivated"} successfully`);
      if (onRouteUpdate) {
        await onRouteUpdate();
      }
    } catch (error) {
      console.error("Failed to update route status:", error);
      toast.error("Failed to update route status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={handleClose}>
        <div className="drawer-overlay fixed inset-0 z-50 bg-black/80" />
        <DrawerContent
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50",
            "h-[85vh] max-w-5xl mx-auto",
            "bg-card",
            "border-t border-border",
            "animate-in slide-in-from-bottom duration-300",
            "data-[state=closed]:animate-[slideOutDown_0.2s_ease-out_forwards]"
          )}
          style={{
            animationDuration: "0.2s",
            animationTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
          }}
        >
          <DrawerHeader className="border-b border-border bg-background">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="text-xl">
                  {route.name}
                </DrawerTitle>
                <DrawerDescription className="flex items-center gap-2 mt-1">
                  <Bus className="h-4 w-4 text-sky-500" />
                  {(route.shuttle?.name || route.vehicle?.name || route.vehicle?.plateNumber) || "No shuttle assigned"}
                </DrawerDescription>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant={route.status === "ACTIVE" ? "outline" : "default"}
                  size="sm"
                  onClick={handleToggleStatus}
                  disabled={isUpdatingStatus}
                  className={cn(
                    "gap-2",
                    route.status === "ACTIVE"
                      ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                      : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  )}
                >
                  <Power className="h-4 w-4" />
                  {isUpdatingStatus 
                    ? "Updating..." 
                    : route.status === "ACTIVE" 
                      ? "Deactivate" 
                      : "Activate"}
                </Button>
                <div className="h-8 w-px bg-border" />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon">
                    <X className="h-5 w-5" />
                  </Button>
                </DrawerClose>
              </div>
            </div>
          </DrawerHeader>

          <div className="p-6 bg-background">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="passengers">Passengers</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Redesigned Overview Layout */}
                <div className="bg-gradient-to-br from-sky-50/50 to-indigo-50/50 dark:from-sky-900/30 dark:to-indigo-900/30 rounded-2xl p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="col-span-2">
                      <h3 className="text-lg font-medium mb-4">
                        Route Summary
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <InfoCard
                          icon={<MapPin className="h-5 w-5 text-sky-500" />}
                          label="Total Stops"
                          value={`${route.stops?.length || 0} stops`}
                        />
                        <InfoCard
                          icon={<Users className="h-5 w-5 text-indigo-500" />}
                          label="Passengers"
                          value={`${
                            route.stops?.filter((stop) => stop.employee)
                              .length || 0
                          }`}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Time & Distance</h3>
                      <div className="space-y-3">
                        <InfoCard
                          icon={<Clock className="h-5 w-5 text-rose-500" />}
                          label="Total Time"
                          value={`${route.totalTime} min`}
                          variant="condensed"
                        />
                        <InfoCard
                          icon={<Building2 className="h-5 w-5 text-teal-500" />}
                          label="Distance"
                          value={`${route.totalDistance.toFixed(1)} km`}
                          variant="condensed"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Schedule</h3>
                      <div className="space-y-3">
                        <div className="bg-card/60 rounded-xl p-4">
                          <div className="flex justify-between items-center mb-2">
                            <TimeInfo
                              label="Start"
                              time={format(
                                new Date(route.startTime),
                                "hh:mm a"
                              )}
                            />
                            <TimeInfo
                              label="End"
                              time={format(new Date(route.endTime), "hh:mm a")}
                            />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {route.shift?.name || "No shift assigned"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-200/50 dark:border-zinc-700/50">
                    <Button
                      className="w-full h-12 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                      onClick={handleViewMap}
                    >
                      <MapPin className="mr-2 h-5 w-5" />
                      View Route Map
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="passengers">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-foreground">
                    Passengers (
                    {route.stops?.filter((stop) => stop.employee).length || 0})
                  </h3>
                  <div className="flex items-center gap-2">
                    {selectedEmployees.length > 0 ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEmployees([])}
                          className="text-muted-foreground"
                        >
                          Clear ({selectedEmployees.length})
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setEmployeesToRemove(true)}
                          className="gap-2"
                        >
                          <UserMinus className="h-4 w-4" />
                          Remove
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
                <ScrollArea className="h-[calc(85vh-16rem)]">
                  <div className="space-y-3 pr-4">
                    {route.stops
                      ?.filter((stop) => stop.employee)
                      .map((stop, index) => (
                        <PassengerCard
                          key={stop.id}
                          stop={stop}
                          index={index + 1}
                          isSelected={selectedEmployees.includes(
                            stop.employee.id
                          )}
                          onSelect={() => {
                            setSelectedEmployees((prev) =>
                              prev.includes(stop.employee.id)
                                ? prev.filter((id) => id !== stop.employee.id)
                                : [...prev, stop.employee.id]
                            );
                          }}
                          onRemoveEmployee={() =>
                            setEmployeeToRemove({
                              employee: stop.employee,
                              routeId: route.id,
                            })
                          }
                        />
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          <DrawerFooter className="border-t border-border bg-background">
            <DrawerClose asChild>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/*  confirmation dialogs */}
      <AlertDialog
        open={!!employeeToRemove}
        onOpenChange={() => setEmployeeToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {employeeToRemove?.employee?.name}{" "}
              from this route? This will recalculate the route&#39;s distance and
              time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleSingleEmployeeRemove(employeeToRemove);
                setEmployeeToRemove(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!employeesToRemove}
        onOpenChange={() => setEmployeesToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Selected Employees</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedEmployees.length}{" "}
              employees from this route? This will recalculate the route&#39;s
              distance and time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveSelected}>
              Remove All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// New TimeInfo component
const TimeInfo = ({ label, time }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium mt-0.5 text-foreground">{time}</p>
  </div>
);

// Updated InfoCard to support variants
const InfoCard = ({ icon, label, value, variant = "default" }) => (
  <div
    className={cn(
      "bg-card",
      "rounded-xl transition-colors",
      variant === "default" ? "p-4 space-y-2" : "p-3 flex items-center gap-3"
    )}
  >
    {variant === "default" ? (
      <>
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </>
    ) : (
      <>
        <div className="p-2 bg-muted rounded-lg">{icon}</div>
        <div>
          <p className="text-sm text-foreground font-medium">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </>
    )}
  </div>
);

const PassengerCard = ({
  stop,
  index,
  isSelected,
  onSelect,
  onRemoveEmployee,
}) => (
  <div
    className={cn(
      "bg-card",
      "hover:bg-muted",
      "border border-border",
      "flex items-center justify-between p-4 rounded-xl",
      "transition-all duration-200",
      isSelected && "ring-2 ring-primary"
    )}
  >
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground w-6">
          #{index}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={cn(
            "w-5 h-5 rounded-md flex items-center justify-center cursor-pointer",
            "transition-all duration-200",
            "border-2",
            isSelected
              ? "!bg-sky-500 dark:!bg-sky-400 !border-sky-500 dark:!border-sky-400"
              : "!border-zinc-200 dark:!border-zinc-600 hover:!border-sky-500 dark:hover:!border-sky-400"
          )}
        >
          <Check
            className={cn(
              "h-3 w-3 text-white dark:text-foreground transition-opacity",
              isSelected ? "opacity-100" : "opacity-0"
            )}
          />
        </button>
      </div>
      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
        <span className="text-lg font-medium text-sky-500">
          {stop.employee.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </span>
      </div>
      <div>
        <p className="font-medium text-foreground">{stop.employee.name}</p>
        <p className="text-sm text-muted-foreground">
          {stop.employee.department?.name || "No Department"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {stop.location}
        </p>
      </div>
    </div>
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.stopPropagation();
        onRemoveEmployee();
      }}
      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
    >
      <UserMinus className="h-4 w-4" />
    </Button>
  </div>
);

RouteDetailDrawer.propTypes = {
  route: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onMapPreview: PropTypes.func.isRequired,
  onRemoveEmployee: PropTypes.func.isRequired,
  onDeleteRoute: PropTypes.func, // Optional prop for route deletion
  onRouteUpdate: PropTypes.func, // Optional prop for route updates
};

InfoCard.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(["default", "condensed"]),
};

TimeInfo.propTypes = {
  label: PropTypes.string.isRequired,
  time: PropTypes.string.isRequired,
};

PassengerCard.propTypes = {
  stop: PropTypes.object.isRequired,
  onRemoveEmployee: PropTypes.func,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
};

export default RouteDetailDrawer;
