import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import sessionService from '../../services/sessionService';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import { formatDate } from '../../utils/dateUtils';

const PendingReportsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pendingSessions, setPendingSessions] = useState([]);
  const [error, setError] = useState(null);

  // Fetch pending reports
  useEffect(() => {
    const fetchPendingReports = async () => {
      try {
        setLoading(true);
        const response = await sessionService.getPendingReports();
        setPendingSessions(response.data);

        // Show success message if there are pending reports
        if (response.data.length > 0) {
          toast.info(`Hello ${user.firstName}, you have ${response.data.length} pending report(s) to complete.`);
        } else {
          toast.success(`Hello ${user.firstName}, you have no pending reports to complete.`);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching pending reports:', err);
        setError('Failed to load pending reports. Please try again.');
        toast.error(`Sorry ${user.firstName}, we couldn't load your pending reports. Please try again.`);
        setLoading(false);
      }
    };

    fetchPendingReports();
  }, [user.firstName]);

  if (loading) {
    return (
      <DashboardLayout title="Pending Reports">
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Pending Reports - ${user.firstName} ${user.lastName}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Pending Session Reports</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {pendingSessions.length === 0 ? (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              No pending reports. All your sessions have been documented.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Date</th>
                    <th className="py-3 px-6 text-left">Patient</th>
                    <th className="py-3 px-6 text-left">Session Code</th>
                    <th className="py-3 px-6 text-left">Status</th>
                    <th className="py-3 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                  {pendingSessions.map(session => (
                    <tr key={session.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6 text-left">
                        {formatDate(new Date(session.local_datetime), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3 px-6 text-left">
                        {session.appointment_details?.patient_details?.user?.first_name} {session.appointment_details?.patient_details?.user?.last_name}
                      </td>
                      <td className="py-3 px-6 text-left">
                        {session.appointment_details?.session_code}
                      </td>
                      <td className="py-3 px-6 text-left">
                        <span className={`py-1 px-3 rounded-full text-xs ${
                          session.report_status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                          session.report_status === 'submitted' ? 'bg-green-200 text-green-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {session.report_status}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <Link
                          to={`/therapist/report/${session.id}`}
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs"
                        >
                          {session.report_status === 'pending' ? 'Complete Report' : 'View Report'}
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
    </DashboardLayout>
  );
};

export default PendingReportsPage;
