/**
 * Employment Contracts Management Page
 * 
 * RESPONSIBILITY:
 * Main page for employee contracts, wage configuration, and contract period tracking.
 * Manages ContractList view and ContractForm modal.
 * 
 * NOT RESPONSIBLE FOR:
 * Live monthly attendance hour deduction formulas.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@material-tailwind/react';
import { PlusIcon } from '@heroicons/react/24/outline';
import ContractList from '../components/contracts/ContractList';
import ContractForm from '../components/contracts/ContractForm';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import mockContracts from '../api/mocks/contracts.json';
import mockEmployees from '../api/mocks/employees.json';
import mockSchedules from '../api/mocks/schedules.json';

/**
 * Contracts Page Component.
 * 
 * @returns {JSX.Element} Contracts management view
 */
export default function ContractsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('contract.manage');

  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [page]);

  const fetchAuxiliaryData = async () => {
    try {
      const [empRes, schRes, strRes] = await Promise.allSettled([
        axiosClient.get('/employees?limit=100'),
        axiosClient.get('/schedules'),
        axiosClient.get('/payroll/structures')
      ]);

      if (empRes.status === 'fulfilled' && empRes.value.data?.data) {
        setEmployees(empRes.value.data.data);
      } else {
        setEmployees(mockEmployees);
      }

      if (schRes.status === 'fulfilled' && schRes.value.data?.data) {
        setSchedules(schRes.value.data.data);
      } else {
        setSchedules(mockSchedules);
      }

      if (strRes.status === 'fulfilled' && strRes.value.data?.data) {
        setSalaryStructures(strRes.value.data.data);
      } else {
        setSalaryStructures([{ id: 1, name: 'Regular Salary Structure' }]);
      }
    } catch (err) {
      console.warn('Failed to load auxiliary contract dependencies, using mocks.');
      setEmployees(mockEmployees);
      setSchedules(mockSchedules);
    }
  };

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/contracts?page=${page}&limit=10`);
      if (res.data?.data) {
        setContracts(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setContracts(mockContracts);
        setTotalPages(1);
      }
    } catch (err) {
      console.warn('Backend unavailable, using mock contracts.');
      setContracts(mockContracts);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedContract(null);
    setFormOpen(true);
  };

  const handleEdit = (contract) => {
    setSelectedContract(contract);
    setFormOpen(true);
  };

  const handleOpenDelete = (contract) => {
    setSelectedContract(contract);
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedContract) return;
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await axiosClient.delete(`/contracts/${selectedContract.id}`);
      setDeleteOpen(false);
      setSelectedContract(null);
      fetchContracts();
    } catch (err) {
      console.error('Failed to delete contract:', err);
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete contract. Please try again.';
      setDeleteError(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <ContractList
        contracts={contracts}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onEdit={handleEdit}
        onDelete={canManage ? handleOpenDelete : null}
        actionButton={
          canManage && (
            <Button
              color="indigo"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleCreate}
            >
              <PlusIcon className="h-4 w-4" /> Create Contract
            </Button>
          )
        }
      />

      <ContractForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        contract={selectedContract}
        employees={employees}
        schedules={schedules}
        salaryStructures={salaryStructures}
        onSuccess={fetchContracts}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Contract"
        itemName={selectedContract ? `contract for ${selectedContract.employee_name || 'Employee'}` : 'this contract'}
        loading={deleteLoading}
        errorMessage={deleteError}
      />
    </div>
  );
}
