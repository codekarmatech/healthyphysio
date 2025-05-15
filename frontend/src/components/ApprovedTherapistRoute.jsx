/* eslint-disable */
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ApprovedTherapistRoute = () => {
  const { user, therapistProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-3 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is a therapist
  if (user.role !== 'therapist') {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check if therapist is approved
  if (!therapistProfile || !therapistProfile.is_approved) {
    return <Navigate to="/therapist/pending-approval" replace />;
  }

  return <Outlet />;
};

export default ApprovedTherapistRoute;
