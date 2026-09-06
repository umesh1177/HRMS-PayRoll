/**
 * Executive Dashboard Analytics Controller
 * 
 * RESPONSIBILITY:
 * Serves single-call comprehensive dashboard summaries using database VIEWs (vw_payroll_summary,
 * vw_attendance_overview, vw_monthly_payroll_trend, vw_time_off_summary) without caching,
 * ensuring real-time visibility across headcount, payroll cost, attendance health, and anomalies.
 * 
 * NOT RESPONSIBLE FOR:
 * Direct CRUD modifications to underlying domain entities.
 */

const pool = require('../config/db');
const { getDataScope } = require('../utils/accessScope');

/**
 * Retrieves the comprehensive executive dashboard summary in ONE round-trip.
 * 
 * @param {import('express').Request} req - Express request with query params: { period, department_id, employee_type }
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
 * @returns {Promise<void>} Aggregated dashboard payload
 * @sideEffects Queries database views and tables
 */
async function getSummary(req, res, next) {
  try {
    const { period, department_id, employee_type } = req.query;
    const dataScope = await getDataScope(req.user);
    const scopedDepartmentId = dataScope.isAdmin ? department_id : (dataScope.departmentId || 0);

    // 1. High-level entity counters (active employees, active running contracts)
    let empWhere = "WHERE status = 'active'";
    const empParams = [];
    if (scopedDepartmentId) {
      empWhere += ' AND department_id = ?';
      empParams.push(scopedDepartmentId);
    }
    const empCountPromise = pool.query(`SELECT COUNT(*) as count FROM employees ${empWhere}`, empParams);

    let contractWhere = "WHERE status = 'running'";
    const contractParams = [];
    if (scopedDepartmentId) {
      contractWhere += ' AND department_id = ?';
      contractParams.push(scopedDepartmentId);
    }
    if (employee_type) {
      contractWhere += ' AND contract_type = ?';
      contractParams.push(employee_type);
    }
    const contractCountPromise = pool.query(`SELECT COUNT(*) as count FROM contracts ${contractWhere}`, contractParams);

    // 2. Payslip Status Breakdown
    let slipWhere = 'WHERE 1=1';
    const slipParams = [];
    let slipJoin = '';
    if (!dataScope.isAdmin) {
      slipJoin = ' JOIN employees se ON se.id = p.employee_id';
      slipWhere += ' AND se.department_id = ?';
      slipParams.push(scopedDepartmentId);
    }
    if (period) {
      slipWhere += ' AND DATE_FORMAT(p.period_start, "%Y-%m") = ?';
      slipParams.push(period);
    }
    const slipStatusPromise = pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(p.status = 'draft') AS draft_count,
        SUM(p.status = 'computed') AS computed_count,
        SUM(p.status = 'done') AS done_count,
        SUM(p.status = 'paid') AS paid_count,
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.net_amount ELSE 0 END), 0) AS total_net_paid,
        COALESCE(SUM(p.gross_amount), 0) AS total_gross_amount
      FROM payslips p
      ${slipJoin}
      ${slipWhere}
    `, slipParams);

    // 3. Salary Distribution by Department (from vw_payroll_summary)
    // Schema reference: vw_payroll_summary
    let deptPayrollWhere = 'WHERE 1=1';
    const deptPayrollParams = [];
    if (period) {
      deptPayrollWhere += ' AND DATE_FORMAT(period_start, "%Y-%m") = ?';
      deptPayrollParams.push(period);
    }
    if (scopedDepartmentId) {
      deptPayrollWhere += ' AND department_id = ?';
      deptPayrollParams.push(scopedDepartmentId);
    }
    const deptPayrollPromise = pool.query(`
      SELECT 
        COALESCE(department_id, 0) AS department_id,
        COALESCE(department_name, 'Unassigned') AS department_name,
        SUM(payslip_count) AS payslip_count,
        SUM(total_net_paid) AS total_net_paid,
        AVG(avg_salary) AS avg_salary,
        SUM(warning_count) AS warning_count
      FROM vw_payroll_summary
      ${deptPayrollWhere}
      GROUP BY department_id, department_name
      ORDER BY total_net_paid DESC
    `, deptPayrollParams);

    // 4. Monthly Net Salary Trend (from vw_monthly_payroll_trend)
    // Schema reference: vw_monthly_payroll_trend
    const monthlyTrendScope = dataScope.isAdmin ? '' : 'WHERE e.department_id = ?';
    const monthlyTrendParams = dataScope.isAdmin ? [] : [scopedDepartmentId];
    const monthlyTrendPromise = pool.query(`
      SELECT
        DATE_FORMAT(py.period_start, '%Y-%m') AS month_key,
        DATE_FORMAT(py.period_start, '%b %Y') AS month_label,
        COALESCE(SUM(p.gross_amount), 0) AS total_gross,
        COALESCE(SUM(p.net_amount), 0) AS total_net,
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.net_amount ELSE 0 END), 0) AS total_paid_net,
        COUNT(p.id) AS payslip_count
      FROM payslips p
      JOIN payruns py ON p.payrun_id = py.id
      JOIN employees e ON e.id = p.employee_id
      ${monthlyTrendScope}
      GROUP BY DATE_FORMAT(py.period_start, '%Y-%m'), DATE_FORMAT(py.period_start, '%b %Y')
      ORDER BY month_key DESC
      LIMIT 12
    `, monthlyTrendParams);

    // 5. Attendance Health Overview (from vw_attendance_overview)
    // Schema reference: vw_attendance_overview
    const attendanceScope = dataScope.isAdmin ? '' : 'WHERE e.department_id = ?';
    const attendanceParams = dataScope.isAdmin ? [] : [scopedDepartmentId];
    const attendancePromise = pool.query(`
      SELECT 
        COUNT(DISTINCT a.employee_id) AS active_employees_logged,
        COALESCE(SUM(a.present_count), 0) AS present_count,
        COALESCE(SUM(a.late_count), 0) AS late_count,
        COALESCE(SUM(a.absent_count), 0) AS absent_count,
        COALESCE(SUM(a.overtime_count), 0) AS overtime_count,
        COALESCE(SUM(a.missing_checkout_count), 0) AS missing_checkout_count
      FROM vw_attendance_overview a
      JOIN employees e ON e.id = a.employee_id
      ${attendanceScope}
    `, attendanceParams);

    // 6. Time Off Summary (from vw_time_off_summary)
    // Schema reference: vw_time_off_summary
    const timeOffScope = dataScope.isAdmin ? '' : 'WHERE e.department_id = ?';
    const timeOffParams = dataScope.isAdmin ? [] : [scopedDepartmentId];
    const timeOffPromise = pool.query(`
      SELECT
        COUNT(*) AS total_requests,
        COALESCE(SUM(r.status = 'submitted'), 0) AS pending_approvals,
        COALESCE(SUM(r.status = 'approved'), 0) AS approved_requests,
        COALESCE(SUM(r.status = 'refused'), 0) AS refused_requests,
        COALESCE(SUM(r.duration), 0) AS total_leave_days
      FROM time_off_requests r
      JOIN employees e ON e.id = r.employee_id
      ${timeOffScope}
    `, timeOffParams);

    // 7. Flagged Warnings List (payslips with has_warning = TRUE)
    const warningsPromise = pool.query(`
      SELECT 
        p.id AS payslip_id,
        p.payrun_id,
        py.name AS payrun_name,
        p.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.employee_code,
        d.name AS department_name,
        p.period_start,
        p.period_end,
        p.warning_notes
      FROM payslips p
      JOIN payruns py ON p.payrun_id = py.id
      JOIN employees e ON p.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE p.has_warning = TRUE
        ${dataScope.isAdmin ? '' : 'AND e.department_id = ?'}
      ORDER BY p.id DESC
      LIMIT 20
    `, dataScope.isAdmin ? [] : [scopedDepartmentId]);

    // Execute all analytical queries in parallel
    const [
      [[empRow]],
      [[contractRow]],
      [[slipStatusRow]],
      [deptPayrollRows],
      [monthlyTrendRows],
      [[attendanceRow]],
      [[timeOffRow]],
      [warningsRows]
    ] = await Promise.all([
      empCountPromise,
      contractCountPromise,
      slipStatusPromise,
      deptPayrollPromise,
      monthlyTrendPromise,
      attendancePromise,
      timeOffPromise,
      warningsPromise
    ]);

    // Reverse monthly trend to display chronologically (Oldest -> Newest)
    const trendChronological = (monthlyTrendRows || []).slice().reverse();

    // Calculate derived KPI metrics
    const totalPaid = Number(slipStatusRow?.total_net_paid || 0);
    const paidCount = Number(slipStatusRow?.paid_count || 0);
    const totalSlips = Number(slipStatusRow?.total || 0);
    const avgSalary = paidCount > 0 ? (totalPaid / paidCount) : (totalSlips > 0 ? (Number(slipStatusRow?.total_gross_amount || 0) / totalSlips) : 0);

    const presCount = Number(attendanceRow?.present_count || 0);
    const lateCount = Number(attendanceRow?.late_count || 0);
    const absCount = Number(attendanceRow?.absent_count || 0);
    const totalAttLogs = presCount + lateCount + absCount;
    const attendanceRate = totalAttLogs > 0 ? Math.round(((presCount + lateCount) / totalAttLogs) * 100) : 100;

    res.status(200).json({
      // KPI metric cards
      totalEmployees: Number(empRow?.count || 0),
      activeContracts: Number(contractRow?.count || 0),
      pendingTimeOff: Number(timeOffRow?.pending_approvals || 0),
      total_net_paid: totalPaid,
      total_gross_amount: Number(slipStatusRow?.total_gross_amount || 0),
      latestPayrunTotal: totalPaid,
      payslip_count: totalSlips,
      avg_salary: Number(avgSalary.toFixed(2)),
      attendance_rate: attendanceRate,

      // Breakdown distributions
      payslip_status_counts: {
        total: totalSlips,
        draft: Number(slipStatusRow?.draft_count || 0),
        computed: Number(slipStatusRow?.computed_count || 0),
        done: Number(slipStatusRow?.done_count || 0),
        paid: paidCount
      },
      salary_by_department: deptPayrollRows || [],
      monthly_net_salary_trend: trendChronological,
      attendance_overview: {
        active_employees: Number(attendanceRow?.active_employees_logged || 0),
        present: Number(attendanceRow?.present_count || 0),
        late: Number(attendanceRow?.late_count || 0),
        absent: Number(attendanceRow?.absent_count || 0),
        overtime: Number(attendanceRow?.overtime_count || 0),
        missing_checkout: Number(attendanceRow?.missing_checkout_count || 0)
      },
      time_off_overview: {
        total_requests: Number(timeOffRow?.total_requests || 0),
        pending_approvals: Number(timeOffRow?.pending_approvals || 0),
        approved: Number(timeOffRow?.approved_requests || 0),
        refused: Number(timeOffRow?.refused_requests || 0),
        total_days: Number(timeOffRow?.total_leave_days || 0)
      },
      warnings_count: warningsRows.length,
      warnings: warningsRows || []
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSummary
};
