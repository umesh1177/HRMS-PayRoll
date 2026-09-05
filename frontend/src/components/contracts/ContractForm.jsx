/**
 * Employment Contract Create and Edit Modal Form
 * 
 * RESPONSIBILITY:
 * Collects contract configuration inputs:
 * 1. Contract Name / Title (First field)
 * 2. Multi-Employee Assignment ("Add Employee in Contract" button & picker)
 * 3. Contract Type (dynamic from database)
 * 4. Monthly Wage, Salary Structure, Working Schedule, Start & End Dates, Status.
 */

import React, { useState, useEffect } from 'react';
import {
  Input,
  Button,
  Alert,
  Typography,
  Chip,
  IconButton,
  Tooltip
} from '@material-tailwind/react';
import {
  ExclamationTriangleIcon,
  UserPlusIcon,
  XMarkIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import Modal from '../common/Modal';
import EmployeeSelectorModal from './EmployeeSelectorModal';
import axiosClient from '../../api/axiosClient';
import {
  validatePositiveNumber,
  validateDateRange,
  validateRequired
} from '../../utils/formValidators';

/**
 * Contract Form Component with Multi-Employee Support.
 * 
 * @param {object} props - Component props
 * @param {boolean} props.open - Modal open state
 * @param {Function} props.onClose - Modal close handler
 * @param {object|null} [props.contract] - Existing contract object if editing
 * @param {Array<object>} props.employees - List of all employees
 * @param {Array<object>} props.departments - List of departments
 * @param {Array<object>} props.jobPositions - List of job positions
 * @param {Array<object>} props.schedules - List of working schedules
 * @param {Array<object>} [props.salaryStructures] - List of salary structures
 * @param {Function} props.onSuccess - Callback triggered after successful creation/update
 * @returns {JSX.Element} Contract CRUD Modal
 */
export default function ContractForm({
  open,
  onClose,
  contract = null,
  employees = [],
  departments = [],
  jobPositions = [],
  schedules = [],
  salaryStructures = [],
  onSuccess
}) {
  const isEdit = !!contract?.id;

  const [formData, setFormData] = useState({
    name: '',
    department_id: '',
    job_position_id: '',
    working_schedule_id: '',
    salary_structure_id: '1',
    wage: '5000',
    contract_type: 'permanent',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'draft'
  });

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false);
  const [contractTypes, setContractTypes] = useState([]);

  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch dynamic contract types
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await axiosClient.get('/contract-types');
        if (res.data?.data && res.data.data.length > 0) {
          setContractTypes(res.data.data);
        }
      } catch (err) {
        console.warn('Failed to load dynamic contract types, using defaults');
      }
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    if (contract) {
      setFormData({
        name: contract.name || '',
        department_id: contract.department_id ? String(contract.department_id) : '',
        job_position_id: contract.job_position_id ? String(contract.job_position_id) : '',
        working_schedule_id: contract.working_schedule_id ? String(contract.working_schedule_id) : '',
        salary_structure_id: contract.salary_structure_id ? String(contract.salary_structure_id) : '1',
        wage: contract.wage ? String(contract.wage) : '',
        contract_type: contract.contract_type || 'permanent',
        start_date: contract.start_date ? contract.start_date.split('T')[0] : '',
        end_date: contract.end_date ? contract.end_date.split('T')[0] : '',
        status: contract.status || 'draft'
      });
      setSelectedEmployeeIds(contract.employee_id ? [contract.employee_id] : []);
    } else {
      setFormData({
        name: '',
        department_id: '',
        job_position_id: '',
        working_schedule_id: '',
        salary_structure_id: '1',
        wage: '5000',
        contract_type: 'permanent',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        status: 'draft'
      });
      setSelectedEmployeeIds([]);
    }
    setTouched({});
    setErrorMessage('');
  }, [contract, open]);

  // Validation
  const errors = {
    name: validateRequired(formData.name, 'Contract name'),
    employees: selectedEmployeeIds.length === 0 ? 'Please add at least one employee to this contract.' : null,
    salary_structure_id: validateRequired(formData.salary_structure_id, 'Salary structure'),
    wage: validatePositiveNumber(formData.wage, 'Wage amount', 1),
    dates: validateDateRange(formData.start_date, formData.end_date, 'Start Date', 'End Date')
  };

  const hasErrors = Object.values(errors).some((err) => err !== null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleRemoveEmployee = (idToRemove) => {
    setSelectedEmployeeIds((prev) => prev.filter((id) => id !== idToRemove));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setTouched({
      name: true,
      employees: true,
      salary_structure_id: true,
      wage: true,
      start_date: true,
      end_date: true
    });

    if (hasErrors) {
      setErrorMessage('Please fix highlighted errors before submitting.');
      return;
    }

    setErrorMessage('');
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        employee_ids: selectedEmployeeIds,
        employee_id: selectedEmployeeIds[0] || null,
        department_id: formData.department_id ? Number(formData.department_id) : null,
        job_position_id: formData.job_position_id ? Number(formData.job_position_id) : null,
        working_schedule_id: formData.working_schedule_id ? Number(formData.working_schedule_id) : null,
        salary_structure_id: Number(formData.salary_structure_id || 1),
        wage: parseFloat(formData.wage),
        contract_type: formData.contract_type,
        start_date: formData.start_date,
        end_date: formData.end_date ? formData.end_date : null,
        status: formData.status
      };

      if (isEdit) {
        await axiosClient.put(`/contracts/${contract.id}`, payload);
      } else {
        await axiosClient.post('/contracts', payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save contract.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEmployeesList = employees.filter((emp) => selectedEmployeeIds.includes(emp.id));

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isEdit ? `Edit Contract: ${formData.name || `#${contract?.id}`}` : 'Create New Contract'}
        size="lg"
        footer={
          <>
            <Button variant="text" color="blue-gray" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button color="indigo" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : isEdit ? 'Update Contract' : `Create Contract (${selectedEmployeeIds.length} Staff)`}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMessage && (
            <Alert color="red" variant="gradient" icon={<ExclamationTriangleIcon className="h-5 w-5" />}>
              <span className="text-xs font-medium">{errorMessage}</span>
            </Alert>
          )}

          {/* 1. FIRST FIELD: Contract Name / Title */}
          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Contract Name / Title *
            </Typography>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={() => handleBlur('name')}
              error={!!(touched.name && errors.name)}
              placeholder="e.g. Standard Software Engineer Employment Agreement"
              required
            />
            {touched.name && errors.name && (
              <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* 2. ASSIGNED EMPLOYEES: Multi-Employee Support with "Add Employee in Contract" Button */}
          <div className="p-3.5 bg-blue-gray-50/50 rounded-xl border border-blue-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <UserGroupIcon className="h-4 w-4 text-indigo-600" />
                <Typography variant="small" color="blue-gray" className="font-bold text-xs uppercase tracking-wider">
                  Assigned Employees ({selectedEmployeeIds.length}) *
                </Typography>
              </div>
              <Button
                size="sm"
                color="indigo"
                variant="gradient"
                className="flex items-center gap-1.5 py-1.5 px-3 text-xs w-fit shadow-indigo-500/20"
                onClick={() => setEmployeePickerOpen(true)}
              >
                <UserPlusIcon className="h-3.5 w-3.5" /> Add Employee in Contract
              </Button>
            </div>

            {touched.employees && errors.employees && (
              <p className="text-[11px] text-red-500 font-semibold mb-2">{errors.employees}</p>
            )}

            {selectedEmployeesList.length === 0 ? (
              <div className="p-4 border border-dashed border-blue-gray-200 rounded-lg text-center bg-white">
                <p className="text-xs text-blue-gray-500">
                  No employees attached yet. Click <strong>"Add Employee in Contract"</strong> above to select one or multiple employees.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                {selectedEmployeesList.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center gap-1.5 bg-white border border-indigo-200 shadow-xs px-2.5 py-1 rounded-lg text-xs"
                  >
                    <span className="font-bold text-blue-gray-800">
                      {emp.first_name} {emp.last_name}
                    </span>
                    <span className="text-[10px] text-indigo-600 font-mono bg-indigo-50 px-1 rounded">
                      {emp.employee_code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmployee(emp.id)}
                      className="text-blue-gray-400 hover:text-red-500 ml-1"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. CONTRACT TERMS & PARAMETERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Monthly Wage / Salary ($) *
              </Typography>
              <Input
                type="number"
                step="0.01"
                min="1"
                name="wage"
                value={formData.wage}
                onChange={handleChange}
                onBlur={() => handleBlur('wage')}
                error={!!(touched.wage && errors.wage)}
                placeholder="5000.00"
                required
              />
              {touched.wage && errors.wage && (
                <p className="text-[11px] text-red-500 mt-1">{errors.wage}</p>
              )}
            </div>

            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Contract Type *
              </Typography>
              <select
                name="contract_type"
                value={formData.contract_type}
                onChange={handleChange}
                className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
              >
                {contractTypes.length > 0 ? (
                  contractTypes
                    .filter((ct) => ct.status === 'active' || ct.code === formData.contract_type)
                    .map((ct) => (
                      <option key={ct.id || ct.code} value={ct.code}>
                        {ct.name}
                      </option>
                    ))
                ) : (
                  <>
                    <option value="permanent">Permanent (Full Time)</option>
                    <option value="fixed_term">Fixed-Term (Temporary)</option>
                    <option value="contractor">Contractor (External)</option>
                    <option value="intern">Internship / Probation</option>
                    <option value="part_time">Part-Time</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Salary Structure *
              </Typography>
              <select
                name="salary_structure_id"
                value={formData.salary_structure_id}
                onChange={handleChange}
                onBlur={() => handleBlur('salary_structure_id')}
                className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
              >
                {salaryStructures.length === 0 ? (
                  <option value="1">Regular Salary Structure</option>
                ) : (
                  salaryStructures.map((ss) => (
                    <option key={ss.id} value={ss.id}>
                      {ss.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Contract Status *
              </Typography>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
              >
                <option value="draft">Draft (Planning)</option>
                <option value="running">Running (Active)</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Contract Start Date *
              </Typography>
              <Input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                onBlur={() => handleBlur('start_date')}
                required
              />
            </div>

            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Contract End Date (Optional)
              </Typography>
              <Input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                onBlur={() => handleBlur('end_date')}
                error={!!(touched.end_date && errors.dates)}
              />
              {touched.end_date && errors.dates && (
                <p className="text-[11px] text-red-500 mt-1">{errors.dates}</p>
              )}
            </div>

            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Department (Optional Override)
              </Typography>
              <select
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
              >
                <option value="">-- Employee Primary Department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Working Schedule (Optional)
              </Typography>
              <select
                name="working_schedule_id"
                value={formData.working_schedule_id}
                onChange={handleChange}
                className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
              >
                <option value="">-- Default Schedule --</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.total_weekly_hours} hrs/wk)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Employee Multi-Select Picker Modal */}
      <EmployeeSelectorModal
        open={employeePickerOpen}
        onClose={() => setEmployeePickerOpen(false)}
        employees={employees}
        selectedIds={selectedEmployeeIds}
        onConfirm={(ids) => setSelectedEmployeeIds(ids)}
      />
    </>
  );
}
