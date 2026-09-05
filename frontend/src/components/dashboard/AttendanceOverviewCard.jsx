/**
 * Attendance Overview & Health Card
 * 
 * RESPONSIBILITY:
 * Displays attendance metrics (Present, Late, Absent, Overtime, Missing Checkout)
 * aggregated from `vw_attendance_overview`.
 * 
 * NOT RESPONSIBLE FOR:
 * Punch clock actions or direct attendance editing.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardBody, Typography } from '@material-tailwind/react';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  SparklesIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/solid';

/**
 * Attendance Overview Card.
 * 
 * @param {object} props
 * @param {object} props.data - { active_employees, present, late, absent, overtime, missing_checkout }
 * @returns {JSX.Element}
 */
export default function AttendanceOverviewCard({ data = {} }) {
  const present = Number(data.present || 0);
  const late = Number(data.late || 0);
  const absent = Number(data.absent || 0);
  const overtime = Number(data.overtime || 0);
  const missingCheckout = Number(data.missing_checkout || 0);

  const metrics = [
    {
      label: 'Present On Time',
      value: present,
      color: 'text-green-600',
      bg: 'bg-green-50',
      icon: CheckCircleIcon
    },
    {
      label: 'Late Check-ins',
      value: late,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      icon: ClockIcon
    },
    {
      label: 'Recorded Absences',
      value: absent,
      color: 'text-red-600',
      bg: 'bg-red-50',
      icon: XCircleIcon
    },
    {
      label: 'Overtime Logs',
      value: overtime,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      icon: SparklesIcon
    },
    {
      label: 'Missing Checkout',
      value: missingCheckout,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      icon: ExclamationCircleIcon
    }
  ];

  return (
    <Card className="border border-blue-gray-100 shadow-sm h-full">
      <CardHeader floated={false} shadow={false} className="p-4 pb-0">
        <Typography variant="h6" color="blue-gray" className="font-bold">
          Attendance Health & Activity
        </Typography>
        <Typography variant="small" className="text-xs text-blue-gray-500">
          Workforce presence & exception indicators (from vw_attendance_overview)
        </Typography>
      </CardHeader>
      <CardBody className="p-4 pt-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className={`flex items-center justify-between p-3 rounded-lg border border-blue-gray-50 ${metric.bg}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                  <span className="text-xs font-medium text-blue-gray-700">
                    {metric.label}
                  </span>
                </div>
                <span className={`text-base font-bold ${metric.color}`}>
                  {metric.value}
                </span>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

AttendanceOverviewCard.propTypes = {
  data: PropTypes.shape({
    active_employees: PropTypes.number,
    present: PropTypes.number,
    late: PropTypes.number,
    absent: PropTypes.number,
    overtime: PropTypes.number,
    missing_checkout: PropTypes.number
  })
};
