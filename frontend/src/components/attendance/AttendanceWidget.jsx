/**
 * Self-Service Attendance Punch Clock Widget
 * 
 * RESPONSIBILITY:
 * Displays active punch session status, live session timer, and provides one-click
 * Check-In and Check-Out actions for the logged-in employee.
 * 
 * NOT RESPONSIBLE FOR:
 * Global historical reporting or manual HR timestamp corrections.
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  Chip,
  Alert,
  Spinner
} from '@material-tailwind/react';
import {
  ClockIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/solid';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

/**
 * Attendance Punch Clock Widget.
 * 
 * @param {object} props - Component props
 * @param {Function} [props.onPunchChange] - Callback invoked when check-in or check-out completes
 * @param {string} [props.className] - Additional wrapper classNames
 * @returns {JSX.Element} Material Tailwind Punch Clock Card
 */
export default function AttendanceWidget({ onPunchChange, className = '' }) {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ type: '', message: '' });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch current session on mount
  useEffect(() => {
    fetchCurrentStatus();
  }, []);

  const fetchCurrentStatus = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/attendance/current');
      if (res.data?.data) {
        setIsCheckedIn(res.data.data.isCheckedIn);
        setActiveSession(res.data.data.activeSession);
      }
    } catch (err) {
      console.warn('Current attendance endpoint unavailable, defaulting to ready state.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    setAlertInfo({ type: '', message: '' });
    try {
      const res = await axiosClient.post('/attendance/check-in');
      setIsCheckedIn(true);
      setActiveSession(res.data?.data || { check_in: new Date().toISOString() });
      setAlertInfo({ type: 'green', message: 'Check-in recorded successfully!' });
      if (onPunchChange) onPunchChange();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to record check-in.';
      setAlertInfo({ type: 'red', message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setAlertInfo({ type: '', message: '' });
    try {
      const res = await axiosClient.post('/attendance/check-out');
      setIsCheckedIn(false);
      setActiveSession(null);
      setAlertInfo({
        type: 'green',
        message: `Check-out recorded! Total hours: ${res.data?.data?.worked_hours || 0} hrs.`
      });
      if (onPunchChange) onPunchChange();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to record check-out.';
      setAlertInfo({ type: 'red', message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Card className={`border border-blue-gray-100 shadow-sm overflow-hidden h-full flex flex-col justify-between ${className}`}>
      {/* Header with gradient and real-time clock */}
      <CardHeader
        variant="gradient"
        color={isCheckedIn ? 'green' : 'indigo'}
        className="p-4 flex items-center justify-between shadow-none rounded-none m-0"
      >
        <div className="flex items-center gap-3 text-white">
          <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
            <ClockIcon className="h-6 w-6" />
          </div>
          <div>
            <Typography variant="h6" color="white" className="font-bold">
              Punch Clock & Timesheet
            </Typography>
            <Typography variant="small" color="white" className="opacity-80 text-xs">
              {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
            </Typography>
          </div>
        </div>

        <div className="text-right text-white">
          <span className="font-mono font-bold text-xl tracking-wider">
            {currentTime.toLocaleTimeString()}
          </span>
        </div>
      </CardHeader>

      {/* Body with status and action button */}
      <CardBody className="p-5 flex-1 flex flex-col justify-between gap-4">
        {alertInfo.message && (
          <Alert
            color={alertInfo.type === 'green' ? 'green' : 'red'}
            variant="gradient"
            className="text-xs py-2 px-3"
          >
            {alertInfo.message}
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
          {/* Status Indicator */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-blue-gray-500 uppercase tracking-wide">
              Current Punch Status
            </span>
            <div className="flex items-center gap-2.5">
              <span className={`h-3.5 w-3.5 rounded-full ${isCheckedIn ? 'bg-green-500 animate-pulse' : 'bg-blue-gray-300'}`} />
              <Typography variant="h5" color="blue-gray" className="font-bold text-lg">
                {loading ? 'Checking status...' : isCheckedIn ? 'Currently Clocked In' : 'Currently Clocked Out'}
              </Typography>
            </div>
            {isCheckedIn && activeSession?.check_in ? (
              <span className="text-xs text-blue-gray-500 flex items-center gap-1">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                Session active since {new Date(activeSession.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : (
              <span className="text-xs text-blue-gray-400">
                Ready to begin your work session. Click Check In below.
              </span>
            )}
          </div>

          {/* Action Button */}
          <div className="flex items-center">
            {isCheckedIn ? (
              <Button
                variant="gradient"
                color="amber"
                size="lg"
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="flex items-center gap-2 py-3 px-6 shadow-amber-500/20 text-sm font-bold"
              >
                {actionLoading ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                )}
                Check Out
              </Button>
            ) : (
              <Button
                variant="gradient"
                color="green"
                size="lg"
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="flex items-center gap-2 py-3 px-6 shadow-green-500/20 text-sm font-bold"
              >
                {actionLoading ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                )}
                Check In
              </Button>
            )}
          </div>
        </div>

        {/* Informational Footer Strip inside Card */}
        <div className="pt-3 border-t border-blue-gray-100 flex flex-wrap items-center justify-between text-xs text-blue-gray-500 gap-2">
          <span className="flex items-center gap-1.5 font-medium">
            <CalendarDaysIcon className="h-4 w-4 text-indigo-500" />
            Standard Shift: <strong className="text-blue-gray-700">09:00 AM – 06:00 PM (1h Break)</strong>
          </span>
          <span className="text-[11px] text-blue-gray-400">
            Auto-calculates worked & overtime hours
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
