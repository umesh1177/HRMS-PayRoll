/**
 * User Create & Edit Modal Form
 * 
 * RESPONSIBILITY:
 * Provides a rich modal for managing user accounts, linking employees, setting statuses,
 * and assigning multiple roles simultaneously with inline validation.
 */

import React, { useState, useEffect } from 'react';
import {
  Input,
  Button,
  Alert,
  Typography,
  Checkbox
} from '@material-tailwind/react';
import { InformationCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';
import Modal from '../common/Modal';
import axiosClient from '../../api/axiosClient';
import { validateEmail, validateRequired } from '../../utils/formValidators';

/**
 * User Form Component for Single and Multi-Role Management.
 * 
 * @param {object} props
 * @param {boolean} props.open - Modal open state
 * @param {Function} props.onClose - Modal close handler
 * @param {object|null} [props.user] - Existing user object if editing
 * @param {Array<object>} props.roles - Available system roles
 * @param {Array<object>} props.employees - Available employees list
 * @param {Function} props.onSuccess - Success callback
 * @returns {JSX.Element}
 */
export default function UserForm({
  open,
  onClose,
  user = null,
  roles = [],
  employees = [],
  onSuccess
}) {
  const isEdit = !!user?.id;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState('active');
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);

  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setPassword('');
      setEmployeeId(user.employee_id ? String(user.employee_id) : '');
      setStatus(user.status || 'active');

      const existingRoleIds = user.roles && Array.isArray(user.roles)
        ? user.roles.map((r) => r.id)
        : user.role_id ? [user.role_id] : [];
      setSelectedRoleIds(existingRoleIds);
    } else {
      setEmail('');
      setPassword('');
      setEmployeeId('');
      setStatus('active');
      // Default to Employee role if available
      const defaultRole = roles.find((r) => r.name === 'Employee') || roles[0];
      setSelectedRoleIds(defaultRole ? [defaultRole.id] : []);
    }
    setTouched({});
    setErrorMessage('');
  }, [user, open, roles]);

  const emailError = validateEmail(email);
  const passwordError = isEdit
    ? (password && password.length < 6 ? 'Password must be at least 6 characters' : null)
    : (!password ? 'Password is required' : password.length < 6 ? 'Password must be at least 6 characters' : null);
  const roleError = selectedRoleIds.length === 0 ? 'Please select at least one role' : null;

  const hasErrors = isEdit
    ? (emailError || passwordError || roleError)
    : (emailError || passwordError || roleError);

  const handleRoleToggle = (roleId) => {
    setSelectedRoleIds((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((id) => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setTouched({ email: true, password: true, roles: true });

    if (hasErrors) {
      setErrorMessage('Please fix the highlighted fields before saving.');
      return;
    }

    setErrorMessage('');
    setSubmitting(true);

    try {
      const payload = {
        email: email.trim(),
        role_ids: selectedRoleIds,
        employee_id: employeeId ? Number(employeeId) : null,
        status
      };

      if (password && password.trim()) {
        payload.password = password.trim();
      }

      if (isEdit) {
        await axiosClient.put(`/auth/users/${user.id}`, payload);
      } else {
        await axiosClient.post('/auth/users', payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save user account.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit User Account (${user?.email})` : 'Create New User Account'}
      size="md"
      footer={
        <>
          <Button variant="text" color="blue-gray" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button color="indigo" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
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

        <div>
          <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
            Email Address *
          </Typography>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((p) => ({ ...p, email: true }))}
            error={!!(touched.email && emailError)}
            placeholder="user@company.com"
            required
          />
          {touched.email && emailError && (
            <p className="text-[11px] text-red-500 mt-1">{emailError}</p>
          )}
        </div>

        <div>
          <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
            {isEdit ? 'New Password (leave blank to keep current)' : 'Password *'}
          </Typography>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((p) => ({ ...p, password: true }))}
            error={!!(touched.password && passwordError)}
            placeholder={isEdit ? '••••••••' : 'Minimum 6 characters'}
            required={!isEdit}
          />
          {touched.password && passwordError && (
            <p className="text-[11px] text-red-500 mt-1">{passwordError}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Linked Employee Profile
            </Typography>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
            >
              <option value="">-- Standalone User (No Profile) --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Account Status *
            </Typography>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
            >
              <option value="active">Active</option>
              <option value="disabled">Disabled / Inactive</option>
            </select>
          </div>
        </div>

        {/* Assigned Roles Multi-Select Checkboxes */}
        <div className="mt-2 p-3 bg-blue-gray-50/50 rounded-xl border border-blue-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheckIcon className="h-4 w-4 text-indigo-600" />
              <Typography variant="small" color="blue-gray" className="font-bold text-xs uppercase tracking-wide">
                Assigned Roles (Multi-Role Support) *
              </Typography>
            </div>
            <span className="text-[11px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">
              {selectedRoleIds.length} Selected
            </span>
          </div>

          {touched.roles && roleError && (
            <p className="text-[11px] text-red-500 font-semibold mb-2">{roleError}</p>
          )}

          <div className="flex flex-col gap-2">
            {roles.map((r) => {
              const isChecked = selectedRoleIds.includes(r.id);
              return (
                <label
                  key={r.id}
                  className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-indigo-50/70 border-indigo-200 shadow-sm'
                      : 'bg-white border-blue-gray-100 hover:bg-blue-gray-50/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleRoleToggle(r.id)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <div className="flex-1">
                    <span className={`text-xs font-bold ${isChecked ? 'text-indigo-900' : 'text-blue-gray-800'}`}>
                      {r.name}
                    </span>
                    {r.description && (
                      <p className="text-[11px] text-blue-gray-500 font-normal leading-tight mt-0.5">
                        {r.description}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
}
