/**
 * Reusable Frontend Form Validation Utilities
 * 
 * RESPONSIBILITY:
 * Provides client-side validation logic, regex checkers, date comparisons,
 * and user-friendly error string generators for instant inline form feedback.
 */

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;
export const CODE_REGEX = /^[A-Z0-9_]{2,30}$/;

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  return PHONE_REGEX.test(phone.trim());
}

export function isValidCode(code) {
  if (!code || typeof code !== 'string') return false;
  return CODE_REGEX.test(code.trim().toUpperCase());
}

export function isValidPositiveNumber(val, min = 0.01) {
  if (val === undefined || val === null || val === '') return false;
  const num = Number(val);
  return !isNaN(num) && num >= min;
}

export function isValidDateRange(start, end) {
  if (!start || !end) return false;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return false;
  return e >= s;
}

/**
 * Validates email string.
 * @param {string} email
 * @returns {string|null} Error message or null if valid
 */
export function validateEmail(email) {
  if (!email || !email.trim()) return 'Email is required';
  if (!EMAIL_REGEX.test(email.trim())) return 'Please enter a valid email address (e.g. name@company.com)';
  return null;
}

/**
 * Validates phone number.
 * @param {string} phone
 * @returns {string|null} Error message or null if valid
 */
export function validatePhone(phone) {
  if (!phone || !phone.trim()) return null; // Optional
  if (!PHONE_REGEX.test(phone.trim())) return 'Please enter a valid phone number (7-20 digits)';
  return null;
}

/**
 * Validates non-empty field with optional minimum length.
 * @param {string} val
 * @param {string} fieldName
 * @param {number} [minLength=1]
 * @returns {string|null} Error message or null if valid
 */
export function validateRequired(val, fieldName = 'Field', minLength = 1) {
  if (val === undefined || val === null || (typeof val === 'string' && !val.trim())) {
    return `${fieldName} is required`;
  }
  if (typeof val === 'string' && val.trim().length < minLength) {
    return `${fieldName} must be at least ${minLength} character${minLength !== 1 ? 's' : ''}`;
  }
  return null;
}

/**
 * Validates positive number.
 * @param {number|string} val
 * @param {string} fieldName
 * @param {number} [min=0.01]
 * @returns {string|null} Error message or null if valid
 */
export function validatePositiveNumber(val, fieldName = 'Amount', min = 0.01) {
  if (val === undefined || val === null || val === '') return `${fieldName} is required`;
  const num = Number(val);
  if (isNaN(num)) return `${fieldName} must be a valid numeric value`;
  if (num < min) return `${fieldName} must be at least ${min}`;
  return null;
}

/**
 * Validates date range.
 * @param {string} start
 * @param {string} end
 * @param {string} [startLabel='Start Date']
 * @param {string} [endLabel='End Date']
 * @returns {string|null} Error message or null if valid
 */
export function validateDateRange(start, end, startLabel = 'Start Date', endLabel = 'End Date') {
  if (!start) return `${startLabel} is required`;
  if (end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime())) return `Invalid ${startLabel}`;
    if (isNaN(endDate.getTime())) return `Invalid ${endLabel}`;
    if (endDate < startDate) return `${endLabel} must be on or after ${startLabel}`;
  }
  return null;
}

/**
 * Validates uppercase alphanumeric rule code.
 * @param {string} code
 * @returns {string|null} Error message or null if valid
 */
export function validateRuleCode(code) {
  if (!code || !code.trim()) return 'Code is required';
  if (!CODE_REGEX.test(code.trim().toUpperCase())) {
    return 'Code must be uppercase alphanumeric (e.g. BASIC, HRA_01, PF)';
  }
  return null;
}

/**
 * Validates payrun creation step 1 scope data.
 * @param {object} scopeData
 * @returns {object} Error dictionary
 */
export function validatePayrun(scopeData) {
  const errors = {};
  if (!scopeData.name || scopeData.name.trim().length < 3) {
    errors.name = 'Payrun name must be at least 3 characters.';
  }
  if (!scopeData.salary_structure_id) {
    errors.salary_structure_id = 'Please select a salary structure.';
  }
  if (!scopeData.period_start) {
    errors.period_start = 'Period start date is required.';
  }
  if (!scopeData.period_end) {
    errors.period_end = 'Period end date is required.';
  } else if (scopeData.period_start && !isValidDateRange(scopeData.period_start, scopeData.period_end)) {
    errors.period_end = 'Period end date must be on or after period start date.';
  }
  return errors;
}

/**
 * Extracts a user-friendly error string from an axios response or error object.
 * 
 * @param {Error|object} err - Caught error object
 * @param {string} [defaultMsg='An error occurred. Please check your entries and try again.'] - Fallback message
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(err, defaultMsg = 'An error occurred. Please check your entries and try again.') {
  if (!err) return defaultMsg;
  if (typeof err === 'string') return err;
  if (err.response?.data?.error?.message) return err.response.data.error.message;
  if (err.response?.data?.message) return err.response.data.message;
  if (err.response?.data?.error && typeof err.response.data.error === 'string') return err.response.data.error;
  if (err.message && !err.message.includes('status code') && !err.message.includes('Network Error') && !err.message.includes('ECONNREFUSED')) {
    return err.message;
  }
  return defaultMsg;
}
