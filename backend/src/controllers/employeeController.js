/**
 * Employee Profile and Directory Controller
 * 
 * RESPONSIBILITY:
 * Handles HR employee management: directory listings, profile lookups with joined
 * organizational relationships (department, position, manager, schedule), creation,
 * updating, and deactivation.
 * 
 * NOT RESPONSIBLE FOR:
 * Issuing JWT credentials (handled by authController.js) or computing payslips (handled by payrollEngine.js).
 */

const pool = require('../config/db');
const {
  isValidEmail,
  isValidPhone,
  isValidDate,
  isValidDateRange,
  isValidEnum,
  createValidationError
} = require('../utils/validators');

/**
 * Lists employees with search, department filtering, status filtering, and pagination.
 * Automatically restricts results to own profile if user only has 'employee.view_own'.
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
 */
async function listEmployees(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const { department_id, status, search } = req.query;

    let whereConditions = [];
    let queryParams = [];

    // Check if user has permission to view all or only their own record
    // Schema reference: permissions 'employee.view_all' vs 'employee.view_own'
    const userRole = req.user.role_id;
    const [permRows] = await pool.query(
      `SELECT p.code FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.id WHERE rp.role_id = ? AND (p.code = 'employee.view_all' OR p.code = 'system.admin')`,
      [userRole]
    );
    const canViewAll = permRows.length > 0;

    if (!canViewAll) {
      if (!req.user.employee_id) {
        return res.status(200).json({ data: [], pagination: { total: 0, page, limit, totalPages: 0 } });
      }
      whereConditions.push('e.id = ?');
      queryParams.push(req.user.employee_id);
    }

    if (department_id) {
      whereConditions.push('e.department_id = ?');
      queryParams.push(department_id);
    }

    if (status) {
      whereConditions.push('e.status = ?');
      queryParams.push(status);
    }

    if (search) {
      whereConditions.push('(e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_code LIKE ? OR e.email LIKE ?)');
      const s = `%${search}%`;
      queryParams.push(s, s, s, s);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countSql = `SELECT COUNT(*) as total FROM employees e ${whereClause}`;
    const [[{ total }]] = await pool.query(countSql, queryParams);

    // Main directory query with joined organizational relations
    // Schema reference: employees -> departments, job_positions, working_schedules, self manager
    const listSql = `
      SELECT 
        e.id,
        e.employee_code,
        e.first_name,
        e.last_name,
        CONCAT(e.first_name, ' ', e.last_name) AS name,
        e.email,
        e.phone,
        e.department_id,
        d.name AS department_name,
        e.job_position_id,
        jp.title AS job_title,
        e.manager_id,
        CONCAT(m.first_name, ' ', m.last_name) AS manager_name,
        e.working_schedule_id,
        ws.name AS working_schedule_name,
        e.status,
        e.date_joined,
        e.date_left,
        e.photo_url,
        e.created_at,
        e.updated_at
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN job_positions jp ON e.job_position_id = jp.id
      LEFT JOIN employees m ON e.manager_id = m.id
      LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
      ${whereClause}
      ORDER BY e.id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(listSql, [...queryParams, limit, offset]);

    res.status(200).json({
      data: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Gets detailed profile for a single employee by ID.
 */
async function getEmployeeById(req, res, next) {
  try {
    const { id } = req.params;

    const [permissionRows] = await pool.query(
      `SELECT p.code FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = ? AND p.code IN ('employee.view_all', 'system.admin')
       LIMIT 1`,
      [req.user.role_id]
    );
    if (permissionRows.length === 0 && Number(id) !== Number(req.user.employee_id)) {
      const error = new Error('You can only view your own employee profile');
      error.status = 403;
      error.code = 'FORBIDDEN';
      return next(error);
    }

    const query = `
      SELECT 
        e.id,
        e.employee_code,
        e.first_name,
        e.last_name,
        CONCAT(e.first_name, ' ', e.last_name) AS name,
        e.email,
        e.phone,
        e.department_id,
        d.name AS department_name,
        e.job_position_id,
        jp.title AS job_title,
        e.manager_id,
        CONCAT(m.first_name, ' ', m.last_name) AS manager_name,
        e.working_schedule_id,
        ws.name AS working_schedule_name,
        e.status,
        e.date_joined,
        e.date_left,
        e.photo_url,
        e.created_at,
        e.updated_at
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN job_positions jp ON e.job_position_id = jp.id
      LEFT JOIN employees m ON e.manager_id = m.id
      LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
      WHERE e.id = ?
      LIMIT 1
    `;

    const [rows] = await pool.query(query, [id]);
    if (rows.length === 0) {
      const error = new Error(`Employee with ID ${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    res.status(200).json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a new employee profile.
 */
async function createEmployee(req, res, next) {
  try {
    const {
      employee_code,
      first_name,
      last_name,
      email,
      phone,
      department_id,
      job_position_id,
      manager_id,
      working_schedule_id,
      status,
      date_joined,
      date_left,
      photo_url
    } = req.body;

    if (!employee_code || !first_name || !last_name || !email || !date_joined) {
      return next(createValidationError('employee_code, first_name, last_name, email, and date_joined are required'));
    }

    if (first_name.trim().length < 2) {
      return next(createValidationError('First name must contain at least 2 characters', 'first_name'));
    }

    if (last_name.trim().length < 2) {
      return next(createValidationError('Last name must contain at least 2 characters', 'last_name'));
    }

    if (!isValidEmail(email)) {
      return next(createValidationError('Please provide a valid work email address format', 'email'));
    }

    if (phone && !isValidPhone(phone)) {
      return next(createValidationError('Please provide a valid phone number (7-20 digits)', 'phone'));
    }

    if (!isValidDate(date_joined)) {
      return next(createValidationError('Invalid date_joined format', 'date_joined'));
    }

    if (date_left && (!isValidDate(date_left) || !isValidDateRange(date_joined, date_left))) {
      return next(createValidationError('date_left must be a valid date on or after date_joined', 'date_left'));
    }

    if (status && !isValidEnum(status, ['active', 'inactive', 'terminated', 'suspended'])) {
      return next(createValidationError('Invalid status. Allowed: active, inactive, terminated, suspended', 'status'));
    }

    const insertSql = `
      INSERT INTO employees (
        employee_code, first_name, last_name, email, phone,
        department_id, job_position_id, manager_id, working_schedule_id,
        status, date_joined, date_left, photo_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertSql, [
      employee_code,
      first_name,
      last_name,
      email,
      phone || null,
      department_id || null,
      job_position_id || null,
      manager_id || null,
      working_schedule_id || null,
      status || 'active',
      date_joined,
      date_left || null,
      photo_url || null
    ]);

    res.status(201).json({
      message: 'Employee created successfully',
      data: {
        id: result.insertId,
        employee_code,
        first_name,
        last_name,
        email,
        status: status || 'active'
      }
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const error = new Error(`Employee with code '${req.body.employee_code}' or email '${req.body.email}' already exists`);
      error.status = 409;
      error.code = 'DUPLICATE_ENTRY';
      return next(error);
    }
    next(err);
  }
}

/**
 * Updates an employee profile.
 */
async function updateEmployee(req, res, next) {
  try {
    const { id } = req.params;
    const {
      employee_code,
      first_name,
      last_name,
      email,
      phone,
      department_id,
      job_position_id,
      manager_id,
      working_schedule_id,
      status,
      date_joined,
      date_left,
      photo_url
    } = req.body;

    const [existing] = await pool.query('SELECT id FROM employees WHERE id = ?', [id]);
    if (existing.length === 0) {
      const error = new Error(`Employee with ID ${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    const [permissionRows] = await pool.query(
      `SELECT p.code FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = ? AND (p.code = 'employee.manage' OR p.code = 'system.admin')`,
      [req.user.role_id]
    );
    const canManageAll = permissionRows.length > 0;
    if (!canManageAll) {
      if (Number(id) !== Number(req.user.employee_id)) {
        const error = new Error('You can only update your own employee profile');
        error.status = 403;
        error.code = 'FORBIDDEN';
        return next(error);
      }
      const restrictedFields = [employee_code, first_name, last_name, email, department_id, job_position_id, manager_id, working_schedule_id, status, date_joined, date_left]
        .some((value) => value !== undefined);
      if (restrictedFields) {
        const error = new Error('Only phone and photo_url can be updated from your own profile');
        error.status = 403;
        error.code = 'FORBIDDEN';
        return next(error);
      }
    }

    const updateSql = `
      UPDATE employees SET
        employee_code = COALESCE(?, employee_code),
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        department_id = COALESCE(?, department_id),
        job_position_id = COALESCE(?, job_position_id),
        manager_id = COALESCE(?, manager_id),
        working_schedule_id = COALESCE(?, working_schedule_id),
        status = COALESCE(?, status),
        date_joined = COALESCE(?, date_joined),
        date_left = COALESCE(?, date_left),
        photo_url = COALESCE(?, photo_url)
      WHERE id = ?
    `;

    await pool.query(updateSql, [
      employee_code,
      first_name,
      last_name,
      email,
      phone,
      department_id,
      job_position_id,
      manager_id,
      working_schedule_id,
      status,
      date_joined,
      date_left,
      photo_url,
      id
    ]);

    res.status(200).json({ message: 'Employee updated successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * Completely removes an employee and all associated records from the database.
 */
async function deleteEmployee(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    
    // Check if employee exists
    const [existing] = await connection.query('SELECT id, first_name, last_name FROM employees WHERE id = ?', [id]);
    if (existing.length === 0) {
      const error = new Error(`Employee with ID ${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    await connection.beginTransaction();

    // 1. Unlink manager references from other employees and departments
    await connection.query('UPDATE employees SET manager_id = NULL WHERE manager_id = ?', [id]);
    await connection.query('UPDATE departments SET manager_id = NULL WHERE manager_id = ?', [id]);

    // 2. Delete payslip lines for the employee's payslips
    await connection.query(
      `DELETE pl FROM payslip_lines pl 
       JOIN payslips p ON pl.payslip_id = p.id 
       WHERE p.employee_id = ?`,
      [id]
    );

    // 3. Delete payslips
    await connection.query('DELETE FROM payslips WHERE employee_id = ?', [id]);

    // 4. Delete payrun_employees
    await connection.query('DELETE FROM payrun_employees WHERE employee_id = ?', [id]);

    // 5. Delete contracts
    await connection.query('DELETE FROM contracts WHERE employee_id = ?', [id]);

    // 6. Delete time off requests
    await connection.query('DELETE FROM time_off_requests WHERE employee_id = ?', [id]);

    // 7. Delete time off allocations
    await connection.query('DELETE FROM time_off_allocations WHERE employee_id = ?', [id]);

    // 8. Delete attendances
    await connection.query('DELETE FROM attendances WHERE employee_id = ?', [id]);

    // 9. Delete user account linked to this employee
    await connection.query('DELETE FROM users WHERE employee_id = ?', [id]);

    // 10. Delete the employee record itself
    await connection.query('DELETE FROM employees WHERE id = ?', [id]);

    await connection.commit();
    res.status(200).json({ message: 'Employee and all associated records permanently deleted from database' });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

module.exports = {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
