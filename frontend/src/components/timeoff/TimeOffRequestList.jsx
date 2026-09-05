/**
 * Time Off Requests List Component
 * 
 * RESPONSIBILITY:
 * Renders the tabular list of employee leave requests, supports status filtering,
 * and handles Manager Approve/Refuse actions with optimistic UI state updates.
 * 
 * NOT RESPONSIBLE FOR:
 * Configuring leave types or managing allocations.
 */

import React, { useState } from 'react';
import {
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Spinner
} from '@material-tailwind/react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import DataTable from '../common/DataTable';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import { formatDateRange, formatDays } from '../../utils/formatters';

/**
 * Time Off Requests List.
 * 
 * @param {object} props - Component props
 * @param {Array<object>} props.requests - Requests array
 * @param {boolean} props.loading - Loading state
 * @param {number} props.page - Current page
 * @param {number} props.totalPages - Total pages
 * @param {Function} props.onPageChange - Page callback
 * @param {Function} props.onRequestUpdated - Callback to trigger parent refresh
 * @param {React.ReactNode} [props.actionButton] - Header create button
 * @returns {JSX.Element} Paginated requests table
 */
export default function TimeOffRequestList({
  requests = [],
  loading = false,
  page = 1,
  totalPages = 1,
  onPageChange,
  onRequestUpdated,
  actionButton
}) {
  const { hasPermission } = useAuth();
  const canApprove = hasPermission('timeoff.approve');

  // Local optimistic state tracking for immediate UI responsiveness
  const [optimisticRows, setOptimisticRows] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(null);

  /**
   * Handles optimistic approval transition.
   * 
   * OPTIMISTIC UPDATE DESIGN:
   * 1. Immediately marks row status as 'approved' in local component state to provide
   *    instant feedback to the manager without waiting for network roundtrip.
   * 2. Fires PUT /api/v1/timeoff/requests/:id/approve to execute atomic database transaction.
   * 3. On failure (e.g. allocation balance exhausted on server): reverts optimistic state
   *    and surfaces an error alert.
   */
  const handleApprove = async (reqId) => {
    setActionLoadingId(reqId);
    // Optimistic UI mutation
    setOptimisticRows((prev) => ({ ...prev, [reqId]: 'approved' }));

    try {
      await axiosClient.put(`/timeoff/requests/${reqId}/approve`);
      if (onRequestUpdated) onRequestUpdated();
    } catch (err) {
      // Revert on failure
      setOptimisticRows((prev) => {
        const copy = { ...prev };
        delete copy[reqId];
        return copy;
      });
      alert(err.response?.data?.error?.message || 'Failed to approve request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  /**
   * Handles refusal transition.
   */
  const handleRefuse = async (reqId) => {
    const reason = prompt('Please enter refusal reason (optional):');
    setActionLoadingId(reqId);
    setOptimisticRows((prev) => ({ ...prev, [reqId]: 'refused' }));

    try {
      await axiosClient.put(`/timeoff/requests/${reqId}/refuse`, { reason });
      if (onRequestUpdated) onRequestUpdated();
    } catch (err) {
      setOptimisticRows((prev) => {
        const copy = { ...prev };
        delete copy[reqId];
        return copy;
      });
      alert(err.response?.data?.error?.message || 'Failed to refuse request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const columns = [
    {
      key: 'employee_name',
      label: 'Employee',
      render: (row) => (
        <div>
          <p className="font-semibold text-sm text-blue-gray-800">{row.employee_name}</p>
          <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
            {row.employee_code}
          </span>
        </div>
      )
    },
    {
      key: 'type_name',
      label: 'Leave Type',
      render: (row) => (
        <span
          className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full text-white"
          style={{ backgroundColor: row.type_color || '#4f46e5' }}
        >
          {row.type_name}
        </span>
      )
    },
    {
      key: 'period',
      label: 'Duration',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-blue-gray-800">
            {formatDateRange(row.start_date || row.date_from, row.end_date || row.date_to)}
          </p>
          <p className="text-xs text-indigo-600 font-semibold">
            {formatDays(row.duration || row.number_of_days)}
          </p>
        </div>
      )
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (row) => (
        <span className="text-xs text-blue-gray-600 line-clamp-1">
          {row.reason || '-'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const displayStatus = optimisticRows[row.id] || row.status;
        const colorMap = {
          approved: 'green',
          submitted: 'amber',
          refused: 'red',
          draft: 'blue-gray'
        };
        return (
          <Chip
            size="sm"
            variant="ghost"
            value={displayStatus}
            color={colorMap[displayStatus] || 'blue-gray'}
            className="w-fit capitalize font-semibold text-[11px]"
          />
        );
      }
    },
    {
      key: 'actions',
      label: 'Decisions',
      render: (row) => {
        const currentStatus = optimisticRows[row.id] || row.status;
        const isPending = currentStatus === 'submitted';
        const isActionLoading = actionLoadingId === row.id;

        if (!canApprove || !isPending) {
          return <span className="text-xs text-blue-gray-400">-</span>;
        }

        return (
          <div className="flex items-center gap-1">
            {isActionLoading ? (
              <Spinner className="h-5 w-5 text-indigo-600" />
            ) : (
              <>
                <Tooltip content="Approve Leave">
                  <IconButton
                    variant="text"
                    color="green"
                    size="sm"
                    onClick={() => handleApprove(row.id)}
                  >
                    <CheckIcon strokeWidth={3} className="h-4 w-4" />
                  </IconButton>
                </Tooltip>
                <Tooltip content="Refuse Leave">
                  <IconButton
                    variant="text"
                    color="red"
                    size="sm"
                    onClick={() => handleRefuse(row.id)}
                  >
                    <XMarkIcon strokeWidth={3} className="h-4 w-4" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <DataTable
      title="Time Off Requests"
      subtitle="Review pending workforce leave applications, durations, and approval status"
      columns={columns}
      data={requests}
      loading={loading}
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      actionButton={actionButton}
    />
  );
}
