/**
 * Top Application Navbar Component
 * 
 * THEME ORIGIN:
 * Adapted from Material Tailwind Dashboard React's `src/widgets/layout/dashboard-navbar.jsx`.
 * 
 * CHANGES & REMOVALS:
 * Replaced static mock notification items with dynamic breadcrumb generation and live
 * user profile/logout actions tied to AuthContext.
 * 
 * RESPONSIBILITY:
 * Renders the top navigation header containing breadcrumbs, user info, and logout action.
 * 
 * NOT RESPONSIBLE FOR:
 * Page level action bars or modal dialogues.
 */

import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Navbar as MTNavbar,
  Typography,
  Button,
  IconButton,
  Breadcrumbs,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Avatar
} from '@material-tailwind/react';
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon
} from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';

/**
 * Top Navigation Header.
 * 
 * @param {object} props - Component props
 * @param {Function} props.onToggleSidebar - Function to toggle mobile sidebar
 * @returns {JSX.Element} Navbar element
 */
export default function Navbar({ onToggleSidebar }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const pathSegments = pathname.split('/').filter(Boolean);
  const currentPage = pathSegments.length > 0
    ? pathSegments[pathSegments.length - 1].replace(/-/g, ' ')
    : 'Dashboard';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <MTNavbar
      color="white"
      className="rounded-xl transition-all sticky top-4 z-40 py-3 shadow-md shadow-blue-gray-500/5 px-4"
      fullWidth
    >
      <div className="flex flex-col-reverse justify-between gap-4 md:flex-row md:items-center">
        {/* Breadcrumb Navigation */}
        <div className="capitalize">
          <Breadcrumbs className="bg-transparent p-0 transition-all">
            <Link to="/dashboard">
              <Typography
                variant="small"
                color="blue-gray"
                className="font-normal opacity-50 transition-all hover:text-indigo-600 hover:opacity-100"
              >
                Dashboard
              </Typography>
            </Link>
            {pathSegments.map((segment, idx) => {
              const isLast = idx === pathSegments.length - 1;
              const routeTo = `/${pathSegments.slice(0, idx + 1).join('/')}`;
              if (segment === 'dashboard') return null;
              return (
                <Link key={routeTo} to={routeTo}>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className={`font-normal transition-all ${
                      isLast ? 'opacity-100 font-semibold text-indigo-700' : 'opacity-50 hover:text-indigo-600'
                    }`}
                  >
                    {segment.replace(/-/g, ' ')}
                  </Typography>
                </Link>
              );
            })}
          </Breadcrumbs>
          <Typography variant="h6" color="blue-gray" className="capitalize text-lg font-bold">
            {currentPage}
          </Typography>
        </div>

        {/* Action Controls & User Profile */}
        <div className="flex items-center gap-3">
          <IconButton
            variant="text"
            color="blue-gray"
            className="grid xl:hidden"
            onClick={onToggleSidebar}
          >
            <Bars3Icon strokeWidth={3} className="h-6 w-6 text-blue-gray-600" />
          </IconButton>

          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-blue-gray-800">
                  {user.first_name ? `${user.first_name} ${user.last_name}` : user.email}
                </span>
                <span className="text-xs font-medium text-indigo-600 uppercase">
                  {user.role}
                </span>
              </div>

              <Menu>
                <MenuHandler>
                  <Button variant="text" color="blue-gray" className="p-1 rounded-full">
                    <Avatar
                      variant="circular"
                      alt={user.email}
                      className="cursor-pointer border border-indigo-500/20"
                      src={user.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
                      size="sm"
                    />
                  </Button>
                </MenuHandler>
                <MenuList className="w-56 p-2 shadow-lg">
                  <div className="px-3 py-2 border-b border-blue-gray-100 mb-1">
                    <p className="text-xs font-medium text-blue-gray-400">Account</p>
                    <p className="text-sm font-bold text-blue-gray-800 truncate">{user.email}</p>
                  </div>
                  <MenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-600 hover:bg-red-50"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    <Typography variant="small" className="font-semibold">
                      Sign Out
                    </Typography>
                  </MenuItem>
                </MenuList>
              </Menu>
            </div>
          )}
        </div>
      </div>
    </MTNavbar>
  );
}
