/**
 * Unified Formatting Utilities
 * 
 * RESPONSIBILITY:
 * Provides user-friendly formatting for dates, times, date ranges, worked hours durations,
 * leave day allocations, currency numbers, and timestamps across the entire application.
 */

/**
 * Formats a date string (e.g. '2026-09-05' or ISO string) into a friendly human-readable format.
 * Example: '2026-09-05' -> 'Sep 5, 2026'
 * 
 * @param {string|Date|null} dateValue - Input date
 * @param {object} [options] - Intl.DateTimeFormat options
 * @returns {string} Formatted date string or '-'
 */
export function formatDate(dateValue, options = {}) {
  if (!dateValue) return '-';
  try {
    const d = typeof dateValue === 'string' && dateValue.length === 10
      ? new Date(dateValue + 'T00:00:00')
      : new Date(dateValue);
    
    if (isNaN(d.getTime())) return String(dateValue);

    const defaultOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      ...options
    };
    return d.toLocaleDateString('en-US', defaultOptions);
  } catch {
    return String(dateValue);
  }
}

/**
 * Formats a date with weekday.
 * Example: '2026-09-05' -> 'Sat, Sep 5, 2026'
 * 
 * @param {string|Date|null} dateValue 
 * @returns {string}
 */
export function formatDateWithDay(dateValue) {
  return formatDate(dateValue, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Formats a date range into a concise, elegant format.
 * Example: ('2026-09-01', '2026-09-30') -> 'Sep 1 – Sep 30, 2026'
 * Example: ('2026-09-01', null) -> 'Sep 1, 2026 – Open-ended'
 * 
 * @param {string|Date|null} start 
 * @param {string|Date|null} end 
 * @returns {string}
 */
export function formatDateRange(start, end) {
  if (!start && !end) return '-';
  const startStr = formatDate(start);
  if (!end) return `${startStr} – Open-ended`;
  const endStr = formatDate(end);
  return `${startStr} – ${endStr}`;
}

/**
 * Formats a time string or datetime timestamp into 12-hour AM/PM format.
 * Example: '09:30:00' or '2026-09-05T09:30:00Z' -> '09:30 AM'
 * 
 * @param {string|Date|null} timeValue 
 * @returns {string}
 */
export function formatTime(timeValue) {
  if (!timeValue) return '-';
  try {
    // If format is already "HH:MM:SS" or "HH:MM"
    if (typeof timeValue === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(timeValue.trim())) {
      const parts = timeValue.trim().split(':');
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    }

    const d = new Date(timeValue);
    if (isNaN(d.getTime())) return String(timeValue);

    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return String(timeValue);
  }
}

/**
 * Formats a full date and time string.
 * Example: '2026-09-05T14:30:00Z' -> 'Sep 5, 2026, 02:30 PM'
 * 
 * @param {string|Date|null} dateTimeValue 
 * @returns {string}
 */
export function formatDateTime(dateTimeValue) {
  if (!dateTimeValue) return '-';
  try {
    const d = new Date(dateTimeValue);
    if (isNaN(d.getTime())) return String(dateTimeValue);

    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return String(dateTimeValue);
  }
}

/**
 * Formats worked hours or duration numbers into friendly hours & minutes.
 * Example: 8.5 -> '8 hrs 30 mins'
 * Example: 8 -> '8 hrs'
 * Example: 0.75 -> '45 mins'
 * Example: null/undefined -> 'In Progress'
 * 
 * @param {number|string|null} hours - Decimal hours
 * @param {string} [inProgressFallback='In Progress']
 * @returns {string}
 */
export function formatWorkedHours(hours, inProgressFallback = 'In Progress') {
  if (hours === null || hours === undefined || hours === '') return inProgressFallback;
  const num = Number(hours);
  if (isNaN(num) || num < 0) return inProgressFallback;
  if (num === 0) return '0 hrs';

  const totalMinutes = Math.round(num * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h > 0 && m > 0) {
    return `${h} hr${h > 1 ? 's' : ''} ${m} min${m > 1 ? 's' : ''}`;
  } else if (h > 0) {
    return `${h} hr${h > 1 ? 's' : ''}`;
  } else {
    return `${m} min${m > 1 ? 's' : ''}`;
  }
}

/**
 * Formats leave or working day counts.
 * Example: 1 -> '1 Day'
 * Example: 5 -> '5 Days'
 * Example: 2.5 -> '2.5 Days'
 * 
 * @param {number|string|null} days 
 * @returns {string}
 */
export function formatDays(days) {
  if (days === null || days === undefined || days === '') return '0 Days';
  const num = Number(days);
  if (isNaN(num)) return '0 Days';
  return `${num} Day${num === 1 ? '' : 's'}`;
}

/**
 * Formats weekly working schedule hours.
 * Example: 40 -> '40 hrs / week'
 * 
 * @param {number|string|null} hours 
 * @returns {string}
 */
export function formatWeeklyHours(hours) {
  if (!hours) return '0 hrs / week';
  return `${Number(hours)} hrs / week`;
}

/**
 * Formats currency amount.
 * Example: 5000 -> '$5,000.00'
 * 
 * @param {number|string|null} amount 
 * @param {string} [currency='$']
 * @returns {string}
 */
export function formatCurrency(amount, currency = '$') {
  if (amount === null || amount === undefined || amount === '') return `${currency}0.00`;
  const num = Number(amount);
  if (isNaN(num)) return `${currency}0.00`;
  return `${currency}${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}
