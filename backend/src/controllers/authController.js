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
        e.photo_url
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN employees e ON u.employee_id = e.id
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

    // Fetch user permissions via role_permissions
    // Schema reference: role_permissions junction table
    const permQuery = `
      SELECT p.code
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ?
    `;
    const [permRows] = await pool.query(permQuery, [user.role_id]);
    const permissions = permRows.map((row) => row.code);

    // Update last_login_at timestamp
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

    // Construct JWT Payload
    const tokenPayload = {
      id: user.id,
      role_id: user.role_id,
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
      role: user.role_name,
      first_name: user.first_name || null,
      last_name: user.last_name || null,
      photo_url: user.photo_url || null,
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
 * Creates a new user account with role assignment.
 * 
 * @param {import('express').Request} req - Express request with body: { email, password, role_id, employee_id, status }
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
 * @returns {Promise<void>} Created user details
 * @sideEffects Inserts new row into `users` table
 */
async function createUser(req, res, next) {
  try {
    const { email, password, role_id, employee_id, status } = req.body;

    if (!email || !password || !role_id) {
      return next(createValidationError('Email, password, and role_id are required fields'));
    }

    if (!isValidEmail(email)) {
      return next(createValidationError('Please provide a valid email address format', 'email'));
    }

    if (typeof password !== 'string' || password.length < 6) {
      return next(createValidationError('Password must be at least 6 characters long', 'password'));
    }

    // Check email uniqueness
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.trim()]);
    if (existing.length > 0) {
      const error = new Error(`User with email '${email}' already exists`);
      error.status = 409;
      error.code = 'DUPLICATE_EMAIL';
      return next(error);
    }

    // Check employee_id uniqueness if provided (see schema constraint: UNIQUE KEY on employee_id)
    if (employee_id) {
      const [existingEmp] = await pool.query('SELECT id FROM users WHERE employee_id = ?', [employee_id]);
      if (existingEmp.length > 0) {
        const error = new Error(`Employee ID ${employee_id} already has a linked user account`);
        error.status = 409;
        error.code = 'EMPLOYEE_USER_EXISTS';
        return next(error);
      }
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userStatus = status || 'active';

    const insertQuery = `
      INSERT INTO users (email, password_hash, role_id, employee_id, status)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertQuery, [
      email,
      passwordHash,
      role_id,
      employee_id || null,
      userStatus
    ]);

    res.status(201).json({
      message: 'User created successfully',
      data: {
        id: result.insertId,
        email,
        role_id,
        employee_id: employee_id || null,
        status: userStatus
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Lists users with pagination and joined role/employee names.
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
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
        r.name AS role_name,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN employees e ON u.employee_id = e.id
      ORDER BY u.id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(listQuery, [limit, offset]);

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
 * Returns list of available roles.
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
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
 * Returns current authenticated user profile and permissions.
 * 
 * @param {import('express').Request} req - Express request with req.user
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
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
        e.first_name,
        e.last_name,
        e.photo_url
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN employees e ON u.employee_id = e.id
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
    const [permRows] = await pool.query(
      `SELECT p.code FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.id WHERE rp.role_id = ?`,
      [user.role_id]
    );

    res.status(200).json({
      data: {
        id: user.id,
        employee_id: user.employee_id,
        email: user.email,
        role_id: user.role_id,
        role: user.role_name,
        first_name: user.first_name || null,
        last_name: user.last_name || null,
        photo_url: user.photo_url || null,
        status: user.status,
        permissions: permRows.map((p) => p.code)
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  createUser,
  listUsers,
  listRoles,
  getMe
};
