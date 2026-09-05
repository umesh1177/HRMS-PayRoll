/**
 * Root Application Component
 * 
 * RESPONSIBILITY:
 * Mounts the ThemeProvider from Material Tailwind, the global AuthProvider,
 * and attaches the AppRoutes router.
 * 
 * NOT RESPONSIBLE FOR:
 * Specific route declarations or UI rendering details.
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@material-tailwind/react';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';

/**
 * Main App root.
 * 
 * @returns {JSX.Element} Application provider tree
 */
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
