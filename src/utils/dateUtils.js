import { format, parseISO } from 'date-fns';

export const formatDate = (date) => {
  if (typeof date === 'string') return date;
  return format(date, 'yyyy-MM-dd');
};

export const daysUntilExpiry = (expiry) => {
  const today = new Date();
  const expDate = typeof expiry === 'string' ? parseISO(expiry) : expiry;
  return Math.ceil((expDate - today) / 86400000);
};

export default { formatDate, daysUntilExpiry };
