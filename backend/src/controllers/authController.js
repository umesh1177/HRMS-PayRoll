/**
 * Authentication & User Management Controller
 * 
 * RESPONSIBILITY:
 * Handles user login verification, JWT token issuance, user account creation,
 * role listings, and active user profile retrieval.
 * 
 * NOT RESPONSIBLE FOR:
 * Token header parsing (handled by middleware/auth.js) or RBAC route gating.
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { isValidEmail, createValidationError } = require('../utils/validators');

const SALT_ROUNDS = 10;
const JWT_EXPIRATION = '24h';

/**
 * Logs in a user, verifies credentials, and issues a JWT token.
 * 
 * @param {import('express').Request} req - Express request with body: { email, password }
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
 * @returns {Promise<void>} Returns token and safe user payload (excluding password_hash)
 * @sideEffects Updates `users.last_login_at` in the database
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(createValidationError('Email and password are required', 'email'));
    }

    if (!isValidEmail(email)) {
      return next(createValidationError('Please provide a valid email address format (e.g. user@company.com)', 'email'));
    }

    // Query user with joined role and optional employee profile
    // Schema reference: users -> roles, users -> employees
    const userQuery = `
      SELECT 
        u.id, 
        u.employee_id, 
        u.email, 
        u.password_hash, 
        u.role_id, 
        u.status,
        r.name AS role_name,
        e.first_name,
        e.last_name,
        e.photo_url,
        jp.title AS job_position_name,
        d.name AS department_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN employees e ON u.employee_id = e.id
      LEFT JOIN job_positions jp ON e.job_position_id = jp.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE u.email = ?
      LIMIT 1
    `;

    const [users] = await pool.query(userQuery, [email]);
    if (users.length === 0) {
      const error = new Error('Invalid email or password');
      error.status = 401;
      error.code = 'INVALID_CREDENTIALS';
      return next(error);
    }

    const user = users[0];

    if (user.status !== 'active') {
      const error = new Error('User account is disabled. Please contact an administrator.');
      error.status = 403;
      error.code = 'ACCOUNT_DISABLED';
      return next(error);
    }

    // Secure bcrypt comparison
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      const error = new Error('Invalid email or password');
      error.status = 401;
      error.code = 'INVALID_CREDENTIALS';
      return next(error);
    }

    // Fetch all user roles from user_roles and fallback to users.role_id
    const [userRoles] = await pool.query(
      `SELECT r.id, r.name 
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = ?
       ORDER BY r.id ASC`,
      [user.id]
    );

    let assignedRoles = userRoles;
    if (assignedRoles.length === 0) {
      assignedRoles = [{ id: user.role_id, name: user.role_name }];
    }

    const assignedRoleIds = assignedRoles.map((r) => r.id);
    const roleNamesString = assignedRoles.map((r) => r.name).join(', ');

    // Fetch user permissions aggregated across all assigned roles
    // Schema reference: role_permissions junction table
    const permQuery = `
      SELECT DISTINCT p.code
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id IN (?) OR rp.role_id = ?
    `;
    const [permRows] = await pool.query(permQuery, [assignedRoleIds, user.role_id]);
    const permissions = permRows.map((row) => row.code);

    // If any role is Admin, ensure system.admin is present
    if (assignedRoles.some((r) => r.name === 'Admin' || r.id === 1) && !permissions.includes('system.admin')) {
      permissions.push('system.admin');
    }

    // Update last_login_at timestamp
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

    // Construct JWT Payload
    const tokenPayload = {
      id: user.id,
      role_id: user.role_id,
      role_ids: assignedRoleIds,
      employee_id: user.employee_id,
      email: user.email
    };

    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_peoplepay360_hackathon_2026';
    const token = jwt.sign(tokenPayload, secret, { expiresIn: JWT_EXPIRATION });

    // Safe user profile (excluding password_hash)
    const userProfile = {
      id: user.id,
      employee_id: user.employee_id,
      email: user.email,
      role_id: user.role_id,
      role: roleNamesString || user.role_name,
      roles: assignedRoles,
      role_ids: assignedRoleIds,
      first_name: user.first_name || null,
      last_name: user.last_name || null,
      photo_url: user.photo_url || null,
      job_position_name: user.job_position_name || null,
      department_name: user.department_name || null,
      status: user.status,
      permissions
    };

    res.status(200).json({
      token,
      user: userProfile
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a new user account with single or multi-role assignment.
 * 
 * @param {import('express').Request} req - Express request with body: { email, password, role_id, role_ids, employee_id, status }
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
 */
