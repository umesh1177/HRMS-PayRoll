const pool = require('../config/db');

async function getDataScope(user) {
  const roleIds = Array.isArray(user?.role_ids) && user.role_ids.length > 0
    ? user.role_ids
    : [user?.role_id || 0];

  const [adminRows] = await pool.query(
    `SELECT 1
     FROM role_permissions rp
     JOIN permissions p ON p.id = rp.permission_id
     WHERE rp.role_id IN (?) AND p.code = 'system.admin'
     LIMIT 1`,
    [roleIds]
  );

  if (adminRows.length > 0) {
    return { isAdmin: true, departmentId: null };
  }

  if (!user?.employee_id && !user?.email) {
    return { isAdmin: false, departmentId: null };
  }

  const [[employee]] = await pool.query(
    'SELECT department_id FROM employees WHERE id = ? OR email = ? LIMIT 1',
    [user.employee_id || 0, user.email || '']
  );

  return {
    isAdmin: false,
    departmentId: employee?.department_id || null
  };
}

module.exports = { getDataScope };