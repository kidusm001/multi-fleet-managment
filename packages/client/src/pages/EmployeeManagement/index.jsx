import { useState, useCallback, useEffect } from "react";
import { useRole } from "@contexts/RoleContext";
import { toast } from 'sonner';
// removed unused XLSX
import { ROLES } from "@data/constants";
// imports trimmed
import { employeeService } from "@pages/Settings/services/employeeService";
// Removed candidate/batch services and CSV utilities
// removed unused ExcelUpload
import LoadingWrapper from "@components/Common/LoadingAnimation/LoadingWrapper";
// removed unused api

import { RoleSelector } from "./components/RoleSelector";
import { StatsSection } from "./components/StatsSection";
import { EmployeeTable } from "./components/EmployeeTable";
// Removed recruitment and batch review components

export default function EmployeeManagement() {
  const { role, setRole } = useRole();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [_searchTerm, _setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Apply filters to employees (defined before effects to avoid TDZ issues)
  const applyFilters = useCallback((employeesList) => {
    let filtered = [...employeesList];
    
    // Department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter((e) => 
        (e.department?.id?.toString() === departmentFilter) || 
        (e.departmentId?.toString() === departmentFilter)
      );
    }

    // Shift filter
    if (shiftFilter !== "all") {
      filtered = filtered.filter((e) => 
        (e.shift?.id?.toString() === shiftFilter) || 
        (e.shiftId?.toString() === shiftFilter)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    // Assignment filter
    if (assignmentFilter === "assigned") {
      filtered = filtered.filter((e) => e.assigned === true);
    } else if (assignmentFilter === "unassigned") {
      filtered = filtered.filter((e) => e.assigned === false);
    }

    // Search term
  // Search removed
    
    // Update pagination data
    setTotalEmployees(filtered.length);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage) || 1); // Ensure at least 1 page even when empty
    
    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);
    
    setFilteredEmployees(paginatedData);
  }, [departmentFilter, shiftFilter, statusFilter, assignmentFilter, currentPage, itemsPerPage]);

  // Fetch departments and shifts
  useEffect(() => {
    const fetchDepartmentsAndShifts = async () => {
      try {
        const [deptResponse, shiftsResponse] = await Promise.all([
          employeeService.getDepartments(),
          employeeService.getShifts()
        ]);
        setDepartments(deptResponse);
        setShifts(shiftsResponse);
      } catch (error) {
        console.error('Error fetching departments and shifts:', error);
        toast({
          title: "Error",
          description: "Failed to load departments and shifts",
          variant: "destructive",
        });
      }
    };

    fetchDepartmentsAndShifts();
  }, []);

  // Fetch employees including deleted ones (marked as inactive)
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Use the management endpoint to get all employees including deleted ones
        const response = await employeeService.listEmployeesForManagement();
        
        if (isMounted) {
          setEmployees(response);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching employees:', error);
          setError('Failed to load employees. Please try again later.');
          toast({
            title: "Error",
            description: "Failed to load employees",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchEmployees();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Apply filters when filter values change
  useEffect(() => {
    applyFilters(employees);
  }, [departmentFilter, shiftFilter, statusFilter, assignmentFilter, employees, currentPage, itemsPerPage, applyFilters]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [departmentFilter, shiftFilter, statusFilter, assignmentFilter]);

  // Removed candidate fetching and filtering

  // No longer need to filter in this function - we're using the filteredEmployees state
  const getFilteredEmployees = useCallback(() => {
    return filteredEmployees;
  }, [filteredEmployees]);

  const getEmployeeStats = useCallback(() => {
    const total = employees.length;
    const assigned = employees.filter((e) => e.assigned === true).length;
    const unassigned = total - assigned;
    const locationGroups = employees.reduce((acc, emp) => {
      acc[emp.location] = (acc[emp.location] || 0) + 1;
      return acc;
    }, {});
    const topLocationEntries = Object.entries(locationGroups).sort(
      (a, b) => b[1] - a[1]
    );
    const topLocation = topLocationEntries.length > 0 ? topLocationEntries[0] : ["None", 0];
    const activeEmployees = employees.filter(e => e.status !== 'inactive' && e.status !== 'removed').length;

    return {
      total,
      assigned,
      unassigned,
      assignedPercentage: total > 0 ? Math.round((assigned / total) * 100) : 0,
      topLocation: topLocation[0],
      topLocationCount: topLocation[1],
      activeEmployees
    };
  }, [employees]);

  // Removed candidate actions

  const handleDeactivateEmployee = useCallback(
    async (employeeId) => {
      if (role === ROLES.ADMIN) {
        try {
          setIsLoading(true);
          await employeeService.deactivateEmployee(employeeId);

          // Update employees list with the deactivated employee
          setEmployees(prevEmployees => 
            prevEmployees.map(emp => 
              emp.id === employeeId 
                ? { ...emp, deleted: true, status: 'inactive' } 
                : emp
            )
          );

          toast({
            title: "Success",
            description: "Employee deactivated successfully",
          });
        } catch (error) {
          console.error('Error deactivating employee:', error);
          toast({
            title: "Error",
            description: "Failed to deactivate employee",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    },
  [role]
  );

  const handleActivateEmployee = useCallback(
    async (employeeId) => {
      if (role === ROLES.ADMIN) {
        try {
          setIsLoading(true);
          await employeeService.activateEmployee(employeeId);

          // Update employees list with the reactivated employee
          setEmployees(prevEmployees => 
            prevEmployees.map(emp => 
              emp.id === employeeId 
                ? { ...emp, deleted: false, status: 'active' } 
                : emp
            )
          );

          toast({
            title: "Success",
            description: "Employee activated successfully",
          });
        } catch (error) {
          console.error('Error activating employee:', error);
          toast({
            title: "Error",
            description: "Failed to activate employee",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    },
  [role]
  );

  // Removed export and batch handlers

  // Removed all batch handlers and state

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(Number(newLimit));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  return (
    <LoadingWrapper isLoading={isLoading}>
      <main className="content-area text-[var(--text-primary)]">
        <div className="container mx-auto min-w-[90%] py-6">
          <div className="rounded-[30px] border border-[var(--divider)] shadow-[0_12px_48px_-8px_rgba(66,114,255,0.15),0_8px_24px_-4px_rgba(66,114,255,0.1)] bg-[var(--card-background)]">
            <div className="flex justify-between items-center p-6 border-b border-[var(--divider)]">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                Employee Management
              </h1>
              <RoleSelector role={role} setRole={setRole} />
            </div>

            <div className="p-6">
              {error ? (
                <div className="text-red-500 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 mb-6">
                  {error}
                </div>
              ) : (
                <div className="space-y-6">
                  <StatsSection
                    employees={employees}
                    getEmployeeStats={getEmployeeStats}
                  />

                  {/* Employees Section */}
                  <div className="rounded-2xl border border-[var(--divider)] bg-[var(--card-background)] shadow-lg p-6">
                    <h2 className="text-xl font-bold mb-6 text-[var(--text-primary)]">
                      Employee List
                    </h2>
                    <EmployeeTable
                      role={role}
                      filteredEmployees={getFilteredEmployees()}
                      handleDeactivateEmployee={handleDeactivateEmployee}
                      handleActivateEmployee={handleActivateEmployee}
                      departmentFilter={departmentFilter}
                      setDepartmentFilter={setDepartmentFilter}
                      shiftFilter={shiftFilter}
                      setShiftFilter={setShiftFilter}
                      statusFilter={statusFilter}
                      setStatusFilter={setStatusFilter}
                      assignmentFilter={assignmentFilter}
                      setAssignmentFilter={setAssignmentFilter}
                      departments={departments}
                      shifts={shifts}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalEmployees}
                      itemsPerPage={itemsPerPage}
                      onPageChange={handlePageChange}
                      onItemsPerPageChange={handleItemsPerPageChange}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </LoadingWrapper>
  );
}
