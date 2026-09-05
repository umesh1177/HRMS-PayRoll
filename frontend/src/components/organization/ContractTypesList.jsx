/**
 * Contract Types & Categories Component
 * 
 * RESPONSIBILITY:
 * Renders an overview of contract types supported by the system:
 * - Permanent / Full-time
 * - Fixed-Term / Temporary
 * - Contractor / Freelance
 * - Probation / Internship
 * Shows active counts, compensation structures, and terms.
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Typography,
  Chip,
  Button
} from '@material-tailwind/react';
import {
  DocumentCheckIcon,
  BriefcaseIcon,
  ClockIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import axiosClient from '../../api/axiosClient';

const CONTRACT_TYPE_METADATA = [
  {
    type: 'permanent',
    title: 'Permanent / Full-Time',
    badgeColor: 'indigo',
    icon: ShieldCheckIcon,
    description: 'Standard indefinite employment agreements with full company benefits, annual leave quotas, and regular salary structures.',
    terms: 'Indefinite duration, standard notice period (30-60 days), full benefits & PTO accrual.',
    defaultSchedule: 'Standard 40h Full-Time (Mon-Fri)',
    probation: 'Typically 3-6 months'
  },
  {
    type: 'fixed_term',
    title: 'Fixed-Term / Temporary',
    badgeColor: 'amber',
    icon: ClockIcon,
    description: 'Time-bound employment agreements with designated start and end dates for project-based initiatives.',
    terms: 'Defined duration, renewal upon mutual consent, prorated leave & structure.',
    defaultSchedule: 'Standard 40h or Project Shift',
    probation: '1-2 months'
  },
  {
    type: 'contractor',
    title: 'Contractor / Consultant',
    badgeColor: 'cyan',
    icon: BriefcaseIcon,
    description: 'Independent specialist contracts with milestone-based or hourly/monthly retainers without standard employee payroll tax withholding.',
    terms: 'Service agreement basis, invoice-linked or direct rate, flexible working arrangement.',
    defaultSchedule: 'Flexible / Task-based',
    probation: 'N/A'
  },
  {
    type: 'intern',
    title: 'Internship / Probationary',
    badgeColor: 'teal',
    icon: SparklesIcon,
    description: 'Training and evaluation contracts for trainees, fresh graduates, or newly onboarded staff undergoing trial periods.',
    terms: 'Fixed 3 to 6 months duration, stipend or base wage, transition to permanent contract upon review.',
    defaultSchedule: 'Standard Full-Time or Part-Time',
    probation: 'Evaluated continuously'
  }
];

export default function ContractTypesList() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get('/contracts?limit=200');
        if (res.data?.data) {
          setContracts(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load contracts for contract types breakdown:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, []);

  const getContractCount = (type) => {
    return contracts.filter((c) => c.contract_type === type || (type === 'intern' && c.contract_type === 'probation')).length;
  };

  const getRunningCount = (type) => {
    return contracts.filter(
      (c) => (c.contract_type === type || (type === 'intern' && c.contract_type === 'probation')) && c.status === 'running'
    ).length;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-blue-gray-100 shadow-sm">
        <div>
          <h5 className="text-base font-bold text-blue-gray-800">
            Employment Contract Types & Categories
          </h5>
          <p className="text-xs text-blue-gray-500 mt-0.5">
            Standard employment archetypes, statutory terms, and live contract counts in PeoplePay360
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip
            variant="ghost"
            color="indigo"
            value={`${contracts.length} Total Contracts`}
            className="font-bold text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CONTRACT_TYPE_METADATA.map((ct) => {
          const Icon = ct.icon;
          const totalCount = getContractCount(ct.type);
          const runningCount = getRunningCount(ct.type);

          return (
            <Card key={ct.type} className="border border-blue-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <CardBody className="p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <Typography variant="h6" color="blue-gray" className="font-bold text-sm">
                          {ct.title}
                        </Typography>
                        <span className="text-[11px] font-semibold text-blue-gray-400 uppercase tracking-wider">
                          Type Code: <code className="text-indigo-600 font-mono">{ct.type}</code>
                        </span>
                      </div>
                    </div>

                    <Chip
                      size="sm"
                      variant="filled"
                      color={ct.badgeColor}
                      value={`${runningCount} Active`}
                      className="font-bold text-[10px] uppercase"
                    />
                  </div>

                  <p className="text-xs text-blue-gray-600 leading-relaxed mb-4">
                    {ct.description}
                  </p>

                  <div className="p-3 bg-blue-gray-50/50 rounded-lg space-y-2 text-xs border border-blue-gray-100/60 mb-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-blue-gray-700">Standard Terms:</span>
                      <span className="text-blue-gray-600 text-right">{ct.terms}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-blue-gray-700">Default Schedule:</span>
                      <span className="text-blue-gray-600 text-right">{ct.defaultSchedule}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-blue-gray-700">Probation Period:</span>
                      <span className="text-blue-gray-600 text-right">{ct.probation}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-blue-gray-100 flex items-center justify-between text-xs">
                  <span className="text-blue-gray-500 font-medium">
                    Total Registered: <strong className="text-blue-gray-900">{totalCount}</strong>
                  </span>
                  <span className="text-indigo-600 font-semibold text-[11px]">
                    Supported in Contract Creation
                  </span>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
