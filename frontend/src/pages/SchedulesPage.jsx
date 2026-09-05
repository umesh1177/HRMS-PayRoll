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

  return (
    <div className="mt-6">
      <ScheduleList
        schedules={schedules}
        loading={loading}
        onEdit={handleEdit}
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
    </div>
  );
}
