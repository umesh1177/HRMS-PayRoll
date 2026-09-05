/**
 * Two-Step Payrun Creation Wizard Component
 * 
 * RESPONSIBILITY:
 * Implements the two-step payroll creation wizard matching the wireframe:
 * - Step 1: Defines payrun scope (Name, Salary Structure, Period Start, Period End).
 * - Step 2: Queries eligible employees with active running contracts matching the structure,
 *   provides multi-select checkboxes, and disables submission until >= 1 employee is selected.
 * 
 * NOT RESPONSIBLE FOR:
 * Triggering post-creation calculations or state transitions.
 */

import React, { useState, useEffect } from 'react';
import {
  Input,
  Button,
  Alert,
  Typography,
  Checkbox,
  Spinner
} from '@material-tailwind/react';
import {
  InformationCircleIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/solid';
import Modal from '../common/Modal';
import axiosClient from '../../api/axiosClient';

/**
 * Payrun Creation Wizard.
 * 
 * @param {object} props - Component props
 * @param {boolean} props.open - Modal open state
 * @param {Function} props.onClose - Modal close handler
 * @param {Array<object>} props.structures - Available salary structures
 * @param {Function} props.onSuccess - Callback upon successful payrun creation
 * @returns {JSX.Element} Two-step wizard modal
 */
export default function PayrunForm({
  open,
  onClose,
  structures = [],
  onSuccess
}) {
  const [step, setStep] = useState(1);

  // Step 1: Scope Form Data
  const [scopeData, setScopeData] = useState({
    name: '',
    salary_structure_id: structures.length > 0 ? String(structures[0].id) : '1',
    period_start: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
    period_end: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}`
  });

  // Step 2: Employee Selection State
  const [eligibleEmployees, setEligibleEmployees] = useState([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState(new Set());
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Default auto-populated payrun name
  useEffect(() => {
    if (open) {
      setStep(1);
      const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      setScopeData((prev) => ({
        ...prev,
        name: `${monthName} Payroll`,
        salary_structure_id: structures.length > 0 ? String(structures[0].id) : '1'
      }));
      setErrorMessage('');
      setSelectedEmpIds(new Set());
    }
  }, [open, structures]);

  const handleScopeChange = (e) => {
    const { name, value } = e.target;
    setScopeData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Advances from Step 1 to Step 2 and loads eligible employees for the selected scope.
   */
  const handleProceedToStep2 = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoadingEmployees(true);

    try {
      const res = await axiosClient.get(
        `/payroll/payruns/eligible-employees?salary_structure_id=${scopeData.salary_structure_id}&period_start=${scopeData.period_start}&period_end=${scopeData.period_end}`
      );

      const emps = res.data?.data || [];
      setEligibleEmployees(emps);
      // Default to selecting all eligible employees
      setSelectedEmpIds(new Set(emps.map((e) => e.employee_id)));
      setStep(2);
    } catch (err) {
      setErrorMessage(err.response?.data?.error?.message || 'Failed to fetch eligible employees for this period.');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleToggleEmployee = (empId) => {
    const updated = new Set(selectedEmpIds);
    if (updated.has(empId)) {
      updated.delete(empId);
    } else {
      updated.add(empId);
    }
    setSelectedEmpIds(updated);
  };

  const handleSelectAll = () => {
    if (selectedEmpIds.size === eligibleEmployees.length) {
      setSelectedEmpIds(new Set());
    } else {
      setSelectedEmpIds(new Set(eligibleEmployees.map((e) => e.employee_id)));
    }
  };

  /**
   * Confirms payrun creation and freezes contract_id into payrun_employees per Schema Note #4.
   */
  const handleSubmitPayrun = async () => {
    if (selectedEmpIds.size === 0) return;

    setErrorMessage('');
    setSubmitting(true);

    try {
      const payload = {
        name: scopeData.name,
        salary_structure_id: Number(scopeData.salary_structure_id),
        period_start: scopeData.period_start,
        period_end: scopeData.period_end,
        employee_ids: Array.from(selectedEmpIds)
      };

      await axiosClient.post('/payroll/payruns', payload);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err.response?.data?.error?.message || 'Failed to create payrun.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={step === 1 ? 'Create Payrun — Step 1: Define Scope' : 'Create Payrun — Step 2: Select Employees'}
      size="lg"
      footer={
        <>
          <Button variant="text" color="blue-gray" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>

          {step === 1 ? (
            <Button
              color="indigo"
              onClick={handleProceedToStep2}
              disabled={loadingEmployees || !scopeData.name}
              className="flex items-center gap-2"
            >
              {loadingEmployees ? <Spinner className="h-4 w-4" /> : <>Next: Select Employees <ChevronRightIcon className="h-4 w-4" /></>}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outlined"
                color="blue-gray"
                onClick={() => setStep(1)}
                disabled={submitting}
                className="flex items-center gap-1"
              >
                <ChevronLeftIcon className="h-4 w-4" /> Back to Scope
              </Button>
              <Button
                color="indigo"
                onClick={handleSubmitPayrun}
                disabled={submitting || selectedEmpIds.size === 0}
                className="flex items-center gap-2"
              >
                {submitting ? 'Creating Payrun...' : `Create Payrun (${selectedEmpIds.size} Employees)`}
              </Button>
            </div>
          )}
        </>
      }
    >
      {errorMessage && (
        <Alert color="red" variant="gradient" icon={<InformationCircleIcon className="h-5 w-5" />} className="mb-4">
          {errorMessage}
        </Alert>
      )}

      {/* STEP 1: SCOPE */}
      {step === 1 && (
        <form onSubmit={handleProceedToStep2} className="flex flex-col gap-4">
          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Payrun Name *
            </Typography>
            <Input
              name="name"
              value={scopeData.name}
              onChange={handleScopeChange}
              placeholder="e.g. September 2026 Payroll"
              required
            />
          </div>

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Salary Structure *
            </Typography>
            <select
              name="salary_structure_id"
              value={scopeData.salary_structure_id}
              onChange={handleScopeChange}
              className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
            >
              {structures.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.rules_count || 0} Rules)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Period Start *
              </Typography>
              <Input
                type="date"
                name="period_start"
                value={scopeData.period_start}
                onChange={handleScopeChange}
                required
              />
            </div>

            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Period End *
              </Typography>
              <Input
                type="date"
                name="period_end"
                value={scopeData.period_end}
                onChange={handleScopeChange}
                required
              />
            </div>
          </div>
        </form>
      )}

      {/* STEP 2: ELIGIBLE EMPLOYEES SELECTION */}
      {step === 2 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-xs">
            <div>
              <span className="font-bold text-indigo-900">Period: </span>
              <span className="text-indigo-700">{scopeData.period_start} to {scopeData.period_end}</span>
            </div>
            <div className="font-semibold text-indigo-800">
              {selectedEmpIds.size} of {eligibleEmployees.length} Selected
            </div>
          </div>

          {eligibleEmployees.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-blue-gray-200 rounded-lg text-blue-gray-400 text-sm">
              No employees with active running contracts found for this structure & period.
            </div>
          ) : (
            <div className="border border-blue-gray-100 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-blue-gray-50 text-blue-gray-700 font-bold uppercase sticky top-0 border-b border-blue-gray-100">
                  <tr>
                    <th className="p-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedEmpIds.size === eligibleEmployees.length && eligibleEmployees.length > 0}
                        onChange={handleSelectAll}
                        className="rounded text-indigo-600 h-4 w-4"
                      />
                    </th>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Department</th>
                    <th className="p-3 text-right">Contract Wage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-gray-50">
                  {eligibleEmployees.map((emp) => {
                    const isSelected = selectedEmpIds.has(emp.employee_id);
                    return (
                      <tr
                        key={emp.employee_id}
                        onClick={() => handleToggleEmployee(emp.employee_id)}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/40' : 'hover:bg-blue-gray-50/30'}`}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by row click
                            className="rounded text-indigo-600 h-4 w-4"
                          />
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-blue-gray-800">{emp.name}</span>
                          <span className="font-mono text-indigo-600 ml-2">({emp.employee_code})</span>
                        </td>
                        <td className="p-3 text-blue-gray-600">{emp.department_name || 'N/A'}</td>
                        <td className="p-3 text-right font-mono font-bold text-indigo-700">
                          ${Number(emp.wage || 0).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
