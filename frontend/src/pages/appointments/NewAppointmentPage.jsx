import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AppointmentForm from '../../components/appointments/AppointmentForm';

/**
 * NewAppointmentPage component
 *
 * This page displays a form for creating a new appointment.
 * It uses the standardized DashboardLayout for consistent UI across the application.
 */
const NewAppointmentPage = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Determine if we're in the admin section based on the URL path
  const isAdminPath = location.pathname.startsWith('/admin/');
  const isTherapistPath = location.pathname.startsWith('/therapist/');

  // Get the appropriate back link based on user role and current path
  const getBackLink = () => {
    if (isAdminPath || (user?.role === 'admin' && !isTherapistPath)) {
      return '/admin/appointments';
    } else if (isTherapistPath || user?.role === 'therapist') {
      return '/therapist/appointments';
    } else {
      return '/appointments';
    }
  };

  return (
    <DashboardLayout title="Schedule New Appointment">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedule New Appointment</h1>
            <p className="text-sm text-gray-500 mt-1">Create a new appointment for a patient</p>
          </div>
          <div>
            <Link
              to={getBackLink()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to Appointments
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <AppointmentForm />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewAppointmentPage;