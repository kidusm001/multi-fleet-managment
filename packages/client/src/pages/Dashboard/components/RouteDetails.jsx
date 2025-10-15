import { Clock, MapPin, Phone, Mail, Power } from "lucide-react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { useTheme } from "@contexts/ThemeContext";
import { useRole } from "@contexts/RoleContext";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { routeService } from "@services/routeService";
import { resolveOriginCoordinates, sortStopsBySequence } from "../utils/sortStops";
import { formatDisplayAddress } from "@/utils/address";

const RouteDetails = ({
  selectedRoute,
  isDetailsExpanded,
  toggleRouteDetails,
  onRouteUpdate,
}) => {
  const { theme } = useTheme();
  const { role } = useRole();
  const isDark = theme === "dark";
  const isEmployee = role === 'employee';
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const hasValidCoordinates = (stop) => {
    const longitude = stop?.longitude ?? stop?.stop?.longitude;
    const latitude = stop?.latitude ?? stop?.stop?.latitude;

    const lon = typeof longitude === "string" ? Number.parseFloat(longitude) : longitude;
    const lat = typeof latitude === "string" ? Number.parseFloat(latitude) : latitude;

    return Number.isFinite(lon) && Number.isFinite(lat);
  };

  const { mappedStops, unmappedStops } = useMemo(() => {
    if (!selectedRoute?.stops) {
      return { mappedStops: [], unmappedStops: [] };
    }

    const originCoords = resolveOriginCoordinates(selectedRoute);
    const sorted = sortStopsBySequence(selectedRoute.stops, originCoords);

    const withCoords = [];
    const withoutCoords = [];

    sorted.forEach((stop) => {
      if (hasValidCoordinates(stop)) {
        withCoords.push(stop);
      } else {
        withoutCoords.push(stop);
      }
    });

    return { mappedStops: withCoords, unmappedStops: withoutCoords };
  }, [selectedRoute]);

  const handleToggleStatus = async () => {
    try {
      setIsUpdatingStatus(true);
      const newStatus = selectedRoute.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await routeService.updateRouteStatus(selectedRoute.id, newStatus);
      toast.success(`Route ${newStatus === "ACTIVE" ? "activated" : "deactivated"} successfully`);
      if (onRouteUpdate) {
        onRouteUpdate();
      }
    } catch (error) {
      console.error("Failed to update route status:", error);
      toast.error("Failed to update route status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  if (!selectedRoute) return null;

  return (
    <motion.div
      initial={false}
      animate={{
        height: isDetailsExpanded ? "500px" : "48px",
        opacity: 1,
      }}
      transition={{
        type: "spring",
        damping: 20,
        stiffness: 200,
      }}
      className="absolute right-6 bottom-6 w-96 bg-white/95 dark:bg-[#0c1222]/95 
                 shadow-xl rounded-xl overflow-hidden border border-[#4272FF]/10 
                 dark:border-[#4272FF]/5 z-50 pointer-events-auto backdrop-blur-sm"
    >
      {/* Header/Toggle */}
      <button
        onClick={toggleRouteDetails}
        className="w-full p-3 flex items-center justify-between bg-white/95 dark:bg-[#1a2327]/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors sticky top-0 z-10"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white">
            Route Details
          </span>
          <div
            className={`px-2 py-0.5 rounded-full text-sm ${
              selectedRoute.status === "ACTIVE"
                ? "bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-[#f3684e]/10 dark:bg-[#ff965b]/10 text-[#f3684e] dark:text-[#ff965b]"
            }`}
          >
            {selectedRoute.status}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isDetailsExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg
            className="w-5 h-5 text-gray-500 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </motion.div>
      </button>

      {/* Content */}
      <motion.div
        animate={{ opacity: isDetailsExpanded ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white/95 dark:bg-[#1a2327]/95 backdrop-blur-sm overflow-hidden"
      >
        <div className="p-4 space-y-3">
          {/* Route Info */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedRoute.name}
            </h3>
            {selectedRoute.nextDeparture && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(selectedRoute.nextDeparture).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          {/* Toggle Status Button - Hide for employees */}
          {!isEmployee && (
            <button
              onClick={handleToggleStatus}
              disabled={isUpdatingStatus}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                selectedRoute.status === "ACTIVE"
                  ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                  : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Power className="w-4 h-4" />
              {isUpdatingStatus ? "Updating..." : selectedRoute.status === "ACTIVE" ? "Deactivate Route" : "Activate Route"}
            </button>
          )}

          {/* Route Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">Stops</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {mappedStops.length}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Passengers
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {mappedStops.filter(stop => stop.employee)?.length || 0}
              </p>
            </div>
          </div>

          {/* Drop-off Points */}
          <div className="flex-1 overflow-hidden">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Route Stops
            </h4>
            <div 
              className="space-y-2.5 overflow-y-auto custom-scrollbar pr-2"
              style={{
                height: "300px",
                paddingBottom: "60px"
              }}
            >
              {/* HQ/Work Location - Starting Point */}
              <div
                className={`p-3 rounded-lg border-2 ${
                  isDark 
                    ? "bg-emerald-900/20 border-emerald-700/50" 
                    : "bg-emerald-50 border-emerald-200"
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        isDark 
                          ? "bg-emerald-900/40 text-emerald-400" 
                          : "bg-emerald-100 text-emerald-600"
                      }`}>
                        HQ
                      </span>
                      <span className="truncate max-w-[180px]">
                        {selectedRoute.location?.type === 'BRANCH' ? 'Branch Office' : 'Head Quarters'}
                      </span>
                    </p>
                  </div>
                  <div className="ml-7 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {formatDisplayAddress(
                          selectedRoute.location?.address ||
                            'Addis Ababa, Ethiopia'
                        ) || 'Addis Ababa, Ethiopia'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee Stops */}
              {mappedStops.map((stop, index) => (
                <div
                  key={stop.id || index}
                  className={`p-3 rounded-lg ${
                    isDark ? "bg-gray-800/80" : "bg-gray-50"
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                          isDark 
                            ? "bg-blue-900/30 text-blue-400" 
                            : "bg-blue-100 text-blue-600"
                        }`}>
                          {index + 1}
                        </span>
                        {stop.employee ? (
                          <span className="truncate max-w-[180px]">
                            {stop.employee.name}
                          </span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">
                            Unassigned Stop
                          </span>
                        )}
                      </p>
                      {stop.estimatedArrivalTime && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {new Date(stop.estimatedArrivalTime).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    {stop.employee && (
                      <div className="ml-7 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            {formatDisplayAddress(
                              stop.address ||
                                stop.location ||
                                stop.employee.location ||
                                'Address not available'
                            ) || 'Address not available'}
                          </span>
                        </div>
                        {stop.employee.phone && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{stop.employee.phone}</span>
                          </div>
                        )}
                        {stop.employee.email && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{stop.employee.email}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {unmappedStops.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Stops Needing Location Data
                  </h4>
                  {unmappedStops.map((stop, index) => (
                    <div
                      key={`unmapped-${stop.id || index}`}
                      className={`p-3 rounded-lg border ${
                        isDark ? "border-gray-700 bg-gray-800/60" : "border-gray-200 bg-white"
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {stop.employee ? stop.employee.name : "Unassigned Stop"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Location information missing – update employee stop details to include this stop on the map.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

RouteDetails.propTypes = {
  selectedRoute: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    nextDeparture: PropTypes.string,
    location: PropTypes.shape({
      address: PropTypes.string,
      type: PropTypes.string,
    }),
    stops: PropTypes.arrayOf(
      PropTypes.shape({
        employee: PropTypes.shape({
          name: PropTypes.string,
          location: PropTypes.string,
          phone: PropTypes.string,
          email: PropTypes.string,
        }),
        estimatedArrivalTime: PropTypes.string,
      })
    ).isRequired,
  }),
  isDetailsExpanded: PropTypes.bool.isRequired,
  toggleRouteDetails: PropTypes.func.isRequired,
  onRouteUpdate: PropTypes.func,
};

export default RouteDetails;
