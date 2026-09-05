/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * RESPONSIBILITY:
 * Dynamically verifies whether the authenticated user's role has been granted
 * the required permission code by querying the database `role_permissions` junction.
 * 
 * NOT RESPONSIBLE FOR:
 * Validating the authenticity of the JWT token itself (delegated to middleware/auth.js).
 */

const pool = require('../config/db');

/**
 * Higher-order middleware factory enforcing data-driven RBAC.
 * 
 * WHY DATA-DRIVEN RBAC (DB Lookup vs Hardcoded Role Strings):
 * As documented in section 1b of schema.sql, hardcoding role checks like `if (role === 'HR Manager')`
 * creates tight coupling, prevents dynamic policy changes, and breaks modularity.
 * By querying the `role_permissions` and `permissions` tables, permissions can be reconfigured
 * in the database at runtime without requiring code deployments.
 * 
 * @param {string} permissionCode - Unique permission code from `permissions.code` (e.g. 'employee.manage')
 * @returns {import('express').RequestHandler} Express middleware function
 */
function requirePermission(permissionCode) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.role_id) {
        const error = new Error('Authentication required before authorization check');
        error.status = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const roleId = req.user.role_id;

      // Query database to check if role_id is mapped to permissionCode or system.admin
      // Schema reference: role_permissions (role_id, permission_id) -> permissions (id, code)
      const query = `
        SELECT p.code
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ? AND (p.code = ? OR p.code = 'system.admin')
        LIMIT 1
      `;

      const [rows] = await pool.query(query, [roleId, permissionCode]);

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
