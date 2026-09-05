import React, { useState, useEffect, useCallback } from 'react';
import {
  Input,
  Button,
  Alert,
  Typography,
  Chip,
  Tooltip
} from '@material-tailwind/react';
import {
  InformationCircleIcon,
  ClockIcon,
  SparklesIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Modal from '../common/Modal';
import axiosClient from '../../api/axiosClient';

const DAYS_OF_WEEK = [
  { key: 'mon', label: 'Monday', short: 'Mon' },
  { key: 'tue', label: 'Tuesday', short: 'Tue' },
  { key: 'wed', label: 'Wednesday', short: 'Wed' },
  { key: 'thu', label: 'Thursday', short: 'Thu' },
  { key: 'fri', label: 'Friday', short: 'Fri' },
  { key: 'sat', label: 'Saturday', short: 'Sat' },
  { key: 'sun', label: 'Sunday', short: 'Sun' }
];

const PRESETS = [
  {
    name: '40h Standard (5 Days)',
    hours: 40,
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    start: '09:00',
    breakMins: 60,
    type: 'full_time'
  },
  {
    name: '45h Extended (5 Days)',
    hours: 45,
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    start: '09:00',
    breakMins: 60,
    type: 'full_time'
  },
  {
    name: '48h 6-Day Week',
    hours: 48,
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
    start: '09:00',
    breakMins: 60,
    type: 'full_time'
  },
  {
    name: '35h Standard (5 Days)',
    hours: 35,
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    start: '09:00',
    breakMins: 60,
    type: 'full_time'
  },
  {
    name: '20h Part-Time (5 Days)',
    hours: 20,
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    start: '09:00',
    breakMins: 0,
    type: 'part_time'
  }
];

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

  // Distribution parameters for real-time reactivity
  const [targetWeeklyHours, setTargetWeeklyHours] = useState('40.00');
  const [defaultStartTime, setDefaultStartTime] = useState('09:00');
  const [defaultBreakMinutes, setDefaultBreakMinutes] = useState(60);
  const [autoDistributeOnChange, setAutoDistributeOnChange] = useState(true);

  // Matrix state: array of 7 day configurations
  const [dayConfigs, setDayConfigs] = useState(
    DAYS_OF_WEEK.map((d) => ({
      day_of_week: d.key,
      label: d.label,
      short: d.short,
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
   * across all active/enabled running days in real-time.
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

  // Preset applicator for instant 1-click loading
  const handleApplyPreset = (preset) => {
    if (!name || name.trim() === '') {
      setName(preset.name);
    }
    setScheduleType(preset.type);
    setTargetWeeklyHours(preset.hours.toFixed(2));
    setDefaultStartTime(preset.start);
    setDefaultBreakMinutes(preset.breakMins);

    const updatedConfigs = DAYS_OF_WEEK.map((d) => ({
      day_of_week: d.key,
      label: d.label,
      short: d.short,
      enabled: preset.days.includes(d.key),
      start_time: preset.start,
      end_time: '18:00',
      break_minutes: preset.breakMins
    }));

    const distributed = computeDistributedDays(preset.hours, preset.start, preset.breakMins, updatedConfigs);
    setDayConfigs(distributed);
  };

  // Copy Monday's timings to all other active days
  const handleCopyMondayToAll = () => {
    const monday = dayConfigs.find((d) => d.day_of_week === 'mon');
    if (!monday) return;
    setDayConfigs((prev) =>
      prev.map((d) => (d.enabled ? { ...d, start_time: monday.start_time, end_time: monday.end_time, break_minutes: monday.break_minutes } : d))
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
              short: d.short,
              enabled: true,
              start_time: matchedLine.start_time?.slice(0, 5) || '09:00',
              end_time: matchedLine.end_time?.slice(0, 5) || '18:00',
              break_minutes: Number(matchedLine.break_minutes) || 0
            };
          }
          return {
            day_of_week: d.key,
            label: d.label,
            short: d.short,
            enabled: false,
            start_time: '09:00',
            end_time: '18:00',
            break_minutes: 60
          };
        });
        setDayConfigs(loadedConfigs);

        const initialTotal = loadedConfigs
          .reduce((acc, curr) => acc + calculateDayHours(curr), 0)
          .toFixed(2);
        setTargetWeeklyHours(schedule.total_weekly_hours ? Number(schedule.total_weekly_hours).toFixed(2) : initialTotal);

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
        short: d.short,
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

  const dailyTargetHoursVal = runningDaysCount > 0 && parseFloat(targetWeeklyHours) > 0
    ? (parseFloat(targetWeeklyHours) / runningDaysCount).toFixed(2)
    : '0.00';

  // Calculate timeline percentage for visual 24h bar
  const getTimelineStyle = (cfg) => {
    if (!cfg.enabled || !cfg.start_time || !cfg.end_time) return null;
    const [sh, sm] = cfg.start_time.split(':').map(Number);
    const [eh, em] = cfg.end_time.split(':').map(Number);
    const startM = sh * 60 + sm;
    const endM = eh * 60 + em;
    if (endM <= startM) return null;

    const leftPercent = Math.max(0, (startM / 1440) * 100);
    const widthPercent = Math.min(100 - leftPercent, ((endM - startM) / 1440) * 100);
    return { left: `${leftPercent.toFixed(1)}%`, width: `${widthPercent.toFixed(1)}%` };
  };

  const isOvertime = parseFloat(totalWeeklyHours) > 48;

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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto px-1">
        {errorMessage && (
          <Alert color="red" variant="gradient" icon={<InformationCircleIcon className="h-5 w-5" />}>
            {errorMessage}
          </Alert>
        )}

        {/* Quick 1-Click Schedule Presets */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Typography variant="small" className="text-[11px] font-bold uppercase tracking-wider text-blue-gray-500">
              Quick Presets (1-Click Real-Time Auto Fill)
            </Typography>
            <span className="text-[11px] text-indigo-600 font-medium">Click to load template</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50/80 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/60 transition-all hover:shadow-sm"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Name, Type, Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
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

        {/* Real-time Dynamic Hours Equal Distribution Panel */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/90 via-blue-50/40 to-white border border-indigo-100 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-indigo-600" />
              <Typography variant="small" className="font-bold text-indigo-900 text-xs uppercase tracking-wide">
                Real-Time Equal Hours Distributor
              </Typography>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-blue-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={autoDistributeOnChange}
                  onChange={(e) => setAutoDistributeOnChange(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                />
                Live Auto-Sync
              </label>
            </div>
          </div>

          {/* Sliders & Inputs for Instant Manipulation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div>
              <div className="flex justify-between items-center mb-1">
                <Typography variant="small" color="blue-gray" className="font-semibold text-xs">
                  Target Weekly Hours
                </Typography>
                <span className="text-xs font-bold text-indigo-700">{targetWeeklyHours}h</span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  step="0.5"
                  min="1"
                  max="168"
                  value={targetWeeklyHours}
                  onChange={(e) => handleTargetHoursChange(e.target.value)}
                  placeholder="e.g. 40.00"
                  className="pr-10"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-blue-gray-400">hrs</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="0.5"
                value={parseFloat(targetWeeklyHours) || 40}
                onChange={(e) => handleTargetHoursChange(e.target.value)}
                className="w-full h-1 mt-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
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
              <div className="flex justify-between items-center mb-1">
                <Typography variant="small" color="blue-gray" className="font-semibold text-xs">
                  Break Duration
                </Typography>
                <span className="text-xs font-bold text-indigo-700">{defaultBreakMinutes}m</span>
              </div>
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
              <input
                type="range"
                min="0"
                max="120"
                step="5"
                value={defaultBreakMinutes || 0}
                onChange={(e) => handleDefaultBreakChange(e.target.value)}
                className="w-full h-1 mt-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="flex flex-col gap-1.5">
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

          {/* Real-time Calculation Summary & Overtime Warning */}
          <div className="mt-3 pt-3 border-t border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-indigo-900 font-medium">
              <CalendarDaysIcon className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>
                <strong>{runningDaysCount} Active Days</strong> &bull; Distributing{' '}
                <strong>{dailyTargetHoursVal} hrs/day</strong> per active shift
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isOvertime ? (
                <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold text-[11px]">
                  <ExclamationTriangleIcon className="h-3.5 w-3.5" /> Workload &gt; 48h
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold text-[11px]">
                  <CheckCircleIcon className="h-3.5 w-3.5" /> Compliant
                </span>
              )}
              <span className="text-blue-gray-600 font-medium">Live Total:</span>
              <span className="font-mono font-extrabold text-indigo-800 bg-white px-2.5 py-1 rounded-md border border-indigo-200 text-xs shadow-sm">
                {totalWeeklyHours} hrs / week
              </span>
            </div>
          </div>
        </div>

        {/* Day-of-Week x Time-Range Shift Matrix & Visual Timeline */}
        <div className="mt-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <Typography variant="small" color="blue-gray" className="font-bold text-xs uppercase tracking-wide">
                Running Days Shift Matrix & Real-Time Timeline
              </Typography>
              <Typography variant="small" className="text-[11px] text-blue-gray-500">
                Shift end times adjust in real-time. You can also edit any individual day directly.
              </Typography>
            </div>
            <Button
              type="button"
              variant="text"
              color="indigo"
              size="sm"
              onClick={handleCopyMondayToAll}
              className="flex items-center gap-1 text-[11px] normal-case py-1 px-2.5"
            >
              <DocumentDuplicateIcon className="h-3.5 w-3.5" /> Copy Mon to Active Days
            </Button>
          </div>

          <div className="border border-blue-gray-100 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-blue-gray-50 border-b border-blue-gray-100 text-blue-gray-700 uppercase font-semibold">
                <tr>
                  <th className="p-3">Running Day</th>
                  <th className="p-3">Shift Start</th>
                  <th className="p-3">Shift End</th>
                  <th className="p-3">Break (Mins)</th>
                  <th className="p-3 text-center">24h Shift Timeline</th>
                  <th className="p-3 text-right">Net Daily Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-gray-50">
                {dayConfigs.map((d) => {
                  const dayHours = calculateDayHours(d);
                  const dayError = touched && errors.dayDetails?.[d.day_of_week];
                  const timelineStyle = getTimelineStyle(d);
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
                          className={`w-16 px-2 py-1 rounded border text-xs focus:outline-none ${
                            dayError ? 'border-red-500' : 'border-blue-gray-200 focus:border-indigo-600'
                          }`}
                        />
                      </td>

                      {/* Visual Timeline Bar */}
                      <td className="p-2 w-48">
                        {d.enabled && timelineStyle ? (
                          <div className="relative h-4 w-full bg-blue-gray-100 rounded-full overflow-hidden">
                            <div
                              className="absolute top-0 bottom-0 bg-indigo-600 rounded-full transition-all duration-200"
                              style={timelineStyle}
                            />
                            {/* Visual markers at 6h, 12h, 18h */}
                            <div className="absolute top-0 bottom-0 left-[25%] w-[1px] bg-white/40" />
                            <div className="absolute top-0 bottom-0 left-[50%] w-[1px] bg-white/40" />
                            <div className="absolute top-0 bottom-0 left-[75%] w-[1px] bg-white/40" />
                          </div>
                        ) : (
                          <div className="h-4 w-full bg-blue-gray-50 rounded-full flex items-center justify-center">
                            <span className="text-[10px] text-blue-gray-400 font-medium">Off Day</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-blue-gray-800">
                        {d.enabled ? (
                          <span className="bg-indigo-50 text-indigo-900 px-2 py-0.5 rounded text-xs">
                            {dayHours}h
                          </span>
                        ) : (
                          <span className="text-blue-gray-300">-</span>
                        )}
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


