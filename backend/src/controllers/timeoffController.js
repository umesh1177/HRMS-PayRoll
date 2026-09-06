/**
 * Time Off & Leaves Controller
 * 
 * RESPONSIBILITY:
 * Manages leave types configuration, employee time-off allocations, and the complete request
 * lifecycle (draft -> submitted -> approved / refused) with RBAC scoping and transactional deductions.
 * 
 * NOT RESPONSIBLE FOR:
 * Live punch attendance or salary structure formulas.
 */

const pool = require('../config/db');
const { calculateLeaveDuration, approveTimeOffRequest, refuseTimeOffRequest } = require('../services/timeoffService');
const {
  isValidDate,
  isValidDateRange,
  isValidNumber,
  isValidEnum,
  createValidationError
} = require('../utils/validators');
const { getDataScope } = require('../utils/accessScope');

// ---------------------------------------------------------------------
// 1. TIME OFF TYPES
// ---------------------------------------------------------------------

/**
 * Lists all configured time off types.
 */
async function listTypes(req, res, next) {
  try {
    const [types] = await pool.query('SELECT * FROM time_off_types ORDER BY id ASC');
    res.status(200).json({ data: types });
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a new time off type (restricted to 'timeoff.manage_config').
 */
async function createType(req, res, next) {
  try {
    const { name, unit, requires_allocation, approval_type, affects_payroll, color, active } = req.body;

    if (!name) {
      const error = new Error('Type name is required');
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    const insertSql = `
      INSERT INTO time_off_types (name, unit, requires_allocation, approval_type, affects_payroll, color, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertSql, [
      name,
      unit || 'day',
      requires_allocation !== undefined ? requires_allocation : true,
      approval_type || 'single',
      affects_payroll !== undefined ? affects_payroll : false,
      color || '#6366f1',
      active !== undefined ? active : true
    ]);

    res.status(201).json({
      message: 'Time off type created successfully',
      data: { id: result.insertId, name }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Updates a time off type.
 */
async function updateType(req, res, next) {
  try {
    const { id } = req.params;
    const { name, unit, requires_allocation, approval_type, affects_payroll, color, active } = req.body;

    const updateSql = `
      UPDATE time_off_types SET
        name = COALESCE(?, name),
        unit = COALESCE(?, unit),
        requires_allocation = COALESCE(?, requires_allocation),
        approval_type = COALESCE(?, approval_type),
        affects_payroll = COALESCE(?, affects_payroll),
        color = COALESCE(?, color),
        active = COALESCE(?, active)
      WHERE id = ?
    `;

    const [result] = await pool.query(updateSql, [
      name, unit, requires_allocation, approval_type, affects_payroll, color, active, id
    ]);

    if (result.affectedRows === 0) {
      const error = new Error(`Time off type #${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    res.status(200).json({ message: 'Time off type updated successfully' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------
// 2. TIME OFF ALLOCATIONS
// ---------------------------------------------------------------------

/**
 * Lists time off allocations (scoped: own if 'timeoff.view_own' vs all if manager/admin).
 */
async function listAllocations(req, res, next) {
  try {
    const { employee_id, status } = req.query;
    const dataScope = await getDataScope(req.user);

    const userRole = req.user.role_id;
    const [permRows] = await pool.query(
      `SELECT p.code FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.id 
       WHERE rp.role_id = ? AND (p.code = 'timeoff.manage_config' OR p.code = 'timeoff.approve' OR p.code = 'system.admin')`,
      [userRole]
    );
    const canViewAll = permRows.length > 0;

    let whereConditions = [];
    let queryParams = [];

    if (!canViewAll) {
      if (!req.user.employee_id) {
        return res.status(200).json({ data: [] });
      }
      whereConditions.push('a.employee_id = ?');
      queryParams.push(req.user.employee_id);
    } else if (employee_id) {
      whereConditions.push('a.employee_id = ?');
      queryParams.push(employee_id);
    }

    if (canViewAll && !dataScope.isAdmin) {
      if (!dataScope.departmentId) return res.status(200).json({ data: [] });
      whereConditions.push('e.department_id = ?');
      queryParams.push(dataScope.departmentId);
    }

    if (status) {
      whereConditions.push('a.status = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        a.id,
        a.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.employee_code,
        a.time_off_type_id,
        t.name AS type_name,
        t.unit,
        a.allocated_amount,
        a.taken_amount,
        (a.allocated_amount - a.taken_amount) AS remaining_amount,
        a.valid_from,
        a.valid_to,
        a.status,
        a.created_at
      FROM time_off_allocations a
      JOIN employees e ON a.employee_id = e.id
      JOIN time_off_types t ON a.time_off_type_id = t.id
      ${whereClause}
      ORDER BY a.id DESC
    `;

    const [rows] = await pool.query(query, queryParams);
    res.status(200).json({ data: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a time off allocation (restricted to 'timeoff.manage_config').
 */
async function createAllocation(req, res, next) {
  try {
    const { employee_id, time_off_type_id, allocated_amount, valid_from, valid_to, status } = req.body;

    if (!employee_id || !time_off_type_id || allocated_amount === undefined || !valid_from) {
      const error = new Error('employee_id, time_off_type_id, allocated_amount, and valid_from are required');
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    const allocStatus = status || 'approved'; // Usually created directly as approved by HR
    const approvedBy = allocStatus === 'approved' ? req.user.id : null;

    const [result] = await pool.query(
      `INSERT INTO time_off_allocations (employee_id, time_off_type_id, allocated_amount, valid_from, valid_to, status, approved_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [employee_id, time_off_type_id, allocated_amount, valid_from, valid_to || null, allocStatus, approvedBy]
    );

    res.status(201).json({
      message: 'Time off allocation created successfully',
      data: { id: result.insertId, employee_id, allocated_amount, status: allocStatus }
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------
// 3. TIME OFF REQUESTS & WORKFLOW
// ---------------------------------------------------------------------

/**
 * Lists time off requests with RBAC scoping and status filtering.
 */
async function listRequests(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const { employee_id, status } = req.query;
    const dataScope = await getDataScope(req.user);

    const userRole = req.user.role_id;
    // Check if user has manager/approver rights
    const [permRows] = await pool.query(
      `SELECT p.code FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.id 
       WHERE rp.role_id = ? AND (p.code = 'timeoff.approve' OR p.code = 'timeoff.manage_config' OR p.code = 'system.admin')`,
      [userRole]
    );
    const canApproveOrManage = permRows.length > 0;

    let whereConditions = [];
    let queryParams = [];

    if (!canApproveOrManage) {
      if (!req.user.employee_id) {
        return res.status(200).json({ data: [], pagination: { total: 0, page, limit, totalPages: 0 } });
      }
      whereConditions.push('r.employee_id = ?');
      queryParams.push(req.user.employee_id);
    } else if (employee_id) {
      whereConditions.push('r.employee_id = ?');
      queryParams.push(employee_id);
    }

    if (canApproveOrManage && !dataScope.isAdmin) {
      if (!dataScope.departmentId) {
        return res.status(200).json({ data: [], pagination: { total: 0, page, limit, totalPages: 0 } });
      }
      whereConditions.push('e.department_id = ?');
      queryParams.push(dataScope.departmentId);
    }

    if (status) {
      whereConditions.push('r.status = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM time_off_requests r
      JOIN employees e ON r.employee_id = e.id
      ${whereClause}`;
    const [[{ total }]] = await pool.query(countSql, queryParams);

    const listSql = `
      SELECT 
        r.id,
        r.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.employee_code,
        d.name AS department_name,
        r.time_off_type_id,
        t.name AS type_name,
        t.color AS type_color,
        r.allocation_id,
        r.start_date,
        r.end_date,
        r.duration,
        r.status,
        r.reason,
        r.approver_id,
        u.email AS approver_email,
        r.decided_at,
        r.created_at
      FROM time_off_requests r
      JOIN employees e ON r.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      JOIN time_off_types t ON r.time_off_type_id = t.id
      LEFT JOIN users u ON r.approver_id = u.id
      ${whereClause}
      ORDER BY r.id DESC
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
 * Creates a new time off request (draft or submitted).
 */
async function createRequest(req, res, next) {
  try {
    const { employee_id, time_off_type_id, allocation_id, start_date, end_date, reason, status } = req.body;

    // Self-service resolution: if employee_id not passed, use req.user.employee_id
    const targetEmployeeId = employee_id || req.user.employee_id;

    if (!targetEmployeeId || !time_off_type_id || !start_date || !end_date) {
      return next(createValidationError('employee_id, time_off_type_id, start_date, and end_date are required'));
    }

    const dataScope = await getDataScope(req.user);
    if (!dataScope.isAdmin && dataScope.departmentId) {
      const [[targetEmployee]] = await pool.query(
        'SELECT department_id FROM employees WHERE id = ? LIMIT 1',
        [targetEmployeeId]
      );
      if (!targetEmployee || targetEmployee.department_id !== dataScope.departmentId) {
        const error = new Error('You can only create time-off requests for employees in your department');
        error.status = 403;
        error.code = 'DEPARTMENT_SCOPE_FORBIDDEN';
        return next(error);
      }
    }

    if (!isValidDate(start_date) || !isValidDate(end_date)) {
      return next(createValidationError('Invalid date format for start_date or end_date'));
    }

    if (!isValidDateRange(start_date, end_date)) {
      return next(createValidationError('end_date must be on or after start_date', 'end_date'));
    }

    const duration = calculateLeaveDuration(start_date, end_date);
    if (duration <= 0) {
      return next(createValidationError('Time-off duration must be at least 1 day', 'duration'));
    }

    // Check for overlapping pending or approved requests for this employee
    const [overlapRows] = await pool.query(
      `SELECT id FROM time_off_requests 
       WHERE employee_id = ? AND status IN ('submitted', 'approved') 
       AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?) OR (start_date >= ? AND end_date <= ?))
       LIMIT 1`,
      [targetEmployeeId, start_date, start_date, end_date, end_date, start_date, end_date]
    );

    if (overlapRows.length > 0) {
      const error = new Error(`An active time-off request (#${overlapRows[0].id}) already exists for this employee during this date range`);
      error.status = 409;
      error.code = 'LEAVE_OVERLAP_CONFLICT';
      return next(error);
    }

    // Check leave type configuration
    const [[leaveType]] = await pool.query('SELECT * FROM time_off_types WHERE id = ?', [time_off_type_id]);
    if (!leaveType) {
      return next(createValidationError(`Time off type #${time_off_type_id} does not exist`, 'time_off_type_id'));
    }

    const requestStatus = status || 'submitted'; // Default to submitted for approval

    // If type requires allocation and allocation_id wasn't passed, find active allocation and check remaining balance
    let resolvedAllocationId = allocation_id || null;
    if (leaveType.requires_allocation) {
      const [allocRows] = await pool.query(
        `SELECT id, allocated_amount, taken_amount, (allocated_amount - taken_amount) AS remaining_amount 
         FROM time_off_allocations 
         WHERE employee_id = ? AND time_off_type_id = ? AND status = 'approved' AND (valid_to >= ? OR valid_to IS NULL)
         ORDER BY valid_from ASC
         LIMIT 1`,
        [targetEmployeeId, time_off_type_id, start_date]
      );

      if (allocRows.length === 0) {
        return next(createValidationError(`No active leave quota allocated for ${leaveType.name}. Please contact HR to allocate leave days.`, 'allocation_id'));
      }

      const alloc = allocRows[0];
      resolvedAllocationId = alloc.id;

      if (Number(alloc.remaining_amount) < duration) {
        return next(createValidationError(
          `Requested duration (${duration} days) exceeds available ${leaveType.name} balance (${alloc.remaining_amount} remaining).`,
          'duration'
        ));
      }
    }

    const insertSql = `
      INSERT INTO time_off_requests (employee_id, time_off_type_id, allocation_id, start_date, end_date, duration, status, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertSql, [
      targetEmployeeId,
      time_off_type_id,
      resolvedAllocationId,
      start_date,
      end_date,
      duration,
      requestStatus,
      reason || null
    ]);

    res.status(201).json({
      message: 'Time off request created successfully',
      data: {
        id: result.insertId,
        employee_id: targetEmployeeId,
        duration,
        status: requestStatus
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Transitions request from 'draft' to 'submitted'.
 */
async function submitRequest(req, res, next) {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      'UPDATE time_off_requests SET status = "submitted" WHERE id = ? AND status = "draft"',
      [id]
    );

    if (result.affectedRows === 0) {
      const error = new Error(`Request #${id} is not in draft status or does not exist`);
      error.status = 400;
      error.code = 'INVALID_STATE';
      return next(error);
    }

    res.status(200).json({ message: 'Request submitted for manager approval' });
  } catch (err) {
    next(err);
  }
}

/**
 * Approves time off request and decrements allocation atomically (requires 'timeoff.approve').
 */
async function approveRequest(req, res, next) {
  try {
    const { id } = req.params;
    const approverUserId = req.user.id;

    const result = await approveTimeOffRequest(id, approverUserId);
    res.status(200).json({ message: result.message });
  } catch (err) {
    next(err);
  }
}

/**
 * Refuses time off request (requires 'timeoff.approve').
 */
async function refuseRequest(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const approverUserId = req.user.id;

    const result = await refuseTimeOffRequest(id, approverUserId, reason);
    res.status(200).json({ message: result.message });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTypes,
  createType,
  updateType,
  listAllocations,
  createAllocation,
  listRequests,
  createRequest,
  submitRequest,
  approveRequest,
  refuseRequest
};
