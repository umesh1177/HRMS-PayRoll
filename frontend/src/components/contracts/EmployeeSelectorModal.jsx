/**
 * Employee Multi-Select Picker Modal for Contracts
 * 
 * RESPONSIBILITY:
 * Provides an interactive modal dialog allowing Admins to search, filter, and multi-select
 * employees to be attached to a contract.
 */

import React, { useState, useEffect } from 'react';
import {
  Input,
  Button,
  Checkbox,
  Typography,
  Chip
} from '@material-tailwind/react';
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import Modal from '../common/Modal';

/**
 * Employee Selector Modal Component.
 * 
 * @param {object} props
 * @param {boolean} props.open - Open state
 * @param {Function} props.onClose - Close handler
 * @param {Array<object>} props.employees - All available employees
 * @param {Array<number>} props.selectedIds - Currently selected employee IDs
 * @param {Function} props.onConfirm - Callback with confirmed array of employee IDs: (ids: number[]) => void
 * @returns {JSX.Element}
 */
export default function EmployeeSelectorModal({
  open,
  onClose,
  employees = [],
  selectedIds = [],
  onConfirm
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelected, setTempSelected] = useState([]);

  useEffect(() => {
    setTempSelected(selectedIds || []);
    setSearchTerm('');
  }, [selectedIds, open]);

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
    const code = (emp.employee_code || '').toLowerCase();
    const email = (emp.email || '').toLowerCase();
    const dept = (emp.department_name || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    return fullName.includes(search) || code.includes(search) || email.includes(search) || dept.includes(search);
  });

  const handleToggle = (id) => {
    setTempSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredEmployees.map((e) => e.id);
    const allSelected = filteredIds.every((id) => tempSelected.includes(id));

    if (allSelected) {
      setTempSelected((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setTempSelected((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm(tempSelected);
    onClose();
  };

  const allFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((e) => tempSelected.includes(e.id));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select Employees for Contract"
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-blue-gray-600 font-medium">
            <strong className="text-indigo-600 font-bold">{tempSelected.length}</strong> employee(s) selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="text" color="blue-gray" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              color="indigo"
              size="sm"
              onClick={handleConfirm}
              className="flex items-center gap-1.5 shadow-indigo-500/20"
            >
              <CheckIcon className="h-4 w-4" /> Confirm Selection ({tempSelected.length})
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Search & Select All bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              type="text"
              label="Search by name, code, or department"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<MagnifyingGlassIcon className="h-4 w-4 text-blue-gray-400" />}
            />
          </div>
          {filteredEmployees.length > 0 && (
            <Button
              variant="outlined"
              color="blue-gray"
              size="sm"
              onClick={handleSelectAllFiltered}
              className="shrink-0 text-xs py-2"
            >
              {allFilteredSelected ? 'Deselect All' : 'Select All'}
            </Button>
          )}
        </div>

        {/* Employee List */}
        <div className="max-h-72 overflow-y-auto divide-y divide-blue-gray-50 border border-blue-gray-100 rounded-lg custom-scrollbar">
          {filteredEmployees.length === 0 ? (
            <div className="p-6 text-center text-xs text-blue-gray-400">
              No employees found matching "{searchTerm}"
            </div>
          ) : (
            filteredEmployees.map((emp) => {
              const isSelected = tempSelected.includes(emp.id);
              return (
                <label
                  key={emp.id}
                  className={`flex items-center justify-between p-3 transition-colors cursor-pointer ${
                    isSelected ? 'bg-indigo-50/60' : 'hover:bg-blue-gray-50/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(emp.id)}
                      className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-bold text-xs text-blue-gray-900 block">
                        {emp.first_name} {emp.last_name}
                      </span>
                      <span className="text-[11px] text-blue-gray-500 font-mono">
                        {emp.employee_code} • {emp.department_name || 'No Dept'} {emp.job_title ? `• ${emp.job_title}` : ''}
                      </span>
                    </div>
                  </div>
                  <Chip
                    size="sm"
                    variant="ghost"
                    value={isSelected ? 'Selected' : 'Click to Add'}
                    color={isSelected ? 'indigo' : 'blue-gray'}
                    className="font-bold text-[10px]"
                  />
                </label>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
