/**
 * Employee Create and Edit Modal Form
 * 
 * RESPONSIBILITY:
 * Collects employee demographic, organizational, and scheduling inputs.
 * Dispatches creation (POST /employees) or update (PUT /employees/:id) requests.
 * 
 * NOT RESPONSIBLE FOR:
 * Viewing contracts or computing salary lines.
 */

import React, { useState, useEffect } from 'react';
import {
  Input,
  Select,
  Option,
  Button,
  Alert,
  Typography
} from '@material-tailwind/react';
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import Modal from '../common/Modal';
import axiosClient from '../../api/axiosClient';

/**
 * Employee Form Component.
 * 
 * @param {object} props - Component props
 * @param {boolean} props.open - Modal open state
 * @param {Function} props.onClose - Close modal handler
 * @param {object|null} [props.employee] - Existing employee object for edit mode
 * @param {Array<object>} props.departments - List of departments
 * @param {Array<object>} props.jobPositions - List of job positions
 * @param {Array<object>} props.schedules - List of working schedules
 * @param {Array<object>} props.managers - Potential managers list
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
    } else {
      // Auto-generate code for new employee
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
    }
    setErrorMessage('');
  }, [employee, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        department_id: formData.department_id ? Number(formData.department_id) : null,
        job_position_id: formData.job_position_id ? Number(formData.job_position_id) : null,
        manager_id: formData.manager_id ? Number(formData.manager_id) : null,
        working_schedule_id: formData.working_schedule_id ? Number(formData.working_schedule_id) : null
      };

      if (isEdit) {
        await axiosClient.put(`/employees/${employee.id}`, payload);
      } else {
        await axiosClient.post('/employees', payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to save employee. Please verify required fields.';
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
      title={isEdit ? `Edit Employee (${employee.employee_code})` : 'Add New Employee'}
      size="lg"
      footer={
        <>
          <Button variant="text" color="blue-gray" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button color="indigo" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Update Employee' : 'Create Employee'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errorMessage && (
          <Alert color="red" variant="gradient" icon={<InformationCircleIcon className="h-5 w-5" />}>
            {errorMessage}
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Employee Code *
            </Typography>
            <Input
              name="employee_code"
              value={formData.employee_code}
              onChange={handleChange}
              placeholder="EMP001"
              required
            />
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
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
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
              placeholder="Jane"
              required
            />
          </div>

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Last Name *
            </Typography>
            <Input
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Doe"
              required
            />
          </div>

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Email Address *
            </Typography>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="jane.doe@company.com"
              required
            />
          </div>

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Phone Number
            </Typography>
            <Input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1-555-0100"
            />
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
              required
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
