import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import patientService from '../../services/patientService';
import appointmentService from '../../services/appointmentService';
import assessmentService from '../../services/assessmentService';
import earningsService from '../../services/earningsService';
import attendanceService from '../../services/attendanceService';
import PatientEarningsChart from '../../components/earnings/PatientEarningsChart';
import PatientAttendanceCalendar from '../../components/attendance/PatientAttendanceCalendar';

const TherapistPatientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
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

  // Fetch attendance and earnings data when month/year changes
  useEffect(() => {
    const fetchMonthlyData = async () => {
      if (!id || !user) return;

      // Fetch attendance data
      try {
        // Get the therapist ID from the user object
        const therapistId = user.therapist_id || user.id;

        // Use the service to get patient-therapist attendance data
        const attendanceResponse = await attendanceService.getPatientTherapistAttendance(
          therapistId,
          id,
          currentYear,
          currentMonth
        );

        // Make sure we have valid data before mapping
        if (attendanceResponse && attendanceResponse.data && attendanceResponse.data.appointments) {
          setAttendance({
            summary: attendanceResponse.data.summary || {},
            days: attendanceResponse.data.appointments.map(app => ({
              date: app.date,
              status: app.status
            }))
          });
        } else {
          // Set default empty data if response is invalid
          setAttendance({
            summary: {},
            days: []
          });
        }
      } catch (error) {
        console.error('Error fetching attendance data:', error);
      }

      // Fetch earnings data
      try {
        const earningsResponse = await earningsService.getPatientEarnings(
          id,
          currentYear,
          currentMonth
        );

        // Make sure we have valid data
        if (earningsResponse && earningsResponse.data) {
          setEarnings(earningsResponse.data);
        } else {
          console.error('Invalid earnings data received');
        }
      } catch (error) {
        console.error('Error fetching earnings data:', error);
      }
    };

    if (patient) {
      fetchMonthlyData();
    }
  }, [id, user, currentMonth, currentYear, patient]);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch real patient data
        let patientData = null;
        try {
          // Try to get patient data using the service
          // Note: The backend endpoint for this functionality is not yet implemented
          // This will throw an error and we'll use mock data instead
          const patientResponse = await patientService.getById(id);
          if (patientResponse && patientResponse.data) {
            patientData = patientResponse.data;
          }
        } catch (patientError) {
          console.log('Using mock patient data:', patientError);
        }

        // If no real data, use mock patient data
        if (!patientData) {
          patientData = {
            id: parseInt(id),
            user: {
              id: 100 + parseInt(id),
              first_name: ['John', 'Sarah', 'Michael', 'Emily', 'Robert'][parseInt(id) % 5],
              last_name: ['Doe', 'Johnson', 'Chen', 'Wilson', 'Garcia'][parseInt(id) % 5],
              email: `patient${id}@example.com`,
              phone: `(555) ${100 + parseInt(id)}-${1000 + parseInt(id)}`
            },
            date_of_birth: ['1985-06-15', '1992-03-24', '1978-11-08', '1990-09-17', '1965-07-22'][parseInt(id) % 5],
            medical_conditions: [
              'Lower back pain, Mild hypertension',
              'Shoulder injury, Post-surgery rehabilitation',
              'Knee arthritis, Diabetes type 2',
              'Sports injury - ankle sprain',
              'Chronic back pain, Osteoarthritis'
            ][parseInt(id) % 5],
            allergies: ['Penicillin', 'None', 'Sulfa drugs', 'None', 'Aspirin'][parseInt(id) % 5],
            status: 'Active',
            last_visit: new Date(Date.now() - (Math.random() * 10 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
          };
        }

        setPatient(patientData);

        // Try to fetch real appointment data
        let appointmentData = [];
        try {
          const appointmentsResponse = await appointmentService.getByPatient(id);
          if (appointmentsResponse.data && appointmentsResponse.data.length > 0) {
            appointmentData = appointmentsResponse.data;
          }
        } catch (appointmentsError) {
          console.log('Using mock appointment data:', appointmentsError);
        }

        // If no real data, use mock appointment data
        if (appointmentData.length === 0) {
          const today = new Date();
          const statuses = ['scheduled', 'completed', 'cancelled', 'missed', 'rescheduled'];
          const issues = [
            'Initial consultation',
            'Follow-up session',
            'Pain management',
            'Rehabilitation',
            'Strength training',
            'Mobility assessment'
          ];

          appointmentData = Array(8).fill().map((_, index) => {
            const appointmentDate = new Date();

            // Past appointments
            if (index < 5) {
              appointmentDate.setDate(today.getDate() - (index * 7 + Math.floor(Math.random() * 3)));
              return {
                id: 1000 + index,
                patient_id: parseInt(id),
                therapist_id: user?.id || 1,
                datetime: appointmentDate.toISOString(),
                duration_minutes: 60,
                status: statuses[index % 5],
                issue: issues[index % 6],
                notes: index % 3 === 0 ? 'Patient reported improvement in mobility.' : '',
                created_at: new Date(appointmentDate.getTime() - 1000000).toISOString()
              };
            }
            // Future appointments
            else {
              appointmentDate.setDate(today.getDate() + ((index - 4) * 7 + Math.floor(Math.random() * 3)));
              return {
                id: 1000 + index,
                patient_id: parseInt(id),
                therapist_id: user?.id || 1,
                datetime: appointmentDate.toISOString(),
                duration_minutes: 60,
                status: 'scheduled',
                issue: issues[index % 6],
                notes: '',
                created_at: new Date(appointmentDate.getTime() - 1000000).toISOString()
              };
            }
          });
        }

        setAppointments(appointmentData);

        // Try to fetch real assessment data
        let assessmentData = [];
        try {
          const assessmentsResponse = await assessmentService.getByPatient(id);
          if (assessmentsResponse.data && assessmentsResponse.data.length > 0) {
            assessmentData = assessmentsResponse.data;
          }
        } catch (assessmentsError) {
          console.log('Using mock assessment data:', assessmentsError);
        }

        // If no real data, use mock assessment data
        if (assessmentData.length === 0) {
          const assessmentTypes = [
            'Initial Assessment',
            'Functional Movement Screen',
            'Pain Assessment',
            'Range of Motion Test',
            'Strength Assessment'
          ];

          assessmentData = Array(4).fill().map((_, index) => {
            const assessmentDate = new Date();
            assessmentDate.setDate(assessmentDate.getDate() - (index * 14 + Math.floor(Math.random() * 5)));

            return {
              id: 2000 + index,
              patient_id: parseInt(id),
              therapist_id: user?.id || 1,
              type: assessmentTypes[index % 5],
              status: index === 0 ? 'pending' : 'completed',
              score: index === 0 ? null : Math.floor(Math.random() * 40) + 60,
              notes: index === 0 ? '' : 'Patient showing improvement in mobility and strength.',
              created_at: assessmentDate.toISOString(),
              completed_at: index === 0 ? null : assessmentDate.toISOString()
            };
          });
        }

        setAssessments(assessmentData);

        // Initial data will be loaded by the useEffect hooks
        // Just set the patient data here
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
  }, [id, currentYear, currentMonth, user]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'attended':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'missed':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-3 text-gray-700">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center mx-auto">
            <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-3 text-lg font-medium text-gray-900">Error</h2>
          <p className="mt-2 text-gray-500">{error}</p>
          <button
            onClick={() => navigate('/therapist/patients')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Back to Patients
          </button>
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
                  className="border-primary-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
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
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
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
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                    <span className="text-indigo-700 font-medium text-lg">
                      {patient?.user?.first_name?.[0] || '?'}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {patient?.user?.first_name} {patient?.user?.last_name}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                      Patient ID: {patient?.id} • DOB: {formatDate(patient?.date_of_birth)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <Link
                  to="/therapist/patients"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back to Patients
                </Link>
                <button
                  onClick={() => alert('Please contact an administrator to reschedule appointments.')}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Reschedule Appointment
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="mt-6 sm:mt-2 2xl:mt-5">
          <div className="border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  className={`${
                    activeTab === 'overview'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`${
                    activeTab === 'appointments'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  onClick={() => setActiveTab('appointments')}
                >
                  Appointments
                </button>
                <button
                  className={`${
                    activeTab === 'assessments'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  onClick={() => setActiveTab('assessments')}
                >
                  Assessments
                </button>
                <button
                  className={`${
                    activeTab === 'earnings'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  onClick={() => setActiveTab('earnings')}
                >
                  Earnings
                </button>
                <button
                  className={`${
                    activeTab === 'attendance'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  onClick={() => setActiveTab('attendance')}
                >
                  Attendance
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Patient Information */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Patient Information</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and medical information.</p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                  <dl className="sm:divide-y sm:divide-gray-200">
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Full name</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {patient?.user?.first_name} {patient?.user?.last_name}
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Email address</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient?.user?.email}</dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient?.user?.phone || 'N/A'}</dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Date of birth</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(patient?.date_of_birth)}</dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Medical conditions</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {patient?.medical_conditions || 'None reported'}
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Allergies</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {patient?.allergies || 'None reported'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 gap-6">
                {/* Appointment Stats */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Treatment Summary</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Key metrics and statistics.</p>
                  </div>
                  <div className="border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 p-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-500">Total Appointments</p>
                        <p className="mt-1 text-3xl font-semibold text-gray-900">{appointments.length}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
                        <p className="mt-1 text-3xl font-semibold text-gray-900">
                          {attendance?.summary?.attendanceRate || 0}%
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-500">Pending Assessments</p>
                        <p className="mt-1 text-3xl font-semibold text-gray-900">
                          {assessments.filter(a => a.status === 'pending').length}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-500">Next Appointment</p>
                        <p className="mt-1 text-xl font-semibold text-gray-900">
                          {appointments.filter(a => new Date(a.datetime) > new Date()).length > 0
                            ? formatDate(appointments.filter(a => new Date(a.datetime) > new Date())[0]?.datetime)
                            : 'None scheduled'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Latest appointments and assessments.</p>
                  </div>
                  <div className="border-t border-gray-200">
                    <ul className="divide-y divide-gray-200">
                      {appointments.slice(0, 3).map((appointment) => (
                        <li key={appointment.id} className="px-4 py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(appointment.datetime).toLocaleDateString()} at{' '}
                                {new Date(appointment.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-sm text-gray-500">{appointment.issue || 'General consultation'}</p>
                            </div>
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                                appointment.status
                              )}`}
                            >
                              {appointment.status}
                            </span>
                          </div>
                        </li>
                      ))}
                      {appointments.length === 0 && (
                        <li className="px-4 py-4 text-center text-sm text-gray-500">No recent appointments</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Appointment History</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">All appointments for this patient.</p>
                </div>
                <button
                  onClick={() => alert('Please contact an administrator to reschedule appointments.')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Reschedule Now
                </button>
              </div>
              <div className="border-t border-gray-200">
                {appointments.length === 0 ? (
                  <div className="text-center py-12">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
                    <p className="mt-1 text-sm text-gray-500">This patient doesn't have any appointments yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Date & Time
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Type
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Notes
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {appointments.map((appointment) => (
                          <tr key={appointment.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(appointment.datetime).toLocaleDateString()} at{' '}
                              {new Date(appointment.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {appointment.issue || 'General consultation'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                                  appointment.status
                                )}`}
                              >
                                {appointment.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                              {appointment.notes || 'No notes'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link
                                to={`/therapist/appointments/${appointment.id}`}
                                className="text-primary-600 hover:text-primary-900"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assessments Tab */}
          {activeTab === 'assessments' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Assessments</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Patient assessment history and results.</p>
              </div>
              <div className="border-t border-gray-200">
                {assessments.length === 0 ? (
                  <div className="text-center py-12">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No assessments</h3>
                    <p className="mt-1 text-sm text-gray-500">This patient doesn't have any assessments yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Type
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Score
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {assessments.map((assessment) => (
                          <tr key={assessment.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(assessment.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {assessment.type || 'General assessment'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  assessment.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : assessment.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {assessment.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {assessment.score !== undefined ? assessment.score : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link
                                to={`/therapist/assessments/${assessment.id}`}
                                className="text-primary-600 hover:text-primary-900"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Earnings Tab */}
          {activeTab === 'earnings' && (
            <div>
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Patient Earnings</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Revenue generated from this patient.</p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handlePrevMonth}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Previous
                    </button>
                    <span className="inline-flex items-center px-3 py-2 text-sm font-medium">
                      {new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Next
                    </button>
                  </div>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                  <div className="h-80">
                    {earnings ? (
                      <PatientEarningsChart
                        data={earnings}
                        year={currentYear}
                        month={currentMonth}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No earnings data available for this month.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Earnings Summary</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Financial details for this patient.</p>
                </div>
                <div className="border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">Total Earned</p>
                      <p className="mt-1 text-3xl font-semibold text-gray-900">
                        ${typeof earnings?.summary?.totalEarned === 'number' ? earnings.summary.totalEarned.toFixed(2) : '0.00'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">This Month</p>
                      <p className="mt-1 text-3xl font-semibold text-gray-900">
                        ${typeof earnings?.summary?.monthlyEarned === 'number' ? earnings.summary.monthlyEarned.toFixed(2) : '0.00'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">Average Per Session</p>
                      <p className="mt-1 text-3xl font-semibold text-gray-900">
                        ${typeof earnings?.summary?.averagePerSession === 'number' ? earnings.summary.averagePerSession.toFixed(2) : '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div>
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Attendance Record</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Patient's appointment attendance history.</p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handlePrevMonth}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Previous
                    </button>
                    <span className="inline-flex items-center px-3 py-2 text-sm font-medium">
                      {new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Next
                    </button>
                  </div>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                  <div className="h-80">
                    {attendance?.days?.length > 0 ? (
                      <PatientAttendanceCalendar
                        days={attendance.days}
                        year={currentYear}
                        month={currentMonth}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No attendance data available for this month.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Attendance Summary</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Statistics for this patient's attendance.</p>
                </div>
                <div className="border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                      <p className="mt-1 text-3xl font-semibold text-gray-900">
                        {attendance?.summary?.total || 0}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">Attended</p>
                      <p className="mt-1 text-3xl font-semibold text-green-600">
                        {attendance?.summary?.attended || 0}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">Missed</p>
                      <p className="mt-1 text-3xl font-semibold text-red-600">
                        {attendance?.summary?.missed || 0}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
                      <p className="mt-1 text-3xl font-semibold text-gray-900">
                        {attendance?.summary?.attendanceRate || 0}%
                      </p>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-primary-600 h-2.5 rounded-full"
                          style={{ width: `${attendance?.summary?.attendanceRate || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TherapistPatientDetailPage;