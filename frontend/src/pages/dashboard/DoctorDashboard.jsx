import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { formatLocalDate } from '../../utils/dateUtils';
import doctorService from '../../services/doctorService';
import { SampleDataNotice } from '../../components/dashboard/ui';

const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    pendingApprovals: 0,
    pendingReports: 0,
    totalEarnings: 0
  });
  const [recentPatients, setRecentPatients] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSampleData, setIsSampleData] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await doctorService.getDashboardSummary();
        
        setStats(data.stats);
        setRecentPatients(data.patients || []);
        setRecentReports(data.reports || []);
        setIsSampleData(data.isSampleData || false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <DashboardLayout title="Doctor Dashboard">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Sample Data Notice */}
        {isSampleData && (
          <SampleDataNotice 
            message="Showing sample data. Real data will appear once patients are added."
          />
        )}

        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Welcome back, <span className="text-purple-600">Doctor</span>!
            </h1>
            <p className="mt-2 text-gray-500">Manage your patients and track their progress</p>
          </div>
          <Link
            to="/doctor/patients/new"
            className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Patient
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total Patients */}
          <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border-l-4 border-l-purple-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-600 rounded-full transform translate-x-8 -translate-y-8"></div>
            </div>
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">Total Patients</p>
                <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    stats.totalPatients
                  )}
                </h3>
                <p className="mt-1 text-sm text-gray-500">Under your care</p>
              </div>
              <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link to="/patients" className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors">
                View all patients
                <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border-l-4 border-l-amber-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
              <div className="w-full h-full bg-gradient-to-br from-amber-500 to-amber-600 rounded-full transform translate-x-8 -translate-y-8"></div>
            </div>
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">Pending Approvals</p>
                <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    stats.pendingApprovals
                  )}
                </h3>
                <p className="mt-1 text-sm text-gray-500">Awaiting admin review</p>
              </div>
              <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link to="/doctor/pending-approvals" className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors">
                View pending approvals
                <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Pending Reports */}
          <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border-l-4 border-l-yellow-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
              <div className="w-full h-full bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full transform translate-x-8 -translate-y-8"></div>
            </div>
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">Pending Reports</p>
                <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    stats.pendingReports
                  )}
                </h3>
                <p className="mt-1 text-sm text-gray-500">Needs review</p>
              </div>
              <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-lg">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link to="/reports" className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors">
                View pending
                <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

              {/* Recent Patients */}
              <div className="mt-8">
                <div className="bg-white shadow sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Recent Patients
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Patients you have added or are assigned to
                      </p>
                    </div>
                    <Link
                      to="/doctor/patients/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Add Patient
                    </Link>
                  </div>
                  <div className="border-t border-gray-200">
                    {loading ? (
                      <div className="px-4 py-5 sm:p-6 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="mt-3 text-gray-700">Loading patients...</p>
                      </div>
                    ) : recentPatients.length > 0 ? (
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
                                Date Added
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Therapist
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
                            {recentPatients.map((patient) => (
                              <tr key={patient.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                      <div className="h-10 w-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-600 font-semibold">
                                        {patient.patientName ? patient.patientName.charAt(0) : 'P'}
                                      </div>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">
                                        {patient.patientName}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{patient.condition}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{formatLocalDate(patient.date)}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{patient.therapistName || 'Not Assigned'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    patient.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                                    patient.approvalStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                                    patient.approvalStatus === 'denied' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {patient.approvalStatus ? patient.approvalStatus.charAt(0).toUpperCase() + patient.approvalStatus.slice(1) : 'Unknown'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <Link to={`/doctor/patients/${patient.id}`} className="text-purple-600 hover:text-purple-900 mr-4">
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No patients yet</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Get started by adding a new patient.
                        </p>
                        <div className="mt-6">
                          <Link
                            to="/doctor/patients/new"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          >
                            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add Patient
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
                    ) : recentReports.length > 0 ? (
                      <div className="space-y-4">
                        {recentReports.map((report) => (
                          <div key={report.id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">{report.patientName} - {report.condition}</h4>
                                <p className="text-sm text-gray-500">Submitted by {report.therapistName} on {formatLocalDate(report.submittedDate)}</p>
                              </div>
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                report.status === 'new' ? 'bg-green-100 text-green-800' :
                                report.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">
                              {report.summary}
                            </p>
                            <div className="mt-3">
                              <Link to={`/reports/${report.id}`} className="text-sm font-medium text-primary-600 hover:text-primary-500">
                                View full report →
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No reports yet</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Treatment reports will appear here once therapists submit them.
                        </p>
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
    </DashboardLayout>
  );
};

export default DoctorDashboard;