/**
 * Organization & Structure Management Hub Page
 * 
 * RESPONSIBILITY:
 * Hosts a centralized 4-tab administrative hub:
 * 1. Departments (view existing, add new, edit manager, delete)
 * 2. Job Roles / Positions (view existing, add new, edit department link, delete)
 * 3. Types of Contracts (view standard contract categories, terms, and active counts)
 * 4. Working Schedules (view templates, shifts matrix, add/edit/delete schedules)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Button,
  Chip,
  IconButton,
  Tooltip
} from '@material-tailwind/react';
import {
  BuildingOffice2Icon,
  BriefcaseIcon,
  DocumentDuplicateIcon,
  CalendarDaysIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

import DataTable from '../components/common/DataTable';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';
import DepartmentModal from '../components/organization/DepartmentModal';
import JobPositionModal from '../components/organization/JobPositionModal';
import ContractTypesList from '../components/organization/ContractTypesList';

import ScheduleList from '../components/schedules/ScheduleList';
import ScheduleForm from '../components/schedules/ScheduleForm';

import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

export default function OrganizationPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('employee.manage') || hasPermission('user.manage');

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'departments';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Departments State
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  // Job Positions State
  const [positions, setPositions] = useState([]);
  const [loadingPositions, setLoadingPositions] = useState(true);
  const [posModalOpen, setPosModalOpen] = useState(false);
  const [selectedPos, setSelectedPos] = useState(null);

  // Shared Employees for Managers
  const [employees, setEmployees] = useState([]);

  // Schedules State
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // Delete State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteType, setDeleteType] = useState(null); // 'dept' | 'pos' | 'schedule'
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchDepartments = useCallback(async () => {
    try {
      setLoadingDepts(true);
      const res = await axiosClient.get('/departments');
      if (res.data?.data) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoadingDepts(false);
    }
  }, []);

  const fetchPositions = useCallback(async () => {
    try {
      setLoadingPositions(true);
      const res = await axiosClient.get('/departments/positions/all');
      if (res.data?.data) {
        setPositions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load positions:', err);
    } finally {
      setLoadingPositions(false);
    }
  }, []);

  const fetchSchedules = useCallback(async () => {
    try {
      setLoadingSchedules(true);
      const res = await axiosClient.get('/schedules');
      if (res.data?.data) {
        setSchedules(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load schedules:', err);
    } finally {
      setLoadingSchedules(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await axiosClient.get('/employees?limit=200');
      if (res.data?.data) {
        setEmployees(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
    fetchPositions();
    fetchSchedules();
    fetchEmployees();
  }, [fetchDepartments, fetchPositions, fetchSchedules, fetchEmployees]);

  const handleTabChange = (val) => {
    setActiveTab(val);
    setSearchParams({ tab: val });
  };

  // Department Handlers
  const handleOpenCreateDept = () => {
    setSelectedDept(null);
    setDeptModalOpen(true);
  };

  const handleOpenEditDept = (dept) => {
    setSelectedDept(dept);
    setDeptModalOpen(true);
  };

  const handleOpenDeleteDept = (dept) => {
    setDeleteType('dept');
    setItemToDelete(dept);
    setDeleteError('');
    setDeleteOpen(true);
  };

  // Job Position Handlers
  const handleOpenCreatePos = () => {
    setSelectedPos(null);
    setPosModalOpen(true);
  };

  const handleOpenEditPos = (pos) => {
    setSelectedPos(pos);
    setPosModalOpen(true);
  };

  const handleOpenDeletePos = (pos) => {
    setDeleteType('pos');
    setItemToDelete(pos);
    setDeleteError('');
    setDeleteOpen(true);
  };

  // Schedule Handlers
  const handleOpenCreateSchedule = () => {
    setSelectedSchedule(null);
    setScheduleModalOpen(true);
  };

  const handleOpenEditSchedule = async (sch) => {
    try {
      const res = await axiosClient.get(`/schedules/${sch.id}`);
      setSelectedSchedule(res.data?.data || sch);
    } catch {
      setSelectedSchedule(sch);
    }
    setScheduleModalOpen(true);
  };

  const handleOpenDeleteSchedule = (sch) => {
    setDeleteType('schedule');
    setItemToDelete(sch);
    setDeleteError('');
    setDeleteOpen(true);
  };

  // General Confirm Delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    setDeleteError('');

    try {
      if (deleteType === 'dept') {
        await axiosClient.delete(`/departments/${itemToDelete.id}`);
        fetchDepartments();
        fetchPositions();
      } else if (deleteType === 'pos') {
        await axiosClient.delete(`/departments/positions/${itemToDelete.id}`);
        fetchPositions();
      } else if (deleteType === 'schedule') {
        await axiosClient.delete(`/schedules/${itemToDelete.id}`);
        fetchSchedules();
      }
      setDeleteOpen(false);
      setItemToDelete(null);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete record.';
      setDeleteError(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Columns for Departments
  const deptColumns = [
    {
      key: 'name',
      label: 'Department Name',
      render: (row) => (
        <span className="font-semibold text-xs text-blue-gray-900 flex items-center gap-2">
          <BuildingOffice2Icon className="h-4 w-4 text-indigo-600 shrink-0" />
          {row.name}
        </span>
      )
    },
    {
      key: 'manager_name',
      label: 'Department Manager',
      render: (row) => (
        <span className="text-xs text-blue-gray-700">
          {row.manager_name ? (
            <span className="font-medium text-indigo-900">{row.manager_name}</span>
          ) : (
            <span className="text-blue-gray-400 italic">No Manager Assigned</span>
          )}
        </span>
      )
    },
    {
      key: 'employee_count',
      label: 'Headcount',
      render: (row) => (
        <Chip
          size="sm"
          variant="ghost"
          value={`${row.employee_count || 0} Staff`}
          color="indigo"
          className="w-fit font-bold text-[11px]"
        />
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Tooltip content="Edit Department">
            <IconButton
              variant="text"
              color="indigo"
              size="sm"
              onClick={() => handleOpenEditDept(row)}
            >
              <PencilSquareIcon className="h-4 w-4" />
            </IconButton>
          </Tooltip>

          <Tooltip content="Delete Department">
            <IconButton
              variant="text"
              color="red"
              size="sm"
              onClick={() => handleOpenDeleteDept(row)}
            >
              <TrashIcon className="h-4 w-4" />
            </IconButton>
          </Tooltip>
        </div>
      )
    }
  ];

  // Columns for Job Positions
  const posColumns = [
    {
      key: 'title',
      label: 'Job Role / Title',
      render: (row) => (
        <span className="font-semibold text-xs text-blue-gray-900 flex items-center gap-2">
          <BriefcaseIcon className="h-4 w-4 text-indigo-600 shrink-0" />
          {row.title}
        </span>
      )
    },
    {
      key: 'department_name',
      label: 'Department',
      render: (row) => (
        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full uppercase">
          {row.department_name}
        </span>
      )
    },
    {
      key: 'employee_count',
      label: 'Assigned Employees',
      render: (row) => (
        <span className="text-xs text-blue-gray-700 font-medium">
          {row.employee_count || 0} Employees
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Tooltip content="Edit Job Role">
            <IconButton
              variant="text"
              color="indigo"
              size="sm"
              onClick={() => handleOpenEditPos(row)}
            >
              <PencilSquareIcon className="h-4 w-4" />
            </IconButton>
          </Tooltip>

          <Tooltip content="Delete Job Role">
            <IconButton
              variant="text"
              color="red"
              size="sm"
              onClick={() => handleOpenDeletePos(row)}
            >
              <TrashIcon className="h-4 w-4" />
            </IconButton>
          </Tooltip>
        </div>
      )
    }
  ];

  return (
    <div className="mt-6 flex flex-col gap-6">
      <Tabs value={activeTab}>
        <TabsHeader className="bg-white border border-blue-gray-100 p-1.5 shadow-sm max-w-3xl">
          <Tab value="departments" onClick={() => handleTabChange('departments')} className="text-xs font-bold py-2.5">
            <div className="flex items-center gap-2">
              <BuildingOffice2Icon className="h-4 w-4" /> Departments
            </div>
          </Tab>
          <Tab value="positions" onClick={() => handleTabChange('positions')} className="text-xs font-bold py-2.5">
            <div className="flex items-center gap-2">
              <BriefcaseIcon className="h-4 w-4" /> Job Roles
            </div>
          </Tab>
          <Tab value="contracts" onClick={() => handleTabChange('contracts')} className="text-xs font-bold py-2.5">
            <div className="flex items-center gap-2">
              <DocumentDuplicateIcon className="h-4 w-4" /> Contract Types
            </div>
          </Tab>
          <Tab value="schedules" onClick={() => handleTabChange('schedules')} className="text-xs font-bold py-2.5">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="h-4 w-4" /> Working Schedules
            </div>
          </Tab>
        </TabsHeader>

        <TabsBody className="pt-4">
          {/* TAB 1: DEPARTMENTS */}
          <TabPanel value="departments" className="p-0">
            <DataTable
              title="Departments Directory"
              subtitle="Manage organizational departments, hierarchy, and assigned department managers"
              columns={deptColumns}
              data={departments}
              loading={loadingDepts}
              actionButton={
                canManage && (
                  <Button
                    color="indigo"
                    size="sm"
                    className="flex items-center gap-2 shadow-indigo-500/20"
                    onClick={handleOpenCreateDept}
                  >
                    <PlusIcon className="h-4 w-4" /> Add Department
                  </Button>
                )
              }
            />
          </TabPanel>

          {/* TAB 2: JOB ROLES / POSITIONS */}
          <TabPanel value="positions" className="p-0">
            <DataTable
              title="Job Roles & Positions"
              subtitle="Define organizational job roles and map them to their parent department"
              columns={posColumns}
              data={positions}
              loading={loadingPositions}
              actionButton={
                canManage && (
                  <Button
                    color="indigo"
                    size="sm"
                    className="flex items-center gap-2 shadow-indigo-500/20"
                    onClick={handleOpenCreatePos}
                  >
                    <PlusIcon className="h-4 w-4" /> Add Job Role
                  </Button>
                )
              }
            />
          </TabPanel>

          {/* TAB 3: CONTRACT TYPES */}
          <TabPanel value="contracts" className="p-0">
            <ContractTypesList />
          </TabPanel>

          {/* TAB 4: WORKING SCHEDULES */}
          <TabPanel value="schedules" className="p-0">
            <ScheduleList
              schedules={schedules}
              loading={loadingSchedules}
              onEdit={handleOpenEditSchedule}
              onDelete={canManage ? handleOpenDeleteSchedule : undefined}
              actionButton={
                canManage && (
                  <Button
                    color="indigo"
                    size="sm"
                    className="flex items-center gap-2 shadow-indigo-500/20"
                    onClick={handleOpenCreateSchedule}
                  >
                    <PlusIcon className="h-4 w-4" /> Add Schedule
                  </Button>
                )
              }
            />
          </TabPanel>
        </TabsBody>
      </Tabs>

      {/* Department Modal */}
      <DepartmentModal
        open={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        department={selectedDept}
        employees={employees}
        onSuccess={fetchDepartments}
      />

      {/* Job Position Modal */}
      <JobPositionModal
        open={posModalOpen}
        onClose={() => setPosModalOpen(false)}
        position={selectedPos}
        departments={departments}
        onSuccess={fetchPositions}
      />

      {/* Schedule Form Modal */}
      <ScheduleForm
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        schedule={selectedSchedule}
        onSuccess={fetchSchedules}
      />

      {/* Shared Delete Confirmation Dialog */}
      <ConfirmDeleteModal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setItemToDelete(null);
          setDeleteError('');
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title={
          deleteType === 'dept'
            ? 'Delete Department'
            : deleteType === 'pos'
            ? 'Delete Job Role'
            : 'Delete Working Schedule'
        }
        itemName={
          deleteType === 'dept'
            ? itemToDelete?.name
            : deleteType === 'pos'
            ? itemToDelete?.title
            : itemToDelete?.name || 'this item'
        }
        errorMessage={deleteError}
      />
    </div>
  );
}
