import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import ApprovedTherapistRoute from './components/ApprovedTherapistRoute';
import TreatmentPlansApprovedRoute from './components/TreatmentPlansApprovedRoute';
import ReportsApprovedRoute from './components/ReportsApprovedRoute';
import AttendanceApprovedRoute from './components/AttendanceApprovedRoute';

// Import Leaflet CSS globally to ensure it's available for all map components
import 'leaflet/dist/leaflet.css';

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
import TherapistEarningsPage from './pages/earnings/TherapistEarningsPage';

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
import SubmittedReportsPage from './pages/admin/SubmittedReportsPage';
import AdminReportViewPage from './pages/admin/AdminReportViewPage';
import TherapistApprovalsPage from './pages/admin/TherapistApprovalsPage';
import LocationMonitoringPage from './pages/admin/LocationMonitoringPage';
import TherapistDashboardView from './pages/admin/TherapistDashboardView';
import TherapistAnalyticsDashboard from './pages/admin/TherapistAnalyticsDashboard';
import ErrorBoundary from './components/common/ErrorBoundary';
import DashboardLayout from './components/layout/DashboardLayout';
import AuditDashboardPage from './pages/admin/AuditDashboardPage';
import PaymentStatusManagement from './pages/admin/PaymentStatusManagement';

// Dashboard Components
import AreaManagementDashboard from './components/dashboard/AreaManagementDashboard';
import FinancialManagementDashboard from './components/dashboard/FinancialManagementDashboard';
import SessionFeeManagement from './components/dashboard/SessionFeeManagement';
import RevenueDistributionConfig from './components/dashboard/RevenueDistributionConfig';

