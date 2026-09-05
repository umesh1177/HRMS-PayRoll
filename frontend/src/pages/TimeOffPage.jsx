/**
 * Time Off & Leaves Operations Page
 * 
 * RESPONSIBILITY:
 * Main view for time-off operations. Hosts multi-tab navigation:
 * 1. Requests (employee submissions, approvals, balances)
 * 2. Types (policy categories and configuration)
 * 3. Allocations (quota tracking and grants)
 * 
 * NOT RESPONSIBLE FOR:
 * Direct punch clocking (handled by AttendancePage).
 */

import React, { useState, useEffect } from 'react';
import {
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Button
} from '@material-tailwind/react';
import {
  CalendarIcon,
  TagIcon,
  ScaleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import TimeOffRequestList from '../components/timeoff/TimeOffRequestList';
import TimeOffRequestForm from '../components/timeoff/TimeOffRequestForm';
import TimeOffTypeList from '../components/timeoff/TimeOffTypeList';
import AllocationList from '../components/timeoff/AllocationList';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import mockRequests from '../api/mocks/timeoff_requests.json';
import mockTypes from '../api/mocks/timeoff_types.json';
import mockAllocations from '../api/mocks/timeoff_allocations.json';
import mockEmployees from '../api/mocks/employees.json';

/**
 * Time Off Page Component.
 * 
 * @returns {JSX.Element} Time-Off interface
 */
export default function TimeOffPage() {
  const { hasPermission } = useAuth();
  const canManageConfig = hasPermission('timeoff.manage_config');

  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [types, setTypes] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingAllocations, setLoadingAllocations] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [requestFormOpen, setRequestFormOpen] = useState(false);

  useEffect(() => {
    fetchTypes();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRequests();
    } else if (activeTab === 'allocations') {
      fetchAllocations();
    } else if (activeTab === 'types') {
      fetchTypes();
    }
  }, [activeTab, page]);

  const fetchEmployees = async () => {
    try {
      const res = await axiosClient.get('/employees?limit=100');
      if (res.data?.data) setEmployees(res.data.data);
      else setEmployees([]);
    } catch (err) {
      setEmployees([]);
    }
  };

  const fetchTypes = async () => {
    setLoadingTypes(true);
    try {
      const res = await axiosClient.get('/timeoff/types');
      if (res.data?.data) {
        setTypes(res.data.data);
      } else {
        setTypes([]);
      }
    } catch (err) {
      setTypes([]);
    } finally {
      setLoadingTypes(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await axiosClient.get(`/timeoff/requests?page=${page}&limit=10`);
      if (res.data?.data) {
        setRequests(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setRequests([]);
        setTotalPages(1);
      }
    } catch (err) {
      setRequests([]);
      setTotalPages(1);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchAllocations = async () => {
    setLoadingAllocations(true);
    try {
      const res = await axiosClient.get('/timeoff/allocations');
      if (res.data?.data) {
        setAllocations(res.data.data);
      } else {
        setAllocations([]);
      }
    } catch (err) {
      setAllocations([]);
    } finally {
      setLoadingAllocations(false);
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-6">
      <Tabs value={activeTab}>
        <TabsHeader className="bg-white border border-blue-gray-100 p-1.5 shadow-sm max-w-lg">
          <Tab value="requests" onClick={() => setActiveTab('requests')} className="text-xs font-bold py-2.5">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" /> Requests & Approvals
            </div>
          </Tab>
          <Tab value="allocations" onClick={() => setActiveTab('allocations')} className="text-xs font-bold py-2.5">
            <div className="flex items-center gap-2">
              <ScaleIcon className="h-4 w-4" /> Allocations
            </div>
          </Tab>
          {canManageConfig && (
            <Tab value="types" onClick={() => setActiveTab('types')} className="text-xs font-bold py-2.5">
              <div className="flex items-center gap-2">
                <TagIcon className="h-4 w-4" /> Leave Types
              </div>
            </Tab>
          )}
        </TabsHeader>

        <TabsBody className="pt-4">
          <TabPanel value="requests" className="p-0">
            <TimeOffRequestList
              requests={requests}
              loading={loadingRequests}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              onRequestUpdated={fetchRequests}
              actionButton={
                <Button
                  color="indigo"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setRequestFormOpen(true)}
                >
                  <PlusIcon className="h-4 w-4" /> Request Time Off
                </Button>
              }
            />
          </TabPanel>

          <TabPanel value="allocations" className="p-0">
            <AllocationList
              allocations={allocations}
              employees={employees}
              types={types}
              loading={loadingAllocations}
              onAllocationCreated={fetchAllocations}
            />
          </TabPanel>

          {canManageConfig && (
            <TabPanel value="types" className="p-0">
              <TimeOffTypeList
                types={types}
                loading={loadingTypes}
                onTypeCreated={fetchTypes}
              />
            </TabPanel>
          )}
        </TabsBody>
      </Tabs>

      {/* Time Off Request Form Modal */}
      <TimeOffRequestForm
        open={requestFormOpen}
        onClose={() => setRequestFormOpen(false)}
        types={types}
        employees={employees}
        onSuccess={fetchRequests}
      />
    </div>
  );
}
