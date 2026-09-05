/**
 * Employee Create and Edit Modal Form
 * 
 * RESPONSIBILITY:
 * Collects employee demographic, organizational, and scheduling inputs.
 * Integrates user account creation, multi-role RBAC assignment, and automated credentials email dispatch.
 */

import React, { useState, useEffect } from 'react';
import {
  Input,
  Button,
  Alert,
  Typography
} from '@material-tailwind/react';
import {
  InformationCircleIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  KeyIcon
} from '@heroicons/react/24/solid';
import Modal from '../common/Modal';
import axiosClient from '../../api/axiosClient';
import {
  validateEmail,
  validatePhone,
  validateRequired
} from '../../utils/formValidators';

/**
 * Employee Form Component with Role Assignment & Credentials Dispatch.
 * 
 * @param {object} props - Component props
 * @param {boolean} props.open - Modal open state
 * @param {Function} props.onClose - Close modal handler
 * @param {object|null} [props.employee] - Existing employee object for edit mode
 * @param {Array<object>} props.departments - List of departments
 * @param {Array<object>} props.jobPositions - List of job positions
 * @param {Array<object>} props.schedules - List of working schedules
 * @param {Array<object>} props.managers - Potential managers list
 * @param {Array<object>} [props.roles] - Available RBAC roles
 * @param {Function} props.onSuccess - Callback triggered after successful creation/update
 * @returns {JSX.Element} Employee CRUD Modal
 */
