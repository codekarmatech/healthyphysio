import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MonthSelector from '../../components/attendance/MonthSelector';
import AttendanceApproval from '../../components/attendance/AttendanceApproval';
import api from '../../services/api';

/**
 * Admin page for managing attendance
 */
const AdminAttendancePage = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch therapists on component mount
  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get all therapists
        const response = await api.get('/users/therapists/');
        setTherapists(response.data.results || response.data);
        
        // Select the first therapist by default
        if (response.data.results?.length > 0 || response.data?.length > 0) {
          setSelectedTherapist((response.data.results || response.data)[0].id);
        }
      } catch (err) {
        console.error('Error fetching therapists:', err);
        setError('Failed to load therapists. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTherapists();
  }, []);

  // Handle month navigation
  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  // Handle therapist selection
  const handleTherapistChange = (e) => {
    setSelectedTherapist(e.target.value);
  };

  // Handle attendance approval
  const handleAttendanceApproved = () => {
    // Refresh data if needed
  };

  // Check if user has admin role
  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-300 rounded-md p-4">
          <h2 className="text-lg font-medium text-red-800">Access Denied</h2>
          <p className="mt-2 text-sm text-red-700">
            You do not have permission to access this page. This page is only available to administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Attendance Management</h1>
      
      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          {/* Therapist selector */}
          <div className="mb-4 md:mb-0">
            <label htmlFor="therapist-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Therapist
            </label>
            <select
              id="therapist-select"
              value={selectedTherapist || ''}
              onChange={handleTherapistChange}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              disabled={loading || therapists.length === 0}
            >
              {loading ? (
                <option>Loading therapists...</option>
              ) : therapists.length === 0 ? (
                <option>No therapists found</option>
              ) : (
                therapists.map(therapist => (
                  <option key={therapist.id} value={therapist.id}>
                    {therapist.user.first_name} {therapist.user.last_name}
                  </option>
                ))
              )}
            </select>
          </div>
          
          {/* Month selector */}
          <MonthSelector
            currentDate={currentDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />
        </div>
        
        {/* Attendance approval component */}
        {selectedTherapist && (
          <AttendanceApproval
            therapistId={selectedTherapist}
            year={currentDate.getFullYear()}
            month={currentDate.getMonth() + 1}
            onApproved={handleAttendanceApproved}
          />
        )}
      </div>
    </div>
  );
};

export default AdminAttendancePage;