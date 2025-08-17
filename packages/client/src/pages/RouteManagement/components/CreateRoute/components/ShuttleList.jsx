import React from "react";
import PropTypes from "prop-types";
import { Badge } from "@/components/Common/UI/Badge";
import styles from "../styles/CreateRouteForm.module.css";

export default function ShuttleList({
  isLoadingShuttles,
  availableShuttles,
  selectedShift,
  selectedShuttle,
  routeData,
  onShuttleSelect,
}) {
  if (isLoadingShuttles) {
    return <div className={styles.loading}>Loading shuttles...</div>;
  }

  if (availableShuttles.length === 0) {
    return (
      <div className={styles.noShuttles}>
        {selectedShift?.id
          ? "No active shuttles available for this shift"
          : "Please select a shift first"}
      </div>
    );
  }

  return (
    <div className={styles.shuttleList}>
      {availableShuttles.map((shuttle) => {
        const selectedCount = routeData.selectedEmployees.length;
        const isSelected = selectedShuttle?.id === shuttle.id;

        return (
          <button
            type="button"
            key={shuttle.id}
            className={`${styles.shuttleCard} ${
              isSelected ? styles.selected : ""
            }`}
            onClick={() => onShuttleSelect(shuttle)}
          >
            <div className={styles.shuttleInfo}>
              <div className={styles.shuttleDetails}>
                <span className={styles.shuttleName}>{shuttle.name}</span>
                <span className={styles.shuttleType}>
                  {shuttle.category?.name || "Unknown Type"}
                </span>
              </div>
              <Badge variant="outline" className={styles.capacityBadge}>
                {isSelected
                  ? `${selectedCount}/${shuttle.category?.capacity || 0}`
                  : `0/${shuttle.category?.capacity || 0}`}{" "}
                Seats
              </Badge>
            </div>
            {shuttle.dailyRate > 0 && (
              <div className={styles.shuttleRate}>
                <span className={styles.rateLabel}>Daily Rate:</span>
                <span className={styles.rateValue}>
                  {shuttle.dailyRate} ETB
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

ShuttleList.propTypes = {
  isLoadingShuttles: PropTypes.bool.isRequired,
  availableShuttles: PropTypes.array.isRequired,
  selectedShift: PropTypes.object,
  selectedShuttle: PropTypes.object,
  routeData: PropTypes.shape({
    selectedEmployees: PropTypes.array.isRequired,
  }).isRequired,
  onShuttleSelect: PropTypes.func.isRequired,
};
