/**
 * Attendance Tracking & Records Page
 * 
 * RESPONSIBILITY:
 * Main view for attendance operations. Hosts the punch clock AttendanceWidget,
 * filters attendance history (global or employee-specific), and provides the HR
 * manual correction modal for 'attendance.manage_all'.
 * 
 * NOT RESPONSIBLE FOR:
 * Direct salary computation or contract management.
 */

import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Typography,
  Alert,
  Card,
  CardBody,
  CardHeader
} from '@material-tailwind/react';
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import AttendanceWidget from '../components/attendance/AttendanceWidget';
import AttendanceList from '../components/attendance/AttendanceList';
import Modal from '../components/common/Modal';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

/**
 * Attendance Page Component.
 * 
 * @returns {JSX.Element} Attendance view
 */
export default function AttendancePage() {
  const { hasPermission, user } = useAuth();
  const canManageAll = hasPermission('attendance.manage_all');

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState(null);
  const [summaryEmployeeId, setSummaryEmployeeId] = useState('');
  const [employees, setEmployees] = useState([]);
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [markForm, setMarkForm] = useState({ employee_id: '', date: new Date().toISOString().split('T')[0], status: 'absent', notes: '' });
  const [markError, setMarkError] = useState('');
  const [markSubmitting, setMarkSubmitting] = useState(false);

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

  useEffect(() => {
    fetchAttendance();
  }, [page, summaryEmployeeId]);

  useEffect(() => {
    if (!canManageAll) return;
    axiosClient.get('/employees?limit=100').then((res) => setEmployees(res.data?.data || [])).catch(() => setEmployees([]));
  }, [canManageAll]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/attendance?page=${page}&limit=10`);
      if (res.data?.data) {
        setRecords(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setRecords([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.warn('Failed to load attendance:', err);
      setRecords([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
    try {
      const query = canManageAll && summaryEmployeeId ? `?employee_id=${summaryEmployeeId}` : '';
      const summaryRes = await axiosClient.get(`/attendance/summary${query}`);
      setSummary(summaryRes.data?.data || null);
    } catch (err) {
      setSummary(null);
    }
  };

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
      fetchAttendance();
      setEditModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to correct attendance record.';
      setEditError(msg);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleMarkAttendance = async (event) => {
    event.preventDefault();
    setMarkError('');
    setMarkSubmitting(true);
    try {
      await axiosClient.post('/attendance/mark', {
        ...markForm,
        employee_id: canManageAll ? Number(markForm.employee_id) : undefined
      });
      setMarkModalOpen(false);
      fetchAttendance();
    } catch (err) {
      setMarkError(err.response?.data?.error?.message || 'Unable to mark attendance.');
    } finally {
      setMarkSubmitting(false);
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Self-service punch widget */}
      {user?.employee_id ? (
        <AttendanceWidget onPunchChange={fetchAttendance} />
      ) : (
        <Alert color="blue" variant="ghost" className="border border-blue-100 text-sm">
          This account has no linked employee profile, so there is nothing to check in or out.
        </Alert>
      )}

      <Card className="border border-blue-gray-100 shadow-sm">
        <CardHeader floated={false} shadow={false} className="rounded-none p-4 pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Typography variant="h6" color="blue-gray" className="font-bold">Worked Hours</Typography>
              <Typography variant="small" color="blue-gray" className="text-xs">Completed attendance totals for the current periods</Typography>
            </div>
            {canManageAll && (
              <select
                value={summaryEmployeeId}
                onChange={(e) => setSummaryEmployeeId(e.target.value)}
                className="h-10 rounded-md border border-blue-gray-200 px-3 text-sm focus:border-indigo-600 focus:outline-none"
              >
                <option value="">Select employee</option>
                {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name || `${employee.first_name} ${employee.last_name}`}</option>)}
              </select>
            )}
          </div>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 pt-3 sm:grid-cols-2">
          {[
            { label: 'This Week', hours: summary?.week_hours, days: summary?.week_days_present },
            { label: 'This Month', hours: summary?.month_hours, days: summary?.month_days_present }
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-blue-gray-100 bg-blue-gray-50/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-gray-500">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-indigo-700">{Number(item.hours || 0).toFixed(2)} hrs</p>
              <p className="mt-1 text-xs text-blue-gray-500">{item.days || 0} days present</p>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Attendance logs table */}
      <AttendanceList
        records={records}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onEdit={handleOpenEdit}
        actionButton={canManageAll && (
          <Button color="indigo" size="sm" onClick={() => { setMarkError(''); setMarkModalOpen(true); }}>Mark Attendance</Button>
        )}
      />

      <Modal open={markModalOpen} onClose={() => !markSubmitting && setMarkModalOpen(false)} title="Mark Attendance" size="sm" footer={null}>
        <form onSubmit={handleMarkAttendance} className="flex flex-col gap-4">
          {markError && <Alert color="red" variant="gradient">{markError}</Alert>}
          {canManageAll && (
            <select value={markForm.employee_id} onChange={(event) => setMarkForm({ ...markForm, employee_id: event.target.value })} className="h-10 rounded-md border border-blue-gray-200 px-3 text-sm" required>
              <option value="">Select employee</option>
              {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name || `${employee.first_name} ${employee.last_name}`}</option>)}
            </select>
          )}
          <Input type="date" label="Date" value={markForm.date} onChange={(event) => setMarkForm({ ...markForm, date: event.target.value })} required />
          <select value={markForm.status} onChange={(event) => setMarkForm({ ...markForm, status: event.target.value })} className="h-10 rounded-md border border-blue-gray-200 px-3 text-sm">
            <option value="absent">Absent</option><option value="present">Present</option>
          </select>
          <Input label="Notes" value={markForm.notes} onChange={(event) => setMarkForm({ ...markForm, notes: event.target.value })} />
          <div className="flex justify-end gap-2"><Button variant="text" onClick={() => setMarkModalOpen(false)}>Cancel</Button><Button type="submit" color="indigo" disabled={markSubmitting}>{markSubmitting ? 'Saving...' : 'Save Mark'}</Button></div>
        </form>
      </Modal>

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
                value={`${selectedRecord.employee_name} (${selectedRecord.employee_code})`}
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
    </div>
  );
}
