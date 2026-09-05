/**
 * Payroll Operations Hub Page
 * 
 * RESPONSIBILITY:
 * Hosts the payroll operations interface (Payruns, Payslips, Salary Structures, and Rules tabs).
 * 
 * NOT RESPONSIBLE FOR:
 * Execution of mathematical payroll formulas directly in client state.
 */

import React, { useState, useEffect } from 'react';
import DataTable from '../components/common/DataTable';
import { Button, Chip } from '@material-tailwind/react';
import { PlusIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import axiosClient from '../api/axiosClient';

export default function PayrollPage() {
  const [payruns, setPayruns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPayruns = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/payroll/payruns?page=${page}&limit=10`);
      if (res.data?.data) {
        setPayruns(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load payruns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayruns();
  }, [page]);

  const columns = [
    { key: 'name', label: 'Payrun Name' },
    { key: 'structure_name', label: 'Structure' },
    { key: 'period_start', label: 'Start Date' },
    { key: 'period_end', label: 'End Date' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Chip
          size="sm"
          variant="ghost"
          value={row.status}
          color={row.status === 'paid' ? 'green' : row.status === 'validated' ? 'blue' : row.status === 'computed' ? 'indigo' : 'amber'}
          className="w-fit capitalize font-semibold text-[11px]"
        />
      )
    }
  ];

  return (
    <div className="mt-6">
      <DataTable
        title="Payroll Runs (Payruns)"
        subtitle="Batch compute, validate, and execute monthly employee payroll"
        columns={columns}
        data={payruns}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        actionButton={
          <Button color="indigo" size="sm" className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" /> Create Payrun
          </Button>
        }
      />
    </div>
  );
}
