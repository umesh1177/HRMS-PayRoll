/**
 * Payroll Computation Engine
 * 
 * RESPONSIBILITY:
 * Evaluates salary rules sequentially within a salary structure for a specific employee contract
 * and payrun period. Computes basic wage, allowances, statutory deductions, gross wage, and net salary.
 * Integrates attendance logs and unpaid leaves, and generates immutable compute-time payslip lines.
 * 
 * NOT RESPONSIBLE FOR:
 * Handling HTTP requests directly or signing PDF documents.
 */

const pool = require('../config/db');
const { getBusinessDaysCount } = require('../utils/dateUtils');

/**
 * Safely evaluates a mathematical formula expression using pre-computed rule values.
 * 
 * @param {string} formulaStr - Math expression (e.g. "BASIC + HRA - PF" or "BASIC * 0.15")
 * @param {object} context - Map of computed rule codes to numeric values { BASIC: 5000, HRA: 2000 }
 * @returns {number} Evaluated result
 */
function evaluateFormula(formulaStr, context) {
  if (!formulaStr) return 0;

  // Replace variable identifiers with numeric values from context
  // Only allow valid identifier tokens: [A-Za-z_][A-Za-z0-9_]*
  const sanitized = formulaStr.replace(/[A-Za-z_][A-Za-z0-9_]*/g, (token) => {
    if (Object.prototype.hasOwnProperty.call(context, token)) {
      return `(${Number(context[token]) || 0})`;
    }
    // If unknown token in formula, replace with 0
    return '0';
  });

  // Verify only numbers and arithmetic operators remain: [0-9], +, -, *, /, (, ), ., whitespace
  const isSafeMath = /^[\d\s+\-*/().]+$/.test(sanitized);
  if (!isSafeMath) {
    console.warn(`[PAYROLL ENGINE] Unsafe formula rejected: "${formulaStr}"`);
    return 0;
  }

  try {
    // Evaluate sanitized arithmetic expression safely via Function constructor
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${sanitized});`)();
    return Number.isFinite(result) ? Number(result.toFixed(2)) : 0;
  } catch (err) {
    console.error(`[PAYROLL ENGINE] Error evaluating formula: "${formulaStr}" -> "${sanitized}":`, err.message);
    return 0;
  }
}

/**
 * Computes the salary for an employee based on their frozen contract and payrun period.
 * 
 * @param {object} params - Calculation parameters
 * @param {number} params.contractId - ID of contract to use
 * @param {number} params.salaryStructureId - ID of salary structure
 * @param {string} params.periodStart - Start date of payrun (YYYY-MM-DD)
 * @param {string} params.periodEnd - End date of payrun (YYYY-MM-DD)
 * @returns {Promise<object>} Computed payslip data and snapshot line items
 * @sideEffects Queries database for contracts, rules, attendances, and leaves
 */
async function computeEmployeeSalary({ contractId, salaryStructureId, periodStart, periodEnd }) {
  // 1. Fetch Contract Details
  // Schema reference: contracts table
  const [contracts] = await pool.query(
    'SELECT id, employee_id, wage, start_date, end_date, status FROM contracts WHERE id = ?',
    [contractId]
  );

  if (contracts.length === 0) {
    throw new Error(`Contract #${contractId} not found`);
  }
  const contract = contracts[0];
  const employeeId = contract.employee_id;
  const contractWage = Number(contract.wage || 0);

  // 2. Fetch Structure Rules ordered by sequence ASC
  // Schema reference: structure_rules (sequence) JOIN salary_rules
  const ruleQuery = `
    SELECT 
      sr.id AS structure_rule_id,
      sr.sequence,
      r.id AS salary_rule_id,
      r.name,
      r.code,
      r.category,
      r.computation_method,
      r.fixed_amount,
      r.percentage_value,
      r.percentage_basis_code,
      r.formula,
      r.active
    FROM structure_rules sr
    JOIN salary_rules r ON sr.salary_rule_id = r.id
    WHERE sr.salary_structure_id = ? AND r.active = TRUE
    ORDER BY sr.sequence ASC
  `;

  const [rules] = await pool.query(ruleQuery, [salaryStructureId]);

  // 3. Attendance & Worked Days Integration
  const totalBusinessDays = getBusinessDaysCount(periodStart, periodEnd);

  // Query actual present/overtime attendance records in the period
  const [attRows] = await pool.query(
    `SELECT COUNT(DISTINCT DATE(check_in)) AS present_days,
            SUM(status = 'missing_checkout') AS missing_checkout_count
     FROM attendances 
     WHERE employee_id = ? AND DATE(check_in) >= ? AND DATE(check_in) <= ?`,
    [employeeId, periodStart, periodEnd]
  );

  const presentDays = attRows[0]?.present_days || totalBusinessDays;
  const missingCheckoutCount = attRows[0]?.missing_checkout_count || 0;

  // Query unpaid leave days that affect payroll
  const [unpaidLeaveRows] = await pool.query(
    `SELECT SUM(r.duration) AS unpaid_days
     FROM time_off_requests r
     JOIN time_off_types t ON r.time_off_type_id = t.id
     WHERE r.employee_id = ? 
       AND r.status = 'approved'
       AND t.affects_payroll = TRUE
       AND r.start_date <= ? AND r.end_date >= ?`,
    [employeeId, periodEnd, periodStart]
  );

  const unpaidDays = Number(unpaidLeaveRows[0]?.unpaid_days || 0);
  const workedDays = Math.max(0, totalBusinessDays - unpaidDays);

  // Warnings detection
  let hasWarning = false;
  let warningMessages = [];

  if (missingCheckoutCount > 0) {
    hasWarning = true;
    warningMessages.push(`${missingCheckoutCount} attendance record(s) missing checkout in this period`);
  }

  if (contractWage <= 0) {
    hasWarning = true;
    warningMessages.push('Contract base wage is $0 or unspecified');
  }

  // 4. Sequential Rule Evaluation
  // Accumulator context: holds all previously computed rule amounts for forward resolution
  const context = {
    WAGE: contractWage,
    BASIC: contractWage,
    WORKED_DAYS: workedDays,
    TOTAL_DAYS: totalBusinessDays
  };

  const computedLines = [];
  let basicWage = contractWage;
  let totalGross = 0;
  let totalDeductions = 0;

  for (const rule of rules) {
    let lineAmount = 0;

    switch (rule.computation_method) {
      case 'fixed':
        if (rule.code === 'BASIC' && (rule.fixed_amount === null || rule.fixed_amount === undefined)) {
          lineAmount = contractWage;
        } else {
          lineAmount = Number(rule.fixed_amount || 0);
        }
        break;

      case 'percentage':
        {
          // Resolve basis rule from context
          const basisCode = rule.percentage_basis_code || 'BASIC';
          const basisAmount = Number(context[basisCode] !== undefined ? context[basisCode] : contractWage);
          const percentVal = Number(rule.percentage_value || 0);
          lineAmount = Number((basisAmount * percentVal).toFixed(2));
        }
        break;

      case 'formula':
        lineAmount = evaluateFormula(rule.formula, context);
        break;

      default:
        lineAmount = 0;
    }

    // Record in context for subsequent dependent rules (Forward-Only Dependency Invariant)
    context[rule.code] = lineAmount;

    // Track category totals
    if (rule.category === 'basic') {
      basicWage = lineAmount;
      totalGross += lineAmount;
    } else if (rule.category === 'allowance') {
      totalGross += lineAmount;
    } else if (rule.category === 'deduction' || rule.category === 'contribution') {
      totalDeductions += lineAmount;
    } else if (rule.category === 'gross') {
      // Rule explicitly calculating gross
      totalGross = lineAmount;
    }

    // Snapshot line item per Schema Note #3 & #4
    computedLines.push({
      salary_rule_id: rule.salary_rule_id,
      code: rule.code,
      name: rule.name,
      category: rule.category,
      sequence: rule.sequence,
      amount: lineAmount
    });
  }

  // Compute final net amount
  const netAmount = Math.max(0, Number((totalGross - totalDeductions).toFixed(2)));

  return {
    contract_id: contractId,
    employee_id: employeeId,
    salary_structure_id: salaryStructureId,
    period_start: periodStart,
    period_end: periodEnd,
    worked_days: workedDays,
    basic_wage: basicWage,
    gross_amount: totalGross,
    net_amount: netAmount,
    has_warning: hasWarning,
    warning_notes: warningMessages.join('; ') || null,
    lines: computedLines
  };
}

module.exports = {
  computeEmployeeSalary,
  evaluateFormula
};
