import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Common/UI/Select";
import { Clock, Users, Route, Bus } from "lucide-react";
import PropTypes from "prop-types";
import { useTheme } from "@/contexts/ThemeContext";

import styles from "../styles/ShiftSelection.module.css";

export default function ShiftSelection({
  selectedShift,
  onShiftChange,
  shifts = [],
  stats,
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (!shifts.length) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <h2 className={styles.selectTitle}>
            <Clock className="w-5 h-5" />
            Loading Shifts...
          </h2>
        </div>
      </div>
    );
  }

  const handleShiftChange = (value) => {
    // Find the full shift object and pass it
    if (value && value.trim() !== '') {
      const shiftObject = shifts.find((s) => String(s.id) === String(value));
      if (shiftObject) {
        onShiftChange(shiftObject);
      }
    }
  };

  const selectedShiftData = shifts.find((s) => 
    s.id === selectedShift || String(s.id) === String(selectedShift)
  );

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.selectTitle}>
          <Clock className="w-5 h-5" />
          Select Shift
        </h2>
        <div className={styles.selectWrapper}>
          <Select
            onValueChange={handleShiftChange}
            value={selectedShift ? String(selectedShift) : undefined}
          >
            <SelectTrigger className={styles.trigger}>
              <Clock className="w-4 h-4 mr-2 text-primary" />
              <SelectValue placeholder="Select a shift">
                {selectedShiftData
                  ? selectedShiftData.name
                  : "Select a shift"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <div className="px-3 py-2 text-xs font-semibold text-primary">
                  Available Shifts ({shifts.length})
                </div>
                {shifts.map((shift) => (
                  <SelectItem
                    key={shift.id}
                    value={String(shift.id)}
                    className="font-medium"
                  >
                    <div className="flex flex-col">
                      <span>{shift.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {shift.startTime} - {shift.endTime}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {selectedShiftData && (
            <div className={`flex items-center mt-2.5 px-3 py-2 rounded-md text-sm font-medium shadow-sm ${
              isDark 
                ? "bg-primary/20 border border-primary/30" 
                : "bg-blue-100 border border-blue-200"
            }`}>
              <Clock className="w-5 h-5 mr-2 text-primary" />
              <span>Ends at: <span className="font-semibold text-primary">{selectedShiftData.endTime}</span></span>
            </div>
          )}

          <div className={styles.shiftStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>
                <Clock className="w-4 h-4 inline mr-1" />
                Shifts
              </span>
              <span className={styles.statValue}>{stats.shifts}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>
                <Users className="w-4 h-4 inline mr-1" />
                Employees
              </span>
              <span className={styles.statValue}>{stats.employees}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>
                <Route className="w-4 h-4 inline mr-1" />
                Routes
              </span>
              <span className={styles.statValue}>{stats.routes}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>
                <Bus className="w-4 h-4 inline mr-1" />
                Shuttles
              </span>
              <span className={styles.statValue}>{stats.shuttlesCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ShiftSelection.propTypes = {
  selectedShift: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onShiftChange: PropTypes.func.isRequired,
  shifts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string.isRequired,
      startTime: PropTypes.string.isRequired,
      endTime: PropTypes.string.isRequired,
    })
  ),
  stats: PropTypes.shape({
    shifts: PropTypes.number.isRequired,
    employees: PropTypes.number.isRequired,
    routes: PropTypes.number.isRequired,
    shuttlesCount: PropTypes.number.isRequired,
  }).isRequired,
};
