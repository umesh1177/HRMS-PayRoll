/**
 * Contracts List Table Component
 * 
 * RESPONSIBILITY:
 * Renders the tabular list of employee employment contracts with status indicators,
 * wage formatting, and edit action triggers.
 * 
 * NOT RESPONSIBLE FOR:
 * Validating contract overlap rules (handled by backend contractService.js and ContractForm).
 */

import React from 'react';
import { Typography, Chip, IconButton, Tooltip } from '@material-tailwind/react';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import DataTable from '../common/DataTable';
import { useAuth } from '../../context/AuthContext';

/**
 * Contract List component.
 * 
 * @param {object} props - Component props
 * @param {Array<object>} props.contracts - Contract records
 * @param {boolean} props.loading - Loading state
 * @param {number} props.page - Current page
 * @param {number} props.totalPages - Total pages
 * @param {Function} props.onPageChange - Page change callback
 * @param {Function} props.onEdit - Edit callback (contract: object) => void
 * @param {React.ReactNode} [props.actionButton] - Header action button
 * @returns {JSX.Element} Paginated contracts data table
 */
export default function ContractList({
  contracts = [],
  loading = false,
  page = 1,
  totalPages = 1,
  onPageChange,
  onEdit,
  actionButton
}) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('contract.manage');

  const columns = [
    {
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
    },
    {
      key: 'structure_name',
      label: 'Salary Structure',
      render: (row) => (
        <span className="text-xs font-medium text-blue-gray-700 bg-blue-gray-50 px-2 py-1 rounded">
          {row.structure_name || 'Regular Salary'}
        </span>
      )
    },
    {
      key: 'wage',
      label: 'Monthly Wage',
      render: (row) => (
        <span className="font-bold text-sm text-indigo-700">
          ${Number(row.wage || 0).toLocaleString()}
        </span>
      )
    },
    {
      key: 'contract_type',
      label: 'Type',
      render: (row) => (
        <span className="capitalize text-xs text-blue-gray-600">
          {row.contract_type?.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'period',
      label: 'Duration',
      render: (row) => (
        <span className="text-xs text-blue-gray-600">
          {row.start_date} → {row.end_date || 'Open-ended'}
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
          color={
            row.status === 'running'
              ? 'green'
              : row.status === 'draft'
              ? 'blue'
              : row.status === 'expired'
              ? 'amber'
              : 'red'
          }
          className="w-fit capitalize font-semibold text-[11px]"
        />
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        canManage && (
          <Tooltip content="Edit Contract">
            <IconButton
              variant="text"
              color="blue-gray"
              size="sm"
              onClick={() => onEdit(row)}
            >
              <PencilSquareIcon className="h-4 w-4 text-blue-gray-600" />
            </IconButton>
          </Tooltip>
        )
      )
    }
  ];

  return (
    <DataTable
      title="Employment Contracts"
      subtitle="Manage salary structure assignments, compensation wages, and active periods"
      columns={columns}
      data={contracts}
      loading={loading}
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      actionButton={actionButton}
    />
  );
}
