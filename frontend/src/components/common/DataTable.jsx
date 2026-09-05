/**
 * Reusable Data Table Component
 * 
 * THEME ORIGIN:
 * Adapted from Material Tailwind Dashboard React's `src/pages/dashboard/tables.jsx`.
 * 
 * CHANGES & REMOVALS:
 * Converted static hardcoded table example into a generic, reusable, paginated
 * data grid component supporting custom cell renderers, sorting headers, pagination controls,
 * and search input filtering.
 * 
 * RESPONSIBILITY:
 * Renders data rows, column headers, pagination controls, and empty/loading states.
 * 
 * NOT RESPONSIBLE FOR:
 * Fetching raw API data or orchestrating domain state mutations.
 */

import React from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  IconButton,
  Input,
  Spinner
} from '@material-tailwind/react';
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

/**
 * Generic Paginated Data Table.
 * 
 * @param {object} props - Component props
 * @param {string} props.title - Table header title
 * @param {string} [props.subtitle] - Optional subtitle description
 * @param {Array<{ key: string, label: string, render?: (row: object) => React.ReactNode }>} props.columns - Column specifications
 * @param {Array<object>} props.data - Array of data rows
 * @param {boolean} [props.loading=false] - Loading indicator state
 * @param {number} [props.page=1] - Current active page number
 * @param {number} [props.totalPages=1] - Total number of available pages
 * @param {Function} [props.onPageChange] - Callback for page switching (newPage: number) => void
 * @param {string} [props.searchTerm=''] - Active search filter text
 * @param {Function} [props.onSearchChange] - Callback for search input updates (query: string) => void
 * @param {React.ReactNode} [props.actionButton] - Optional header action button (e.g. "Add Employee")
 * @returns {JSX.Element} Paginated Material Tailwind Table Card
 */
export default function DataTable({
  title,
  subtitle,
  columns,
  data = [],
  loading = false,
  page = 1,
  totalPages = 1,
  onPageChange,
  searchTerm = '',
  onSearchChange,
  actionButton
}) {
  return (
    <Card className="h-full w-full shadow-sm border border-blue-gray-100">
      <CardHeader floated={false} shadow={false} className="rounded-none p-4 mb-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Typography variant="h5" color="blue-gray" className="font-bold">
              {title}
            </Typography>
            {subtitle && (
              <Typography color="gray" className="mt-1 font-normal text-xs text-blue-gray-500">
                {subtitle}
              </Typography>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {onSearchChange && (
              <div className="w-full sm:w-64">
                <Input
                  label="Search..."
                  icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            )}
            {actionButton}
          </div>
        </div>
      </CardHeader>

      <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
        <table className="w-full min-w-[640px] table-auto text-left">
          <thead>
            <tr className="border-y border-blue-gray-100 bg-blue-gray-50/50">
              {columns.map((col) => (
                <th key={col.key} className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none opacity-70 text-xs uppercase"
                  >
                    {col.label}
                  </Typography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center">
                  <div className="flex justify-center items-center gap-3">
                    <Spinner className="h-6 w-6 text-indigo-600" />
                    <span className="text-sm font-medium text-blue-gray-500">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-blue-gray-400 text-sm">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => {
                const isLast = rowIndex === data.length - 1;
                const rowClasses = isLast ? 'p-4' : 'p-4 border-b border-blue-gray-50';

                return (
                  <tr key={row.id || rowIndex} className="hover:bg-blue-gray-50/30 transition-colors">
                    {columns.map((col) => (
                      <td key={col.key} className={rowClasses}>
                        {col.render ? (
                          col.render(row)
                        ) : (
                          <Typography variant="small" color="blue-gray" className="font-normal text-sm">
                            {row[col.key] !== null && row[col.key] !== undefined ? String(row[col.key]) : '-'}
                          </Typography>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        {totalPages > 1 && onPageChange && (
          <div className="flex items-center justify-between border-t border-blue-gray-50 p-4">
            <Typography variant="small" color="blue-gray" className="font-normal text-xs">
              Page {page} of {totalPages}
            </Typography>
            <div className="flex gap-2">
              <Button
                variant="outlined"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => onPageChange(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outlined"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => onPageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
