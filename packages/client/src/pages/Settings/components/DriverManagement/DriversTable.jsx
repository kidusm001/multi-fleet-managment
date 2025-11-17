import { cn } from "@/lib/utils";
import { UserRound, Plus, Car } from "lucide-react";
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
import DriverActionsMenu from "./DriverActionsMenu";

const STATUS_STYLES = {
  'active': {
    label: 'Active',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  'off-duty': {
    label: 'Off Duty',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  },
  'on-break': {
    label: 'On Break',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
};

/**
 * Drivers Table Component
 * Displays drivers in a sortable, filterable table
 */
export default function DriversTable({ 
  drivers, 
  loading, 
  error, 
  isDark,
  onViewDetails, 
  onAction 
}) {
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
              <UserRound className="w-5 h-5 text-[var(--primary)] animate-pulse" />
            </div>
          </div>
          <p className="text-[var(--text-secondary)] font-medium">Loading drivers...</p>
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
                  <UserRound className={`w-4 h-4 ${isDark ? "text-amber-400" : "text-amber-500"}`} />
                  <span>Driver</span>
                </div>
              </TableHead>
              <TableHead className={isDark ? 'text-gray-300' : 'text-gray-600 font-medium'}>Status</TableHead>
              <TableHead className={isDark ? 'text-gray-300' : 'text-gray-600 font-medium'}>License</TableHead>
              <TableHead className={isDark ? 'text-gray-300' : 'text-gray-600 font-medium'}>
                <div className="flex items-center gap-2">
                  <Car className={`w-4 h-4 ${isDark ? "text-amber-400" : "text-amber-500"}`} />
                  <span>Assigned Shuttle</span>
                </div>
              </TableHead>
              <TableHead className="text-right py-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers?.length > 0 ? (
              drivers.map((driver) => (
                <TableRow 
                  key={driver.id} 
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
                          ? "bg-amber-900/30 text-amber-400"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">
                          {driver.name}
                        </div>
                        <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          {driver.phoneNumber}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "capitalize",
                      STATUS_STYLES[driver.status]?.className
                    )}>
                      {STATUS_STYLES[driver.status]?.label || driver.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`font-mono text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                      {driver.licenseNumber}
                    </span>
                  </TableCell>
                  <TableCell>
                    {driver.shuttle ? (
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">
                          {driver.shuttle.name}
                        </div>
                        <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          {driver.shuttle.licensePlate}
                        </div>
                      </div>
                    ) : (
                      <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        No shuttle assigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-4 pr-4">
                    <div className="flex justify-end items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(driver)}
                        className={`text-xs px-4 py-1.5 transition-all duration-200 hover:-translate-y-0.5 min-w-[100px] border ${
                          isDark 
                            ? "text-amber-300 border-gray-700 bg-gray-800/50 hover:bg-gray-700/70 hover:text-amber-200 hover:border-amber-500/30" 
                            : "text-amber-600 border-gray-200/70 bg-gray-50/50 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300"
                        } shadow-sm hover:shadow`}
                      >
                        View Details
                      </Button>
                      <DriverActionsMenu 
                        driver={driver}
                        isDark={isDark}
                        onAction={(action) => onAction(action, driver)}
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
                        <UserRound className="w-8 h-8 text-[var(--text-muted)] opacity-60" />
                      </div>
                    </div>
                    <p className="text-lg font-medium">{error ? 'Failed to load drivers' : 'No drivers found'}</p>
                    <p className="text-sm max-w-md text-center">
                      {error 
                        ? 'Please try again or contact support if the issue persists' 
                        : 'Add your first driver to start managing your fleet'
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
                          Add Driver
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