async function createUser(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { email, password, role_id, role_ids, employee_id, status } = req.body;

    // Normalise role_ids to array of integers
    let assignedRoleIds = [];
    if (Array.isArray(role_ids) && role_ids.length > 0) {
      assignedRoleIds = role_ids.map(Number).filter((n) => !isNaN(n));
    } else if (role_id) {
      assignedRoleIds = [Number(role_id)];
    }

    if (!email || !password || assignedRoleIds.length === 0) {
      return next(createValidationError('Email, password, and at least one role are required fields'));
    }

    if (!isValidEmail(email)) {
      return next(createValidationError('Please provide a valid email address format', 'email'));
    }

    if (typeof password !== 'string' || password.length < 6) {
      return next(createValidationError('Password must be at least 6 characters long', 'password'));
    }

    // Check email uniqueness
    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email.trim()]);
    if (existing.length > 0) {
      const error = new Error(`User with email '${email}' already exists`);
      error.status = 409;
      error.code = 'DUPLICATE_EMAIL';
      return next(error);
    }

    // Check employee_id uniqueness if provided
    if (employee_id) {
      const [existingEmp] = await connection.query('SELECT id FROM users WHERE employee_id = ?', [employee_id]);
      if (existingEmp.length > 0) {
        const error = new Error(`Employee ID ${employee_id} already has a linked user account`);
        error.status = 409;
        error.code = 'EMPLOYEE_USER_EXISTS';
        return next(error);
      }
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userStatus = status || 'active';
    const primaryRoleId = assignedRoleIds[0];

    await connection.beginTransaction();

    const insertQuery = `
      INSERT INTO users (email, password_hash, role_id, employee_id, status)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await connection.query(insertQuery, [
      email.trim(),
      passwordHash,
      primaryRoleId,
      employee_id || null,
      userStatus
    ]);

    const newUserId = result.insertId;

    // Insert into user_roles junction table
    const roleValues = assignedRoleIds.map((rId) => [newUserId, rId]);
    await connection.query('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES ?', [roleValues]);

    await connection.commit();

    res.status(201).json({
      message: 'User created successfully',
      data: {
        id: newUserId,
        email: email.trim(),
        role_id: primaryRoleId,
        role_ids: assignedRoleIds,
        employee_id: employee_id || null,
        status: userStatus
      }
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

/**
 * Updates an existing user account, roles, employee link, or password.
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
 */
async function updateUser(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { email, password, role_id, role_ids, employee_id, status } = req.body;

    const [existing] = await connection.query('SELECT * FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      const error = new Error(`User with ID ${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    const current = existing[0];

    // Validate email format if changed
    if (email && email.trim() !== current.email) {
      if (!isValidEmail(email)) {
        return next(createValidationError('Please provide a valid email address format', 'email'));
      }
      const [emailCheck] = await connection.query('SELECT id FROM users WHERE email = ? AND id != ?', [email.trim(), id]);
      if (emailCheck.length > 0) {
        const error = new Error(`User with email '${email}' already exists`);
        error.status = 409;
        error.code = 'DUPLICATE_EMAIL';
        return next(error);
      }
    }

    // Check employee link uniqueness if changed
    if (employee_id && employee_id !== current.employee_id) {
      const [empCheck] = await connection.query('SELECT id FROM users WHERE employee_id = ? AND id != ?', [employee_id, id]);
      if (empCheck.length > 0) {
        const error = new Error(`Employee ID ${employee_id} already has a linked user account`);
        error.status = 409;
        error.code = 'EMPLOYEE_USER_EXISTS';
        return next(error);
      }
    }

    // Normalise role_ids
    let assignedRoleIds = null;
    if (Array.isArray(role_ids) && role_ids.length > 0) {
      assignedRoleIds = role_ids.map(Number).filter((n) => !isNaN(n));
    } else if (role_id) {
      assignedRoleIds = [Number(role_id)];
    }

    await connection.beginTransaction();

    let newPasswordHash = current.password_hash;
    if (password && typeof password === 'string' && password.trim().length >= 6) {
      newPasswordHash = await bcrypt.hash(password.trim(), SALT_ROUNDS);
    }

    const newPrimaryRoleId = assignedRoleIds && assignedRoleIds.length > 0 ? assignedRoleIds[0] : current.role_id;

    const updateQuery = `
      UPDATE users SET
        email = COALESCE(?, email),
        password_hash = ?,
        role_id = ?,
        employee_id = ?,
        status = COALESCE(?, status)
      WHERE id = ?
    `;

    await connection.query(updateQuery, [
      email ? email.trim() : current.email,
      newPasswordHash,
      newPrimaryRoleId,
      employee_id !== undefined ? (employee_id || null) : current.employee_id,
      status || current.status,
      id
    ]);

    // Update user_roles junction table if role_ids provided
    if (assignedRoleIds && assignedRoleIds.length > 0) {
      await connection.query('DELETE FROM user_roles WHERE user_id = ?', [id]);
      const roleValues = assignedRoleIds.map((rId) => [id, rId]);
      await connection.query('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES ?', [roleValues]);
    }

    await connection.commit();

    res.status(200).json({ message: 'User updated successfully' });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

/**
 * Deletes a user account from the database.
 */
async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    // Prevent deleting the currently authenticated user
    if (req.user && String(req.user.id) === String(id)) {
      const error = new Error('You cannot delete your own logged-in account');
      error.status = 400;
      error.code = 'CANNOT_DELETE_SELF';
      return next(error);
    }

    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      const error = new Error(`User with ID ${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * Lists users with pagination, linked employee details, and assigned multiple roles.
 */
async function listUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const countQuery = 'SELECT COUNT(*) as total FROM users';
    const [[{ total }]] = await pool.query(countQuery);

    const listQuery = `
      SELECT 
        u.id, 
        u.email, 
        u.employee_id, 
        u.role_id, 
        u.status, 
        u.last_login_at, 
        u.created_at,
        r.name AS primary_role_name,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.employee_code,
        (
          SELECT JSON_ARRAYAGG(JSON_OBJECT('id', r_sub.id, 'name', r_sub.name))
          FROM user_roles ur_sub
          JOIN roles r_sub ON ur_sub.role_id = r_sub.id
          WHERE ur_sub.user_id = u.id
        ) AS roles,
        (
          SELECT GROUP_CONCAT(r_sub.name SEPARATOR ', ')
          FROM user_roles ur_sub
          JOIN roles r_sub ON ur_sub.role_id = r_sub.id
          WHERE ur_sub.user_id = u.id
        ) AS role_names
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN employees e ON u.employee_id = e.id
      ORDER BY u.id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(listQuery, [limit, offset]);

    // Format rows to guarantee roles array
    const formatted = rows.map((user) => {
      let parsedRoles = [];
      try {
        if (typeof user.roles === 'string') {
          parsedRoles = JSON.parse(user.roles);
        } else if (Array.isArray(user.roles)) {
          parsedRoles = user.roles;
        }
      } catch (e) {
        parsedRoles = [];
      }

      if (parsedRoles.length === 0 && user.primary_role_name) {
        parsedRoles = [{ id: user.role_id, name: user.primary_role_name }];
      }

      return {
        ...user,
        roles: parsedRoles,
        role_ids: parsedRoles.map((r) => r.id),
        role_name: user.role_names || user.primary_role_name
      };
    });

    res.status(200).json({
      data: formatted,
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
 * Returns list of available roles.
 */
async function listRoles(req, res, next) {
  try {
    const [roles] = await pool.query('SELECT id, name, description FROM roles ORDER BY id ASC');
    res.status(200).json({ data: roles });
  } catch (err) {
    next(err);
  }
}

/**
 * Returns current authenticated user profile, roles, and permissions.
 */
/**
 * Returns current authenticated user profile, roles, and permissions with full employee details.
 */
async function getMe(req, res, next) {
  try {
    const userId = req.user.id;
    const query = `
      SELECT 
        u.id, 
        u.employee_id, 
        u.email, 
        u.role_id, 
        u.status,
        r.name AS role_name,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.phone,
        e.photo_url,
        e.date_joined,
        d.name AS department_name,
        jp.title AS job_position_name,
        CONCAT(m.first_name, ' ', m.last_name) AS manager_name,
        ws.name AS working_schedule_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN employees e ON u.employee_id = e.id OR u.email = e.email
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN job_positions jp ON e.job_position_id = jp.id
      LEFT JOIN employees m ON e.manager_id = m.id
      LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
      WHERE u.id = ?
      LIMIT 1
    `;
    const [users] = await pool.query(query, [userId]);
    if (users.length === 0) {
      const error = new Error('User not found');
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    const user = users[0];

    // Fetch all roles
    const [userRoles] = await pool.query(
      `SELECT r.id, r.name 
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = ?
       ORDER BY r.id ASC`,
      [userId]
    );

    let assignedRoles = userRoles;
    if (assignedRoles.length === 0) {
      assignedRoles = [{ id: user.role_id, name: user.role_name }];
    }

    const assignedRoleIds = assignedRoles.map((r) => r.id);

    // Fetch aggregate permissions
    const [permRows] = await pool.query(
      `SELECT DISTINCT p.code
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id IN (?) OR rp.role_id = ?`,
      [assignedRoleIds, user.role_id]
    );

    const permissions = permRows.map((p) => p.code);
    if (assignedRoles.some((r) => r.name === 'Admin' || r.id === 1) && !permissions.includes('system.admin')) {
      permissions.push('system.admin');
    }

    let firstName = user.first_name;
    let lastName = user.last_name;
    let employeeCode = user.employee_code;
    let departmentName = user.department_name;
    let jobPositionName = user.job_position_name;
    let managerName = user.manager_name;
    let workingScheduleName = user.working_schedule_name;
    let dateJoined = user.date_joined;

    const isAdmin = assignedRoles.some((r) => r.name === 'Admin' || r.id === 1);

    if (!firstName && !lastName) {
      if (isAdmin) {
        firstName = 'System';
        lastName = 'Administrator';
        employeeCode = employeeCode || 'ADM-001';
        departmentName = departmentName || 'Executive & Board';
        jobPositionName = jobPositionName || 'System Administrator';
        managerName = managerName || 'Executive Board';
        workingScheduleName = workingScheduleName || 'Standard Full-Time (40h)';
      } else {
        const parts = (user.email || '').split('@')[0].split('.');
        firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'User';
        lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : '';
        employeeCode = employeeCode || `EMP-${String(user.id).padStart(3, '0')}`;
        departmentName = departmentName || 'General Operations';
        jobPositionName = jobPositionName || (assignedRoles[0]?.name || 'Staff');
        workingScheduleName = workingScheduleName || 'Standard 40 Hours';
      }
    }

    res.status(200).json({
      data: {
        id: user.id,
        employee_id: user.employee_id || null,
        employee_code: employeeCode,
        email: user.email,
        role_id: user.role_id,
        role: assignedRoles.map((r) => r.name).join(', '),
        roles: assignedRoles,
        role_ids: assignedRoleIds,
        first_name: firstName,
        last_name: lastName,
        phone: user.phone || null,
        photo_url: user.photo_url || null,
        department_name: departmentName || 'General Operations',
        job_position_name: jobPositionName || (assignedRoles[0]?.name || 'Staff'),
        manager_name: managerName || 'Executive Management',
        working_schedule_name: workingScheduleName || 'Standard Full-Time (40h)',
        date_joined: dateJoined || null,
        status: user.status,
        permissions
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Self-service profile update for authenticated user.
 * Allows updating non-critical/personal fields: first_name, last_name, phone, photo_url,
 * and changing password if requested.
 */
async function updateMyProfile(req, res, next) {
  const connection = await pool.getConnection();
  let transactionStarted = false;
  try {
    const userId = req.user.id;
    const { first_name, last_name, phone, photo_url, current_password, new_password } = req.body;

    // Fetch existing user and password
    const [users] = await connection.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      const error = new Error('User not found');
      error.status = 404;
      return next(error);
    }
    const user = users[0];

    // Find linked employee ID (if any)
    let employeeId = user.employee_id;
    if (!employeeId) {
      // The schema links users through users.employee_id; email is the legacy fallback.
      const [emp] = await connection.query('SELECT id FROM employees WHERE email = ? LIMIT 1', [user.email]);
      if (emp.length > 0) {
        employeeId = emp[0].id;
      }
    }

    await connection.beginTransaction();
    transactionStarted = true;

    // 1. If employee record does not exist yet, create one so user profile persists
    if (!employeeId) {
      const isAdm = req.user.role_id === 1;
      const empCode = isAdm ? `ADM-${String(userId).padStart(3, '0')}` : `EMP-${String(userId).padStart(3, '0')}`;
      const [insertResult] = await connection.query(
        `INSERT INTO employees (employee_code, first_name, last_name, email, phone, photo_url, status, date_joined)
         VALUES (?, ?, ?, ?, ?, ?, 'active', CURDATE())`,
        [
          empCode,
          first_name ? first_name.trim() : (isAdm ? 'System' : 'User'),
          last_name ? last_name.trim() : (isAdm ? 'Admin' : ''),
          user.email,
          phone ? phone.trim() : null,
          photo_url ? photo_url.trim() : null
        ]
      );
      employeeId = insertResult.insertId;
      await connection.query('UPDATE users SET employee_id = ? WHERE id = ?', [employeeId, userId]);
    } else {
      const updateEmpFields = [];
      const empParams = [];

      if (first_name !== undefined) {
        updateEmpFields.push('first_name = ?');
        empParams.push(first_name.trim());
      }
      if (last_name !== undefined) {
        updateEmpFields.push('last_name = ?');
        empParams.push(last_name.trim());
      }
      if (phone !== undefined) {
        updateEmpFields.push('phone = ?');
        empParams.push(phone ? phone.trim() : null);
      }
      if (photo_url !== undefined) {
        updateEmpFields.push('photo_url = ?');
        empParams.push(photo_url ? photo_url.trim() : null);
      }

      if (updateEmpFields.length > 0) {
        empParams.push(employeeId);
        await connection.query(`UPDATE employees SET ${updateEmpFields.join(', ')} WHERE id = ?`, empParams);
      }
    }

    // 2. If password change is requested
    if (new_password) {
      if (typeof new_password !== 'string' || new_password.length < 6) {
        await connection.rollback();
        return next(createValidationError('New password must be at least 6 characters long', 'new_password'));
      }

      if (current_password) {
        const match = await bcrypt.compare(current_password, user.password_hash);
        if (!match) {
          await connection.rollback();
          const error = new Error('Current password is incorrect');
          error.status = 400;
          error.code = 'INVALID_PASSWORD';
          return next(error);
        }
      }

      const newHash = await bcrypt.hash(new_password, SALT_ROUNDS);
      await connection.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
    }

    await connection.commit();

    // Fetch updated user profile
    const query = `
      SELECT 
        u.id, 
        u.employee_id, 
        u.email, 
        u.role_id, 
        u.status,
        r.name AS role_name,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.phone,
        e.photo_url,
        e.date_joined,
        d.name AS department_name,
        jp.title AS job_position_name,
        CONCAT(m.first_name, ' ', m.last_name) AS manager_name,
        ws.name AS working_schedule_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN employees e ON u.employee_id = e.id OR u.email = e.email
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN job_positions jp ON e.job_position_id = jp.id
      LEFT JOIN employees m ON e.manager_id = m.id
      LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
      WHERE u.id = ?
      LIMIT 1
    `;
    const [updatedUsers] = await pool.query(query, [userId]);
    const updatedUser = updatedUsers[0];

    // Fetch all roles
    const [userRoles] = await pool.query(
      `SELECT r.id, r.name 
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = ?
       ORDER BY r.id ASC`,
      [userId]
    );
    let assignedRoles = userRoles.length > 0 ? userRoles : [{ id: updatedUser.role_id, name: updatedUser.role_name }];

    res.status(200).json({
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        employee_id: updatedUser.employee_id,
        employee_code: updatedUser.employee_code,
        email: updatedUser.email,
        role_id: updatedUser.role_id,
        role: assignedRoles.map((r) => r.name).join(', '),
        roles: assignedRoles,
        first_name: updatedUser.first_name || null,
        last_name: updatedUser.last_name || null,
        phone: updatedUser.phone || null,
        photo_url: updatedUser.photo_url || null,
        department_name: updatedUser.department_name || null,
        job_position_name: updatedUser.job_position_name || null,
        manager_name: updatedUser.manager_name || null,
        working_schedule_name: updatedUser.working_schedule_name || null,
        date_joined: updatedUser.date_joined || null,
        status: updatedUser.status
      }
    });
  } catch (err) {
    if (transactionStarted) await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

/**
 * Stores a validated profile image and returns its browser-accessible URL.
 * The multipart middleware owns file validation; this function only persists the path.
 */
async function uploadProfilePhoto(req, res, next) {
  try {
    if (!req.file) {
      const error = new Error('Choose an image file before uploading.');
      error.status = 400;
      error.code = 'PHOTO_REQUIRED';
      return next(error);
    }

    const [users] = await pool.query('SELECT id, employee_id, email FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      const error = new Error('User account was not found.');
      error.status = 404;
      return next(error);
    }

    let employeeId = users[0].employee_id;
    if (!employeeId) {
      const [employees] = await pool.query(
        'SELECT id FROM employees WHERE email = ? LIMIT 1',
        [users[0].email]
      );
      employeeId = employees[0]?.id;
    }

    if (!employeeId) {
      const error = new Error('Create your personal profile before uploading a photo.');
      error.status = 400;
      error.code = 'PROFILE_REQUIRED';
      return next(error);
    }

    const photoUrl = `${req.protocol}://${req.get('host')}/uploads/profiles/${req.file.filename}`;
    await pool.query('UPDATE employees SET photo_url = ? WHERE id = ?', [photoUrl, employeeId]);

    res.status(200).json({
      message: 'Profile photo uploaded successfully',
      data: { photo_url: photoUrl }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  createUser,
  updateUser,
  deleteUser,
  listUsers,
  listRoles,
  getMe,
  updateMyProfile,
  uploadProfilePhoto
};
