/**
 * Attendance Domain Service
 * 
 * RESPONSIBILITY:
 * Encapsulates business logic for attendance calculation: worked hours computation,
 * overtime threshold detection, and automatic punch status resolution (present, late, overtime).
 * 
 * NOT RESPONSIBLE FOR:
 * HTTP request/response serialization or token parsing.
 */

/**
 * Calculates net worked hours between two timestamps minus optional break minutes.
 * 
 * @param {Date|string} checkIn - Check-in timestamp
 * @param {Date|string} checkOut - Check-out timestamp
 * @param {number} [breakMinutes=0] - Optional unpaid break minutes
 * @returns {number} Decimal hours worked rounded to 2 decimal places
 */
function calculateWorkedHours(checkIn, checkOut, breakMinutes = 0) {
  if (!checkIn || !checkOut) return 0;
  const inMs = new Date(checkIn).getTime();
  const outMs = new Date(checkOut).getTime();

  if (outMs <= inMs) return 0;

  const totalMinutes = (outMs - inMs) / (1000 * 60) - breakMinutes;
  const hours = Math.max(0, totalMinutes / 60);
  return Number(hours.toFixed(2));
}

/**
 * Evaluates attendance status based on worked hours and check-in timing.
 * Schema reference: attendances.status ENUM('present','late','absent','overtime','missing_checkout')
 * 
 * @param {number} workedHours - Computed worked hours
 * @param {Date|string} checkInTime - Time of check-in
 * @param {number} [standardShiftHours=8] - Standard expected shift duration
 * @returns {string} Status enum value
 */
function evaluateAttendanceStatus(workedHours, checkInTime, standardShiftHours = 8) {
  if (workedHours > standardShiftHours) {
    return 'overtime';
  }

  // If check-in is after 09:30 AM local time, mark as late
  const checkInDate = new Date(checkInTime);
  const hours = checkInDate.getHours();
  const minutes = checkInDate.getMinutes();
  if (hours > 9 || (hours === 9 && minutes > 30)) {
    return 'late';
  }

  return 'present';
}

module.exports = {
  calculateWorkedHours,
  evaluateAttendanceStatus
};
