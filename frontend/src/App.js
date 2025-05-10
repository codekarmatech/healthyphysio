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

// Equipment Pages
import { 
  EquipmentListPage, 
  EquipmentDetailPage, 
  EquipmentFormPage,
  AllocationRequestPage,
  AllocationRequestsPage,
  AllocationsPage,
  CategoryManagementPage
} from './pages/equipment';

// Patient Pages
import PatientsPage from './pages/patients/PatientsPage';
import PatientDetailPage from './pages/patients/PatientDetailPage';
import TherapistPatientsPage from './pages/patients/TherapistPatientsPage';
import TherapistPatientDetailPage from './pages/patients/TherapistPatientDetailPage';

// Assessment Pages
import AssessmentsPage from './pages/assessments/AssessmentsPage';
import NewAssessmentPage from './pages/assessments/NewAssessmentPage';
import AssessmentDetailPage from './pages/assessments/AssessmentDetailPage';
import EditAssessmentPage from './pages/assessments/EditAssessmentPage';
import PatientAssessmentPage from './pages/assessments/PatientAssessmentPage';

// Admin Pages
import AdminAttendancePage from './pages/admin/AdminAttendancePage';

// Therapist Pages
import TherapistAttendancePage from './pages/therapist/TherapistAttendancePage';
import TherapistProfilePage from './pages/therapist/TherapistProfilePage';

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
            <Route path="/assessments/new" element={<NewAssessmentPage />} />
            <Route path="/assessments/new/:templateId" element={<NewAssessmentPage />} />
            <Route path="/assessments/patient/:patientId" element={<PatientAssessmentPage />} />
            <Route path="/assessments/:id" element={<AssessmentDetailPage />} />
            <Route path="/assessments/:id/edit" element={<EditAssessmentPage />} />
            
            {/* Equipment Routes - Common for all roles */}
            <Route path="/equipment" element={<EquipmentListPage />} />
            <Route path="/equipment/allocations" element={<AllocationsPage />} />
            <Route path="/equipment/:id" element={<EquipmentDetailPage />} />
          </Route>
          
          {/* Admin-only Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/appointments/new" element={<NewAppointmentPage />} />
            <Route path="/appointments/:id/edit" element={<EditAppointmentPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/:id" element={<PatientDetailPage />} />
            <Route path="/equipment/new" element={<EquipmentFormPage />} />
            <Route path="/equipment/categories" element={<CategoryManagementPage />} />
            <Route path="/equipment/requests" element={<AllocationRequestsPage />} />
            <Route path="/equipment/:id/edit" element={<EquipmentFormPage />} />
            <Route path="/admin/attendance" element={<AdminAttendancePage />} />
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
            <Route path="/therapist/attendance" element={<TherapistAttendancePage />} />
            <Route path="/therapist/profile" element={<TherapistProfilePage />} />
            <Route path="/therapist/assessments" element={<AssessmentsPage />} />
            <Route path="/therapist/assessments/patient/:patientId" element={<PatientAssessmentPage />} />
            <Route path="/therapist/referrals" element={<NotFound />} />
            <Route path="/therapist/equipment" element={<EquipmentListPage />} />
            <Route path="/therapist/equipment/requests" element={<AllocationRequestsPage />} />
            <Route path="/therapist/equipment/requests/new" element={<AllocationRequestPage />} />
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
