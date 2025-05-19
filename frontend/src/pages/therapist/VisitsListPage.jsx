import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { visitsService } from '../../services/visitsService';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import { toast } from 'react-toastify';

/**
 * Visits List Page
 *
 * Displays a list of visits for the therapist, with filtering options
 * and links to view visit details.
 */
const VisitsListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('upcoming'); // upcoming, past, all
  const [statusFilter, setStatusFilter] = useState('all'); // all, scheduled, en_route, arrived, in_session, completed, cancelled

  // Fetch visits
  useEffect(() => {
    const fetchVisits = async () => {
      try {
        setLoading(true);

        // Get therapist ID from user object
        const therapistId = user.therapist_id || user.id;

        // Prepare query parameters
        const params = { therapist: therapistId };

        // Add date filters
        const now = new Date().toISOString();
        if (filter === 'upcoming') {
          params.scheduled_start__gte = now;
        } else if (filter === 'past') {
          params.scheduled_start__lt = now;
        }

        // Add status filter
        if (statusFilter !== 'all') {
          params.status = statusFilter;
        }

        // Fetch visits
        const response = await visitsService.getAll(params);

        // Sort visits by scheduled_start
        const sortedVisits = response.data.sort((a, b) => {
          if (filter === 'upcoming') {
            return new Date(a.scheduled_start) - new Date(b.scheduled_start);
          } else {
            return new Date(b.scheduled_start) - new Date(a.scheduled_start);
          }
        });

        setVisits(sortedVisits);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching visits:', err);
        setError('Failed to load visits. Please try again.');
        setLoading(false);
      }
    };

    if (user) {
      fetchVisits();
    }
  }, [user, filter, statusFilter]);

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'en_route':
        return 'bg-purple-100 text-purple-800';
      case 'arrived':
        return 'bg-indigo-100 text-indigo-800';
      case 'in_session':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle start visit
  const handleStartVisit = async (visitId) => {
    try {
      await visitsService.startVisit(visitId);

      // Update local state
      setVisits(visits.map(visit =>
        visit.id === visitId
          ? { ...visit, status: 'arrived', actual_start: new Date().toISOString() }
          : visit
      ));

      toast.success('Visit started successfully');

      // Navigate to the visit tracking page after starting the visit
      navigate(`/therapist/visits/${visitId}`);
    } catch (err) {
      console.error('Error starting visit:', err);
      toast.error('Failed to start visit. Please try again.');
    }
  };

  // Handle cancel visit
  const handleCancelVisit = async (visitId) => {
    if (!window.confirm('Are you sure you want to cancel this visit?')) {
      return;
    }

    try {
      await visitsService.cancelVisit(visitId);

      // Update local state
      setVisits(visits.map(visit =>
        visit.id === visitId
          ? { ...visit, status: 'cancelled' }
          : visit
      ));

      toast.success('Visit cancelled successfully');
    } catch (err) {
      console.error('Error cancelling visit:', err);
      toast.error('Failed to cancel visit. Please try again.');
    }
  };

  return (
    <DashboardLayout title="Visits">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">Visit Tracking</h1>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Time Filter */}
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 rounded ${filter === 'upcoming' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => handleFilterChange('upcoming')}
              >
                Upcoming
              </button>
              <button
                className={`px-4 py-2 rounded ${filter === 'past' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => handleFilterChange('past')}
              >
                Past
              </button>
              <button
                className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => handleFilterChange('all')}
              >
                All
              </button>
            </div>

            {/* Status Filter */}
            <div>
              <select
                className="px-4 py-2 border border-gray-300 rounded"
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <option value="all">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="en_route">En Route</option>
                <option value="arrived">Arrived</option>
                <option value="in_session">In Session</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        ) : visits.length === 0 ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            No visits found for the selected filters.
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left">Patient</th>
                    <th className="py-3 px-4 text-left">Scheduled Time</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Type</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {visits.map(visit => (
                    <tr key={visit.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-600 font-semibold">
                            {visit.patient_details?.user?.first_name?.charAt(0) || '?'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {visit.patient_details?.user?.first_name} {visit.patient_details?.user?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {visit.appointment_details?.issue || 'No issue specified'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-900">{formatDate(visit.scheduled_start)}</div>
                        <div className="text-sm text-gray-500">
                          {visit.actual_start ? `Started: ${formatDate(visit.actual_start)}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(visit.status)}`}>
                          {visit.status.charAt(0).toUpperCase() + visit.status.slice(1).replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-900">
                          {visit.appointment_details?.type || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <Link
                            to={`/therapist/visits/${visit.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </Link>

                          {visit.status === 'scheduled' && (
                            <button
                              onClick={() => handleStartVisit(visit.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Start
                            </button>
                          )}

                          {['scheduled', 'en_route'].includes(visit.status) && (
                            <button
                              onClick={() => handleCancelVisit(visit.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Cancel
                            </button>
                          )}

                          {visit.status === 'completed' && !visit.reports?.length && (
                            <Link
                              to={`/therapist/report/${visit.id}`}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Submit Report
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VisitsListPage;
