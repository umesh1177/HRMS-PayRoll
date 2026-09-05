/**
 * User & Role Management Page
 * 
 * RESPONSIBILITY:
 * Displays application user accounts, linked employee profiles, and assigned RBAC roles.
 * 
 * NOT RESPONSIBLE FOR:
 * Modifying raw SQL schema permissions directly.
 */

import React, { useState, useEffect } from 'react';
import DataTable from '../components/common/DataTable';
import { Button, Chip, Input, Alert, Typography } from '@material-tailwind/react';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import axiosClient from '../api/axiosClient';
import Modal from '../components/common/Modal';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [formData, setFormData] = useState({ email: '', role_id: '', employee_id: '', status: 'active', password: '' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/auth/users');
      setUsers(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    axiosClient.get('/auth/roles').then((res) => {
      const availableRoles = res.data?.data || [];
      setRoles(availableRoles);
      if (availableRoles[0]) setFormData((previous) => ({ ...previous, role_id: String(availableRoles[0].id) }));
    }).catch(() => setRoles([]));
    axiosClient.get('/employees?limit=100').then((res) => setEmployees(res.data?.data || [])).catch(() => setEmployees([]));
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setSubmitting(true);
    try {
      const payload = {
        email: formData.email,
        role_id: Number(formData.role_id),
        employee_id: formData.employee_id ? Number(formData.employee_id) : undefined,
        status: formData.status
      };
      if (formData.password) payload.password = formData.password;
      const res = await axiosClient.post('/auth/users', payload);
      const created = res.data?.data || {};
      setCreateOpen(false);
      setFormData({ email: '', role_id: roles[0] ? String(roles[0].id) : '', employee_id: '', status: 'active', password: '' });
      if (created.must_change_password && created.temporary_password) {
        setTemporaryPassword(created.temporary_password);
      } else {
        setSuccessMessage('User account created successfully.');
      }
      fetchUsers();
    } catch (err) {
      setErrorMessage(err.response?.data?.error?.message || 'Failed to create user account.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'employee_name', label: 'Linked Employee' },
    {
      key: 'role_name',
      label: 'Role',
      render: (row) => (
        <span className="font-semibold text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full uppercase">
          {row.role_name || row.role}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Chip
          size="sm"
          variant="ghost"
          value={row.status}
          color={row.status === 'active' ? 'green' : 'red'}
          className="w-fit capitalize font-semibold text-[11px]"
        />
      )
    },
    { key: 'last_login_at', label: 'Last Login' }
  ];

  return (
    <div className="mt-6">
      <DataTable
        title="User & Access Accounts"
        subtitle="Manage user credentials, linked employee profiles, and role assignments"
        columns={columns}
        data={users}
        loading={loading}
        actionButton={
          <Button color="indigo" size="sm" className="flex items-center gap-2" onClick={() => { setErrorMessage(''); setCreateOpen(true); }}>
            <UserPlusIcon className="h-4 w-4" /> Create User
          </Button>
        }
      />

      <Modal
        open={createOpen}
        onClose={() => !submitting && setCreateOpen(false)}
        title="Create User Account"
        size="md"
        footer={(
          <>
            <Button variant="text" color="blue-gray" onClick={() => setCreateOpen(false)} disabled={submitting}>Cancel</Button>
            <Button color="indigo" onClick={handleCreate} disabled={submitting}>{submitting ? 'Creating...' : 'Create User'}</Button>
          </>
        )}
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          {errorMessage && <Alert color="red" variant="gradient">{errorMessage}</Alert>}
          <Input label="Email *" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          <div>
            <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">Role *</Typography>
            <select value={formData.role_id} onChange={(e) => setFormData({ ...formData, role_id: e.target.value })} className="h-10 w-full rounded-md border border-blue-gray-200 px-3 text-sm" required>
              <option value="" disabled>Select role</option>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
          </div>
          <div>
            <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">Link Employee (optional)</Typography>
            <select value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} className="h-10 w-full rounded-md border border-blue-gray-200 px-3 text-sm">
              <option value="">No linked employee</option>
              {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name || `${employee.first_name} ${employee.last_name}`} ({employee.employee_code})</option>)}
            </select>
          </div>
          <div>
            <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">Status</Typography>
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="h-10 w-full rounded-md border border-blue-gray-200 px-3 text-sm">
              <option value="active">Active</option><option value="disabled">Disabled</option>
            </select>
          </div>
          <Input label="Password (optional)" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          <p className="-mt-2 text-xs text-blue-gray-500">Leave blank to auto-generate a temporary password.</p>
        </form>
      </Modal>

      <Modal
        open={Boolean(temporaryPassword)}
        onClose={() => setTemporaryPassword('')}
        title="Temporary Password"
        size="md"
        footer={<Button color="indigo" onClick={() => setTemporaryPassword('')}>I have saved this password</Button>}
      >
        <div className="flex flex-col gap-4">
          <Alert color="amber" variant="ghost">This password will never be shown again. Relay it securely to the employee and ask them to change it at first login.</Alert>
          <div className="flex gap-2">
            <Input value={temporaryPassword} readOnly label="Temporary password" />
            <Button variant="outlined" onClick={() => navigator.clipboard?.writeText(temporaryPassword)}>Copy</Button>
          </div>
        </div>
      </Modal>
      {successMessage && <Alert color="green" className="mt-4">{successMessage}</Alert>}
    </div>
  );
}
