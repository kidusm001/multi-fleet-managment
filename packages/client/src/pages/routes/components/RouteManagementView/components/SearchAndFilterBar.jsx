import React from "react";
import { Search } from "lucide-react";
import PropTypes from "prop-types";
import { useTheme } from "@contexts/ThemeContext";
import { cn } from "@lib/utils";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@components/Common/UI/Select";

const SearchAndFilterBar = ({
  searchQuery,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterShuttle,
  onShuttleChange,
  filterDepartment,
  onDepartmentChange,
  filterShift,
  onShiftChange,
  shuttles,
  departments,
  shifts,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={cn(
      "w-full flex flex-col lg:flex-row gap-4",
      "rounded-xl p-4",
      "border",
      "transition-all duration-200",
      isDark ? [
        "bg-gray-900/30",
        "border-gray-800",
      ] : [
        "bg-white",
        "border-gray-200",
      ]
    )}>
      {/* Search Input */}
      <div className="flex-1 relative">
        <div className={cn(
          "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none",
          isDark ? "text-gray-500" : "text-gray-400"
        )}>
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search routes by name, ID, or shuttle..."
          className={cn(
            "block w-full rounded-lg",
            "pl-10 pr-4 py-2.5",
            "text-sm transition-all duration-200",
            "border",
            isDark ? [
              "bg-gray-800/70",
              "text-gray-200",
              "placeholder-gray-500",
              "border-gray-700",
              "focus:border-blue-500/70",
              "focus:ring-blue-500/20",
            ] : [
              "bg-gray-50/80",
              "text-gray-900",
              "placeholder-gray-500",
              "border-gray-200",
              "focus:border-blue-500",
              "focus:ring-blue-500/30",
            ],
            "focus:outline-none focus:ring-2",
          )}
        />
      </div>

      {/* Filters Section */}
      <div className="flex flex-wrap gap-3">
        {/* Status Filter */}
        <Select value={filterStatus} onValueChange={onStatusChange}>
          <SelectTrigger className={cn(
            "w-[160px] rounded-lg",
            "border transition-all",
            isDark
              ? "bg-gray-800/70 text-gray-200 border-gray-700 hover:border-gray-600"
              : "bg-gray-50/80 text-gray-900 border-gray-200 hover:border-gray-300"
          )}>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className={cn(
            "rounded-lg border",
            isDark ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200"
          )}>
            <SelectItem value="all" className={cn(
              "transition-colors",
              isDark ? "text-gray-200 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100"
            )}>
              All Status
            </SelectItem>
            <SelectItem value="active" className={cn(
              "transition-colors",
              isDark ? "text-green-400 hover:bg-gray-700" : "text-green-600 hover:bg-gray-100"
            )}>
              Active
            </SelectItem>
            <SelectItem value="inactive" className={cn(
              "transition-colors",
              isDark ? "text-amber-400 hover:bg-gray-700" : "text-amber-600 hover:bg-gray-100"
            )}>
              Inactive
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Shuttle Filter */}
        <Select value={filterShuttle} onValueChange={onShuttleChange}>
          <SelectTrigger className={cn(
            "w-[160px] rounded-lg",
            "border transition-all",
            isDark
              ? "bg-gray-800/70 text-gray-200 border-gray-700 hover:border-gray-600"
              : "bg-gray-50/80 text-gray-900 border-gray-200 hover:border-gray-300"
          )}>
            <SelectValue placeholder="Filter by shuttle" />
          </SelectTrigger>
          <SelectContent className={cn(
            "rounded-lg border",
            isDark ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200"
          )}>
            <SelectItem value="all" className={isDark ? "text-gray-200 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100"}>
              All Shuttles
            </SelectItem>
            {shuttles.map((shuttle) => (
              <SelectItem 
                key={shuttle.id} 
                value={shuttle.id.toString()}
                className={isDark ? "text-gray-200 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100"}
              >
                {shuttle.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Department Filter */}
        <Select value={filterDepartment} onValueChange={onDepartmentChange}>
          <SelectTrigger className={cn(
            "w-[160px] rounded-lg",
            "border transition-all",
            filterDepartment !== "all" ? (
              isDark
                ? "bg-blue-900/40 text-blue-200 border-blue-700/50 hover:border-blue-600"
                : "bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300"
            ) : (
              isDark
                ? "bg-gray-800/70 text-gray-200 border-gray-700 hover:border-gray-600"
                : "bg-gray-50/80 text-gray-900 border-gray-200 hover:border-gray-300"
            )
          )}>
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent className={cn(
            "rounded-lg border",
            isDark ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200"
          )}>
            <SelectItem value="all" className={isDark ? "text-gray-200 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100"}>
              All Departments
            </SelectItem>
            {departments.map((department) => (
              <SelectItem 
                key={department.id} 
                value={department.id.toString()}
                className={isDark ? "text-gray-200 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100"}
              >
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Shift Filter */}
        <Select value={filterShift} onValueChange={onShiftChange}>
          <SelectTrigger className={cn(
            "w-[160px] rounded-lg",
            "border transition-all",
            isDark
              ? "bg-gray-800/70 text-gray-200 border-gray-700 hover:border-gray-600"
              : "bg-gray-50/80 text-gray-900 border-gray-200 hover:border-gray-300"
          )}>
            <SelectValue placeholder="Filter by shift" />
          </SelectTrigger>
          <SelectContent className={cn(
            "rounded-lg border",
            isDark ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200"
          )}>
            <SelectItem value="all" className={isDark ? "text-gray-200 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100"}>
              All Shifts
            </SelectItem>
            {shifts.map((shift) => (
              <SelectItem 
                key={shift.id} 
                value={shift.id.toString()}
                className={isDark ? "text-gray-200 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100"}
              >
                {shift.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

SearchAndFilterBar.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  filterStatus: PropTypes.string.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  filterShuttle: PropTypes.string.isRequired,
  onShuttleChange: PropTypes.func.isRequired,
  filterDepartment: PropTypes.string.isRequired,
  onDepartmentChange: PropTypes.func.isRequired,
  filterShift: PropTypes.string.isRequired,
  onShiftChange: PropTypes.func.isRequired,
  shuttles: PropTypes.array.isRequired,
  departments: PropTypes.array.isRequired,
  shifts: PropTypes.array.isRequired,
};

export default SearchAndFilterBar;
