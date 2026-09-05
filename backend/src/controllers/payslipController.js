/**
 * Employee Payslips Controller
 * 
 * RESPONSIBILITY:
 * Handles querying historical computed payslips, retrieving itemized payslip lines,
 * and generating printable PDF/HTML payslip documents for employee viewing.
 * 
 * NOT RESPONSIBLE FOR:
 * Modifying historical lines (immutable once computed per Schema Design Note #3).
 */

const pool = require('../config/db');
const { generatePayslipHtml } = require('../utils/pdfGenerator');

async function canViewAllPayslips(roleId) {
  const [rows] = await pool.query(
    `SELECT 1 FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.id
     WHERE rp.role_id = ? AND (p.code = 'payroll.payrun.manage' OR p.code = 'system.admin') LIMIT 1`,
    [roleId]
  );
  return rows.length > 0;
}

/**
 * Lists payslips with pagination, filtering, and RBAC scoping.
 */
async function listPayslips(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const { payrun_id, employee_id, status } = req.query;

    const userRole = req.user.role_id;
    const [permRows] = await pool.query(
      `SELECT p.code FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.id 
       WHERE rp.role_id = ? AND (p.code = 'payroll.payrun.manage' OR p.code = 'system.admin')`,
      [userRole]
    );
    const canViewAll = permRows.length > 0;

    let whereConditions = [];
    let queryParams = [];

    if (!canViewAll) {
      if (!req.user.employee_id) {
        return res.status(200).json({ data: [], pagination: { total: 0, page, limit, totalPages: 0 } });
      }
      whereConditions.push('p.employee_id = ?');
      queryParams.push(req.user.employee_id);
    } else if (employee_id) {
      whereConditions.push('p.employee_id = ?');
      queryParams.push(employee_id);
    }

    if (payrun_id) {
      whereConditions.push('p.payrun_id = ?');
      queryParams.push(payrun_id);
    }

    if (status) {
      whereConditions.push('p.status = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM payslips p ${whereClause}`;
    const [[{ total }]] = await pool.query(countSql, queryParams);

    const listSql = `
      SELECT 
        p.id,
        p.payrun_id,
        py.name AS payrun_name,
        p.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.employee_code,
        d.name AS department_name,
        p.period_start,
        p.period_end,
        p.basic_wage,
        p.gross_amount,
        p.net_amount,
        p.worked_days,
        p.status,
        p.has_warning,
        p.warning_notes,
        p.created_at
      FROM payslips p
      JOIN payruns py ON p.payrun_id = py.id
      JOIN employees e ON p.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereClause}
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
 * Gets detailed payslip by ID with all itemized snapshot lines.
 */
async function getPayslipById(req, res, next) {
  try {
    const { id } = req.params;
    const viewAll = await canViewAllPayslips(req.user.role_id);

    const query = `
      SELECT 
        p.id,
        p.payrun_id,
        py.name AS payrun_name,
        p.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.employee_code,
        e.email AS employee_email,
        d.name AS department_name,
        jp.title AS job_title,
        p.contract_id,
        c.wage AS contract_wage,
        p.salary_structure_id,
        ss.name AS structure_name,
        p.period_start,
        p.period_end,
        p.basic_wage,
        p.gross_amount,
        p.net_amount,
        p.worked_days,
        p.status,
        p.has_warning,
        p.warning_notes,
        p.created_at
      FROM payslips p
      JOIN payruns py ON p.payrun_id = py.id
      JOIN employees e ON p.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN job_positions jp ON e.job_position_id = jp.id
      JOIN contracts c ON p.contract_id = c.id
      JOIN salary_structures ss ON p.salary_structure_id = ss.id
      WHERE p.id = ?${viewAll ? '' : ' AND p.employee_id = ?'}
    `;

    const [payslips] = await pool.query(query, viewAll ? [id] : [id, req.user.employee_id]);
    if (payslips.length === 0) {
      const error = new Error(`Payslip #${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    const linesQuery = `
      SELECT id, salary_rule_id, code, name, category, sequence, amount
      FROM payslip_lines
      WHERE payslip_id = ?
      ORDER BY sequence ASC
    `;

    const [lines] = await pool.query(linesQuery, [id]);

    res.status(200).json({
      data: {
        ...payslips[0],
        lines
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Generates and streams printable payslip HTML/PDF document.
 */
async function getPayslipPdf(req, res, next) {
  try {
    const { id } = req.params;
    const viewAll = await canViewAllPayslips(req.user.role_id);

    const [payslips] = await pool.query(
      `SELECT p.*, py.name AS payrun_name, ss.name AS structure_name,
              e.first_name, e.last_name, e.employee_code, e.email,
              d.name AS department_name, jp.title AS job_title
       FROM payslips p
       JOIN payruns py ON p.payrun_id = py.id
       JOIN employees e ON p.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN job_positions jp ON e.job_position_id = jp.id
       JOIN salary_structures ss ON p.salary_structure_id = ss.id
      WHERE p.id = ?${viewAll ? '' : ' AND p.employee_id = ?'}`,
          viewAll ? [id] : [id, req.user.employee_id]
    );

    if (payslips.length === 0) {
      const error = new Error(`Payslip #${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    const [lines] = await pool.query(
      'SELECT * FROM payslip_lines WHERE payslip_id = ? ORDER BY sequence ASC',
      [id]
    );

    const payslip = payslips[0];
    const employee = {
      first_name: payslip.first_name,
      last_name: payslip.last_name,
      employee_code: payslip.employee_code,
      department_name: payslip.department_name,
      job_title: payslip.job_title
    };

    const htmlDoc = generatePayslipHtml({ payslip, employee, lines });

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="payslip-${payslip.employee_code}-${payslip.period_start}.html"`);
    res.send(htmlDoc);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listPayslips,
  getPayslipById,
  getPayslipPdf
};
