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
  Alert
} from '@material-tailwind/react';
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import AttendanceWidget from '../components/attendance/AttendanceWidget';
import AttendanceList from '../components/attendance/AttendanceList';
import Modal from '../components/common/Modal';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import mockAttendances from '../api/mocks/attendances.json';

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

  useEffect(() => {
    fetchAttendance();
  }, [page]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/attendance?page=${page}&limit=10`);
      if (res.data?.data) {
        setRecords(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setRecords(mockAttendances);
        setTotalPages(1);
      }
    } catch (err) {
      console.warn('Backend unavailable, using mock attendance.');
      setRecords(mockAttendances);
      setTotalPages(1);
    } finally {
      setLoading(false);
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
      fetchAttendance();
    } catch (err) {
      console.error('Failed to delete attendance record:', err);
      setDeleteError(err.response?.data?.message || 'Failed to delete attendance record.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Self-service punch widget */}
      <AttendanceWidget onPunchChange={fetchAttendance} />

      {/* Attendance logs table */}
      <AttendanceList
        records={records}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onEdit={handleOpenEdit}
        onDelete={canManageAll ? handleOpenDelete : undefined}
      />

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
