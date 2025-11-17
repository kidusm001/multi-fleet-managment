import React from "react";
import { Avatar } from "@/components/Common/UI/avatar";
import { format, formatDistanceToNow } from "date-fns";
import { useTheme } from "@/contexts/ThemeContext";
import { Skeleton } from "@/components/Common/UI/skeleton";

/**
 * RecentActivity Component
 * 
 * Displays a list of recent system activities with user info, action details,
 * and relative timestamps. Supports different states (loading, empty, populated).
 *
 * @param {Object} props - Component props
 * @param {Array} props.activities - List of activity objects
 * @param {Boolean} props.loading - Indicates if activities are loading
 */
export function RecentActivity({ activities = [], loading = false }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Format timestamp to relative time or absolute date based on age
  const formatTimestamp = (date) => {
    if (!date) return "Unknown time";
    
    try {
      const parsedDate = new Date(date);
      const now = new Date();
      const diffInHours = (now - parsedDate) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return formatDistanceToNow(parsedDate, { addSuffix: true });
      }
      return format(parsedDate, "MMM d, h:mm a");
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Invalid date";
    }
  };

  // Generate initials from user name
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase();
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="ml-4 space-y-1 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className={`p-3 rounded-full mb-4 ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-6 w-6 ${isDark ? "text-gray-400" : "text-gray-500"}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-[var(--text-primary)]">No recent activity</p>
        <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xs">
          Activities will appear here as users make changes to the system
        </p>
      </div>
    );
  }

  // Populated state with activity data
  return (
    <div className="space-y-6">
      {activities.map((item) => (
        <div key={item.id} className="flex items-center">
          <Avatar>
            <div 
              className={`
                h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-medium
                ${item.user?.role?.toLowerCase().includes('admin') 
                  ? 'bg-gradient-to-br from-sky-500 to-indigo-600' 
                  : 'bg-gradient-to-br from-amber-500 to-pink-600'}
              `}
            >
              {getInitials(item.user?.name)}
            </div>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {item.user?.name}
              {item.user?.role && (
                <span className="ml-2 text-xs text-[var(--text-secondary)]">
                  ({item.user.role})
                </span>
              )}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">{item.action}</p>
          </div>
          <div className="ml-auto text-xs text-[var(--text-secondary)]">
            {formatTimestamp(item.timestamp)}
          </div>
        </div>
      ))}
    </div>
  );
}