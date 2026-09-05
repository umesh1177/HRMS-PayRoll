/**
 * Employees Management Page
 * 
 * RESPONSIBILITY:
 * Main container for employee workforce management. Orchestrates data fetching
 * (with fallback to local mock data if backend initializing), search/filtering,
 * dual view toggle (Kanban card grid vs Table list), and controls EmployeeForm
 * and EmployeeDetail modals.
 * 
 * NOT RESPONSIBLE FOR:
 * Direct SQL query execution or calculation of payroll wage items.
 */

import React, { useState, useEffect } from 'react';
import { Button, ButtonGroup, Typography, Card } from '@material-tailwind/react';
import {
  UserPlusIcon,
  Squares2X2Icon,
  TableCellsIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import EmployeeList from '../components/employees/EmployeeList';
import EmployeeKanban from '../components/employees/EmployeeKanban';
import EmployeeForm from '../components/employees/EmployeeForm';
import EmployeeDetail from '../components/employees/EmployeeDetail';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import mockEmployees from '../api/mocks/employees.json';
import mockDepartments from '../api/mocks/departments.json';
import mockSchedules from '../api/mocks/schedules.json';

/**
 * Employees Page Component.
 * 
 * @returns {JSX.Element} Employees management view
 */
export default function EmployeesPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('employee.manage');

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'kanban' or 'list'
  const [viewMode, setViewMode] = useState('kanban');

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  // Modals state
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [page, search]);

  /**
   * Fetches auxiliary dropdown entities (departments, positions, schedules).
   */
  const fetchAuxiliaryData = async () => {
    try {
      const [deptRes, posRes, schRes] = await Promise.allSettled([
        axiosClient.get('/departments'),
        axiosClient.get('/departments/positions/all'),
        axiosClient.get('/schedules')
      ]);

      if (deptRes.status === 'fulfilled' && deptRes.value.data?.data) {
        setDepartments(deptRes.value.data.data);
      } else {
        setDepartments(mockDepartments);
      }

      if (posRes.status === 'fulfilled' && posRes.value.data?.data) {
        setJobPositions(posRes.value.data.data);
      } else {
        setJobPositions([
          { id: 1, title: 'Lead Architect', department_id: 1 },
          { id: 2, title: 'Senior Frontend Engineer', department_id: 1 },
          { id: 3, title: 'HR Manager', department_id: 2 }
        ]);
      }

      if (schRes.status === 'fulfilled' && schRes.value.data?.data) {
        setSchedules(schRes.value.data.data);
      } else {
        setSchedules(mockSchedules);
      }
    } catch (err) {
      console.warn('Failed to load auxiliary data, utilizing mock fallbacks.');
      setDepartments(mockDepartments);
      setSchedules(mockSchedules);
    }
  };

  /**
   * Fetches employees from /api/v1/employees with fallback to mock data.
   */
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(
        `/employees?page=${page}&limit=12&search=${encodeURIComponent(search)}`
      );
      if (res.data?.data) {
        setEmployees(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setEmployees([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.warn('Failed to load employees:', err);
      setEmployees([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedEmployee(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setSelectedEmployee(emp);
    setFormOpen(true);
  };

  const handleOpenDetail = (emp) => {
    setSelectedEmployee(emp);
    setDetailOpen(true);
  };

  const createButton = canManage && (
    <Button
      color="indigo"
      size="sm"
      className="flex items-center gap-2 shadow-indigo-500/20"
      onClick={handleOpenCreate}
    >
      <UserPlusIcon className="h-4 w-4" /> Add Employee
    </Button>
  );

  return (
    <div className="mt-4 flex flex-col gap-5">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-blue-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md">
            <UserGroupIcon className="h-6 w-6" />
          </div>
          <div>
            <Typography variant="h5" color="blue-gray" className="font-bold">
              Employee Directory
            </Typography>
            <Typography variant="small" color="gray" className="text-xs">
              Manage organization workforce, roles, contracts, and profiles
            </Typography>
          </div>
        </div>

        {/* View Toggle (Kanban Cards vs List Table) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-lg bg-blue-gray-50 border border-blue-gray-100">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-blue-gray-600 hover:text-blue-gray-900'
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-blue-gray-600 hover:text-blue-gray-900'
              }`}
            >
              <TableCellsIcon className="h-4 w-4" />
              <span>List View</span>
            </button>
          </div>

          {createButton}
        </div>
      </div>

      {/* Main Content Area: Kanban Cards or Table List */}
      {viewMode === 'kanban' ? (
        <EmployeeKanban
          employees={employees}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          searchTerm={search}
          onSearchChange={setSearch}
          onView={handleOpenDetail}
          onEdit={handleOpenEdit}
          actionButton={null}
        />
      ) : (
        <EmployeeList
          employees={employees}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          searchTerm={search}
          onSearchChange={setSearch}
          onView={handleOpenDetail}
          onEdit={handleOpenEdit}
          actionButton={null}
        />
      )}

      {/* Create / Edit Form Modal */}
      <EmployeeForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        employee={selectedEmployee}
        departments={departments}
        jobPositions={jobPositions}
        schedules={schedules}
        managers={employees}
        onSuccess={fetchEmployees}
      />

      {/* 360 Degree Detail Modal */}
      <EmployeeDetail
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        employee={selectedEmployee}
      />
    </div>
  );
}
