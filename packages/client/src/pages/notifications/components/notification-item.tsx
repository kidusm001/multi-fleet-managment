import { useTheme } from "@contexts/ThemeContext";
import { cn } from "../lib/utils";
import { formatNotificationDate } from "../lib/date";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Card } from "./ui/card";
import { NotificationItem as INotificationItem } from "../types/notifications";
import { ChevronUp, ChevronDown, Car, Route, Users, UserCog, Building, Clock, Settings, Shield, Bell } from "lucide-react";
import { useState } from "react";

export interface NotificationItemProps extends INotificationItem {
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

// Severity-based styling helpers with proper background colors
const getSeverityColor = (importance: string): string => {
  const level = importance.toLowerCase();
  // Light mode: use opaque, non-transparent background colors for each severity level
  // Dark mode classes are preserved exactly (do not modify dark mode per request)
  if (level.includes('critical') || level === 'urgent') return 'bg-red-100 border-l-8 border-red-600 shadow-lg dark:bg-red-950/30 dark:border-red-600';
  if (level.includes('high')) return 'bg-orange-100 border-l-8 border-orange-600 shadow-lg dark:bg-orange-950/30 dark:border-orange-600';
  if (level.includes('medium')) return 'bg-yellow-100 border-l-8 border-yellow-600 shadow-lg dark:bg-yellow-950/30 dark:border-yellow-600';
  if (level.includes('low')) return 'bg-blue-100 border-l-8 border-blue-600 shadow-lg dark:bg-blue-950/30 dark:border-blue-600';
  return 'bg-gray-100 border-l-8 border-gray-600 shadow-lg dark:bg-gray-950/30 dark:border-gray-600';
};

const getSeverityBadge = (importance: string) => {
  const level = importance.toLowerCase();
  if (level.includes('critical') || level === 'urgent') {
    return <span className="px-1 md:px-2 py-0.5 md:py-1 text-[9px] md:text-xs font-bold text-white bg-red-600 rounded">CRITICAL</span>;
  }
  if (level.includes('high')) {
    return <span className="px-1 md:px-2 py-0.5 md:py-1 text-[9px] md:text-xs font-bold text-white bg-orange-600 rounded">HIGH</span>;
  }
  if (level.includes('medium')) {
    return <span className="px-1 md:px-2 py-0.5 md:py-1 text-[9px] md:text-xs font-semibold text-white bg-yellow-600 rounded">MEDIUM</span>;
  }
  if (level.includes('low')) {
    return <span className="px-1 md:px-2 py-0.5 md:py-1 text-[9px] md:text-xs text-white bg-blue-600 rounded">LOW</span>;
  }
  return null;
};

const getTypeIcon = (type: string) => {
  if (!type) return <Bell className="h-4 w-4 md:h-6 md:w-6" />;
  const typeStr = type.toUpperCase();
  if (typeStr.startsWith('VEHICLE_')) return <Car className="h-4 w-4 md:h-6 md:w-6" />;
  if (typeStr.startsWith('ROUTE_')) return <Route className="h-4 w-4 md:h-6 md:w-6" />;
  if (typeStr.startsWith('EMPLOYEE_')) return <Users className="h-4 w-4 md:h-6 md:w-6" />;
  if (typeStr.startsWith('DRIVER_')) return <UserCog className="h-4 w-4 md:h-6 md:w-6" />;
  if (typeStr.startsWith('DEPARTMENT_')) return <Building className="h-4 w-4 md:h-6 md:w-6" />;
  if (typeStr.startsWith('SHIFT_')) return <Clock className="h-4 w-4 md:h-6 md:w-6" />;
  if (typeStr.startsWith('STOP_')) return <Building className="h-4 w-4 md:h-6 md:w-6" />;
  if (typeStr.startsWith('ORG_')) return <Building className="h-4 w-4 md:h-6 md:w-6" />;
  if (typeStr.startsWith('USER_')) return <Users className="h-4 w-4 md:h-6 md:w-6" />;
  if (typeStr.startsWith('PERMISSIONS_')) return <Shield className="h-4 w-4 md:h-6 md:w-6" />;
  if (typeStr.startsWith('ACCOUNT_')) return <Shield className="h-4 w-4 md:h-6 md:w-6" />;
  if (typeStr.startsWith('PAYROLL_')) return <UserCog className="h-4 w-4 md:h-6 md:w-6" />;
  if (typeStr.startsWith('PAYMENT_')) return <UserCog className="h-4 w-4 md:h-6 md:w-6" />;
  if (typeStr.startsWith('AVAILABILITY_')) return <Clock className="h-4 w-4 md:h-6 md:w-6" />;
  if (typeStr.startsWith('REQUEST_')) return <Users className="h-4 w-4 md:h-6 md:w-6" />;
  if (typeStr.startsWith('SYSTEM_')) return <Settings className="h-4 w-4 md:h-6 md:w-6" />;
  if (typeStr.startsWith('SECURITY_')) return <Shield className="h-4 w-4 md:h-6 md:w-6" />;
  if (typeStr.startsWith('INFO')) return <Bell className="h-4 w-4 md:h-6 md:w-6" />;
  if (typeStr.startsWith('WARNING')) return <Bell className="h-4 w-4 md:h-6 md:w-6" />;
  if (typeStr.startsWith('ALERT')) return <Bell className="h-4 w-4 md:h-6 md:w-6" />;
  return <Bell className="h-4 w-4 md:h-6 md:w-6" />;
};

export function NotificationItem({
  id,
  type,
  title,
  description,
  timestamp,
  importance = {
    level: 1,
    label: "Info",
    description: "General update",
    color: "text-gray-600 dark:text-gray-400",
    gradient: "linear-gradient(135deg, rgba(107, 114, 128, 0.06), rgba(107, 114, 128, 0.02))"
  },
  isRead = false,
  isSelected = false,
  onSelect,
  source = "system",
}: NotificationItemProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Add this function to check content length
  const hasExpandableContent = description?.length > 120;

  return (
    <Card
      data-read={isRead}
      className={cn(
        "group relative overflow-hidden notification-glow",
        `importance-${importance.level}`,
        "p-2 md:p-4 transition-all duration-500 ease-out rounded-lg md:rounded-2xl",
        getSeverityColor(importance.label), // Apply severity-based background and border
        "h-auto md:h-[88px]", // Auto height for mobile, fixed for desktop
        isExpanded && hasExpandableContent && "md:h-auto" // Expand height when needed on desktop
      )}
      onClick={() => hasExpandableContent && setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start gap-2 md:gap-4">
        <div 
          className="mt-0.5 md:mt-1 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(id);
          }}
          role="checkbox"
          aria-checked="false"
          aria-label={`Select notification: ${title}`}
          data-state={isSelected ? "checked" : "unchecked"}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect?.(id);
            }
          }}
        >
          <Checkbox
            checked={isSelected}
            className={cn(
              "checkbox-select",
              isDark ? "border-gray-700/50" : "border-gray-300/80",
              "hover:border-primary/50",
              isSelected ? "bg-primary border-transparent" : "bg-transparent",
              "rounded-full",
              "w-[18px] h-[18px] md:w-[24px] md:h-[24px]" // Smaller on mobile
            )}
          />
        </div>
        <div className="flex-1 min-w-0"> {/* Add min-w-0 to prevent flex item from overflowing */}
          <div className="flex items-center justify-between gap-1 md:gap-2">
            <div className="flex items-center gap-1 md:gap-2 min-w-0 flex-1"> {/* Add min-w-0 and flex-1 */}
              <div className="shrink-0">
                {getTypeIcon(type)}
              </div>
              <h4
                className={cn(
                  "font-semibold transition-colors duration-200 truncate text-xs md:text-base", // Smaller text on mobile
                  isRead 
                    ? isDark ? "text-gray-500" : "text-gray-400" // More contrast for read items
                    : isDark ? "text-gray-100" : "text-gray-900",
                  "group-hover:text-primary"
                )}
              >
                {title}
              </h4>
              <div className="shrink-0">
                {getSeverityBadge(importance.label)}
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2 shrink-0"> {/* Smaller gap on mobile */}
              <Badge
                variant="secondary"
                className={cn(
                  "text-[9px] md:text-xs capitalize transition-all duration-200 px-1.5 md:px-3 py-0.5 md:py-1", // Much smaller on mobile
                  isDark ? "bg-gray-800" : "bg-gray-100", // Solid background
                  isDark ? "text-gray-100" : "text-gray-800", // Better contrast
                  isDark ? "border-gray-700" : "border-gray-200",
                  "group-hover:bg-primary/10 group-hover:border-primary/20",
                  "font-medium", // Make text bolder
                  "shadow-sm hidden md:inline-flex" // Hide on mobile to save space
                )}
              >
                {source}
              </Badge>
              <span className={cn(
                "text-[9px] md:text-sm transition-colors duration-200", // Much smaller on mobile
                isDark ? "text-gray-400" : "text-gray-500",
                "group-hover:text-primary/70"
              )}>
                {formatNotificationDate(timestamp)}
              </span>
            </div>
          </div>
          {description && (
            <div
              className={cn(
                "mt-2 transition-all duration-300",
                !isExpanded && "line-clamp-2", // Limit to 2 lines when collapsed
                "text-sm transition-colors duration-200",
                isRead 
                  ? isDark ? "text-gray-600" : "text-gray-400" // More contrast for read items
                  : isDark ? "text-gray-300" : "text-gray-600",
                "group-hover:text-gray-900 dark:group-hover:text-gray-100"
              )}
            >
              {description}
            </div>
          )}
          {/* metadata removed */}
          {/* Only show expand button if there's more content */}
          {hasExpandableContent && (
            <button
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md",
                "text-xs font-medium",
                isDark 
                  ? "text-blue-400 hover:text-blue-300" 
                  : "text-blue-600 hover:text-blue-500",
                "transition-all duration-200",
                !isExpanded && "opacity-0 group-hover:opacity-100",
                "hover:bg-blue-500/5"
              )}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <>
                  Show less
                  <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  Show more
                  <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
