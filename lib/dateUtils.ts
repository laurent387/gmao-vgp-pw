/**
 * Format date utilities for the application
 * All dates should be displayed in DD/MM/YYYY format
 */

/**
 * Format date to DD/MM/YYYY
 */
export const formatDateFR = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '-';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
};

/**
 * Format date with time to DD/MM/YYYY HH:mm
 */
export const formatDateTimeFR = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '-';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return '-';
  }
};

/**
 * Convert DD/MM/YYYY string to ISO date string (YYYY-MM-DD)
 */
export const parseDateFR = (dateStr: string): string => {
  if (!dateStr) return '';
  
  try {
    const [day, month, year] = dateStr.split('/').map(Number);
    if (!day || !month || !year) return '';
    
    const date = new Date(year, month - 1, day);
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

/**
 * Get relative date label (today, tomorrow, etc.)
 */
export const getRelativeDateLabel = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (dateOnly.getTime() === today.getTime()) return 'Aujourd\'hui';
    if (dateOnly.getTime() === tomorrow.getTime()) return 'Demain';
    
    const daysUntil = Math.floor((dateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil > 0 && daysUntil <= 7) return `Dans ${daysUntil} jour(s)`;
    if (daysUntil < 0 && daysUntil >= -7) return `Il y a ${Math.abs(daysUntil)} jour(s)`;
    
    return formatDateFR(dateInput);
  } catch {
    return '';
  }
};
