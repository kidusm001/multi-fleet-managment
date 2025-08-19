export const roles = ["admin", "manager"];

export const permissions = {
  admin: ["all"],
  manager: ["manage_employees", "manage_drivers", "manage_shifts"],
  
};

export const formatDate = (dateString) => {
  if (!dateString) return "Not available";
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return "Invalid date";
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return "Date error";
  }
};

export const getUserStatus = (user) => {
  if (user?.banned) return { type: "banned", label: "Banned" };
  return { type: "active", label: "Active" };
};