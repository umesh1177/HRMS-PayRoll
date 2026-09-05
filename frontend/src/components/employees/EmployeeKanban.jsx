/**
 * Employee Kanban / Grid Card View Component
 * 
 * RESPONSIBILITY:
 * Renders the employee directory in a responsive card/kanban grid with
 * photo avatars, job titles, departments, contact info, status badges,
 * and quick actions for viewing 360 profile and editing.
 * 
 * NOT RESPONSIBLE FOR:
 * Database queries or modal dialog state.
 */

import React from 'react';
import {
  Card,
  CardBody,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Input,
  Spinner
} from '@material-tailwind/react';
import {
  EyeIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

/**
 * Employee Kanban Cards View.
 * 
 * @param {object} props - Component props
 * @param {Array<object>} props.employees - Employee list
 * @param {boolean} props.loading - Loading flag
 * @param {number} props.page - Current page
 * @param {number} props.totalPages - Total pages
 * @param {Function} props.onPageChange - Page change callback
 * @param {string} props.searchTerm - Current search text
 * @param {Function} props.onSearchChange - Search text callback
 * @param {Function} props.onView - View profile callback
 * @param {Function} props.onEdit - Edit employee callback
 * @param {React.ReactNode} [props.actionButton] - Action button (e.g. Add Employee)
 * @returns {JSX.Element} Kanban cards grid
 */
export default function EmployeeKanban({
  employees = [],
  loading = false,
  page = 1,
  totalPages = 1,
  onPageChange,
  searchTerm = '',
  onSearchChange,
  onView,
  onEdit,
  actionButton
}) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('employee.manage');

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'amber';
      case 'terminated':
      case 'suspended':
        return 'red';
      default:
        return 'blue-gray';
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top Search and Action Header */}
      <Card className="border border-blue-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-full sm:w-80">
            <Input
              label="Search employees..."
              icon={<MagnifyingGlassIcon className="h-5 w-5" />}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-blue-gray-500">
              Showing {employees.length} employee{employees.length !== 1 ? 's' : ''}
            </span>
            {actionButton}
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Spinner className="h-8 w-8 text-indigo-600" />
          <Typography variant="small" color="blue-gray" className="font-medium">
            Loading employees...
          </Typography>
        </div>
      ) : employees.length === 0 ? (
        /* Empty State */
        <Card className="border border-blue-gray-100 shadow-sm p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-3">
            <BriefcaseIcon className="h-8 w-8" />
          </div>
          <Typography variant="h6" color="blue-gray" className="font-bold">
            No employees found
          </Typography>
          <Typography variant="small" color="gray" className="text-xs mt-1 max-w-sm mx-auto">
            {searchTerm ? `No results match "${searchTerm}". Try another search term.` : 'No employee records are available.'}
          </Typography>
        </Card>
      ) : (
        /* Kanban Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {employees.map((emp) => {
            const avatarUrl =
              emp.photo_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                (emp.first_name || '') + ' ' + (emp.last_name || '')
              )}&background=6366f1&color=fff&bold=true`;

            return (
              <Card
                key={emp.id}
                className="border border-blue-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group"
              >
                {/* Card Header Profile Banner */}
                <div className="relative bg-gradient-to-r from-blue-gray-50 to-indigo-50/50 p-4 pb-2 border-b border-blue-gray-100/60">
                  <div className="flex items-start justify-between gap-2">
                    <div className="relative">
                      <img
                        src={avatarUrl}
                        alt={emp.first_name}
                        className="h-14 w-14 rounded-xl object-cover border-2 border-white shadow-md"
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white ${
                          emp.status === 'active' ? 'bg-green-500' : 'bg-amber-500'
                        }`}
                        title={emp.status}
                      />
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="font-mono font-bold text-[11px] text-indigo-700 bg-white border border-indigo-100 px-2 py-0.5 rounded shadow-sm">
                        {emp.employee_code}
                      </span>
                      <Chip
                        size="sm"
                        variant="ghost"
                        color={getStatusColor(emp.status)}
                        value={emp.status}
                        className="py-0.5 px-2 text-[10px] capitalize font-bold"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <Typography variant="h6" color="blue-gray" className="font-bold text-sm truncate leading-tight">
                      {emp.first_name} {emp.last_name}
                    </Typography>
                    <Typography variant="small" className="text-xs text-indigo-600 font-medium truncate mt-0.5">
                      {emp.job_title || 'Software Engineer'}
                    </Typography>
                  </div>
                </div>

                {/* Card Body Details */}
                <CardBody className="p-4 flex-1 flex flex-col justify-between gap-3 text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-gray-600">
                      <BuildingOfficeIcon className="h-4 w-4 shrink-0 text-blue-gray-400" />
                      <span className="truncate font-medium">{emp.department_name || 'Engineering'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-blue-gray-600">
                      <EnvelopeIcon className="h-4 w-4 shrink-0 text-blue-gray-400" />
                      <span className="truncate text-blue-gray-700">{emp.email || 'N/A'}</span>
                    </div>

                    {emp.phone && (
                      <div className="flex items-center gap-2 text-blue-gray-600">
                        <PhoneIcon className="h-4 w-4 shrink-0 text-blue-gray-400" />
                        <span className="truncate">{emp.phone}</span>
                      </div>
                    )}

                    {emp.working_schedule_name && (
                      <div className="flex items-center gap-2 text-blue-gray-500 text-[11px]">
                        <ClockIcon className="h-4 w-4 shrink-0 text-blue-gray-400" />
                        <span className="truncate">{emp.working_schedule_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-3 border-t border-blue-gray-50 flex items-center justify-between gap-2 mt-1">
                    <Button
                      size="sm"
                      variant="text"
                      color="indigo"
                      className="flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold hover:bg-indigo-50 flex-1 justify-center"
                      onClick={() => onView(emp)}
                    >
                      <EyeIcon className="h-4 w-4" /> 360° Profile
                    </Button>

                    {canManage && (
                      <Tooltip content="Edit Employee">
                        <IconButton
                          size="sm"
                          variant="text"
                          color="blue-gray"
                          onClick={() => onEdit(emp)}
                          className="hover:bg-blue-gray-50 shrink-0"
                        >
                          <PencilSquareIcon className="h-4 w-4 text-blue-gray-600" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-blue-gray-100 bg-white p-4 rounded-xl shadow-sm">
          <Typography variant="small" color="blue-gray" className="font-normal text-xs">
            Page <strong className="text-blue-gray-900">{page}</strong> of{' '}
            <strong className="text-blue-gray-900">{totalPages}</strong>
          </Typography>
          <div className="flex gap-2">
            <Button
              variant="outlined"
              size="sm"
              color="blue-gray"
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
              className="flex items-center gap-1 text-xs py-1.5 px-3"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" /> Previous
            </Button>
            <Button
              variant="outlined"
              size="sm"
              color="blue-gray"
              disabled={page === totalPages}
              onClick={() => onPageChange(page + 1)}
              className="flex items-center gap-1 text-xs py-1.5 px-3"
            >
              Next <ChevronRightIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
