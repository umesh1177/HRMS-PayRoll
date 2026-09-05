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
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
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

    const req = rows[0];

    if (req.status === 'approved') {
      throw new Error('This time off request has already been approved');
    }

    // 2. If leave type requires allocation, update and verify allocation balance
    if (req.requires_allocation && req.allocation_id) {
      const [allocRows] = await connection.query(
        'SELECT id, allocated_amount, taken_amount FROM time_off_allocations WHERE id = ? FOR UPDATE',
        [req.allocation_id]
      );

      if (allocRows.length === 0) {
        throw new Error(`Linked allocation #${req.allocation_id} not found`);
      }

      const alloc = allocRows[0];
      const newTaken = Number(alloc.taken_amount) + Number(req.duration);

      if (newTaken > Number(alloc.allocated_amount)) {
        throw new Error(
          `Cannot approve leave: allocated amount (${alloc.allocated_amount}) exceeded by new total (${newTaken})`
        );
      }

      // Increment taken_amount on time_off_allocations
      // Schema reference: time_off_allocations.taken_amount
      await connection.query(
        'UPDATE time_off_allocations SET taken_amount = ? WHERE id = ?',
        [newTaken, req.allocation_id]
      );
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
  const [result] = await pool.query(
    `UPDATE time_off_requests 
     SET status = 'refused', approver_id = ?, decided_at = NOW(), reason = COALESCE(?, reason)
     WHERE id = ?`,
    [approverUserId, refusalReason || null, requestId]
  );

  if (result.affectedRows === 0) {
    throw new Error(`Time off request #${requestId} not found`);
  }

  return { success: true, message: 'Time off request refused' };
}

module.exports = {
  calculateLeaveDuration,
  approveTimeOffRequest,
  refuseTimeOffRequest
};
