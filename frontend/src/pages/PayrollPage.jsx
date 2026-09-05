/**
 * Payroll Operations & Configuration Hub Page
 * 
 * RESPONSIBILITY:
 * Main container for all payroll functionality. Hosts a 4-tab interface:
 * 1. Payruns (batch generation wizard, lifecycle state transitions, payslip computations)
 * 2. Payslips (individual payslips register and itemized PDF viewer)
 * 3. Salary Structures (structure rules sequencers)
 * 4. Salary Rules (atomic rule math definitions)
 * 
 * NOT RESPONSIBLE FOR:
 * Direct SQL transaction management (handled by backend controllers and payrollEngine).
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Button
} from '@material-tailwind/react';
import {
  BanknotesIcon,
  TableCellsIcon,
  CalculatorIcon,
  ReceiptPercentIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

import PayrunList from '../components/payroll/PayrunList';
import PayrunForm from '../components/payroll/PayrunForm';
import PayslipList from '../components/payroll/PayslipList';
import PayslipDetail from '../components/payroll/PayslipDetail';
import SalaryStructureList from '../components/payroll/SalaryStructureList';
import SalaryRuleList from '../components/payroll/SalaryRuleList';

import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

import mockPayruns from '../api/mocks/payruns.json';
import mockPayslips from '../api/mocks/payslips.json';
import mockStructures from '../api/mocks/salary_structures.json';
import mockRules from '../api/mocks/salary_rules.json';

/**
 * Payroll Hub Page Component.
 * 
 * @returns {JSX.Element} Payroll hub interface
 */
