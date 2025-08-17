import { Clock, MapPin, Phone, Mail } from "lucide-react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { useTheme } from "@contexts/ThemeContext";

const RouteDetails = ({
  selectedRoute,
  isDetailsExpanded,
  toggleRouteDetails,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
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
              selectedRoute.status === "active"
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

          {/* Route Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">Stops</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedRoute.stops?.length || 0}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Passengers
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedRoute.stops?.filter(stop => stop.employee)?.length || 0}
              </p>
            </div>
          </div>

          {/* Drop-off Points */}
          <div className="flex-1 overflow-hidden">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Drop-off Points
            </h4>
            <div 
              className="space-y-2.5 overflow-y-auto custom-scrollbar pr-2"
              style={{
                height: "300px",
                paddingBottom: "24px"
              }}
            >
              {selectedRoute.stops?.map((stop, index) => (
                <div
                  key={index}
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
                          <span className="truncate">{stop.employee.location}</span>
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
};

export default RouteDetails;
