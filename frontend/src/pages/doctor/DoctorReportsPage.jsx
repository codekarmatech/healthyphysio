import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { formatLocalDate } from '../../utils/dateUtils';
import doctorService from '../../services/doctorService';

// Mock data for reports - will be replaced with API data when backend endpoint is ready
const MOCK_REPORTS = [
  {
    id: 1,
    patient_name: 'John Smith',
    condition: 'Lower Back Pain',
    therapist_name: 'Dr. Sarah Johnson',
    submitted_date: '2024-01-18',
    status: 'new',
    summary: 'Patient showing significant improvement after 4 sessions. Pain reduced from 8/10 to 4/10.',
    session_count: 4
  },
  {
    id: 2,
    patient_name: 'Emily Davis',
    condition: 'Shoulder Rehabilitation',
    therapist_name: 'Dr. Michael Chen',
    submitted_date: '2024-01-15',
    status: 'reviewed',
    summary: 'Range of motion improved by 15 degrees. Patient able to perform daily activities with minimal discomfort.',
    session_count: 6
  }
];

const DoctorReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const data = await doctorService.getReports();
        setReports(Array.isArray(data) ? data : data?.results || []);
      } catch (err) {
        console.log('Reports API not available, using mock data');
        // Use mock data when API is not available
        setReports(MOCK_REPORTS);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const filteredReports = reports.filter(report => {
    const matchesFilter = filter === 'all' || report.status === filter;
    const matchesSearch = searchTerm === '' || 
      report.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.therapist_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.condition?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'new':
        return 'bg-green-100 text-green-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout title="Patient Reports">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Patient Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            View treatment reports submitted by therapists for your patients
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by patient, therapist, or condition..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('new')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'new'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              New
            </button>
            <button
              onClick={() => setFilter('reviewed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'reviewed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Reviewed
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reports...</p>
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {report.patient_name || 'Unknown Patient'} - {report.condition || 'Treatment Report'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Submitted by {report.therapist_name || 'Therapist'} on {report.submitted_date ? formatLocalDate(report.submitted_date) : 'N/A'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadgeClass(report.status)}`}>
                      {report.status ? report.status.charAt(0).toUpperCase() + report.status.slice(1) : 'Unknown'}
                    </span>
                  </div>

                  {report.summary && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">{report.summary}</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {report.session_count && `${report.session_count} sessions completed`}
                    </div>
                    <button
                      onClick={() => alert('Full report view coming soon. Report ID: ' + report.id)}
                      className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                    >
                      View Full Report →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No reports found</h3>
            <p className="mt-2 text-sm text-gray-500">
              {searchTerm || filter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Treatment reports will appear here once therapists submit them for your patients.'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorReportsPage;
