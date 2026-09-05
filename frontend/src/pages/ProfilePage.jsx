/**
 * User Profile & Account Settings Page
 * 
 * RESPONSIBILITY:
 * Provides user self-service profile management for all roles (Admin, HR Manager, HR Payroll, Employee).
 * - Allows editing non-critical personal information (First Name, Last Name, Phone, Photo URL) and Password.
 * - Displays read-only organization and employment information (Employee Code, Work Email, Department,
 *   Job Position, Reporting Manager, Working Schedule, Date Joined, Status).
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Input,
  Button,
  Avatar,
  Chip,
  Alert,
  Spinner
} from '@material-tailwind/react';
import {
  UserCircleIcon,
  KeyIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';

export default function ProfilePage() {
  const { user, updateCachedUser } = useAuth();

  const getInitialFirstName = () => {
    if (user?.first_name) return user.first_name;
    if (user?.role === 'Admin' || user?.role_name === 'Admin') return 'System';
    const emailPrefix = user?.email?.split('@')[0] || '';
    const part = emailPrefix.split('.')[0] || 'User';
    return part.charAt(0).toUpperCase() + part.slice(1);
  };

  const getInitialLastName = () => {
    if (user?.last_name) return user.last_name;
    if (user?.role === 'Admin' || user?.role_name === 'Admin') return 'Administrator';
    const emailPrefix = user?.email?.split('@')[0] || '';
    const parts = emailPrefix.split('.');
    if (parts.length > 1) {
      return parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    }
    return '';
  };

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  // Editable Profile Form State
  const [form, setForm] = useState({
    first_name: getInitialFirstName(),
    last_name: getInitialLastName(),
    phone: user?.phone || '',
    photo_url: user?.photo_url || ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Change Form State
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/auth/me');
      if (res.data?.data) {
        const data = res.data.data;
        setProfileData(data);
        setForm({
          first_name: data.first_name || getInitialFirstName(),
          last_name: data.last_name !== null && data.last_name !== undefined ? data.last_name : getInitialLastName(),
          phone: data.phone || '',
          photo_url: data.photo_url || ''
        });
      }
    } catch (err) {
      console.warn('Failed to load profile details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setSavingProfile(true);

    try {
      const res = await axiosClient.put('/auth/profile', {
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        photo_url: form.photo_url
      });

      if (res.data?.data) {
        const updated = res.data.data;
        setProfileData(updated);
        updateCachedUser({
          first_name: updated.first_name,
          last_name: updated.last_name,
          photo_url: updated.photo_url
        });
        setProfileSuccess('Personal profile updated successfully!');
        setTimeout(() => setProfileSuccess(''), 4000);
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update profile.';
      setProfileError(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    setSavingPassword(true);
    try {
      await axiosClient.put('/auth/profile', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });

      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to change password.';
      setPasswordError(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading && !profileData) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner className="h-10 w-10 text-indigo-600" />
      </div>
    );
  }

  const displayName = profileData?.first_name
    ? `${profileData.first_name} ${profileData.last_name || ''}`
    : profileData?.email?.split('@')[0] || user?.email || 'User';

  return (
    <div className="mt-4 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Profile Header Card */}
      <Card className="border border-blue-gray-100 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-900 via-indigo-700 to-blue-600" />
        <CardBody className="p-6 relative pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-14">
            <div className="flex items-end gap-4">
              <Avatar
                src={
                  form.photo_url ||
                  profileData?.photo_url ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=240&q=80'
                }
                alt={displayName}
                size="xxl"
                variant="rounded"
                className="border-4 border-white shadow-xl bg-white"
              />
              <div className="mb-2">
                <Typography variant="h4" color="blue-gray" className="font-bold flex items-center gap-2">
                  {displayName}
                </Typography>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs text-blue-gray-500 font-medium flex items-center gap-1">
                    <EnvelopeIcon className="h-3.5 w-3.5" />
                    {profileData?.email || user?.email}
                  </span>
                  {profileData?.employee_code && (
                    <Chip
                      size="sm"
                      value={`ID: ${profileData.employee_code}`}
                      className="bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold"
                    />
                  )}
                  <Chip
                    size="sm"
                    value={profileData?.role || user?.role || 'Member'}
                    className="bg-emerald-50 text-emerald-700 text-[10px] font-bold capitalize"
                  />
                  <Chip
                    size="sm"
                    value={profileData?.status || 'Active'}
                    className="bg-blue-50 text-blue-700 text-[10px] font-semibold capitalize"
                  />
                </div>
              </div>
            </div>

            <div className="mb-2 text-right hidden md:block">
              <span className="text-xs text-blue-gray-400">Account Management</span>
              <p className="text-xs font-semibold text-blue-gray-700">Self-Service Profile</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Main Content Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editable Personal Details & Security (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Editable Personal Information */}
          <Card className="border border-blue-gray-100 shadow-sm">
            <CardHeader floated={false} shadow={false} className="m-0 p-5 pb-3 border-b border-blue-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h6" color="blue-gray" className="font-bold flex items-center gap-2">
                    <PencilSquareIcon className="h-5 w-5 text-indigo-600" />
                    Personal Information
                  </Typography>
                  <Typography variant="small" className="text-blue-gray-500 text-xs">
                    Update your contact and personal information
                  </Typography>
                </div>
                <Chip
                  value="Editable"
                  size="sm"
                  className="bg-indigo-50 text-indigo-700 text-[10px] font-bold"
                />
              </div>
            </CardHeader>
            <CardBody className="p-6">
              {profileSuccess && (
                <Alert color="green" icon={<CheckCircleIcon className="h-5 w-5" />} className="mb-4 text-xs">
                  {profileSuccess}
                </Alert>
              )}
              {profileError && (
                <Alert color="red" icon={<ExclamationCircleIcon className="h-5 w-5" />} className="mb-4 text-xs">
                  {profileError}
                </Alert>
              )}

              <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. John"
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                      required
                      className="!border-blue-gray-200 focus:!border-indigo-600 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-blue-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Doe"
                      value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                      required
                      className="!border-blue-gray-200 focus:!border-indigo-600 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <Input
                    type="tel"
                    placeholder="e.g. +1 (555) 019-2834"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    icon={<PhoneIcon className="h-4 w-4 text-blue-gray-400" />}
                    className="!border-blue-gray-200 focus:!border-indigo-600 text-xs"
                  />
                  <span className="text-[11px] text-blue-gray-400 mt-1 block">
                    Used for HR notifications and workplace contact.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-gray-700 mb-1">
                    Profile Photo URL
                  </label>
                  <Input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={form.photo_url}
                    onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                    className="!border-blue-gray-200 focus:!border-indigo-600 text-xs"
                  />
                  <span className="text-[11px] text-blue-gray-400 mt-1 block">
                    Paste an image URL to customize your dashboard avatar.
                  </span>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    color="indigo"
                    size="sm"
                    disabled={savingProfile}
                    className="flex items-center gap-2 py-2.5 px-5 text-xs shadow-md"
                  >
                    {savingProfile && <Spinner className="h-3.5 w-3.5" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          {/* Account Security & Password Change */}
          <Card className="border border-blue-gray-100 shadow-sm">
            <CardHeader floated={false} shadow={false} className="m-0 p-5 pb-3 border-b border-blue-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h6" color="blue-gray" className="font-bold flex items-center gap-2">
                    <KeyIcon className="h-5 w-5 text-indigo-600" />
                    Security & Password
                  </Typography>
                  <Typography variant="small" className="text-blue-gray-500 text-xs">
                    Change your account password securely
                  </Typography>
                </div>
                <Chip
                  value="Security"
                  size="sm"
                  className="bg-amber-50 text-amber-700 text-[10px] font-bold"
                />
              </div>
            </CardHeader>
            <CardBody className="p-6">
              {passwordSuccess && (
                <Alert color="green" icon={<CheckCircleIcon className="h-5 w-5" />} className="mb-4 text-xs">
                  {passwordSuccess}
                </Alert>
              )}
              {passwordError && (
                <Alert color="red" icon={<ExclamationCircleIcon className="h-5 w-5" />} className="mb-4 text-xs">
                  {passwordError}
                </Alert>
              )}

              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-blue-gray-700 mb-1">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    className="!border-blue-gray-200 focus:!border-indigo-600 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-gray-700 mb-1">
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="password"
                      placeholder="Min 6 characters"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      required
                      className="!border-blue-gray-200 focus:!border-indigo-600 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-blue-gray-700 mb-1">
                      Confirm New Password <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="password"
                      placeholder="Repeat new password"
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      required
                      className="!border-blue-gray-200 focus:!border-indigo-600 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="outlined"
                    color="indigo"
                    size="sm"
                    disabled={savingPassword || !passwordForm.new_password}
                    className="flex items-center gap-2 py-2.5 px-5 text-xs"
                  >
                    {savingPassword && <Spinner className="h-3.5 w-3.5" />}
                    Update Password
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Organization & Employment Details (Read-Only) (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card className="border border-blue-gray-100 shadow-sm">
            <CardHeader floated={false} shadow={false} className="m-0 p-5 pb-3 border-b border-blue-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h6" color="blue-gray" className="font-bold flex items-center gap-2">
                    <BuildingOfficeIcon className="h-5 w-5 text-indigo-600" />
                    Organization & Employment
                  </Typography>
                  <Typography variant="small" className="text-blue-gray-500 text-xs">
                    Official company records (Admin managed)
                  </Typography>
                </div>
                <span className="flex items-center gap-1 text-[11px] text-blue-gray-400 bg-blue-gray-50 px-2 py-0.5 rounded font-medium">
                  <LockClosedIcon className="h-3 w-3" /> Read-Only
                </span>
              </div>
            </CardHeader>
            <CardBody className="p-5 flex flex-col divide-y divide-blue-gray-50">
              {/* Employee Code */}
              <div className="py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-blue-gray-500 flex items-center gap-1.5">
                  <BriefcaseIcon className="h-4 w-4 text-blue-gray-400" />
                  Employee ID
                </span>
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded">
                  {profileData?.employee_code || (user?.role === 'Admin' || user?.role_name === 'Admin' ? 'ADM-001' : (user?.employee_code || `EMP-${String(user?.id || 1).padStart(3, '0')}`))}
                </span>
              </div>

              {/* Work Email */}
              <div className="py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-blue-gray-500 flex items-center gap-1.5">
                  <EnvelopeIcon className="h-4 w-4 text-blue-gray-400" />
                  Work Email
                </span>
                <span className="text-xs font-semibold text-blue-gray-800 truncate max-w-[200px]">
                  {profileData?.email || user?.email}
                </span>
              </div>

              {/* Department */}
              <div className="py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-blue-gray-500 flex items-center gap-1.5">
                  <BuildingOfficeIcon className="h-4 w-4 text-blue-gray-400" />
                  Department
                </span>
                <span className="text-xs font-semibold text-blue-gray-800">
                  {profileData?.department_name || (user?.role === 'Admin' || user?.role_name === 'Admin' ? 'Executive & Board' : 'General Operations')}
                </span>
              </div>

              {/* Job Position */}
              <div className="py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-blue-gray-500 flex items-center gap-1.5">
                  <UserGroupIcon className="h-4 w-4 text-blue-gray-400" />
                  Job Position
                </span>
                <span className="text-xs font-semibold text-blue-gray-800">
                  {profileData?.job_position_name || profileData?.role || user?.role || 'Staff'}
                </span>
              </div>

              {/* Reporting Manager */}
              <div className="py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-blue-gray-500 flex items-center gap-1.5">
                  <UserCircleIcon className="h-4 w-4 text-blue-gray-400" />
                  Reporting Manager
                </span>
                <span className="text-xs font-semibold text-blue-gray-800">
                  {profileData?.manager_name || 'Executive Management'}
                </span>
              </div>

              {/* Working Schedule */}
              <div className="py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-blue-gray-500 flex items-center gap-1.5">
                  <CalendarDaysIcon className="h-4 w-4 text-blue-gray-400" />
                  Working Schedule
                </span>
                <span className="text-xs font-semibold text-blue-gray-800">
                  {profileData?.working_schedule_name || 'Standard 40h (Mon-Fri)'}
                </span>
              </div>

              {/* Date Joined */}
              <div className="py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-blue-gray-500 flex items-center gap-1.5">
                  <CalendarDaysIcon className="h-4 w-4 text-blue-gray-400" />
                  Date of Joining
                </span>
                <span className="text-xs font-semibold text-blue-gray-800">
                  {profileData?.date_joined ? formatDate(profileData.date_joined) : 'Active Member'}
                </span>
              </div>

              {/* Role Permissions Summary */}
              <div className="pt-3 flex flex-col gap-2">
                <span className="text-xs font-medium text-blue-gray-500 flex items-center gap-1.5">
                  <ShieldCheckIcon className="h-4 w-4 text-blue-gray-400" />
                  Assigned Roles
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {profileData?.roles && profileData.roles.length > 0 ? (
                    profileData.roles.map((r) => (
                      <Chip
                        key={r.id}
                        size="sm"
                        value={r.name}
                        className="bg-blue-gray-100 text-blue-gray-800 text-[10px] font-semibold"
                      />
                    ))
                  ) : (
                    <Chip
                      size="sm"
                      value={profileData?.role || user?.role || 'Employee'}
                      className="bg-blue-gray-100 text-blue-gray-800 text-[10px] font-semibold"
                    />
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
