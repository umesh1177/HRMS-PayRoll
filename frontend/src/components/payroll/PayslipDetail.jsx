/**
 * Detailed Payslip Breakdown & PDF Export Modal Component
 * 
 * RESPONSIBILITY:
 * Displays the complete itemized salary breakdown of a generated payslip (basic wage,
 * individual allowances, statutory deductions, gross total, and net payable amount),
 * and triggers printable PDF generation via GET /api/v1/payroll/payslips/:id/pdf.
 * 
 * NOT RESPONSIBLE FOR:
 * Mutating historical payslip lines (which are permanently frozen at compute-time).
 */

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Chip,
  Button,
  Spinner,
  Alert
} from '@material-tailwind/react';
import {
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import Modal from '../common/Modal';
import { printPayslip, downloadPayslip } from '../../utils/payslipPrinter';

/**
 * Payslip Detail Modal.
 * 
 * @param {object} props - Component props
 * @param {boolean} props.open - Modal open state
 * @param {Function} props.onClose - Close callback
 * @param {object|null} props.payslip - Selected payslip summary
 * @returns {JSX.Element} Payslip breakdown modal
 */
export default function PayslipDetail({ open, onClose, payslip }) {
  const [detailedSlip, setDetailedSlip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (open && payslip?.id) {
      fetchPayslipDetails(payslip.id);
    }
  }, [open, payslip]);

  const fetchPayslipDetails = async (slipId) => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/payroll/payslips/${slipId}`);
      setDetailedSlip(res.data?.data || payslip);
    } catch (err) {
      setDetailedSlip(payslip);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!payslip?.id) return;
    setPrinting(true);
    try {
      await printPayslip(payslip.id);
    } finally {
      setPrinting(false);
    }
  };

  const handleDownload = async () => {
    if (!payslip?.id) return;
    setDownloading(true);
    try {
      const code = detailedSlip?.employee_code || payslip.employee_code || 'EMP';
      const period = `${payslip.period_start || ''}_${payslip.period_end || ''}`;
      await downloadPayslip(payslip.id, `payslip-${code}-${period}.html`);
    } finally {
      setDownloading(false);
    }
  };

  if (!payslip) return null;

  const lines = detailedSlip?.lines || [];
  const earnings = lines.filter((l) => l.category === 'basic' || l.category === 'allowance' || l.category === 'gross');
  const deductions = lines.filter((l) => l.category === 'deduction' || l.category === 'contribution');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Payslip — ${detailedSlip?.employee_name || payslip.employee_name}`}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outlined" color="blue-gray" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              color="indigo"
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 text-xs py-2 px-3"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              {downloading ? 'Downloading...' : 'Download File'}
            </Button>

            <Button
              color="indigo"
              onClick={handlePrint}
              disabled={printing}
              className="flex items-center gap-2 text-xs py-2 px-3 shadow-md"
            >
              <PrinterIcon className="h-4 w-4" />
              {printing ? 'Preparing Print...' : 'Print / Save as PDF'}
            </Button>
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="p-8 text-center"><Spinner className="h-8 w-8 mx-auto text-indigo-600" /></div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Header Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-blue-gray-50/60 border border-blue-gray-100 text-xs">
            <div>
              <span className="text-blue-gray-400 font-medium">Employee Code</span>
              <p className="font-mono font-bold text-indigo-700">{detailedSlip?.employee_code || payslip.employee_code}</p>
            </div>
            <div>
              <span className="text-blue-gray-400 font-medium">Payroll Period</span>
              <p className="font-semibold text-blue-gray-800">{detailedSlip?.period_start || payslip.period_start} to {detailedSlip?.period_end || payslip.period_end}</p>
            </div>
            <div>
              <span className="text-blue-gray-400 font-medium">Basic Wage</span>
              <p className="font-bold text-blue-gray-800">${Number(detailedSlip?.basic_wage || payslip.basic_wage || 0).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-blue-gray-400 font-medium">Worked Days</span>
              <p className="font-bold text-blue-gray-800">{detailedSlip?.worked_days || payslip.worked_days || 0} days</p>
            </div>
          </div>

          {/* Anomaly Warning Banner */}
          {(detailedSlip?.has_warning || payslip?.has_warning) && (
            <Alert color="amber" variant="gradient" icon={<ExclamationTriangleIcon className="h-5 w-5" />} className="text-xs">
              <strong>Payroll Warning:</strong> {detailedSlip?.warning_notes || payslip?.warning_notes || 'Attendance or contract anomaly detected during computation.'}
            </Alert>
          )}

          {/* Itemized Lines Split: Earnings vs Deductions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Earnings Table */}
            <div className="border border-blue-gray-100 rounded-lg overflow-hidden">
              <div className="bg-indigo-50/60 p-2.5 border-b border-blue-gray-100 font-bold text-xs text-indigo-900 uppercase">
                Earnings & Allowances
              </div>
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-blue-gray-50">
                  {earnings.map((l) => (
                    <tr key={l.id || l.code} className="hover:bg-blue-gray-50/30">
                      <td className="p-2.5">
                        <span className="font-semibold text-blue-gray-800">{l.name}</span>
                        <span className="text-blue-gray-400 font-mono ml-1.5">({l.code})</span>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-green-700">
                        +${Number(l.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {earnings.length === 0 && (
                    <tr><td colSpan="2" className="p-4 text-center text-blue-gray-400">No earnings items</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Deductions Table */}
            <div className="border border-blue-gray-100 rounded-lg overflow-hidden">
              <div className="bg-red-50/60 p-2.5 border-b border-blue-gray-100 font-bold text-xs text-red-900 uppercase">
                Statutory & Tax Deductions
              </div>
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-blue-gray-50">
                  {deductions.map((l) => (
                    <tr key={l.id || l.code} className="hover:bg-blue-gray-50/30">
                      <td className="p-2.5">
                        <span className="font-semibold text-blue-gray-800">{l.name}</span>
                        <span className="text-blue-gray-400 font-mono ml-1.5">({l.code})</span>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-red-700">
                        -${Number(l.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {deductions.length === 0 && (
                    <tr><td colSpan="2" className="p-4 text-center text-blue-gray-400">No deductions</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gross & Net Summary Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-700 to-indigo-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div>
              <span className="text-xs text-indigo-200">Gross Total Earnings</span>
              <p className="font-bold text-lg font-mono">
                ${Number(detailedSlip?.gross_amount || payslip.gross_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wide">Net Payable Salary</span>
              <p className="font-black text-2xl font-mono text-white">
                ${Number(detailedSlip?.net_amount || payslip.net_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
