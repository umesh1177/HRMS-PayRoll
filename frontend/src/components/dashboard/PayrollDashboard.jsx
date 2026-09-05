/**
 * Dedicated Payroll Dashboard View Component
 * 
 * RESPONSIBILITY:
 * Encapsulates payroll-centric visual widgets (department salary costs, payslip run lifecycle, monthly payout trend).
 * 
 * NOT RESPONSIBLE FOR:
 * Global auth routing or employee punch clock.
 */

import React from 'react';
import PropTypes from 'prop-types';
import SalaryCostChart from './SalaryCostChart';
import NetSalaryTrendChart from './NetSalaryTrendChart';

/**
 * Dedicated payroll analytics panel.
 * 
 * @param {object} props
 * @param {Array} props.salaryByDepartment
 * @param {Array} props.monthlyTrend
 * @returns {JSX.Element}
 */
export default function PayrollDashboard({ salaryByDepartment = [], monthlyTrend = [] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <NetSalaryTrendChart data={monthlyTrend} />
      <SalaryCostChart data={salaryByDepartment} />
    </div>
  );
}

PayrollDashboard.propTypes = {
  salaryByDepartment: PropTypes.array,
  monthlyTrend: PropTypes.array
};
