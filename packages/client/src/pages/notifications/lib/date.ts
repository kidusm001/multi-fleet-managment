import {
    format,
    formatDistanceToNow,
    isToday,
    isYesterday,
    parseISO,
  } from "date-fns";
  
  export const formatNotificationDate = (date: Date | string) => {
    // If it's a relative time string (e.g., "2 hours ago"), return as is
    if (typeof date === "string" && date.includes("ago")) {
      return date;
    }
  
    // Convert string date to Date object if needed
    const dateObj = typeof date === "string" ? parseISO(date) : date;
  
    if (isToday(dateObj)) {
      return `Today at ${format(dateObj, "h:mm a")}`;
    }
  
    if (isYesterday(dateObj)) {
      return `Yesterday at ${format(dateObj, "h:mm a")}`;
    }
  
    return format(dateObj, "MMM d, yyyy h:mm a");
  };
  
  export const formatDateRange = (start: Date, end: Date) => {
    return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
  };
  
  export const getRelativeTime = (date: Date | string) => {
    // If it's already a relative time string, return as is
    if (typeof date === "string" && date.includes("ago")) {
      return date;
    }
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  };
  