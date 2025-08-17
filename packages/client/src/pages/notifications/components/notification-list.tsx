import { useTheme } from "@contexts/ThemeContext";
import { NotificationItem } from "./notification-item";
import type { NotificationItem as INotificationItem } from "../types/notifications";
import { cn } from "@/lib/utils";
import "../styles/notification-effects.css";

interface NotificationListProps {
  notifications: INotificationItem[];
  selectedIds: string[];
  onSelect: (id: string) => void;
}

export function NotificationList({
  notifications,
  selectedIds,
  onSelect,
}: NotificationListProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (notifications.length === 0) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center p-8",
        "rounded-2xl notification-glass",
        "backdrop-blur-[8px]",
        isDark ? "bg-gray-900/20" : "bg-white/20",
        "transition-all duration-300 ease-in-out"
      )}>
        <p className={cn(
          "text-sm",
          isDark ? "text-gray-400" : "text-gray-500"
        )}>
          No notifications found
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-6", // Increased padding
      "rounded-2xl notification-glass",
      "backdrop-blur-[12px]",
      isDark ? "bg-gray-900/5" : "bg-white/5", // More subtle background
      "transition-all duration-300 ease-in-out"
    )}>
      <div className="relative">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            style={{
              // Creates a subtle layered effect
              transform: `translateY(-${index * 2}px)`,
              zIndex: notifications.length - index,
            }}
            className={cn(
              "transform transition-all duration-300 ease-out",
              "hover:translate-y-[-8px]", // Lift effect on hover
              "mb-4", // Consistent spacing
              "relative", // For proper shadow stacking
            )}
          >
            <NotificationItem
              {...notification}
              isSelected={selectedIds.includes(notification.id)}
              onSelect={onSelect}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
