import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import patientService from '../../services/patientService';
import appointmentService from '../../services/appointmentService';
import assessmentService from '../../services/assessmentService';

const PatientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch patient details
        const patientResponse = await patientService.getById(id);
        setPatient(patientResponse.data);
        
        // Fetch patient appointments
        const appointmentsResponse = await appointmentService.getByPatient(id);
        setAppointments(appointmentsResponse.data || []);
        
        // Fetch patient assessments
        const assessmentsResponse = await assessmentService.getByPatient(id);
        setAssessments(assessmentsResponse.data || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Failed to load patient details. Please try again.');
        setLoading(false);
      }
    };
    
    if (id) {
      fetchPatientData();
    }
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Function to navigate to edit patient page
  const handleEditPatient = () => {
    navigate(`/patients/${id}/edit`);
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="ml-3 text-gray-700">Loading patient details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="flex items-center justify-center text-red-500 mb-4">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-center text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-center text-gray-600">{error}</p>
          <div className="mt-6 flex justify-center">
            <Link to="/patients" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              Back to Patients
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="flex items-center justify-center text-yellow-500 mb-4">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-center text-xl font-semibold text-gray-900 mb-2">Patient Not Found</h2>
          <p className="text-center text-gray-600">The patient you're looking for doesn't exist or you don't have permission to view their details.</p>
          <div className="mt-6 flex justify-center">
            <Link to="/patients" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              Back to Patients
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
                <Link to="/dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link to="/appointments" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Appointments
                </Link>
                <Link to="/patients" className="border-primary-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Patients
                </Link>
                <Link to="/assessments" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Assessments
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
                <div className="ml-3 relative">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 mr-2">{user.first_name} {user.last_name}</span>
                    <button className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                      <span className="sr-only">Open user menu</span>
                      <div className="h-8 w-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-600 font-semibold">
                        {(user.first_name || '').charAt(0).toUpperCase()}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-gray-900">
                  Patient Details
                </h1>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                <button
                  onClick={handleEditPatient}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Edit Patient
                </button>
                <Link
                  to="/patients"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Back to Patients
                </Link>
              </div>
            </div>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {/* Patient Profile Card */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {patient.user?.first_name} {patient.user?.last_name}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Patient ID: {patient.id}
                    </p>
                  </div>
                  <div>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(patient.status)}`}>
                      {patient.status || 'Active'}
                    </span>
                  </div>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                  <dl className="sm:divide-y sm:divide-gray-200">
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Full name</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {patient.user?.first_name} {patient.user?.last_name}
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Date of birth</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {formatDate(patient.date_of_birth)}
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Email address</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {patient.user?.email || 'N/A'}
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {patient.user?.phone || 'N/A'}
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Address</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {patient.address || 'N/A'}
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Emergency contact</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {patient.emergency_contact_name ? (
                          <>
                            {patient.emergency_contact_name} ({patient.emergency_contact_relationship || 'Relationship not specified'})
                            <br />
                            {patient.emergency_contact_phone || 'No phone number'}
                          </>
                        ) : (
                          'No emergency contact provided'
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`${
                      activeTab === 'overview'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('appointments')}
                    className={`${
                      activeTab === 'appointments'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Appointments
                  </button>
                  <button
                    onClick={() => setActiveTab('assessments')}
                    className={`${
                      activeTab === 'assessments'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Assessments
                  </button>
                  <button
                    onClick={() => setActiveTab('medical-history')}
                    className={`${
                      activeTab === 'medical-history'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Medical History
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="mt-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {/* Treatment Progress */}
                      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">Treatment Progress</h3>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                          {patient.treatment_plan ? (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium text-gray-500">Overall Progress</div>
                                <div className="text-sm font-medium text-green-600">
                                  {patient.treatment_progress || '0'}%
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                                <div
                                  className="bg-green-600 h-2.5 rounded-full"
                                  style={{ width: `${patient.treatment_progress || 0}%` }}
                                ></div>
                              </div>
                              <div className="mt-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Current Treatment Plan</h4>
                                <p className="text-sm text-gray-600">{patient.treatment_plan || 'No treatment plan specified'}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-500">No treatment plan has been created yet.</p>
                              <button
                                type="button"
                                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                              >
                                Create Treatment Plan
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
                        </div>
                        <div className="border-t border-gray-200">
                          <ul className="divide-y divide-gray-200">
                            {appointments.length > 0 ? (
                              appointments.slice(0, 3).map((appointment) => (
                                <li key={appointment.id} className="px-4 py-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {appointment.status === 'COMPLETED' ? 'Completed appointment' : 'Scheduled appointment'}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {formatDate(appointment.datetime)} {new Date(appointment.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                    <Link
                                      to={`/appointments/${appointment.id}`}
                                      className="text-sm text-primary-600 hover:text-primary-900"
                                    >
                                      View
                                    </Link>
                                  </div>
                                </li>
                              ))
                            ) : (
                              <li className="px-4 py-4 text-center text-sm text-gray-500">
                                No recent activity
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="bg-white shadow overflow-hidden sm:rounded-lg sm:col-span-2">
                        <div className="px-4 py-5 sm:px-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <Link
                              to={`/appointments/new?patient=${patient.id}`}
                              className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                              Schedule Appointment
                            </Link>
                            <Link
                              to={`/assessments/new?patient=${patient.id}`}
                              className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              Create Assessment
                            </Link>
                            <Link
                              to={`/patients/${patient.id}/edit`}
                              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Edit Patient
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appointments Tab */}
                {activeTab === 'appointments' && (
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Appointments</h3>
                      <Link
                        to={`/appointments/new?patient=${patient.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Schedule New
                      </Link>
                    </div>
                    <div className="border-t border-gray-200">
                      {appointments.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                          {appointments.map((appointment) => (
                            <li key={appointment.id} className="px-4 py-4 sm:px-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {appointment.issue || 'General Appointment'}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {formatDate(appointment.datetime)} {new Date(appointment.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                <div className="flex items-center">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(appointment.status)}`}>
                                    {appointment.status}
                                  </span>
                                  <Link
                                    to={`/appointments/${appointment.id}`}
                                    className="ml-4 text-sm text-primary-600 hover:text-primary-900"
                                  >
                                    View
                                  </Link>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-sm text-gray-500">No appointments found for this patient.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Assessments Tab */}
                {activeTab === 'assessments' && (
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Assessments</h3>
                      <Link
                        to={`/assessments/new?patient=${patient.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        New Assessment
                      </Link>
                    </div>
                    <div className="border-t border-gray-200">
                      {assessments.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                          {assessments.map((assessment) => (
                            <li key={assessment.id} className="px-4 py-4 sm:px-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {assessment.title || 'Assessment'}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {formatDate(assessment.created_at)}
                                  </p>
                                </div>
                                <div className="flex items-center">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(assessment.status)}`}>
                                    {assessment.status}
                                  </span>
                                  <Link
                                    to={`/assessments/${assessment.id}`}
                                    className="ml-4 text-sm text-primary-600 hover:text-primary-900"
                                  >
                                    View
                                  </Link>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-sm text-gray-500">No assessments found for this patient.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Medical History Tab */}
                {activeTab === 'medical-history' && (
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Medical History</h3>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                      {patient.medical_history ? (
                        <div>
                          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                              <dt className="text-sm font-medium text-gray-500">Medical Conditions</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {patient.medical_conditions || 'None reported'}
                              </dd>
                            </div>
                            <div className="sm:col-span-2">
                              <dt className="text-sm font-medium text-gray-500">Allergies</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {patient.allergies || 'None reported'}
                              </dd>
                            </div>
                            <div className="sm:col-span-2">
                              <dt className="text-sm font-medium text-gray-500">Current Medications</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {patient.medications || 'None reported'}
                              </dd>
                            </div>
                            <div className="sm:col-span-2">
                              <dt className="text-sm font-medium text-gray-500">Previous Surgeries</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {patient.surgeries || 'None reported'}
                              </dd>
                            </div>
                            <div className="sm:col-span-2">
                              <dt className="text-sm font-medium text-gray-500">Family Medical History</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {patient.family_medical_history || 'None reported'}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">No medical history has been recorded yet.</p>
                          <button
                            type="button"
                            className="mt-3 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            Add Medical History
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PatientDetailPage;