/**
 * Time Off Request Modal Form
 * 
 * RESPONSIBILITY:
 * Collects employee time-off requests (leave type, date range, reason) and submits
 * them to POST /api/v1/timeoff/requests with inline duration and date validation.
 */

import React, { useState } from 'react';
import {
  Input,
  Button,
  Alert,
  Typography
} from '@material-tailwind/react';
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import Modal from '../common/Modal';
import axiosClient from '../../api/axiosClient';
import { validateDateRange } from '../../utils/formValidators';

/**
 * Time Off Request Form Modal.
 * 
 * @param {object} props - Component props
 * @param {boolean} props.open - Modal open state
 * @param {Function} props.onClose - Modal close handler
 * @param {Array<object>} props.types - Configured time off types
 * @param {Function} props.onSuccess - Refresh callback on successful submission
 * @returns {JSX.Element} Time-Off Form Modal
 */
export default function TimeOffRequestForm({
  open,
  onClose,
  types = [],
  onSuccess
}) {
  const [formData, setFormData] = useState({
    time_off_type_id: types.length > 0 ? String(types[0].id) : '1',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const today = new Date().toISOString().split('T')[0];

  // Calculate live days duration
  const getDuration = () => {
    if (!formData.start_date || !formData.end_date) return 0;
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    if (end < start) return 0;
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
  };

  const dateError = formData.start_date < today
    ? 'Start date cannot be earlier than today. Please choose today or a future date.'
    : validateDateRange(formData.start_date, formData.end_date, 'Start date', 'end date');
  const duration = getDuration();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ start_date: true, end_date: true });

    if (dateError) {
      setErrorMessage(dateError);
      return;
    }

    setErrorMessage('');
    setSubmitting(true);

    try {
      await axiosClient.post('/timeoff/requests', {
        time_off_type_id: Number(formData.time_off_type_id),
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason,
        status: 'submitted'
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to submit time off request.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request Time Off"
      size="md"
      footer={
        <>
          <Button variant="text" color="blue-gray" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            color="indigo"
            onClick={handleSubmit}
            disabled={submitting || !!dateError || duration <= 0}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errorMessage && (
          <Alert color="red" variant="gradient" icon={<InformationCircleIcon className="h-5 w-5" />}>
            {errorMessage}
          </Alert>
        )}

        <div>
          <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
            Time Off Type *
          </Typography>
          <select
            name="time_off_type_id"
            value={formData.time_off_type_id}
            onChange={handleChange}
            className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
            required
          >
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.requires_allocation ? 'Quota Allocation' : 'No Allocation'})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Start Date *
            </Typography>
            <Input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              onBlur={() => handleBlur('start_date')}
              min={today}
              required
            />
          </div>

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              End Date *
            </Typography>
            <Input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              onBlur={() => handleBlur('end_date')}
              min={formData.start_date || today}
              error={!!(touched.end_date && dateError)}
              required
            />
          </div>
        </div>

        {touched.end_date && dateError && (
          <p className="text-[11px] text-red-500 font-medium -mt-2">{dateError}</p>
        )}

        <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-between">
          <span className="text-xs font-medium text-indigo-800">Calculated Leave Duration:</span>
          <span className={`font-bold text-sm font-mono ${duration <= 0 ? 'text-red-600' : 'text-indigo-900'}`}>
            {duration > 0 ? `${duration} Day(s)` : 'Invalid dates'}
          </span>
        </div>

        <div>
          <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
            Reason / Notes
          </Typography>
          <Input
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            placeholder="e.g. Annual family vacation, personal errands"
          />
        </div>
      </form>
    </Modal>
  );
}
