/**
 * Attendance Records List Component
 * 
 * RESPONSIBILITY:
 * Renders the tabular log of employee daily check-in and check-out timestamps,
 * worked hours, attendance status chips, manual correction badges, and triggers edit modals.
 * 
 * NOT RESPONSIBLE FOR:
 * Live punch actions (handled by AttendanceWidget).
 */

import React from 'react';
import { Typography, Chip, IconButton, Tooltip } from '@material-tailwind/react';
import { PencilSquareIcon, ShieldCheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import DataTable from '../common/DataTable';
import { useAuth } from '../../context/AuthContext';

/**
 * Attendance List component.
 * 
 * @param {object} props - Component props
 * @param {Array<object>} props.records - Attendance logs
 * @param {boolean} props.loading - Loading state
 * @param {number} props.page - Current page
 * @param {number} props.totalPages - Total pages
 * @param {Function} props.onPageChange - Page change callback
 * @param {Function} props.onEdit - Manual edit callback (record: object) => void
 * @param {Function} [props.onDelete] - Manual delete callback (record: object) => void
 * @param {React.ReactNode} [props.actionButton] - Header action
 * @returns {JSX.Element} Paginated attendance data table
 */
export default function AttendanceList({
  records = [],
  loading = false,
  page = 1,
  totalPages = 1,
  onPageChange,
  onEdit,
  onDelete,
  actionButton
}) {
  const { hasPermission } = useAuth();
  const canManageAll = hasPermission('attendance.manage_all');

  const formatDateTime = (dt) => {
    if (!dt) return '-';
    const date = new Date(dt);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const employeeColumn = {
      key: 'employee_name',
      label: 'Employee',
      render: (row) => (
        <div>
          <p className="font-semibold text-sm text-blue-gray-800">{row.employee_name}</p>
          <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
            {row.employee_code}
          </span>
        </div>
      )
    };
  const columns = [
    {
      key: 'check_in',
      label: 'Check In',
      render: (row) => (
        <span className="font-medium text-xs text-blue-gray-800">
          {formatDateTime(row.check_in)}
        </span>
      )
    },
    {
      key: 'check_out',
      label: 'Check Out',
      render: (row) => (
        <span className="font-medium text-xs text-blue-gray-800">
          {formatDateTime(row.check_out)}
        </span>
      )
    },
    {
      key: 'worked_hours',
      label: 'Worked Hours',
      render: (row) => (
        <span className="font-bold font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
          {row.worked_hours !== null ? `${row.worked_hours} hrs` : 'In Progress'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const colorMap = {
          present: 'green',
          late: 'amber',
          overtime: 'indigo',
          absent: 'red',
          missing_checkout: 'blue-gray'
        };
        return (
          <Chip
            size="sm"
            variant="ghost"
            value={row.status?.replace('_', ' ')}
            color={colorMap[row.status] || 'blue-gray'}
            className="w-fit capitalize font-semibold text-[11px]"
          />
        );
      }
    },
    {
      key: 'is_manual_edit',
      label: 'Audit',
      render: (row) => (
        row.is_manual_edit ? (
          <Tooltip content={`Manually edited by: ${row.edited_by_email || 'HR Admin'}`}>
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium cursor-help">
              <ShieldCheckIcon className="h-3.5 w-3.5" /> Edited
            </span>
          </Tooltip>
        ) : (
          <span className="text-[11px] text-blue-gray-400">System</span>
        )
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        canManageAll && (
          <div className="flex items-center gap-1">
            <Tooltip content="Correct Record">
              <IconButton
                variant="text"
                color="blue-gray"
                size="sm"
                onClick={() => onEdit(row)}
              >
                <PencilSquareIcon className="h-4 w-4 text-blue-gray-600" />
              </IconButton>
            </Tooltip>
            {onDelete && (
              <Tooltip content="Delete Attendance">
                <IconButton
                  variant="text"
                  color="red"
                  size="sm"
                  onClick={() => onDelete(row)}
                >
                  <TrashIcon className="h-4 w-4 text-red-500" />
                </IconButton>
              </Tooltip>
            )}
          </div>
        )
      )
    }
  ];
  if (canManageAll) columns.unshift(employeeColumn);

  return (
    <DataTable
      title="Attendance Logs"
      subtitle="Workforce punch-in/out records, worked hours, and manual HR adjustments"
      columns={columns}
      data={records}
      loading={loading}
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      actionButton={actionButton}
    />
  );
}
