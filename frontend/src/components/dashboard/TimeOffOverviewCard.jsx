/**
 * Time Off Overview Card Component
 * 
 * RESPONSIBILITY:
 * Displays aggregate leave figures: pending approvals, approved requests, refused requests,
 * and total leave days drawn down across the workforce (from vw_time_off_summary).
 * 
 * NOT RESPONSIBLE FOR:
 * Direct leave allocation creation or approval actions.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardBody, Typography } from '@material-tailwind/react';
import {
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  SunIcon
} from '@heroicons/react/24/solid';

/**
 * Time Off Health & Request Volume Card.
 * 
 * @param {object} props
 * @param {object} props.data - { total_requests, pending_approvals, approved, refused, total_days }
 * @returns {JSX.Element}
 */
export default function TimeOffOverviewCard({ data = {} }) {
  const totalRequests = Number(data.total_requests || 0);
  const pending = Number(data.pending_approvals || 0);
  const approved = Number(data.approved || 0);
  const refused = Number(data.refused || 0);
  const totalDays = Number(data.total_days || 0);

  const leaveMetrics = [
    {
      label: 'Pending Approvals',
      value: pending,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      icon: ClockIcon
    },
    {
      label: 'Approved Leaves',
      value: approved,
      color: 'text-green-600',
      bg: 'bg-green-50',
      icon: CheckCircleIcon
    },
    {
      label: 'Refused Requests',
      value: refused,
      color: 'text-red-600',
      bg: 'bg-red-50',
      icon: XCircleIcon
    },
    {
      label: 'Total Days Taken',
      value: `${totalDays}d`,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      icon: SunIcon
    }
  ];

  return (
    <Card className="border border-blue-gray-100 shadow-sm h-full">
      <CardHeader floated={false} shadow={false} className="p-4 pb-0 flex items-center justify-between">
        <div>
          <Typography variant="h6" color="blue-gray" className="font-bold">
            Time Off & Leave Summary
          </Typography>
          <Typography variant="small" className="text-xs text-blue-gray-500">
            Workforce leave balances & approvals (from vw_time_off_summary)
          </Typography>
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-gray-100 text-blue-gray-700">
          {totalRequests} Total
        </span>
      </CardHeader>
      <CardBody className="p-4 pt-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {leaveMetrics.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`flex items-center justify-between p-3 rounded-lg border border-blue-gray-50 ${item.bg}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${item.color}`} />
                  <span className="text-xs font-medium text-blue-gray-700">
                    {item.label}
                  </span>
                </div>
                <span className={`text-base font-bold ${item.color}`}>
                  {item.value}
                </span>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

TimeOffOverviewCard.propTypes = {
  data: PropTypes.shape({
    total_requests: PropTypes.number,
    pending_approvals: PropTypes.number,
    approved: PropTypes.number,
    refused: PropTypes.number,
    total_days: PropTypes.number
  })
};
