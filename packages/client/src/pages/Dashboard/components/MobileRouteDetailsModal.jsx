import { Clock, MapPin, Phone, Mail, Power, X, Users, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";
import { useTheme } from "@contexts/ThemeContext";
import { useRole } from "@contexts/RoleContext";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { routeService } from "@services/routeService";
import { createPortal } from "react-dom";
import { sortStopsBySequence } from "../utils/sortStops";
import { formatDisplayAddress } from "@/utils/address";

const MobileRouteDetailsModal = ({
  selectedRoute,
  isOpen,
  onClose,
  onRouteUpdate,
}) => {
  const { theme } = useTheme();
  const { role } = useRole();
  const isDark = theme === "dark";
  const isEmployee = role === 'employee';
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const orderedStops = useMemo(() => sortStopsBySequence(selectedRoute?.stops), [selectedRoute]);

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

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[60]"
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0c1222] 
                       rounded-t-3xl shadow-2xl z-[70] max-h-[85vh] flex flex-col"
            style={{ backgroundColor: isDark ? '#0c1222' : '#ffffff' }}
          >
            {/* Handle Bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-4 pb-3 pt-2 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {selectedRoute.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        selectedRoute.status === "ACTIVE"
                          ? "bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-[#f3684e]/10 dark:bg-[#ff965b]/10 text-[#f3684e] dark:text-[#ff965b]"
                      }`}
                    >
                      {selectedRoute.status}
                    </div>
                    {selectedRoute.nextDeparture && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(selectedRoute.nextDeparture).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="ml-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-4 space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-3 border border-blue-200/50 dark:border-blue-800/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Total Stops</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {orderedStops.length}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-3 border border-purple-200/50 dark:border-purple-800/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Passengers</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {orderedStops.filter(stop => stop.employee)?.length || 0}
                    </p>
                  </div>
                </div>

                {/* Toggle Status Button - Hide for employees */}
                {!isEmployee && (
                  <button
                    onClick={handleToggleStatus}
                    disabled={isUpdatingStatus}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                      selectedRoute.status === "ACTIVE"
                        ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800"
                        : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800"
                    } disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
                  >
                    <Power className="w-4 h-4" />
                    {isUpdatingStatus ? "Updating..." : selectedRoute.status === "ACTIVE" ? "Deactivate Route" : "Activate Route"}
                  </button>
                )}

                {/* Route Stops */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#f3684e] dark:text-[#ff965b]" />
                    Route Stops ({orderedStops.length + 1})
                  </h4>
                  <div className="space-y-3 pb-8">
                    {/* HQ/Work Location - Starting Point */}
                    <div
                      className={`p-3 rounded-xl border-2 transition-colors ${
                        isDark 
                          ? "bg-emerald-900/20 border-emerald-700/50" 
                          : "bg-emerald-50 border-emerald-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* HQ Badge */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isDark 
                            ? "bg-emerald-900/40 text-emerald-400 border border-emerald-700/50" 
                            : "bg-emerald-100 text-emerald-600 border border-emerald-200"
                        }`}>
                          HQ
                        </div>

                        {/* HQ Details */}
                        <div className="flex-1 min-w-0">
                          <div className="mb-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {selectedRoute.location?.type === 'BRANCH' ? 'Branch Office' : 'Head Quarters'}
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span className="break-words flex-1">
                                {formatDisplayAddress(
                                  selectedRoute.location?.address ||
                                    'Addis Ababa, Ethiopia'
                                ) || 'Addis Ababa, Ethiopia'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Employee Stops */}
                    {orderedStops.map((stop, index) => (
                      <div
                        key={stop.id || index}
                        className={`p-3 rounded-xl border transition-colors ${
                          isDark 
                            ? "bg-gray-800/60 border-gray-700/50 hover:bg-gray-800/80" 
                            : "bg-gray-50 border-gray-200/50 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Stop Number Badge */}
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                            isDark 
                              ? "bg-blue-900/40 text-blue-400 border border-blue-700/50" 
                              : "bg-blue-100 text-blue-600 border border-blue-200"
                          }`}>
                            {index + 1}
                          </div>

                          {/* Stop Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {stop.employee ? (
                                  stop.employee.name
                                ) : (
                                  <span className="text-gray-500 dark:text-gray-400">
                                    Unassigned Stop
                                  </span>
                                )}
                              </p>
                              {stop.estimatedArrivalTime && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                                  {new Date(stop.estimatedArrivalTime).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                            </div>

                            {stop.employee && (
                              <div className="space-y-1.5">
                                <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                  <span className="break-words flex-1">
                                    {formatDisplayAddress(
                                      stop.address ||
                                        stop.location ||
                                        stop.employee.location ||
                                        'Address not available'
                                    ) || 'Address not available'}
                                  </span>
                                </div>
                                {stop.employee.phone && (
                                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                    <Phone className="w-3.5 h-3.5 shrink-0" />
                                    <a 
                                      href={`tel:${stop.employee.phone}`}
                                      className="hover:text-[#f3684e] dark:hover:text-[#ff965b] transition-colors"
                                    >
                                      {stop.employee.phone}
                                    </a>
                                  </div>
                                )}
                                {stop.employee.email && (
                                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                    <Mail className="w-3.5 h-3.5 shrink-0" />
                                    <a 
                                      href={`mailto:${stop.employee.email}`}
                                      className="hover:text-[#f3684e] dark:hover:text-[#ff965b] transition-colors truncate"
                                    >
                                      {stop.employee.email}
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Safe area for bottom notch on mobile devices */}
            <div className="h-safe-bottom" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Render modal at document body level using portal to avoid parent container constraints
  return createPortal(modalContent, document.body);
};

MobileRouteDetailsModal.propTypes = {
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
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onRouteUpdate: PropTypes.func,
};

export default MobileRouteDetailsModal;
