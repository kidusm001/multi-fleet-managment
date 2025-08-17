import { useTheme } from "@contexts/ThemeContext";
import { cn } from "../lib/utils";
import { formatNotificationDate } from "../lib/date";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Card } from "./ui/card";
import { NotificationItem as INotificationItem } from "../types/notifications";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Route, Bus, Users, Package, ChevronUp, ChevronDown, Bell } from "lucide-react";
import { useState } from "react";

export interface NotificationItemProps extends INotificationItem {
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

// Define the type icons mapping with a fallback icon
const typeIcons = {
  route: Route,
  shuttle: Bus,
  recruitment: Users,
  batch: Package
};

const TypeIcon = ({ type }: { type: string }) => {
  // Use a fallback icon if the type doesn't match any in our mapping
  const IconComponent = typeIcons[type as keyof typeof typeIcons] || Bell;
  return <IconComponent className="h-5 w-5" />;
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
  metadata,
  source = "system",
}: NotificationItemProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Add this function to check content length
  const hasExpandableContent = description?.length > 120 || (metadata?.candidates && metadata.candidates.length > 0);

  const config = {
    1: {
      gradient: isDark 
        ? "linear-gradient(135deg, rgba(71, 85, 105, 0.03), rgba(51, 65, 85, 0.05))"
        : "linear-gradient(135deg, rgba(241, 245, 249, 0.3), rgba(248, 250, 252, 0.4))",
    },
    2: {
      gradient: isDark
        ? "linear-gradient(135deg, rgba(59, 130, 246, 0.03), rgba(37, 99, 235, 0.05))"
        : "linear-gradient(135deg, rgba(219, 234, 254, 0.3), rgba(239, 246, 255, 0.4))",
    },
    3: {
      gradient: isDark
        ? "linear-gradient(135deg, rgba(234, 179, 8, 0.03), rgba(202, 138, 4, 0.05))"
        : "linear-gradient(135deg, rgba(254, 249, 195, 0.3), rgba(254, 240, 138, 0.4))",
    },
    4: {
      gradient: isDark
        ? "linear-gradient(135deg, rgba(249, 115, 22, 0.03), rgba(234, 88, 12, 0.05))"
        : "linear-gradient(135deg, rgba(255, 237, 213, 0.3), rgba(254, 215, 170, 0.4))",
    },
    5: {
      gradient: isDark
        ? "linear-gradient(135deg, rgba(239, 68, 68, 0.03), rgba(220, 38, 38, 0.05))"
        : "linear-gradient(135deg, rgba(254, 226, 226, 0.3), rgba(254, 202, 202, 0.4))",
    },
  };

  return (
    <Card
      data-read={isRead}
      className={cn(
        "group relative overflow-hidden notification-glow notification-glass",
        `importance-${importance.level}`,
        "p-4 transition-all duration-500 ease-out rounded-2xl",
        "backdrop-blur-[8px]",
        "h-[88px]", // Fixed height for collapsed state
        isExpanded && hasExpandableContent && "h-auto" // Expand height when needed
      )}
      style={{
        background: config[importance.level as keyof typeof config].gradient,
      }}
      onClick={() => hasExpandableContent && setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start gap-4">
        <div 
          className="mt-1 cursor-pointer"
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
              "w-[24px] h-[24px]" // Increased from 22px to 24px
            )}
          />
        </div>
        <div className="flex-1 min-w-0"> {/* Add min-w-0 to prevent flex item from overflowing */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0"> {/* Add min-w-0 here too */}
              <div className={cn(
                "p-1.5 rounded-md transition-colors duration-200",
                isDark ? "bg-gray-800/50" : "bg-gray-100/80",
                "group-hover:bg-primary/10",
                isRead && "opacity-70"
              )}>
                <TypeIcon type={type} />
              </div>
              <h4
                className={cn(
                  "font-semibold transition-colors duration-200 truncate", // Add truncate
                  isRead 
                    ? isDark ? "text-gray-500" : "text-gray-400" // More contrast for read items
                    : isDark ? "text-gray-100" : "text-gray-900",
                  "group-hover:text-primary"
                )}
              >
                {title}
              </h4>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge
                      variant="outline"
                      className={cn(
                        "px-2 py-0.5 transition-all duration-200",
                        isDark ? "bg-gray-900/50" : "bg-white/50",
                        "backdrop-blur-sm",
                        importance.color,
                        "group-hover:border-primary/50 group-hover:text-primary",
                        isRead && "opacity-70"
                      )}
                    >
                      {importance.label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{importance.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2 shrink-0"> {/* Add shrink-0 */}
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs capitalize transition-all duration-200 px-3 py-1", // Enhanced padding
                  isDark ? "bg-gray-800" : "bg-gray-100", // Solid background
                  isDark ? "text-gray-100" : "text-gray-800", // Better contrast
                  isDark ? "border-gray-700" : "border-gray-200",
                  "group-hover:bg-primary/10 group-hover:border-primary/20",
                  "font-medium", // Make text bolder
                  "shadow-sm" // Subtle shadow
                )}
              >
                {source}
              </Badge>
              <span className={cn(
                "text-sm transition-colors duration-200",
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
          {metadata?.candidates && isExpanded && (
            <div className="mt-3 space-y-2">
              <p className={cn(
                "text-sm font-medium",
                isDark ? "text-gray-200" : "text-gray-700",
                "group-hover:text-primary"
              )}>
                Candidates:
              </p>
              <ul className="grid gap-1.5">
                {metadata.candidates.map((candidate) => (
                  <li
                    key={candidate.id}
                    className={cn(
                      "text-sm transition-colors duration-200",
                      isDark ? "text-gray-400" : "text-gray-600",
                      "group-hover:text-gray-900 dark:group-hover:text-gray-100"
                    )}>
                    {candidate.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
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
