/**
 * Login Page Component
 * 
 * THEME ORIGIN:
 * Adapted from Material Tailwind Dashboard React's `src/pages/auth/sign-in.jsx`.
 * 
 * CHANGES & REMOVALS:
 * Stripped third-party OAuth social login buttons and demo text. Connected directly
 * to PeoplePay360 /api/v1/auth/login via AuthContext, added quick demo role auto-fill buttons
 * for rapid evaluator/judge testing across roles (Admin, HR Manager, HR Payroll Manager, Employee).
 * 
 * RESPONSIBILITY:
 * Handles user credentials submission, error feedback, and session authentication.
 * 
 * NOT RESPONSIBLE FOR:
 * Post-login dashboard layouts or backend token signing.
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Button,
  Typography,
  Alert
} from '@material-tailwind/react';
import { LockClosedIcon, EnvelopeIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';

/**
 * Sign In page for PeoplePay360.
 * 
 * @returns {JSX.Element} Login interface
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const redirectPath = location.state?.from?.pathname || '/dashboard';

  /**
   * Submits user credentials to backend /api/v1/auth/login.
   * 
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Invalid email or password. Please try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Helper to quickly populate credentials during hackathon judge demos.
   */
  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-blue-gray-50/50 p-4">
      {/* Background Graphic Banner */}
      <div className="absolute inset-0 h-1/2 bg-gradient-to-r from-blue-gray-900 to-indigo-900 shadow-xl" />

      <Card className="relative z-10 w-full max-w-[24rem] shadow-2xl border border-blue-gray-100">
        <CardHeader
          variant="gradient"
          color="indigo"
          className="mb-4 grid h-28 place-items-center text-center shadow-indigo-500/40"
        >
          <div>
            <Typography variant="h3" color="white" className="font-bold tracking-tight">
              PeoplePay360
            </Typography>
            <Typography variant="small" color="white" className="opacity-80 text-xs mt-1">
              HR & Enterprise Payroll Suite
            </Typography>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardBody className="flex flex-col gap-4">
            {errorMessage && (
              <Alert
                color="red"
                variant="gradient"
                icon={<InformationCircleIcon className="h-5 w-5" />}
                className="text-xs py-2 px-3"
              >
                {errorMessage}
              </Alert>
            )}

            <div className="space-y-1">
              <Typography variant="small" color="blue-gray" className="font-medium text-xs">
                Email Address
              </Typography>
              <Input
                type="email"
                size="lg"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<EnvelopeIcon className="h-5 w-5 text-blue-gray-400" />}
                required
              />
            </div>

            <div className="space-y-1">
              <Typography variant="small" color="blue-gray" className="font-medium text-xs">
                Password
              </Typography>
              <Input
                type="password"
                size="lg"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<LockClosedIcon className="h-5 w-5 text-blue-gray-400" />}
                required
              />
            </div>
          </CardBody>

          <CardFooter className="pt-0 flex flex-col gap-3">
            <Button
              variant="gradient"
              color="indigo"
              fullWidth
              type="submit"
              disabled={loading || !email || !password}
              className="py-3"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            {/* Quick Demo Credentials Assistant */}
            <div className="mt-2 rounded-lg bg-blue-gray-50 p-3 border border-blue-gray-100">
              <Typography variant="small" color="blue-gray" className="font-semibold text-xs mb-1.5">
                ⚡ Quick Demo Credentials:
              </Typography>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@peoplepay360.com', 'Admin@123')}
                  className="text-left font-medium text-indigo-600 hover:underline"
                >
                  • Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('hrmanager@peoplepay360.com', 'HR@123')}
                  className="text-left font-medium text-indigo-600 hover:underline"
                >
                  • HR Manager
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('payrollmgr@peoplepay360.com', 'Payroll@123')}
                  className="text-left font-medium text-indigo-600 hover:underline"
                >
                  • Payroll Manager
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('employee@peoplepay360.com', 'Emp@123')}
                  className="text-left font-medium text-indigo-600 hover:underline"
                >
                  • Employee
                </button>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
