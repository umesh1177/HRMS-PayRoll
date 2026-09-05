/**
 * Centralized Validation Utilities for Backend
 * 
 * RESPONSIBILITY:
 * Provides pure validation helper functions for RFC-compliant emails,
 * international/national phone formats, strict dates, date ranges,
 * positive numbers, enum values, and alphanumeric codes.
 */

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;
const CODE_REGEX = /^[A-Z0-9_]{2,30}$/;

/**
 * Validates email format.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validates phone number format.
 * @param {string} phone
 * @returns {boolean}
 */
function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return true; // Optional field
  return PHONE_REGEX.test(phone.trim());
}

/**
 * Validates strict date string (YYYY-MM-DD or ISO 8601).
 * @param {string} dateStr
 * @returns {boolean}
 */
function isValidDate(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

/**
 * Validates that end date is on or after start date.
 * @param {string} startDate
 * @param {string} endDate
 * @returns {boolean}
 */
function isValidDateRange(startDate, endDate) {
  if (!startDate || !endDate) return true;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end.getTime() >= start.getTime();
}

/**
 * Validates positive number with optional minimum and maximum bounds.
 * @param {number|string} val
 * @param {number} [min=0]
 * @param {number} [max=Infinity]
 * @returns {boolean}
 */
function isValidNumber(val, min = 0, max = Infinity) {
  if (val === null || val === undefined || val === '') return false;
  const num = Number(val);
  if (isNaN(num)) return false;
  return num >= min && num <= max;
}

/**
 * Validates alphanumeric uppercase code (e.g. BASIC, HRA, EMP001).
 * @param {string} code
 * @returns {boolean}
 */
function isValidCode(code) {
  if (!code || typeof code !== 'string') return false;
  return CODE_REGEX.test(code.trim().toUpperCase());
}

/**
 * Validates value is one of allowed enum values.
 * @param {*} val
 * @param {Array} allowed
 * @returns {boolean}
 */
function isValidEnum(val, allowed = []) {
  return allowed.includes(val);
}

/**
 * Validates that all required fields exist and are non-empty in request body.
 * @param {object} body
 * @param {Array<string>} requiredKeys
 * @returns {string|null} Missing field name or null if valid
 */
function getMissingRequiredField(body, requiredKeys = []) {
  if (!body || typeof body !== 'object') return 'request body';
  for (const key of requiredKeys) {
    const val = body[key];
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
      return key;
    }
  }
  return null;
}

/**
 * Creates standardized validation error.
 * @param {string} message
 * @param {string} [field]
 * @returns {Error}
 */
function createValidationError(message, field) {
  const error = new Error(message);
  error.status = 400;
  error.code = 'VALIDATION_ERROR';
  if (field) error.field = field;
  return error;
}

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidDate,
  isValidDateRange,
  isValidNumber,
  isValidCode,
  isValidEnum,
  getMissingRequiredField,
  createValidationError
};
