/**
 * Time Off Request Modal Form
 * 
 * RESPONSIBILITY:
 * Collects employee time-off requests.
 * - Admin: Requests time off on behalf of employees (no self-leave needed).
 * - HR Manager: Can take time off for themselves OR request time off on behalf of other employees.
 * - Employee: Requests self-service time off.
 */

import React, { useState, useEffect } from 'react';
import {
  Input,
  Button,
  Alert,
  Typography,
  Radio
} from '@material-tailwind/react';
import {
  InformationCircleIcon,
  UserIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import Modal from '../common/Modal';
import axiosClient from '../../api/axiosClient';
import { validateDateRange } from '../../utils/formValidators';
import { useAuth } from '../../context/AuthContext';

export default function TimeOffRequestForm({
  open,
  onClose,
  types = [],
  employees = [],
  onSuccess
}) {
  const { user, hasPermission } = useAuth();

  // Role detection
  const isAdmin = user?.role_name === 'Admin' || user?.roles?.some((r) => r.name === 'Admin') || hasPermission('system.admin');
  const isHR = !isAdmin && (user?.role_name?.includes('HR') || user?.roles?.some((r) => r.name?.includes('HR')) || hasPermission('timeoff.approve') || hasPermission('timeoff.manage_config'));

  // Target Mode:
  // - Admin is always 'other' (Admin does not request time off for self)
  // - HR can switch between 'self' and 'other'
  // - Regular Employee is always 'self'
  const [targetMode, setTargetMode] = useState(isAdmin ? 'other' : 'self');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const [formData, setFormData] = useState({
    time_off_type_id: types.length > 0 ? String(types[0].id) : '1',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (open) {
      if (isAdmin) {
        setTargetMode('other');
      } else {
        setTargetMode('self');
      }
      setSelectedEmployeeId('');
      setFormData({
        time_off_type_id: types.length > 0 ? String(types[0].id) : '1',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        reason: ''
      });
      setTouched({});
      setErrorMessage('');
    }
  }, [open, isAdmin, types]);

  // Calculate live days duration
  const getDuration = () => {
    if (!formData.start_date || !formData.end_date) return 0;
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    if (end < start) return 0;
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
  };

  const dateError = formData.start_date < today
    ? 'Start date cannot be earlier than today. Please choose today or a future date.'
    : validateDateRange(formData.start_date, formData.end_date, 'Start date', 'end date');
  const duration = getDuration();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setTouched({ start_date: true, end_date: true, employee_id: true });

    if (dateError) {
      setErrorMessage(dateError);
      return;
    }

    if ((targetMode === 'other' || isAdmin) && !selectedEmployeeId) {
      setErrorMessage('Please select an employee to request time off for.');
      return;
    }

    setErrorMessage('');
    setSubmitting(true);

    try {
      const payload = {
        time_off_type_id: Number(formData.time_off_type_id),
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason,
        status: 'submitted'
      };

      if (targetMode === 'other' || isAdmin) {
        payload.employee_id = Number(selectedEmployeeId);
      } else if (user?.employee_id) {
        payload.employee_id = Number(user.employee_id);
      }

      await axiosClient.post('/timeoff/requests', payload);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to submit time off request.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Resolve modal title
  let modalTitle = 'Request Time Off';
  if (isAdmin) {
    modalTitle = 'Request Time Off for Employee';
  } else if (isHR && targetMode === 'other') {
    modalTitle = 'Request Time Off for Another Employee';
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={modalTitle}
      size="md"
      footer={
        <>
          <Button variant="text" color="blue-gray" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            color="indigo"
            onClick={handleSubmit}
            disabled={submitting || !!dateError || duration <= 0 || ((targetMode === 'other' || isAdmin) && !selectedEmployeeId)}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errorMessage && (
          <Alert color="red" variant="gradient" icon={<InformationCircleIcon className="h-5 w-5" />}>
            <span className="text-xs font-medium">{errorMessage}</span>
          </Alert>
        )}

        {/* HR Role Selection Toggle: For Myself vs For Another Employee */}
        {isHR && (
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <Typography variant="small" color="blue-gray" className="font-semibold text-xs mb-2">
              Time Off Beneficiary
            </Typography>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="radio"
                  name="targetMode"
                  checked={targetMode === 'self'}
                  onChange={() => setTargetMode('self')}
                  className="accent-indigo-600 h-4 w-4"
                />
                <span className="flex items-center gap-1">
                  <UserIcon className="h-4 w-4 text-indigo-600" />
                  For Myself (HR Leave)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="radio"
                  name="targetMode"
                  checked={targetMode === 'other'}
                  onChange={() => setTargetMode('other')}
                  className="accent-indigo-600 h-4 w-4"
                />
                <span className="flex items-center gap-1">
                  <UserGroupIcon className="h-4 w-4 text-indigo-600" />
                  For Another Employee
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Employee Dropdown for Admin or HR when requesting for others */}
        {(isAdmin || (isHR && targetMode === 'other')) && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <Typography variant="small" color="blue-gray" className="font-semibold text-xs">
                Select Employee <span className="text-red-500">*</span>
              </Typography>
              <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-medium border border-indigo-100">
                {isAdmin ? 'Admin Delegated Leave' : 'HR Delegated Leave'}
              </span>
            </div>
            <select
              name="employee_id"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none bg-white font-medium"
              required
            >
              <option value="">-- Choose Employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_code}) {emp.department_name ? `• ${emp.department_name}` : ''}
                </option>
              ))}
            </select>
            {touched.employee_id && !selectedEmployeeId && (
              <p className="text-[11px] text-red-500 mt-1">Please select an employee.</p>
            )}
          </div>
        )}

        {/* Time Off Type */}
        <div>
          <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
            Time Off Type <span className="text-red-500">*</span>
          </Typography>
          <select
            name="time_off_type_id"
            value={formData.time_off_type_id}
            onChange={handleChange}
            className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none bg-white"
            required
          >
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.requires_allocation ? 'Quota Allocation' : 'No Allocation'})
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Start Date <span className="text-red-500">*</span>
            </Typography>
            <Input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              onBlur={() => handleBlur('start_date')}
              min={today}
              required
            />
          </div>

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              End Date <span className="text-red-500">*</span>
            </Typography>
            <Input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              onBlur={() => handleBlur('end_date')}
              min={formData.start_date || today}
              error={!!(touched.end_date && dateError)}
              required
            />
          </div>
        </div>

        {touched.end_date && dateError && (
          <p className="text-[11px] text-red-500 font-medium -mt-2">{dateError}</p>
        )}

        {/* Calculated Duration Banner */}
        <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-between">
          <span className="text-xs font-medium text-indigo-800">Calculated Leave Duration:</span>
          <span className={`font-bold text-sm font-mono ${duration <= 0 ? 'text-red-600' : 'text-indigo-900'}`}>
            {duration > 0 ? `${duration} Day(s)` : 'Invalid dates'}
          </span>
        </div>

        {/* Reason / Notes */}
        <div>
          <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
            Reason / Notes
          </Typography>
          <Input
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            placeholder="e.g. Annual leave, family obligations, medical..."
          />
        </div>
      </form>
    </Modal>
  );
}
