/**
 * Department Create & Edit Modal Form
 * 
 * RESPONSIBILITY:
 * Provides a clean modal form for creating and updating company departments
 * and assigning department managers.
 */

import React, { useState, useEffect } from 'react';
import {
  Input,
  Button,
  Alert,
  Typography
} from '@material-tailwind/react';
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import Modal from '../common/Modal';
import axiosClient from '../../api/axiosClient';

/**
 * Department Modal Form.
 * 
 * @param {object} props
 * @param {boolean} props.open - Modal open state
 * @param {Function} props.onClose - Close handler
 * @param {object|null} [props.department] - Existing department object if editing
 * @param {Array<object>} props.employees - Available employees for manager assignment
 * @param {Function} props.onSuccess - Callback upon successful save
 * @returns {JSX.Element}
 */
export default function DepartmentModal({
  open,
  onClose,
  department = null,
  employees = [],
  onSuccess
}) {
  const isEdit = !!department?.id;

  const [name, setName] = useState('');
  const [managerId, setManagerId] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (department) {
      setName(department.name || '');
      setManagerId(department.manager_id ? String(department.manager_id) : '');
    } else {
      setName('');
      setManagerId('');
    }
    setTouched(false);
    setErrorMessage('');
  }, [department, open]);

  const nameError = !name.trim() ? 'Department name is required' : null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setTouched(true);

    if (nameError) return;

    setErrorMessage('');
    setSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        manager_id: managerId ? Number(managerId) : null
      };

      if (isEdit) {
        await axiosClient.put(`/departments/${department.id}`, payload);
      } else {
        await axiosClient.post('/departments', payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save department.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Department: ${department?.name}` : 'Add New Department'}
      size="sm"
      footer={
        <>
          <Button variant="text" color="blue-gray" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button color="indigo" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Update Department' : 'Create Department'}
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
            Department Name *
          </Typography>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            error={!!(touched && nameError)}
            placeholder="e.g. Engineering & Technology"
            required
          />
          {touched && nameError && (
            <p className="text-[11px] text-red-500 mt-1">{nameError}</p>
          )}
        </div>

        <div>
          <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
            Department Manager (Optional)
          </Typography>
          <select
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
          >
            <option value="">-- No Manager Assigned --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name} ({emp.employee_code})
              </option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}
