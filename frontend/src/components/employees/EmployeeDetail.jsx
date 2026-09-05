/**
 * Employee Profile Detail Modal View
 * 
 * RESPONSIBILITY:
 * Presents a comprehensive 360-degree view of an individual employee, including
 * profile information, historical contracts, attendance logs, and time-off request tabs.
 * 
 * NOT RESPONSIBLE FOR:
 * Direct database writes or password changes.
 */

import React, { useState, useEffect } from 'react';
import {
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Typography,
  Chip,
  Button,
  Spinner
} from '@material-tailwind/react';
import {
  UserIcon,
  DocumentTextIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import Modal from '../common/Modal';
import axiosClient from '../../api/axiosClient';

/**
 * Employee Detail Modal View.
 * 
 * @param {object} props - Component props
 * @param {boolean} props.open - Modal open state
 * @param {Function} props.onClose - Modal close handler
 * @param {object|null} props.employee - Employee to display
 * @returns {JSX.Element} Detailed employee 360 profile
 */
export default function EmployeeDetail({ open, onClose, employee }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [contracts, setContracts] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [loadingRelations, setLoadingRelations] = useState(false);

  useEffect(() => {
    if (open && employee?.id) {
      fetchRelatedData(employee.id);
    }
  }, [open, employee]);

  const fetchRelatedData = async (empId) => {
    setLoadingRelations(true);
    try {
      const [cRes, aRes, tRes] = await Promise.allSettled([
        axiosClient.get(`/contracts?employee_id=${empId}`),
        axiosClient.get(`/attendance?employee_id=${empId}`),
        axiosClient.get(`/timeoff/requests?employee_id=${empId}`)
      ]);

      if (cRes.status === 'fulfilled') setContracts(cRes.value.data?.data || []);
      if (aRes.status === 'fulfilled') setAttendances(aRes.value.data?.data || []);
      if (tRes.status === 'fulfilled') setTimeOffRequests(tRes.value.data?.data || []);
    } catch (err) {
      console.error('Failed to load related employee details:', err);
    } finally {
      setLoadingRelations(false);
    }
  };

  if (!employee) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Employee 360° Profile"
      size="xl"
      footer={
        <Button variant="outlined" color="blue-gray" onClick={onClose}>
          Close
        </Button>
      }
    >
      {/* Header Profile Summary */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-gray-50 to-indigo-50/40 border border-blue-gray-100 mb-6">
        <img
          src={employee.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.first_name + ' ' + employee.last_name)}&background=6366f1&color=fff`}
          alt={employee.first_name}
          className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-md"
        />
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h4 className="text-xl font-bold text-blue-gray-800">
              {employee.first_name} {employee.last_name}
            </h4>
            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
              {employee.employee_code}
            </span>
            <Chip
              size="sm"
              variant="ghost"
              value={employee.status}
              color={employee.status === 'active' ? 'green' : 'amber'}
              className="capitalize text-[11px]"
            />
          </div>
          <p className="text-sm font-medium text-blue-gray-600 mt-1">
            {employee.job_title || 'Position Not Assigned'} • {employee.department_name || 'No Department'}
          </p>
        </div>
      </div>

      {/* Detail Tabs */}
      <Tabs value={activeTab}>
        <TabsHeader className="bg-blue-gray-50">
          <Tab value="profile" onClick={() => setActiveTab('profile')} className="text-xs font-semibold py-2">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" /> Overview
            </div>
          </Tab>
          <Tab value="contracts" onClick={() => setActiveTab('contracts')} className="text-xs font-semibold py-2">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="h-4 w-4" /> Contracts ({contracts.length})
            </div>
          </Tab>
          <Tab value="attendance" onClick={() => setActiveTab('attendance')} className="text-xs font-semibold py-2">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4" /> Attendance ({attendances.length})
            </div>
          </Tab>
          <Tab value="timeoff" onClick={() => setActiveTab('timeoff')} className="text-xs font-semibold py-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" /> Time Off ({timeOffRequests.length})
            </div>
          </Tab>
        </TabsHeader>

        <TabsBody className="pt-4">
          {/* Overview Panel */}
          <TabPanel value="profile" className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg border border-blue-gray-100">
                <span className="text-xs text-blue-gray-400 font-medium">Email Address</span>
                <p className="font-semibold text-blue-gray-800">{employee.email}</p>
              </div>
              <div className="p-3 rounded-lg border border-blue-gray-100">
                <span className="text-xs text-blue-gray-400 font-medium">Phone Number</span>
                <p className="font-semibold text-blue-gray-800">{employee.phone || 'Not Provided'}</p>
              </div>
              <div className="p-3 rounded-lg border border-blue-gray-100">
                <span className="text-xs text-blue-gray-400 font-medium">Reporting Manager</span>
                <p className="font-semibold text-blue-gray-800">{employee.manager_name || 'None'}</p>
              </div>
              <div className="p-3 rounded-lg border border-blue-gray-100">
                <span className="text-xs text-blue-gray-400 font-medium">Working Schedule</span>
                <p className="font-semibold text-blue-gray-800">{employee.working_schedule_name || 'Standard'}</p>
              </div>
              <div className="p-3 rounded-lg border border-blue-gray-100 md:col-span-2">
                <span className="text-xs text-blue-gray-400 font-medium">Hire Date</span>
                <p className="font-semibold text-blue-gray-800">{employee.date_joined || 'N/A'}</p>
              </div>
            </div>
          </TabPanel>

          {/* Contracts Panel */}
          <TabPanel value="contracts" className="p-0">
            {loadingRelations ? (
              <div className="p-6 text-center"><Spinner className="h-6 w-6 mx-auto text-indigo-600" /></div>
            ) : contracts.length === 0 ? (
              <p className="p-4 text-sm text-blue-gray-400 text-center">No contracts found for this employee.</p>
            ) : (
              <div className="space-y-3">
                {contracts.map((c) => (
                  <div key={c.id} className="p-3 rounded-lg border border-blue-gray-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-blue-gray-800">{c.structure_name || 'Regular Structure'}</p>
                      <p className="text-xs text-blue-gray-500">
                        {c.start_date} {c.end_date ? `to ${c.end_date}` : '(Open-ended)'} • {c.contract_type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-indigo-600">${Number(c.wage).toLocaleString()}/mo</p>
                      <Chip
                        size="sm"
                        variant="ghost"
                        value={c.status}
                        color={c.status === 'running' ? 'green' : 'blue-gray'}
                        className="mt-1 capitalize text-[10px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabPanel>

          {/* Attendance Panel */}
          <TabPanel value="attendance" className="p-0">
            {loadingRelations ? (
              <div className="p-6 text-center"><Spinner className="h-6 w-6 mx-auto text-indigo-600" /></div>
            ) : attendances.length === 0 ? (
              <p className="p-4 text-sm text-blue-gray-400 text-center">No attendance records logged.</p>
            ) : (
              <div className="space-y-2">
                {attendances.slice(0, 5).map((a) => (
                  <div key={a.id} className="p-2.5 rounded-lg border border-blue-gray-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-blue-gray-800">{a.check_in}</span>
                      <span className="text-blue-gray-400 ml-2">→ {a.check_out || 'Active'}</span>
                    </div>
                    <Chip size="sm" variant="ghost" value={a.status} color={a.status === 'present' ? 'green' : 'amber'} />
                  </div>
                ))}
              </div>
            )}
          </TabPanel>

          {/* Time Off Panel */}
          <TabPanel value="timeoff" className="p-0">
            {loadingRelations ? (
              <div className="p-6 text-center"><Spinner className="h-6 w-6 mx-auto text-indigo-600" /></div>
            ) : timeOffRequests.length === 0 ? (
              <p className="p-4 text-sm text-blue-gray-400 text-center">No time off requests filed.</p>
            ) : (
              <div className="space-y-2">
                {timeOffRequests.map((t) => (
                  <div key={t.id} className="p-2.5 rounded-lg border border-blue-gray-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-blue-gray-800">{t.type_name || 'Leave'}</span>
                      <span className="text-blue-gray-500 ml-2">({t.duration} days: {t.start_date} to {t.end_date})</span>
                    </div>
                    <Chip size="sm" variant="ghost" value={t.status} color={t.status === 'approved' ? 'green' : 'amber'} />
                  </div>
                ))}
              </div>
            )}
          </TabPanel>
        </TabsBody>
      </Tabs>
    </Modal>
  );
}
