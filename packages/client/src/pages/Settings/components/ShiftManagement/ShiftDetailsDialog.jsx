import { Clock, Users, Globe, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/Common/UI/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/Common/UI/dialog";

/**
 * Shift Details Dialog Component
 * Shows detailed information about a shift including time zone information
 */
export default function ShiftDetailsDialog({
  shift,
  isOpen,
  isDark,
  onClose
}) {
  if (!shift) return null;

  // Define theme-specific styling
  const sectionClass = isDark 
    ? "bg-gray-800/50 border border-gray-700" 
    : "bg-gray-50 border border-gray-100";
  const labelClass = isDark ? "text-gray-400" : "text-gray-500";
  const valueClass = isDark ? "text-gray-200" : "text-gray-900";
  const dialogBgClass = isDark ? "bg-gray-900 border-gray-700 text-gray-100" : "";

  // Format time to display in both local and shift time zone formats
  const formatTime = (timeString, timeZone) => {
    if (!timeString) return "Not set";
    
    try {
      // Create a date object from the time string
      const date = new Date(timeString);
      
      // Format using Intl for proper localization with time zone
      return new Intl.DateTimeFormat('default', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timeZone || undefined
      }).format(date);
    } catch (error) {
      console.error("Error formatting time:", error);
      return timeString.toString();
    }
  };

  // Format time zone name for display
  const formatTimeZone = (timeZone) => {
    if (!timeZone) return "Default (Local Time)";
    
    try {
      return timeZone.replace(/_/g, " ")
        .replace(/\//g, " / ")
        .replace(/([a-z])([A-Z])/g, '$1 $2');
    } catch (error) {
      return timeZone;
    }
  };

  // Get the user's current time zone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Check if shift uses a different time zone than the user's device
  const isDifferentTimeZone = shift.timeZone && shift.timeZone !== userTimeZone;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={dialogBgClass}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--text-primary)]">
            <Clock className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-blue-500"}`} />
            Shift Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Shift Header */}
          <div className={`flex items-center gap-4 p-4 rounded-lg ${sectionClass}`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${
              isDark ? "bg-blue-700 text-blue-200" : "bg-blue-100 text-blue-600"
            }`}>
              {shift.name?.charAt(0).toUpperCase() || "S"}
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${valueClass}`}>{shift.name}</h3>
              <p className={labelClass}>
                {formatTime(shift.startTime, shift.timeZone)} - {formatTime(shift.endTime, shift.timeZone)}
              </p>
            </div>
          </div>

          {/* Time Zone Info */}
          <div className="space-y-4">
            <h4 className={`text-sm font-medium uppercase tracking-wider ${labelClass}`}>
              Time Information
            </h4>
            <div className={`p-4 rounded-lg ${sectionClass} space-y-3`}>
              <div className="flex items-center gap-3">
                <Globe className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-500"}`} />
                <div>
                  <p className={`text-xs ${labelClass}`}>Time Zone</p>
                  <p className={`text-sm font-medium ${valueClass}`}>
                    {formatTimeZone(shift.timeZone)}
                  </p>
                </div>
              </div>
              
              {/* Show conversion if needed */}
              {isDifferentTimeZone && (
                <div className={`mt-3 p-3 rounded-lg ${
                  isDark ? "bg-gray-700/50" : "bg-gray-100"
                }`}>
                  <p className={`text-xs mb-2 font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Time Conversion
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className={`text-xs ${labelClass}`}>In {formatTimeZone(shift.timeZone)}</p>
                      <p className={`text-sm font-medium ${valueClass}`}>
                        {formatTime(shift.startTime, shift.timeZone)} - {formatTime(shift.endTime, shift.timeZone)}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${labelClass}`}>In your time zone ({formatTimeZone(userTimeZone)})</p>
                      <p className={`text-sm font-medium ${valueClass}`}>
                        {formatTime(shift.startTime, userTimeZone)} - {formatTime(shift.endTime, userTimeZone)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Employees Info (if applicable) */}
          {shift.employees && (
            <div className="space-y-4">
              <h4 className={`text-sm font-medium uppercase tracking-wider ${labelClass}`}>
                Assigned Employees
              </h4>
              <div className={`p-4 rounded-lg ${sectionClass}`}>
                <div className="flex items-center gap-3">
                  <Users className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-500"}`} />
                  <div className="flex flex-col gap-1">
                    <p className={`text-sm font-medium ${valueClass}`}>
                      {shift.employees.length} {shift.employees.length === 1 ? 'employee' : 'employees'} assigned
                    </p>
                    {shift.employees.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {shift.employees.slice(0, 5).map((employee) => (
                          <div 
                            key={employee.id} 
                            className={`text-xs px-2 py-1 rounded-full ${
                              isDark 
                                ? "bg-gray-700 text-gray-300" 
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {employee.name}
                          </div>
                        ))}
                        {shift.employees.length > 5 && (
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            isDark 
                              ? "bg-blue-900/30 text-blue-300" 
                              : "bg-blue-100 text-blue-600"
                          }`}>
                            +{shift.employees.length - 5} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button 
              onClick={onClose}
              className={isDark 
                ? "bg-blue-700 hover:bg-blue-600 text-white" 
                : "bg-blue-600 hover:bg-blue-500 text-white"
              }
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}