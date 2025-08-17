import { motion } from "framer-motion";
import { Badge } from "@/components/Common/UI/Badge";
import { Card } from "@components/Common/UI/Card";
import { Button } from "@components/Common/UI/Button";
import { cn } from "@lib/utils";
import { format } from "date-fns";
import {
  MapPin,
  Clock,
  Users,
  Bus,
  Clock4,
  Briefcase,
  Check,
  Trash2,
} from "lucide-react";
import PropTypes from "prop-types";

const RouteCard = ({
  route,
  viewMode,
  onRouteClick,
  onMapPreview, // Add this back
  onDeleteRoute, // Add this prop
  isSelected,
  onSelect,
  isSelectionMode,
}) => {
  const getPassengerCount = (stops) => {
    if (!stops) return 0;
    return stops.reduce((count, stop) => count + (stop.employee ? 1 : 0), 0);
  };

  const handleClick = (e) => {
    if (isSelectionMode) {
      onSelect && onSelect(route.id);
    } else if (e.ctrlKey || e.metaKey) {
      onSelect && onSelect(route.id);
    } else {
      onRouteClick(route); // Pass the entire route object
    }
  };

  return (
    <Card
      className={cn(
        "w-full h-full cursor-pointer transition-all duration-300",
        "rounded-2xl border shadow-sm",
        "bg-gradient-to-br from-white to-zinc-50/80 dark:from-zinc-900 dark:to-zinc-800/80",
        "hover:-translate-y-0.5 hover:shadow-md",
        "group-hover:shadow-[0_0_2rem_-0.5rem] group-hover:shadow-sky-500/30",
        "dark:group-hover:shadow-sky-400/20",
        isSelected && [
          "ring-2 ring-primary/50",
          "bg-gradient-to-br from-sky-50 to-indigo-50/50",
          "dark:from-sky-900/50 dark:to-indigo-900/50",
        ],
        "relative overflow-hidden"
      )}
      onClick={handleClick}
    >
      {/* Add selection overlay */}
      {isSelectionMode && (
        <div
          className={cn(
            "absolute inset-0 transition-colors duration-200",
            isSelected
              ? "bg-sky-50 dark:bg-sky-900/20"
              : "bg-transparent hover:bg-sky-50/50 dark:hover:bg-sky-900/10"
          )}
        />
      )}

      <motion.div
        layout
        className={cn(
          "p-6 w-full h-full relative z-10",
          viewMode === "list" ? "flex-1" : "",
          "flex flex-col"
        )}
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {isSelectionMode && (
                <div
                  className={cn(
                    "w-5 h-5 rounded-md flex items-center justify-center cursor-pointer",
                    "transition-all duration-200",
                    isSelected
                      ? "bg-sky-500 text-white"
                      : "bg-white dark:bg-zinc-800 hover:bg-sky-50 dark:hover:bg-sky-900/50"
                  )}
                >
                  <Check 
                    className={cn(
                      "h-3.5 w-3.5",
                      isSelected 
                        ? "opacity-100"
                        : "opacity-0",
                      "stroke-[3px]" // Make the check icon thicker
                    )}
                  />
                </div>
              )}
              <motion.h3
                layoutId={`title-${route.id}`}
                className="text-lg font-semibold text-foreground group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors"
              >
                Route #{route.id} - {route.name}
              </motion.h3>
            </div>
            <motion.div
              layoutId={`shuttle-${route.id}`}
              className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300"
            >
              <Bus className="h-4 w-4 text-sky-500 dark:text-sky-400" />
              <span>{route.shuttle?.name || "Not assigned"}</span>
            </motion.div>
            <motion.div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <Briefcase className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              <span>{route.shift?.name || "No Shift"}</span>
            </motion.div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              <Badge
                variant={route.status === "active" ? "success" : "secondary"}
                className={cn(
                  "capitalize transition-all duration-500",
                  "rounded-lg px-2.5 py-0.5 text-xs font-medium",
                  "shadow-sm hover:shadow-md scale-100 hover:scale-105",
                  route.status === "active"
                    ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-500 dark:text-emerald-400"
                    : "bg-gradient-to-r from-zinc-500/20 to-slate-500/20 text-zinc-500 dark:text-zinc-400"
                )}
              >
                {route.status}
              </Badge>
              {!isSelectionMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDeleteRoute) onDeleteRoute(route.id);
                  }}
                  className={cn(
                    "h-8 w-8 rounded-xl",
                    "transition-colors duration-300",
                    "text-red-500 hover:bg-red-500/10 hover:text-red-600",
                    "dark:text-red-400 dark:hover:text-red-300"
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            {!isSelectionMode && (
              <Button
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onMapPreview(route); // This should now work
                }}
                className={cn(
                  "transition-colors duration-300",
                  "flex items-center justify-center gap-2",
                  viewMode === "list"
                    ? cn(
                        "rounded-xl py-1 px-3 h-8 text-sm",
                        "bg-sky-500/10 hover:bg-sky-500/20",
                        "text-sky-600 dark:text-sky-400",
                        "border border-sky-500/20 dark:border-sky-400/20"
                      )
                    : cn(
                        "rounded-xl py-2 px-4 h-9 text-base w-full",
                        "bg-sky-500/10 hover:bg-sky-500/20",
                        "text-sky-600 dark:text-sky-400",
                        "border border-sky-500/20 dark:border-sky-400/20",
                        "shadow-sm hover:shadow-md",
                        "transition-all duration-300"
                      )
                )}
              >
                <MapPin
                  className={cn("h-4 w-4", viewMode === "grid" && "h-5 w-5")}
                />
                <span>Map</span>
              </Button>
            )}
          </div>
        </div>

        {/* Route Quick Info */}
        <div
          className={cn(
            "grid gap-4 mt-6",
            viewMode === "list" ? "grid-cols-4" : "grid-cols-2"
          )}
        >
          <QuickInfoCard
            icon={<MapPin className="h-4 w-4 text-sky-500 dark:text-sky-400" />}
            label={`${route.stops?.length || 0} Stops`}
            bgColor="sky"
          />
          <QuickInfoCard
            icon={
              <Users className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            }
            label={`${getPassengerCount(route.stops)} Passengers`}
            bgColor="indigo"
          />
          <QuickInfoCard
            icon={
              <Clock className="h-4 w-4 text-rose-500 dark:text-rose-400" />
            }
            label={`${route.totalTime} minutes`}
            bgColor="rose"
          />
          <QuickInfoCard
            icon={
              <Clock4 className="h-4 w-4 text-teal-500 dark:text-teal-400" />
            }
            label={format(new Date(route.shift?.endTime), "hh:mm a")}
            bgColor="teal"
          />
        </div>
      </motion.div>
    </Card>
  );
};

const QuickInfoCard = ({ icon, label, bgColor }) => (
  <div className={cn(
    "flex items-center gap-2.5 rounded-xl",
    "bg-white dark:bg-white/5",
    "border border-zinc-100 dark:border-white/5",
    "p-3 transition-all duration-200",
    "hover:bg-zinc-50 dark:hover:bg-white/10",
    "group-hover:border-zinc-200 dark:group-hover:border-white/10"
  )}>
    <div className={cn(
      "rounded-lg p-2",
      `bg-${bgColor}-500/10`,
      `text-${bgColor}-500 dark:text-${bgColor}-400`
    )}>
      {icon}
    </div>
    <span className="text-zinc-600 dark:text-zinc-300 font-medium">
      {label}
    </span>
  </div>
);

RouteCard.propTypes = {
  route: PropTypes.object.isRequired,
  viewMode: PropTypes.oneOf(["grid", "list"]).isRequired,
  onRouteClick: PropTypes.func.isRequired,
  onMapPreview: PropTypes.func.isRequired, // Add this back
  onDeleteRoute: PropTypes.func.isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func,
  isSelectionMode: PropTypes.bool,
};

QuickInfoCard.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  bgColor: PropTypes.string.isRequired,
};

export default RouteCard;
