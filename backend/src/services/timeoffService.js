/**
 * Time Off & Leaves Domain Service
 * 
 * RESPONSIBILITY:
 * Contains core leave validation logic, working day duration calculations, and atomic
 * state transition handlers for approving and refusing time-off requests.
 * 
 * NOT RESPONSIBLE FOR:
 * HTTP request formatting or Express middleware chaining.
 */

const pool = require('../config/db');

/**
 * Calculates calendar or working days duration between two dates inclusive.
 * 
 * @param {string} startDate - Start date string (YYYY-MM-DD)
 * @param {string} endDate - End date string (YYYY-MM-DD)
 * @returns {number} Duration in days (minimum 1)
 */
function calculateLeaveDuration(startDate, endDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    const error = new Error('Dates must use YYYY-MM-DD format');
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    const error = new Error('End date must be on or after start date');
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Executes atomic approval of a time off request within a dedicated MySQL transaction.
 * 
 * WHY TRANSACTIONAL (ACID Consistency Across Two Tables):
 * Approving a leave request requires two interdependent updates:
 * 1. Updating `time_off_requests.status` to 'approved', setting `approver_id` and `decided_at`.
 * 2. If the leave type `requires_allocation` is true, incrementing `time_off_allocations.taken_amount`.
 * 
 * If either step fails or if concurrent approvals race on the same allocation,
 * a non-transactional execution could result in an approved request with untracked
 * allocation drawdown, or double-spent leave balances. Wrapping both operations in
 * an ACID transaction guarantees strict consistency.
 * 
 * @param {number} requestId - ID of time_off_requests row
 * @param {number} approverUserId - ID of authenticated user performing approval
 * @returns {Promise<{ success: boolean, message: string }>} Result of approval operation
 * @sideEffects Mutates `time_off_requests` and `time_off_allocations` inside transaction
 */
async function approveTimeOffRequest(requestId, approverUserId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Lock and fetch request with its type and allocation
    const query = `
      SELECT 
        r.id,
        r.employee_id,
        r.time_off_type_id,
        r.allocation_id,
        r.duration,
        r.status,
        t.requires_allocation,
        t.name AS type_name
      FROM time_off_requests r
      JOIN time_off_types t ON r.time_off_type_id = t.id
      WHERE r.id = ?
      FOR UPDATE
    `;

    const [rows] = await connection.query(query, [requestId]);
    if (rows.length === 0) {
      throw new Error(`Time off request #${requestId} not found`);
    }

    const request = rows[0];

    if (request.status === 'refused') {
      throw new Error('This request has already been refused and cannot be approved');
    }
    if (request.status !== 'submitted') {
      throw new Error('Only submitted time off requests can be approved');
    }

    const [approverRows] = await connection.query(
      `SELECT u.employee_id, r.name AS role_name, e.manager_id
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN employees e ON e.id = ?
       WHERE u.id = ?`,
      [request.employee_id, approverUserId]
    );
    const approver = approverRows[0];
    if (!approver) throw new Error('Approver account not found');
    if (approver.employee_id === request.employee_id) {
      throw new Error('You cannot approve your own time off request');
    }
    if (approver.role_name !== 'Admin' && approver.employee_id !== approver.manager_id) {
      throw new Error('Only an administrator or the employee manager can approve this request');
    }

    // 2. If leave type requires allocation, update and verify allocation balance
    if (request.requires_allocation && request.allocation_id) {
      const [allocRows] = await connection.query(
        'SELECT id, employee_id, time_off_type_id, allocated_amount, taken_amount FROM time_off_allocations WHERE id = ? FOR UPDATE',
        [request.allocation_id]
      );

      if (allocRows.length === 0) {
        throw new Error(`Linked allocation #${request.allocation_id} not found`);
      }

      const alloc = allocRows[0];
      if (alloc.employee_id !== request.employee_id || alloc.time_off_type_id !== request.time_off_type_id) {
        throw new Error('The selected allocation does not belong to this request');
      }
      const newTaken = Number(alloc.taken_amount) + Number(request.duration);

      if (newTaken > Number(alloc.allocated_amount)) {
        throw new Error(
          `Cannot approve leave: allocated amount (${alloc.allocated_amount}) exceeded by new total (${newTaken})`
        );
      }

      // Increment taken_amount on time_off_allocations
      // Schema reference: time_off_allocations.taken_amount
      await connection.query(
        'UPDATE time_off_allocations SET taken_amount = ? WHERE id = ?',
        [newTaken, request.allocation_id]
      );
    } else if (request.requires_allocation) {
      throw new Error('An approved allocation is required for this leave type');
    }

    // 3. Mark request as approved
    await connection.query(
      `UPDATE time_off_requests 
       SET status = 'approved', approver_id = ?, decided_at = NOW() 
       WHERE id = ?`,
      [approverUserId, requestId]
    );

    await connection.commit();
    return { success: true, message: 'Time off request approved successfully' };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Refuses a time off request.
 * 
 * @param {number} requestId - ID of time_off_requests row
 * @param {number} approverUserId - ID of authenticated user performing refusal
 * @param {string} [refusalReason] - Optional reason
 * @returns {Promise<{ success: boolean, message: string }>} Result of refusal
 * @sideEffects Updates `time_off_requests`
 */
async function refuseTimeOffRequest(requestId, approverUserId, refusalReason) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT r.id, r.employee_id, r.time_off_type_id, r.allocation_id, r.duration, r.status,
              t.requires_allocation
       FROM time_off_requests r
       JOIN time_off_types t ON r.time_off_type_id = t.id
       WHERE r.id = ? FOR UPDATE`,
      [requestId]
    );
    if (rows.length === 0) throw new Error(`Time off request #${requestId} not found`);
    const request = rows[0];
    if (request.status === 'refused') throw new Error('This request has already been refused');
    if (!['submitted', 'approved'].includes(request.status)) {
      throw new Error('Only submitted or approved time off requests can be refused');
    }

    const [approverRows] = await connection.query(
      `SELECT u.employee_id, r.name AS role_name, e.manager_id
       FROM users u JOIN roles r ON u.role_id = r.id
       LEFT JOIN employees e ON e.id = ? WHERE u.id = ?`,
      [request.employee_id, approverUserId]
    );
    const approver = approverRows[0];
    if (!approver) throw new Error('Approver account not found');
    if (approver.employee_id === request.employee_id) throw new Error('You cannot refuse your own time off request');
    if (approver.role_name !== 'Admin' && approver.employee_id !== approver.manager_id) {
      throw new Error('Only an administrator or the employee manager can refuse this request');
    }

    if (request.status === 'approved' && request.requires_allocation && request.allocation_id) {
      const [allocRows] = await connection.query(
        'SELECT id, taken_amount FROM time_off_allocations WHERE id = ? FOR UPDATE',
        [request.allocation_id]
      );
      if (allocRows.length === 0) throw new Error(`Linked allocation #${request.allocation_id} not found`);
      const newTaken = Number(allocRows[0].taken_amount) - Number(request.duration);
      if (newTaken < 0) throw new Error('Cannot reverse leave: allocation balance is already inconsistent');
      await connection.query('UPDATE time_off_allocations SET taken_amount = ? WHERE id = ?', [newTaken, request.allocation_id]);
    }

    await connection.query(
      `UPDATE time_off_requests SET status = 'refused', approver_id = ?, decided_at = NOW(), reason = COALESCE(?, reason) WHERE id = ?`,
      [approverUserId, refusalReason || null, requestId]
    );
    await connection.commit();
    return { success: true, message: 'Time off request refused' };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = {
  calculateLeaveDuration,
  approveTimeOffRequest,
  refuseTimeOffRequest
};
