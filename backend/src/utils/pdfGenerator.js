/**
 * Payslip Document & PDF Generator Utility
 * 
 * RESPONSIBILITY:
 * Generates an executive, printable PDF/HTML payslip document with itemized earnings,
 * allowances, statutory deductions, gross wage, net payable, and employee details.
 * 
 * NOT RESPONSIBLE FOR:
 * Computing salary rule math (delegated to services/payrollEngine.js).
 */

/**
 * Generates structured HTML markup for the official employee payslip.
 * 
 * @param {object} payslipData - Payslip and employee data
 * @param {object} payslipData.payslip - Payslip record
 * @param {object} payslipData.employee - Employee metadata
 * @param {Array<object>} payslipData.lines - Itemized payslip lines
 * @returns {string} Styled HTML document string ready for printing/PDF conversion
 */
function generatePayslipHtml({ payslip, employee, lines }) {
  const earnings = lines.filter((l) => l.category === 'basic' || l.category === 'allowance' || l.category === 'gross');
  const deductions = lines.filter((l) => l.category === 'deduction' || l.category === 'contribution');

  const totalEarnings = earnings
    .filter((l) => l.category !== 'gross')
    .reduce((sum, l) => sum + Number(l.amount || 0), 0);

  const totalDeductions = deductions.reduce((sum, l) => sum + Number(l.amount || 0), 0);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payslip - ${employee.employee_code} - ${payslip.period_start} to ${payslip.period_end}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 40px; color: #1e293b; background: #fff; }
    .header { border-bottom: 2px solid #4f46e5; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .brand { font-size: 24px; font-weight: 800; color: #4f46e5; }
    .brand-sub { font-size: 12px; color: #64748b; }
    .payslip-title { text-align: right; }
    .payslip-title h2 { margin: 0; font-size: 20px; color: #0f172a; }
    .payslip-title p { margin: 4px 0 0; font-size: 12px; color: #64748b; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 13px; }
    .card-title { font-weight: 700; color: #334155; margin-bottom: 8px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .info-label { color: #64748b; }
    .info-value { font-weight: 600; color: #0f172a; }
    .tables-container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f1f5f9; padding: 10px; text-align: left; font-weight: 700; color: #475569; border-bottom: 1px solid #cbd5e1; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
    .amount { text-align: right; font-family: monospace; font-weight: 600; }
    .summary-card { margin-top: 24px; background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
    .net-amount { font-size: 26px; font-weight: 800; color: #4338ca; font-family: monospace; }
    .warning-box { margin-top: 20px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px; font-size: 12px; color: #b45309; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">PeoplePay360</div>
      <div class="brand-sub">Enterprise HR & Payroll Platform</div>
    </div>
    <div class="payslip-title">
      <h2>SALARY PAYSLIP</h2>
      <p>Period: ${payslip.period_start} to ${payslip.period_end}</p>
      <p>Status: <strong>${payslip.status.toUpperCase()}</strong></p>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">Employee Information</div>
      <div class="info-row"><span class="info-label">Name:</span><span class="info-value">${employee.first_name} ${employee.last_name}</span></div>
      <div class="info-row"><span class="info-label">Employee Code:</span><span class="info-value">${employee.employee_code}</span></div>
      <div class="info-row"><span class="info-label">Department:</span><span class="info-value">${employee.department_name || 'N/A'}</span></div>
      <div class="info-row"><span class="info-label">Job Position:</span><span class="info-value">${employee.job_title || 'N/A'}</span></div>
    </div>
    <div class="card">
      <div class="card-title">Contract & Attendance</div>
      <div class="info-row"><span class="info-label">Salary Structure:</span><span class="info-value">${payslip.structure_name || 'Standard Structure'}</span></div>
      <div class="info-row"><span class="info-label">Basic Wage:</span><span class="info-value">$${Number(payslip.basic_wage || 0).toLocaleString()}</span></div>
      <div class="info-row"><span class="info-label">Worked Days:</span><span class="info-value">${payslip.worked_days || 0} days</span></div>
      <div class="info-row"><span class="info-label">Payrun:</span><span class="info-value">${payslip.payrun_name || `#${payslip.payrun_id}`}</span></div>
    </div>
  </div>

  <div class="tables-container">
    <div>
      <table>
        <thead>
          <tr><th>Earnings / Allowances</th><th class="amount">Amount ($)</th></tr>
        </thead>
        <tbody>
          ${earnings.map((l) => `
            <tr>
              <td>${l.name} (${l.code})</td>
              <td class="amount">$${Number(l.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div>
      <table>
        <thead>
          <tr><th>Deductions</th><th class="amount">Amount ($)</th></tr>
        </thead>
        <tbody>
          ${deductions.map((l) => `
            <tr>
              <td>${l.name} (${l.code})</td>
              <td class="amount">-$${Number(l.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          `).join('')}
          ${deductions.length === 0 ? '<tr><td colspan="2" style="color: #94a3b8; text-align: center;">No deductions</td></tr>' : ''}
        </tbody>
      </table>
    </div>
  </div>

  <div class="summary-card">
    <div>
      <div style="font-size: 13px; color: #475569;">Gross Earnings: <strong>$${Number(payslip.gross_amount || totalEarnings).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
      <div style="font-size: 13px; color: #475569; margin-top: 4px;">Total Deductions: <strong>-$${Number(totalDeductions).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 12px; color: #6366f1; font-weight: 700; text-transform: uppercase;">Net Payable Salary</div>
      <div class="net-amount">$${Number(payslip.net_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
    </div>
  </div>

  ${payslip.has_warning ? `
    <div class="warning-box">
      <strong>⚠️ Payroll Warning:</strong> ${payslip.warning_notes || 'Attendance or contract anomaly recorded during computation.'}
    </div>
  ` : ''}

  <div class="footer">
    This is a computer-generated salary payslip issued by PeoplePay360 on ${new Date().toLocaleDateString()}. No physical signature is required.
  </div>
</body>
</html>
  `;
}

module.exports = {
  generatePayslipHtml
};
