import PropTypes from "prop-types";
import { useTheme } from "@/contexts/ThemeContext";

import { Input } from "@/components/Common/UI/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Common/UI/Select";
import { Slider } from "@/components/Common/UI/Slider";
import { cn } from "@/lib/utils";

export function PayrollFilters({
  searchTerm,
  setSearchTerm,
  typeFilter,
  setTypeFilter,
  modelFilter,
  setModelFilter,
  costRangeFilter,
  setCostRangeFilter,
  uniqueModels,
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Input
        placeholder="Search shuttles..."
        className={cn(
          "max-w-sm",
          isDark ? "bg-gray-800 border-gray-700 text-white placeholder:text-gray-400" : ""
        )}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className={cn(
          "w-[180px]",
          isDark ? "border-gray-700 bg-gray-800 text-white" : ""
        )}>
          <SelectValue placeholder="Filter by Type" />
        </SelectTrigger>
        <SelectContent className={cn(
          isDark ? "bg-gray-800 border-gray-700" : ""
        )}>
          <SelectItem value="All" className={isDark ? "text-white focus:bg-gray-700" : ""}>All Types</SelectItem>
          <SelectItem value="Owned" className={isDark ? "text-white focus:bg-gray-700" : ""}>Owned</SelectItem>
          <SelectItem value="Outsourced" className={isDark ? "text-white focus:bg-gray-700" : ""}>Outsourced</SelectItem>
        </SelectContent>
      </Select>
      <Select value={modelFilter} onValueChange={setModelFilter}>
        <SelectTrigger className={cn(
          "w-[180px]",
          isDark ? "border-gray-700 bg-gray-800 text-white" : ""
        )}>
          <SelectValue placeholder="Filter by Model" />
        </SelectTrigger>
        <SelectContent className={cn(
          isDark ? "bg-gray-800 border-gray-700" : ""
        )}>
          <SelectItem value="All" className={isDark ? "text-white focus:bg-gray-700" : ""}>All Models</SelectItem>
          {uniqueModels.map((model) => (
            <SelectItem 
              key={model} 
              value={model}
              className={isDark ? "text-white focus:bg-gray-700" : ""}
            >
              {model}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <CostRangeSlider
        value={costRangeFilter}
        onValueChange={setCostRangeFilter}
        isDark={isDark}
      />
    </div>
  );
}

function CostRangeSlider({ value, onValueChange, isDark }) {
  return (
    <div className="flex items-center gap-4 min-w-[300px]">
      <div className="grid gap-2 flex-1">
        <div className="flex items-center justify-between">
          <label 
            htmlFor="cost-range" 
            className={cn(
              "text-sm font-medium leading-none",
              isDark ? "text-gray-300" : ""
            )}
          >
            Cost Range (ETB/day)
          </label>
          <span className={cn(
            "text-sm",
            isDark ? "text-gray-400" : "text-muted-foreground"
          )}>
            ETB {value[0]} - ETB {value[1]}
          </span>
        </div>
        <Slider
          id="cost-range"
          min={2000}
          max={4000}
          step={100}
          value={value}
          onValueChange={onValueChange}
          className={cn(
            "[&_[role=slider]]:h-4 [&_[role=slider]]:w-4",
            isDark ? "[&_[role=slider]]:bg-gray-700 [&_[role=slider]]:border-gray-600" : ""
          )}
        />
      </div>
    </div>
  );
}

PayrollFilters.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  typeFilter: PropTypes.string.isRequired,
  setTypeFilter: PropTypes.func.isRequired,
  modelFilter: PropTypes.string.isRequired,
  setModelFilter: PropTypes.func.isRequired,
  costRangeFilter: PropTypes.arrayOf(PropTypes.number).isRequired,
  setCostRangeFilter: PropTypes.func.isRequired,
  uniqueModels: PropTypes.arrayOf(PropTypes.string).isRequired,
};

CostRangeSlider.propTypes = {
  value: PropTypes.arrayOf(PropTypes.number).isRequired,
  onValueChange: PropTypes.func.isRequired,
  isDark: PropTypes.bool.isRequired,
};
