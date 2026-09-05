/**
 * Authentication & RBAC Context Provider
 * 
 * RESPONSIBILITY:
 * Manages client-side authentication tokens, user profile metadata, and provides the
 * `hasPermission(permissionCode)` helper for UI button visibility and navigation gating.
 * 
 * NOT RESPONSIBLE FOR:
 * Authoritative security enforcement. Real security and data protection MUST always
 * be validated server-side by backend `rbac.js` against the `role_permissions` database table.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

/**
 * AuthProvider component that wraps the application tree.
 * 
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Child elements
 * @returns {JSX.Element} AuthContext.Provider tree
 * @sideEffects Reads/writes 'token' and 'user' in localStorage
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize cached session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Failed to parse cached user object:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      }
    }
    setLoading(false);
  }, [token]);

  /**
   * Logs in a user via backend /api/v1/auth/login.
   * 
   * @param {string} email - User email address
   * @param {string} password - User password
   * @returns {Promise<object>} Authenticated user payload
   */
  const login = async (email, password) => {
    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      const { token: receivedToken, user: receivedUser } = response.data;

      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    } catch (err) {
      throw err;
    }
  };

  /**
   * Clears user credentials and logs out.
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  const changePassword = async (currentPassword, newPassword) => {
    await axiosClient.put('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
    const updatedUser = { ...user, must_change_password: false };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  /**
   * Helper to check if the current user possesses a given permission.
   * 
   * CRITICAL SECURITY NOTE (Rule #5):
   * This function is strictly for UX enhancement (showing, hiding, or disabling UI action buttons).
   * It does NOT provide security on its own. All actual authorization checks are enforced
   * server-side on every API request via the backend `rbac` middleware querying `role_permissions`.
   * 
   * @param {string} permissionCode - Code string from schema permissions (e.g. 'employee.manage')
   * @returns {boolean} True if permission is possessed or user is Admin
   */
  const hasPermission = (permissionCode) => {
    if (!user) return false;
    if (user.role === 'Admin' || (user.permissions && user.permissions.includes('system.admin'))) {
      return true;
    }
    return Array.isArray(user.permissions) && user.permissions.includes(permissionCode);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    changePassword,
    logout,
    hasPermission
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to access authentication state and helpers.
 * 
 * @returns {object} AuthContext state
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
