/**
 * Payslip Document & PDF Generator Utility
 * 
 * RESPONSIBILITY:
 * Generates an executive, printable PDF/HTML payslip document with itemized earnings,
 * allowances, statutory deductions, gross wage, net payable, and employee details.
 * Includes interactive print/download action controls and automatic browser print execution.
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
  const netPay = Number(payslip.net_amount || totalEarnings - totalDeductions);
  const grossPay = Number(payslip.gross_amount || totalEarnings);

  const safeEmpCode = employee.employee_code || 'EMP';
  const safePeriod = `${payslip.period_start || ''}_${payslip.period_end || ''}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payslip - ${employee.employee_code} - ${employee.first_name} ${employee.last_name}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      color: #1e293b;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Floating Top Toolbar (Hidden during Print) */
    .top-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #1e1b4b;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .toolbar-title {
      font-weight: 700;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .toolbar-actions {
      display: flex;
      gap: 12px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      text-decoration: none;
    }
    .btn-print {
      background: #4f46e5;
      color: #ffffff;
    }
    .btn-print:hover {
      background: #4338ca;
    }
    .btn-download {
      background: #0ea5e9;
      color: #ffffff;
    }
    .btn-download:hover {
      background: #0284c7;
    }
    .btn-close {
      background: rgba(255,255,255,0.15);
      color: #ffffff;
    }
    .btn-close:hover {
      background: rgba(255,255,255,0.25);
    }

    /* Main Printable Sheet */
    .payslip-container {
      max-width: 800px;
      margin: 32px auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01);
      border: 1px solid #e2e8f0;
    }

    .header {
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand {
      font-size: 24px;
      font-weight: 900;
      color: #4f46e5;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
      font-weight: 500;
    }
    .payslip-title {
      text-align: right;
    }
    .payslip-title h2 {
      margin: 0;
      font-size: 20px;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .payslip-title p {
      margin: 4px 0 0;
      font-size: 12px;
      color: #64748b;
    }
    .status-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      margin-top: 4px;
    }

    .grid-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 24px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      font-size: 13px;
    }
    .card-title {
      font-weight: 700;
      color: #334155;
      margin-bottom: 12px;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .info-row:last-child {
      margin-bottom: 0;
    }
    .info-label {
      color: #64748b;
    }
    .info-value {
      font-weight: 600;
      color: #0f172a;
    }

    .tables-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 24px;
    }
    .table-box {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th {
      background: #f1f5f9;
      padding: 10px 12px;
      text-align: left;
      font-weight: 700;
      color: #475569;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .amount {
      text-align: right;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 600;
    }

    .summary-card {
      margin-top: 24px;
      background: #eef2ff;
      border: 2px solid #c7d2fe;
      border-radius: 10px;
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .summary-label {
      font-size: 13px;
      color: #475569;
      margin-bottom: 4px;
    }
    .summary-val {
      font-weight: 700;
      color: #1e293b;
    }
    .net-title {
      font-size: 12px;
      color: #4f46e5;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .net-amount {
      font-size: 28px;
      font-weight: 900;
      color: #3730a3;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    .warning-box {
      margin-top: 20px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 14px;
      font-size: 12px;
      color: #b45309;
    }

    .footer {
      margin-top: 36px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 20px;
      line-height: 1.5;
    }

    /* Print Styles */
    @media print {
      .no-print {
        display: none !important;
      }
      body {
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .payslip-container {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 20px !important;
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
      @page {
        size: A4 portrait;
        margin: 15mm;
      }
    }
  </style>
</head>
<body>

  <!-- Floating Action Bar (Hidden in Print) -->
  <div class="top-toolbar no-print">
    <div class="toolbar-title">
      <span>📄 PeoplePay360 Salary Payslip</span>
      <span style="opacity: 0.6; font-size: 12px;">(${employee.employee_code} • ${employee.first_name} ${employee.last_name})</span>
    </div>
    <div class="toolbar-actions">
      <button class="btn btn-print" onclick="window.print()">
        🖨️ Print / Save as PDF
      </button>
      <button class="btn btn-download" onclick="downloadPayslipHtml()">
        ⬇️ Download File
      </button>
      <button class="btn btn-close" onclick="window.close()">
        ✕ Close
      </button>
    </div>
  </div>

  <!-- Printable Document Sheet -->
  <div class="payslip-container" id="printable-payslip">
    <div class="header">
      <div>
        <div class="brand">PeoplePay360</div>
        <div class="brand-sub">HRMS & Intelligent Payroll Suite</div>
      </div>
      <div class="payslip-title">
        <h2>OFFICIAL PAYSLIP</h2>
        <p>Period: <strong>${payslip.period_start}</strong> to <strong>${payslip.period_end}</strong></p>
        <span class="status-badge">${payslip.status}</span>
      </div>
    </div>

    <!-- Employee & Structure Meta -->
    <div class="grid-info">
      <div class="card">
        <div class="card-title">Employee Details</div>
        <div class="info-row"><span class="info-label">Employee Name:</span><span class="info-value">${employee.first_name} ${employee.last_name}</span></div>
        <div class="info-row"><span class="info-label">Employee Code:</span><span class="info-value">${employee.employee_code}</span></div>
        <div class="info-row"><span class="info-label">Department:</span><span class="info-value">${employee.department_name || 'General Operations'}</span></div>
        <div class="info-row"><span class="info-label">Job Position:</span><span class="info-value">${employee.job_title || 'Staff'}</span></div>
      </div>

      <div class="card">
        <div class="card-title">Contract & Payrun Info</div>
        <div class="info-row"><span class="info-label">Salary Structure:</span><span class="info-value">${payslip.structure_name || 'Standard Salary Structure'}</span></div>
        <div class="info-row"><span class="info-label">Base Wage:</span><span class="info-value">$${Number(payslip.basic_wage || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        <div class="info-row"><span class="info-label">Worked Days:</span><span class="info-value">${payslip.worked_days || 0} Day(s)</span></div>
        <div class="info-row"><span class="info-label">Payrun Batch:</span><span class="info-value">${payslip.payrun_name || `#${payslip.payrun_id}`}</span></div>
      </div>
    </div>

    <!-- Itemized Tables -->
    <div class="tables-container">
      <div class="table-box">
        <table>
          <thead>
            <tr>
              <th>Earnings & Allowances</th>
              <th class="amount">Amount ($)</th>
            </tr>
          </thead>
          <tbody>
            ${earnings.length === 0 ? '<tr><td colspan="2" style="color: #94a3b8; text-align: center;">No itemized allowances</td></tr>' : earnings.map((l) => `
              <tr>
                <td>${l.name} <span style="font-size: 10px; color: #64748b; font-family: monospace;">(${l.code})</span></td>
                <td class="amount">$${Number(l.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="table-box">
        <table>
          <thead>
            <tr>
              <th>Deductions & Contributions</th>
              <th class="amount">Amount ($)</th>
            </tr>
          </thead>
          <tbody>
            ${deductions.length === 0 ? '<tr><td colspan="2" style="color: #94a3b8; text-align: center;">No statutory deductions</td></tr>' : deductions.map((l) => `
              <tr>
                <td>${l.name} <span style="font-size: 10px; color: #64748b; font-family: monospace;">(${l.code})</span></td>
                <td class="amount">-$${Number(l.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Summary Box -->
    <div class="summary-card">
      <div>
        <div class="summary-label">Gross Earnings: <span class="summary-val">$${grossPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        <div class="summary-label">Total Deductions: <span class="summary-val">-$${totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
      </div>
      <div style="text-align: right;">
        <div class="net-title">Net Payable Salary</div>
        <div class="net-amount">$${netPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
    </div>

    ${payslip.has_warning ? `
      <div class="warning-box">
        <strong>⚠️ Payroll Anomaly Notice:</strong> ${payslip.warning_notes || 'Attendance or contract anomaly recorded during computation.'}
      </div>
    ` : ''}

    <div class="footer">
      This is an authentic computer-generated salary payslip issued by PeoplePay360 HR & Payroll Engine.<br>
      Generated on ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} • No physical signature required.
    </div>
  </div>

  <script>
    function downloadPayslipHtml() {
      const filename = "payslip-${safeEmpCode}-${safePeriod}.html";
      const blob = new Blob([document.documentElement.outerHTML], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // Auto-trigger browser print dialog on load
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;
}

module.exports = {
  generatePayslipHtml
};
