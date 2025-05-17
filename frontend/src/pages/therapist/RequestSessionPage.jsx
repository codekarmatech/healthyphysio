import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import appointmentService from '../../services/appointmentService';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import { formatDate } from '../../utils/dateUtils';

const RequestSessionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // We'll use this in the toast messages
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [error, setError] = useState(null);

  // Fetch therapist's appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        // Get upcoming and today's appointments
        const response = await appointmentService.getUpcoming();
        
        // Filter to only show appointments that are scheduled or rescheduled
        const filteredAppointments = response.data.filter(
          app => app.status === 'scheduled' || app.status === 'rescheduled'
        );
        
        setAppointments(filteredAppointments);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Failed to load appointments. Please try again.');
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedAppointment) {
      toast.error(`${user.firstName}, please select an appointment`);
      return;
    }

    try {
      setSubmitting(true);
      
      // In a real implementation, this would call an API endpoint to request a session
      // For now, we'll simulate a successful request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Thank you ${user.firstName}, your session request for appointment ${selectedAppointment} has been submitted`);
      setSubmitting(false);
      
      // Navigate back after successful submission
      setTimeout(() => {
        navigate('/therapist/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error submitting session request:', err);
      toast.error(`Sorry ${user.firstName}, we couldn't submit your session request. Please try again.`);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Request Session">
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Request Session">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={() => navigate('/therapist/dashboard')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Request Session Creation">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Request Session Creation</h1>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              If you need a session created for an appointment, please select the appointment below and provide any relevant notes.
              An administrator will review your request and create the session for you.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="appointment">
                Select Appointment <span className="text-red-500">*</span>
              </label>
              <select
                id="appointment"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={selectedAppointment}
                onChange={(e) => setSelectedAppointment(e.target.value)}
                disabled={submitting}
                required
              >
                <option value="">-- Select an appointment --</option>
                {appointments.map((appointment) => (
                  <option key={appointment.id} value={appointment.id}>
                    {formatDate(new Date(appointment.datetime), 'MMM dd, yyyy HH:mm')} - {appointment.patient_details?.user?.first_name} {appointment.patient_details?.user?.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
                Additional Notes
              </label>
              <textarea
                id="notes"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows="4"
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                disabled={submitting}
                placeholder="Please provide any additional information that might be helpful"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/therapist/dashboard')}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RequestSessionPage;