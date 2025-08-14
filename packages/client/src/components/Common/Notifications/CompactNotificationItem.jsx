import { cn } from "@lib/utils";
import { Route, Bus, Users, Package, MessageSquare } from "lucide-react";
import { Badge } from "@/components/Common/UI/Badge";
import { memo, useState } from 'react';
import { useNotifications } from '@contexts/NotificationContext';

// Update type icons to match notification types
const typeIcons = {
  route: Route,
  shuttle: Bus,
  recruitment: Users,
  batch: Package,
  default: MessageSquare
};

export const CompactNotificationItem = memo(function CompactNotificationItem({ 
  id,
  type, 
  title, 
  description,
  timestamp, 
  importance, 
  status 
}) {
  const { markAsSeen } = useNotifications();
  // Local state to track if the notification was marked as read in this session
  const [locallyMarkedAsRead, setLocallyMarkedAsRead] = useState(false);
  
  // Consider notification read if original status is 'Read' or locally marked as read
  const isRead = status === 'Read' || locallyMarkedAsRead;
  
  const IconComponent = typeIcons[type] || typeIcons.default;

  const handleClick = () => {
    if (status === 'Pending' && !locallyMarkedAsRead) {
      markAsSeen(id);
      // Immediately update local state for responsive UI feedback
      setLocallyMarkedAsRead(true);
    }
  };

  // Format timestamp to relative time
  const formatTime = (time) => {
    const date = new Date(time);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 30) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "flex items-start gap-2 p-2 rounded-lg transition-all cursor-pointer",
        "hover:bg-slate-50 dark:hover:bg-slate-800/50",
        isRead ? "opacity-75" : "opacity-100",
        `importance-${importance.level || 3}`
      )}
    >
      <div className={cn(
        "flex-shrink-0 p-2 rounded-lg",
        isRead ? "text-slate-400" : "text-primary"
      )}>
        <IconComponent className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          isRead ? "text-slate-500" : "text-slate-900 dark:text-slate-100"
        )}>
          {title}
        </p>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
            {description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <Badge 
            variant="outline" 
            className="px-1 py-0 text-xs"
          >
            {importance?.label || "Medium"}
          </Badge>
          <span className="text-xs text-slate-400">
            {formatTime(timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
});
