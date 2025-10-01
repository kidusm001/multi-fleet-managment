import { format, isValid, parseISO } from 'date-fns';

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'available':
      return {
        bg: 'bg-green-100 dark:bg-green-900/20',
        text: 'text-green-800 dark:text-green-400'
      };
    case 'maintenance':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/20',
        text: 'text-yellow-800 dark:text-yellow-400'
      };
    case 'inactive':
    default:
      return {
        bg: 'bg-red-100 dark:bg-red-900/20',
        text: 'text-red-800 dark:text-red-400'
      };
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = parseISO(dateString);
  return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid Date';
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = parseISO(dateString);
  return isValid(date) ? format(date, 'MMM d, yyyy HH:mm') : 'Invalid Date';
};

export const calculateNextMaintenanceDate = (lastMaintenanceDate) => {
  if (!lastMaintenanceDate) return null;
  const date = parseISO(lastMaintenanceDate);
  if (!isValid(date)) return null;
  return new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
};

export const getMaintenanceStatus = (nextMaintenance) => {
    const daysUntil = Math.ceil(
        (new Date(nextMaintenance).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 7) return 'upcoming';
    return 'scheduled';
};

export const formatDriverStatus = (status) => {
  switch (status?.toLowerCase()) {
    case 'on-duty':
      return 'On Duty';
    case 'off-duty':
      return 'Off Duty';
    case 'break':
      return 'On Break';
    default:
      return 'Unknown';
  }
};