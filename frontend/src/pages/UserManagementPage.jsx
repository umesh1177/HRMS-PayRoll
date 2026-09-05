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
import { Button, Chip } from '@material-tailwind/react';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import axiosClient from '../api/axiosClient';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get('/auth/users');
        if (res.data?.data) {
          setUsers(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

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
          <Button color="indigo" size="sm" className="flex items-center gap-2">
            <UserPlusIcon className="h-4 w-4" /> Create User
          </Button>
        }
      />
    </div>
  );
}
