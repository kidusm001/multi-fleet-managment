import PropTypes from "prop-types";
import { Badge } from "@/components/Common/UI/Badge";
import { Button } from "@components/Common/UI/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/UI/Table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Common/UI/Select";
import { ROLES } from "@data/constants";
import { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmployeeTable({
  role,
  filteredEmployees,
  handleDeactivateEmployee,
  handleActivateEmployee,
  // Filters
  departmentFilter,
  setDepartmentFilter,
  shiftFilter,
  setShiftFilter,
  statusFilter,
  setStatusFilter,
  assignmentFilter,
  setAssignmentFilter,
  departments,
  shifts,
  // Pagination
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) {
  // Add sort configuration state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  // Function to handle sorting
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting to employee data
  const getSortedEmployees = () => {
    const sortableEmployees = [...filteredEmployees];
    if (sortConfig.key) {
      sortableEmployees.sort((a, b) => {
        // Handle nested properties for department and shift
        if (sortConfig.key === "department") {
          const aValue = a.department?.name || "";
          const bValue = b.department?.name || "";
          if (sortConfig.direction === "ascending") {
            return aValue.localeCompare(bValue);
          }
          return bValue.localeCompare(aValue);
        }

        if (sortConfig.key === "shift") {
          const aValue = a.shift?.name || "";
          const bValue = b.shift?.name || "";
          if (sortConfig.direction === "ascending") {
            return aValue.localeCompare(bValue);
          }
          return bValue.localeCompare(aValue);
        }

        // Handle standard properties
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";

        if (typeof aValue === "string" && typeof bValue === "string") {
          if (sortConfig.direction === "ascending") {
            return aValue.localeCompare(bValue);
          }
          return bValue.localeCompare(aValue);
        } else {
          if (sortConfig.direction === "ascending") {
            return aValue > bValue ? 1 : -1;
          }
          return aValue < bValue ? 1 : -1;
        }
      });
    }
    return sortableEmployees;
  };

  // Get sorted employees
  const sortedEmployees = getSortedEmployees();

  // Add sort indicator component
  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <span className="ml-1 text-gray-400">↕</span>;
    }
    return (
      <span className="ml-1">
        {sortConfig.direction === "ascending" ? "↑" : "↓"}
      </span>
    );
  };

  // Helper function to render assignment badge with improved look
  const renderAssignmentBadge = (employee) => {
    if (employee.assigned === true) {
      return (
        <div className="flex items-center gap-2">
          <Badge
            variant="success"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-3 py-1 font-medium"
          >
            Assigned
          </Badge>
          {employee.shuttle && (
            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full">
              {employee.shuttle}
            </span>
          )}
        </div>
      );
    } else {
      return (
        <Badge
          variant="outline"
          className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-3 py-1 border border-gray-300 dark:border-gray-700"
        >
          Unassigned
        </Badge>
      );
    }
  };

  // Helper function to render status badge with improved look
  const renderStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="success"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-3 py-1 font-medium"
          >
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge
            variant="destructive"
            className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 px-3 py-1 font-medium"
          >
            Inactive
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-3 py-1 font-medium"
          >
            {status || "Unknown"}
          </Badge>
        );
    }
  };

  // Function to generate the array of page numbers to display (from Pagination.jsx)
  const getPageNumbers = () => {
    // Max page buttons to show at once (excluding prev/next)
    const maxPageButtons = 5;
    let pages = [];

    // Always show first page
    pages.push(1);

    if (totalPages <= maxPageButtons) {
      // If total pages is small enough, show all pages
      for (let i = 2; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Handle case when we have many pages
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Add ellipsis for pages between 1 and startPage if needed
      if (startPage > 2) {
        pages.push("ellipsis");
      }

      // Add pages around current page
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis for pages between endPage and lastPage if needed
      if (endPage < totalPages - 1) {
        pages.push("ellipsis2");
      }

      // Always add the last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Employee table with enhanced filtering and pagination */}
      <div className="space-y-4">
          {/* Filters for employee list */}
          <div className="flex flex-wrap gap-3 items-center mb-4">
            {/* Department filter */}
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger className="h-9 w-[180px] text-sm bg-white dark:bg-slate-900">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments &&
                  departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Shift filter */}
            <Select value={shiftFilter} onValueChange={setShiftFilter}>
              <SelectTrigger className="h-9 w-[180px] text-sm bg-white dark:bg-slate-900">
                <SelectValue placeholder="Shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shifts</SelectItem>
                {shifts &&
                  shifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id.toString()}>
                      {shift.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[180px] text-sm bg-white dark:bg-slate-900">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Assignment filter */}
            <Select
              value={assignmentFilter}
              onValueChange={setAssignmentFilter}
            >
              <SelectTrigger className="h-9 w-[180px] text-sm bg-white dark:bg-slate-900">
                <SelectValue placeholder="Assignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>

            {/* Items per page selector */}
            <Select
              value={itemsPerPage.toString()}
              onValueChange={onItemsPerPageChange}
            >
              <SelectTrigger className="h-9 w-[120px] text-sm bg-white dark:bg-slate-900">
                <SelectValue placeholder="Page Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                {/* Removed the ID column as requested */}
                <TableHead onClick={() => requestSort("name")}>
                  Name <SortIndicator columnKey="name" />
                </TableHead>
                <TableHead onClick={() => requestSort("contact")}>
                  Contact <SortIndicator columnKey="contact" />
                </TableHead>
                <TableHead onClick={() => requestSort("email")}>
                  Email <SortIndicator columnKey="email" />
                </TableHead>
                <TableHead onClick={() => requestSort("department")}>
                  Department <SortIndicator columnKey="department" />
                </TableHead>
                <TableHead onClick={() => requestSort("shift")}>
                  Shift <SortIndicator columnKey="shift" />
                </TableHead>
                <TableHead onClick={() => requestSort("location")}>
                  Location <SortIndicator columnKey="location" />
                </TableHead>
                <TableHead onClick={() => requestSort("assigned")}>
                  Assignment <SortIndicator columnKey="assigned" />
                </TableHead>
                <TableHead onClick={() => requestSort("status")}>
                  Status <SortIndicator columnKey="status" />
                </TableHead>
                {role === ROLES.ADMIN && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEmployees.length > 0 ? (
                sortedEmployees.map((item) => (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "border-[var(--divider)]",
                      item.status === "active" &&
                        "bg-emerald-50/30 dark:bg-emerald-900/10",
                      item.status === "inactive" &&
                        "bg-red-50/30 dark:bg-red-900/10"
                    )}
                  >
                    {/* Removed the ID column as requested */}
                    <TableCell className="text-[var(--text-primary)] font-medium">
                      {item.name}
                    </TableCell>
                    <TableCell className="text-[var(--text-primary)]">
                      {item.contact || "-"}
                    </TableCell>
                    <TableCell className="text-[var(--text-primary)]">
                      {item.email || "-"}
                    </TableCell>
                    <TableCell className="text-[var(--text-primary)]">
                      {typeof item.department === "object"
                        ? item.department?.name || "-"
                        : item.department || "-"}
                    </TableCell>
                    <TableCell className="text-[var(--text-primary)]">
                      {typeof item.shift === "object"
                        ? item.shift?.name || "-"
                        : item.shift || "-"}
                    </TableCell>
                    <TableCell className="text-[var(--text-primary)]">
                      {item.location}
                    </TableCell>
                    <TableCell>{renderAssignmentBadge(item)}</TableCell>
                    <TableCell>{renderStatusBadge(item.status)}</TableCell>
                    {role === ROLES.ADMIN && (
                      <TableCell>
                        {item.status === "inactive" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleActivateEmployee(item.id)}
                            className="bg-green-500 hover:bg-green-600 text-white border-none"
                          >
                            Activate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeactivateEmployee(item.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Deactivate
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={role === ROLES.ADMIN ? 9 : 8}
                    className="text-center py-4"
                  >
                    No employees match the current filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

      {/* Updated pagination controls based on Pagination.jsx */}
          {totalItems > 0 && (
            <div className="sticky bottom-0 left-0 right-0 mt-auto flex items-center justify-between px-6 py-4 border-t border-gray-200/50 dark:border-border/50 bg-indigo-50/50 dark:bg-card rounded-lg">
              <div className="text-sm text-gray-500 dark:text-muted-foreground">
                Showing{" "}
                {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{" "}
                {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                {totalItems} employees
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="secondary"
                  size="sm"
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {getPageNumbers().map((page, index) => {
                    if (page === "ellipsis" || page === "ellipsis2") {
                      return (
                        <div key={`ellipsis-${index}`} className="px-2">
                          ...
                        </div>
                      );
                    }
                    return (
                      <Button
                        key={page}
                        onClick={() => onPageChange(page)}
                        variant={currentPage === page ? "primary" : "outline"}
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0",
                          currentPage === page &&
                            "bg-indigo-600 hover:bg-indigo-700 text-white"
                        )}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="secondary"
                  size="sm"
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
    </div>
    </div>
  );
}

EmployeeTable.propTypes = {
  role: PropTypes.string.isRequired,
  filteredEmployees: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      // Make these fields optional and accept either string or object
      contact: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      email: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      department: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      shift: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      location: PropTypes.string.isRequired,
      shuttle: PropTypes.string,
      status: PropTypes.string,
    })
  ).isRequired,
  handleDeactivateEmployee: PropTypes.func.isRequired,
  handleActivateEmployee: PropTypes.func.isRequired,
  // New prop types for filters
  departmentFilter: PropTypes.string,
  setDepartmentFilter: PropTypes.func,
  shiftFilter: PropTypes.string,
  setShiftFilter: PropTypes.func,
  statusFilter: PropTypes.string,
  setStatusFilter: PropTypes.func,
  assignmentFilter: PropTypes.string,
  setAssignmentFilter: PropTypes.func,
  departments: PropTypes.array,
  shifts: PropTypes.array,
  // Add new pagination prop types
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  totalItems: PropTypes.number,
  itemsPerPage: PropTypes.number,
  onPageChange: PropTypes.func,
  onItemsPerPageChange: PropTypes.func,
};
