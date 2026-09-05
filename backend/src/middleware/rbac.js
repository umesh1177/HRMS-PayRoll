/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * RESPONSIBILITY:
 * Dynamically verifies whether the authenticated user (or any of their assigned multiple roles)
 * has been granted the required permission code by querying the database `role_permissions`
 * and `user_roles` tables.
 * 
 * NOT RESPONSIBLE FOR:
 * Validating the authenticity of the JWT token itself (delegated to middleware/auth.js).
 */

const pool = require('../config/db');

/**
 * Higher-order middleware factory enforcing data-driven RBAC across single and multi-role assignments.
 * 
 * @param {string} permissionCode - Unique permission code from `permissions.code` (e.g. 'employee.manage')
 * @returns {import('express').RequestHandler} Express middleware function
 */
function requirePermission(permissionCode) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        const error = new Error('Authentication required before authorization check');
        error.status = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const userId = req.user.id;
      const roleId = req.user.role_id;

      // Query database to check if ANY assigned role of this user is mapped to permissionCode or system.admin
      // Checks both user_roles multi-role table and legacy role_id on users table
      const query = `
        SELECT p.code
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        LEFT JOIN user_roles ur ON rp.role_id = ur.role_id AND ur.user_id = ?
        WHERE (ur.user_id = ? OR rp.role_id = ?) 
          AND (p.code = ? OR p.code = 'system.admin')
        LIMIT 1
      `;

      const [rows] = await pool.query(query, [userId, userId, roleId || 0, permissionCode]);

      if (rows.length === 0) {
        const error = new Error(`Forbidden: You do not have permission '${permissionCode}'`);
        error.status = 403;
        error.code = 'FORBIDDEN';
        return next(error);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  requirePermission
};
