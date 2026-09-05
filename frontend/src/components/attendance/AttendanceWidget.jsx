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
  InformationCircleIcon
} from '@heroicons/react/24/solid';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

/**
 * Attendance Punch Clock Widget.
 * 
 * @param {object} props - Component props
 * @param {Function} [props.onPunchChange] - Callback invoked when check-in or check-out completes
 * @returns {JSX.Element} Material Tailwind Punch Clock Card
 */
export default function AttendanceWidget({ onPunchChange }) {
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
    <Card className="border border-blue-gray-100 shadow-sm overflow-hidden">
      <CardHeader
        variant="gradient"
        color={isCheckedIn ? 'green' : 'indigo'}
        className="p-4 flex items-center justify-between shadow-none rounded-none m-0"
      >
        <div className="flex items-center gap-3 text-white">
          <ClockIcon className="h-6 w-6" />
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

      <CardBody className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {alertInfo.message && (
          <div className="w-full md:hidden">
            <Alert
              color={alertInfo.type === 'green' ? 'green' : 'red'}
              variant="gradient"
              className="text-xs py-2 px-3"
            >
              {alertInfo.message}
            </Alert>
          </div>
        )}

        {/* Current status display */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-blue-gray-500 uppercase tracking-wide">
              Workforce Status
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`h-3 w-3 rounded-full ${isCheckedIn ? 'bg-green-500 animate-pulse' : 'bg-blue-gray-300'}`} />
              <Typography variant="h6" color="blue-gray" className="font-bold text-base">
                {loading ? 'Checking status...' : isCheckedIn ? 'Currently Working' : 'Checked Out'}
              </Typography>
            </div>
            {isCheckedIn && activeSession?.check_in && (
              <span className="text-xs text-blue-gray-400 mt-0.5">
                Session started at: {new Date(activeSession.check_in).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          {isCheckedIn ? (
            <Button
              variant="gradient"
              color="amber"
              onClick={handleCheckOut}
              disabled={actionLoading}
              className="flex items-center gap-2 py-2.5 px-5 shadow-amber-500/20"
            >
              {actionLoading ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
              )}
              Check Out
            </Button>
          ) : (
            <Button
              variant="gradient"
              color="green"
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="flex items-center gap-2 py-2.5 px-5 shadow-green-500/20"
            >
              {actionLoading ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <ArrowLeftOnRectangleIcon className="h-4 w-4" />
              )}
              Check In
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
