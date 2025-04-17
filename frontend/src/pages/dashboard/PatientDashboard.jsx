import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const PatientDashboard = ({ user }) => {
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    completedSessions: 0,
    pendingExercises: 0,
    progressPercentage: 0,
  });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching dashboard data
    setTimeout(() => {
      setStats({
        upcomingAppointments: 2,
        completedSessions: 8,
        pendingExercises: 3,
        progressPercentage: 65,
      });
      
      setAppointments([
        {
          id: 1,
          therapistName: 'Dr. Sarah Johnson',
          date: '2023-06-15T10:00:00',
          status: 'confirmed',
          type: 'Follow-up Session',
        },
        {
          id: 2,
          therapistName: 'Dr. Michael Chen',
          date: '2023-06-22T14:30:00',
          status: 'confirmed',
          type: 'Assessment',
        },
      ]);
      
      setLoading(false);
    }, 1000);
  }, []);

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
                <Link to="/dashboard" className="border-primary-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link to="/appointments" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  My Appointments
                </Link>
                <Link to="/exercises" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Exercises
                </Link>
                <Link to="/progress" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  My Progress
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
                <div className="ml-3 relative">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 mr-2">{user.firstName} {user.lastName}</span>
                    <button className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                      <span className="sr-only">Open user menu</span>
                      <div className="h-8 w-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-600 font-semibold">
                        {user.firstName.charAt(0)}
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
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.firstName}!</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            {/* Stats */}
            <div className="px-4 py-6 sm:px-0">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Stat 1 */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Upcoming Appointments
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.upcomingAppointments}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <Link to="/appointments" className="font-medium text-primary-600 hover:text-primary-500">
                        View all<span className="sr-only"> appointments</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Completed Sessions
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.completedSessions}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <Link to="/sessions/history" className="font-medium text-primary-600 hover:text-primary-500">
                        View history
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Pending Exercises
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.pendingExercises}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <Link to="/exercises" className="font-medium text-primary-600 hover:text-primary-500">
                        View exercises
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Stat 4 */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Recovery Progress
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.progressPercentage}%
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <Link to="/progress" className="font-medium text-primary-600 hover:text-primary-500">
                        View progress
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="px-4 py-6 sm:px-0">
              <h2 className="text-lg font-medium text-gray-900">Upcoming Appointments</h2>
              <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {loading ? (
                    <li className="px-6 py-4 flex items-center">
                      <div className="animate-pulse flex space-x-4 w-full">
                        <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                        <div className="flex-1 space-y-4 py-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ) : appointments.length > 0 ? (
                    appointments.map((appointment) => (
                      <li key={appointment.id}>
                        <Link to={`/appointments/${appointment.id}`} className="block hover:bg-gray-50">
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <div className="h-10 w-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-600 font-semibold">
                                    {appointment.therapistName.charAt(0)}
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <p className="text-sm font-medium text-primary-600 truncate">
                                    {appointment.therapistName}
                                  </p>
                                  <p className="mt-1 flex items-center text-sm text-gray-500">
                                    <span className="truncate">{appointment.type}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="ml-2 flex-shrink-0 flex">
                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  {appointment.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500">
                                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                  </svg>
                                  {new Date(appointment.date).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {new Date(appointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="px-6 py-4 text-center text-gray-500">
                      No upcoming appointments found.
                    </li>
                  )}
                </ul>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <Link to="/appointments/schedule" className="font-medium text-primary-600 hover:text-primary-500">
                      Schedule a new appointment<span className="sr-only"> appointment</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Assigned Exercises */}
            <div className="px-4 py-6 sm:px-0">
              <h2 className="text-lg font-medium text-gray-900">Your Exercise Plan</h2>
              <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
                {loading ? (
                  <div className="px-6 py-4">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-5 sm:p-6">
                    <div className="space-y-4">
                      <div className="border border-gray-200 rounded-md p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-primary-100 rounded-md p-2">
                              <svg className="h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-gray-900">Shoulder Mobility Exercises</h3>
                              <p className="text-xs text-gray-500">3 exercises · 15 minutes</p>
                            </div>
                          </div>
                          <div>
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Today
                            </span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Link
                            to="/exercises/shoulder-mobility"
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            Start Exercises
                          </Link>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-md p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-blue-100 rounded-md p-2">
                              <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-gray-900">Lower Back Strengthening</h3>
                              <p className="text-xs text-gray-500">4 exercises · 20 minutes</p>
                            </div>
                          </div>
                          <div>
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Tomorrow
                            </span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Link
                            to="/exercises/lower-back"
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            View Exercises
                          </Link>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-md p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-purple-100 rounded-md p-2">
                              <svg className="h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-gray-900">Neck Tension Relief</h3>
                              <p className="text-xs text-gray-500">2 exercises · 10 minutes</p>
                            </div>
                          </div>
                          <div>
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              In 2 days
                            </span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Link
                            to="/exercises/neck-tension"
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            View Exercises
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <Link to="/exercises" className="font-medium text-primary-600 hover:text-primary-500">
                      View all exercises<span className="sr-only"> exercises</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Recovery Progress */}
            <div className="px-4 py-6 sm:px-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Recovery Progress</h2>
                <Link to="/progress" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                  View detailed progress
                </Link>
              </div>
              <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  {loading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Overall Recovery</h3>
                      <div className="mt-2">
                        <div className="bg-gray-200 rounded-full h-4">
                          <div 
                            className="bg-primary-600 h-4 rounded-full" 
                            style={{ width: `${stats.progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between text-sm text-gray-500">
                        <div>Started treatment</div>
                        <div>{stats.progressPercentage}% complete</div>
                      </div>
                      
                      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-500">Pain Level</h4>
                          <div className="mt-2 flex items-baseline">
                            <p className="text-2xl font-semibold text-gray-900">3/10</p>
                            <p className="ml-2 text-sm text-green-600">↓ 2 points</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">Decreased from initial assessment</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-500">Mobility</h4>
                          <div className="mt-2 flex items-baseline">
                            <p className="text-2xl font-semibold text-gray-900">70%</p>
                            <p className="ml-2 text-sm text-green-600">↑ 15%</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">Improved from initial assessment</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PatientDashboard;