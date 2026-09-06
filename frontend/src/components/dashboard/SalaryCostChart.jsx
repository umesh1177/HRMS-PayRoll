/**
 * Department Salary Cost Distribution Chart
 * 
 * RESPONSIBILITY:
 * Visualizes gross and net salary allocations across departments using Recharts ResponsiveContainer & BarChart.
 * Consumes `salary_by_department` data aggregated from `vw_payroll_summary`.
 * 
 * NOT RESPONSIBLE FOR:
 * Fetching raw DB records directly or modifying department salary figures.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardBody, Typography } from '@material-tailwind/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

/**
 * Custom tooltip formatter for currency values.
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-md border border-blue-gray-100 text-xs">
        <p className="font-bold text-blue-gray-800 mb-1">{label}</p>
        <p className="text-indigo-600 font-semibold">
          Total Net Paid: ${Number(payload[0]?.value || 0).toLocaleString()}
        </p>
        {payload[0]?.payload?.payslip_count !== undefined && (
          <p className="text-blue-gray-500">
            Payslips Processed: {payload[0].payload.payslip_count}
          </p>
        )}
      </div>
    );
  }
  return null;
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string
};

/**
 * Renders department-wise salary distribution bar chart.
 * 
 * @param {object} props
 * @param {Array} props.data - Array of { department_name, total_net_paid, payslip_count }
 * @returns {JSX.Element}
 */
export default function SalaryCostChart({ data = [] }) {
  const chartData = (data || []).map((item) => ({
    name: item.department_name || 'Unassigned',
    total_net_paid: Number(item.total_net_paid || 0),
    payslip_count: Number(item.payslip_count || 0)
  }));

  return (
    <Card className="border border-blue-gray-100 shadow-sm h-full">
      <CardHeader floated={false} shadow={false} className="p-4 pb-0">
        <Typography variant="h6" color="blue-gray" className="font-bold">
          Salary Cost by Department
        </Typography>
        <Typography variant="small" className="text-xs text-blue-gray-500">
          Aggregated net salary paid per organizational unit (from vw_payroll_summary)
        </Typography>
      </CardHeader>
      <CardBody className="px-2 pb-4 pt-2">
        {chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-blue-gray-400">
            No department salary data recorded for this selection.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#71717a' }}
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#71717a' }}
                  tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="total_net_paid"
                  name="Net Salary ($)"
                  fill="#18181b"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

SalaryCostChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      department_name: PropTypes.string,
      total_net_paid: PropTypes.number,
      payslip_count: PropTypes.number
    })
  )
};
