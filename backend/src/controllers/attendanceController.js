/**
 * Attendance Tracking & Correction Controller
 * 
 * RESPONSIBILITY:
 * Handles employee self-service check-in/check-out punch clocking, attendance history queries
 * (scoped by RBAC view_own vs manage_all), and HR manual corrections.
 * 
 * NOT RESPONSIBLE FOR:
 * Direct salary payslip generation (handled by payrollEngine.js).
 */

const pool = require('../config/db');
const { calculateWorkedHours, evaluateAttendanceStatus } = require('../services/attendanceService');
const {
  isValidDate,
  isValidDateRange,
  isValidEnum,
  createValidationError
} = require('../utils/validators');

/**
 * Self-service Check-In for the authenticated employee.
 * Resolves employee_id from req.user.
 * 
 * @param {import('express').Request} req - Express request with req.user
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
 * @sideEffects Inserts new row into `attendances` table
 */
async function checkIn(req, res, next) {
  try {
    const employeeId = req.user.employee_id;
    if (!employeeId) {
      const error = new Error('No employee profile linked to current user account');
      error.status = 400;
      error.code = 'NO_LINKED_EMPLOYEE';
      return next(error);
    }

    // Check if employee already has an active (open) punch
    const [openPunch] = await pool.query(
      'SELECT id, check_in FROM attendances WHERE employee_id = ? AND check_out IS NULL ORDER BY id DESC LIMIT 1',
      [employeeId]
    );

    if (openPunch.length > 0) {
      const error = new Error('You already have an active check-in session');
      error.status = 409;
      error.code = 'ALREADY_CHECKED_IN';
      return next(error);
    }

    const now = new Date();
    const status = evaluateAttendanceStatus(0, now);

    const [result] = await pool.query(
      'INSERT INTO attendances (employee_id, check_in, status) VALUES (?, NOW(), ?)',
      [employeeId, status]
    );

    res.status(201).json({
      message: 'Checked in successfully',
      data: {
        id: result.insertId,
        employee_id: employeeId,
        check_in: now.toISOString(),
        status
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Self-service Check-Out for the authenticated employee.
 * Closes the active open punch session and calculates worked hours.
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
 * @sideEffects Updates active `attendances` row with check_out and worked_hours
 */
async function checkOut(req, res, next) {
  try {
    const employeeId = req.user.employee_id;
    if (!employeeId) {
      const error = new Error('No employee profile linked to current user account');
      error.status = 400;
      error.code = 'NO_LINKED_EMPLOYEE';
      return next(error);
    }

    const [openPunch] = await pool.query(
      'SELECT id, check_in FROM attendances WHERE employee_id = ? AND check_out IS NULL ORDER BY id DESC LIMIT 1',
      [employeeId]
    );

    if (openPunch.length === 0) {
      const error = new Error('No active check-in session found to check out from');
      error.status = 404;
      error.code = 'NO_ACTIVE_SESSION';
      return next(error);
    }

    const attendanceId = openPunch[0].id;
    const checkInTime = openPunch[0].check_in;
    const checkOutTime = new Date();

    const workedHours = calculateWorkedHours(checkInTime, checkOutTime);
    const finalStatus = evaluateAttendanceStatus(workedHours, checkInTime);

    await pool.query(
      'UPDATE attendances SET check_out = NOW(), worked_hours = ?, status = ? WHERE id = ?',
      [workedHours, finalStatus, attendanceId]
    );

    res.status(200).json({
      message: 'Checked out successfully',
      data: {
        id: attendanceId,
        employee_id: employeeId,
        check_in: checkInTime,
        check_out: checkOutTime.toISOString(),
        worked_hours: workedHours,
        status: finalStatus
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Gets current punch clock status for logged-in employee.
 */
async function getCurrentStatus(req, res, next) {
  try {
    const employeeId = req.user.employee_id;
    if (!employeeId) {
      return res.status(200).json({ data: { isCheckedIn: false, activeSession: null } });
    }

    const [openPunch] = await pool.query(
      'SELECT id, employee_id, check_in, status FROM attendances WHERE employee_id = ? AND check_out IS NULL ORDER BY id DESC LIMIT 1',
      [employeeId]
    );

    if (openPunch.length > 0) {
      return res.status(200).json({
        data: {
          isCheckedIn: true,
          activeSession: openPunch[0]
        }
      });
    }

    res.status(200).json({
      data: {
        isCheckedIn: false,
        activeSession: null
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Calculates working hours statistics for the authenticated employee:
 * - today working hours
 * - this week working hours
 * - this month working hours
 */
async function getMyAttendanceStats(req, res, next) {
  try {
    const employeeId = req.user.employee_id;
    if (!employeeId) {
      return res.status(200).json({
        data: {
          today_hours: 0,
          week_hours: 0,
          month_hours: 0
        }
      });
    }

    const [rows] = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN DATE(check_in) = CURDATE() THEN worked_hours ELSE 0 END), 0) AS today_hours,
        COALESCE(SUM(CASE WHEN YEARWEEK(check_in, 1) = YEARWEEK(CURDATE(), 1) THEN worked_hours ELSE 0 END), 0) AS week_hours,
        COALESCE(SUM(CASE WHEN YEAR(check_in) = YEAR(CURDATE()) AND MONTH(check_in) = MONTH(CURDATE()) THEN worked_hours ELSE 0 END), 0) AS month_hours
      FROM attendances 
      WHERE employee_id = ?`,
      [employeeId]
    );

    let todayHours = parseFloat(rows[0]?.today_hours || 0);
    let weekHours = parseFloat(rows[0]?.week_hours || 0);
    let monthHours = parseFloat(rows[0]?.month_hours || 0);

    // If currently checked in (active session), add live elapsed hours
    const [openPunch] = await pool.query(
      'SELECT check_in FROM attendances WHERE employee_id = ? AND check_out IS NULL ORDER BY id DESC LIMIT 1',
      [employeeId]
    );

    if (openPunch.length > 0) {
      const checkInDate = new Date(openPunch[0].check_in);
      const now = new Date();
      const elapsedHours = Math.max(0, (now.getTime() - checkInDate.getTime()) / (1000 * 60 * 60));
      
      const isToday = checkInDate.toDateString() === now.toDateString();
      if (isToday) {
        todayHours += elapsedHours;
      }
      weekHours += elapsedHours;
      monthHours += elapsedHours;
    }

    res.status(200).json({
      data: {
        today_hours: parseFloat(todayHours.toFixed(2)),
        week_hours: parseFloat(weekHours.toFixed(2)),
        month_hours: parseFloat(monthHours.toFixed(2))
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Lists attendance records with date filtering, employee filtering, and pagination.
 * Scoped by RBAC: 'attendance.manage_all' vs 'attendance.view_own'.
 */
async function listAttendance(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const { employee_id, from, to, status } = req.query;

    // Check if user has permission to view all or only own records
    const userRole = req.user.role_id;
    const [permRows] = await pool.query(
      `SELECT p.code FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.id WHERE rp.role_id = ? AND (p.code = 'attendance.manage_all' OR p.code = 'system.admin')`,
      [userRole]
    );
    const canManageAll = permRows.length > 0;

    let whereConditions = [];
    let queryParams = [];

    if (!canManageAll) {
      // Strictly scope to own profile
      if (!req.user.employee_id) {
        return res.status(200).json({ data: [], pagination: { total: 0, page, limit, totalPages: 0 } });
      }
      whereConditions.push('a.employee_id = ?');
      queryParams.push(req.user.employee_id);
    } else if (employee_id) {
      whereConditions.push('a.employee_id = ?');
      queryParams.push(employee_id);
    }

    if (from) {
      whereConditions.push('DATE(a.check_in) >= ?');
      queryParams.push(from);
    }

    if (to) {
      whereConditions.push('DATE(a.check_in) <= ?');
      queryParams.push(to);
    }

    if (status) {
      whereConditions.push('a.status = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM attendances a ${whereClause}`;
    const [[{ total }]] = await pool.query(countSql, queryParams);

    // Main query with joined employee and editor names
    // Schema reference: attendances -> employees, users (edited_by)
    const listSql = `
      SELECT 
        a.id,
        a.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.employee_code,
        d.name AS department_name,
        a.check_in,
        a.check_out,
        a.worked_hours,
        a.status,
        a.is_manual_edit,
        a.edited_by,
        u.email AS edited_by_email,
        a.notes,
        a.created_at
      FROM attendances a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN users u ON a.edited_by = u.id
      ${whereClause}
      ORDER BY a.check_in DESC
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
 * Manual edit/correction of an attendance record by authorized HR/Admin.
 * Sets is_manual_edit = TRUE and records edited_by.
 * 
 * @param {import('express').Request} req - Express request with body: { check_in, check_out, status, notes }
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
 * @sideEffects Updates `attendances` row and sets audit fields
 */
async function manualEdit(req, res, next) {
  try {
    const { id } = req.params;
    const { check_in, check_out, status, notes } = req.body;
    const editorUserId = req.user.id;

    const [existing] = await pool.query('SELECT * FROM attendances WHERE id = ?', [id]);
    if (existing.length === 0) {
      const error = new Error(`Attendance record #${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    const current = existing[0];
    const newCheckIn = check_in || current.check_in;
    const newCheckOut = check_out !== undefined ? check_out : current.check_out;

    if (newCheckIn && !isValidDate(newCheckIn)) {
      return next(createValidationError('Invalid check_in timestamp', 'check_in'));
    }

    if (newCheckOut && !isValidDate(newCheckOut)) {
      return next(createValidationError('Invalid check_out timestamp', 'check_out'));
    }

    if (newCheckIn && newCheckOut && !isValidDateRange(newCheckIn, newCheckOut)) {
      return next(createValidationError('check_out must be after check_in', 'check_out'));
    }

    if (status && !isValidEnum(status, ['present', 'late', 'half_day', 'absent'])) {
      return next(createValidationError('Invalid status. Allowed: present, late, half_day, absent', 'status'));
    }

    let workedHours = current.worked_hours;
    if (newCheckIn && newCheckOut) {
      workedHours = calculateWorkedHours(newCheckIn, newCheckOut);
    }

    const newStatus = status || (newCheckIn && newCheckOut ? evaluateAttendanceStatus(workedHours, newCheckIn) : current.status);

    // Update with manual edit flag per schema definition
    // Schema reference: is_manual_edit BOOLEAN, edited_by INT FK users(id)
    const updateSql = `
      UPDATE attendances SET
        check_in = ?,
        check_out = ?,
        worked_hours = ?,
        status = ?,
        is_manual_edit = TRUE,
        edited_by = ?,
        notes = ?
      WHERE id = ?
    `;

    await pool.query(updateSql, [
      newCheckIn,
      newCheckOut,
      workedHours,
      newStatus,
      editorUserId,
      notes !== undefined ? notes : current.notes,
      id
    ]);

    res.status(200).json({
      message: 'Attendance record corrected successfully',
      data: {
        id,
        check_in: newCheckIn,
        check_out: newCheckOut,
        worked_hours: workedHours,
        status: newStatus,
        is_manual_edit: true,
        edited_by: editorUserId
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves an employee-centric attendance directory with summary metrics (e.g. today's status, total records, total hours).
 * Supports search (name, code), role filter, department filter, and date filters.
 */
async function getEmployeeAttendanceSummary(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const { search, role_id, department_id, date, from, to } = req.query;

    let whereConditions = [];
    let queryParams = [];

    // Filter by search (name, code, or email)
    if (search && search.trim()) {
      whereConditions.push('(e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_code LIKE ? OR e.email LIKE ?)');
      const s = `%${search.trim()}%`;
      queryParams.push(s, s, s, s);
    }

    // Filter by department
    if (department_id) {
      whereConditions.push('e.department_id = ?');
      queryParams.push(department_id);
    }

    // Filter by role (from user / user_roles)
    if (role_id) {
      whereConditions.push(`(u.role_id = ? OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = ?))`);
      queryParams.push(role_id, role_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count employees matching criteria
    const countSql = `
      SELECT COUNT(DISTINCT e.id) as total 
      FROM employees e
      LEFT JOIN users u ON u.employee_id = e.id
      ${whereClause}
    `;
    const [[{ total }]] = await pool.query(countSql, queryParams);

    // Filter attendance subquery by date range if provided
    let attDateFilter = '';
    let attDateParams = [];
    if (date) {
      attDateFilter += ' AND DATE(a.check_in) = ?';
      attDateParams.push(date);
    } else {
      if (from) {
        attDateFilter += ' AND DATE(a.check_in) >= ?';
        attDateParams.push(from);
      }
      if (to) {
        attDateFilter += ' AND DATE(a.check_in) <= ?';
        attDateParams.push(to);
      }
    }

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
        e.status AS employee_status,
        e.photo_url,
        u.role_id,
        r.name AS primary_role_name,
        (
          SELECT JSON_ARRAYAGG(JSON_OBJECT('id', ro.id, 'name', ro.name))
          FROM user_roles ur
          JOIN roles ro ON ur.role_id = ro.id
          WHERE ur.user_id = u.id
        ) AS roles,
        (
          SELECT COUNT(*) 
          FROM attendances a 
          WHERE a.employee_id = e.id ${attDateFilter}
        ) AS total_attendance_records,
        (
          SELECT COALESCE(SUM(a.worked_hours), 0)
          FROM attendances a 
          WHERE a.employee_id = e.id ${attDateFilter}
        ) AS total_worked_hours,
        (
          SELECT a.check_in 
          FROM attendances a 
          WHERE a.employee_id = e.id 
          ORDER BY a.check_in DESC 
          LIMIT 1
        ) AS latest_check_in,
        (
          SELECT a.check_out 
          FROM attendances a 
          WHERE a.employee_id = e.id 
          ORDER BY a.check_in DESC 
          LIMIT 1
        ) AS latest_check_out,
        (
          SELECT a.status 
          FROM attendances a 
          WHERE a.employee_id = e.id 
          ORDER BY a.check_in DESC 
          LIMIT 1
        ) AS latest_status,
        (
          SELECT CASE
            WHEN a.check_out IS NULL AND DATE(a.check_in) = CURDATE() THEN 'checked_in'
            WHEN a.check_out IS NOT NULL AND DATE(a.check_in) = CURDATE() THEN 'checked_out'
            ELSE 'not_checked_in'
          END
          FROM attendances a
          WHERE a.employee_id = e.id AND DATE(a.check_in) = CURDATE()
          ORDER BY a.id DESC
          LIMIT 1
        ) AS today_punch_state
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN job_positions jp ON e.job_position_id = jp.id
      LEFT JOIN users u ON u.employee_id = e.id
      LEFT JOIN roles r ON u.role_id = r.id
      ${whereClause}
      ORDER BY e.id DESC
      LIMIT ? OFFSET ?
    `;

    const allQueryParams = [...queryParams, ...attDateParams, ...attDateParams, limit, offset];
    const [rows] = await pool.query(listSql, allQueryParams);

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
 * Deletes an attendance record.
 */
async function deleteAttendance(req, res, next) {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM attendances WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      const error = new Error(`Attendance record with ID ${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    res.status(200).json({ message: 'Attendance record deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  checkIn,
  checkOut,
  getCurrentStatus,
  getMyAttendanceStats,
  listAttendance,
  getEmployeeAttendanceSummary,
  manualEdit,
  deleteAttendance
};
