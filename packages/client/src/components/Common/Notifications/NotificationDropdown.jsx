import React from 'react';
import { Button } from "@components/Common/UI/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@components/Common/UI/popover";
import { ScrollArea } from "@components/Common/UI/scroll-area";
// import { Badge } from "@/components/Common/UI/Badge";
import { cn } from "@lib/utils";
import { useNavigate } from "react-router-dom";
// import { getImportanceLevel } from "@pages/notifications/lib/importance-levels";
import { useTheme } from "@contexts/ThemeContext";

import { Check, Bus, Route, Car, User, LayoutGrid, IdCard } from "lucide-react";
import { useNotifications } from "@contexts/NotificationContext";

// Helper functions
const mapTypeToIcon = (type) => {
  switch (type) {
    case 'shuttle':
      return 'bus';
    case 'route':
      return 'route';
    case 'vehicle':
      return 'car';
    case 'employee':
      return 'user';
    case 'department':
      return 'grid';
    case 'driver':
      return 'id';
    default:
      return 'message';
  }
};


const mapImportanceToType = (importance) => {
  if (!importance) return undefined;

  // If importance is a string or has a 'value' property, convert it to lowercase.
  const imp =
    typeof importance === "string"
      ? importance.toLowerCase()
      : importance.value
      ? importance.value.toLowerCase()
      : "";

  // Map high to "orange", medium to "yellow", and low to "purple".
  if (imp === "high") return "orange";
  if (imp === "medium") return "yellow";
  if (imp === "low") return "purple";
  return undefined;
};

