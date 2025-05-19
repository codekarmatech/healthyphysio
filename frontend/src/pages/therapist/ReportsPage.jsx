import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import { toast } from 'react-toastify';
import { reportsService } from '../../services/visitsService';
import { formatDate } from '../../utils/dateUtils';

const ReportsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'submitted', 'approved'
  const [isMockData, setIsMockData] = useState(false);

  // Fetch reports from the API
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);

        // Get therapist ID from user object
        const therapistId = user.therapist_id || user.id;

        // Fetch reports from the API
        const response = await reportsService.getByTherapist(therapistId);

        if (response && response.data) {
          // Format the data for display
          const formattedReports = response.data.map(report => ({
            id: report.id,
            patientName: report.patient_details?.user?.full_name || 'Unknown Patient',
            sessionDate: report.report_date,
            submittedDate: report.submitted_at,
            status: report.status,
            visitId: report.visit,
            sessionId: report.session,
            // Additional data for detailed view
            content: report.content,
            therapistId: report.therapist,
            patientId: report.patient,
            reviewedAt: report.reviewed_at,
            reviewNotes: report.review_notes,
            // Flag to indicate this is real data
            isMockData: false
          }));

          setReports(formattedReports);
          setIsMockData(false);
          toast.success(`Welcome ${user.firstName}, your reports have been loaded.`);
        } else {
          // If no data is returned, use empty array
          setReports([]);
          toast.info(`Welcome ${user.firstName}, you don't have any reports yet.`);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching reports:', err);

        // If API call fails, show error and use empty array
        setError('Failed to load reports. Please try again.');
        toast.error(`Sorry ${user.firstName}, we couldn't load your reports. Please try again.`);
        setReports([]);
        setLoading(false);
      }
    };

    fetchReports();
  }, [user.firstName, user.therapist_id, user.id]);

  // Filter reports based on active tab
  const filteredReports = reports.filter(report => {
    if (activeTab === 'all') return true;
    return report.status === activeTab;
  });

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'approved':
        return 'bg-green-200 text-green-800';
      case 'submitted':
        return 'bg-blue-200 text-blue-800';
      case 'pending':
        return 'bg-yellow-200 text-yellow-800';
      case 'flagged':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <React.Fragment>
      <DashboardLayout title={`Reports - ${user.firstName} ${user.lastName}`}>
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Session Reports</h1>
              <button
                onClick={() => navigate('/therapist/reports/new')}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
              >
                <span className="mr-2">+</span> Create New Report
              </button>
            </div>

            {/* Warning for mock data - only shown if using mock data */}
            {isMockData && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                <p className="font-bold">⚠️ Mock Data Warning</p>
                <p>The data displayed below is sample mock data for demonstration purposes only and does not reflect actual database records.
                Clicking on actions may result in 404 errors as these records don't exist in the database.</p>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b mb-6">
              <button
                className={`py-2 px-4 font-medium ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                onClick={() => setActiveTab('all')}
              >
                All Reports
              </button>
              <button
                className={`py-2 px-4 font-medium ${activeTab === 'pending' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                onClick={() => setActiveTab('pending')}
              >
                Pending
              </button>
              <button
                className={`py-2 px-4 font-medium ${activeTab === 'submitted' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                onClick={() => setActiveTab('submitted')}
              >
                Submitted
              </button>
              <button
                className={`py-2 px-4 font-medium ${activeTab === 'approved' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                onClick={() => setActiveTab('approved')}
              >
                Approved
              </button>
              <button
                className={`py-2 px-4 font-medium ${activeTab === 'flagged' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                onClick={() => setActiveTab('flagged')}
              >
                Flagged
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {filteredReports.length === 0 ? (
              <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
                No reports found in this category.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                      <th className="py-3 px-6 text-left">Patient</th>
                      <th className="py-3 px-6 text-left">Session Date</th>
                      <th className="py-3 px-6 text-left">Submitted Date</th>
                      <th className="py-3 px-6 text-left">Status</th>
                      <th className="py-3 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-sm">
                    {filteredReports.map(report => (
                      <tr key={report.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-6 text-left">
                          {report.patientName}
                        </td>
                        <td className="py-3 px-6 text-left">
                          {report.sessionDate ? formatDate(new Date(report.sessionDate), 'MMM dd, yyyy') : 'N/A'}
                        </td>
                        <td className="py-3 px-6 text-left">
                          {report.submittedDate ? formatDate(new Date(report.submittedDate), 'MMM dd, yyyy HH:mm') : 'Not submitted'}
                        </td>
                        <td className="py-3 px-6 text-left">
                          <span className={`py-1 px-3 rounded-full text-xs ${getStatusBadgeClass(report.status)}`}>
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-center">
                          <div className="flex justify-center space-x-2">
                            <Link
                              to={`/therapist/report/${report.id}`}
                              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs"
                            >
                              View
                            </Link>
                            {report.status === 'pending' && (
                              <Link
                                to={`/therapist/report/${report.id}`}
                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs"
                              >
                                Complete
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      </DashboardLayout>
    </React.Fragment>
  );
};

export default ReportsPage;
