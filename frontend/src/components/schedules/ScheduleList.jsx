/**
 * Working Schedules List Table Component
 * 
 * RESPONSIBILITY:
 * Renders the tabular list of working schedule templates, weekly total hours,
 * and handles editing actions.
 * 
 * NOT RESPONSIBLE FOR:
 * Editing shift lines directly (handled by ScheduleForm).
 */

import React from 'react';
import { Typography, Chip, IconButton, Tooltip } from '@material-tailwind/react';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import DataTable from '../common/DataTable';
import { useAuth } from '../../context/AuthContext';

/**
 * Schedule List component.
 * 
 * @param {object} props - Component props
 * @param {Array<object>} props.schedules - Schedule records
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onEdit - Callback when editing schedule (sch: object) => void
 * @param {Function} [props.onDelete] - Callback when deleting schedule (sch: object) => void
 * @param {React.ReactNode} [props.actionButton] - Create button
 * @returns {JSX.Element} Schedules data table
 */
export default function ScheduleList({
  schedules = [],
  loading = false,
  onEdit,
  onDelete,
  actionButton
}) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('schedule.manage');

  const columns = [
    {
      key: 'name',
      label: 'Schedule Name',
      render: (row) => (
        <span className="font-bold text-sm text-blue-gray-800">{row.name}</span>
      )
    },
    {
      key: 'schedule_type',
      label: 'Type',
      render: (row) => (
        <span className="capitalize text-xs text-blue-gray-600 bg-blue-gray-50 px-2 py-1 rounded font-medium">
          {row.schedule_type?.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'total_weekly_hours',
      label: 'Weekly Hours',
      render: (row) => (
        <span className="font-bold text-sm text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
          {row.total_weekly_hours} hrs / week
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
          color={row.status === 'active' ? 'green' : 'blue-gray'}
          className="w-fit capitalize font-semibold text-[11px]"
        />
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        canManage && (
          <div className="flex items-center gap-1">
            <Tooltip content="Edit Schedule & Shifts">
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
              <Tooltip content="Delete Schedule">
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

  return (
    <DataTable
      title="Working Schedules & Shift Templates"
      subtitle="Standard and flexible working schedules used to calculate attendance expectations and hourly rates"
      columns={columns}
      data={schedules}
      loading={loading}
      actionButton={actionButton}
    />
  );
}
