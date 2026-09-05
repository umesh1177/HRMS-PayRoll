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
import { Alert, Button, Input, Typography } from '@material-tailwind/react';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

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
  const { user, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordError('');
    if (newPassword.length < 8 || newPassword !== confirmPassword) {
      setPasswordError('New passwords must match and contain at least 8 characters.');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.error?.message || 'Unable to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-gray-50/50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="p-4 xl:ml-80">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="mt-2">{children}</main>
      </div>
      {user?.must_change_password && (
        <Modal open onClose={() => {}} title="Set a new password" size="md" footer={null}>
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
            <Typography variant="small" color="blue-gray">Your temporary password must be replaced before you can continue.</Typography>
            {passwordError && <Alert color="red" variant="gradient">{passwordError}</Alert>}
            <Input label="Current temporary password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            <Input label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            <Input label="Confirm new password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            <Button type="submit" color="indigo" disabled={savingPassword}>{savingPassword ? 'Saving...' : 'Save new password'}</Button>
          </form>
        </Modal>
      )}
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
          <ProtectedRoute requiredPermission="employee.view_own">
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
          <ProtectedRoute requiredPermission="attendance.view_own">
            <DashboardLayout>
              <AttendancePage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/timeoff"
        element={
          <ProtectedRoute requiredPermission="timeoff.view_own">
            <DashboardLayout>
              <TimeOffPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll"
        element={<Navigate to="/payroll/payruns" replace />}
      />
      <Route
        path="/payroll/:tab"
        element={
          <ProtectedRoute requiredPermission="payroll.payslip.view">
            <DashboardLayout>
              <PayrollPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll/*"
        element={
          <ProtectedRoute requiredPermission="payroll.payslip.view">
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
