import { Badge } from "@/components/Common/UI/Badge";
import { Car } from "lucide-react";
import PropTypes from "prop-types";
import { cn } from "@utils/cn"; // Add this import

import styles from "../styles/RouteList.module.css";

export default function RouteList({ routes }) {
  if (!routes || routes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Car className={cn("w-16 h-16", "text-muted-foreground opacity-50")} />
        <p className="text-muted-foreground">No routes available</p>
      </div>
    );
  }

  return (
    <div className={styles.routeList}>
      {routes.map((route) => {
        // Get all unique employees from all stops
        const employees = route.stops?.flatMap((stop) => stop.employee) || [];
        const uniqueEmployees = [
          ...new Set(employees.map((emp) => emp.id)),
        ].map((id) => employees.find((emp) => emp.id === id));

        return (
          <div key={route.id} className={styles.routeCard}>
            <div className={styles.routeInfo}>
              <div className="flex justify-between items-start mb-2">
                <h4 className={styles.routeName}>{route.name}</h4>
                <Badge variant="outline" className={styles.shuttleBadge}>
                  {route.shuttle.name}
                </Badge>
              </div>
              <div className={styles.routeDetails}>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Car className="w-4 h-4" />
                  <span>{route.stops?.length || 0} stops</span>
                </div>
                <div className={cn(styles.areaList, "flex flex-wrap gap-1 mt-2")}>
                  {uniqueEmployees.map((employee) => (
                    <Badge
                      key={employee.id}
                      variant="secondary"
                      className={styles.areaBadge}
                    >
                      {employee.location}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

RouteList.propTypes = {
  routes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      shuttle: PropTypes.shape({
        name: PropTypes.string.isRequired,
      }).isRequired,
      stops: PropTypes.arrayOf(
        PropTypes.shape({
          employee: PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
              .isRequired,
            location: PropTypes.string.isRequired,
          }).isRequired,
        })
      ),
    })
  ),
};
