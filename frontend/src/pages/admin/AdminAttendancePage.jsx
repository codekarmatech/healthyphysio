import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminAttendanceDashboard from '../../components/attendance/AdminAttendanceDashboard';
import DashboardLayout from '../../components/layout/DashboardLayout';

/**
 * Admin page for managing attendance
 */
const AdminAttendancePage = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout title="Attendance Management">
      <AdminAttendanceDashboard />
    </DashboardLayout>
  );
};

export default AdminAttendancePage;