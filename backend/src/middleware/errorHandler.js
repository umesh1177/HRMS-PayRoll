/**
 * Centralized Error Handling Middleware
 * 
 * RESPONSIBILITY:
 * Intercepts unhandled errors across all Express route handlers and standardizes
 * error responses according to the PeoplePay360 API contract: { error: { code, message } }.
 * 
 * NOT RESPONSIBLE FOR:
 * Application business logic, authentication token verification, or DB query execution.
 */

/**
 * Express error handling middleware.
 * 
 * @param {Error|object} err - Caught error object or custom API error
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 * @returns {void} Sends standardized JSON error payload to the client
 * @sideEffects Writes non-sensitive error details to standard error logs
 */
function errorHandler(err, req, res, next) {
  // Extract HTTP status code and standardized error code
  const statusCode = err.status || err.statusCode || 500;
  const errorCode = err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  const message = err.message || 'An unexpected error occurred';

  // Log server errors for internal troubleshooting while avoiding plain text leaks in production
  if (statusCode >= 500) {
    console.error(`[ERROR] [${req.method} ${req.originalUrl}]:`, err);
  }

  // Enforce uniform { error: { code, message } } envelope per API Contract Rule #4
  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: message
    }
  });
}

module.exports = errorHandler;
