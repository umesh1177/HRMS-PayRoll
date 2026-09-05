/**
 * Working Schedule & Shift Grid Modal Form
 * 
 * RESPONSIBILITY:
 * Provides a Day-of-Week x Time-Range editable shift matrix. Dynamically computes
 * daily and total weekly hours as inputs change, and submits schedule definitions.
 * 
 * NOT RESPONSIBLE FOR:
 * Live punch-in logging.
 */

import React, { useState, useEffect } from 'react';
import {
  Input,
  Button,
  Alert,
  Typography,
  Checkbox
} from '@material-tailwind/react';
import { InformationCircleIcon, ClockIcon } from '@heroicons/react/24/solid';
import Modal from '../common/Modal';
import axiosClient from '../../api/axiosClient';

const DAYS_OF_WEEK = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' }
];

/**
 * Schedule Form Component.
 * 
 * @param {object} props - Component props
 * @param {boolean} props.open - Modal open state
 * @param {Function} props.onClose - Modal close handler
 * @param {object|null} [props.schedule] - Existing schedule object
 * @param {Function} props.onSuccess - Callback triggered after successful save
 * @returns {JSX.Element} Schedule Grid Modal
 */
export default function ScheduleForm({
  open,
  onClose,
  schedule = null,
  onSuccess
}) {
  const isEdit = !!schedule?.id;

  const [name, setName] = useState('');
  const [scheduleType, setScheduleType] = useState('full_time');
  const [status, setStatus] = useState('active');

  // Matrix state: array of 7 day configurations
  const [dayConfigs, setDayConfigs] = useState(
    DAYS_OF_WEEK.map((d) => ({
      day_of_week: d.key,
      label: d.label,
      enabled: d.key !== 'sat' && d.key !== 'sun',
      start_time: '09:00',
      end_time: '18:00',
      break_minutes: 60
    }))
  );

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (schedule) {
      setName(schedule.name || '');
      setScheduleType(schedule.schedule_type || 'full_time');
      setStatus(schedule.status || 'active');

      if (Array.isArray(schedule.lines) && schedule.lines.length > 0) {
        setDayConfigs(
          DAYS_OF_WEEK.map((d) => {
            const matchedLine = schedule.lines.find((l) => l.day_of_week === d.key);
            if (matchedLine) {
              return {
                day_of_week: d.key,
                label: d.label,
                enabled: true,
                start_time: matchedLine.start_time?.slice(0, 5) || '09:00',
                end_time: matchedLine.end_time?.slice(0, 5) || '18:00',
                break_minutes: Number(matchedLine.break_minutes) || 0
              };
            }
            return {
              day_of_week: d.key,
              label: d.label,
              enabled: false,
              start_time: '09:00',
              end_time: '18:00',
              break_minutes: 60
            };
          })
        );
      }
    } else {
      setName('');
      setScheduleType('full_time');
      setStatus('active');
      setDayConfigs(
        DAYS_OF_WEEK.map((d) => ({
          day_of_week: d.key,
          label: d.label,
          enabled: d.key !== 'sat' && d.key !== 'sun',
          start_time: '09:00',
          end_time: '18:00',
          break_minutes: 60
        }))
      );
    }
    setErrors({});
    setTouched(false);
    setErrorMessage('');
  }, [schedule, open]);

  // Helper to calculate hours for a single day line
  const calculateDayHours = (cfg) => {
    if (!cfg.enabled || !cfg.start_time || !cfg.end_time) return 0;
    const [sh, sm] = cfg.start_time.split(':').map(Number);
    const [eh, em] = cfg.end_time.split(':').map(Number);
    const totalMinutes = (eh * 60 + em) - (sh * 60 + sm) - (Number(cfg.break_minutes) || 0);
    return Math.max(0, Number((totalMinutes / 60).toFixed(2)));
  };

  // Validation function
  const validateForm = () => {
    const errs = {};
    if (!name || name.trim().length < 2) {
      errs.name = 'Schedule name must be at least 2 characters.';
    }

    const enabledDays = dayConfigs.filter((d) => d.enabled);
    if (enabledDays.length === 0) {
      errs.days = 'Please select at least one working day for this schedule.';
    }

    const dayErrs = {};
    enabledDays.forEach((d) => {
      if (!d.start_time || !d.end_time) {
        dayErrs[d.day_of_week] = 'Start and end time are required.';
        return;
      }
      const [sh, sm] = d.start_time.split(':').map(Number);
      const [eh, em] = d.end_time.split(':').map(Number);
      const spanMinutes = (eh * 60 + em) - (sh * 60 + sm);

      if (spanMinutes <= 0) {
        dayErrs[d.day_of_week] = 'End time must be after start time.';
      } else if (Number(d.break_minutes) < 0) {
        dayErrs[d.day_of_week] = 'Break cannot be negative.';
      } else if (Number(d.break_minutes) >= spanMinutes) {
        dayErrs[d.day_of_week] = 'Break exceeds shift duration.';
      }
    });

    if (Object.keys(dayErrs).length > 0) {
      errs.dayDetails = dayErrs;
    }

    return errs;
  };

  // Live weekly total hours
  const totalWeeklyHours = dayConfigs
    .reduce((acc, curr) => acc + calculateDayHours(curr), 0)
    .toFixed(2);

  const handleDayToggle = (dayKey) => {
    setDayConfigs((prev) =>
      prev.map((d) => (d.day_of_week === dayKey ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const handleDayFieldChange = (dayKey, field, value) => {
    setDayConfigs((prev) =>
      prev.map((d) => (d.day_of_week === dayKey ? { ...d, [field]: value } : d))
    );
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setTouched(true);

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setErrorMessage('');
    setSubmitting(true);

    try {
      const activeLines = dayConfigs
        .filter((d) => d.enabled)
        .map((d) => ({
          day_of_week: d.day_of_week,
          start_time: `${d.start_time}:00`,
          end_time: `${d.end_time}:00`,
          break_minutes: Number(d.break_minutes) || 0
        }));

      const payload = {
        name: name.trim(),
        schedule_type: scheduleType,
        status,
        lines: activeLines
      };

      if (isEdit) {
        await axiosClient.put(`/schedules/${schedule.id}`, payload);
      } else {
        await axiosClient.post('/schedules', payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to save working schedule.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Schedule: ${schedule.name}` : 'Create Working Schedule'}
      size="xl"
      footer={
        <>
          <Button variant="text" color="blue-gray" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button color="indigo" onClick={handleSubmit} disabled={submitting || !name}>
            {submitting ? 'Saving...' : isEdit ? 'Update Schedule' : 'Create Schedule'}
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

        {/* Schedule Name and Type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Schedule Name *
            </Typography>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (touched && errors.name) {
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              placeholder="e.g. 40 Hours Standard"
              error={touched && !!errors.name}
            />
            {touched && errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Schedule Type *
            </Typography>
            <select
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
            >
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>

          <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-indigo-700 font-medium">Computed Weekly Hours</span>
              <p className="text-lg font-black text-indigo-900">{totalWeeklyHours} hrs</p>
            </div>
            <ClockIcon className="h-7 w-7 text-indigo-400" />
          </div>
        </div>

        {/* Day-of-Week x Time-Range Shift Matrix */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <Typography variant="small" color="blue-gray" className="font-bold text-xs uppercase tracking-wide">
              Weekly Shift Matrix & Break Allowances
            </Typography>
            {touched && errors.days && (
              <p className="text-xs text-red-500 font-semibold">{errors.days}</p>
            )}
          </div>

          <div className="border border-blue-gray-100 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-blue-gray-50 border-b border-blue-gray-100 text-blue-gray-700 uppercase font-semibold">
                <tr>
                  <th className="p-3">Work Day</th>
                  <th className="p-3">Shift Start</th>
                  <th className="p-3">Shift End</th>
                  <th className="p-3">Break (Mins)</th>
                  <th className="p-3 text-right">Net Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-gray-50">
                {dayConfigs.map((d) => {
                  const dayHours = calculateDayHours(d);
                  const dayError = touched && errors.dayDetails?.[d.day_of_week];
                  return (
                    <tr key={d.day_of_week} className={`${d.enabled ? 'bg-white' : 'bg-blue-gray-50/30 opacity-60'} ${dayError ? 'bg-red-50/40' : ''}`}>
                      <td className="p-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={d.enabled}
                            onChange={() => handleDayToggle(d.day_of_week)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <span className={`font-semibold ${d.enabled ? 'text-blue-gray-800' : 'text-blue-gray-400'}`}>
                            {d.label}
                          </span>
                        </label>
                        {dayError && (
                          <span className="block text-[11px] text-red-500 mt-1 font-medium">{dayError}</span>
                        )}
                      </td>

                      <td className="p-2">
                        <input
                          type="time"
                          disabled={!d.enabled}
                          value={d.start_time}
                          onChange={(e) => handleDayFieldChange(d.day_of_week, 'start_time', e.target.value)}
                          className={`px-2 py-1 rounded border text-xs focus:outline-none ${
                            dayError ? 'border-red-500' : 'border-blue-gray-200 focus:border-indigo-600'
                          }`}
                        />
                      </td>

                      <td className="p-2">
                        <input
                          type="time"
                          disabled={!d.enabled}
                          value={d.end_time}
                          onChange={(e) => handleDayFieldChange(d.day_of_week, 'end_time', e.target.value)}
                          className={`px-2 py-1 rounded border text-xs focus:outline-none ${
                            dayError ? 'border-red-500' : 'border-blue-gray-200 focus:border-indigo-600'
                          }`}
                        />
                      </td>

                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          max="240"
                          disabled={!d.enabled}
                          value={d.break_minutes}
                          onChange={(e) => handleDayFieldChange(d.day_of_week, 'break_minutes', e.target.value)}
                          className={`w-20 px-2 py-1 rounded border text-xs focus:outline-none ${
                            dayError ? 'border-red-500' : 'border-blue-gray-200 focus:border-indigo-600'
                          }`}
                        />
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-blue-gray-700">
                        {d.enabled ? `${dayHours}h` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </form>
    </Modal>
  );
}