export default function PayrollPage() {
  const { hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { tab } = useParams();

  const canManagePayruns = hasPermission('payroll.payrun.manage');
  const canViewStructures = hasPermission('payroll.structure.view');

  // Derive active tab from URL segment (/payroll/:tab)
  const validTabs = ['payruns', 'payslips', 'structures', 'rules'];
  const activeTab = tab && validTabs.includes(tab)
    ? tab
    : (location.pathname.split('/')[2] && validTabs.includes(location.pathname.split('/')[2])
      ? location.pathname.split('/')[2]
      : 'payruns');

  const handleTabChange = (newTab) => {
    navigate(`/payroll/${newTab}`);
  };

  // Datasets
  const [payruns, setPayruns] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [structures, setStructures] = useState([]);
  const [rules, setRules] = useState([]);

  // Loaders
  const [loadingPayruns, setLoadingPayruns] = useState(true);
  const [loadingPayslips, setLoadingPayslips] = useState(true);
  const [loadingStructures, setLoadingStructures] = useState(true);
  const [loadingRules, setLoadingRules] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [createPayrunOpen, setCreatePayrunOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [payslipDetailOpen, setPayslipDetailOpen] = useState(false);

  useEffect(() => {
    fetchStructures();
    fetchRules();
  }, []);

  useEffect(() => {
    if (activeTab === 'payruns') {
      fetchPayruns();
    } else if (activeTab === 'payslips') {
      fetchPayslips();
    } else if (activeTab === 'structures') {
      fetchStructures();
    } else if (activeTab === 'rules') {
      fetchRules();
    }
  }, [activeTab, page]);

  const fetchPayruns = async () => {
    setLoadingPayruns(true);
    try {
      const res = await axiosClient.get(`/payroll/payruns?page=${page}&limit=10`);
      if (res.data?.data) {
        setPayruns(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setPayruns([]);
      }
    } catch (err) {
      setPayruns([]);
    } finally {
      setLoadingPayruns(false);
    }
  };

  const fetchPayslips = async () => {
    setLoadingPayslips(true);
    try {
      const res = await axiosClient.get(`/payroll/payslips?page=${page}&limit=10`);
      if (res.data?.data) {
        setPayslips(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setPayslips(mockPayslips);
      }
    } catch (err) {
      setPayslips(mockPayslips);
    } finally {
      setLoadingPayslips(false);
    }
  };

  const fetchStructures = async () => {
    setLoadingStructures(true);
    try {
      const res = await axiosClient.get('/payroll/structures');
      if (res.data?.data) {
        setStructures(res.data.data);
      } else {
        setStructures(mockStructures);
      }
    } catch (err) {
      setStructures(mockStructures);
    } finally {
      setLoadingStructures(false);
    }
  };

  const fetchRules = async () => {
    setLoadingRules(true);
    try {
      const res = await axiosClient.get('/payroll/rules');
      if (res.data?.data) {
        setRules(res.data.data);
      } else {
        setRules(mockRules);
      }
    } catch (err) {
      setRules(mockRules);
    } finally {
      setLoadingRules(false);
    }
  };

  const handleOpenPayslipDetail = (slip) => {
    setSelectedPayslip(slip);
    setPayslipDetailOpen(true);
  };

  const handlePrintPdf = (slip) => {
    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    window.open(`${baseUrl}/payroll/payslips/${slip.id}/pdf?token=${token}`, '_blank');
  };

  return (
    <div className="mt-6 flex flex-col gap-6">
      <Tabs value={activeTab}>
        <TabsHeader className="bg-white border border-blue-gray-100 p-1.5 shadow-sm max-w-2xl">
          <Tab value="payruns" onClick={() => handleTabChange('payruns')} className="text-xs font-bold py-2.5">
            <div className="flex items-center gap-2">
              <BanknotesIcon className="h-4 w-4" /> Payruns
            </div>
          </Tab>
          <Tab value="payslips" onClick={() => handleTabChange('payslips')} className="text-xs font-bold py-2.5">
            <div className="flex items-center gap-2">
              <TableCellsIcon className="h-4 w-4" /> Payslips
            </div>
          </Tab>
          {canViewStructures && (
            <>
              <Tab value="structures" onClick={() => handleTabChange('structures')} className="text-xs font-bold py-2.5">
                <div className="flex items-center gap-2">
                  <CalculatorIcon className="h-4 w-4" /> Structures
                </div>
              </Tab>
              <Tab value="rules" onClick={() => handleTabChange('rules')} className="text-xs font-bold py-2.5">
                <div className="flex items-center gap-2">
                  <ReceiptPercentIcon className="h-4 w-4" /> Rules
                </div>
              </Tab>
            </>
          )}
        </TabsHeader>

        <TabsBody className="pt-4">
          {/* TAB 1: PAYRUNS */}
          <TabPanel value="payruns" className="p-0">
            <PayrunList
              payruns={payruns}
              loading={loadingPayruns}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              onPayrunUpdated={fetchPayruns}
              onViewPayslip={handleOpenPayslipDetail}
              actionButton={
                canManagePayruns && (
                  <Button
                    color="indigo"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setCreatePayrunOpen(true)}
                  >
                    <PlusIcon className="h-4 w-4" /> Create Payrun
                  </Button>
                )
              }
            />
          </TabPanel>

          {/* TAB 2: PAYSLIPS */}
          <TabPanel value="payslips" className="p-0">
            <PayslipList
              payslips={payslips}
              loading={loadingPayslips}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              onView={handleOpenPayslipDetail}
              onPrintPdf={handlePrintPdf}
            />
          </TabPanel>

          {/* TAB 3: SALARY STRUCTURES */}
          {canViewStructures && (
            <TabPanel value="structures" className="p-0">
              <SalaryStructureList
                structures={structures}
                rules={rules}
                loading={loadingStructures}
                onStructureSaved={() => {
                  fetchStructures();
                  fetchRules();
                }}
              />
            </TabPanel>
          )}

          {/* TAB 4: SALARY RULES */}
          {canViewStructures && (
            <TabPanel value="rules" className="p-0">
              <SalaryRuleList
                rules={rules}
                loading={loadingRules}
                onRuleSaved={() => {
                  fetchRules();
                  fetchStructures();
                }}
              />
            </TabPanel>
          )}
        </TabsBody>
      </Tabs>

      {/* 2-Step Payrun Creation Wizard */}
      <PayrunForm
        open={createPayrunOpen}
        onClose={() => setCreatePayrunOpen(false)}
        structures={structures}
        onSuccess={fetchPayruns}
      />

      {/* Payslip Detail Breakdown Modal */}
      <PayslipDetail
        open={payslipDetailOpen}
        onClose={() => setPayslipDetailOpen(false)}
        payslip={selectedPayslip}
      />
    </div>
  );
}
