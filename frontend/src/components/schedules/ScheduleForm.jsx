import React, { useState, useEffect, useCallback } from 'react';
import {
  Input,
  Button,
  Alert,
  Typography,
  Chip
} from '@material-tailwind/react';
import {
  InformationCircleIcon,
  ClockIcon,
  SparklesIcon,
  CalendarDaysIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
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

  // Distribution parameters
  const [targetWeeklyHours, setTargetWeeklyHours] = useState('40.00');
  const [defaultStartTime, setDefaultStartTime] = useState('09:00');
  const [defaultBreakMinutes, setDefaultBreakMinutes] = useState(60);
  const [autoDistributeOnChange, setAutoDistributeOnChange] = useState(true);

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

  // Helper to calculate hours for a single day line
  const calculateDayHours = (cfg) => {
    if (!cfg.enabled || !cfg.start_time || !cfg.end_time) return 0;
    const [sh, sm] = cfg.start_time.split(':').map(Number);
    const [eh, em] = cfg.end_time.split(':').map(Number);
    const totalMinutes = (eh * 60 + em) - (sh * 60 + sm) - (Number(cfg.break_minutes) || 0);
    return Math.max(0, Number((totalMinutes / 60).toFixed(2)));
  };

  /**
   * Helper function to compute equal distribution of target weekly hours
   * across all active/enabled running days.
   */
  const computeDistributedDays = useCallback((targetHours, startTime, breakMins, currentConfigs) => {
    const hoursNum = parseFloat(targetHours);
    const enabledDays = currentConfigs.filter((d) => d.enabled);
    const enabledCount = enabledDays.length;

    if (isNaN(hoursNum) || hoursNum <= 0 || enabledCount === 0) {
      return currentConfigs;
    }

    const dailyTargetHours = hoursNum / enabledCount;
    const dailyWorkMinutes = Math.round(dailyTargetHours * 60);
    const breakMinutesNum = Math.max(0, parseInt(breakMins, 10) || 0);

    const [shRaw, smRaw] = (startTime || '09:00').split(':').map(Number);
    const sh = isNaN(shRaw) ? 9 : shRaw;
    const sm = isNaN(smRaw) ? 0 : smRaw;
    const startMinutes = sh * 60 + sm;

    const totalShiftMinutes = dailyWorkMinutes + breakMinutesNum;
    const endMinutes = startMinutes + totalShiftMinutes;

    const eh = Math.floor(endMinutes / 60) % 24;
    const em = endMinutes % 60;
    const computedEndTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

    return currentConfigs.map((d) => {
      if (!d.enabled) return d;
      return {
        ...d,
        start_time: startTime || '09:00',
        end_time: computedEndTime,
        break_minutes: breakMinutesNum
      };
    });
  }, []);

  // Handle explicit click to distribute
  const handleApplyDistribution = () => {
    setDayConfigs((prev) =>
      computeDistributedDays(targetWeeklyHours, defaultStartTime, defaultBreakMinutes, prev)
    );
  };

  useEffect(() => {
    if (schedule) {
      setName(schedule.name || '');
      setScheduleType(schedule.schedule_type || 'full_time');
      setStatus(schedule.status || 'active');

      if (Array.isArray(schedule.lines) && schedule.lines.length > 0) {
        const loadedConfigs = DAYS_OF_WEEK.map((d) => {
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
        });
        setDayConfigs(loadedConfigs);

        // Derive total hours
        const initialTotal = loadedConfigs
          .reduce((acc, curr) => acc + calculateDayHours(curr), 0)
          .toFixed(2);
        setTargetWeeklyHours(schedule.total_weekly_hours ? Number(schedule.total_weekly_hours).toFixed(2) : initialTotal);

        // Find first active day for defaults
        const firstActive = loadedConfigs.find((d) => d.enabled);
        if (firstActive) {
          setDefaultStartTime(firstActive.start_time);
          setDefaultBreakMinutes(firstActive.break_minutes);
        }
      }
    } else {
      setName('');
      setScheduleType('full_time');
      setStatus('active');
      setTargetWeeklyHours('40.00');
      setDefaultStartTime('09:00');
      setDefaultBreakMinutes(60);

      const initialConfigs = DAYS_OF_WEEK.map((d) => ({
        day_of_week: d.key,
        label: d.label,
        enabled: d.key !== 'sat' && d.key !== 'sun',
        start_time: '09:00',
        end_time: '18:00',
        break_minutes: 60
      }));
      setDayConfigs(initialConfigs);
    }
    setErrors({});
    setTouched(false);
    setErrorMessage('');
  }, [schedule, open]);

  // Validation function
  const validateForm = () => {
    const errs = {};
    if (!name || name.trim().length < 2) {
      errs.name = 'Schedule name must be at least 2 characters.';
    }

    const enabledDays = dayConfigs.filter((d) => d.enabled);
    if (enabledDays.length === 0) {
      errs.days = 'Please select at least one running/working day for this schedule.';
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

  const runningDaysCount = dayConfigs.filter((d) => d.enabled).length;

  const handleDayToggle = (dayKey) => {
    setDayConfigs((prev) => {
      const updated = prev.map((d) => (d.day_of_week === dayKey ? { ...d, enabled: !d.enabled } : d));
      if (autoDistributeOnChange) {
        return computeDistributedDays(targetWeeklyHours, defaultStartTime, defaultBreakMinutes, updated);
      }
      return updated;
    });
  };

  const handleDayFieldChange = (dayKey, field, value) => {
    setDayConfigs((prev) =>
      prev.map((d) => (d.day_of_week === dayKey ? { ...d, [field]: value } : d))
    );
  };

  const handleTargetHoursChange = (newHours) => {
    setTargetWeeklyHours(newHours);
    if (autoDistributeOnChange) {
      setDayConfigs((prev) =>
        computeDistributedDays(newHours, defaultStartTime, defaultBreakMinutes, prev)
      );
    }
  };

  const handleDefaultStartTimeChange = (newStart) => {
    setDefaultStartTime(newStart);
    if (autoDistributeOnChange) {
      setDayConfigs((prev) =>
        computeDistributedDays(targetWeeklyHours, newStart, defaultBreakMinutes, prev)
      );
    }
  };

  const handleDefaultBreakChange = (newBreak) => {
    setDefaultBreakMinutes(newBreak);
    if (autoDistributeOnChange) {
      setDayConfigs((prev) =>
        computeDistributedDays(targetWeeklyHours, defaultStartTime, newBreak, prev)
      );
    }
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

  // Compute daily target duration description for banner
  const dailyTargetHoursVal = runningDaysCount > 0 && parseFloat(targetWeeklyHours) > 0
    ? (parseFloat(targetWeeklyHours) / runningDaysCount).toFixed(2)
    : '0.00';

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

        {/* Schedule Name, Type, Status */}
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
              placeholder="e.g. Standard 40 Hours Week"
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

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Status *
            </Typography>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
            >
              <option value="active">Active</option>
              <option value="archived">Archived / Inactive</option>
            </select>
          </div>
        </div>

        {/* Automatic Hours Equal Distribution Card */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/90 via-blue-50/50 to-white border border-indigo-100 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-indigo-600" />
              <Typography variant="small" className="font-bold text-indigo-900 text-xs uppercase tracking-wide">
                Total Weekly Hours & Equal Distribution Tool
              </Typography>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-blue-gray-700">
                <input
                  type="checkbox"
                  checked={autoDistributeOnChange}
                  onChange={(e) => setAutoDistributeOnChange(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                />
                Auto-distribute when values change
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Total Weekly Hours
              </Typography>
              <div className="relative">
                <Input
                  type="number"
                  step="0.25"
                  min="1"
                  max="168"
                  value={targetWeeklyHours}
                  onChange={(e) => handleTargetHoursChange(e.target.value)}
                  placeholder="e.g. 40.00"
                  className="pr-10"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-blue-gray-400">hrs</span>
              </div>
            </div>

            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Base Shift Start
              </Typography>
              <input
                type="time"
                value={defaultStartTime}
                onChange={(e) => handleDefaultStartTimeChange(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
                Break Duration (Mins)
              </Typography>
              <div className="relative">
                <Input
                  type="number"
                  step="5"
                  min="0"
                  max="240"
                  value={defaultBreakMinutes}
                  onChange={(e) => handleDefaultBreakChange(e.target.value)}
                  placeholder="e.g. 60"
                  className="pr-12"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-blue-gray-400">mins</span>
              </div>
            </div>

            <div>
              <Button
                type="button"
                color="indigo"
                variant="gradient"
                size="md"
                onClick={handleApplyDistribution}
                className="w-full flex items-center justify-center gap-2 text-xs py-2.5 shadow-indigo-500/20"
              >
                <ArrowPathIcon className="h-4 w-4" /> Distribute Equally
              </Button>
            </div>
          </div>

          {/* Real-time Calculation Summary pill */}
          <div className="mt-3 pt-3 border-t border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-indigo-900 font-medium">
              <CalendarDaysIcon className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>
                <strong>{runningDaysCount} Running Days</strong> active &bull; Target:{' '}
                <strong>{dailyTargetHoursVal} hrs/day</strong> per shift
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-gray-600">Calculated Total:</span>
              <span className="font-mono font-extrabold text-indigo-800 bg-white px-2.5 py-1 rounded-md border border-indigo-200 text-xs">
                {totalWeeklyHours} hrs / week
              </span>
            </div>
          </div>
        </div>

        {/* Day-of-Week x Time-Range Shift Matrix */}
        <div className="mt-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <Typography variant="small" color="blue-gray" className="font-bold text-xs uppercase tracking-wide">
                Running Days Shift Matrix
              </Typography>
              <Typography variant="small" className="text-[11px] text-blue-gray-500">
                Toggle the running days below. Shift hours are distributed across checked days.
              </Typography>
            </div>
            {touched && errors.days && (
              <p className="text-xs text-red-500 font-semibold">{errors.days}</p>
            )}
          </div>

          <div className="border border-blue-gray-100 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-blue-gray-50 border-b border-blue-gray-100 text-blue-gray-700 uppercase font-semibold">
                <tr>
                  <th className="p-3">Running Day</th>
                  <th className="p-3">Shift Start</th>
                  <th className="p-3">Shift End</th>
                  <th className="p-3">Break (Mins)</th>
                  <th className="p-3 text-right">Net Daily Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-gray-50">
                {dayConfigs.map((d) => {
                  const dayHours = calculateDayHours(d);
                  const dayError = touched && errors.dayDetails?.[d.day_of_week];
                  return (
                    <tr key={d.day_of_week} className={`${d.enabled ? 'bg-white' : 'bg-blue-gray-50/40 opacity-60'} ${dayError ? 'bg-red-50/40' : ''}`}>
                      <td className="p-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={d.enabled}
                            onChange={() => handleDayToggle(d.day_of_week)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <span className={`font-semibold ${d.enabled ? 'text-blue-gray-900' : 'text-blue-gray-400'}`}>
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

                      <td className="p-3 text-right font-mono font-bold text-blue-gray-800">
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

