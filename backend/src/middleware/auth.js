/**
 * Authentication Middleware
 * 
 * RESPONSIBILITY:
 * Intercepts incoming HTTP requests, extracts and verifies the JWT token from
 * the Authorization header, and attaches the decoded user payload to req.user.
 * 
 * NOT RESPONSIBLE FOR:
 * Checking user permission codes or domain role authorisations (delegated to middleware/rbac.js).
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware that authenticates JSON Web Tokens.
 * 
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 * @returns {void}
 * @sideEffects Populates req.user with decoded token payload: { id, role_id, employee_id, email }
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token; // Format: "Bearer <token>" or ?token=<token>

  if (!token) {
    const error = new Error('Authentication token required');
    error.status = 401;
    error.code = 'UNAUTHORIZED';
    return next(error);
  }

  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_peoplepay360_hackathon_2026';

  jwt.verify(token, secret, (err, decodedUser) => {
    if (err) {
      const error = new Error('Invalid or expired authentication token');
      error.status = 401;
      error.code = 'INVALID_TOKEN';
      return next(error);
    }

    // Attach verified user payload to request
    req.user = decodedUser;
    next();
  });
}

module.exports = authenticateToken;
