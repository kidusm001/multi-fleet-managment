import { cn } from "@/lib/utils";
import { Clock, Plus, Globe, Timer } from "lucide-react";
import Button from "@/components/Common/UI/Button";
import { Badge } from "@/components/Common/UI/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/UI/Table";
import ShiftActionsMenu from "./ShiftActionsMenu";

/**
 * Shifts Table Component
 * Displays shifts in a sortable, filterable table with time zone support
 */
export default function ShiftsTable({ 
  shifts, 
  loading, 
  error, 
  isDark,
  onViewDetails, 
  onAction 
}) {
  // Format time to display in local format
  const formatTime = (timeString, timeZone) => {
    if (!timeString) return "Not set";
    
    try {
      // If the time is just HH:MM, convert it to today's date for formatting
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
    if (!timeZone) return "Default";
    
    // Try to format the time zone into a user-friendly name
    try {
      return timeZone.replace(/_/g, " ")
        .replace(/\//g, " / ")
        .replace(/([a-z])([A-Z])/g, '$1 $2'); // Insert space before capital letters
    } catch (error) {
      return timeZone;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-12 rounded-xl border transition-all duration-300 ${
        isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50/80 border-gray-100'
      }`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-t-transparent border-[var(--primary)] animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[var(--primary)] animate-pulse" />
            </div>
          </div>
          <p className="text-[var(--text-secondary)] font-medium">Loading shifts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white border-gray-200/70'
    } shadow-sm hover:shadow-md`}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className={`${isDark 
              ? 'bg-gray-800/70 border-b border-gray-700' 
              : 'bg-gradient-to-r from-gray-50/90 to-slate-50/80 border-b border-gray-200/80'
            }`}>
              <TableHead className={`py-4 px-6 ${isDark ? 'text-gray-300' : 'text-gray-600 font-medium'}`}>
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-500"}`} />
                  <span>Shift Name</span>
                </div>
              </TableHead>
              <TableHead className={isDark ? 'text-gray-300' : 'text-gray-600 font-medium'}>
                <div className="flex items-center gap-2">
                  <Timer className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-500"}`} />
                  <span>Hours</span>
                </div>
              </TableHead>
              <TableHead className={isDark ? 'text-gray-300' : 'text-gray-600 font-medium'}>
                <div className="flex items-center gap-2">
                  <Globe className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-500"}`} />
                  <span>Time Zone</span>
                </div>
              </TableHead>
              <TableHead className={isDark ? 'text-gray-300' : 'text-gray-600 font-medium'}>Employees</TableHead>
              <TableHead className="text-right py-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts?.length > 0 ? (
              shifts.map((shift) => (
                <TableRow 
                  key={shift.id} 
                  className={cn(
                    "transition-all duration-200",
                    isDark && "hover:bg-gray-800/50 border-b border-gray-700/50",
                    !isDark && "hover:bg-gray-50/80 border-b border-gray-200/50",
                    "hover:-translate-y-[1px]"
                  )}
                >
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md ${
                        isDark 
                          ? "bg-blue-900/30 text-blue-400"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">
                          {shift.name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      <span className="font-medium">{formatTime(shift.startTime, shift.timeZone)}</span>
                      <span className="mx-1">to</span>
                      <span className="font-medium">{formatTime(shift.endTime, shift.timeZone)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "capitalize",
                      isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"
                    )}>
                      {formatTimeZone(shift.timeZone)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      isDark 
                        ? "bg-blue-900/30 text-blue-400" 
                        : "bg-blue-100 text-blue-700"
                    )}>
                      {shift.employees?.length || 0} employees
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-4 pr-4">
                    <div className="flex justify-end items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(shift)}
                        className={`text-xs px-4 py-1.5 transition-all duration-200 hover:-translate-y-0.5 min-w-[100px] border ${
                          isDark 
                            ? "text-blue-300 border-gray-700 bg-gray-800/50 hover:bg-gray-700/70 hover:text-blue-200 hover:border-blue-500/30" 
                            : "text-blue-600 border-gray-200/70 bg-gray-50/50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                        } shadow-sm hover:shadow`}
                      >
                        View Details
                      </Button>
                      <ShiftActionsMenu 
                        shift={shift}
                        isDark={isDark}
                        onAction={(action) => onAction(action, shift)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16 text-[var(--text-secondary)]">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700/30 rounded-full animate-ping opacity-25"></div>
                      <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800/60">
                        <Clock className="w-8 h-8 text-[var(--text-muted)] opacity-60" />
                      </div>
                    </div>
                    <p className="text-lg font-medium">{error ? 'Failed to load shifts' : 'No shifts found'}</p>
                    <p className="text-sm max-w-md text-center">
                      {error 
                        ? 'Please try again or contact support if the issue persists' 
                        : 'Add your first shift to start managing employee schedules'
                      }
                    </p>
                    {!error && (
                      <div className="mt-4">
                        <Button 
                          className="gap-2 px-4 py-1.5 text-xs shadow-sm hover:shadow-md bg-[var(--primary)] hover:bg-[var(--button-hover)] text-white hover:-translate-y-0.5 transition-all duration-200"
                          size="sm"
                          onClick={() => onAction('add')}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Shift
                        </Button>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}