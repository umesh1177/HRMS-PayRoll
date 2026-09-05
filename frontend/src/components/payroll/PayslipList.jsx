/**
 * Payslips List Table Component
 * 
 * RESPONSIBILITY:
 * Renders the tabular directory of computed and paid employee payslips,
 * supports filtering and pagination, and provides action triggers to view detailed lines or print PDFs.
 * 
 * NOT RESPONSIBLE FOR:
 * Computing mathematical salary formulas.
 */

import React from 'react';
import { Typography, Chip, IconButton, Tooltip, Button } from '@material-tailwind/react';
import { EyeIcon, PrinterIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import DataTable from '../common/DataTable';
import { useAuth } from '../../context/AuthContext';
import { formatDateRange, formatCurrency } from '../../utils/formatters';

/**
 * Payslip List Component.
 * 
 * @param {object} props - Component props
 * @param {Array<object>} props.payslips - Payslips array
 * @param {boolean} props.loading - Loading state
 * @param {number} props.page - Current page
 * @param {number} props.totalPages - Total pages
 * @param {Function} props.onPageChange - Page callback
 * @param {Function} props.onView - View payslip lines callback (slip: object) => void
 * @param {Function} [props.onPrintPdf] - Download/Print PDF callback (slip: object) => void
 * @returns {JSX.Element} Paginated payslips table
 */
export default function PayslipList({
  payslips = [],
  loading = false,
  page = 1,
  totalPages = 1,
  onPageChange,
  onView,
  onPrintPdf
}) {
  const { hasPermission } = useAuth();
  const canView = hasPermission('payroll.payslip.view');

  const columns = [
    {
      key: 'employee_name',
      label: 'Employee',
      render: (row) => (
        <div>
          <p className="font-bold text-sm text-blue-gray-800">{row.employee_name}</p>
          <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
            {row.employee_code}
          </span>
        </div>
      )
    },
    {
      key: 'payrun_name',
      label: 'Payrun / Period',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-blue-gray-800">{row.payrun_name}</p>
          <p className="text-xs text-blue-gray-400">{formatDateRange(row.period_start, row.period_end)}</p>
        </div>
      )
    },
    {
      key: 'basic_wage',
      label: 'Basic Wage',
      render: (row) => (
        <span className="font-mono text-xs text-blue-gray-700">
          {formatCurrency(row.basic_wage)}
        </span>
      )
    },
    {
      key: 'gross_amount',
      label: 'Gross Amount',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-blue-gray-800">
          {formatCurrency(row.gross_amount)}
        </span>
      )
    },
    {
      key: 'net_amount',
      label: 'Net Payable',
      render: (row) => (
        <span className="font-mono font-bold text-sm text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
          {formatCurrency(row.net_amount)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const colorMap = {
          draft: 'blue-gray',
          computed: 'indigo',
          done: 'blue',
          paid: 'green'
        };
        return (
          <Chip
            size="sm"
            variant="ghost"
            value={row.status}
            color={colorMap[row.status] || 'blue-gray'}
            className="w-fit capitalize font-bold text-[11px]"
          />
        );
      }
    },
    {
      key: 'warnings',
      label: 'Flags',
      render: (row) => (
        row.has_warning ? (
          <Tooltip content={row.warning_notes || 'Attendance or contract anomaly'}>
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold cursor-help">
              <ExclamationTriangleIcon className="h-3.5 w-3.5" /> Warning
            </span>
          </Tooltip>
        ) : (
          <span className="text-xs text-green-700 font-medium">✓ Clean</span>
        )
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Tooltip content="View Itemized Breakdown">
            <IconButton
              variant="text"
              color="indigo"
              size="sm"
              onClick={() => onView(row)}
            >
              <EyeIcon className="h-4 w-4" />
            </IconButton>
          </Tooltip>

          {onPrintPdf && (
            <Tooltip content="Print / Download PDF">
              <IconButton
                variant="text"
                color="blue-gray"
                size="sm"
                onClick={() => onPrintPdf(row)}
              >
                <PrinterIcon className="h-4 w-4 text-blue-gray-600" />
              </IconButton>
            </Tooltip>
          )}
        </div>
      )
    }
  ];

  return (
    <DataTable
      title="Employee Payslips Directory"
      subtitle="Complete register of monthly computed payslips, line items, and audit statuses"
      columns={columns}
      data={payslips}
      loading={loading}
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
    />
  );
}
