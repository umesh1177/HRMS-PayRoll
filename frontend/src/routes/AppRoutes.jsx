/**
 * Application Route Registry & Layout Shell
 * 
 * RESPONSIBILITY:
 * Defines application route tree, associates paths with protected page components,
 * and renders persistent Sidebar and Navbar in dashboard layout.
 * 
 * NOT RESPONSIBLE FOR:
 * Individual page internal state logic.
 */

import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';

// Pages
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import EmployeesPage from '../pages/EmployeesPage';
import ContractsPage from '../pages/ContractsPage';
import SchedulesPage from '../pages/SchedulesPage';
import AttendancePage from '../pages/AttendancePage';
import TimeOffPage from '../pages/TimeOffPage';
import PayrollPage from '../pages/PayrollPage';
import UserManagementPage from '../pages/UserManagementPage';
import OrganizationPage from '../pages/OrganizationPage';

/**
 * Layout shell that wraps authenticated dashboard routes.
 * 
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Page view to render inside main content area
 * @returns {JSX.Element} Dashboard layout shell
 */
function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-blue-gray-50/50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="p-4 xl:ml-80">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="mt-2">{children}</main>
      </div>
    </div>
  );
}

/**
 * Main application routes.
 * 
 * @returns {JSX.Element} React Router configuration
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute requiredPermission="employee.view_all">
            <DashboardLayout>
              <EmployeesPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/organization"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <OrganizationPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contracts"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ContractsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/schedules"
        element={
          <ProtectedRoute requiredPermission="schedule.manage">
            <DashboardLayout>
              <SchedulesPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <AttendancePage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/timeoff"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <TimeOffPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll/*"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <PayrollPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute requiredPermission="user.manage">
            <DashboardLayout>
              <UserManagementPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Default Fallback Redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
