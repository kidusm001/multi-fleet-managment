import { useState } from "react";
import PropTypes from "prop-types";
import { ArrowUpDown, Check, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/Common/UI/Badge";

import styles from "../styles/SortableEmployeeTable.module.css";

export default function SortableEmployeeTable({
  data,
  onEmployeeSelect,
  selectedEmployees = [],
  optimalCluster = [],
  isDisabled,
  maxCapacity,
  isLoading,
}) {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) {
      // Default sort: optimal cluster first, then selected, then others
      const aOptimal = optimalCluster.some((emp) => emp.id === a.id);
      const bOptimal = optimalCluster.some((emp) => emp.id === b.id);
      const aSelected = selectedEmployees.some((emp) => emp.id === a.id);
      const bSelected = selectedEmployees.some((emp) => emp.id === b.id);

      if (aOptimal !== bOptimal) return aOptimal ? -1 : 1;
      if (aSelected !== bSelected) return aSelected ? -1 : 1;
      return 0;
    }

    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Special handling for department sorting
    if (sortConfig.key === "department") {
      aValue = a.department?.name || "";
      bValue = b.department?.name || "";
    }

    // Special handling for status sorting
    if (sortConfig.key === "status") {
      const getStatusPriority = (emp) => {
        if (emp.assigned) return 4;
        if (selectedEmployees.some((e) => e.id === emp.id)) return 1;
        if (optimalCluster.some((e) => e.id === emp.id)) return 2;
        return 3;
      };
      aValue = getStatusPriority(a);
      bValue = getStatusPriority(b);
    }

    if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
    return 0;
  });

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const isSelected = (employeeId) => {
    return selectedEmployees.some((emp) => emp.id === employeeId);
  };

  const isOptimal = (employeeId) => {
    return optimalCluster.some((emp) => emp.id === employeeId);
  };

  const handleRowClick = (employee) => {
    if (isDisabled || employee.assigned) {
      return;
    }
    if (onEmployeeSelect) {
      onEmployeeSelect(employee);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p>Calculating optimal routes...</p>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={styles.emptyState}>
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">No Available Employees</h3>
        <p className="text-sm text-muted-foreground">
          No employees are available for this shift
        </p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className="w-full">
        <thead>
          <tr>
            <th className={styles.tableHeader} style={{ width: "40px" }}>
              <span className="sr-only">Selection</span>
            </th>
            <th
              className={styles.tableHeader}
              onClick={() => requestSort("name")}
            >
              Name
              <span className={styles.sortIcon}>
                <ArrowUpDown size={14} />
              </span>
            </th>
            <th
              className={styles.tableHeader}
              onClick={() => requestSort("location")}
            >
              Location
              <span className={styles.sortIcon}>
                <ArrowUpDown size={14} />
              </span>
            </th>
            <th
              className={styles.tableHeader}
              onClick={() => requestSort("department")}
            >
              Department
              <span className={styles.sortIcon}>
                <ArrowUpDown size={14} />
              </span>
            </th>
            <th
              className={styles.tableHeader}
              onClick={() => requestSort("status")}
            >
              Status
              <span className={styles.sortIcon}>
                <ArrowUpDown size={14} />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((employee) => {
            const selected = isSelected(employee.id);
            const optimal = isOptimal(employee.id);
            const isAssigned = employee.assigned;
            const isSelectable =
              !isDisabled &&
              !isAssigned &&
              (!maxCapacity ||
                selected ||
                selectedEmployees.length < maxCapacity);

            return (
              <tr
                key={employee.id}
                className={`${styles.tableRow} ${
                  selected ? styles.selected : ""
                } 
                  ${optimal ? styles.optimal : ""} 
                  ${!isSelectable ? styles.disabled : ""}`}
                onClick={() => isSelectable && handleRowClick(employee)}
              >
                <td className="text-center">
                  {selected && (
                    <div className="flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </td>
                <td className="font-medium">{employee.name}</td>
                <td>
                  <Badge variant="outline" className="font-normal">
                    {employee.location}
                  </Badge>
                </td>
                <td>
                  <span className="text-muted-foreground">
                    {employee.department?.name}
                  </span>
                </td>
                <td>
                  <Badge
                    variant={getStatusVariant(selected, optimal, isAssigned)}
                    className={styles.statusBadge}
                  >
                    {getStatusText(selected, optimal, isAssigned)}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function getStatusVariant(selected, optimal, assigned) {
  if (assigned) return "secondary";
  if (selected) return "primary";
  if (optimal) return "success";
  return "outline";
}

function getStatusText(selected, optimal, assigned) {
  if (assigned) return "Assigned";
  if (selected) return "Selected";
  if (optimal) return "Recommended";
  return "Available";
}

SortableEmployeeTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      location: PropTypes.string.isRequired,
      assigned: PropTypes.bool,
      stop: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
        latitude: PropTypes.number.isRequired,
        longitude: PropTypes.number.isRequired,
      }),
    })
  ).isRequired,
  onEmployeeSelect: PropTypes.func.isRequired,
  selectedEmployees: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ),
  optimalCluster: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ),
  isDisabled: PropTypes.bool,
  maxCapacity: PropTypes.number,
  isLoading: PropTypes.bool,
};
