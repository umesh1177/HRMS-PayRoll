/**
 * Job Position Create & Edit Modal Form
 * 
 * RESPONSIBILITY:
 * Provides a clean modal form for creating and updating job positions / roles
 * and mapping them to their parent department.
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
 * Job Position Modal Form.
 * 
 * @param {object} props
 * @param {boolean} props.open - Modal open state
 * @param {Function} props.onClose - Close handler
 * @param {object|null} [props.position] - Existing position object if editing
 * @param {Array<object>} props.departments - Available departments
 * @param {Function} props.onSuccess - Callback upon successful save
 * @returns {JSX.Element}
 */
export default function JobPositionModal({
  open,
  onClose,
  position = null,
  departments = [],
  onSuccess
}) {
  const isEdit = !!position?.id;

  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (position) {
      setTitle(position.title || '');
      setDepartmentId(position.department_id ? String(position.department_id) : '');
    } else {
      setTitle('');
      setDepartmentId(departments[0]?.id ? String(departments[0].id) : '');
    }
    setTouched({});
    setErrorMessage('');
  }, [position, open, departments]);

  const titleError = !title.trim() ? 'Job title is required' : null;
  const departmentError = !departmentId ? 'Department is required' : null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setTouched({ title: true, department: true });

    if (titleError || departmentError) return;

    setErrorMessage('');
    setSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        department_id: Number(departmentId)
      };

      if (isEdit) {
        await axiosClient.put(`/departments/positions/${position.id}`, payload);
      } else {
        await axiosClient.post('/departments/positions', payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save job position.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Job Role: ${position?.title}` : 'Add New Job Role'}
      size="sm"
      footer={
        <>
          <Button variant="text" color="blue-gray" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button color="indigo" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Update Job Role' : 'Create Job Role'}
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
            Job Role / Position Title *
          </Typography>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched((p) => ({ ...p, title: true }))}
            error={!!(touched.title && titleError)}
            placeholder="e.g. Senior Full-Stack Engineer"
            required
          />
          {touched.title && titleError && (
            <p className="text-[11px] text-red-500 mt-1">{titleError}</p>
          )}
        </div>

        <div>
          <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
            Assigned Department *
          </Typography>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            onBlur={() => setTouched((p) => ({ ...p, department: true }))}
            className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
            required
          >
            <option value="">-- Select Department --</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {touched.department && departmentError && (
            <p className="text-[11px] text-red-500 mt-1">{departmentError}</p>
          )}
        </div>
      </form>
    </Modal>
  );
}
