/**
 * Contract Domain Service
 * 
 * RESPONSIBILITY:
 * Contains reusable business logic and validation rules for employment contracts,
 * specifically date-range overlap detection for active/running contracts.
 * 
 * NOT RESPONSIBLE FOR:
 * Handling HTTP requests directly or managing Express routing.
 */

const pool = require('../config/db');

/**
 * Validates whether a given date range for a 'running' contract overlaps with any existing
 * 'running' contract for the specified employee.
 * 
 * BUSINESS RULE & SCHEMA NOTE:
 * Reference schema.sql lines 274-276: "no two overlapping RUNNING contracts per employee
 * cannot be expressed as a plain UNIQUE constraint (date ranges). Enforce with an app-layer check".
 * 
 * MATHEMATICAL OVERLAP LOGIC:
 * Let Interval A = [Start_A, End_A] and Interval B = [Start_B, End_B].
 * A null End_Date represents an open-ended/indefinite contract (effectively +Infinity).
 * Two intervals overlap if and only if:
 *   Start_A <= (End_B || Infinity) AND Start_B <= (End_A || Infinity)
 * 
 * In MySQL query terms:
 *   (existing.start_date <= new.end_date OR new.end_date IS NULL)
 *   AND
 *   (new.start_date <= existing.end_date OR existing.end_date IS NULL)
 * 
 * @param {number} employeeId - ID of employee to check
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string|null} [endDate=null] - Optional end date (YYYY-MM-DD or null)
 * @param {number|null} [excludeContractId=null] - Contract ID to exclude during updates
 * @returns {Promise<{ hasOverlap: boolean, conflictingContract?: object }>} Overlap determination
 * @sideEffects Reads `contracts` table
 */
async function checkRunningContractOverlap(employeeId, startDate, endDate = null, excludeContractId = null) {
  let query = `
    SELECT 
      c.id, 
      c.employee_id, 
      c.start_date, 
      c.end_date, 
      c.status,
      c.wage
    FROM contracts c
    WHERE c.employee_id = ?
      AND c.status = 'running'
      AND (c.start_date <= ? OR ? IS NULL)
      AND (? <= c.end_date OR c.end_date IS NULL)
  `;

  const params = [
    employeeId,
    endDate,
    endDate,
    startDate
  ];

  if (excludeContractId) {
    query += ' AND c.id != ?';
    params.push(excludeContractId);
  }

  query += ' LIMIT 1';

  const [rows] = await pool.query(query, params);

  if (rows.length > 0) {
    return {
      hasOverlap: true,
      conflictingContract: rows[0]
    };
  }

  return {
    hasOverlap: false
  };
}

module.exports = {
  checkRunningContractOverlap
};
