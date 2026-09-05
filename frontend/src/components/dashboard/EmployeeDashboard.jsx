/**
 * Employee Self-Service Dashboard Component
 * 
 * RESPONSIBILITY:
 * Displays personalized self-service information for logged-in employees:
 * - Properly arranged KPI metric cards with clean icon badges
 * - Equal-height middle row with Punch Clock Widget & Employment Details
 * - Equal-height bottom row with Recent Attendance & Leave Balances
 * - Live check-in/out punch clock actions
 * 
 * NOT RESPONSIBLE FOR:
 * Company-wide executive financial metrics or administrative configurations.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Chip,
  Button
} from '@material-tailwind/react';
import {
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  UserCircleIcon,
  EnvelopeIcon,
  CheckBadgeIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import AttendanceWidget from '../attendance/AttendanceWidget';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [leaveAllocations, setLeaveAllocations] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);

  useEffect(() => {
    fetchEmployeeDashboardData();
  }, [user]);

  const fetchEmployeeDashboardData = async () => {
    try {
      setLoading(true);
      const promises = [
        axiosClient.get('/attendance?limit=5'),
        axiosClient.get('/timeoff/allocations'),
        axiosClient.get('/timeoff/requests?limit=5')
      ];

      if (user?.employee_id) {
        promises.push(axiosClient.get(`/employees/${user.employee_id}`).catch(() => null));
      }

      const [attRes, allocRes, reqRes, empRes] = await Promise.all(promises);

      setRecentAttendance(attRes.data?.data || []);
      setLeaveAllocations(allocRes.data?.data || []);
      setLeaveRequests(reqRes.data?.data || []);
      if (empRes?.data?.data) {
        setEmployeeProfile(empRes.data.data);
      }
    } catch (err) {
      console.warn('Could not load all employee dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  // Compute summary stats
  const totalAllocated = leaveAllocations.reduce((sum, a) => sum + Number(a.allocated_amount || 0), 0);
  const totalTaken = leaveAllocations.reduce((sum, a) => sum + Number(a.taken_amount || 0), 0);
  const totalRemaining = Math.max(0, totalAllocated - totalTaken);
  const pendingRequestsCount = leaveRequests.filter((r) => r.status === 'pending' || r.status === 'submitted').length;

  const displayName = user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.email?.split('@')[0] || 'Employee');

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return 'green';
      case 'late':
        return 'amber';
      case 'half_day':
        return 'purple';
      case 'absent':
        return 'red';
      case 'approved':
        return 'green';
      case 'pending':
      case 'submitted':
        return 'amber';
      case 'refused':
      case 'rejected':
        return 'red';
      default:
        return 'blue-gray';
    }
  };

  const kpis = [
    {
      title: 'Daily Attendance',
      value: recentAttendance.length > 0 ? `${recentAttendance.length} Logs` : 'Active',
      icon: ClockIcon,
      gradient: 'from-indigo-600 to-indigo-400',
      shadowColor: 'indigo-500/30',
      footer: (
        <div className="flex items-center justify-between text-xs text-blue-gray-500">
          <span>Recent check-in logs</span>
          <Link to="/attendance" className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            View All <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </div>
      )
    },
    {
      title: 'Available Leave Days',
      value: `${totalRemaining} Days`,
      icon: CalendarIcon,
      gradient: 'from-emerald-600 to-emerald-400',
      shadowColor: 'emerald-500/30',
      footer: (
        <div className="text-xs text-blue-gray-500">
          <span className="font-medium text-emerald-700">{totalTaken} taken</span> of {totalAllocated} allocated days
        </div>
      )
    },
    {
      title: 'Pending Leave Requests',
      value: `${pendingRequestsCount} Pending`,
      icon: DocumentTextIcon,
      gradient: 'from-amber-600 to-amber-400',
      shadowColor: 'amber-500/30',
      footer: (
        <div className="flex items-center justify-between text-xs text-blue-gray-500">
          <span>Awaiting approval</span>
          <Link to="/timeoff" className="font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1">
            Apply Leave <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </div>
      )
    },
    {
      title: 'Working Schedule',
      value: employeeProfile?.working_schedule_name || 'Standard 40h',
      icon: BriefcaseIcon,
      gradient: 'from-blue-600 to-cyan-500',
      shadowColor: 'blue-500/30',
      footer: (
        <div className="text-xs text-blue-gray-500 truncate">
          Mon – Fri • 09:00 AM – 06:00 PM
        </div>
      )
    }
  ];

  return (
    <div className="mt-4 flex flex-col gap-6">
      {/* Personalized Welcome Header Banner */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-900 via-indigo-700 to-blue-600 p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Typography variant="h4" color="white" className="font-bold tracking-tight">
              Welcome back, {displayName} 👋
            </Typography>
          </div>
          <Typography variant="small" color="white" className="opacity-90 mt-1 max-w-2xl text-xs sm:text-sm leading-relaxed">
            Your employee self-service hub: track your working hours, manage daily punch clock check-ins, view remaining leave quotas, and submit time-off requests.
          </Typography>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {employeeProfile?.employee_code && (
            <Chip
              value={`ID: ${employeeProfile.employee_code}`}
              className="bg-white/20 text-white font-medium border border-white/30 backdrop-blur-sm"
            />
          )}
          <Chip
            value="Employee Portal"
            className="bg-emerald-500 text-white font-semibold shadow-sm"
          />
        </div>
      </div>

      {/* Primary Employee KPI Cards with Properly Arranged Icons */}
      <div className="grid gap-y-6 gap-x-6 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="border border-blue-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <CardBody className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${kpi.gradient} text-white shadow-md shadow-${kpi.shadowColor}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-right min-w-0 flex-1">
                    <Typography variant="small" className="font-medium text-blue-gray-500 text-xs truncate">
                      {kpi.title}
                    </Typography>
                    <Typography variant="h5" color="blue-gray" className="font-bold mt-0.5 truncate text-lg">
                      {loading ? '...' : kpi.value}
                    </Typography>
                  </div>
                </div>
                <div className="border-t border-blue-gray-50 mt-3 pt-2.5">
                  {kpi.footer}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Middle Row: Punch Clock Widget & Employment Details Box (Arranged with Exact Matching Heights) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Punch Clock Widget */}
        <div className="lg:col-span-7 flex flex-col">
          <AttendanceWidget onPunchChange={fetchEmployeeDashboardData} className="h-full" />
        </div>

        {/* Right: Employment Details Box */}
        <div className="lg:col-span-5 flex flex-col">
          <Card className="border border-blue-gray-100 shadow-sm h-full flex flex-col justify-between overflow-hidden">
            <CardHeader floated={false} shadow={false} className="p-4 flex items-center justify-between border-b border-blue-gray-50 m-0 rounded-none bg-blue-gray-50/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-sm">
                  <UserCircleIcon className="h-5 w-5" />
                </div>
                <div>
                  <Typography variant="h6" color="blue-gray" className="font-bold text-sm">
                    My Employment Profile
                  </Typography>
                  <Typography variant="small" className="text-[11px] text-blue-gray-500">
                    Department & organization structure
                  </Typography>
                </div>
              </div>
              <Chip
                size="sm"
                variant="ghost"
                color="green"
                value="Active"
                className="py-0.5 px-2 text-[10px]"
              />
            </CardHeader>

            <CardBody className="p-5 flex-1 flex flex-col justify-between gap-3 text-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-1 border-b border-blue-gray-50">
                  <span className="text-blue-gray-500 font-medium flex items-center gap-1.5">
                    <BuildingOfficeIcon className="h-4 w-4 text-blue-gray-400" /> Department
                  </span>
                  <span className="font-semibold text-blue-gray-800">
                    {employeeProfile?.department_name || 'Engineering'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-blue-gray-50">
                  <span className="text-blue-gray-500 font-medium flex items-center gap-1.5">
                    <BriefcaseIcon className="h-4 w-4 text-blue-gray-400" /> Job Position
                  </span>
                  <span className="font-semibold text-blue-gray-800">
                    {employeeProfile?.job_title || 'Senior Frontend Engineer'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-blue-gray-50">
                  <span className="text-blue-gray-500 font-medium flex items-center gap-1.5">
                    <EnvelopeIcon className="h-4 w-4 text-blue-gray-400" /> Work Email
                  </span>
                  <span className="font-semibold text-blue-gray-800 truncate max-w-[190px]">
                    {user?.email}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-blue-gray-500 font-medium flex items-center gap-1.5">
                    <CheckBadgeIcon className="h-4 w-4 text-blue-gray-400" /> Reporting Manager
                  </span>
                  <span className="font-semibold text-blue-gray-800">
                    {employeeProfile?.manager_name || 'Alice Smith'}
                  </span>
                </div>
              </div>

              <div className="mt-2 p-3 rounded-lg bg-indigo-50/60 border border-indigo-100/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-900 block">Planning Time Off?</span>
                  <span className="text-[11px] text-indigo-700">Submit requests for manager review</span>
                </div>
                <Link to="/timeoff">
                  <Button size="sm" variant="gradient" color="indigo" className="py-2 px-3 text-xs shadow-indigo-500/20">
                    Request Leave
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Bottom Row: Recent Attendance & Leave Balances (Arranged with Exact Matching Heights) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left: Recent Attendance Log Table */}
        <Card className="border border-blue-gray-100 shadow-sm h-full flex flex-col justify-between overflow-hidden">
          <CardHeader floated={false} shadow={false} className="p-4 flex items-center justify-between border-b border-blue-gray-50 m-0 rounded-none bg-blue-gray-50/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-sm">
                <ClockIcon className="h-5 w-5" />
              </div>
              <div>
                <Typography variant="h6" color="blue-gray" className="font-bold text-sm">
                  My Recent Attendance
                </Typography>
                <Typography variant="small" className="text-[11px] text-blue-gray-500">
                  Last 5 recorded check-in / check-out entries
                </Typography>
              </div>
            </div>
            <Link to="/attendance" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Full Log <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </CardHeader>

          <CardBody className="p-0 overflow-x-auto flex-1 flex flex-col justify-between">
            {recentAttendance.length === 0 ? (
              <div className="p-8 text-center text-xs text-blue-gray-500 flex-1 flex items-center justify-center">
                No attendance logs found. Use the punch clock above to record your first check-in.
              </div>
            ) : (
              <table className="w-full min-w-[360px] table-auto text-left">
                <thead>
                  <tr className="border-b border-blue-gray-100 bg-blue-gray-50/30 text-[11px] font-bold text-blue-gray-600 uppercase">
                    <th className="p-3">Date</th>
                    <th className="p-3">In</th>
                    <th className="p-3">Out</th>
                    <th className="p-3">Hours</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-blue-gray-50">
                  {recentAttendance.map((row) => (
                    <tr key={row.id} className="hover:bg-blue-gray-50/30 transition-colors">
                      <td className="p-3 font-medium text-blue-gray-800">
                        {row.check_in ? new Date(row.check_in).toLocaleDateString() : 'Today'}
                      </td>
                      <td className="p-3 text-blue-gray-600">
                        {row.check_in ? new Date(row.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="p-3 text-blue-gray-600">
                        {row.check_out ? new Date(row.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (
                          <span className="text-amber-600 font-semibold inline-flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> Active
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-blue-gray-700">
                        {row.worked_hours ? `${row.worked_hours} hrs` : '-'}
                      </td>
                      <td className="p-3">
                        <Chip
                          size="sm"
                          variant="ghost"
                          color={getStatusColor(row.status)}
                          value={row.status || 'present'}
                          className="py-0.5 px-2 text-[10px] capitalize inline-block"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="p-3 border-t border-blue-gray-50 bg-blue-gray-50/20 text-xs text-blue-gray-500 flex items-center justify-between">
              <span>Automatic attendance tracking active</span>
              <span className="font-semibold text-blue-gray-700">Standard 40h / week</span>
            </div>
          </CardBody>
        </Card>

        {/* Right: Leave Allowances & Recent Requests */}
        <Card className="border border-blue-gray-100 shadow-sm h-full flex flex-col justify-between overflow-hidden">
          <CardHeader floated={false} shadow={false} className="p-4 flex items-center justify-between border-b border-blue-gray-50 m-0 rounded-none bg-blue-gray-50/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-sm">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <Typography variant="h6" color="blue-gray" className="font-bold text-sm">
                  My Leave Balances & Requests
                </Typography>
                <Typography variant="small" className="text-[11px] text-blue-gray-500">
                  Allocated quotas and request statuses
                </Typography>
              </div>
            </div>
            <Link to="/timeoff" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Time Off <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </CardHeader>

          <CardBody className="p-4 flex-1 flex flex-col justify-between gap-4">
            {/* Allocation breakdown */}
            <div className="space-y-2">
              <Typography variant="small" className="text-xs font-bold text-blue-gray-700 uppercase tracking-wide">
                Leave Quota Breakdown
              </Typography>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {leaveAllocations.length === 0 ? (
                  <div className="col-span-full text-xs text-blue-gray-500 py-1 bg-blue-gray-50/30 p-2.5 rounded-lg">
                    Standard annual leave allocation applied.
                  </div>
                ) : (
                  leaveAllocations.map((alloc) => (
                    <div
                      key={alloc.id}
                      className="p-2.5 rounded-lg bg-blue-gray-50/70 border border-blue-gray-100 text-xs flex flex-col justify-between"
                    >
                      <p className="font-semibold text-blue-gray-800 truncate">{alloc.type_name}</p>
                      <p className="text-emerald-700 font-bold text-base mt-0.5">
                        {alloc.remaining_amount !== undefined ? alloc.remaining_amount : (alloc.allocated_amount - alloc.taken_amount)} <span className="text-xs font-normal">{alloc.unit || 'days'}</span>
                      </p>
                      <p className="text-[10px] text-blue-gray-500 mt-1">
                        {alloc.taken_amount || 0} taken / {alloc.allocated_amount || 0} total
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Requests list */}
            <div className="pt-3 border-t border-blue-gray-50 space-y-2">
              <Typography variant="small" className="text-xs font-bold text-blue-gray-700 uppercase tracking-wide">
                Recent Leave Submissions
              </Typography>
              {leaveRequests.length === 0 ? (
                <div className="text-xs text-blue-gray-500 py-3 text-center bg-blue-gray-50/30 rounded-lg">
                  No active leave requests. Click &ldquo;Apply Leave&rdquo; above to submit.
                </div>
              ) : (
                <div className="space-y-2">
                  {leaveRequests.slice(0, 2).map((req) => (
                    <div
                      key={req.id}
                      className="p-2.5 rounded-lg border border-blue-gray-100 flex items-center justify-between text-xs hover:bg-blue-gray-50/40 transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-blue-gray-800">
                          {req.type_name || 'Paid Time Off'}
                        </span>
                        <span className="text-blue-gray-500 text-[11px] block">
                          {req.date_from?.slice(0, 10)} to {req.date_to?.slice(0, 10)} ({req.number_of_days || 1} day(s))
                        </span>
                      </div>
                      <Chip
                        size="sm"
                        variant="ghost"
                        color={getStatusColor(req.status)}
                        value={req.status}
                        className="py-0.5 px-2 text-[10px] capitalize"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
