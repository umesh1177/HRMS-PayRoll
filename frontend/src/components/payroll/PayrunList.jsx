/**
 * Payrun List & Lifecycle State Controller Component
 * 
 * RESPONSIBILITY:
 * Renders batch payroll runs (Payruns), provides a detailed inspection modal, and renders
 * dynamic workflow action buttons strictly gated by status and permissions:
 * - 'draft'      -> [Compute Payslips] (requires 'payroll.payrun.manage')
 * - 'computed'   -> [Validate Payrun]  (requires 'payroll.payrun.manage')
 * - 'validated'  -> [Mark as Paid]     (requires 'payroll.payrun.manage')
 * - 'paid'       -> Read-only locked financial archive.
 * 
 * NOT RESPONSIBLE FOR:
 * Initial two-step payrun creation (handled by PayrunForm).
 */

import React, { useState } from 'react';
import {
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Spinner,
  Alert
} from '@material-tailwind/react';
import {
  EyeIcon,
  PlayIcon,
  CheckBadgeIcon,
  BanknotesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';

/**
 * Payrun List Component.
 * 
 * @param {object} props - Component props
 * @param {Array<object>} props.payruns - Payrun records
 * @param {boolean} props.loading - Loading state
 * @param {number} props.page - Current page
 * @param {number} props.totalPages - Total pages
 * @param {Function} props.onPageChange - Page callback
 * @param {Function} props.onPayrunUpdated - Refresh callback
 * @param {Function} props.onViewPayslip - Callback to open individual payslip detail (slip: object) => void
 * @param {React.ReactNode} [props.actionButton] - Create Payrun button
 * @returns {JSX.Element} Payruns table and detail modal
 */
export default function PayrunList({
  payruns = [],
  loading = false,
  page = 1,
  totalPages = 1,
  onPageChange,
  onPayrunUpdated,
  onViewPayslip,
  actionButton
}) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('payroll.payrun.manage');

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPayrun, setSelectedPayrun] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenDetail = async (payrun) => {
    setErrorMsg('');
    setDetailModalOpen(true);
    setLoadingDetail(true);

    try {
      const res = await axiosClient.get(`/payroll/payruns/${payrun.id}`);
      setSelectedPayrun(res.data?.data || payrun);
    } catch (err) {
      setSelectedPayrun(payrun);
    } finally {
      setLoadingDetail(false);
    }
  };

  /**
   * Action trigger: Computes payslips (draft -> computed).
   * Gated by: hasPermission('payroll.payrun.manage')
   */
  const handleCompute = async (payrunId) => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      await axiosClient.post(`/payroll/payruns/${payrunId}/compute`);
      await handleOpenDetail({ id: payrunId });
      if (onPayrunUpdated) onPayrunUpdated();
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to compute payrun.');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Action trigger: Validates payrun (computed -> validated).
   * Gated by: hasPermission('payroll.payrun.manage')
   */
  const handleValidate = async (payrunId) => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      await axiosClient.post(`/payroll/payruns/${payrunId}/validate`);
      await handleOpenDetail({ id: payrunId });
      if (onPayrunUpdated) onPayrunUpdated();
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to validate payrun.');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Action trigger: Marks payrun paid (validated -> paid).
   * Gated by: hasPermission('payroll.payrun.manage')
   */
  const handleMarkPaid = async (payrunId) => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      await axiosClient.post(`/payroll/payruns/${payrunId}/mark-paid`);
      await handleOpenDetail({ id: payrunId });
      if (onPayrunUpdated) onPayrunUpdated();
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to mark payrun as paid.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Payrun Name',
      render: (row) => (
        <div>
          <p className="font-bold text-sm text-blue-gray-800">{row.name}</p>
          <p className="text-xs text-blue-gray-400">{row.structure_name}</p>
        </div>
      )
    },
    {
      key: 'period',
      label: 'Payroll Period',
      render: (row) => (
        <span className="text-xs text-blue-gray-700 font-medium">
          {row.period_start} → {row.period_end}
        </span>
      )
    },
    {
      key: 'employees_count',
      label: 'Employees',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-blue-gray-800">
          {row.employees_count || 0} Staff
        </span>
      )
    },
    {
      key: 'total_net_amount',
      label: 'Total Net Cost',
      render: (row) => (
        <span className="font-bold text-sm text-indigo-700 font-mono">
          ${Number(row.total_net_amount || 0).toLocaleString()}
        </span>
      )
    },
    {
      key: 'warnings',
      label: 'Anomalies',
      render: (row) => (
        Number(row.warning_count) > 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">
            <ExclamationTriangleIcon className="h-3.5 w-3.5" /> {row.warning_count} Warning(s)
          </span>
        ) : (
          <span className="text-xs text-green-700 font-medium">Clean</span>
        )
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const colorMap = {
          draft: 'blue-gray',
          computed: 'indigo',
          validated: 'blue',
          paid: 'green'
        };
        return (
          <Chip
            size="sm"
            variant="ghost"
            value={row.status}
            color={colorMap[row.status] || 'blue-gray'}
            className="w-fit capitalize font-bold text-[11px]"
          />
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <Tooltip content="Inspect Payrun & Payslips">
          <IconButton
            variant="text"
            color="blue-gray"
            size="sm"
            onClick={() => handleOpenDetail(row)}
          >
            <EyeIcon className="h-4 w-4 text-indigo-600" />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  return (
    <>
      <DataTable
        title="Payroll Runs (Payruns)"
        subtitle="Manage batch salary execution cycles, inspect payslip lines, and track payment settlements"
        columns={columns}
        data={payruns}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        actionButton={actionButton}
      />

      {/* PAYRUN DETAIL & WORKFLOW MODAL */}
      {selectedPayrun && (
        <Modal
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Payrun: ${selectedPayrun.name}`}
          size="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="outlined" color="blue-gray" onClick={() => setDetailModalOpen(false)}>
                Close
              </Button>

              {/* DYNAMIC ACTION BUTTONS GATED BY STATUS & RBAC PERMISSION */}
              {canManage && (
                <div className="flex items-center gap-2">
                  {selectedPayrun.status === 'draft' && (
                    <Button
                      color="indigo"
                      onClick={() => handleCompute(selectedPayrun.id)}
                      disabled={actionLoading}
                      className="flex items-center gap-2"
                    >
                      {actionLoading ? <Spinner className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                      Compute Payslips
                    </Button>
                  )}

                  {selectedPayrun.status === 'computed' && (
                    <>
                      <Button
                        variant="outlined"
                        color="blue-gray"
                        onClick={() => handleCompute(selectedPayrun.id)}
                        disabled={actionLoading}
                      >
                        Recompute
                      </Button>
                      <Button
                        color="blue"
                        onClick={() => handleValidate(selectedPayrun.id)}
                        disabled={actionLoading}
                        className="flex items-center gap-2"
                      >
                        {actionLoading ? <Spinner className="h-4 w-4" /> : <CheckBadgeIcon className="h-4 w-4" />}
                        Validate Payrun
                      </Button>
                    </>
                  )}

                  {selectedPayrun.status === 'validated' && (
                    <Button
                      color="green"
                      onClick={() => handleMarkPaid(selectedPayrun.id)}
                      disabled={actionLoading}
                      className="flex items-center gap-2"
                    >
                      {actionLoading ? <Spinner className="h-4 w-4" /> : <BanknotesIcon className="h-4 w-4" />}
                      Mark as Paid & Close
                    </Button>
                  )}

                  {selectedPayrun.status === 'paid' && (
                    <Chip
                      variant="gradient"
                      color="green"
                      value="✓ Paid & Financials Closed"
                      className="font-bold py-2 px-4"
                    />
                  )}
                </div>
              )}
            </div>
          }
        >
          {errorMsg && (
            <Alert color="red" variant="gradient" className="mb-4 text-xs">
              {errorMsg}
            </Alert>
          )}

          {loadingDetail ? (
            <div className="p-8 text-center"><Spinner className="h-8 w-8 mx-auto text-indigo-600" /></div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Summary Stats Header */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg bg-blue-gray-50/60 border border-blue-gray-100 text-xs">
                <div>
                  <span className="text-blue-gray-500 font-medium">Status</span>
                  <p className="font-bold uppercase text-indigo-800">{selectedPayrun.status}</p>
                </div>
                <div>
                  <span className="text-blue-gray-500 font-medium">Structure</span>
                  <p className="font-bold text-blue-gray-800">{selectedPayrun.structure_name || 'Standard'}</p>
                </div>
                <div>
                  <span className="text-blue-gray-500 font-medium">Period</span>
                  <p className="font-semibold text-blue-gray-800">{selectedPayrun.period_start} to {selectedPayrun.period_end}</p>
                </div>
                <div>
                  <span className="text-blue-gray-500 font-medium">Payslips Generated</span>
                  <p className="font-bold text-indigo-700 font-mono text-sm">{selectedPayrun.payslips?.length || 0} Slips</p>
                </div>
              </div>

              {/* Generated Payslips Table */}
              <div>
                <Typography variant="small" color="blue-gray" className="font-bold text-xs uppercase tracking-wider mb-2">
                  Generated Employee Payslips
                </Typography>

                {(!selectedPayrun.payslips || selectedPayrun.payslips.length === 0) ? (
                  <div className="p-6 text-center border border-dashed border-blue-gray-200 rounded-lg text-blue-gray-400 text-xs">
                    No payslips computed yet. Click "Compute Payslips" above to evaluate salary rules.
                  </div>
                ) : (
                  <div className="border border-blue-gray-100 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-blue-gray-50 text-blue-gray-700 font-bold sticky top-0 border-b border-blue-gray-100">
                        <tr>
                          <th className="p-2.5">Employee</th>
                          <th className="p-2.5 text-right">Gross ($)</th>
                          <th className="p-2.5 text-right">Net ($)</th>
                          <th className="p-2.5 text-center">Status</th>
                          <th className="p-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-gray-50">
                        {selectedPayrun.payslips.map((slip) => (
                          <tr key={slip.id} className="hover:bg-blue-gray-50/30">
                            <td className="p-2.5 font-semibold text-blue-gray-800">
                              {slip.employee_name} <span className="text-blue-gray-400 font-mono">({slip.employee_code})</span>
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-blue-gray-700">
                              ${Number(slip.gross_amount || 0).toLocaleString()}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-indigo-700">
                              ${Number(slip.net_amount || 0).toLocaleString()}
                            </td>
                            <td className="p-2.5 text-center">
                              {slip.has_warning ? (
                                <Tooltip content={slip.warning_notes || 'Warning'}>
                                  <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded cursor-help">
                                    ⚠️ Anomaly
                                  </span>
                                </Tooltip>
                              ) : (
                                <span className="text-[10px] bg-green-50 text-green-700 font-bold px-1.5 py-0.5 rounded capitalize">
                                  {slip.status}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-center">
                              <Button
                                size="sm"
                                variant="text"
                                color="indigo"
                                className="text-[10px] py-1 px-2"
                                onClick={() => {
                                  setDetailModalOpen(false);
                                  if (onViewPayslip) onViewPayslip(slip);
                                }}
                              >
                                View Lines
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
