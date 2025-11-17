export const formatCurrency = (value) => {
  const formatter = new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(value);
};

export const formatPercent = (value) => {
  return `${Math.round(value)}%`;
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric'
  }).format(new Date(date));
};

export const formatNumber = (value) => {
  return new Intl.NumberFormat('en-US').format(value);
};

export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};