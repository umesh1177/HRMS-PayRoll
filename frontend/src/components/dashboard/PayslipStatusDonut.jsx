/**
 * Payslip Status Donut Chart Component
 * 
 * RESPONSIBILITY:
 * Visualizes payslip lifecycle distribution (Draft, Computed, Validated, Paid)
 * using Recharts PieChart (donut style) with theme colors and legend.
 * 
 * NOT RESPONSIBLE FOR:
 * Changing payslip statuses or executing state transitions.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardBody, Typography } from '@material-tailwind/react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

const STATUS_COLORS = {
  Draft: '#d4d4d8',
  Computed: '#a1a1aa',
  Validated: '#52525b',
  Paid: '#18181b'
};

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-white p-2.5 rounded-lg shadow-md border border-blue-gray-100 text-xs">
        <p className="font-semibold text-blue-gray-800">{item.name}</p>
        <p className="font-bold" style={{ color: item.payload.fill }}>
          {item.value} Payslip{item.value !== 1 ? 's' : ''}
        </p>
      </div>
    );
  }
  return null;
};

CustomPieTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array
};

/**
 * Payslip Status Donut Chart.
 * 
 * @param {object} props
 * @param {object} props.statusCounts - { total, draft, computed, done, paid }
 * @returns {JSX.Element}
 */
export default function PayslipStatusDonut({ statusCounts = {} }) {
  const chartData = [
    { name: 'Draft', value: Number(statusCounts.draft || 0), fill: STATUS_COLORS.Draft },
    { name: 'Computed', value: Number(statusCounts.computed || 0), fill: STATUS_COLORS.Computed },
    { name: 'Validated', value: Number(statusCounts.done || 0), fill: STATUS_COLORS.Validated },
    { name: 'Paid', value: Number(statusCounts.paid || 0), fill: STATUS_COLORS.Paid }
  ].filter((item) => item.value > 0);

  const total = Number(statusCounts.total || 0);

  return (
    <Card className="border border-blue-gray-100 shadow-sm h-full">
      <CardHeader floated={false} shadow={false} className="p-4 pb-0">
        <Typography variant="h6" color="blue-gray" className="font-bold">
          Payslip Status Distribution
        </Typography>
        <Typography variant="small" className="text-xs text-blue-gray-500">
          Live lifecycle status across active batches
        </Typography>
      </CardHeader>
      <CardBody className="p-4 pt-2">
        {total === 0 || chartData.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-xs text-blue-gray-400">
            No active payslips found for this selection.
          </div>
        ) : (
          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(val, entry) => (
                    <span className="text-xs font-medium text-blue-gray-700">
                      {val} ({entry.payload.value})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Total Count Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-xl font-bold text-blue-gray-800">{total}</span>
              <span className="text-[10px] uppercase font-semibold text-blue-gray-400">Total Slips</span>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

PayslipStatusDonut.propTypes = {
  statusCounts: PropTypes.shape({
    total: PropTypes.number,
    draft: PropTypes.number,
    computed: PropTypes.number,
    done: PropTypes.number,
    paid: PropTypes.number
  })
};
