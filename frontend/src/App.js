import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';
import PatientDashboard from './pages/dashboard/PatientDashboard';
import TherapistDashboard from './pages/dashboard/TherapistDashboard';
import DoctorDashboard from './pages/dashboard/DoctorDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';

// Earnings Pages
import EarningsPage from './pages/earnings/EarningsPage';

// Appointment Pages
import AppointmentsPage from './pages/appointments/AppointmentsPage';
import AppointmentDetailPage from './pages/appointments/AppointmentDetailPage';
import TodayAppointmentsPage from './pages/appointments/TodayAppointmentsPage';
import NewAppointmentPage from './pages/appointments/NewAppointmentPage';
import EditAppointmentPage from './pages/appointments/EditAppointmentPage';
import RescheduleRequestPage from './pages/appointments/RescheduleRequestPage';
import PatientRescheduleRequestPage from './pages/appointments/PatientRescheduleRequestPage';

// Patient Pages
import PatientsPage from './pages/patients/PatientsPage';
import PatientDetailPage from './pages/patients/PatientDetailPage';
import TherapistPatientsPage from './pages/patients/TherapistPatientsPage';
import TherapistPatientDetailPage from './pages/patients/TherapistPatientDetailPage';

// Assessment Pages
import AssessmentsPage from './pages/assessments/AssessmentsPage';

// Other Pages
import Landing from './pages/Landing';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* Protected Routes - Common for all roles */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Common Appointment Routes - These will redirect to role-specific routes */}
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/appointments/today" element={<TodayAppointmentsPage />} />
            <Route path="/appointments/:id" element={<AppointmentDetailPage />} />
            <Route path="/appointments/:id/reschedule-request" element={<PatientRescheduleRequestPage />} />
            
            {/* Assessment Routes */}
            <Route path="/assessments" element={<AssessmentsPage />} />
          </Route>
          
          {/* Admin-only Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/appointments/new" element={<NewAppointmentPage />} />
            <Route path="/appointments/:id/edit" element={<EditAppointmentPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/:id" element={<PatientDetailPage />} />
          </Route>
          
          {/* Therapist Routes */}
          <Route element={<ProtectedRoute allowedRoles={['therapist']} />}>
            <Route path="/therapist/dashboard" element={<TherapistDashboard />} />
            <Route path="/therapist/appointments" element={<AppointmentsPage />} />
            <Route path="/therapist/appointments/today" element={<TodayAppointmentsPage />} />
            <Route path="/therapist/appointments/:id" element={<AppointmentDetailPage />} />
            <Route path="/therapist/appointments/:id/reschedule" element={<RescheduleRequestPage />} />
            <Route path="/therapist/patients" element={<TherapistPatientsPage />} />
            <Route path="/therapist/patients/:id" element={<TherapistPatientDetailPage />} />
            <Route path="/therapist/earnings" element={<EarningsPage />} />
            <Route path="/therapist/assessments" element={<AssessmentsPage />} />
            <Route path="/therapist/referrals" element={<NotFound />} />
          </Route>
          
          {/* Patient Routes */}
          <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
            <Route path="/patient/*" element={<PatientDashboard />} />
          </Route>
          
          {/* Doctor Routes */}
          <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
            <Route path="/doctor/*" element={<DoctorDashboard />} />
          </Route>
          
          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Route>
          
          {/* Error Pages */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
