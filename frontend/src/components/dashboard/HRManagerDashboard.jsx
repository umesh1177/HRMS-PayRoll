/**
 * HR Manager Operations Dashboard Component
 * 
 * RESPONSIBILITY:
 * Provides HR Managers with focused, relevant workforce management metrics:
 * - Active employee headcount and department distribution
 * - Running employment contracts
 * - Today's real-time attendance rate and absence metrics
 * - Pending time-off approvals queue and leave balances
 * - Direct HR management shortcuts
 * 
 * NOT RESPONSIBLE FOR:
 * Confidential financial payroll payslip generation or accounting disbursements.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Chip,
  Button,
  Spinner
} from '@material-tailwind/react';
import {
  UserGroupIcon,
  DocumentTextIcon,
  ClockIcon,
  CalendarIcon,
  UserPlusIcon,
  DocumentPlusIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  ArrowRightIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import AttendanceOverviewCard from './AttendanceOverviewCard';
import TimeOffOverviewCard from './TimeOffOverviewCard';

export default function HRManagerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 0,
    activeContracts: 0,
    pendingTimeOff: 0,
    attendance_rate: 100,
    attendance_overview: { active_employees: 0, present: 0, late: 0, absent: 0, overtime: 0, missing_checkout: 0 },
    time_off_overview: { total_requests: 0, pending_approvals: 0, approved: 0, refused: 0, total_days: 0 },
    departments_summary: []
  });
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchHRDashboardData();
  }, []);

  const fetchHRDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryRes, leavesRes, deptsRes] = await Promise.allSettled([
        axiosClient.get('/dashboard/summary'),
        axiosClient.get('/timeoff/requests?status=submitted&limit=5'),
        axiosClient.get('/departments')
      ]);

      if (summaryRes.status === 'fulfilled' && summaryRes.value.data) {
        setDashboardData((prev) => ({
          ...prev,
          ...summaryRes.value.data,
          departments_summary: deptsRes.status === 'fulfilled' ? (deptsRes.value.data?.data || []) : []
        }));
      }

      if (leavesRes.status === 'fulfilled' && leavesRes.value.data?.data) {
        setPendingLeaves(leavesRes.value.data.data);
      }
    } catch (err) {
      console.warn('Could not load HR dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (id) => {
    try {
      setActionLoading(true);
      await axiosClient.put(`/timeoff/requests/${id}/approve`);
      fetchHRDashboardData();
    } catch (err) {
      console.error('Failed to approve leave', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefuseLeave = async (id) => {
    try {
      setActionLoading(true);
      await axiosClient.put(`/timeoff/requests/${id}/refuse`);
      fetchHRDashboardData();
    } catch (err) {
      console.error('Failed to refuse leave', err);
    } finally {
      setActionLoading(false);
    }
  };

  const attOverview = dashboardData.attendance_overview || {};
  const totalAtt = Number(attOverview.present || 0) + Number(attOverview.late || 0) + Number(attOverview.absent || 0);
  const attendanceRate = totalAtt > 0
    ? Math.round(((Number(attOverview.present || 0) + Number(attOverview.late || 0)) / totalAtt) * 100)
    : (dashboardData.attendance_rate || 100);

  const kpis = [
    {
      title: 'Active Workforce',
      value: `${dashboardData.totalEmployees || 0} Employees`,
      icon: UserGroupIcon,
      gradient: 'from-indigo-600 to-indigo-400',
      shadowColor: 'indigo-500/30',
      footer: (
        <div className="flex items-center justify-between text-xs text-blue-gray-500">
          <span>Active team headcount</span>
          <Link to="/employees" className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            Directory <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </div>
      )
    },
    {
      title: 'Running Contracts',
      value: `${dashboardData.activeContracts || 0} Contracts`,
      icon: DocumentTextIcon,
      gradient: 'from-blue-600 to-cyan-500',
      shadowColor: 'blue-500/30',
      footer: (
        <div className="flex items-center justify-between text-xs text-blue-gray-500">
          <span>Active employment agreements</span>
          <Link to="/contracts" className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
            Manage <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </div>
      )
    },
    {
      title: "Today's Attendance",
      value: `${attendanceRate}% Present`,
      icon: ClockIcon,
      gradient: 'from-emerald-600 to-emerald-400',
      shadowColor: 'emerald-500/30',
      footer: (
        <div className="flex items-center justify-between text-xs text-blue-gray-500">
          <span>{attOverview.present || 0} Present • {attOverview.late || 0} Late</span>
          <Link to="/attendance" className="font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
            Logs <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </div>
      )
    },
    {
      title: 'Pending Leave Approvals',
      value: `${dashboardData.pendingTimeOff || pendingLeaves.length} Requests`,
      icon: CalendarIcon,
      gradient: 'from-amber-600 to-amber-400',
      shadowColor: 'amber-500/30',
      footer: (
        <div className="flex items-center justify-between text-xs text-blue-gray-500">
          <span>Requires HR authorization</span>
          <Link to="/timeoff" className="font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1">
            Review <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="mt-4 flex flex-col gap-6">
      {/* Top Welcome / Header Banner for HR Managers */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-900 via-indigo-700 to-blue-600 p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Typography variant="h4" color="white" className="font-bold tracking-tight">
            HR Operations & Workforce Dashboard 👋
          </Typography>
          <Typography variant="small" color="white" className="opacity-90 mt-1 max-w-2xl text-xs sm:text-sm leading-relaxed">
            Real-time workforce intelligence, employee headcount distribution, attendance monitoring, and time-off request approvals.
          </Typography>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip
            value="Role: HR Manager"
            className="bg-white/20 text-white font-medium border border-white/30 backdrop-blur-sm"
          />
          <Chip
            value="HR Operations"
            className="bg-emerald-500 text-white font-semibold shadow-sm"
          />
        </div>
      </div>

      {/* Primary KPI Cards with Properly Arranged Flex Icons */}
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

      {/* Middle Row: Attendance Health & Time Off Overview (Equal Height Containers) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="flex flex-col">
          <AttendanceOverviewCard data={dashboardData.attendance_overview} />
        </div>
        <div className="flex flex-col">
          <TimeOffOverviewCard data={dashboardData.time_off_overview} />
        </div>
      </div>

      {/* Bottom Row: Pending Time Off Approvals Queue & Quick HR Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Pending Leave Approvals Queue (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <Card className="border border-blue-gray-100 shadow-sm h-full flex flex-col justify-between overflow-hidden">
            <CardHeader floated={false} shadow={false} className="p-4 flex items-center justify-between border-b border-blue-gray-50 m-0 rounded-none bg-blue-gray-50/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-600 text-white shadow-sm">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div>
                  <Typography variant="h6" color="blue-gray" className="font-bold text-sm">
                    Pending Leave Approvals Queue
                  </Typography>
                  <Typography variant="small" className="text-[11px] text-blue-gray-500">
                    Employee time-off requests requiring HR authorization
                  </Typography>
                </div>
              </div>
              <Link to="/timeoff" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                All Requests <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </CardHeader>

            <CardBody className="p-0 overflow-x-auto flex-1 flex flex-col justify-between">
              {pendingLeaves.length === 0 ? (
                <div className="p-8 text-center text-xs text-blue-gray-500 flex-1 flex flex-col items-center justify-center gap-2">
                  <span className="text-2xl">🎉</span>
                  <p className="font-medium">No pending time-off requests waiting for approval.</p>
                  <p className="text-[11px] text-blue-gray-400">All employee leave submissions are up to date.</p>
                </div>
              ) : (
                <table className="w-full min-w-[420px] table-auto text-left">
                  <thead>
                    <tr className="border-b border-blue-gray-100 bg-blue-gray-50/30 text-[11px] font-bold text-blue-gray-600 uppercase">
                      <th className="p-3">Employee</th>
                      <th className="p-3">Leave Type</th>
                      <th className="p-3">Period</th>
                      <th className="p-3">Days</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-blue-gray-50">
                    {pendingLeaves.map((req) => (
                      <tr key={req.id} className="hover:bg-blue-gray-50/30 transition-colors">
                        <td className="p-3 font-semibold text-blue-gray-800">
                          {req.employee_name || 'Employee'}
                        </td>
                        <td className="p-3 text-blue-gray-600">
                          <span className="font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                            {req.type_name || 'Paid Leave'}
                          </span>
                        </td>
                        <td className="p-3 text-blue-gray-600 text-[11px]">
                          {req.date_from?.slice(0, 10)} to {req.date_to?.slice(0, 10)}
                        </td>
                        <td className="p-3 font-bold text-blue-gray-700">
                          {req.number_of_days || 1} d
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              color="green"
                              variant="gradient"
                              disabled={actionLoading}
                              className="py-1 px-2.5 text-[10px]"
                              onClick={() => handleApproveLeave(req.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              color="red"
                              variant="text"
                              disabled={actionLoading}
                              className="py-1 px-2 text-[10px]"
                              onClick={() => handleRefuseLeave(req.id)}
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="p-3 border-t border-blue-gray-50 bg-blue-gray-50/20 text-xs text-blue-gray-500 flex items-center justify-between">
                <span>Direct employee leave workflow</span>
                <Link to="/timeoff" className="font-semibold text-indigo-600 hover:underline">
                  Go to Leave Management →
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right: Quick HR Management Actions (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <Card className="border border-blue-gray-100 shadow-sm h-full flex flex-col justify-between overflow-hidden">
            <CardHeader floated={false} shadow={false} className="p-4 flex items-center justify-between border-b border-blue-gray-50 m-0 rounded-none bg-blue-gray-50/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-sm">
                  <CheckBadgeIcon className="h-5 w-5" />
                </div>
                <div>
                  <Typography variant="h6" color="blue-gray" className="font-bold text-sm">
                    HR Quick Operations
                  </Typography>
                  <Typography variant="small" className="text-[11px] text-blue-gray-500">
                    Fast shortcuts to primary HR management modules
                  </Typography>
                </div>
              </div>
            </CardHeader>

            <CardBody className="p-5 flex-1 flex flex-col justify-between gap-3 text-xs">
              <div className="space-y-2.5">
                <Link
                  to="/employees"
                  className="p-3 rounded-lg border border-blue-gray-100 flex items-center justify-between hover:bg-indigo-50/50 hover:border-indigo-200 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <UserPlusIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-blue-gray-800 text-xs block group-hover:text-indigo-700">
                        Employee Directory & Onboarding
                      </span>
                      <span className="text-[11px] text-blue-gray-400">
                        Add, search, and view 360° employee dossiers
                      </span>
                    </div>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-blue-gray-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  to="/contracts"
                  className="p-3 rounded-lg border border-blue-gray-100 flex items-center justify-between hover:bg-blue-50/50 hover:border-blue-200 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <DocumentPlusIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-blue-gray-800 text-xs block group-hover:text-blue-700">
                        Employment Contracts
                      </span>
                      <span className="text-[11px] text-blue-gray-400">
                        Issue, renew, and assign salary structures
                      </span>
                    </div>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-blue-gray-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  to="/schedules"
                  className="p-3 rounded-lg border border-blue-gray-100 flex items-center justify-between hover:bg-emerald-50/50 hover:border-emerald-200 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <CalendarDaysIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-blue-gray-800 text-xs block group-hover:text-emerald-700">
                        Working Schedules & Shifts
                      </span>
                      <span className="text-[11px] text-blue-gray-400">
                        Configure weekly hours and shift lines
                      </span>
                    </div>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-blue-gray-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              <div className="p-3 rounded-lg bg-blue-gray-50 border border-blue-gray-100 text-[11px] text-blue-gray-600">
                💡 <strong>Tip:</strong> You can view detailed logs of all employee clock-ins and clock-outs in the <Link to="/attendance" className="text-indigo-600 font-semibold hover:underline">Attendance Module</Link>.
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
