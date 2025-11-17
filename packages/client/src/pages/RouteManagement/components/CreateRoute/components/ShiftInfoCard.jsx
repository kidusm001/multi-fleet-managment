import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@components/Common/UI/alert";
import styles from "../styles/CreateRouteForm.module.css";

export default function ShiftInfoCard({
  selectedShift,
  shiftEndTime,
  employees,
  availableShuttles: _availableShuttles,
  totalCapacity,
  totalEmployees,
}) {
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

  const isOverCapacity = totalEmployees > totalCapacity;

  return (
    <div className={styles.shiftInfoContainer}>
      <div className={styles.shiftInfo}>
        <span className={styles.shiftLabel}>Shift</span>
        <span className={styles.shiftTime}>
          {selectedShift?.name} • {shiftEndTime}
        </span>
      </div>

      {isOverCapacity && (
        <Alert variant="warning" className={styles.capacityWarning}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Total employees ({totalEmployees}) exceed shuttle capacity (
            {totalCapacity})
          </AlertDescription>
        </Alert>
      )}

      <div className={styles.departmentStats}>
        <span className={styles.deptLabel}>Largest Department:</span>
        <span className={styles.deptInfo}>
          {departmentCounts.name} ({departmentCounts.count} employees)
        </span>
      </div>
    </div>
  );
}

ShiftInfoCard.propTypes = {
  selectedShift: PropTypes.shape({
    name: PropTypes.string,
  }),
  shiftEndTime: PropTypes.string,
  employees: PropTypes.array.isRequired,
  availableShuttles: PropTypes.array.isRequired,
  totalCapacity: PropTypes.number.isRequired,
  totalEmployees: PropTypes.number.isRequired,
};
