import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';

const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeReferrals: 0,
    pendingReports: 0,
    completedTreatments: 0
  });
  const [recentReferrals, setRecentReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        // This would be replaced with actual API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        setStats({
          totalPatients: 48,
          activeReferrals: 12,
          pendingReports: 5,
          completedTreatments: 23
        });
        
        // Using placeholder names for therapists as per privacy requirements
        setRecentReferrals([
          {
            id: 1,
            patientName: 'John Smith',
            condition: 'Lower Back Pain',
            date: '2023-06-15',
            status: 'active',
            therapistId: 1,
            therapistPlaceholder: 'Therapist 1'
          },
          {
            id: 2,
            patientName: 'Emily Davis',
            condition: 'Shoulder Rehabilitation',
            date: '2023-06-12',
            status: 'active',
            therapistId: 2,
            therapistPlaceholder: 'Therapist 2'
          },
          {
            id: 3,
            patientName: 'Robert Wilson',
            condition: 'Knee Replacement Recovery',
            date: '2023-06-10',
            status: 'completed',
            therapistId: 1,
            therapistPlaceholder: 'Therapist 1'
          },
          {
            id: 4,
            patientName: 'Lisa Thompson',
            condition: 'Tennis Elbow',
            date: '2023-06-08',
            status: 'active',
            therapistId: 3,
            therapistPlaceholder: 'Therapist 3'
          }
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      
      <div className="md:pl-64 flex flex-col">
        <Header title="Doctor Dashboard" />
        
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Stats */}
              <div className="mt-8">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Total Patients */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                          <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Total Patients
                            </dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">
                                {loading ? (
                                  <div className="h-5 w-12 bg-gray-200 rounded animate-pulse"></div>
                                ) : (
                                  stats.totalPatients
                                )}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-4 sm:px-6">
                      <div className="text-sm">
                        <Link to="/patients" className="font-medium text-primary-600 hover:text-primary-500">
                          View all patients
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Active Referrals */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                          <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Active Referrals
                            </dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">
                                {loading ? (
                                  <div className="h-5 w-12 bg-gray-200 rounded animate-pulse"></div>
                                ) : (
                                  stats.activeReferrals
                                )}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-4 sm:px-6">
                      <div className="text-sm">
                        <Link to="/referrals" className="font-medium text-primary-600 hover:text-primary-500">
                          View all referrals
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Pending Reports */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                          <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Pending Reports
                            </dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">
                                {loading ? (
                                  <div className="h-5 w-12 bg-gray-200 rounded animate-pulse"></div>
                                ) : (
                                  stats.pendingReports
                                )}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-4 sm:px-6">
                      <div className="text-sm">
                        <Link to="/reports" className="font-medium text-primary-600 hover:text-primary-500">
                          View pending reports
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Referrals */}
              <div className="mt-8">
                <div className="bg-white shadow sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Recent Referrals
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Your most recent patient referrals
                      </p>
                    </div>
                    <Link
                      to="/referrals/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      New Referral
                    </Link>
                  </div>
                  <div className="border-t border-gray-200">
                    {loading ? (
                      <div className="px-4 py-5 sm:p-6 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-3 text-gray-700">Loading referrals...</p>
                      </div>
                    ) : recentReferrals.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Patient
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Condition
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Assigned To
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {recentReferrals.map((referral) => (
                              <tr key={referral.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                      <div className="h-10 w-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-600 font-semibold">
                                        {referral.patientName.charAt(0)}
                                      </div>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">
                                        {referral.patientName}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{referral.condition}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{new Date(referral.date).toLocaleDateString()}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{referral.therapistPlaceholder}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    referral.status === 'active' ? 'bg-green-100 text-green-800' : 
                                    referral.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <Link to={`/referrals/${referral.id}`} className="text-primary-600 hover:text-primary-900 mr-4">
                                    View
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="px-4 py-5 sm:p-6 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No referrals</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Get started by creating a new patient referral.
                        </p>
                        <div className="mt-6">
                          <Link
                            to="/referrals/new"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            New Referral
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Reports */}
              <div className="mt-8">
                <div className="bg-white shadow sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Recent Treatment Reports
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Latest reports from your patient treatments
                    </p>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                    {loading ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-3 text-gray-700">Loading reports...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">John Smith - Lower Back Pain</h4>
                              <p className="text-sm text-gray-500">Submitted by Therapist 1 on June 18, 2023</p>
                            </div>
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              New
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-600">
                            Patient showing significant improvement after 4 sessions. Pain reduced from 8/10 to 4/10. Continuing with core strengthening exercises.
                          </p>
                          <div className="mt-3">
                            <Link to="/reports/1" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                              View full report →
                            </Link>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Emily Davis - Shoulder Rehabilitation</h4>
                              <p className="text-sm text-gray-500">Submitted by Therapist 2 on June 15, 2023</p>
                            </div>
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              Reviewed
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-600">
                            Range of motion improved by 15 degrees. Patient able to perform daily activities with minimal discomfort. Continuing with resistance band exercises.
                          </p>
                          <div className="mt-3">
                            <Link to="/reports/2" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                              View full report →
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <Link to="/reports" className="font-medium text-primary-600 hover:text-primary-500">
                        View all reports
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;