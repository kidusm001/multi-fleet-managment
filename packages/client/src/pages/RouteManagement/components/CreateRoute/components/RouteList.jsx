import { Badge } from "@/components/Common/UI/Badge";
import { Car } from "lucide-react";
import PropTypes from "prop-types";
import { cn } from "@utils/cn"; // Add this import
import { formatDisplayAddress } from "@/utils/address";

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
        const stops = Array.isArray(route.stops) ? route.stops : [];
        const uniqueStopsMap = new Map();

        stops.forEach((stop) => {
          if (!stop) {
            return;
          }

          const stopId = stop.id ?? stop.stopId ?? `${stop.employee?.id ?? "unknown"}-${stop.address ?? stop.location ?? "unknown"}`;
          if (!uniqueStopsMap.has(stopId)) {
            uniqueStopsMap.set(stopId, stop);
          }
        });

        const uniqueStops = Array.from(uniqueStopsMap.values());

        return (
          <div key={route.id} className={styles.routeCard}>
            <div className={styles.routeInfo}>
              <div className="flex justify-between items-start mb-2">
                <h4 className={styles.routeName}>{route.name}</h4>
                <Badge variant="outline" className={styles.shuttleBadge}>
                  {route.shuttle?.name || route.vehicle?.name || 'No Shuttle'}
                </Badge>
              </div>
              <div className={styles.routeDetails}>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Car className="w-4 h-4" />
                  <span>{route.stops?.length || 0} stops</span>
                </div>
                <div className={cn(styles.areaList, "flex flex-wrap gap-1 mt-2")}>
                  {uniqueStops.map((stopEntry) => {
                    const stopLabel = formatDisplayAddress(
                      stopEntry.address ||
                        stopEntry.location ||
                        stopEntry.area ||
                        stopEntry.displayName ||
                        stopEntry.employee?.stop?.address ||
                        stopEntry.employee?.stop?.location ||
                        stopEntry.employee?.location ||
                        stopEntry.employee?.workLocation?.address ||
                        "N/A"
                    ) || "N/A";

                    return (
                    <Badge
                        key={stopEntry.id ?? stopEntry.stopId ?? stopLabel}
                      variant="secondary"
                      className={styles.areaBadge}
                    >
                        {stopLabel}
                    </Badge>
                    );
                  })}
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
      }), // Made optional since routes might not have shuttles assigned yet
      stops: PropTypes.arrayOf(
        PropTypes.shape({
          employee: PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
              .isRequired,
            location: PropTypes.string,
          }),
        })
      ),
    })
  ),
};