// Therapist Pages
import TherapistAttendancePage from './pages/therapist/TherapistAttendancePage';
import TherapistProfilePage from './pages/therapist/TherapistProfilePage';
import TherapistReportPage from './pages/therapist/TherapistReportPage';
import PendingReportsPage from './pages/therapist/PendingReportsPage';
import TreatmentPlansPage from './pages/therapist/TreatmentPlansPage';
import TreatmentPlanDetailPage from './pages/therapist/TreatmentPlanDetailPage';
import ReportsPage from './pages/therapist/ReportsPage';
import NewReportPage from './pages/therapist/NewReportPage';
import PendingApprovalPage from './pages/therapist/PendingApprovalPage';
import FeatureNotApprovedPage from './pages/therapist/FeatureNotApprovedPage';
import RequestSessionPage from './pages/therapist/RequestSessionPage';
import VisitsListPage from './pages/therapist/VisitsListPage';
import VisitTrackingPage from './pages/therapist/VisitTrackingPage';

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
            <Route path="/admin/appointments" element={<AppointmentsPage />} />
            <Route path="/admin/appointments/new" element={<NewAppointmentPage />} />
            <Route path="/admin/appointments/:id" element={<AppointmentDetailPage />} />
            <Route path="/admin/appointments/:id/edit" element={<EditAppointmentPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/:id" element={<PatientDetailPage />} />
            <Route path="/admin/equipment" element={<EquipmentListPage />} />
            <Route path="/admin/equipment/new" element={<EquipmentFormPage />} />
            <Route path="/admin/equipment/categories" element={<CategoryManagementPage />} />
            <Route path="/admin/equipment/requests" element={<AllocationRequestsPage />} />
            <Route path="/admin/equipment/:id" element={<EquipmentDetailPage />} />
            <Route path="/admin/equipment/:id/edit" element={<EquipmentFormPage />} />
            <Route path="/admin/attendance" element={<AdminAttendancePage />} />
            {/* New Report Routes for Admin */}
            <Route path="/admin/submitted-reports" element={<SubmittedReportsPage />} />
            <Route path="/admin/report/:id" element={<AdminReportViewPage />} />
            {/* Therapist Approvals */}
            <Route path="/admin/therapist-approvals" element={<TherapistApprovalsPage />} />
            {/* Location Monitoring */}
            <Route path="/admin/location-monitoring" element={<LocationMonitoringPage />} />
            {/* Therapist Dashboard View */}
            <Route path="/admin/therapist-dashboard" element={<TherapistDashboardView />} />
            <Route path="/admin/therapist-dashboard/:therapistId" element={<TherapistDashboardView />} />
            {/* Therapist Analytics */}
            <Route path="/admin/therapist-analytics" element={
              <ErrorBoundary
                fallback={(error) => (
                  <DashboardLayout>
                    <div className="p-6 bg-red-50 border-l-4 border-red-500 rounded-md">
                      <h2 className="text-xl font-semibold text-red-800 mb-4">
                        Error in Therapist Analytics Dashboard
                      </h2>
                      <p className="text-red-700 mb-4">
                        {error?.toString() || "An unexpected error occurred while loading the analytics dashboard."}
                      </p>
                      <p className="text-gray-700 mb-4">
                        This could be due to a server error or data format issue. Our team has been notified.
                      </p>
                      <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Reload Page
                      </button>
                    </div>
                  </DashboardLayout>
                )}
              >
                <TherapistAnalyticsDashboard />
              </ErrorBoundary>
            } />
            {/* Area Management */}
            <Route path="/admin/area-management" element={<AreaManagementDashboard />} />
            {/* Financial Management */}
            <Route path="/admin/financial-dashboard" element={<FinancialManagementDashboard />} />
            <Route path="/admin/session-fees" element={<SessionFeeManagement />} />
            <Route path="/admin/revenue-distribution" element={<RevenueDistributionConfig />} />
            <Route path="/admin/payment-status" element={<PaymentStatusManagement />} />
            {/* Audit Dashboard */}
            <Route path="/admin/audit-dashboard" element={<AuditDashboardPage />} />
          </Route>

          {/* Basic Therapist Routes - Accessible to all therapists */}
          <Route element={<ProtectedRoute allowedRoles={['therapist']} />}>
            {/* These routes are accessible to all therapists, even those pending approval */}
            <Route path="/therapist/pending-approval" element={<PendingApprovalPage />} />
            <Route path="/therapist/feature-not-approved/:feature" element={<FeatureNotApprovedPage />} />
            <Route path="/therapist/profile" element={<TherapistProfilePage />} />
          </Route>

          {/* Approved Therapist Routes - Requires general therapist approval */}
          <Route element={<ApprovedTherapistRoute />}>
            <Route path="/therapist/dashboard" element={<TherapistDashboard />} />
            <Route path="/therapist/appointments" element={<AppointmentsPage />} />
            <Route path="/therapist/appointments/today" element={<TodayAppointmentsPage />} />
            <Route path="/therapist/appointments/:id" element={<AppointmentDetailPage />} />
            <Route path="/therapist/appointments/:id/reschedule" element={<RescheduleRequestPage />} />
            <Route path="/therapist/patients" element={<TherapistPatientsPage />} />
            <Route path="/therapist/patients/:id" element={<TherapistPatientDetailPage />} />
            <Route path="/therapist/earnings" element={<TherapistEarningsPage />} />
            <Route path="/therapist/assessments" element={<AssessmentsPage />} />
            <Route path="/therapist/assessments/patient/:patientId" element={<PatientAssessmentPage />} />
            <Route path="/therapist/referrals" element={<NotFound />} />
            <Route path="/therapist/equipment" element={<EquipmentListPage />} />
            <Route path="/therapist/equipment/requests" element={<AllocationRequestsPage />} />
            <Route path="/therapist/equipment/requests/new" element={<AllocationRequestPage />} />

            {/* Visit Tracking Routes */}
            <Route path="/therapist/visits" element={<VisitsListPage />} />
            <Route path="/therapist/visits/:id" element={<VisitTrackingPage />} />
          </Route>

          {/* Attendance Routes - Requires attendance approval */}
          <Route element={<AttendanceApprovedRoute />}>
            <Route path="/therapist/attendance" element={<TherapistAttendancePage />} />
          </Route>

          {/* Reports Routes - Requires reports approval */}
          <Route element={<ReportsApprovedRoute />}>
            <Route path="/therapist/pending-reports" element={<PendingReportsPage />} />
            <Route path="/therapist/report/:id" element={<TherapistReportPage />} />
            <Route path="/therapist/reports" element={<ReportsPage />} />
            <Route path="/therapist/reports/new" element={<NewReportPage />} />
            <Route path="/therapist/request-session" element={<RequestSessionPage />} />
          </Route>

          {/* Treatment Plans Routes - Requires treatment plans approval */}
          <Route element={<TreatmentPlansApprovedRoute />}>
            <Route path="/therapist/treatment-plans" element={<TreatmentPlansPage />} />
            <Route path="/therapist/treatment-plans/:id" element={<TreatmentPlanDetailPage />} />
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
