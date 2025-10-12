import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import AssignmentModal from "./AssignmentModal";
import { getUnassignedEmployeesByShift } from "@/services/api";
import { toast } from "sonner";
import { routeService } from "@/services/routeService";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@/components/Common/UI/Input";
import { Button } from "@/components/Common/UI/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Common/UI/Select";
import LoadingAnimation from "@/components/Common/LoadingAnimation";

function DataSection({
  selectedShift,
  routes = [],
  loading: isRoutesLoading = false,
  onRouteUpdate,
}) {
  const navigate = useNavigate();
  // sonner toast
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get unique departments and locations
  const departments = useMemo(() => {
    const deptSet = new Set(
      availableEmployees.map((emp) =>
        typeof emp.department === "object"
          ? emp.department.name
          : emp.department
      )
    );
    return Array.from(deptSet);
  }, [availableEmployees]);

  const locations = useMemo(() => {
    const locSet = new Set(
      availableEmployees
        .map((emp) => {
          const workLocation = emp.workLocation?.address;
          const stopAddress = emp.stop?.address;
          return [workLocation, stopAddress].filter(loc => loc && loc.trim() !== "");
        })
        .flat()
    );
    return Array.from(locSet);
  }, [availableEmployees]);

  // Filter employees based on search and filters
  const filteredEmployees = useMemo(() => {
    return availableEmployees.filter((employee) => {
      const matchesSearch = searchQuery
        ? employee.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      const matchesDepartment =
        selectedDepartment === "all"
          ? true
          : typeof employee.department === "object"
          ? employee.department.name === selectedDepartment
          : employee.department === selectedDepartment;

      const employeeWorkLocation = employee.workLocation?.address;
      const employeeStopAddress = employee.stop?.address;
      const matchesLocation =
        selectedLocation === "all"
          ? true
          : employeeWorkLocation === selectedLocation || employeeStopAddress === selectedLocation;

      return matchesSearch && matchesDepartment && matchesLocation;
    });
  }, [availableEmployees, searchQuery, selectedDepartment, selectedLocation]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Function to generate page numbers with ellipsis
  const getPageNumbers = () => {
    const maxPageButtons = 5;
    let pages = [];

    // Always show first page
    pages.push(1);

    if (totalPages <= maxPageButtons) {
      // If we have fewer pages than max buttons, show all pages
      for (let i = 2; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Complex pagination with ellipsis
      if (currentPage <= 3) {
        // Near the start
        pages.push(2, 3);
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push("ellipsis");
        for (let i = totalPages - 2; i <= totalPages; i++) {
          if (i > 1) pages.push(i);
        }
      } else {
        // Somewhere in the middle
        pages.push("ellipsis");
        pages.push(currentPage - 1, currentPage, currentPage + 1);
        pages.push("ellipsis2");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDepartment, selectedLocation]);

  useEffect(() => {
    async function fetchEmployees() {
      if (!selectedShift) return;

      setLoading(true);
      setError(null);
      try {
        // Validate that selectedShift is a valid string ID
        if (typeof selectedShift !== 'string' || selectedShift.trim() === '' || selectedShift === 'NaN') {
          throw new Error("Invalid shift ID");
        }

        const response = await getUnassignedEmployeesByShift(selectedShift);
        setAvailableEmployees(response.data);
      } catch (err) {
        console.error("Error fetching employees:", err);
        setError("Failed to load employees. Please try again.");
  toast.error("Failed to load employees. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchEmployees();
  }, [selectedShift]);

  const handleAssignClick = (employee) => {
    console.log("Opening modal for employee:", employee);
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  const handleConfirmAssignment = async (routeId, employeeId, routeMetrics) => {
    try {
      // Validate inputs
      if (!routeId || !employeeId) {
        throw new Error("Route ID and Employee ID are required");
      }

      // Clean and validate route ID (cuid format)
      const cleanRouteId = String(routeId).trim();
      if (!cleanRouteId || cleanRouteId === 'NaN') {
        throw new Error("Invalid route ID");
      }

      // Clean and validate employee ID (cuid format: starts with 'c' followed by alphanumeric)
      const cleanEmployeeId = String(employeeId).trim();
      const cuidRegex = /^c[a-z0-9]{24,}$/i;
      if (!cuidRegex.test(cleanEmployeeId)) {
        console.error("Invalid employee ID format:", cleanEmployeeId);
        throw new Error("Invalid employee ID format");
      }

      // Find the employee in the available employees list to check their stop
      const employee = availableEmployees.find(
        (emp) => emp.id === cleanEmployeeId
      );
      if (!employee) {
        throw new Error("Employee not found in available employees list");
      }

      // Validate employee has a stop
      if (!employee.stopId || !employee.stop) {
        throw new Error("Employee must have a valid stop location");
      }

      // Validate stop is not already assigned to a route
      if (employee.stop.routeId) {
        throw new Error("Employee's stop is already assigned to another route");
      }

      // Log the assignment details for debugging
      console.log("Assigning employee to route:", {
        routeId: cleanRouteId,
        employeeId: cleanEmployeeId,
        employeeStop: employee.stop,
        routeMetrics,
      });

      // Call the addEmployeeToRoute endpoint
      await routeService.addEmployeeToRoute(
        cleanRouteId,
        cleanEmployeeId,
        routeMetrics
      );

      // Get the updated route data
      const updatedRoute = await routeService.getRouteById(cleanRouteId);

      // Refresh the available employees list
      if (typeof selectedShift === 'string' && selectedShift.trim() !== '' && selectedShift !== 'NaN') {
        const response = await getUnassignedEmployeesByShift(selectedShift);
        setAvailableEmployees(response.data);
      }

      // Notify parent component to update routes with the full updated route data
      onRouteUpdate(updatedRoute);

      setShowModal(false);
      toast.success("Employee assigned successfully");

      // Navigate to the assignment tab with the correct state (instead of management tab)
      setTimeout(() => {
        navigate("/routes", {
          state: { 
            refresh: true,
            activeTab: "assignment" 
          }
        });
      }, 1000);
      
    } catch (err) {
      console.error("Error assigning employee:", err);
      // Get the most descriptive error message from the error object
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        err.message ||
        "Failed to assign employee. Please try again.";

    toast.error(errorMessage);
    }
  };

  if (loading || isRoutesLoading) {
    return (
      <div className="flex justify-center items-center h-[400px] flex-col gap-2">
        <LoadingAnimation />
        <p>Loading employee data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-card rounded-2xl md:rounded-3xl p-4 md:p-8 border border-gray-200/50 dark:border-border/50">
      <div className="mb-6 md:mb-8">
        <h3 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 flex items-center gap-3 text-gray-900 dark:text-foreground">
          <UserGroupIcon className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 dark:text-primary" />
          Available Employees
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-gray-200/50 dark:border-border/50 focus:border-indigo-500 focus:ring-indigo-500 dark:focus:border-primary dark:focus:ring-primary"
              />
            </div>
          </div>
          <Select
            value={selectedDepartment}
            onValueChange={setSelectedDepartment}
          >
            <SelectTrigger className="border-gray-200/50 dark:border-border/50">
              <SelectValue placeholder="Filter by Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="border-gray-200/50 dark:border-border/50">
              <SelectValue placeholder="Filter by Location" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200/50 dark:border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-indigo-50/50 dark:bg-card">
              <tr>
                <th className="text-left py-2 md:py-4 px-3 md:px-6 text-xs md:text-xs font-semibold text-indigo-600 dark:text-muted-foreground uppercase tracking-wider border-b border-gray-200/50 dark:border-border/50">
                  Name
                </th>
                <th className="text-left py-2 md:py-4 px-3 md:px-6 text-xs md:text-xs font-semibold text-indigo-600 dark:text-muted-foreground uppercase tracking-wider border-b border-gray-200/50 dark:border-border/50">
                  Work Location
                </th>
                <th className="text-left py-2 md:py-4 px-3 md:px-6 text-xs md:text-xs font-semibold text-indigo-600 dark:text-muted-foreground uppercase tracking-wider border-b border-gray-200/50 dark:border-border/50">
                  Address
                </th>
                <th className="text-left py-2 md:py-4 px-3 md:px-6 text-xs md:text-xs font-semibold text-indigo-600 dark:text-muted-foreground uppercase tracking-wider border-b border-gray-200/50 dark:border-border/50">
                  Department
                </th>
                <th className="text-left py-2 md:py-4 px-3 md:px-6 text-xs md:text-xs font-semibold text-indigo-600 dark:text-muted-foreground uppercase tracking-wider border-b border-gray-200/50 dark:border-border/50">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50 dark:divide-border/50 bg-white dark:bg-card">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="py-8 text-center text-gray-500 dark:text-muted-foreground"
                  >
                    No available employees found
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="hover:bg-indigo-50/50 dark:hover:bg-primary/5 transition-colors"
                  >
                    <td className="py-2 md:py-4 px-3 md:px-6">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-indigo-100/50 dark:bg-primary/10 flex items-center justify-center text-indigo-600 dark:text-primary font-medium text-xs md:text-sm">
                          {employee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-foreground">
                          {employee.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 md:py-4 px-3 md:px-6 text-xs md:text-sm text-gray-500 dark:text-muted-foreground">
                      {employee.workLocation?.address || "No Work Location"}
                    </td>
                    <td className="py-2 md:py-4 px-3 md:px-6 text-xs md:text-sm text-gray-500 dark:text-muted-foreground">
                      {employee.stop?.address || "No Stop Address"}
                    </td>
                    <td className="py-2 md:py-4 px-3 md:px-6">
                      <span className="inline-flex items-center px-1.5 md:px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100/50 dark:bg-primary/10 text-indigo-600 dark:text-primary">
                        {employee.department?.name ||
                          employee.department ||
                          "No Department"}
                      </span>
                    </td>
                    <td className="py-2 md:py-4 px-3 md:px-6">
                      <Button
                        onClick={() => handleAssignClick(employee)}
                        variant="ghost"
                        size="sm"
                        className="h-6 md:h-8 px-2 md:px-3 text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 hover:text-indigo-600 dark:hover:text-primary flex items-center gap-1 md:gap-1.5 rounded-md transition-colors"
                      >
                        <MapPinIcon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        Assign
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200/50 dark:border-border/50 bg-indigo-50/50 dark:bg-card">
            <div className="text-xs md:text-sm text-gray-500 dark:text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredEmployees.length)}{" "}
              of {filteredEmployees.length} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 border-gray-200/50 dark:border-border/50"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              {getPageNumbers().map((page, index) => {
                if (page === "ellipsis" || page === "ellipsis2") {
                  return (
                    <div 
                      key={`ellipsis-${index}`} 
                      className="flex items-center justify-center h-8 w-8"
                    >
                      <EllipsisHorizontalIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  );
                }
                
                return (
                  <Button
                    key={`page-${page}`}
                    variant={currentPage === page ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 p-0 ${
                      currentPage === page
                        ? "bg-indigo-600 dark:bg-primary text-white"
                        : "border-gray-200/50 dark:border-border/50 hover:bg-indigo-50/50 dark:hover:bg-primary/10 hover:text-indigo-600 dark:hover:text-primary hover:border-indigo-200/50 dark:hover:border-primary/20"
                    }`}
                  >
                    {page}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0 border-gray-200/50 dark:border-border/50"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {showModal &&
        selectedEmployee &&
        createPortal(
          <AssignmentModal
            key={selectedEmployee.id}
            employee={selectedEmployee}
            routes={routes}
            onClose={() => {
              setShowModal(false);
              setSelectedEmployee(null);
            }}
            onAssign={handleConfirmAssignment}
            show={showModal}
          />,
          document.body
        )}
    </div>
  );
}

DataSection.propTypes = {
  selectedShift: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  routes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      stops: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          name: PropTypes.string,
          latitude: PropTypes.number,
          longitude: PropTypes.number,
        })
      ),
      shuttles: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired,
          name: PropTypes.string.isRequired,
          capacity: PropTypes.number.isRequired,
          currentLoad: PropTypes.object.isRequired,
        })
      ),
    })
  ),
  loading: PropTypes.bool,
  onRouteUpdate: PropTypes.func.isRequired,
};

export default DataSection;
