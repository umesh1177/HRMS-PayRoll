/**
 * User & Role Management Page
 * 
 * RESPONSIBILITY:
 * Displays application user accounts, linked employee profiles, and assigned RBAC roles.
 * Provides user account creation, multi-role editing, and account deletion.
 */

import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/common/DataTable';
import { Button, Chip, IconButton, Tooltip } from '@material-tailwind/react';
import { UserPlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import axiosClient from '../api/axiosClient';
import UserForm from '../components/users/UserForm';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/formatters';

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Delete Modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchUsers = useCallback(async () => {
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
  }, []);

  const fetchDependencies = useCallback(async () => {
    try {
      const [rolesRes, empsRes] = await Promise.all([
        axiosClient.get('/auth/roles'),
        axiosClient.get('/employees?limit=200')
      ]);

      if (rolesRes.data?.data) {
        setRoles(rolesRes.data.data);
      }
      if (empsRes.data?.data) {
        setEmployees(empsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load roles or employees:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchDependencies();
  }, [fetchUsers, fetchDependencies]);

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setFormOpen(true);
  };

  const handleOpenDelete = (user) => {
    setUserToDelete(user);
    setDeleteError('');
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setDeleting(true);
      setDeleteError('');
      await axiosClient.delete(`/auth/users/${userToDelete.id}`);
      setDeleteOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete user account.';
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'email',
      label: 'Email',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-blue-gray-800 text-xs flex items-center gap-1.5">
            {row.email}
            {currentUser?.id === row.id && (
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                You
              </span>
            )}
          </span>
        </div>
      )
    },
    {
      key: 'employee_name',
      label: 'Linked Employee',
      render: (row) => (
        <span className="text-xs text-blue-gray-700">
          {row.employee_name ? (
            <span className="font-medium text-indigo-900">{row.employee_name}</span>
          ) : (
            <span className="text-blue-gray-400 italic">No linked profile</span>
          )}
        </span>
      )
    },
    {
      key: 'roles',
      label: 'Assigned Roles',
      render: (row) => {
        const assignedRoles = row.roles && Array.isArray(row.roles) && row.roles.length > 0
          ? row.roles
          : row.role_name
            ? [{ id: row.role_id, name: row.role_name }]
            : [];

        if (assignedRoles.length === 0) {
          return <span className="text-xs text-blue-gray-400">None</span>;
        }

        return (
          <div className="flex flex-wrap gap-1">
            {assignedRoles.map((r, idx) => (
              <span
                key={r.id || idx}
                className="font-semibold text-[10px] tracking-wide text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md uppercase shadow-xs"
              >
                {r.name || r}
              </span>
            ))}
          </div>
        );
      }
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
    {
      key: 'last_login_at',
      label: 'Last Login',
      render: (row) => (
        <span className="text-xs text-blue-gray-500">
          {formatDateTime(row.last_login_at)}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Tooltip content="Edit Roles & User">
            <IconButton
              variant="text"
              color="indigo"
              size="sm"
              onClick={() => handleOpenEdit(row)}
            >
              <PencilSquareIcon className="h-4 w-4" />
            </IconButton>
          </Tooltip>

          <Tooltip content={currentUser?.id === row.id ? 'Cannot delete your own account' : 'Delete User'}>
            <span>
              <IconButton
                variant="text"
                color="red"
                size="sm"
                disabled={currentUser?.id === row.id}
                onClick={() => handleOpenDelete(row)}
              >
                <TrashIcon className="h-4 w-4" />
              </IconButton>
            </span>
          </Tooltip>
        </div>
      )
    }
  ];

  return (
    <div className="mt-6">
      <DataTable
        title="User & Access Accounts"
        subtitle="Manage user credentials, linked employee profiles, and multi-role RBAC assignments"
        columns={columns}
        data={users}
        loading={loading}
      />

      {/* User Edit Roles Modal */}
      <UserForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        user={selectedUser}
        roles={roles}
        employees={employees}
        onSuccess={fetchUsers}
      />

      {/* User Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete User Account"
        itemName={userToDelete?.email || 'this user'}
        errorMessage={deleteError}
        loading={deleting}
      />
    </div>
  );
}

