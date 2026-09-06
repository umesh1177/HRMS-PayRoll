/**
 * Monthly Net Salary Trend Chart
 * 
 * RESPONSIBILITY:
 * Renders chronological payroll trajectory using Recharts ResponsiveContainer & AreaChart.
 * Visualizes net salary vs gross salary progression over months (from vw_monthly_payroll_trend).
 * 
 * NOT RESPONSIBLE FOR:
 * Data aggregation or SQL view definitions.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardBody, Typography } from '@material-tailwind/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

/**
 * Custom tooltip for trend charts.
 */
const CustomTrendTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-md border border-blue-gray-100 text-xs">
        <p className="font-bold text-blue-gray-800 mb-1">{label}</p>
        <p className="text-indigo-600 font-semibold">
          Net Paid: ${Number(payload.find((p) => p.dataKey === 'total_net')?.value || 0).toLocaleString()}
        </p>
        <p className="text-blue-gray-600">
          Gross Disbursed: ${Number(payload.find((p) => p.dataKey === 'total_gross')?.value || 0).toLocaleString()}
        </p>
        {payload[0]?.payload?.payslip_count !== undefined && (
          <p className="text-blue-gray-400 mt-1">
            Total Payslips: {payload[0].payload.payslip_count}
          </p>
        )}
      </div>
    );
  }
  return null;
};

CustomTrendTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string
};

/**
 * Renders historical payroll cost trend area chart.
 * 
 * @param {object} props
 * @param {Array} props.data - Array of { month_key, month_label, total_gross, total_net, total_paid_net, payslip_count }
 * @returns {JSX.Element}
 */
export default function NetSalaryTrendChart({ data = [] }) {
  const chartData = (data || []).map((item) => ({
    month: item.month_label || item.month_key,
    total_gross: Number(item.total_gross || 0),
    total_net: Number(item.total_net || 0),
    payslip_count: Number(item.payslip_count || 0)
  }));

  return (
    <Card className="border border-blue-gray-100 shadow-sm h-full">
      <CardHeader floated={false} shadow={false} className="p-4 pb-0">
        <Typography variant="h6" color="blue-gray" className="font-bold">
          Monthly Payroll Disbursement Trend
        </Typography>
        <Typography variant="small" className="text-xs text-blue-gray-500">
          Historical Gross vs Net payout evolution (from vw_monthly_payroll_trend)
        </Typography>
      </CardHeader>
      <CardBody className="px-2 pb-4 pt-2">
        {chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-blue-gray-400">
            No historical payroll trends recorded.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#18181b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#18181b" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#71717a" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#71717a" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#71717a' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#71717a' }}
                  tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTrendTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area
                  type="monotone"
                  dataKey="total_gross"
                  name="Gross Total ($)"
                  stroke="#71717a"
                  fillOpacity={1}
                  fill="url(#colorGross)"
                />
                <Area
                  type="monotone"
                  dataKey="total_net"
                  name="Net Paid ($)"
                  stroke="#18181b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorNet)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

NetSalaryTrendChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      month_key: PropTypes.string,
      month_label: PropTypes.string,
      total_gross: PropTypes.number,
      total_net: PropTypes.number,
      payslip_count: PropTypes.number
    })
  )
};
