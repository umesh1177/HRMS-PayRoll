/**
 * Date and Working Days Utility Helper
 * 
 * RESPONSIBILITY:
 * Provides deterministic date calculations, period formatting, and working days counting
 * (excluding weekends) for payroll and attendance computations.
 * 
 * NOT RESPONSIBLE FOR:
 * Database query execution or payroll formula evaluation.
 */

/**
 * Calculates the number of standard working days (Monday-Friday) between two dates inclusive.
 * 
 * @param {string|Date} startDate - Start of period (YYYY-MM-DD)
 * @param {string|Date} endDate - End of period (YYYY-MM-DD)
 * @returns {number} Total business days
 */
function getBusinessDaysCount(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return Math.max(1, count);
}

/**
 * Formats date into standard YYYY-MM-DD string.
 * 
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted string
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

module.exports = {
  getBusinessDaysCount,
  formatDate
};
