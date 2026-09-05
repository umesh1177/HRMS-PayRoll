/**
 * Time Off Allocations List Component
 * 
 * RESPONSIBILITY:
 * Displays employee annual leave quotas, taken balances, remaining days,
 * and allows HR Managers to grant new time-off allocations.
 * 
 * NOT RESPONSIBLE FOR:
 * Processing individual leave approval decisions.
 */

import React, { useState } from 'react';
import {
  Typography,
  Chip,
  Button,
  Input,
  Progress,
  Alert
} from '@material-tailwind/react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import { isValidPositiveNumber, isValidDateRange } from '../../utils/formValidators';

/**
 * Time Off Allocation List.
 * 
 * @param {object} props - Component props
 * @param {Array<object>} props.allocations - Allocations array
 * @param {Array<object>} props.employees - Employees array for dropdown
 * @param {Array<object>} props.types - Leave types for dropdown
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onAllocationCreated - Callback on creation
 * @returns {JSX.Element} Allocation table and grant modal
 */
export default function AllocationList({
  allocations = [],
  employees = [],
  types = [],
  loading = false,
  onAllocationCreated
}) {
  const { hasPermission } = useAuth();
  const canManageConfig = hasPermission('timeoff.manage_config');

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    time_off_type_id: '',
    allocated_amount: '15',
    valid_from: `${new Date().getFullYear()}-01-01`,
    valid_to: `${new Date().getFullYear()}-12-31`
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const validateAllocationForm = (data) => {
    const errs = {};
    if (!data.employee_id) {
      errs.employee_id = 'Please select an employee.';
    }
    if (!data.time_off_type_id) {
      errs.time_off_type_id = 'Please select a leave type.';
    }
    if (!data.allocated_amount || !isValidPositiveNumber(data.allocated_amount)) {
      errs.allocated_amount = 'Allocated amount must be greater than 0.';
    }
    if (!data.valid_from) {
      errs.valid_from = 'Valid from date is required.';
    }
    if (data.valid_from && data.valid_to && !isValidDateRange(data.valid_from, data.valid_to)) {
      errs.valid_to = 'Valid to date cannot be before valid from date.';
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    if (touched[name]) {
      const vErrors = validateAllocationForm(updated);
      setErrors(vErrors);
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const vErrors = validateAllocationForm(formData);
    setErrors(vErrors);
  };

  const handleCreate = async (e) => {
    if (e) e.preventDefault();
    setTouched({
      employee_id: true,
      time_off_type_id: true,
      allocated_amount: true,
      valid_from: true,
      valid_to: true
    });

    const validationErrors = validateAllocationForm(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    try {
      await axiosClient.post('/timeoff/allocations', {
        employee_id: Number(formData.employee_id),
        time_off_type_id: Number(formData.time_off_type_id),
        allocated_amount: parseFloat(formData.allocated_amount),
        valid_from: formData.valid_from,
        valid_to: formData.valid_to || null,
        status: 'approved'
      });

      if (onAllocationCreated) onAllocationCreated();
      setModalOpen(false);
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to grant allocation.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'employee_name',
      label: 'Employee',
      render: (row) => (
        <div>
          <p className="font-semibold text-sm text-blue-gray-800">{row.employee_name}</p>
          <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
            {row.employee_code}
          </span>
        </div>
      )
    },
    {
      key: 'type_name',
      label: 'Leave Type',
      render: (row) => (
        <span className="text-xs font-semibold text-blue-gray-700 bg-blue-gray-50 px-2 py-1 rounded">
          {row.type_name}
        </span>
      )
    },
    {
      key: 'allocated_amount',
      label: 'Total Allocated',
      render: (row) => (
        <span className="font-mono font-bold text-xs text-blue-gray-800">
          {row.allocated_amount} {row.unit}s
        </span>
      )
    },
    {
      key: 'taken_amount',
      label: 'Taken',
      render: (row) => (
        <span className="font-mono text-xs text-amber-700 font-semibold">
          {row.taken_amount} {row.unit}s
        </span>
      )
    },
    {
      key: 'remaining_amount',
      label: 'Remaining Balance',
      render: (row) => {
        const allocated = Number(row.allocated_amount) || 1;
        const remaining = Number(row.remaining_amount !== undefined ? row.remaining_amount : allocated - Number(row.taken_amount || 0));
        const pctUsed = Math.min(100, Math.round(((allocated - remaining) / allocated) * 100));

        return (
          <div className="w-36">
            <div className="flex justify-between text-[11px] font-semibold mb-1">
              <span className="text-indigo-700">{remaining} remaining</span>
              <span className="text-blue-gray-400">{pctUsed}% used</span>
            </div>
            <Progress value={pctUsed} color={pctUsed > 80 ? 'amber' : 'indigo'} size="sm" />
          </div>
        );
      }
    },
    {
      key: 'validity',
      label: 'Validity Period',
      render: (row) => (
        <span className="text-xs text-blue-gray-500">
          {row.valid_from} → {row.valid_to || 'Ongoing'}
        </span>
      )
    }
  ];

  return (
    <>
      <DataTable
        title="Time Off Balance Allocations"
        subtitle="Manage employee leave quotas, valid policy intervals, and track drawdown balances"
        columns={columns}
        data={allocations}
        loading={loading}
        actionButton={
          canManageConfig && (
            <Button
              color="indigo"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => {
                setFormData({
                  employee_id: employees.length > 0 ? String(employees[0].id) : '',
                  time_off_type_id: types.length > 0 ? String(types[0].id) : '',
                  allocated_amount: '15',
                  valid_from: `${new Date().getFullYear()}-01-01`,
                  valid_to: `${new Date().getFullYear()}-12-31`
                });
                setModalOpen(true);
              }}
            >
              <PlusIcon className="h-4 w-4" /> Grant Allocation
            </Button>
          )
        }
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Grant Time Off Allocation"
        size="md"
        footer={
          <>
            <Button variant="text" color="blue-gray" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button color="indigo" onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Granting...' : 'Grant Allocation'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          {errorMsg && (
            <Alert color="red" variant="gradient" icon={<InformationCircleIcon className="h-5 w-5" />}>
              {errorMsg}
            </Alert>
          )}

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Employee *
            </Typography>
            <select
              name="employee_id"
              value={formData.employee_id}
              onChange={handleChange}
              onBlur={() => handleBlur('employee_id')}
              className={`w-full h-10 px-3 rounded-md border text-sm focus:outline-none ${
                touched.employee_id && errors.employee_id
                  ? 'border-red-500'
                  : 'border-blue-gray-200 focus:border-indigo-600'
              }`}
            >
              <option value="">-- Select Employee --</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name} ({e.employee_code})
                </option>
              ))}
            </select>
            {touched.employee_id && errors.employee_id && (
              <p className="text-xs text-red-500 mt-1">{errors.employee_id}</p>
            )}
          </div>

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Leave Type *
            </Typography>
            <select
              name="time_off_type_id"
              value={formData.time_off_type_id}
              onChange={handleChange}
              onBlur={() => handleBlur('time_off_type_id')}
              className={`w-full h-10 px-3 rounded-md border text-sm focus:outline-none ${
                touched.time_off_type_id && errors.time_off_type_id
                  ? 'border-red-500'
                  : 'border-blue-gray-200 focus:border-indigo-600'
              }`}
            >
              <option value="">-- Select Type --</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {touched.time_off_type_id && errors.time_off_type_id && (
              <p className="text-xs text-red-500 mt-1">{errors.time_off_type_id}</p>
            )}
          </div>

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Allocated Amount (Days) *
            </Typography>
            <Input
              type="number"
              name="allocated_amount"
              value={formData.allocated_amount}
              onChange={handleChange}
              onBlur={() => handleBlur('allocated_amount')}
              placeholder="15"
              error={touched.allocated_amount && !!errors.allocated_amount}
            />
            {touched.allocated_amount && errors.allocated_amount && (
              <p className="text-xs text-red-500 mt-1">{errors.allocated_amount}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Valid From *
              </Typography>
              <Input
                type="date"
                name="valid_from"
                value={formData.valid_from}
                onChange={handleChange}
                onBlur={() => handleBlur('valid_from')}
                error={touched.valid_from && !!errors.valid_from}
              />
              {touched.valid_from && errors.valid_from && (
                <p className="text-xs text-red-500 mt-1">{errors.valid_from}</p>
              )}
            </div>

            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Valid To
              </Typography>
              <Input
                type="date"
                name="valid_to"
                value={formData.valid_to}
                onChange={handleChange}
                onBlur={() => handleBlur('valid_to')}
                error={touched.valid_to && !!errors.valid_to}
              />
              {touched.valid_to && errors.valid_to && (
                <p className="text-xs text-red-500 mt-1">{errors.valid_to}</p>
              )}
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
