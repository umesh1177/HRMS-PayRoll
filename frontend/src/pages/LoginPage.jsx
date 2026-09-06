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
import { Alert } from '@material-tailwind/react';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  InformationCircleIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/solid';
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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="login-page min-h-screen w-full p-4 sm:p-6 lg:p-10">
      <div className="login-frame mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl shadow-[#25123b]/20 lg:min-h-[min(780px,calc(100vh-5rem))] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="login-visual relative overflow-hidden bg-[#18181b] px-7 py-8 text-white sm:px-12 sm:py-10 lg:px-16 lg:py-14">
          <div className="login-grid absolute inset-0 opacity-30" />
          <div className="login-accent absolute right-0 top-0 h-full w-1/2 opacity-60" />

          <div className="relative flex h-full flex-col">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-lg font-black text-[#18181b] shadow-lg shadow-black/20">
                360
              </div>
              <div>
                <p className="text-lg font-extrabold tracking-tight">PeoplePay360</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">People operations</p>
              </div>
            </div>

            <div className="relative mt-auto max-w-lg pb-8 pt-24 lg:pb-10">
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-zinc-400">One calm place for your people</p>
              <h1 className="max-w-md text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-6xl">
                Work, pay, and people in sync.
              </h1>
                <p className="mt-6 max-w-md text-sm leading-7 text-zinc-300 sm:text-base">
                A clear operating system for attendance, contracts, time off, and payroll that keeps every team moving with confidence.
              </p>

              <div className="mt-10 grid gap-3 text-sm font-semibold sm:grid-cols-2">
                {['Real-time workforce visibility', 'Payroll-ready records', 'Simple role-based access', 'Built for growing teams'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-zinc-200">
                    <CheckCircleIcon className="h-5 w-5 shrink-0 text-white" />
                    <span className="text-zinc-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="relative text-xs font-medium text-zinc-500">PeoplePay360 / Workforce command center</p>
          </div>
        </section>

        <section className="flex items-center bg-white px-7 py-10 sm:px-12 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-9">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Welcome back</p>
              <h2 className="text-3xl font-black tracking-[-0.03em] text-zinc-900 sm:text-4xl">Sign in to your workspace</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-500">Use your work account to continue to PeoplePay360.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <Alert
                  color="red"
                  variant="ghost"
                  icon={<InformationCircleIcon className="h-5 w-5" />}
                  className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700"
                >
                  {errorMessage}
                </Alert>
              )}

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-600">Email address</span>
                <div className="login-input-wrap">
                  <EnvelopeIcon className="h-5 w-5 text-zinc-400" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="login-input"
                  />
                </div>
              </label>

              <label className="block">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-600">Password</span>
                  <span className="text-xs font-semibold text-zinc-400">Keep it private</span>
                </div>
                <div className="login-input-wrap">
                  <LockClosedIcon className="h-5 w-5 text-zinc-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="login-input"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-zinc-400 transition hover:text-zinc-900" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="login-submit group flex w-full items-center justify-center gap-2 rounded-xl bg-[#18181b] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/20 transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Continue to workspace'}
                {!loading && <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </button>
            </form>

            <div className="mt-8 border-t border-zinc-200 pt-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Demo access</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Admin', 'admin@peoplepay360.com', 'Admin@123'],
                  ['HR Manager', 'hrmanager@peoplepay360.com', 'HR@123'],
                  ['HR Payroll User', 'hrpayroll@peoplepay360.com', 'HRPayroll@123'],
                  ['Payroll Manager', 'payrollmgr@peoplepay360.com', 'Payroll@123'],
                  ['Employee', 'employee@peoplepay360.com', 'Emp@123']
                ].map(([label, demoEmail, demoPass]) => (
                  <button key={label} type="button" onClick={() => handleQuickFill(demoEmail, demoPass)} className="rounded-lg border border-zinc-200 px-3 py-2 text-left text-xs font-semibold text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-900">
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-8 text-center text-xs text-zinc-400">Secure access for your organization</p>
          </div>
        </section>
      </div>
    </div>
  );
}
