/**
 * Main Application Sidebar Navigation
 * 
 * THEME ORIGIN:
 * Adapted from Material Tailwind Dashboard React's `src/widgets/layout/sidenav.jsx`.
 * 
 * CHANGES & REMOVALS:
 * Removed demo pages (demo tables, typography, notifications demo, RTL) and replaced with
 * PeoplePay360 domain navigation structure. Added role-based menu filtering based on user permissions.
 * 
 * RESPONSIBILITY:
 * Renders persistent left navigation sidebar with links to all PeoplePay360 functional modules.
 * 
 * NOT RESPONSIBLE FOR:
 * Route resolution or page content rendering.
 */

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ClockIcon,
  CalendarIcon,
  BanknotesIcon,
  CalculatorIcon,
  TableCellsIcon,
  ReceiptPercentIcon,
  UsersIcon,
  UserCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import ProfileModal from './ProfileModal';

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
      name: 'Contracts',
      path: '/contracts',
      icon: DocumentTextIcon,
      show: hasPermission('contract.manage')
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
    }
  ];

  const payrollSubItems = [
    {
      name: 'Payruns',
      path: '/payroll/payruns',
      icon: BanknotesIcon,
      show: hasPermission('payroll.payrun.manage')
    },
    {
      name: 'Payslips',
      path: '/payroll/payslips',
      icon: TableCellsIcon,
      show: hasPermission('payroll.payslip.view')
    },
    {
      name: 'Salary Structures',
      path: '/payroll/structures',
      icon: CalculatorIcon,
      show: hasPermission('payroll.structure.view')
    },
    {
      name: 'Salary Rules',
      path: '/payroll/rules',
      icon: ReceiptPercentIcon,
      show: hasPermission('payroll.structure.view')
    }
  ];

  const showPayrollSection = payrollSubItems.some((item) => item.show);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 my-4 ml-4 w-72 rounded-xl bg-gradient-to-br from-blue-gray-800 to-blue-gray-900 shadow-2xl transition-transform duration-300 xl:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-80'
      } flex flex-col justify-between`}
    >
      <div className="p-4 overflow-y-auto max-h-[calc(100vh-120px)] custom-scrollbar">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md font-black text-lg">
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
                    `flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-md shadow-indigo-500/20'
                        : 'text-blue-gray-200 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}

          {/* Payroll Section Accordion */}
          {showPayrollSection && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setPayrollMenuOpen(!payrollMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold uppercase tracking-wider text-blue-gray-400 hover:text-white"
              >
                <span>Payroll</span>
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform ${payrollMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {payrollMenuOpen && (
                <div className="pl-2 space-y-1">
                  {payrollSubItems
                    .filter((item) => item.show)
                    .map((subItem) => {
                      const SubIcon = subItem.icon;
                      return (
                        <NavLink
                          key={subItem.path}
                          to={subItem.path}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                              isActive
                                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-sm'
                                : 'text-blue-gray-300 hover:bg-white/10 hover:text-white'
                            }`
                          }
                        >
                          <SubIcon className="h-4 w-4" />
                          <span>{subItem.name}</span>
                        </NavLink>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* User Management for Admins */}
          {hasPermission('user.manage') && (
            <div className="pt-2">
              <NavLink
                to="/users"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-md shadow-indigo-500/20'
                      : 'text-blue-gray-200 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <UsersIcon className="h-5 w-5" />
                <span>User Management</span>
              </NavLink>
            </div>
          )}
        </div>
      </div>

      {/* Profile button */}
      {user && (
        <button type="button" onClick={() => setProfileOpen(true)} className="m-3 flex w-[calc(100%-1.5rem)] items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-indigo-400/50 hover:bg-indigo-500/10">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-200">
            <UserCircleIcon className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-white">My Profile</span>
            <span className="mt-0.5 block truncate text-xs text-blue-gray-300">{user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.email}</span>
          </span>
          <span className="text-xs font-semibold text-indigo-300">View</span>
        </button>
      )}
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
    </aside>
  );
}
