/**
 * Protected Route Gatekeeper Component
 * 
 * RESPONSIBILITY:
 * Intercepts unauthenticated navigation attempts, redirecting to /login,
 * and verifies that the current user has required permission codes if specified.
 * 
 * NOT RESPONSIBLE FOR:
 * Backend authorization enforcement (enforced by backend rbac.js middleware).
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '@material-tailwind/react';

/**
 * Route protection wrapper.
 * 
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Protected child view
 * @param {string} [props.requiredPermission] - Optional permission code needed to view route
 * @returns {JSX.Element} Rendered children or redirect to /login
 */
export default function ProtectedRoute({ children, requiredPermission }) {
  const { isAuthenticated, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-blue-gray-50">
        <Spinner className="h-10 w-10 text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-2xl font-bold text-blue-gray-800">Access Denied</h2>
        <p className="mt-2 text-sm text-blue-gray-500">
          You do not have permission ({requiredPermission}) to view this resource.
        </p>
      </div>
    );
  }

  return children;
}
