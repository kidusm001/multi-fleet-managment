import { useState, useEffect } from "react";
import NotificationItem from "./NotificationItem";
import { Bell } from "lucide-react";
import { ROLES } from "@data/constants";

export default function NotificationList({ role }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const addNotification = (notification) => {
    // Filter notifications based on role
    if (shouldShowNotification(notification, role)) {
      setNotifications((prev) => [notification, ...prev].slice(0, 5)); // Keep last 5 notifications
    }
  };

  const shouldShowNotification = (notification, userRole) => {
    // Define which roles can see which notification types
    const roleAccess = {
      [ROLES.ADMIN]: ["route", "employee", "shuttle", "system"],
      [ROLES.MANAGER]: ["route", "shuttle"],
      [ROLES.RECRUITMENT]: ["employee"],
      [ROLES.DRIVER]: ["route"],
    };

    // If no specific role access defined, show to all roles
    if (!notification.forRoles) {
      return true;
    }

    // Check if user's role has access to this notification type
    return roleAccess[userRole]?.includes(notification.type) ?? false;
  };

  // Filter existing notifications when role changes
  useEffect(() => {
    setNotifications((prev) =>
      prev.filter((notif) => shouldShowNotification(notif, role))
    );
  }, [role]);

  // Expose addNotification to window for global access
  useEffect(() => {
    window.addNotification = addNotification;
    return () => {
      delete window.addNotification;
    };
  }, [role]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 relative"
      >
        <Bell className="h-5 w-5" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-2">
            <h3 className="text-sm font-semibold mb-2 px-2">Notifications</h3>
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 px-2">
                No notifications
              </p>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification, index) => (
                  <NotificationItem key={index} {...notification} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
