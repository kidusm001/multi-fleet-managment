import PropTypes from "prop-types";
import { ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

export function StatsCard({ 
  title, 
  value, 
  change, 
  icon = null, 
  subtitle = null,
  iconBg = "bg-gray-100 dark:bg-gray-800/50"
}) {
  const isPositive = change && !change.startsWith("-");
  const Icon = isPositive ? ChevronUp : ChevronDown;

  return (
    <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700">
      <div className="flex items-center gap-3">
        {icon && (
          <div className={`p-2 rounded-lg ${iconBg}`}>
            {icon}
          </div>
        )}
        <div>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {title}
          </p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {change && (
        <div className="flex items-center text-xs mt-2 ml-12">
          <span
            className={cn(
              "flex items-center font-medium",
              isPositive ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
            )}
          >
            <Icon className="h-3 w-3 mr-1 inline" />
            {change.replace("-", "")}%
          </span>
          <span className="ml-1.5 text-gray-500 dark:text-slate-400">vs last month</span>
        </div>
      )}
    </div>
  );
}

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  change: PropTypes.string,
  icon: PropTypes.node,
  subtitle: PropTypes.string,
  iconBg: PropTypes.string,
};
