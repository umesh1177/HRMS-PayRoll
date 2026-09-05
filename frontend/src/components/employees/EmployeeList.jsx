/**
 * Employee List Table Component
 * 
 * RESPONSIBILITY:
 * Renders the tabular list of employee records with status chips, department badges,
 * action buttons for Viewing Detail and Editing, and handles pagination.
 * 
 * NOT RESPONSIBLE FOR:
 * Fetching data directly or rendering modal dialogs.
 */

import React from 'react';
import { Typography, Chip, Button, IconButton, Tooltip } from '@material-tailwind/react';
import { EyeIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import DataTable from '../common/DataTable';
import { useAuth } from '../../context/AuthContext';

/**
 * Employee List component.
 * 
 * @param {object} props - Component props
 * @param {Array<object>} props.employees - Employee records to display
 * @param {boolean} props.loading - Loading state indicator
 * @param {number} props.page - Current page number
 * @param {number} props.totalPages - Total pages available
 * @param {Function} props.onPageChange - Page change handler
 * @param {string} props.searchTerm - Search term
 * @param {Function} props.onSearchChange - Search input change handler
 * @param {Function} props.onView - Callback when clicking View Detail (emp: object) => void
 * @param {Function} props.onEdit - Callback when clicking Edit (emp: object) => void
 * @param {React.ReactNode} [props.actionButton] - Create button element
 * @returns {JSX.Element} Paginated employee table
 */
export default function EmployeeList({
  employees = [],
  loading = false,
  page = 1,
  totalPages = 1,
  onPageChange,
  searchTerm = '',
  onSearchChange,
  onView,
  onEdit,
  actionButton
}) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('employee.manage');

  const columns = [
    {
      key: 'employee_code',
      label: 'Emp Code',
      render: (row) => (
        <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
          {row.employee_code}
        </span>
      )
    },
    {
      key: 'name',
      label: 'Employee Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.first_name + ' ' + row.last_name)}&background=6366f1&color=fff`}
            alt={row.first_name}
            className="h-9 w-9 rounded-full object-cover border border-blue-gray-100"
          />
          <div>
            <p className="font-semibold text-sm text-blue-gray-800">
              {row.first_name} {row.last_name}
            </p>
            <p className="text-xs text-blue-gray-400">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'department_name',
      label: 'Department',
      render: (row) => (
        <span className="text-xs font-medium text-blue-gray-700 bg-blue-gray-50 px-2 py-1 rounded">
          {row.department_name || 'Unassigned'}
        </span>
      )
    },
    {
      key: 'job_title',
      label: 'Position',
      render: (row) => (
        <span className="text-xs text-blue-gray-600">
          {row.job_title || 'N/A'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Chip
          size="sm"
          variant="ghost"
          value={row.status}
          color={row.status === 'active' ? 'green' : row.status === 'inactive' ? 'amber' : 'red'}
          className="w-fit capitalize font-semibold text-[11px]"
        />
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Tooltip content="View Profile">
            <IconButton
              variant="text"
              color="blue-gray"
              size="sm"
              onClick={() => onView(row)}
            >
              <EyeIcon className="h-4 w-4 text-indigo-600" />
            </IconButton>
          </Tooltip>

          {canManage && (
            <Tooltip content="Edit Employee">
              <IconButton
                variant="text"
                color="blue-gray"
                size="sm"
                onClick={() => onEdit(row)}
              >
                <PencilSquareIcon className="h-4 w-4 text-blue-gray-600" />
              </IconButton>
            </Tooltip>
          )}
        </div>
      )
    }
  ];

  return (
    <DataTable
      title="Employee Directory"
      subtitle="Complete list of active, inactive, and on-leave workforce members"
      columns={columns}
      data={employees}
      loading={loading}
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      actionButton={actionButton}
    />
  );
}
