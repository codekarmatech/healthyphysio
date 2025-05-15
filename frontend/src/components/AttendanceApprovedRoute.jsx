/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AttendanceApprovedRoute = () => {
  const { user, therapistProfile, loading, fetchTherapistProfile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh therapist profile when component mounts
  useEffect(() => {
    const refreshProfile = async () => {
      if (user && user.role === 'therapist' && !loading) {
        console.log('AttendanceApprovedRoute: Refreshing therapist profile');
        setIsRefreshing(true);
        try {
          await fetchTherapistProfile(user.id);
        } catch (error) {
          console.error('Error refreshing therapist profile:', error);
        } finally {
          setIsRefreshing(false);
        }
      }
    };

    refreshProfile();
  }, [user, loading, fetchTherapistProfile]);

  if (loading || isRefreshing) {
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

  // Check if therapist account is approved
  if (!therapistProfile || !therapistProfile.account_approved) {
    console.log('Therapist account not approved, redirecting to pending approval page');
    return <Navigate to="/therapist/pending-approval" replace />;
  }

  // Check if therapist is approved for attendance
  // Use both attendance_approved and is_approved as fallbacks
  const isAttendanceApproved =
    therapistProfile.attendance_approved === true ||
    (therapistProfile.attendance_approved === undefined && therapistProfile.is_approved === true);

  console.log('Attendance approval status:', {
    attendance_approved: therapistProfile.attendance_approved,
    is_approved: therapistProfile.is_approved,
    isAttendanceApproved
  });

  if (!isAttendanceApproved) {
    console.log('Therapist not approved for attendance, redirecting to feature not approved page');
    return <Navigate to="/therapist/feature-not-approved/attendance" replace />;
  }

  return <Outlet />;
};

export default AttendanceApprovedRoute;
