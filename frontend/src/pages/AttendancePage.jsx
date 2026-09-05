/**
 * Attendance Tracking & Records Page
 * 
 * RESPONSIBILITY:
 * Main view for attendance operations.
 * - For Admin & HR Management: Provides an employee-centric attendance directory with
 *   filters (date, role, department, search) and opens dedicated individual history modals.
 *   Removes the self-service check-in/out punch widget.
 * - For regular Employees: Provides self-service punch clock and personal logs.
 */

import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Typography,
  Chip,
  Card,
  CardBody,
  IconButton,
  Tooltip,
  Alert
} from '@material-tailwind/react';
import {
  InformationCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import AttendanceWidget from '../components/attendance/AttendanceWidget';
import AttendanceList from '../components/attendance/AttendanceList';
import EmployeeAttendanceHistoryModal from '../components/attendance/EmployeeAttendanceHistoryModal';
import Modal from '../components/common/Modal';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import {
  formatTime,
  formatDateTime,
  formatDate,
  formatWorkedHours
} from '../utils/formatters';

export default function AttendancePage() {
  const { hasPermission, user } = useAuth();
  const isAdmin = user?.role === 'Admin' || user?.role_name === 'Admin' || user?.role_id === 1 || (user?.roles && user.roles.some(r => r.name === 'Admin' || r.id === 1));

  // Employee-centric directory state (Admin View)
  const [employeesSummary, setEmployeesSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Dropdown filter options
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  // Selected Employee for History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Manual Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    check_in: '',
    check_out: '',
    status: 'present',
    notes: ''
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Modal State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Self-service employee logs (for all logins except Admin)
  const [selfRecords, setSelfRecords] = useState([]);
  const [selfLoading, setSelfLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchFilterOptions();
      fetchEmployeeSummaries();
    } else {
      fetchSelfAttendance();
    }
  }, [isAdmin, page, search, selectedRole, selectedDepartment, filterDate]);

  const fetchFilterOptions = async () => {
    try {
      const [deptRes, rolesRes] = await Promise.allSettled([
        axiosClient.get('/departments'),
        axiosClient.get('/auth/roles')
      ]);
      if (deptRes.status === 'fulfilled' && deptRes.value.data?.data) {
        setDepartments(deptRes.value.data.data);
      }
      if (rolesRes.status === 'fulfilled' && rolesRes.value.data?.data) {
        setRoles(rolesRes.value.data.data);
      }
    } catch (err) {
      console.warn('Failed to load filter options:', err);
    }
  };

  const fetchEmployeeSummaries = async () => {
    setLoading(true);
    try {
      let query = `/attendance/employee-summary?page=${page}&limit=10`;
      if (search.trim()) query += `&search=${encodeURIComponent(search.trim())}`;
      if (selectedRole) query += `&role_id=${selectedRole}`;
      if (selectedDepartment) query += `&department_id=${selectedDepartment}`;
      if (filterDate) query += `&date=${filterDate}`;

      const res = await axiosClient.get(query);
      if (res.data?.data) {
        setEmployeesSummary(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalEmployees(res.data.pagination?.total || 0);
      } else {
        setEmployeesSummary([]);
        setTotalPages(1);
        setTotalEmployees(0);
      }
    } catch (err) {
      console.warn('Could not load employee summaries:', err);
      setEmployeesSummary([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelfAttendance = async () => {
    setSelfLoading(true);
    try {
      const res = await axiosClient.get(`/attendance?self=true&page=${page}&limit=10`);
      if (res.data?.data) {
        setSelfRecords(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setSelfRecords([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.warn('Failed to fetch personal attendance records:', err);
      setSelfRecords([]);
      setTotalPages(1);
    } finally {
      setSelfLoading(false);
    }
  };

  const handleOpenHistory = (employee) => {
    setSelectedEmployee(employee);
    setHistoryModalOpen(true);
  };

  const handleClearAllFilters = () => {
    setSearch('');
    setSelectedRole('');
    setSelectedDepartment('');
    setFilterDate('');
    setPage(1);
  };

  // Edit / Delete handlers for individual punch records
  const handleOpenEdit = (record) => {
    setSelectedRecord(record);
    setEditForm({
      check_in: record.check_in ? record.check_in.slice(0, 19).replace('T', ' ') : '',
      check_out: record.check_out ? record.check_out.slice(0, 19).replace('T', ' ') : '',
      status: record.status || 'present',
      notes: record.notes || ''
    });
    setEditError('');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    setSubmittingEdit(true);

    try {
      await axiosClient.put(`/attendance/${selectedRecord.id}`, editForm);
      setEditModalOpen(false);
      if (isAdmin) {
        fetchEmployeeSummaries();
      } else {
        fetchSelfAttendance();
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to correct attendance record.';
      setEditError(msg);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleOpenDelete = (record) => {
    setRecordToDelete(record);
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await axiosClient.delete(`/attendance/${recordToDelete.id}`);
      setDeleteOpen(false);
      setRecordToDelete(null);
      if (isAdmin) {
        fetchEmployeeSummaries();
      } else {
        fetchSelfAttendance();
      }
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete attendance record.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // For all logins except Admin: render self-service punch clock & personal logs
  if (!isAdmin) {
    return (
      <div className="mt-6 flex flex-col gap-6">
        {/* Live Punch Clock Self-Service */}
        <AttendanceWidget onPunchChange={fetchSelfAttendance} />

        {/* Personal Attendance Logs Table */}
        <AttendanceList
          records={selfRecords}
          loading={selfLoading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onEdit={handleOpenEdit}
        />
      </div>
    );
  }

  const hasActiveFilters = search || selectedRole || selectedDepartment || filterDate;

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Top Filter Bar */}
      <Card className="border border-blue-gray-100 shadow-sm">
        <CardBody className="p-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Typography variant="h6" color="blue-gray" className="font-bold flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-indigo-600" />
                Workforce Attendance & History
              </Typography>
              <Typography variant="small" className="text-blue-gray-500 text-xs">
                Monitor employee attendance logs, search by role or department, and inspect individual punch histories.
              </Typography>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outlined"
                color="indigo"
                className="flex items-center gap-1.5 text-xs py-2 px-3"
                onClick={fetchEmployeeSummaries}
                disabled={loading}
              >
                <ArrowPathIcon className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end pt-2 border-t border-blue-gray-50">
            {/* Search Input */}
            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold text-xs mb-1">
                Search Employee
              </Typography>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Name, EMP Code, Email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  icon={<MagnifyingGlassIcon className="h-4 w-4 text-blue-gray-400" />}
                  className="!border-blue-gray-200 text-xs"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold text-xs mb-1">
                Filter by Role
              </Typography>
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-xs text-blue-gray-800 focus:border-indigo-600 focus:outline-none bg-white"
              >
                <option value="">All Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold text-xs mb-1">
                Filter by Department
              </Typography>
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-xs text-blue-gray-800 focus:border-indigo-600 focus:outline-none bg-white"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Typography variant="small" color="blue-gray" className="font-semibold text-xs mb-1">
                  Filter by Date
                </Typography>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => {
                    setFilterDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-xs text-blue-gray-800 focus:border-indigo-600 focus:outline-none bg-white"
                />
              </div>

              {hasActiveFilters && (
                <div className="pt-5">
                  <Tooltip content="Reset all filters">
                    <IconButton
                      size="sm"
                      variant="text"
                      color="red"
                      onClick={handleClearAllFilters}
                      className="h-10 w-10"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </IconButton>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Employee Attendance Directory Table */}
      <Card className="border border-blue-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max table-auto text-left">
            <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-4">Employee</th>
                <th className="p-4">Department & Role</th>
                <th className="p-4">Today's Status</th>
                <th className="p-4">Total Records</th>
                <th className="p-4">Total Hours</th>
                <th className="p-4">Latest Activity</th>
                <th className="p-4 text-right">Attendance History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-gray-50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-blue-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading attendance directory...</span>
                    </div>
                  </td>
                </tr>
              ) : employeesSummary.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-blue-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserGroupIcon className="h-10 w-10 text-slate-300" />
                      <p className="font-semibold text-slate-600">No employees found</p>
                      <p className="text-xs text-slate-400">Try adjusting your search terms or filter criteria.</p>
                      {hasActiveFilters && (
                        <Button
                          size="sm"
                          variant="outlined"
                          color="indigo"
                          className="mt-2 text-xs py-1.5 px-3"
                          onClick={handleClearAllFilters}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                employeesSummary.map((emp) => {
                  const initials = `${emp.first_name?.[0] || ''}${emp.last_name?.[0] || ''}`;

                  let todayBadge = (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                      ⚪ Not Checked In
                    </span>
                  );
                  if (emp.today_punch_state === 'checked_in') {
                    todayBadge = (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 animate-pulse">
                        🟢 Checked In ({formatTime(emp.latest_check_in)})
                      </span>
                    );
                  } else if (emp.today_punch_state === 'checked_out') {
                    todayBadge = (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                        🔵 Checked Out
                      </span>
                    );
                  }

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Employee Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0 border border-indigo-200">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-blue-gray-900">
                              {emp.first_name} {emp.last_name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {emp.employee_code}
                              </span>
                              <span className="text-xs text-blue-gray-400 truncate max-w-[150px]">
                                {emp.email}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department & Role */}
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <BuildingOfficeIcon className="h-3.5 w-3.5 text-slate-400" />
                            {emp.department_name || 'Unassigned'}
                          </span>
                          <span className="text-[11px] text-indigo-600 bg-indigo-50/60 px-2 py-0.5 rounded w-fit font-medium">
                            {emp.job_title || emp.primary_role_name || 'Employee'}
                          </span>
                        </div>
                      </td>

                      {/* Today's Punch Status */}
                      <td className="p-4">{todayBadge}</td>

                      {/* Total Records */}
                      <td className="p-4">
                        <span className="font-semibold text-xs text-slate-700">
                          {emp.total_attendance_records || 0} shifts
                        </span>
                      </td>

                      {/* Total Hours */}
                      <td className="p-4">
                        <span className="font-bold font-mono text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100">
                          {formatWorkedHours(emp.total_worked_hours, '0 hrs')}
                        </span>
                      </td>

                      {/* Latest Activity */}
                      <td className="p-4 text-xs text-slate-500">
                        {emp.latest_check_in ? (
                          <div>
                            <p className="font-medium text-slate-700">{formatDateTime(emp.latest_check_in)}</p>
                            <span className="text-[10px] text-slate-400 capitalize">
                              {emp.latest_status || 'present'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">No logs yet</span>
                        )}
                      </td>

                      {/* Action Button: View Attendance History */}
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          color="indigo"
                          variant="gradient"
                          className="flex items-center gap-1.5 py-2 px-3 text-xs ml-auto shadow-sm"
                          onClick={() => handleOpenHistory(emp)}
                        >
                          <EyeIcon className="h-4 w-4" />
                          <span>View History</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Directory Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-blue-gray-50 bg-slate-50">
            <Typography variant="small" className="text-slate-600 text-xs font-semibold">
              Showing page {page} of {totalPages} ({totalEmployees} total employees)
            </Typography>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outlined"
                color="blue-gray"
                disabled={page <= 1 || loading}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outlined"
                color="blue-gray"
                disabled={page >= totalPages || loading}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Dedicated Employee Attendance History Modal */}
      {selectedEmployee && (
        <EmployeeAttendanceHistoryModal
          open={historyModalOpen}
          onClose={() => {
            setHistoryModalOpen(false);
            setSelectedEmployee(null);
          }}
          employee={selectedEmployee}
          onEditRecord={handleOpenEdit}
          onDeleteRecord={handleOpenDelete}
        />
      )}

      {/* Manual HR Correction Modal */}
      {selectedRecord && (
        <Modal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Correct Attendance Record (#${selectedRecord.id})`}
          size="md"
          footer={
            <>
              <Button
                variant="text"
                color="blue-gray"
                onClick={() => setEditModalOpen(false)}
                disabled={submittingEdit}
              >
                Cancel
              </Button>
              <Button color="indigo" onClick={handleSaveEdit} disabled={submittingEdit}>
                {submittingEdit ? 'Saving...' : 'Save Correction'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
            {editError && (
              <Alert color="red" variant="gradient" icon={<InformationCircleIcon className="h-5 w-5" />}>
                {editError}
              </Alert>
            )}

            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Employee
              </Typography>
              <Input
                value={`${selectedRecord.employee_name || ''} (${selectedRecord.employee_code || ''})`}
                disabled
              />
            </div>

            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Check In (YYYY-MM-DD HH:MM:SS) *
              </Typography>
              <Input
                value={editForm.check_in}
                onChange={(e) => setEditForm({ ...editForm, check_in: e.target.value })}
                required
              />
            </div>

            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Check Out (YYYY-MM-DD HH:MM:SS)
              </Typography>
              <Input
                value={editForm.check_out}
                onChange={(e) => setEditForm({ ...editForm, check_out: e.target.value })}
              />
            </div>

            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Status *
              </Typography>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
              >
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="overtime">Overtime</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half Day</option>
                <option value="missing_checkout">Missing Checkout</option>
              </select>
            </div>

            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Correction Audit Note
              </Typography>
              <Input
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Reason for manual adjustment..."
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Attendance Confirmation Modal */}
      <ConfirmDeleteModal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setRecordToDelete(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Delete Attendance Record"
        description={`Are you sure you want to delete attendance record #${recordToDelete?.id || ''} for ${recordToDelete?.employee_name || 'employee'} (${recordToDelete?.check_in ? recordToDelete.check_in.slice(0, 10) : ''})?`}
        errorMessage={deleteError}
      />
    </div>
  );
}
