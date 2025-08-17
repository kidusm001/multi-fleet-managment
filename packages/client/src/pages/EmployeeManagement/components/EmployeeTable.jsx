import PropTypes from "prop-types";
import { Badge } from "@/components/Common/UI/Badge";
import { Button } from "@components/Common/UI/Button";
import { useToast } from "@components/Common/UI/use-toast";
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
  activeTab,
  role,
  filteredCandidates,
  filteredEmployees,
  handleApproveLocation,
  handleDenyLocation,
  handleDeactivateEmployee,
  handleActivateEmployee, // Add this prop for activating employees
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
  const [selectedBatch, setSelectedBatch] = useState(null);
  // Add sort configuration state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  // Group candidates by batch
  const candidatesByBatch = filteredCandidates.reduce((acc, candidate) => {
    if (!acc[candidate.batchId]) {
      acc[candidate.batchId] = {
        submittedAt: candidate.submittedAt,
        candidates: [],
      };
    }
    acc[candidate.batchId].candidates.push(candidate);
    return acc;
  }, {});

  // Sort batches by timestamp (newest first)
  const sortedBatches = Object.entries(candidatesByBatch).sort(
    ([, a], [, b]) => new Date(b.submittedAt) - new Date(a.submittedAt)
  );

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

  const handleBatchSelect = (batchId) => {
    setSelectedBatch(selectedBatch === batchId ? null : batchId);
  };

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
      {activeTab === "candidates" ? (
        role === ROLES.MANAGER || role === ROLES.ADMIN ? (
          // Batch view for manager/admin
          <div>
            {sortedBatches.map(([batchId, batch]) => (
              <div
                key={batchId}
                className={cn(
                  "mb-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-[var(--divider)]",
                  selectedBatch === batchId &&
                    "ring-2 ring-[var(--primary)] ring-opacity-50",
                  batch.needsReview && "bg-amber-50/30 dark:bg-amber-900/10"
                )}
              >
                <div className="p-4 border-b flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      Batch #{batchId}
                      {batch.needsReview && (
                        <Badge variant="warning" className="text-xs">
                          Needs Review
                        </Badge>
                      )}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Submitted: {new Date(batch.submittedAt).toLocaleString()}
                    </p>
                    {batch.lastEditedAt && (
                      <p className="text-sm text-amber-500">
                        Last edited:{" "}
                        {new Date(batch.lastEditedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleBatchSelect(batchId)}
                    className={cn(
                      "transition-all duration-200",
                      selectedBatch === batchId
                        ? "bg-[var(--accent-background)] text-[var(--text-primary)]"
                        : "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                    )}
                  >
                    {selectedBatch === batchId ? "Close Batch" : "Review Batch"}
                  </Button>
                </div>

                {selectedBatch === batchId && (
                  <div className="p-6 bg-[var(--accent-background)]/50">
                    <BatchReviewTable
                      candidates={batch.candidates}
                      onApprove={() => handleApproveLocation(batchId)}
                      onDeny={() => handleDenyLocation(batchId)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Individual candidate view for recruiter
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.map((item) => (
                <TableRow key={item.id} className="border-[var(--divider)]">
                  <TableCell className="text-[var(--text-primary)]">
                    {item.id}
                  </TableCell>
                  <TableCell className="text-[var(--text-primary)]">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-[var(--text-primary)]">
                    {item.contact}
                  </TableCell>
                  <TableCell className="text-[var(--text-primary)]">
                    {item.email}
                  </TableCell>
                  <TableCell className="text-[var(--text-primary)]">
                    {item.department}
                  </TableCell>
                  <TableCell className="text-[var(--text-primary)]">
                    {item.location}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === "Location Approved"
                          ? "success"
                          : item.status === "Location Denied"
                          ? "destructive"
                          : "default"
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[var(--text-primary)]">
                    {item.submittedAt}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      ) : (
        // Employee table with enhanced filtering and pagination
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
      )}
    </div>
  );
}

// Add BatchReviewTable component
function BatchReviewTable({ candidates, onApprove, onDeny }) {
  const { toast } = useToast();
  const [selectedForApproval, setSelectedForApproval] = useState({});
  const [isConfirming, setIsConfirming] = useState(false);

  const selectedCount =
    Object.values(selectedForApproval).filter(Boolean).length;

  const handleRowClick = (candidateId) => {
    setSelectedForApproval((prev) => ({
      ...prev,
      [candidateId]: !prev[candidateId],
    }));
  };

  const handleSubmitBatch = () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    // Get IDs of selected and unselected candidates
    const approvedIds = [];
    const deniedIds = [];

    candidates.forEach((candidate) => {
      if (selectedForApproval[candidate.id]) {
        approvedIds.push(candidate.id);
      } else {
        deniedIds.push(candidate.id);
      }
    });

    // Call the appropriate handlers
    if (approvedIds.length > 0) {
      onApprove(approvedIds);
    }
    if (deniedIds.length > 0) {
      onDeny(deniedIds);
    }

    setIsConfirming(false);
  };

  const handleClearSelection = () => {
    setSelectedForApproval({});
    setIsConfirming(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
        <div className="space-y-1">
          <h4 className="font-medium">Batch Review</h4>
          <p className="text-sm text-gray-500">
            Selected for approval: {selectedCount} of {candidates.length}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClearSelection}
            className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Clear Selection
          </Button>
          <Button
            onClick={handleSubmitBatch}
            className={cn(
              "text-white font-medium shadow-lg",
              isConfirming
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            )}
          >
            {isConfirming
              ? `Confirm (${selectedCount} approve, ${
                  candidates.length - selectedCount
                } deny)`
              : `Submit Decisions`}
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50 dark:bg-slate-800/50">
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Department</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => (
            <TableRow
              key={candidate.id}
              className={cn(
                "cursor-pointer transition-all",
                selectedForApproval[candidate.id]
                  ? "bg-green-50/50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"
                  : "hover:bg-red-50/50 dark:hover:bg-red-900/20"
              )}
              onClick={() => handleRowClick(candidate.id)}
            >
              <TableCell className="font-medium">{candidate.name}</TableCell>
              <TableCell>{candidate.contact}</TableCell>
              <TableCell>{candidate.location}</TableCell>
              <TableCell>{candidate.department}</TableCell>
              <TableCell className="text-center">
                <Badge
                  className={cn(
                    "transition-colors",
                    selectedForApproval[candidate.id]
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}
                >
                  {selectedForApproval[candidate.id]
                    ? "Will Approve"
                    : "Will Deny"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <p className="mt-4 text-sm text-gray-500 italic">
        Click on rows to toggle approval status. Unselected candidates will be
        automatically denied.
      </p>
    </div>
  );
}

BatchReviewTable.propTypes = {
  candidates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      contact: PropTypes.string.isRequired,
      department: PropTypes.string, // Made optional
      location: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
    })
  ).isRequired,
  onApprove: PropTypes.func.isRequired,
  onDeny: PropTypes.func.isRequired,
};

EmployeeTable.propTypes = {
  activeTab: PropTypes.string.isRequired,
  role: PropTypes.string.isRequired,
  filteredCandidates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      contact: PropTypes.string,
      email: PropTypes.string,
      department: PropTypes.string,
      location: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      submittedAt: PropTypes.string,
      batchId: PropTypes.string,
    })
  ).isRequired,
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
  handleApproveLocation: PropTypes.func.isRequired,
  handleDenyLocation: PropTypes.func.isRequired,
  handleDeactivateEmployee: PropTypes.func.isRequired,
  handleActivateEmployee: PropTypes.func.isRequired, // Add prop validation
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
