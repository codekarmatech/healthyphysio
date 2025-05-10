import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import patientService from '../../services/patientService';

const TherapistPatientsPage = () => {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
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

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);

        // Try to fetch real data first
        try {
          const response = await patientService.getByTherapist(user.id);
          if (response.data && response.data.length > 0) {
            setPatients(response.data);
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.log('Using mock patient data:', apiError);
        }

        // If real data fetch fails or returns empty, use mock data
        const mockPatients = [
          {
            id: 1,
            user: {
              id: 101,
              first_name: 'John',
              last_name: 'Doe',
              email: 'john.doe@example.com',
              phone: '(555) 123-4567'
            },
            date_of_birth: '1985-06-15',
            medical_conditions: 'Lower back pain, Mild hypertension',
            allergies: 'Penicillin',
            status: 'Active',
            last_visit: '2023-06-20',
            attendance_rate: 85
          },
          {
            id: 2,
            user: {
              id: 102,
              first_name: 'Sarah',
              last_name: 'Johnson',
              email: 'sarah.j@example.com',
              phone: '(555) 987-6543'
            },
            date_of_birth: '1992-03-24',
            medical_conditions: 'Shoulder injury, Post-surgery rehabilitation',
            allergies: 'None',
            status: 'Active',
            last_visit: '2023-06-22',
            attendance_rate: 92
          },
          {
            id: 3,
            user: {
              id: 103,
              first_name: 'Michael',
              last_name: 'Chen',
              email: 'michael.c@example.com',
              phone: '(555) 456-7890'
            },
            date_of_birth: '1978-11-08',
            medical_conditions: 'Knee arthritis, Diabetes type 2',
            allergies: 'Sulfa drugs',
            status: 'On hold',
            last_visit: '2023-05-30',
            attendance_rate: 65
          },
          {
            id: 4,
            user: {
              id: 104,
              first_name: 'Emily',
              last_name: 'Wilson',
              email: 'emily.w@example.com',
              phone: '(555) 234-5678'
            },
            date_of_birth: '1990-09-17',
            medical_conditions: 'Sports injury - ankle sprain',
            allergies: 'None',
            status: 'Active',
            last_visit: '2023-06-18',
            attendance_rate: 90
          },
          {
            id: 5,
            user: {
              id: 105,
              first_name: 'Robert',
              last_name: 'Garcia',
              email: 'robert.g@example.com',
              phone: '(555) 876-5432'
            },
            date_of_birth: '1965-07-22',
            medical_conditions: 'Chronic back pain, Osteoarthritis',
            allergies: 'Aspirin',
            status: 'Active',
            last_visit: '2023-06-15',
            attendance_rate: 78
          }
        ];

        setPatients(mockPatients);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError('Failed to load patients. Please try again later.');
        setLoading(false);
      }
    };

    if (user && user.id) {
      fetchPatients();
    }
  }, [user]);

  const filteredPatients = searchTerm
    ? patients.filter(
        (patient) =>
          patient.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.user?.phone?.includes(searchTerm)
      )
    : patients;

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
                <h1 className="text-3xl font-bold text-gray-900">
                  My Patients
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  View your assigned patients and their treatment plans
                </p>
              </div>
            </div>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="mb-6">
                <label htmlFor="search" className="sr-only">
                  Search patients
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="search"
                    id="search"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Search patients by name or email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : error ? (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              ) : filteredPatients.length === 0 ? (
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
                      d="M12 9v2m0 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No patients found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm
                      ? "No patients match your search criteria."
                      : "You don't have any patients assigned to you yet."}
                  </p>
                </div>
              ) : (
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Name
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Contact
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
                          Last Visit
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPatients.map((patient) => (
                        <tr key={patient.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <span className="text-indigo-700 font-medium text-lg">
                                    {patient.user?.first_name?.[0] || '?'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {patient.user?.first_name} {patient.user?.last_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{patient.user?.email || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{patient.user?.phone || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 mb-1">
                                {patient.status || 'Active'}
                              </span>
                              <div className="text-xs text-gray-500">
                                Attendance: <span className="font-medium">{patient.attendance_rate || 0}%</span>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                  <div
                                    className="bg-primary-600 h-1.5 rounded-full"
                                    style={{ width: `${patient.attendance_rate || 0}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {patient.last_visit ? (
                              <div>
                                <div>{new Date(patient.last_visit).toLocaleDateString()}</div>
                                <div className="text-xs text-gray-400">
                                  {Math.floor((new Date() - new Date(patient.last_visit)) / (1000 * 60 * 60 * 24))} days ago
                                </div>
                              </div>
                            ) : (
                              'No visits yet'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end">
                              <Link
                                to={`/therapist/patients/${patient.id}`}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                View Profile
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TherapistPatientsPage;