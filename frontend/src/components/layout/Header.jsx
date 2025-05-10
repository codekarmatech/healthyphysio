import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ title }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();

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
    <header className="bg-white shadow-sm z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            type="button"
            className="md:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={toggleMobileMenu}
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
        <div className="ml-4 flex items-center md:ml-6">
          <button
            type="button"
            className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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

          {/* Profile dropdown */}
          <div className="ml-3 relative">
            <div>
              <button
                type="button"
                className="max-w-xs flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                id="user-menu-button"
                aria-expanded="false"
                aria-haspopup="true"
                onClick={toggleProfileMenu}
              >
                <span className="sr-only">Open user menu</span>
                {/* Therapist icon with distinct background */}
                <div 
                  style={{
                    height: '2rem',
                    width: '2rem',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    backgroundColor: currentUser?.role === 'therapist' ? '#10b981' : '#bae6fd',
                    color: currentUser?.role === 'therapist' ? 'white' : '#0284c7'
                  }}
                >
                  {currentUser?.firstName?.charAt(0) || 'U'}
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
                {/* Therapist-specific dropdown options */}
                {currentUser?.role === 'therapist' && (
                  <>
                    <Link
                      to="/therapist/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      tabIndex="-1"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      View Therapist Profile
                    </Link>
                    <Link
                      to="/therapist/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      tabIndex="-1"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Therapist Settings
                    </Link>
                  </>
                )}
                {/* Common options for all users */}
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  tabIndex="-1"
                  id="user-menu-item-2"
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
            <Link
              to="/dashboard"
              className="bg-primary-50 text-primary-600 block pl-3 pr-4 py-2 border-l-4 border-primary-500 text-base font-medium sm:pl-5 sm:pr-6"
            >
              Dashboard
            </Link>
            <Link
              to="/patients"
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium sm:pl-5 sm:pr-6"
            >
              Patients
            </Link>
            <Link
              to="/appointments"
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium sm:pl-5 sm:pr-6"
            >
              Appointments
            </Link>
            <Link
              to="/reports"
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium sm:pl-5 sm:pr-6"
            >
              Reports
            </Link>
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
                    backgroundColor: currentUser?.role === 'therapist' ? '#10b981' : '#bae6fd',
                    color: currentUser?.role === 'therapist' ? 'white' : '#0284c7'
                  }}
                >
                  {currentUser?.firstName?.charAt(0) || 'U'}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">
                  {currentUser?.firstName} {currentUser?.lastName}
                </div>
                <div className="text-sm font-medium text-gray-500">{currentUser?.email}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {/* Add therapist profile link in mobile menu too */}
              {currentUser?.role === 'therapist' && (
                <Link
                  to="/therapist/profile"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 sm:px-6"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Therapist Profile
                </Link>
              )}
              <Link
                to="/profile"
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