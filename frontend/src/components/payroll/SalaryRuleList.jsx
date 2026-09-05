/**
 * Salary Rules List & Dynamic Rule Form Component
 * 
 * RESPONSIBILITY:
 * Manages atomic salary rule definitions. Provides a dynamic creation/editing form
 * where input fields reactively adjust based on `computation_method`:
 * - 'fixed': renders fixed amount input.
 * - 'percentage': renders percentage value + percentage basis code selector.
 * - 'formula': renders formula math expression text editor.
 * 
 * NOT RESPONSIBLE FOR:
 * Assigning rules to structures (handled by SalaryStructureList).
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
import { PlusIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';

/**
 * Salary Rule List Component.
 * 
 * @param {object} props - Component props
 * @param {Array<object>} props.rules - List of salary rules
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onRuleSaved - Refresh callback
 * @returns {JSX.Element} Salary rules table and dynamic modal
 */
export default function SalaryRuleList({ rules = [], loading = false, onRuleSaved }) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('payroll.structure.manage');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'allowance',
    computation_method: 'fixed',
    fixed_amount: '',
    percentage_value: '0.40',
    percentage_basis_code: 'BASIC',
    formula: '',
    active: true
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleOpenCreate = () => {
    setSelectedRule(null);
    setFormData({
      name: '',
      code: '',
      category: 'allowance',
      computation_method: 'fixed',
      fixed_amount: '500',
      percentage_value: '0.40',
      percentage_basis_code: 'BASIC',
      formula: 'BASIC * 0.10 + 200',
      active: true
    });
    setErrorMessage('');
    setModalOpen(true);
  };

  const handleOpenEdit = (rule) => {
    setSelectedRule(rule);
    setFormData({
      name: rule.name || '',
      code: rule.code || '',
      category: rule.category || 'allowance',
      computation_method: rule.computation_method || 'fixed',
      fixed_amount: rule.fixed_amount !== null ? String(rule.fixed_amount) : '',
      percentage_value: rule.percentage_value !== null ? String(rule.percentage_value) : '0.40',
      percentage_basis_code: rule.percentage_basis_code || 'BASIC',
      formula: rule.formula || '',
      active: !!rule.active
    });
    setErrorMessage('');
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        code: formData.code.toUpperCase().trim(),
        category: formData.category,
        computation_method: formData.computation_method,
        fixed_amount: formData.computation_method === 'fixed' ? parseFloat(formData.fixed_amount || 0) : null,
        percentage_value: formData.computation_method === 'percentage' ? parseFloat(formData.percentage_value || 0) : null,
        percentage_basis_code: formData.computation_method === 'percentage' ? formData.percentage_basis_code : null,
        formula: formData.computation_method === 'formula' ? formData.formula : null,
        active: formData.active
      };

      if (selectedRule) {
        await axiosClient.put(`/payroll/rules/${selectedRule.id}`, payload);
      } else {
        await axiosClient.post('/payroll/rules', payload);
      }

      if (onRuleSaved) onRuleSaved();
      setModalOpen(false);
    } catch (err) {
      setErrorMessage(err.response?.data?.error?.message || 'Failed to save salary rule.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'code',
      label: 'Rule Code',
      render: (row) => (
        <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
          {row.code}
        </span>
      )
    },
    { key: 'name', label: 'Rule Name' },
    {
      key: 'category',
      label: 'Category',
      render: (row) => {
        const colorMap = {
          basic: 'indigo',
          allowance: 'green',
          deduction: 'red',
          gross: 'blue',
          net: 'purple',
          contribution: 'amber'
        };
        return (
          <Chip
            size="sm"
            variant="ghost"
            value={row.category}
            color={colorMap[row.category] || 'blue-gray'}
            className="w-fit capitalize font-semibold text-[11px]"
          />
        );
      }
    },
    {
      key: 'computation_method',
      label: 'Method & Value',
      render: (row) => {
        if (row.computation_method === 'fixed') {
          return (
            <span className="font-mono text-xs font-semibold text-blue-gray-800">
              Fixed: ${row.fixed_amount !== null ? Number(row.fixed_amount).toLocaleString() : 'Wage'}
            </span>
          );
        }
        if (row.computation_method === 'percentage') {
          return (
            <span className="font-mono text-xs font-semibold text-indigo-700">
              {(Number(row.percentage_value || 0) * 100).toFixed(1)}% of {row.percentage_basis_code || 'BASIC'}
            </span>
          );
        }
        return (
          <span className="font-mono text-xs text-blue-gray-600 bg-blue-gray-50 px-2 py-0.5 rounded">
            Formula: {row.formula}
          </span>
        );
      }
    },
    {
      key: 'status',
      label: 'Active',
      render: (row) => (
        <Chip
          size="sm"
          variant="ghost"
          value={row.active ? 'Active' : 'Inactive'}
          color={row.active ? 'green' : 'blue-gray'}
          className="w-fit font-semibold text-[10px]"
        />
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        canManage && (
          <Tooltip content="Edit Salary Rule">
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
        title="Salary Rules Engine Definitions"
        subtitle="Configure earnings, allowances, statutory deductions, percentage bases, and custom math formulas"
        columns={columns}
        data={rules}
        loading={loading}
        actionButton={
          canManage && (
            <Button
              color="indigo"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleOpenCreate}
            >
              <PlusIcon className="h-4 w-4" /> Add Salary Rule
            </Button>
          )
        }
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedRule ? `Edit Salary Rule (${selectedRule.code})` : 'Create Salary Rule'}
        size="lg"
        footer={
          <>
            <Button variant="text" color="blue-gray" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button color="indigo" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : selectedRule ? 'Update Rule' : 'Create Rule'}
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
                Rule Name *
              </Typography>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. House Rent Allowance"
                required
              />
            </div>

            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Rule Code (Uppercase Unique Identifier) *
              </Typography>
              <Input
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g. HRA"
                required
              />
            </div>

            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Category *
              </Typography>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
              >
                <option value="basic">Basic</option>
                <option value="allowance">Allowance</option>
                <option value="deduction">Deduction</option>
                <option value="gross">Gross</option>
                <option value="net">Net</option>
                <option value="contribution">Contribution</option>
              </select>
            </div>

            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Computation Method *
              </Typography>
              <select
                name="computation_method"
                value={formData.computation_method}
                onChange={handleChange}
                className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
              >
                <option value="fixed">Fixed Amount</option>
                <option value="percentage">Percentage (%)</option>
                <option value="formula">Formula Expression</option>
              </select>
            </div>
          </div>

          {/* DYNAMIC FORM FIELDS BASED ON COMPUTATION_METHOD */}
          {formData.computation_method === 'fixed' && (
            <div className="p-4 rounded-lg bg-blue-gray-50/50 border border-blue-gray-100">
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Fixed Amount ($) (Leave blank for BASIC to use contract wage)
              </Typography>
              <Input
                type="number"
                step="0.01"
                name="fixed_amount"
                value={formData.fixed_amount}
                onChange={handleChange}
                placeholder="e.g. 800.00"
              />
            </div>
          )}

          {formData.computation_method === 'percentage' && (
            <div className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                  Percentage Value (e.g. 0.40 for 40%) *
                </Typography>
                <Input
                  type="number"
                  step="0.001"
                  name="percentage_value"
                  value={formData.percentage_value}
                  onChange={handleChange}
                  placeholder="0.400"
                  required
                />
              </div>

              <div>
                <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                  Percentage Basis Rule Code *
                </Typography>
                <select
                  name="percentage_basis_code"
                  value={formData.percentage_basis_code}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
                >
                  <option value="BASIC">BASIC (Contract Basic Wage)</option>
                  <option value="WAGE">WAGE (Agreed Contract Wage)</option>
                  {rules
                    .filter((r) => !selectedRule || r.id !== selectedRule.id)
                    .map((r) => (
                      <option key={r.id} value={r.code}>
                        {r.code} - {r.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {formData.computation_method === 'formula' && (
            <div className="p-4 rounded-lg bg-blue-gray-50/50 border border-blue-gray-100 flex flex-col gap-2">
              <Typography variant="small" color="blue-gray" className="font-semibold text-xs">
                Mathematical Expression Editor *
              </Typography>
              <Input
                name="formula"
                value={formData.formula}
                onChange={handleChange}
                placeholder="e.g. BASIC * 0.15 + SPECIAL - PF"
                required
              />
              <span className="text-[11px] text-blue-gray-500">
                Variables: Reference prior rule codes in uppercase (e.g. <code className="text-indigo-600">BASIC</code>, <code className="text-indigo-600">HRA</code>, <code className="text-indigo-600">WORKED_DAYS</code>).
              </span>
            </div>
          )}
        </form>
      </Modal>
    </>
  );
}
