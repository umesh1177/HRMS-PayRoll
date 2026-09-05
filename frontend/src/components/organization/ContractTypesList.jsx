/**
 * Contract Types & Categories Component
 * 
 * RESPONSIBILITY:
 * Renders live list of contract types from backend API, displays active contracts count,
 * and allows Admins to create new contract types, edit existing types, and delete unused types.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardBody,
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip
} from '@material-tailwind/react';
import {
  ShieldCheckIcon,
  ClockIcon,
  BriefcaseIcon,
  SparklesIcon,
  DocumentDuplicateIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import axiosClient from '../../api/axiosClient';
import ContractTypeModal from './ContractTypeModal';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';
import DataTable from '../common/DataTable';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_ICONS = {
  permanent: ShieldCheckIcon,
  fixed_term: ClockIcon,
  contractor: BriefcaseIcon,
  intern: SparklesIcon,
  part_time: ClockIcon
};

export default function ContractTypesList() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('contract.manage') || hasPermission('employee.manage') || hasPermission('user.manage');

  const [contractTypes, setContractTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchContractTypes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/contract-types');
      if (res.data?.data) {
        setContractTypes(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load contract types:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContractTypes();
  }, [fetchContractTypes]);

  const handleOpenCreate = () => {
    setSelectedType(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (type) => {
    setSelectedType(type);
    setModalOpen(true);
  };

  const handleOpenDelete = (type) => {
    setTypeToDelete(type);
    setDeleteError('');
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!typeToDelete) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await axiosClient.delete(`/contract-types/${typeToDelete.id}`);
      setDeleteOpen(false);
      setTypeToDelete(null);
      fetchContractTypes();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete contract type.';
      setDeleteError(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Contract Type',
      render: (row) => {
        const Icon = DEFAULT_ICONS[row.code] || DocumentDuplicateIcon;
        return (
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-xs text-blue-gray-900 block">{row.name}</span>
              <span className="text-[10px] text-blue-gray-400 font-mono uppercase">Code: {row.code}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'default_duration',
      label: 'Duration',
      render: (row) => (
        <span className="text-xs text-blue-gray-700 font-medium">
          {row.default_duration || 'Not specified'}
        </span>
      )
    },
    {
      key: 'default_terms',
      label: 'Standard Terms',
      render: (row) => (
        <span className="text-xs text-blue-gray-600 max-w-xs block truncate" title={row.default_terms}>
          {row.default_terms || 'Standard company terms'}
        </span>
      )
    },
    {
      key: 'active_contracts_count',
      label: 'Active Contracts',
      render: (row) => (
        <Chip
          size="sm"
          variant="ghost"
          color="indigo"
          value={`${row.active_contracts_count || 0} Active / ${row.total_contracts_count || 0} Total`}
          className="font-bold text-[10px]"
        />
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
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Tooltip content="Edit Contract Type">
            <IconButton
              variant="text"
              color="indigo"
              size="sm"
              onClick={() => handleOpenEdit(row)}
            >
              <PencilSquareIcon className="h-4 w-4" />
            </IconButton>
          </Tooltip>

          <Tooltip content="Delete Contract Type">
            <IconButton
              variant="text"
              color="red"
              size="sm"
              onClick={() => handleOpenDelete(row)}
            >
              <TrashIcon className="h-4 w-4" />
            </IconButton>
          </Tooltip>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <DataTable
        title="Employment Contract Types & Categories"
        subtitle="Configure contract archetypes, default durations, terms, and active contract associations"
        columns={columns}
        data={contractTypes}
        loading={loading}
        actionButton={
          canManage && (
            <Button
              color="indigo"
              size="sm"
              className="flex items-center gap-2 shadow-indigo-500/20"
              onClick={handleOpenCreate}
            >
              <PlusIcon className="h-4 w-4" /> Add Contract Type
            </Button>
          )
        }
      />

      {/* Contract Type Form Modal */}
      <ContractTypeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        contractType={selectedType}
        onSuccess={fetchContractTypes}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setTypeToDelete(null);
          setDeleteError('');
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Delete Contract Type"
        itemName={typeToDelete?.name || 'this contract type'}
        errorMessage={deleteError}
      />
    </div>
  );
}
