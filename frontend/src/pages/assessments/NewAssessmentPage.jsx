import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import AssessmentForm from '../../components/assessments/AssessmentForm';
import AssessmentTemplateSelector from '../../components/assessments/AssessmentTemplateSelector';

const NewAssessmentPage = () => {
  const { user, logout } = useAuth();
  const { templateId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const patientId = queryParams.get('patientId');
  const appointmentId = queryParams.get('appointmentId');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    try {
      // Use the logout function from AuthContext
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showProfileMenu) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-primary-600">PhysioWay</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/therapist/dashboard"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/therapist/appointments"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Appointments
                </Link>
                <Link
                  to="/therapist/patients"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Patients
                </Link>
                <Link
                  to="/therapist/earnings"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Earnings
                </Link>
                <Link
                  to="/therapist/assessments"
                  className="border-primary-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Assessments
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
                <div className="ml-3 relative">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 mr-2">{user?.first_name} {user?.last_name}</span>
                    <div className="relative">
                      <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <span className="sr-only">Open user menu</span>
                        <div className="h-8 w-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-600 font-semibold">
                          {user?.first_name ? user.first_name[0].toUpperCase() : ''}
                        </div>
                      </button>

                      {/* Dropdown menu */}
                      {showProfileMenu && (
                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                          <Link to="/therapist/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            View Therapist Profile
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-gray-900">
                  New Assessment
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Create a new patient assessment
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <Link
                  to="/assessments"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back to Assessments
                </Link>
              </div>
            </div>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              {templateId ? (
                <AssessmentForm
                  templateId={templateId}
                  patientId={patientId}
                  appointmentId={appointmentId}
                />
              ) : (
                <AssessmentTemplateSelector
                  patientId={patientId}
                  appointmentId={appointmentId}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NewAssessmentPage;