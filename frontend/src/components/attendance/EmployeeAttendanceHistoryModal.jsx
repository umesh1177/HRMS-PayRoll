/**
 * Employee Attendance History Modal Component
 * 
 * RESPONSIBILITY:
 * Displays all past check-in and check-out punch logs for a selected employee.
 * Allows filtering by date range and status, viewing worked hours, and triggering HR corrections.
 */

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Button
} from '@material-tailwind/react';
import {
  PencilSquareIcon,
  TrashIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import Modal from '../common/Modal';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

export default function EmployeeAttendanceHistoryModal({
  open,
  onClose,
  employee,
  onEditRecord,
  onDeleteRecord
}) {
  const { hasPermission } = useAuth();
  const canManageAll = hasPermission('attendance.manage_all');

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters inside history modal
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (open && employee?.id) {
      setPage(1);
      fetchHistory(1);
    }
  }, [open, employee, fromDate, toDate, statusFilter]);

  const fetchHistory = async (pageNum = 1) => {
    if (!employee?.id) return;
    setLoading(true);
    try {
      let query = `/attendance?employee_id=${employee.id}&page=${pageNum}&limit=10`;
      if (fromDate) query += `&from=${fromDate}`;
      if (toDate) query += `&to=${toDate}`;
      if (statusFilter) query += `&status=${statusFilter}`;

      const res = await axiosClient.get(query);
      if (res.data?.data) {
        setRecords(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalCount(res.data.pagination?.total || 0);
      } else {
        setRecords([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Failed to fetch employee attendance history:', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchHistory(newPage);
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setStatusFilter('');
  };

  const formatDateOnly = (dt) => {
    if (!dt) return '-';
    const date = new Date(dt);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTimeOnly = (dt) => {
    if (!dt) return '-';
    const date = new Date(dt);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colorMap = {
      present: 'green',
      late: 'amber',
      overtime: 'indigo',
      absent: 'red',
      half_day: 'orange',
      missing_checkout: 'blue-gray'
    };
    return colorMap[status] || 'blue-gray';
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
            {employee ? `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}` : 'EM'}
          </div>
          <div>
            <Typography variant="h6" color="blue-gray" className="font-bold flex items-center gap-2">
              {employee ? `${employee.first_name} ${employee.last_name}` : 'Employee'}
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                {employee?.employee_code}
              </span>
            </Typography>
            <Typography variant="small" className="text-blue-gray-500 text-xs">
              {employee?.department_name || 'No Dept'} • {employee?.job_title || employee?.primary_role_name || 'Employee'}
            </Typography>
          </div>
        </div>
      }
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Typography variant="small" className="text-blue-gray-500 text-xs">
            Showing <span className="font-semibold text-blue-gray-800">{records.length}</span> of <span className="font-semibold text-blue-gray-800">{totalCount}</span> records
          </Typography>
          <Button color="blue-gray" variant="text" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Top Filter Bar */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <FunnelIcon className="h-4 w-4 text-indigo-600" />
            <span>Filter Logs:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-8 px-2 rounded border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-8 px-2 rounded border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2 rounded border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="overtime">Overtime</option>
              <option value="absent">Absent</option>
              <option value="half_day">Half Day</option>
            </select>
          </div>

          {(fromDate || toDate || statusFilter) && (
            <Button
              size="sm"
              variant="text"
              color="red"
              className="h-8 py-1 px-2 text-xs"
              onClick={handleClearFilters}
            >
              Clear
            </Button>
          )}

          <div className="ml-auto">
            <Button
              size="sm"
              variant="outlined"
              color="indigo"
              className="h-8 py-1 px-3 flex items-center gap-1 text-xs"
              onClick={() => fetchHistory(page)}
              disabled={loading}
            >
              <ArrowPathIcon className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Attendance Records Table */}
        <div className="overflow-x-auto rounded-lg border border-blue-gray-100 max-h-[420px]">
          <table className="w-full min-w-max table-auto text-left">
            <thead className="bg-slate-100 text-slate-700 text-xs font-bold uppercase sticky top-0 z-10">
              <tr>
                <th className="p-3 border-b border-slate-200">Date</th>
                <th className="p-3 border-b border-slate-200">Check In</th>
                <th className="p-3 border-b border-slate-200">Check Out</th>
                <th className="p-3 border-b border-slate-200">Worked Hours</th>
                <th className="p-3 border-b border-slate-200">Status</th>
                <th className="p-3 border-b border-slate-200">Audit / Notes</th>
                {canManageAll && <th className="p-3 border-b border-slate-200 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-gray-50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={canManageAll ? 7 : 6} className="text-center py-8 text-blue-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading attendance history...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={canManageAll ? 7 : 6} className="text-center py-10 text-blue-gray-400">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <CalendarDaysIcon className="h-8 w-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">No attendance records found</p>
                      <p className="text-xs text-slate-400">No check-in/out logs match the selected filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-medium text-slate-800 text-xs">
                      {formatDateOnly(row.check_in)}
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                        {formatTimeOnly(row.check_in)}
                      </span>
                    </td>
                    <td className="p-3">
                      {row.check_out ? (
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                          {formatTimeOnly(row.check_out)}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Active / In Progress
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="font-bold font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {row.worked_hours !== null && row.worked_hours !== undefined ? `${row.worked_hours} hrs` : '-'}
                      </span>
                    </td>
                    <td className="p-3">
                      <Chip
                        size="sm"
                        variant="ghost"
                        value={row.status?.replace('_', ' ') || 'present'}
                        color={getStatusColor(row.status)}
                        className="w-fit capitalize font-semibold text-[11px]"
                      />
                    </td>
                    <td className="p-3 text-xs text-slate-500">
                      {row.is_manual_edit ? (
                        <Tooltip content={`Edited by: ${row.edited_by_email || 'HR Admin'}${row.notes ? ` • Note: ${row.notes}` : ''}`}>
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium cursor-help border border-amber-200">
                            <ShieldCheckIcon className="h-3.5 w-3.5 text-amber-600" /> Edited
                          </span>
                        </Tooltip>
                      ) : row.notes ? (
                        <span className="truncate max-w-[150px] inline-block text-slate-600" title={row.notes}>
                          {row.notes}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">System</span>
                      )}
                    </td>
                    {canManageAll && (
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip content="Edit Record">
                            <IconButton
                              variant="text"
                              color="blue-gray"
                              size="sm"
                              onClick={() => onEditRecord(row)}
                            >
                              <PencilSquareIcon className="h-4 w-4 text-slate-600" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip content="Delete Record">
                            <IconButton
                              variant="text"
                              color="red"
                              size="sm"
                              onClick={() => onDeleteRecord(row)}
                            >
                              <TrashIcon className="h-4 w-4 text-red-500" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <Button
              size="sm"
              variant="outlined"
              color="blue-gray"
              disabled={page <= 1 || loading}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </Button>
            <Typography variant="small" className="text-slate-600 text-xs font-semibold">
              Page {page} of {totalPages}
            </Typography>
            <Button
              size="sm"
              variant="outlined"
              color="blue-gray"
              disabled={page >= totalPages || loading}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