export default function EmployeeForm({
  open,
  onClose,
  employee = null,
  departments = [],
  jobPositions = [],
  schedules = [],
  managers = [],
  roles = [],
  onSuccess
}) {
  const isEdit = !!employee?.id;

  const [formData, setFormData] = useState({
    employee_code: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department_id: '',
    job_position_id: '',
    manager_id: '',
    working_schedule_id: '',
    status: 'active',
    date_joined: new Date().toISOString().split('T')[0]
  });

  const [password, setPassword] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);

  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (employee) {
      setFormData({
        employee_code: employee.employee_code || '',
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        department_id: employee.department_id ? String(employee.department_id) : '',
        job_position_id: employee.job_position_id ? String(employee.job_position_id) : '',
        manager_id: employee.manager_id ? String(employee.manager_id) : '',
        working_schedule_id: employee.working_schedule_id ? String(employee.working_schedule_id) : '',
        status: employee.status || 'active',
        date_joined: employee.date_joined ? employee.date_joined.split('T')[0] : ''
      });
      setPassword('');

      // Preload roles if available
      const existingRoleIds = employee.roles && Array.isArray(employee.roles)
        ? employee.roles.map((r) => r.id)
        : employee.role_id ? [employee.role_id] : [];
      setSelectedRoleIds(existingRoleIds);
    } else {
      const randomCode = `EMP${Math.floor(100 + Math.random() * 900)}`;
      setFormData({
        employee_code: randomCode,
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        department_id: '',
        job_position_id: '',
        manager_id: '',
        working_schedule_id: '',
        status: 'active',
        date_joined: new Date().toISOString().split('T')[0]
      });
      setPassword('');

      // Default to Employee role
      const defaultRole = roles.find((r) => r.name === 'Employee') || roles[0];
      setSelectedRoleIds(defaultRole ? [defaultRole.id] : []);
    }
    setTouched({});
    setErrorMessage('');
  }, [employee, open, roles]);

  // Field validation checks
  const errors = {
    employee_code: validateRequired(formData.employee_code, 'Employee code', 2),
    first_name: validateRequired(formData.first_name, 'First name', 2),
    last_name: validateRequired(formData.last_name, 'Last name', 2),
    email: validateEmail(formData.email),
    phone: validatePhone(formData.phone),
    date_joined: validateRequired(formData.date_joined, 'Date joined'),
    roles: selectedRoleIds.length === 0 ? 'Please assign at least one role to this employee' : null
  };

  const hasErrors = Object.values(errors).some((err) => err !== null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

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
    setTouched({
      employee_code: true,
      first_name: true,
      last_name: true,
      email: true,
      phone: true,
      date_joined: true,
      roles: true
    });

    if (hasErrors) {
      setErrorMessage('Please correct the highlighted fields before submitting.');
      return;
    }

    setErrorMessage('');
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        department_id: formData.department_id ? Number(formData.department_id) : null,
        job_position_id: formData.job_position_id ? Number(formData.job_position_id) : null,
        manager_id: formData.manager_id ? Number(formData.manager_id) : null,
        working_schedule_id: formData.working_schedule_id ? Number(formData.working_schedule_id) : null,
        role_ids: selectedRoleIds,
        create_user: true
      };

      if (password && password.trim()) {
        payload.password = password.trim();
      }

      if (isEdit) {
        await axiosClient.put(`/employees/${employee.id}`, payload);
      } else {
        await axiosClient.post('/employees', payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save employee. Please verify required fields.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPositions = formData.department_id
    ? jobPositions.filter((jp) => String(jp.department_id) === String(formData.department_id))
    : jobPositions;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Employee (${employee?.employee_code})` : 'Add New Employee'}
      size="lg"
      footer={
        <>
          <Button variant="text" color="blue-gray" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button color="indigo" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving & Sending Email...' : isEdit ? 'Update Employee' : 'Create Employee & Send Credentials'}
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

        {/* SECTION 1: Personal & Demographic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Employee Code *
            </Typography>
            <Input
              name="employee_code"
              value={formData.employee_code}
              onChange={handleChange}
              onBlur={() => handleBlur('employee_code')}
              error={!!(touched.employee_code && errors.employee_code)}
              placeholder="EMP001"
              required
            />
            {touched.employee_code && errors.employee_code && (
              <p className="text-[11px] text-red-500 mt-1">{errors.employee_code}</p>
            )}
          </div>

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Status *
            </Typography>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
            >
              <option value="active">Active</option>
              <option value="inactive">Deactivated / Inactive</option>
              <option value="terminated">Terminated</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              First Name *
            </Typography>
            <Input
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              onBlur={() => handleBlur('first_name')}
              error={!!(touched.first_name && errors.first_name)}
              placeholder="Jane"
              required
            />
            {touched.first_name && errors.first_name && (
              <p className="text-[11px] text-red-500 mt-1">{errors.first_name}</p>
            )}
          </div>

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Last Name *
            </Typography>
            <Input
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              onBlur={() => handleBlur('last_name')}
              error={!!(touched.last_name && errors.last_name)}
              placeholder="Doe"
              required
            />
            {touched.last_name && errors.last_name && (
              <p className="text-[11px] text-red-500 mt-1">{errors.last_name}</p>
            )}
          </div>

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Work Email Address (Username) *
            </Typography>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur('email')}
              error={!!(touched.email && errors.email)}
              placeholder="jane.doe@company.com"
              required
            />
            {touched.email && errors.email && (
              <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Phone Number
            </Typography>
            <Input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={() => handleBlur('phone')}
              error={!!(touched.phone && errors.phone)}
              placeholder="+1-555-0100"
            />
            {touched.phone && errors.phone && (
              <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Department
            </Typography>
            <select
              name="department_id"
              value={formData.department_id}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
            >
              <option value="">-- Select Department --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Job Position
            </Typography>
            <select
              name="job_position_id"
              value={formData.job_position_id}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
            >
              <option value="">-- Select Position --</option>
              {filteredPositions.map((jp) => (
                <option key={jp.id} value={jp.id}>
                  {jp.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Reporting Manager
            </Typography>
            <select
              name="manager_id"
              value={formData.manager_id}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
            >
              <option value="">-- None (Top Level) --</option>
              {managers
                .filter((m) => !employee || m.id !== employee.id)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name} ({m.employee_code})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Working Schedule
            </Typography>
            <select
              name="working_schedule_id"
              value={formData.working_schedule_id}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
            >
              <option value="">-- Select Schedule --</option>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.total_weekly_hours} hrs/wk)
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Date Joined *
            </Typography>
            <Input
              type="date"
              name="date_joined"
              value={formData.date_joined}
              onChange={handleChange}
              onBlur={() => handleBlur('date_joined')}
              error={!!(touched.date_joined && errors.date_joined)}
              required
            />
            {touched.date_joined && errors.date_joined && (
              <p className="text-[11px] text-red-500 mt-1">{errors.date_joined}</p>
            )}
          </div>
        </div>

        {/* SECTION 2: User Account Credentials & Role Assignment */}
        <div className="mt-2 p-4 bg-indigo-50/40 rounded-xl border border-indigo-100/80">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheckIcon className="h-5 w-5 text-indigo-600" />
            <Typography variant="small" color="blue-gray" className="font-bold text-xs uppercase tracking-wide text-indigo-900">
              User Access Account & Role Assignments *
            </Typography>
          </div>

          <p className="text-xs text-blue-gray-600 mb-3 leading-relaxed">
            Assign the system access role(s) for this employee. Multiple roles can be assigned simultaneously.
          </p>

          {/* Role Checkboxes */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-blue-gray-800">
                Assigned Roles * ({selectedRoleIds.length} Selected)
              </span>
            </div>

            {touched.roles && errors.roles && (
              <p className="text-[11px] text-red-500 font-semibold mb-2">{errors.roles}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {roles.map((r) => {
                const isChecked = selectedRoleIds.includes(r.id);
                return (
                  <label
                    key={r.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-white border-indigo-300 shadow-xs'
                        : 'bg-white/60 border-blue-gray-100 hover:bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleRoleToggle(r.id)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <div className="flex-1">
                      <span className={`text-xs font-bold ${isChecked ? 'text-indigo-950' : 'text-blue-gray-800'}`}>
                        {r.name}
                      </span>
                      {r.description && (
                        <p className="text-[10px] text-blue-gray-500 font-normal leading-tight mt-0.5">
                          {r.description}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Password field */}
          <div className="mb-3">
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              {isEdit ? 'Update Login Password (leave blank to keep existing)' : 'Initial Password'}
            </Typography>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? '••••••••' : `Default: ${formData.first_name ? `${formData.first_name}@123` : 'Employee@123'}`}
              icon={<KeyIcon className="h-4 w-4 text-blue-gray-400" />}
            />
            <p className="text-[11px] text-blue-gray-500 mt-1">
              {!isEdit && 'If left blank, system automatically sets default password as '}
              <strong className="text-indigo-700">{formData.first_name ? `${formData.first_name}@123` : '<FirstName>@123'}</strong>
            </p>
          </div>

          {/* Email Notification Notice Banner */}
          <div className="flex items-start gap-2.5 p-2.5 bg-indigo-100/70 border border-indigo-200 rounded-lg text-indigo-900 text-xs">
            <EnvelopeIcon className="h-4 w-4 text-indigo-700 shrink-0 mt-0.5" />
            <span className="leading-tight">
              <strong>Automated Credential Dispatch:</strong> When this employee profile is created, a welcome email with their login email and password will be sent automatically to <span className="font-mono font-bold text-indigo-800">{formData.email || 'the provided email'}</span>.
            </span>
          </div>
        </div>
      </form>
    </Modal>
  );
}
