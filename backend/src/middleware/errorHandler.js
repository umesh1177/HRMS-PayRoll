/**
 * Centralized Error Handling Middleware
 * 
 * RESPONSIBILITY:
 * Intercepts unhandled errors across all Express route handlers and standardizes
 * error responses into user-friendly messages according to the PeoplePay360
 * API contract: { error: { code, message } }.
 * 
 * Translates raw database/SQL errors (ER_DUP_ENTRY, ER_NO_REFERENCED_ROW_2,
 * ER_ROW_IS_REFERENCED_2, ER_DATA_TOO_LONG, etc.) into intuitive, human-friendly guidance.
 */

/**
 * Parses MySQL and system errors into clear, user-friendly messages.
 * 
 * @param {Error|object} err - The error object
 * @returns {{ statusCode: number, errorCode: string, message: string }}
 */
function translateError(err) {
  const rawCode = err.code || '';
  const rawMsg = err.message || '';
  const rawSqlMsg = err.sqlMessage || '';
  let statusCode = err.status || err.statusCode || 500;
  let errorCode = err.code || 'BAD_REQUEST';
  let message = err.message || 'An unexpected error occurred. Please try again.';

  // 1. MySQL Duplicate Key Error (ER_DUP_ENTRY)
  if (rawCode === 'ER_DUP_ENTRY' || rawCode === 1062 || rawMsg.includes('Duplicate entry')) {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';

    const fullMsg = `${rawMsg} ${rawSqlMsg}`;
    if (fullMsg.includes('employees.email') || fullMsg.includes('users.email') || fullMsg.includes('email')) {
      message = 'This email address is already in use. Please provide a unique email address.';
    } else if (fullMsg.includes('employee_code')) {
      message = 'This Employee Code is already assigned to another employee. Please provide a unique Employee Code.';
    } else if (fullMsg.includes('uq_payslip_per_employee_period')) {
      message = 'A payslip for this employee in the selected payrun period already exists.';
    } else if (fullMsg.includes('uq_structure_rule')) {
      message = 'This salary rule is already assigned to the selected salary structure.';
    } else if (fullMsg.includes('uq_payrun_employee')) {
      message = 'This employee is already enrolled in the selected payrun.';
    } else if (fullMsg.includes('name') || fullMsg.includes('title')) {
      message = 'A record with this name or title already exists. Please choose a unique name.';
    } else if (fullMsg.includes('code')) {
      message = 'A record with this code already exists. Please provide a unique code.';
    } else {
      message = 'A record with these unique details already exists in the system. Please ensure unique values are entered.';
    }
  }

  // 2. MySQL Missing Foreign Key Reference (ER_NO_REFERENCED_ROW_2 / ER_NO_REFERENCED_ROW)
  else if (rawCode === 'ER_NO_REFERENCED_ROW_2' || rawCode === 'ER_NO_REFERENCED_ROW' || rawCode === 1452) {
    statusCode = 400;
    errorCode = 'INVALID_REFERENCE';
    message = 'One of the selected references (such as department, position, schedule, or manager) was not found or has been removed. Please refresh and select a valid option.';
  }

  // 3. MySQL Foreign Key Dependency / Restricted Deletion (ER_ROW_IS_REFERENCED_2 / ER_ROW_IS_REFERENCED)
  else if (rawCode === 'ER_ROW_IS_REFERENCED_2' || rawCode === 'ER_ROW_IS_REFERENCED' || rawCode === 1451) {
    statusCode = 400;
    errorCode = 'RESTRICTED_DEPENDENCY';
    message = 'This record cannot be deleted or modified because other active records depend on it. Please reassign or remove related items first.';
  }

  // 4. Data Too Long for Column (ER_DATA_TOO_LONG)
  else if (rawCode === 'ER_DATA_TOO_LONG' || rawCode === 1406) {
    statusCode = 400;
    errorCode = 'DATA_TOO_LONG';
    message = 'One or more input fields exceed the maximum allowed length. Please shorten your input and try again.';
  }

  // 5. Invalid Data Types / Bad Formats / Truncations (ER_TRUNCATED_WRONG_VALUE / ER_WRONG_VALUE)
  else if (
    rawCode === 'ER_TRUNCATED_WRONG_VALUE' ||
    rawCode === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' ||
    rawCode === 'ER_WRONG_VALUE' ||
    rawCode === 1265 ||
    rawCode === 1366 ||
    rawCode === 1292
  ) {
    statusCode = 400;
    errorCode = 'INVALID_FORMAT';
    message = 'One or more values (such as dates, amounts, or time values) are formatted incorrectly. Please review your entries.';
  }

  // 6. Missing Mandatory / Not Null Column (ER_BAD_NULL_ERROR)
  else if (rawCode === 'ER_BAD_NULL_ERROR' || rawCode === 1048) {
    statusCode = 400;
    errorCode = 'MISSING_REQUIRED_FIELD';
    message = 'A required field is missing. Please ensure all mandatory fields are completed before saving.';
  }

  // 7. Database Connection / Network Failures
  else if (rawCode === 'ECONNREFUSED' || rawCode === 'PROTOCOL_CONNECTION_LOST' || rawCode === 'ER_ACCESS_DENIED_ERROR') {
    statusCode = 503;
    errorCode = 'SERVICE_UNAVAILABLE';
    message = 'Database service is temporarily unavailable. Please verify your connection or try again shortly.';
  }

  // 8. Custom validation errors with 4xx status
  else if (statusCode >= 400 && statusCode < 500) {
    // Keep the explicit friendly message provided by the validation logic
    message = err.message || 'Please verify the highlighted fields and try again.';
  }

  // 9. Generic 500 Internal Server Errors
  else {
    statusCode = 500;
    errorCode = 'INTERNAL_SERVER_ERROR';
    message = 'An unexpected server error occurred while processing your request. Please try again.';
  }

  return { statusCode, errorCode, message };
}

/**
 * Express error handling middleware.
 */
function errorHandler(err, req, res, next) {
  const { statusCode, errorCode, message } = translateError(err);

  // Log server errors for internal troubleshooting while avoiding raw leaks to the client
  if (statusCode >= 500) {
    console.error(`[ERROR] [${req.method} ${req.originalUrl}]:`, err);
  }

  // Enforce uniform { error: { code, message } } envelope per API Contract
  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: message
    }
  });
}

module.exports = errorHandler;
