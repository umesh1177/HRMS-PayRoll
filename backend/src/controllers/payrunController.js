/**
 * Payroll Runs (Payruns) Controller
 * 
 * RESPONSIBILITY:
 * Orchestrates the full lifecycle of monthly payroll batches:
 * 1. Step-1 & Step-2 Payrun creation with frozen contract resolution (Schema Note #4).
 * 2. Invoking the Payroll Engine for batch computation and payslip line snapshotting.
 * 3. Enforcing the strict state transition machine: draft -> computed -> validated -> paid.
 * 
 * NOT RESPONSIBLE FOR:
 * Direct arithmetic calculations (handled by services/payrollEngine.js).
 */

const pool = require('../config/db');
const { computeEmployeeSalary } = require('../services/payrollEngine');

/**
 * Lists payruns with pagination, status filters, and summary metrics.
 */
async function listPayruns(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const { status } = req.query;

    let whereSql = '';
    const queryParams = [];

    if (status) {
      whereSql = 'WHERE p.status = ?';
      queryParams.push(status);
    }

    const countSql = `SELECT COUNT(*) as total FROM payruns p ${whereSql}`;
    const [[{ total }]] = await pool.query(countSql, queryParams);

    const listSql = `
      SELECT 
        p.id,
        p.name,
        p.salary_structure_id,
        ss.name AS structure_name,
        p.period_start,
        p.period_end,
        p.status,
        p.computed_at,
        p.validated_at,
        p.paid_at,
        p.created_at,
        COUNT(DISTINCT pe.employee_id) AS employees_count,
        COUNT(DISTINCT ps.id) AS payslips_count,
        COALESCE(SUM(ps.net_amount), 0) AS total_net_amount,
        COALESCE(SUM(ps.gross_amount), 0) AS total_gross_amount,
        SUM(CASE WHEN ps.has_warning THEN 1 ELSE 0 END) AS warning_count
      FROM payruns p
      JOIN salary_structures ss ON p.salary_structure_id = ss.id
      LEFT JOIN payrun_employees pe ON p.id = pe.payrun_id
      LEFT JOIN payslips ps ON p.id = ps.payrun_id
      ${whereSql}
      GROUP BY p.id
      ORDER BY p.id DESC
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
 * Gets a single payrun with full details, selected employees, and computed payslips.
 */
async function getPayrunById(req, res, next) {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        p.id,
        p.name,
        p.salary_structure_id,
        ss.name AS structure_name,
        p.period_start,
        p.period_end,
        p.status,
        p.computed_at,
        p.validated_at,
        p.paid_at,
        p.created_at,
        u.email AS created_by_email
      FROM payruns p
      JOIN salary_structures ss ON p.salary_structure_id = ss.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `;

    const [payruns] = await pool.query(query, [id]);
    if (payruns.length === 0) {
      const error = new Error(`Payrun #${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    // Fetch selected employees with frozen contracts
    const empQuery = `
      SELECT 
        pe.id AS payrun_employee_id,
        pe.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.employee_code,
        d.name AS department_name,
        pe.contract_id,
        c.wage,
        c.contract_type
      FROM payrun_employees pe
      JOIN employees e ON pe.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      JOIN contracts c ON pe.contract_id = c.id
      WHERE pe.payrun_id = ?
    `;

    const [employees] = await pool.query(empQuery, [id]);

    // Fetch computed payslips if any
    const slipQuery = `
      SELECT 
        ps.id,
        ps.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.employee_code,
        ps.basic_wage,
        ps.gross_amount,
        ps.net_amount,
        ps.worked_days,
        ps.status,
        ps.has_warning,
        ps.warning_notes
      FROM payslips ps
      JOIN employees e ON ps.employee_id = e.id
      WHERE ps.payrun_id = ?
    `;

    const [payslips] = await pool.query(slipQuery, [id]);

    res.status(200).json({
      data: {
        ...payruns[0],
        employees,
        payslips
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Helper for Step 2 of payrun creation:
 * Queries all employees eligible for a payrun based on structure and overlapping period.
 */
async function getEligibleEmployees(req, res, next) {
  try {
    const { salary_structure_id, period_start, period_end } = req.query;

    if (!salary_structure_id || !period_start || !period_end) {
      const error = new Error('salary_structure_id, period_start, and period_end are required');
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    const query = `
      SELECT 
        e.id AS employee_id,
        e.employee_code,
        e.first_name,
        e.last_name,
        CONCAT(e.first_name, ' ', e.last_name) AS name,
        d.name AS department_name,
        c.id AS contract_id,
        c.wage,
        c.contract_type,
        c.start_date,
        c.end_date,
        c.status AS contract_status
      FROM employees e
      JOIN contracts c ON e.id = c.employee_id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE c.salary_structure_id = ?
        AND c.status = 'running'
        AND (c.start_date <= ? OR ? IS NULL)
        AND (? <= c.end_date OR c.end_date IS NULL)
        AND e.status = 'active'
      ORDER BY e.first_name ASC
    `;

    const [rows] = await pool.query(query, [
      salary_structure_id,
      period_end,
      period_end,
      period_start
    ]);

    res.status(200).json({ data: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a new payrun and freezes applicable contracts into `payrun_employees`.
 * 
 * WHY CONTRACT_ID IS FROZEN HERE (Schema Design Note #4):
 * An employee's contract might change or be renegotiated in subsequent months.
 * Freezing the resolved `contract_id` into `payrun_employees` at creation time guarantees
 * that payroll uses strictly the contract applicable to THIS period, even if the employee's
 * contract is updated later.
 */
async function createPayrun(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { name, salary_structure_id, period_start, period_end, employee_ids } = req.body;
    const userId = req.user.id;

    if (!name || !salary_structure_id || !period_start || !period_end || !Array.isArray(employee_ids) || employee_ids.length === 0) {
      const error = new Error('name, salary_structure_id, period_start, period_end, and a non-empty employee_ids array are required');
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    await connection.beginTransaction();

    // 1. Insert Payrun header
    const [payrunResult] = await connection.query(
      `INSERT INTO payruns (name, salary_structure_id, period_start, period_end, status, created_by)
       VALUES (?, ?, ?, ?, 'draft', ?)`,
      [name, salary_structure_id, period_start, period_end, userId]
    );

    const payrunId = payrunResult.insertId;

    // 2. Resolve and freeze applicable contract per employee
    for (const empId of employee_ids) {
      const contractQuery = `
        SELECT id FROM contracts
        WHERE employee_id = ?
          AND salary_structure_id = ?
          AND status = 'running'
          AND (start_date <= ? OR ? IS NULL)
          AND (? <= end_date OR end_date IS NULL)
        ORDER BY id DESC
        LIMIT 1
      `;

      const [contractRows] = await connection.query(contractQuery, [
        empId,
        salary_structure_id,
        period_end,
        period_end,
        period_start
      ]);

      if (contractRows.length === 0) {
        throw new Error(
          `Cannot create payrun: Employee #${empId} does not have an active running contract for structure #${salary_structure_id} in period ${period_start} to ${period_end}`
        );
      }

      const resolvedContractId = contractRows[0].id;

      // Freeze into payrun_employees
      // Schema reference: payrun_employees (payrun_id, employee_id, contract_id)
      await connection.query(
        'INSERT INTO payrun_employees (payrun_id, employee_id, contract_id) VALUES (?, ?, ?)',
        [payrunId, empId, resolvedContractId]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: 'Payrun created successfully with frozen contracts',
      data: {
        id: payrunId,
        name,
        salary_structure_id,
        period_start,
        period_end,
        status: 'draft',
        employees_count: employee_ids.length
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
 * Computes all payslips for a payrun.
 * Executes payrollEngine per payrun_employee, snapshots payslip lines, and transitions status to 'computed'.
 */
async function computePayrun(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    const [payruns] = await connection.query('SELECT * FROM payruns WHERE id = ?', [id]);
    if (payruns.length === 0) {
      const error = new Error(`Payrun #${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    const payrun = payruns[0];

    // Reject compute if already validated or paid
    if (payrun.status === 'validated' || payrun.status === 'paid') {
      const error = new Error(`Cannot recompute a payrun with status '${payrun.status}'`);
      error.status = 400;
      error.code = 'INVALID_PAYRUN_STATE';
      return next(error);
    }

    await connection.beginTransaction();

    // 1. Delete previous computed payslips and lines for idempotency
    // Schema note: ON DELETE CASCADE on payslips -> payslip_lines automatically clears lines
    await connection.query('DELETE FROM payslips WHERE payrun_id = ?', [id]);

    // 2. Fetch all frozen employee contracts for this payrun
    const [payrunEmployees] = await connection.query(
      'SELECT employee_id, contract_id FROM payrun_employees WHERE payrun_id = ?',
      [id]
    );

    let totalComputed = 0;

    for (const pe of payrunEmployees) {
      // Execute payroll engine
      const calculation = await computeEmployeeSalary({
        contractId: pe.contract_id,
        salaryStructureId: payrun.salary_structure_id,
        periodStart: payrun.period_start,
        periodEnd: payrun.period_end
      });

      // Insert payslip header
      // Schema reference: UNIQUE KEY uq_payslip_per_employee_period (employee_id, payrun_id)
      const [slipResult] = await connection.query(
        `INSERT INTO payslips (
          payrun_id, employee_id, contract_id, salary_structure_id,
          period_start, period_end, worked_days, basic_wage, gross_amount,
          net_amount, status, has_warning, warning_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'computed', ?, ?)`,
        [
          id,
          calculation.employee_id,
          calculation.contract_id,
          calculation.salary_structure_id,
          calculation.period_start,
          calculation.period_end,
          calculation.worked_days,
          calculation.basic_wage,
          calculation.gross_amount,
          calculation.net_amount,
          calculation.has_warning,
          calculation.warning_notes
        ]
      );

      const payslipId = slipResult.insertId;

      // Copy itemized payslip lines snapshot (Schema Note #3)
      if (Array.isArray(calculation.lines) && calculation.lines.length > 0) {
        const lineValues = calculation.lines.map((l) => [
          payslipId,
          l.salary_rule_id,
          l.code,
          l.name,
          l.category,
          l.sequence,
          l.amount
        ]);

        await connection.query(
          'INSERT INTO payslip_lines (payslip_id, salary_rule_id, code, name, category, sequence, amount) VALUES ?',
          [lineValues]
        );
      }

      totalComputed++;
    }

    // Update payrun status to 'computed'
    await connection.query(
      'UPDATE payruns SET status = "computed", computed_at = NOW() WHERE id = ?',
      [id]
    );

    await connection.commit();

    res.status(200).json({
      message: `Payrun computed successfully. ${totalComputed} payslips generated.`,
      data: {
        payrun_id: Number(id),
        status: 'computed',
        payslips_generated: totalComputed
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
 * Validates a computed payrun. Enforces state transition: computed -> validated.
 */
async function validatePayrun(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    const [payruns] = await connection.query('SELECT status FROM payruns WHERE id = ?', [id]);
    if (payruns.length === 0) {
      const error = new Error(`Payrun #${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    const currentStatus = payruns[0].status;
    if (currentStatus !== 'computed') {
      const error = new Error(`Cannot validate payrun with status '${currentStatus}'. Must be in 'computed' status.`);
      error.status = 400;
      error.code = 'INVALID_PAYRUN_STATE';
      return next(error);
    }

    await connection.beginTransaction();

    await connection.query(
      'UPDATE payruns SET status = "validated", validated_at = NOW() WHERE id = ?',
      [id]
    );

    // Update all child payslips to 'done'
    await connection.query(
      'UPDATE payslips SET status = "done" WHERE payrun_id = ?',
      [id]
    );

    await connection.commit();

    res.status(200).json({
      message: 'Payrun validated successfully. Payslips marked as done.',
      data: { payrun_id: Number(id), status: 'validated' }
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

/**
 * Marks a validated payrun as paid. Enforces state transition: validated -> paid.
 */
async function markPaid(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    const [payruns] = await connection.query('SELECT status FROM payruns WHERE id = ?', [id]);
    if (payruns.length === 0) {
      const error = new Error(`Payrun #${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    const currentStatus = payruns[0].status;
    if (currentStatus !== 'validated') {
      const error = new Error(`Cannot mark payrun as paid from status '${currentStatus}'. Must be in 'validated' status.`);
      error.status = 400;
      error.code = 'INVALID_PAYRUN_STATE';
      return next(error);
    }

    await connection.beginTransaction();

    await connection.query(
      'UPDATE payruns SET status = "paid", paid_at = NOW() WHERE id = ?',
      [id]
    );

    // Update all child payslips to 'paid'
    await connection.query(
      'UPDATE payslips SET status = "paid" WHERE payrun_id = ?',
      [id]
    );

    await connection.commit();

    res.status(200).json({
      message: 'Payrun marked as paid successfully. Financial records locked.',
      data: { payrun_id: Number(id), status: 'paid' }
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

module.exports = {
  listPayruns,
  getPayrunById,
  getEligibleEmployees,
  createPayrun,
  computePayrun,
  validatePayrun,
  markPaid
};
