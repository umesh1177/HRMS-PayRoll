/**
 * Logged-in User Profile Modal
 *
 * RESPONSIBILITY:
 * Displays the authenticated user's employee profile and personal attendance totals,
 * and allows the user to edit only phone and photo URL.
 *
 * NOT RESPONSIBLE FOR:
 * Changing roles, employment status, salary, or organizational assignments.
 */

import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, CardBody, Input, Spinner, Typography } from '@material-tailwind/react';
import { BriefcaseIcon, BuildingOfficeIcon, CalendarDaysIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import Modal from './Modal';
import axiosClient from '../../api/axiosClient';

export default function ProfileModal({ open, onClose, user }) {
  const [employee, setEmployee] = useState(null);
  const [summary, setSummary] = useState(null);
  const [formData, setFormData] = useState({ phone: '', photo_url: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!open || !user?.employee_id) return;
    setLoading(true);
    setMessage('');
    setErrorMessage('');
    Promise.all([
      axiosClient.get(`/employees/${user.employee_id}`),
      axiosClient.get('/attendance/summary')
    ]).then(([employeeResponse, summaryResponse]) => {
      const profile = employeeResponse.data?.data;
      setEmployee(profile);
      setFormData({ phone: profile?.phone || '', photo_url: profile?.photo_url || '' });
      setSummary(summaryResponse.data?.data || null);
    }).catch((error) => {
      setErrorMessage(error.response?.data?.error?.message || 'Unable to load your profile.');
    }).finally(() => setLoading(false));
  }, [open, user?.employee_id]);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage('');
    try {
      await axiosClient.put(`/employees/${user.employee_id}`, formData);
      setEmployee((previous) => ({ ...previous, ...formData }));
      setMessage('Profile updated successfully.');
    } catch (error) {
      setErrorMessage(error.response?.data?.error?.message || 'Unable to update your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="My Profile" size="lg" footer={<Button variant="outlined" color="blue-gray" onClick={onClose}>Close</Button>}>
      {!user?.employee_id ? (
        <Alert color="blue" variant="ghost">No employee profile linked to this account.</Alert>
      ) : loading ? (
        <div className="flex justify-center p-8"><Spinner className="h-7 w-7 text-indigo-600" /></div>
      ) : (
        <div className="flex flex-col gap-5">
          {errorMessage && <Alert color="red" variant="gradient">{errorMessage}</Alert>}
          {message && <Alert color="green" variant="ghost">{message}</Alert>}
          <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-700 to-blue-600 p-5 text-white sm:flex-row sm:items-center">
            <img src={employee?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${employee?.first_name || ''} ${employee?.last_name || ''}`)}&background=6366f1&color=fff`} alt="Profile" className="h-20 w-20 rounded-full object-cover ring-4 ring-white/20" />
            <div>
              <Typography variant="h4" color="white" className="font-bold">{employee?.first_name} {employee?.last_name}</Typography>
              <p className="mt-1 text-sm text-indigo-100">{employee?.job_title || 'Employee'} · {employee?.department_name || 'No department'}</p>
              <p className="mt-2 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">{employee?.employee_code}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { label: 'Email', value: employee?.email, icon: EnvelopeIcon },
              { label: 'Phone', value: employee?.phone || 'Not provided', icon: PhoneIcon },
              { label: 'Department', value: employee?.department_name || 'Not assigned', icon: BuildingOfficeIcon },
              { label: 'Position', value: employee?.job_title || 'Not assigned', icon: BriefcaseIcon },
              { label: 'Manager', value: employee?.manager_name || 'Not assigned', icon: BriefcaseIcon },
              { label: 'Joined', value: employee?.date_joined || 'Not available', icon: CalendarDaysIcon }
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-start gap-3 rounded-xl border border-blue-gray-100 p-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                <div className="min-w-0"><span className="block text-xs text-blue-gray-500">{label}</span><p className="truncate font-semibold text-blue-gray-800">{value}</p></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card className="border border-blue-gray-100 shadow-sm"><CardBody className="p-4"><p className="text-xs font-semibold uppercase text-blue-gray-500">Today's Total Working Hours</p><p className="mt-2 text-2xl font-bold text-indigo-700">{Number(summary?.today_hours || 0).toFixed(2)} hrs</p></CardBody></Card>
            <Card className="border border-blue-gray-100 shadow-sm"><CardBody className="p-4"><p className="text-xs font-semibold uppercase text-blue-gray-500">This Week's Total Working Hours</p><p className="mt-2 text-2xl font-bold text-indigo-700">{Number(summary?.week_hours || 0).toFixed(2)} hrs</p></CardBody></Card>
          </div>
          <form onSubmit={handleSave} className="flex flex-col gap-4 border-t border-blue-gray-100 pt-4">
            <Typography variant="h6" color="blue-gray">Editable personal details</Typography>
            <Input label="Phone" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} />
            <Input label="Photo URL" value={formData.photo_url} onChange={(event) => setFormData({ ...formData, photo_url: event.target.value })} />
            <Button type="submit" color="indigo" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
          </form>
        </div>
      )}
    </Modal>
  );
}
