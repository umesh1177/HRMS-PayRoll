/**
 * Employment Contract Create and Edit Modal Form
 * 
 * RESPONSIBILITY:
 * Collects contract configuration inputs (wage, salary structure, period dates, status)
 * and submits creation/update payloads with inline real-time validation.
 */

import React, { useState, useEffect } from 'react';
import {
  Input,
  Button,
  Alert,
  Typography
} from '@material-tailwind/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import Modal from '../common/Modal';
import axiosClient from '../../api/axiosClient';
import {
  validatePositiveNumber,
  validateDateRange,
  validateRequired
} from '../../utils/formValidators';

/**
 * Contract Form Component.
 * 
 * @param {object} props - Component props
 * @param {boolean} props.open - Modal open state
 * @param {Function} props.onClose - Modal close handler
 * @param {object|null} [props.contract] - Existing contract object if editing
 * @param {Array<object>} props.employees - List of employees
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
    employee_id: '',
    department_id: '',
    job_position_id: '',
    working_schedule_id: '',
    salary_structure_id: '1',
    wage: '',
    contract_type: 'permanent',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'draft'
  });

  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (contract) {
      setFormData({
        employee_id: contract.employee_id ? String(contract.employee_id) : '',
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
    } else {
      setFormData({
        employee_id: employees.length > 0 ? String(employees[0].id) : '',
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
    }
    setTouched({});
    setErrorMessage('');
  }, [contract, open, employees]);

  const [contractTypes, setContractTypes] = useState([]);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await axiosClient.get('/contract-types');
        if (res.data?.data && res.data.data.length > 0) {
          setContractTypes(res.data.data);
        }
      } catch (err) {
        // Fallback to defaults
      }
    };
    fetchTypes();
  }, []);

  // Validation
  const errors = {
    employee_id: validateRequired(formData.employee_id, 'Employee'),
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      employee_id: true,
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
        employee_id: Number(formData.employee_id),
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
      const msg = err.response?.data?.error?.message || 'Failed to save contract.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Contract (#${contract?.id})` : 'Create New Contract'}
      size="lg"
      footer={
        <>
          <Button variant="text" color="blue-gray" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button color="indigo" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Update Contract' : 'Create Contract'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errorMessage && (
          <Alert color="red" variant="gradient" icon={<ExclamationTriangleIcon className="h-5 w-5" />}>
            {errorMessage}
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Employee *
            </Typography>
            <select
              name="employee_id"
              value={formData.employee_id}
              onChange={handleChange}
              onBlur={() => handleBlur('employee_id')}
              disabled={isEdit}
              className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none disabled:bg-blue-gray-50"
            >
              <option value="">-- Select Employee --</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name} ({e.employee_code})
                </option>
              ))}
            </select>
            {touched.employee_id && errors.employee_id && (
              <p className="text-[11px] text-red-500 mt-1">{errors.employee_id}</p>
            )}
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
              Working Schedule
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
        </div>
      </form>
    </Modal>
  );
}
