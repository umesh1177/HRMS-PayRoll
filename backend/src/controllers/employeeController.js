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

    // Main directory query with joined organizational relations and user role info
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
        e.updated_at,
        u.id AS user_id,
        u.role_id,
        r.name AS primary_role_name,
        (
          SELECT JSON_ARRAYAGG(JSON_OBJECT('id', ro.id, 'name', ro.name))
          FROM user_roles ur
          JOIN roles ro ON ur.role_id = ro.id
          WHERE ur.user_id = u.id
        ) AS roles
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN job_positions jp ON e.job_position_id = jp.id
      LEFT JOIN employees m ON e.manager_id = m.id
      LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
      LEFT JOIN users u ON u.employee_id = e.id
      LEFT JOIN roles r ON u.role_id = r.id
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
 * Gets detailed profile for a single employee by ID with user roles.
 */
async function getEmployeeById(req, res, next) {
  try {
    const { id } = req.params;

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
        e.updated_at,
        u.id AS user_id,
        u.role_id,
        (
          SELECT JSON_ARRAYAGG(JSON_OBJECT('id', ro.id, 'name', ro.name))
          FROM user_roles ur
          JOIN roles ro ON ur.role_id = ro.id
          WHERE ur.user_id = u.id
        ) AS roles
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN job_positions jp ON e.job_position_id = jp.id
      LEFT JOIN employees m ON e.manager_id = m.id
      LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
      LEFT JOIN users u ON u.employee_id = e.id
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
 * Creates a new employee profile with optional linked user account, role assignment, and credential email.
 */
async function createEmployee(req, res, next) {
  const connection = await pool.getConnection();
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
      photo_url,
      create_user = true,
      role_ids = [],
      role_id,
      password
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

    await connection.beginTransaction();

    const insertEmployeeSql = `
      INSERT INTO employees (
        employee_code, first_name, last_name, email, phone,
        department_id, job_position_id, manager_id, working_schedule_id,
        status, date_joined, date_left, photo_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [empResult] = await connection.query(insertEmployeeSql, [
      employee_code.trim(),
      first_name.trim(),
      last_name.trim(),
      email.trim(),
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

    const newEmployeeId = empResult.insertId;

    let assignedRoleIds = [];
    if (Array.isArray(role_ids) && role_ids.length > 0) {
      assignedRoleIds = role_ids.map((r) => Number(r)).filter((r) => !isNaN(r) && r > 0);
    } else if (role_id) {
      assignedRoleIds = [Number(role_id)];
    }

    if (assignedRoleIds.length === 0) {
      const [empRole] = await connection.query("SELECT id FROM roles WHERE name = 'Employee' LIMIT 1");
      if (empRole.length > 0) {
        assignedRoleIds = [empRole[0].id];
      } else {
        const [anyRole] = await connection.query('SELECT id FROM roles ORDER BY id ASC LIMIT 1');
        if (anyRole.length > 0) assignedRoleIds = [anyRole[0].id];
      }
    }

    const rawPassword = password && password.trim() ? password.trim() : `${first_name.trim()}@123`;
    const primaryRoleId = assignedRoleIds[0];
    let createdUserId = null;

    if (create_user !== false) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(rawPassword, salt);

      const [userResult] = await connection.query(
        `INSERT INTO users (employee_id, email, password_hash, role_id, status)
         VALUES (?, ?, ?, ?, 'active')`,
        [newEmployeeId, email.trim(), passwordHash, primaryRoleId]
      );
      createdUserId = userResult.insertId;

      for (const rId of assignedRoleIds) {
        await connection.query(
          `INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`,
          [createdUserId, rId]
        );
      }
    }

    await connection.commit();

    let roleNames = ['Employee'];
    try {
      if (assignedRoleIds.length > 0) {
        const [rolesData] = await pool.query(
          `SELECT name FROM roles WHERE id IN (?)`,
          [assignedRoleIds]
        );
        if (rolesData.length > 0) {
          roleNames = rolesData.map((r) => r.name);
        }
      }
    } catch { }

    sendWelcomeCredentialsEmail({
      to: email.trim(),
      name: `${first_name.trim()} ${last_name.trim()}`,
      email: email.trim(),
      password: rawPassword,
      roleNames
    }).catch((emailErr) => {
      console.warn('Failed to deliver welcome credentials email:', emailErr);
    });

    res.status(201).json({
      message: 'Employee created and welcome credentials email dispatched successfully',
      data: {
        id: newEmployeeId,
        employee_code,
        first_name,
        last_name,
        email,
        status: status || 'active',
        user_id: createdUserId,
        role_ids: assignedRoleIds,
        role_names: roleNames
      }
    });
  } catch (err) {
    await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      const error = new Error(`Employee with code '${req.body.employee_code}' or email '${req.body.email}' already exists.`);
      error.status = 409;
      error.code = 'DUPLICATE_ENTRY';
      return next(error);
    }
    next(err);
  } finally {
    connection.release();
  }
}

/**
 * Updates an employee profile and synchronizes linked user roles.
 */
async function updateEmployee(req, res, next) {
  const connection = await pool.getConnection();
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
      photo_url,
      role_ids,
      role_id,
      password
    } = req.body;

    const [existing] = await connection.query('SELECT id, email FROM employees WHERE id = ?', [id]);
    if (existing.length === 0) {
      const error = new Error(`Employee with ID ${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    await connection.beginTransaction();

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

    await connection.query(updateSql, [
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

    let assignedRoleIds = null;
    if (Array.isArray(role_ids)) {
      assignedRoleIds = role_ids.map((r) => Number(r)).filter((r) => !isNaN(r) && r > 0);
    } else if (role_id) {
      assignedRoleIds = [Number(role_id)];
    }

    const [userRows] = await connection.query('SELECT id FROM users WHERE employee_id = ?', [id]);
    if (userRows.length > 0) {
      const userId = userRows[0].id;
      
      if (email) {
        await connection.query('UPDATE users SET email = ? WHERE id = ?', [email.trim(), userId]);
      }

      if (password && password.trim()) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password.trim(), salt);
        await connection.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
      }

      if (assignedRoleIds && assignedRoleIds.length > 0) {
        await connection.query('UPDATE users SET role_id = ? WHERE id = ?', [assignedRoleIds[0], userId]);
        await connection.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
        for (const rId of assignedRoleIds) {
          await connection.query('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, rId]);
        }
      }
    }

    await connection.commit();
    res.status(200).json({ message: 'Employee and user account updated successfully' });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
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
