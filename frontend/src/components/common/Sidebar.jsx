/**
 * Main Application Sidebar Navigation
 * 
 * RESPONSIBILITY:
 * Renders persistent left navigation sidebar with links to all PeoplePay360 functional modules.
 * Includes direct access to Organization settings (Departments, Job Roles, Contract Types, Schedules),
 * Employees, Contracts, Payroll Hub, Attendance, Time Off, and User Management.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ClockIcon,
  CalendarIcon,
  BanknotesIcon,
  UsersIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

/**
 * Sidebar navigation component for PeoplePay360.
 * 
 * @param {object} props - Component props
 * @param {boolean} [props.isOpen=true] - Drawer open state on mobile devices
 * @param {Function} [props.onClose] - Close callback for mobile drawer
 * @returns {JSX.Element} Responsive sidebar navigation element
 */
export default function Sidebar({ isOpen = true, onClose }) {
  const { hasPermission, user } = useAuth();
  const isAdmin = user?.role_name === 'Admin' || user?.roles?.some((r) => r.name === 'Admin') || hasPermission('system.admin');

  // Define navigation groups matching PeoplePay360 domain modules
  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: HomeIcon,
      show: true
    },
    {
      name: 'Employees',
      path: '/employees',
      icon: UserGroupIcon,
      show: hasPermission('employee.view_all')
    },
    {
      name: 'Organization & Structure',
      path: '/organization',
      icon: BuildingOffice2Icon,
      show: isAdmin
    },
    {
      name: 'Working Schedules',
      path: '/schedules',
      icon: CalendarDaysIcon,
      show: isAdmin || hasPermission('schedule.manage')
    },
    {
      name: 'Contracts',
      path: '/contracts',
      icon: DocumentTextIcon,
      show: true
    },
    {
      name: 'Attendance',
      path: '/attendance',
      icon: ClockIcon,
      show: hasPermission('attendance.view_own') || hasPermission('attendance.manage_all')
    },
    {
      name: 'Time Off',
      path: '/timeoff',
      icon: CalendarIcon,
      show: hasPermission('timeoff.view_own') || hasPermission('timeoff.approve')
    },
    {
      name: 'Payroll & Payruns',
      path: '/payroll',
      icon: BanknotesIcon,
      show:
        hasPermission('payroll.payrun.manage') ||
        hasPermission('payroll.payslip.view') ||
        hasPermission('payroll.structure.view')
    },
    {
      name: 'User Management',
      path: '/users',
      icon: UsersIcon,
      show: hasPermission('user.manage')
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: UserCircleIcon,
      show: true
    }
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 my-4 ml-4 w-72 rounded-xl bg-gradient-to-br from-[#18181b] to-[#09090b] shadow-2xl shadow-black/20 transition-transform duration-300 xl:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-80'
      } flex flex-col justify-between`}
    >
      <div className="p-4 overflow-y-auto max-h-[calc(100vh-120px)] custom-scrollbar">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#18181b] shadow-md font-black text-lg">
            360
          </div>
          <div>
            <h6 className="text-base font-bold text-white tracking-wide">PeoplePay360</h6>
            <p className="text-xs text-blue-gray-300 font-medium">HR & Payroll Suite</p>
          </div>
        </div>

        {/* Navigation List */}
        <div className="mt-4 space-y-1">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'border-l-2 border-white bg-white/10 text-white shadow-md shadow-black/10'
                        : 'border-l-2 border-transparent text-blue-gray-200 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </NavLink>
              );
            })}
        </div>
      </div>

    </aside>
  );
}

