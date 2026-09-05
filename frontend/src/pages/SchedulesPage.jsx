/**
 * Working Schedules Management Page
 * 
 * RESPONSIBILITY:
 * Main view for managing weekly working schedule templates and daily shift definitions.
 * Connects ScheduleList and ScheduleForm with backend API / mock fallbacks.
 * 
 * NOT RESPONSIBLE FOR:
 * Live punch attendance clocking.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@material-tailwind/react';
import { PlusIcon } from '@heroicons/react/24/outline';
import ScheduleList from '../components/schedules/ScheduleList';
import ScheduleForm from '../components/schedules/ScheduleForm';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import mockSchedules from '../api/mocks/schedules.json';

/**
 * Schedules Page Component.
 * 
 * @returns {JSX.Element} Schedules view
 */
export default function SchedulesPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('schedule.manage');

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/schedules');
      if (res.data?.data) {
        setSchedules(res.data.data);
      } else {
        setSchedules(mockSchedules);
      }
    } catch (err) {
      console.warn('Backend unavailable, rendering mock schedules.');
      setSchedules(mockSchedules);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedSchedule(null);
    setFormOpen(true);
  };

  const handleEdit = async (sch) => {
    try {
      // Fetch full schedule with nested lines
      const res = await axiosClient.get(`/schedules/${sch.id}`);
      if (res.data?.data) {
        setSelectedSchedule(res.data.data);
      } else {
        setSelectedSchedule(sch);
      }
    } catch (err) {
      setSelectedSchedule(sch);
    }
    setFormOpen(true);
  };

  const handleOpenDelete = (sch) => {
    setScheduleToDelete(sch);
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!scheduleToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await axiosClient.delete(`/schedules/${scheduleToDelete.id}`);
      setDeleteOpen(false);
      setScheduleToDelete(null);
      fetchSchedules();
    } catch (err) {
      console.error('Failed to delete schedule:', err);
      setDeleteError(err.response?.data?.message || 'Failed to delete schedule. It may be currently assigned to active employees or contracts.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <ScheduleList
        schedules={schedules}
        loading={loading}
        onEdit={handleEdit}
        onDelete={canManage ? handleOpenDelete : undefined}
        actionButton={
          canManage && (
            <Button
              color="indigo"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleCreate}
            >
              <PlusIcon className="h-4 w-4" /> Create Schedule
            </Button>
          )
        }
      />

      <ScheduleForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        schedule={selectedSchedule}
        onSuccess={fetchSchedules}
      />

      <ConfirmDeleteModal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setScheduleToDelete(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Delete Working Schedule"
        description={`Are you sure you want to delete working schedule "${scheduleToDelete?.name || ''}"? Shift definitions associated with this template will also be deleted.`}
        errorMessage={deleteError}
      />
    </div>
  );
}
