/**
 * Time Off Types Configuration List Component
 * 
 * RESPONSIBILITY:
 * Displays configured leave categories, allocation rules, payroll impact flags,
 * and handles adding new leave types.
 * 
 * NOT RESPONSIBLE FOR:
 * Processing individual employee requests.
 */

import React, { useState } from 'react';
import {
  Typography,
  Chip,
  Button,
  Input,
  Checkbox,
  Alert
} from '@material-tailwind/react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';

/**
 * Time Off Types List.
 * 
 * @param {object} props - Component props
 * @param {Array<object>} props.types - Leave types
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onTypeCreated - Refresh callback
 * @returns {JSX.Element} Types table and creation modal
 */
export default function TimeOffTypeList({ types = [], loading = false, onTypeCreated }) {
  const { hasPermission } = useAuth();
  const canManageConfig = hasPermission('timeoff.manage_config');

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('day');
  const [requiresAllocation, setRequiresAllocation] = useState(true);
  const [affectsPayroll, setAffectsPayroll] = useState(false);
  const [color, setColor] = useState('#4f46e5');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await axiosClient.post('/timeoff/types', {
        name,
        unit,
        requires_allocation: requiresAllocation,
        affects_payroll: affectsPayroll,
        color,
        active: true
      });
      if (onTypeCreated) onTypeCreated();
      setModalOpen(false);
      setName('');
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to create time off type.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Leave Type Name',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span
            className="h-3.5 w-3.5 rounded-full inline-block"
            style={{ backgroundColor: row.color || '#4f46e5' }}
          />
          <span className="font-bold text-sm text-blue-gray-800">{row.name}</span>
        </div>
      )
    },
    {
      key: 'unit',
      label: 'Unit',
      render: (row) => (
        <span className="uppercase text-xs font-semibold text-blue-gray-600 bg-blue-gray-50 px-2 py-1 rounded">
          {row.unit}
        </span>
      )
    },
    {
      key: 'requires_allocation',
      label: 'Requires Allocation',
      render: (row) => (
        <Chip
          size="sm"
          variant="ghost"
          value={row.requires_allocation ? 'Yes' : 'No'}
          color={row.requires_allocation ? 'indigo' : 'blue-gray'}
          className="w-fit font-semibold text-[11px]"
        />
      )
    },
    {
      key: 'affects_payroll',
      label: 'Affects Payroll (Deduction)',
      render: (row) => (
        <Chip
          size="sm"
          variant="ghost"
          value={row.affects_payroll ? 'Unpaid (Deducts)' : 'Paid'}
          color={row.affects_payroll ? 'amber' : 'green'}
          className="w-fit font-semibold text-[11px]"
        />
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Chip
          size="sm"
          variant="ghost"
          value={row.active ? 'Active' : 'Inactive'}
          color={row.active ? 'green' : 'red'}
          className="w-fit font-semibold text-[11px]"
        />
      )
    }
  ];

  return (
    <>
      <DataTable
        title="Time Off Types & Policies"
        subtitle="Configure workforce leave categories, allocation requirements, and payroll deduction rules"
        columns={columns}
        data={types}
        loading={loading}
        actionButton={
          canManageConfig && (
            <Button
              color="indigo"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setModalOpen(true)}
            >
              <PlusIcon className="h-4 w-4" /> Add Leave Type
            </Button>
          )
        }
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Time Off Type"
        size="md"
        footer={
          <>
            <Button variant="text" color="blue-gray" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button color="indigo" onClick={handleCreate} disabled={submitting || !name}>
              {submitting ? 'Saving...' : 'Create Type'}
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
              Type Name *
            </Typography>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Parental Leave, Bereavement"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Unit *
              </Typography>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
              >
                <option value="day">Day</option>
                <option value="hour">Hour</option>
              </select>
            </div>

            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Color Tag
              </Typography>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-full rounded border border-blue-gray-200 cursor-pointer p-1"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresAllocation}
                onChange={(e) => setRequiresAllocation(e.target.checked)}
                className="rounded text-indigo-600 h-4 w-4"
              />
              <span className="text-xs font-medium text-blue-gray-700">
                Requires Allocation Balance (Draws from approved allocation)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={affectsPayroll}
                onChange={(e) => setAffectsPayroll(e.target.checked)}
                className="rounded text-indigo-600 h-4 w-4"
              />
              <span className="text-xs font-medium text-blue-gray-700">
                Affects Payroll (Unpaid leave creates automatic salary deduction)
              </span>
            </label>
          </div>
        </form>
      </Modal>
    </>
  );
}
