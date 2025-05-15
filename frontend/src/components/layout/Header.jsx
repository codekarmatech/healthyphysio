import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { navigationConfig } from '../../config/navigationConfig';
import { usePermissions } from '../../hooks/usePermissions';

/**
 * Header component
 *
 * This component provides a consistent header across all pages,
 * with dynamic navigation based on user role.
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Page title to display
 * @param {string} props.userName - User's name to display in profile menu
 */
const Header = ({ title, userName }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { hasRole } = usePermissions();
  const location = useLocation();

  // Determine user role and get appropriate navigation items
  const userRole = user?.role || 'therapist';
  const navItems = navigationConfig[userRole] || [];

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect will be handled by the AuthContext
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <header className="bg-white shadow z-10">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <button
            type="button"
            className="md:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={toggleMobileMenu}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <span className="sr-only">Open sidebar</span>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`${
                  isActive
                    ? 'text-primary-600 border-b-2 border-primary-500'
                    : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent'
                } px-4 py-3 text-sm font-medium transition-colors duration-200`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="ml-4 flex items-center md:ml-6">
          {/* Notifications button */}
          <button
            type="button"
            className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            aria-label="View notifications"
          >
            <span className="sr-only">View notifications</span>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>

          {/* Admin-specific quick actions */}
          {hasRole('admin') && (
            <button
              type="button"
              className="ml-3 bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              aria-label="Admin actions"
            >
              <span className="sr-only">Admin actions</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          )}

          {/* Therapist-specific quick actions */}
          {hasRole('therapist') && (
            <Link
              to="/therapist/attendance"
              className="ml-3 bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              aria-label="Mark attendance"
            >
              <span className="sr-only">Mark attendance</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </Link>
          )}

          {/* Doctor-specific quick actions */}
          {hasRole('doctor') && (
            <Link
              to="/doctor/referrals/new"
              className="ml-3 bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              aria-label="New referral"
            >
              <span className="sr-only">New referral</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </Link>
          )}

          {/* Patient-specific quick actions */}
          {hasRole('patient') && (
            <Link
              to="/patient/appointments/new"
              className="ml-3 bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              aria-label="Book appointment"
            >
              <span className="sr-only">Book appointment</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </Link>
          )}

          {/* Profile dropdown */}
          <div className="ml-3 relative">
            <div>
              <button
                type="button"
                className="max-w-xs flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                id="user-menu-button"
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="true"
                onClick={toggleProfileMenu}
              >
                <span className="sr-only">Open user menu</span>
                {/* User avatar with role-based styling */}
                <div
                  style={{
                    height: '2rem',
                    width: '2rem',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    backgroundColor: hasRole('therapist') ? '#10b981' :
                                    hasRole('admin') ? '#ef4444' :
                                    hasRole('doctor') ? '#8b5cf6' : '#bae6fd',
                    color: hasRole('therapist') || hasRole('admin') || hasRole('doctor') ? 'white' : '#0284c7'
                  }}
                >
                  {userName || user?.firstName?.charAt(0) || 'U'}
                </div>
              </button>
            </div>
            {isProfileMenuOpen && (
              <div
                className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button"
                tabIndex="-1"
              >
                {/* Profile link based on role */}
                <Link
                  to={`/${hasRole('therapist') ? 'therapist/profile' : 'profile'}`}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  tabIndex="-1"
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  Your Profile
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  tabIndex="-1"
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  Settings
                </Link>
                {/* Common options for all users */}
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  tabIndex="-1"
                  onClick={handleLogout}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`${
                    isActive
                      ? 'bg-primary-50 text-primary-600 border-primary-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium sm:pl-5 sm:pr-6`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4 sm:px-6">
              <div className="flex-shrink-0">
                <div
                  style={{
                    height: '2.5rem',
                    width: '2.5rem',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    backgroundColor: hasRole('therapist') ? '#10b981' :
                                    hasRole('admin') ? '#ef4444' :
                                    hasRole('doctor') ? '#8b5cf6' : '#bae6fd',
                    color: hasRole('therapist') || hasRole('admin') || hasRole('doctor') ? 'white' : '#0284c7'
                  }}
                >
                  {userName || user?.firstName?.charAt(0) || 'U'}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">
                  {userName || `${user?.firstName || ''} ${user?.lastName || ''}`}
                </div>
                <div className="text-sm font-medium text-gray-500 capitalize">{userRole}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {/* Profile link based on role */}
              <Link
                to={`/${hasRole('therapist') ? 'therapist/profile' : 'profile'}`}
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 sm:px-6"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Your Profile
              </Link>
              <Link
                to="/settings"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 sm:px-6"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Settings
              </Link>
              <button
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 sm:px-6"
                onClick={handleLogout}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;