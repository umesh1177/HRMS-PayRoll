/**
 * Executive HR & Payroll Dashboard Page
 * 
 * THEME ORIGIN:
 * Adapted from Material Tailwind Dashboard React's `src/pages/dashboard/home.jsx`.
 * 
 * RESPONSIBILITY:
 * Orchestrates executive KPI cards (Net Salary Paid, Payslip Count, Average Salary, Attendance %),
 * interactive filters (Period, Department, Employee Type) that re-fetch /dashboard/summary,
 * SalaryCostChart (bar by department), NetSalaryTrendChart (line monthly), PayslipStatusDonut,
 * AttendanceOverviewCard, TimeOffOverviewCard, and flagged payslip warnings/alerts table.
 * 
 * NOT RESPONSIBLE FOR:
 * Background calculation formulas or state mutation logic.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Spinner,
  Button,
  Chip
} from '@material-tailwind/react';
import {
  BanknotesIcon,
  DocumentTextIcon,
  CalculatorIcon,
  CheckBadgeIcon,
  FunnelIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import SalaryCostChart from '../components/dashboard/SalaryCostChart';
import NetSalaryTrendChart from '../components/dashboard/NetSalaryTrendChart';
import PayslipStatusDonut from '../components/dashboard/PayslipStatusDonut';
import AttendanceOverviewCard from '../components/dashboard/AttendanceOverviewCard';
import TimeOffOverviewCard from '../components/dashboard/TimeOffOverviewCard';
import HRManagerDashboard from '../components/dashboard/HRManagerDashboard';

/**
 * Main Executive Dashboard.
 * 
 * @returns {JSX.Element} Dashboard screen
 */
function ExecutiveDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);

  // Top Filters
  const [period, setPeriod] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [employeeType, setEmployeeType] = useState('');

  // Consolidated dashboard payload
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 0,
    activeContracts: 0,
    pendingTimeOff: 0,
    total_net_paid: 0,
    total_gross_amount: 0,
    latestPayrunTotal: 0,
    payslip_count: 0,
    avg_salary: 0,
    attendance_rate: 100,
    payslip_status_counts: { total: 0, draft: 0, computed: 0, done: 0, paid: 0 },
    salary_by_department: [],
    monthly_net_salary_trend: [],
    attendance_overview: { active_employees: 0, present: 0, late: 0, absent: 0, overtime: 0, missing_checkout: 0 },
    time_off_overview: { total_requests: 0, pending_approvals: 0, approved: 0, refused: 0, total_days: 0 },
    warnings_count: 0,
    warnings: []
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  /**
   * Re-fetches /api/v1/dashboard/summary with current active query filters.
   */
  const fetchDashboardSummary = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (period) params.period = period;
      if (departmentId) params.department_id = departmentId;
      if (employeeType) params.employee_type = employeeType;

      const res = await axiosClient.get('/dashboard/summary', { params });
      if (res.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.warn('Dashboard summary fetch failed, using fallback data.', err);
    } finally {
      setLoading(false);
    }
  }, [period, departmentId, employeeType]);

  useEffect(() => {
    fetchDashboardSummary();
  }, [fetchDashboardSummary]);

  const fetchDepartments = async () => {
    try {
      const res = await axiosClient.get('/departments');
      setDepartments(res.data?.data || res.data || []);
    } catch (err) {
      console.warn('Could not fetch departments for filter dropdown');
    }
  };

  const handleResetFilters = () => {
    setPeriod('');
    setDepartmentId('');
    setEmployeeType('');
  };

  // Compute calculated metrics with fallbacks
  const netSalaryPaid = Number(dashboardData.total_net_paid || 0);
  const totalPayslips = Number(dashboardData.payslip_count || dashboardData.payslip_status_counts?.total || 0);
  const avgSalary = Number(
    dashboardData.avg_salary ||
    (totalPayslips > 0 ? netSalaryPaid / totalPayslips : 0)
  );

  const attOverview = dashboardData.attendance_overview || {};
  const totalAtt = Number(attOverview.present || 0) + Number(attOverview.late || 0) + Number(attOverview.absent || 0);
  const attendanceRate = totalAtt > 0
    ? Math.round(((Number(attOverview.present || 0) + Number(attOverview.late || 0)) / totalAtt) * 100)
    : (dashboardData.attendance_rate || 100);

  // 4 Primary KPI Cards
  const kpiCards = [
    {
      title: 'Net Salary Paid',
      value: `$${netSalaryPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: BanknotesIcon,
      color: 'indigo',
      footerText: `Gross Total: $${Number(dashboardData.total_gross_amount || 0).toLocaleString()}`
    },
    {
      title: 'Payslip Count',
      value: totalPayslips,
      icon: DocumentTextIcon,
      color: 'blue',
      footerText: `${dashboardData.payslip_status_counts?.paid || 0} Paid • ${dashboardData.payslip_status_counts?.computed || 0} Computed`
    },
    {
      title: 'Average Salary',
      value: `$${avgSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: CalculatorIcon,
      color: 'green',
      footerText: 'Per processed employee payslip'
    },
    {
      title: 'Attendance %',
      value: `${attendanceRate}%`,
      icon: CheckBadgeIcon,
      color: 'amber',
      footerText: `${attOverview.present || 0} Present • ${attOverview.late || 0} Late • ${attOverview.absent || 0} Absent`
    }
  ];

  return (
    <div className="mt-4 flex flex-col gap-6">
      {/* Top Welcome / Header Banner */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-900 via-indigo-700 to-blue-600 p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Typography variant="h4" color="white" className="font-bold">
            Executive HR & Payroll Dashboard 👋
          </Typography>
          <Typography variant="small" color="white" className="opacity-90 mt-1">
            Real-time analytics for workforce attendance, compensation distribution, and payrun operations.
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          <Chip
            value={`Role: ${user?.role || 'Admin'}`}
            className="bg-white/20 text-white font-medium border border-white/30 backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Top Filter Bar */}
      <Card className="border border-blue-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-blue-gray-800">
            <FunnelIcon className="h-5 w-5 text-indigo-600" />
            <Typography variant="h6" className="text-sm font-semibold">
              Filter Dashboard
            </Typography>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Period Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-blue-gray-600">Period:</label>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="text-xs px-3 py-2 border border-blue-gray-200 rounded-lg bg-white text-blue-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
                title="Filter by Period (YYYY-MM)"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-blue-gray-600">Dept:</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="text-xs px-3 py-2 border border-blue-gray-200 rounded-lg bg-white text-blue-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Employee Type Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-blue-gray-600">Type:</label>
              <select
                value={employeeType}
                onChange={(e) => setEmployeeType(e.target.value)}
                className="text-xs px-3 py-2 border border-blue-gray-200 rounded-lg bg-white text-blue-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
              >
                <option value="">All Types</option>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contractor">Contractor</option>
                <option value="intern">Intern</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            {(period || departmentId || employeeType) && (
              <Button
                size="sm"
                variant="text"
                color="red"
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-xs py-2 px-3 hover:bg-red-50"
              >
                <ArrowPathIcon className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Primary KPI Cards */}
      <div className="grid gap-y-6 gap-x-6 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          const gradientClass =
            kpi.color === 'indigo'
              ? 'from-indigo-600 to-indigo-400 shadow-indigo-500/30'
              : kpi.color === 'blue'
              ? 'from-blue-600 to-cyan-500 shadow-blue-500/30'
              : kpi.color === 'green'
              ? 'from-emerald-600 to-emerald-400 shadow-emerald-500/30'
              : 'from-amber-600 to-amber-400 shadow-amber-500/30';

          return (
            <Card key={kpi.title} className="border border-blue-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <CardBody className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${gradientClass} text-white shadow-md`}>
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
                  <Typography className="font-normal text-xs text-blue-gray-500 truncate">
                    {kpi.footerText}
                  </Typography>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Main Charts: SalaryCostChart (bar) & NetSalaryTrendChart (line/area) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalaryCostChart data={dashboardData.salary_by_department} />
        <NetSalaryTrendChart data={dashboardData.monthly_net_salary_trend} />
      </div>

      {/* Secondary Analytical Widgets: Donut, Attendance Overview, Time Off Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PayslipStatusDonut statusCounts={dashboardData.payslip_status_counts} />
        <AttendanceOverviewCard data={dashboardData.attendance_overview} />
        <TimeOffOverviewCard data={dashboardData.time_off_overview} />
      </div>

      {/* Warnings & Alerts Section */}
      <Card className="border border-blue-gray-100 shadow-sm">
        <CardHeader floated={false} shadow={false} className="p-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
            <div>
              <Typography variant="h6" color="blue-gray" className="font-bold">
                Flagged Payroll Anomaly & Warnings
              </Typography>
              <Typography variant="small" className="text-xs text-blue-gray-500">
                Payslips with missing bank details, duplicate submissions, or schedule discrepancies
              </Typography>
            </div>
          </div>
          <Chip
            size="sm"
            variant="ghost"
            color={dashboardData.warnings_count > 0 ? 'amber' : 'green'}
            value={`${dashboardData.warnings_count} Warning${dashboardData.warnings_count !== 1 ? 's' : ''}`}
          />
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          {dashboardData.warnings.length === 0 ? (
            <div className="p-6 text-center text-xs text-blue-gray-500">
              🎉 All payslips and attendances are compliant. No anomalies flagged.
            </div>
          ) : (
            <table className="w-full min-w-[640px] table-auto text-left">
              <thead>
                <tr className="border-y border-blue-gray-100 bg-blue-gray-50/50">
                  <th className="p-3 text-xs font-bold uppercase text-blue-gray-600">Employee</th>
                  <th className="p-3 text-xs font-bold uppercase text-blue-gray-600">Department</th>
                  <th className="p-3 text-xs font-bold uppercase text-blue-gray-600">Payrun Period</th>
                  <th className="p-3 text-xs font-bold uppercase text-blue-gray-600">Warning Notes</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.warnings.map((w) => (
                  <tr key={w.payslip_id} className="border-b border-blue-gray-50 hover:bg-amber-50/30 transition-colors">
                    <td className="p-3 text-xs font-semibold text-blue-gray-800">
                      {w.employee_name} <span className="font-mono text-blue-gray-500">({w.employee_code})</span>
                    </td>
                    <td className="p-3 text-xs text-blue-gray-600">
                      {w.department_name || 'Unassigned'}
                    </td>
                    <td className="p-3 text-xs text-blue-gray-600">
                      <span className="font-medium text-blue-gray-700">{w.payrun_name}</span> ({w.period_start?.slice(0, 10)} to {w.period_end?.slice(0, 10)})
                    </td>
                    <td className="p-3 text-xs text-amber-800 font-medium">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
                        {w.warning_notes}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function EmployeeDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ attendance: null, requests: 0, payslips: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPersonalSummary = async () => {
      const results = await Promise.allSettled([
        axiosClient.get('/attendance/current'),
        axiosClient.get('/timeoff/requests?limit=100'),
        axiosClient.get('/payroll/payslips?limit=1')
      ]);

      setSummary({
        attendance: results[0].status === 'fulfilled' ? results[0].value.data?.data : null,
        requests: results[1].status === 'fulfilled' ? results[1].value.data?.pagination?.total || 0 : 0,
        payslips: results[2].status === 'fulfilled' ? results[2].value.data?.pagination?.total || 0 : 0
      });
      setLoading(false);
    };

    loadPersonalSummary();
  }, []);

  const cards = [
    {
      label: 'Attendance',
      value: summary.attendance?.isCheckedIn ? 'Checked in' : 'Not checked in',
      detail: summary.attendance?.activeSession?.check_in || 'View your attendance',
      path: '/attendance',
      color: 'indigo'
    },
    {
      label: 'Time-off requests',
      value: summary.requests,
      detail: 'View request history',
      path: '/timeoff',
      color: 'amber'
    },
    {
      label: 'Payslips',
      value: summary.payslips,
      detail: 'View your payslips',
      path: '/payroll/payslips',
      color: 'green'
    }
  ];

  return (
    <div className="mt-4 flex flex-col gap-6">
      <div className="rounded-xl bg-gradient-to-r from-indigo-900 via-indigo-700 to-blue-600 p-6 text-white shadow-md">
        <p className="text-sm font-medium text-indigo-100">Employee self-service</p>
        <h1 className="mt-1 text-2xl font-bold">Welcome, {user?.first_name || user?.email}</h1>
        <p className="mt-2 text-sm text-indigo-100">Manage your attendance, time off, and payslips from one place.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.path} to={card.path} className="rounded-xl border border-blue-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-gray-500">{card.label}</p>
            <p className={`mt-3 text-2xl font-bold ${
              card.color === 'indigo' ? 'text-indigo-700' : card.color === 'amber' ? 'text-amber-700' : 'text-green-700'
            }`}>{loading ? '...' : card.value}</p>
            <p className="mt-2 text-sm text-blue-gray-500">{card.detail}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-blue-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-blue-gray-800">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/attendance" className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Open Attendance</Link>
          <Link to="/timeoff" className="rounded-lg border border-blue-gray-200 px-4 py-2.5 text-sm font-semibold text-blue-gray-700 hover:bg-blue-gray-50">Request Time Off</Link>
          <Link to="/payroll/payslips" className="rounded-lg border border-blue-gray-200 px-4 py-2.5 text-sm font-semibold text-blue-gray-700 hover:bg-blue-gray-50">View Payslips</Link>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  if (user?.role === 'Employee') return <EmployeeDashboard />;
  if (
    user?.role === 'HR Manager' ||
    (!hasPermission('payroll.structure.view') && !hasPermission('payroll.payrun.manage') && !hasPermission('system.admin'))
  ) {
    return <HRManagerDashboard />;
  }
  return <ExecutiveDashboard />;
}
