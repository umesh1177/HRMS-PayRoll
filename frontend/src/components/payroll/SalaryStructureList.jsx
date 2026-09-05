/**
 * Salary Structures List & Structure Rules Assigner
 * 
 * RESPONSIBILITY:
 * Manages salary structure configurations, assigning rules, and defining execution sequence order.
 * 
 * NOT RESPONSIBLE FOR:
 * Computing individual employee payslips.
 */

import React, { useState } from 'react';
import {
  Typography,
  Chip,
  Button,
  Input,
  Alert,
  IconButton,
  Tooltip
} from '@material-tailwind/react';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';

/**
 * Salary Structures List Component.
 * 
 * @param {object} props - Component props
 * @param {Array<object>} props.structures - Structures array
 * @param {Array<object>} props.rules - Available rules array for assignment
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onStructureSaved - Refresh callback
 * @returns {JSX.Element} Structures table and structure editor modal
 */
export default function SalaryStructureList({
  structures = [],
  rules = [],
  loading = false,
  onStructureSaved
}) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('payroll.structure.manage');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    assignedRules: []
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleOpenCreate = () => {
    setSelectedStructure(null);
    setFormData({
      name: '',
      description: '',
      status: 'active',
      assignedRules: rules.map((r, idx) => ({
        salary_rule_id: r.id,
        name: r.name,
        code: r.code,
        category: r.category,
        sequence: (idx + 1) * 10,
        selected: true
      }))
    });
    setErrorMessage('');
    setModalOpen(true);
  };

  const handleOpenEdit = async (structure) => {
    setSelectedStructure(structure);
    setErrorMessage('');

    try {
      const res = await axiosClient.get(`/payroll/structures/${structure.id}`);
      const detailed = res.data?.data;
      const currentRuleMap = {};
      if (detailed?.rules) {
        detailed.rules.forEach((r) => {
          currentRuleMap[r.salary_rule_id] = r.sequence;
        });
      }

      setFormData({
        name: structure.name || '',
        description: structure.description || '',
        status: structure.status || 'active',
        assignedRules: rules.map((r, idx) => ({
          salary_rule_id: r.id,
          name: r.name,
          code: r.code,
          category: r.category,
          sequence: currentRuleMap[r.id] !== undefined ? currentRuleMap[r.id] : (idx + 1) * 10,
          selected: currentRuleMap[r.id] !== undefined
        }))
      });
    } catch (err) {
      setFormData({
        name: structure.name,
        description: structure.description || '',
        status: structure.status || 'active',
        assignedRules: []
      });
    }

    setModalOpen(true);
  };

  const handleRuleToggle = (ruleId) => {
    setFormData((prev) => ({
      ...prev,
      assignedRules: prev.assignedRules.map((r) =>
        r.salary_rule_id === ruleId ? { ...r, selected: !r.selected } : r
      )
    }));
  };

  const handleSequenceChange = (ruleId, newSeq) => {
    setFormData((prev) => ({
      ...prev,
      assignedRules: prev.assignedRules.map((r) =>
        r.salary_rule_id === ruleId ? { ...r, sequence: parseInt(newSeq, 10) || 10 } : r
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      const selectedOnly = formData.assignedRules
        .filter((r) => r.selected)
        .map((r) => ({
          salary_rule_id: r.salary_rule_id,
          sequence: Number(r.sequence)
        }));

      const payload = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        rules: selectedOnly
      };

      if (selectedStructure) {
        await axiosClient.put(`/payroll/structures/${selectedStructure.id}`, payload);
      } else {
        await axiosClient.post('/payroll/structures', payload);
      }

      if (onStructureSaved) onStructureSaved();
      setModalOpen(false);
    } catch (err) {
      setErrorMessage(err.response?.data?.error?.message || 'Failed to save salary structure.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Structure Name',
      render: (row) => (
        <span className="font-bold text-sm text-blue-gray-800">{row.name}</span>
      )
    },
    { key: 'description', label: 'Description' },
    {
      key: 'rules_count',
      label: 'Assigned Rules',
      render: (row) => (
        <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded">
          {row.rules_count || 0} Rules
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Chip
          size="sm"
          variant="ghost"
          value={row.status}
          color={row.status === 'active' ? 'green' : 'blue-gray'}
          className="w-fit capitalize font-semibold text-[11px]"
        />
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        canManage && (
          <Tooltip content="Edit Structure & Rules">
            <IconButton
              variant="text"
              color="blue-gray"
              size="sm"
              onClick={() => handleOpenEdit(row)}
            >
              <PencilSquareIcon className="h-4 w-4 text-blue-gray-600" />
            </IconButton>
          </Tooltip>
        )
      )
    }
  ];

  return (
    <>
      <DataTable
        title="Salary Structures"
        subtitle="Group reusable salary rules and control execution sequence ordering for compensation packages"
        columns={columns}
        data={structures}
        loading={loading}
        actionButton={
          canManage && (
            <Button
              color="indigo"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleOpenCreate}
            >
              <PlusIcon className="h-4 w-4" /> Create Structure
            </Button>
          )
        }
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedStructure ? `Edit Structure: ${selectedStructure.name}` : 'Create Salary Structure'}
        size="lg"
        footer={
          <>
            <Button variant="text" color="blue-gray" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button color="indigo" onClick={handleSubmit} disabled={submitting || !formData.name}>
              {submitting ? 'Saving...' : selectedStructure ? 'Update Structure' : 'Create Structure'}
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

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Structure Name *
            </Typography>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Regular Salary Structure"
              required
            />
          </div>

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Description
            </Typography>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Full-time permanent engineering staff package"
            />
          </div>

          {/* Rules Sequence Selector */}
          <div>
            <Typography variant="small" color="blue-gray" className="font-bold text-xs uppercase tracking-wider mb-2">
              Rule Sequence Ordering & Inclusions
            </Typography>

            <div className="border border-blue-gray-100 rounded-lg max-h-60 overflow-y-auto divide-y divide-blue-gray-50">
              {formData.assignedRules.map((r) => (
                <div key={r.salary_rule_id} className="p-2.5 flex items-center justify-between text-xs hover:bg-blue-gray-50/50">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={r.selected}
                      onChange={() => handleRuleToggle(r.salary_rule_id)}
                      className="rounded text-indigo-600 h-4 w-4"
                    />
                    <div>
                      <span className="font-bold text-blue-gray-800">{r.name}</span>
                      <span className="font-mono text-[11px] text-indigo-600 ml-2">({r.code})</span>
                    </div>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-blue-gray-400 text-[11px]">Sequence:</span>
                    <input
                      type="number"
                      disabled={!r.selected}
                      value={r.sequence}
                      onChange={(e) => handleSequenceChange(r.salary_rule_id, e.target.value)}
                      className="w-16 px-2 py-1 border border-blue-gray-200 rounded text-center text-xs font-mono font-bold focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