function NotificationDropdown() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const { 
    notifications, 
    unreadCount, 
    markAsRead,
    markAllAsSeen, 
    isConnected 
  } = useNotifications();

  const handleMarkAllAsRead = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    markAllAsSeen();
    
    // Event is already emitted by markAllAsSeen in context
  };

  const hardNavigateToNotifications = (idParam) => {
    const target = idParam ? `/notifications?id=${idParam}` : '/notifications';
    // Always force a full reload if we are not already on /notifications to avoid stale DOM issue
    if (window.location.pathname !== '/notifications') {
      window.location.href = target;
    } else if (idParam) {
      // If already on notifications, use client navigation to update query param
      navigate(target);
    }
  };

  const handleNotificationClick = (id, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    markAsRead(id);
    
    // Event is already emitted by markAsRead in context
    
    hardNavigateToNotifications(id);
  };

  const handleViewAllClick = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    // Use client-side navigation instead of hard reload
    navigate('/notifications');
  };


  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className={cn(
            "button relative flex items-center justify-center",
            "w-9 h-9 rounded-full cursor-pointer transition-all duration-300",
            isDarkMode 
              ? "bg-gray-800 hover:bg-gray-700 shadow-md border border-gray-700" 
              : "bg-white hover:bg-gray-50 shadow-sm border border-border",
            "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          aria-label="Open notifications"
        >
          <svg viewBox="0 0 448 512" className="bell w-4 transition-transform">
            <path 
              d="M224 0c-17.7 0-32 14.3-32 32V49.9C119.5 61.4 64 124.2 64 200v33.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.9 25.4S14.8 416 24 416H424c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6C399.5 322.9 384 278.8 384 233.4V200c0-75.8-55.5-138.6-128-150.1V32c0-17.7-14.3-32-32-32zm0 96h8c57.4 0 104 46.6 104 104v33.4c0 47.9 13.9 94.6 39.7 134.6H72.3C98.1 328 112 281.3 112 233.4V200c0-57.4 46.6-104 104-104h8zm64 352H224 160c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7s18.7-28.3 18.7-45.3z" 
              className={cn(
                "transition-colors duration-200",
                isDarkMode ? "fill-gray-200" : "fill-gray-600"
              )}
            />
          </svg>
          {unreadCount > 0 && (
            <span className={cn(
              "absolute -top-0.5 -right-0.5",
              "min-w-[18px] h-[18px] px-1",
              "rounded-full bg-red-500",
              "text-[10px] font-medium text-white",
              "flex items-center justify-center",
              "border-[1.5px]",
              isDarkMode ? "border-gray-900" : "border-white",
              "shadow-sm"
            )}>
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>


  <style>{`
        @keyframes bellRing {
          0%, 100% { transform-origin: top; transform: rotate(0); }
          15% { transform: rotate(8deg); }
          30% { transform: rotate(-8deg); }
          45% { transform: rotate(4deg); }
          60% { transform: rotate(-4deg); }
          75% { transform: rotate(2deg); }
          85% { transform: rotate(-2deg); }
        }
        
        .button:hover .bell {
          animation: bellRing 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        

        .button:active { transform: scale(0.95); }
      `}</style>


      <PopoverContent 
        align="end" 
        sideOffset={5} 
        className={cn(
          "w-[380px] p-0 shadow-lg border",
          isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white"
        )}
      >
        {/* Header */}

        <div className={cn(
          "flex items-center justify-between py-3 px-4",
          isDarkMode ? "border-gray-800" : "border-gray-200",
          "border-b"
        )}>
          <div>
            <h4 className={cn(
              "text-sm font-semibold inline mr-2",
              isDarkMode ? "text-gray-100" : "text-gray-900"
            )}>
              Notifications
            </h4>
            <span className="text-xs text-muted-foreground">({unreadCount} unread)</span>
          </div>
          <div className="flex space-x-1">
            <Button
              variant={isDarkMode ? "ghost" : "outline"}
              size="sm"
              className={cn(
                "text-xs h-7 px-2 hover:text-foreground",
                isDarkMode ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800" : "text-muted-foreground"
              )}
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </Button>
            <Button
              variant={isDarkMode ? "ghost" : "outline"}
              size="sm"
              className={cn(
                "text-xs h-7 px-2 hover:text-foreground",
                isDarkMode ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800" : "text-muted-foreground"
              )}
              onClick={handleViewAllClick}
            >
              View All
            </Button>
          </div>
        </div>

        {/* Notification List */}

        <ScrollArea className={cn(
          "h-[400px]",
          isDarkMode ? "bg-gray-900" : "bg-white"
        )}>
          <div className="relative">
            {notifications.length > 0 ? (
              notifications.map((notification, index) => {

                // Check the notification's actual read status
                const isRead = notification.status === 'Read' || 
                               (notification.seenBy && notification.seenBy.some(seen => seen.readAt !== null));
                const notificationType = mapImportanceToType(notification.importance);
                const iconType = mapTypeToIcon(notification.notificationType);
                const iconBgClass = isRead
                  ? "bg-teal-500"
                  : notificationType === "purple"
                    ? isDarkMode ? "bg-purple-600" : "bg-purple-500"
                    : notificationType === "orange"
                      ? isDarkMode ? "bg-orange-600" : "bg-orange-500"
                      : notificationType === "yellow"
                        ? isDarkMode ? "bg-yellow-600" : "bg-yellow-500"
                        : isDarkMode ? "bg-gray-600" : "bg-gray-400";

                
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "relative pl-12 pr-4 py-4 transition-colors cursor-pointer border-b",
                      isDarkMode ? "border-gray-800" : "border-gray-100",
                      isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-50",
                      notificationType === "purple" && !isDarkMode && "bg-purple-50",
                      notificationType === "orange" && !isDarkMode && "bg-orange-50",

                      notificationType === "yellow" && !isDarkMode && "bg-yellow-50",
                      notificationType === "purple" && isDarkMode && "bg-purple-900/20",
                      notificationType === "orange" && isDarkMode && "bg-orange-900/20",
                      notificationType === "yellow" && isDarkMode && "bg-yellow-900/20",
                      isRead && !isDarkMode && "bg-gray-50/80",
                      isRead && isDarkMode && "bg-gray-800/50"
                    )}
                    onClick={(e) => handleNotificationClick(notification.id, e)}
                    role="button"
                    tabIndex={0}
                  >
                    {/* Timeline connectors and content */}

                    {/* Timeline connector - top */}
                    {index > 0 && (
                      <div
                        className={cn(
                          "absolute left-[22px] top-0 w-[1.5px] h-4",

                          iconBgClass
                        )}
                      />
                    )}

                    {/* Timeline connector - bottom */}
                    {index < notifications.length - 1 && (
                      <div
                        className={cn(
                          "absolute left-[22px] top-4 bottom-0 w-[1.5px]",
                          iconBgClass
                        )}
                      />
                    )}
                    <div className="absolute left-[13px] top-[18px] flex items-center justify-center">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center overflow-hidden",
                          isRead

                            ? "bg-teal-500"
                            : notificationType === "purple"
                              ? isDarkMode ? "bg-purple-600" : "bg-purple-500"
                              : notificationType === "orange"
                                ? isDarkMode ? "bg-orange-600" : "bg-orange-500"

                                : notificationType === "yellow"
                                  ? isDarkMode ? "bg-yellow-600" : "bg-yellow-500"
                                  : isDarkMode ? "bg-gray-600" : "bg-gray-400",
                          isDarkMode ? "shadow-md shadow-black/30" : "shadow-sm",
                          "ring-[1.5px]",
                          isDarkMode ? "ring-gray-800" : "ring-white"
                        )}
                      >
                        {isRead ? (
                          <Check className="h-3 w-3 text-white" />
                        ) : iconType === "bus" ? (
                          <Bus className="h-3 w-3 text-white" />
                        ) : iconType === "route" ? (
                          <Route className="h-3 w-3 text-white" />
                        ) : iconType === "car" ? (
                          <Car className="h-3 w-3 text-white" />
                        ) : iconType === "user" ? (
                          <User className="h-3 w-3 text-white" />
                        ) : iconType === "grid" ? (
                          <LayoutGrid className="h-3 w-3 text-white" />
                        ) : iconType === "id" ? (
                          <IdCard className="h-3 w-3 text-white" />
                        ) : null }

                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <p
                          className={cn(
                            "text-sm",

                            isRead 
                              ? (isDarkMode ? "text-gray-500" : "text-gray-500") 
                              : (isDarkMode ? "text-gray-100 font-medium" : "font-medium"),
                            !isRead && notificationType === "purple" && 
                              (isDarkMode ? "text-purple-300" : "text-purple-600"),
                            !isRead && notificationType === "orange" && 
                              (isDarkMode ? "text-orange-300" : "text-orange-600"),
                            !isRead && notificationType === "yellow" && 
                              (isDarkMode ? "text-yellow-300" : "text-yellow-600")
                          )}
                        >
                          {notification.subject || notification.title}
                        </p>
                        <p className={cn(
                          "text-xs whitespace-nowrap", 
                          isDarkMode ? "text-gray-500" : "text-muted-foreground"
                        )}>

                          {notification.localTime || notification.createdAt}
                        </p>
                      </div>
                      {notification.message && (
                        <p className={cn(
                          "text-sm", 
                          isRead
                            ? (isDarkMode ? "text-gray-500" : "text-gray-500")
                            : (isDarkMode ? "text-gray-400" : "text-muted-foreground")
                        )}>
                          {notification.message}

                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">

                <p className="text-sm">
                  {!isConnected 
                    ? 'Connecting to notification service...' 
                    : 'No new notifications'
                  }
                </p>

              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

NotificationDropdown.displayName = "NotificationDropdown";

export { NotificationDropdown };
