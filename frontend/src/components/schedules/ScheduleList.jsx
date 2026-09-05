import React, { useState, useMemo } from 'react';
import { Typography, Chip, IconButton, Tooltip, Input } from '@material-tailwind/react';
import {
  PencilSquareIcon,
  TrashIcon,
  CalendarDaysIcon,
  ClockIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import DataTable from '../common/DataTable';
import { useAuth } from '../../context/AuthContext';
import { formatWeeklyHours } from '../../utils/formatters';

const DAYS_SHORT = [
  { key: 'mon', label: 'M', fullName: 'Monday' },
  { key: 'tue', label: 'T', fullName: 'Tuesday' },
  { key: 'wed', label: 'W', fullName: 'Wednesday' },
  { key: 'thu', label: 'T', fullName: 'Thursday' },
  { key: 'fri', label: 'F', fullName: 'Friday' },
  { key: 'sat', label: 'S', fullName: 'Saturday' },
  { key: 'sun', label: 'S', fullName: 'Sunday' }
];

export default function ScheduleList({
  schedules = [],
  loading = false,
  onEdit,
  onDelete,
  actionButton
}) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('schedule.manage');

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const matchesSearch =
        !searchTerm || s.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || s.schedule_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [schedules, searchTerm, typeFilter]);

  const columns = [
    {
      key: 'name',
      label: 'Schedule Template',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-sm text-blue-gray-900 flex items-center gap-1.5">
            <CalendarDaysIcon className="h-4 w-4 text-indigo-600 shrink-0" />
            {row.name}
          </span>
          <span className="text-[11px] text-blue-gray-400 capitalize">
            {row.schedule_type?.replace('_', ' ')} &bull; {row.lines?.length || row.lines_count || 0} active days
          </span>
        </div>
      )
    },
    {
      key: 'running_days',
      label: 'Running Days Matrix',
      render: (row) => {
        const lines = Array.isArray(row.lines) ? row.lines : [];
        return (
          <div className="flex items-center gap-1">
            {DAYS_SHORT.map((day) => {
              const matchedLine = lines.find((l) => l.day_of_week === day.key);
              const isActive = !!matchedLine;
              const shiftInfo = isActive
                ? `${day.fullName}: ${matchedLine.start_time?.slice(0, 5)} - ${matchedLine.end_time?.slice(0, 5)} (${matchedLine.break_minutes || 0}m break)`
                : `${day.fullName}: Off Day`;

              return (
                <Tooltip key={day.key} content={shiftInfo}>
                  <span
                    className={`h-6 w-6 rounded-md flex items-center justify-center text-[11px] font-bold cursor-default transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-blue-gray-100/60 text-blue-gray-400'
                    }`}
                  >
                    {day.label}
                  </span>
                </Tooltip>
              );
            })}
          </div>
        );
      }
    },
    {
      key: 'total_weekly_hours',
      label: 'Weekly Hours',
      render: (row) => {
        const hours = parseFloat(row.total_weekly_hours) || 0;
        const isOvertime = hours > 48;
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5 text-indigo-500" />
              {formatWeeklyHours(hours)}
            </span>
            {isOvertime && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                &gt;48h
              </span>
            )}
          </div>
        );
      }
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
                color="indigo"
                size="sm"
                onClick={() => onEdit(row)}
              >
                <PencilSquareIcon className="h-4 w-4" />
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
                  <TrashIcon className="h-4 w-4" />
                </IconButton>
              </Tooltip>
            )}
          </div>
        )
      )
    }
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Search & Type Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-blue-gray-100 shadow-xs">
        <div className="w-72">
          <Input
            icon={<MagnifyingGlassIcon className="h-4 w-4 text-blue-gray-400" />}
            placeholder="Search working schedules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="!border-blue-gray-200 focus:!border-indigo-600"
            labelProps={{ className: 'hidden' }}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-blue-gray-500">Filter Type:</span>
          {['all', 'full_time', 'part_time', 'flexible'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                typeFilter === type
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-blue-gray-50 text-blue-gray-600 hover:bg-blue-gray-100'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        title="Working Schedules & Shift Templates"
        subtitle="Standard and flexible working schedules dynamically applied to employees, attendance expectations, and payroll"
        columns={columns}
        data={filteredSchedules}
        loading={loading}
        actionButton={actionButton}
      />
    </div>
  );
}

