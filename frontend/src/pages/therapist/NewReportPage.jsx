import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import { toast } from 'react-toastify';
import { reportsService, visitsService, locationService } from '../../services/visitsService';
import { formatDate } from '../../utils/dateUtils';

const NewReportPage = () => {
  const { user, therapistProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [patients, setPatients] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [timeWarning, setTimeWarning] = useState(null);
  const [error, setError] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    patient: '',
    visit: '',
    therapist_notes: '',
    treatment_provided: '',
    patient_progress: '',
    pain_level_before: '',
    pain_level_after: '',
    mobility_assessment: '',
    recommendations: '',
    next_session_goals: ''
  });

  // Get current location
  useEffect(() => {
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
          },
          (error) => {
            console.error('Error getting location:', error);
            setLocationError('Unable to get your current location. Please enable location services.');
          }
        );
      } else {
        setLocationError('Geolocation is not supported by this browser.');
      }
    };

    getLocation();
  }, []);

  // Fetch patients for the therapist
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);

        // Get therapist ID from user object - use therapistProfile.id for proper role-based access control
        const therapistId = therapistProfile?.id || user.therapist_id || user.id;

        // In a real implementation, we would fetch the therapist's patients
        // For now, we'll use a mock API call
        const response = await fetch(`/api/users/therapists/${therapistId}/patients/`);

        if (response.ok) {
          const data = await response.json();
          setPatients(data);
        } else {
          // If API call fails, show error
          console.error('Failed to fetch patients');
          setError('Failed to load patients. Please try again.');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError('Failed to load patients. Please try again.');
        setLoading(false);
      }
    };

    fetchPatients();
  }, [therapistProfile?.id, user.therapist_id, user.id]);

  // Fetch visits when patient is selected
  useEffect(() => {
    const fetchVisits = async () => {
      if (!formData.patient) return;

      try {
        setLoadingVisits(true);

        // Fetch visits for the selected patient
        const response = await visitsService.getByPatient(formData.patient);

        if (response && response.data) {
          // Filter visits to only include those within the last 12 hours
          const now = new Date();
          const twelveHoursAgo = new Date(now.getTime() - (12 * 60 * 60 * 1000));

          const recentVisits = response.data.filter(visit => {
            const visitEndTime = visit.scheduled_end ? new Date(visit.scheduled_end) : null;
            if (!visitEndTime) return false;

            // Check if visit ended within the last 12 hours
            return visitEndTime > twelveHoursAgo;
          });

          setVisits(recentVisits);

          // Set time warning if needed
          if (recentVisits.length > 0) {
            const mostRecentVisit = recentVisits.sort((a, b) =>
              new Date(b.scheduled_end) - new Date(a.scheduled_end)
            )[0];

            const visitEndTime = new Date(mostRecentVisit.scheduled_end);
            const hoursSinceEnd = (now - visitEndTime) / (1000 * 60 * 60);

            if (hoursSinceEnd > 1 && hoursSinceEnd <= 12) {
              setTimeWarning(`This report is being created ${hoursSinceEnd.toFixed(1)} hours after the visit ended. Late submissions will be flagged.`);
            } else if (hoursSinceEnd <= 1) {
              setTimeWarning(null);
            }
          }
        } else {
          setVisits([]);
        }

        setLoadingVisits(false);
      } catch (err) {
        console.error('Error fetching visits:', err);
        setVisits([]);
        setLoadingVisits(false);
      }
    };

    fetchVisits();
  }, [formData.patient]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle patient selection
  const handlePatientChange = (e) => {
    const patientId = e.target.value;
    setFormData(prev => ({
      ...prev,
      patient: patientId,
      visit: '' // Reset visit when patient changes
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    const requiredFields = ['patient', 'visit', 'therapist_notes', 'treatment_provided', 'patient_progress'];
    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(field => field.replace(/_/g, ' ')).join(', ');
      toast.error(`Please fill in the following required fields: ${fieldNames}`);
      return;
    }

    try {
      setSubmitting(true);

      // Get therapist ID from user object - use therapistProfile.id for proper role-based access control
      const therapistId = therapistProfile?.id || user.therapist_id || user.id;

      // Prepare report data
      const reportData = {
        therapist: therapistId,
        patient: formData.patient,
        visit: formData.visit,
        content: JSON.stringify({
          therapist_notes: formData.therapist_notes,
          treatment_provided: formData.treatment_provided,
          patient_progress: formData.patient_progress,
          pain_level_before: formData.pain_level_before,
          pain_level_after: formData.pain_level_after,
          mobility_assessment: formData.mobility_assessment,
          recommendations: formData.recommendations,
          next_session_goals: formData.next_session_goals
        }),
        report_date: new Date().toISOString().split('T')[0]
      };

      // Submit location data if available
      if (currentLocation) {
        await locationService.updateLocation({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          visit: formData.visit
        });
      }

      // Create the report
      const response = await reportsService.create(reportData);

      if (response && response.data) {
        toast.success('Report created successfully!');

        // Navigate to the report detail page
        navigate(`/therapist/report/${response.data.id}`);
      } else {
        toast.error('Failed to create report. Please try again.');
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Error creating report:', err);
      toast.error('Failed to create report. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Create New Report">
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Create New Report">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Create New Report</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {locationError && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
              <p className="font-bold">⚠️ Location Warning</p>
              <p>{locationError}</p>
              <p>Location verification is required for report submission.</p>
            </div>
          )}

          {timeWarning && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
              <p className="font-bold">⚠️ Late Submission Warning</p>
              <p>{timeWarning}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Patient Selection */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="patient">
                  Patient <span className="text-red-500">*</span>
                </label>
                <select
                  id="patient"
                  name="patient"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.patient}
                  onChange={handlePatientChange}
                  disabled={submitting}
                  required
                >
                  <option value="">Select a patient</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.user.full_name || `${patient.user.first_name} ${patient.user.last_name}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Visit Selection */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="visit">
                  Visit <span className="text-red-500">*</span>
                </label>
                <select
                  id="visit"
                  name="visit"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.visit}
                  onChange={handleInputChange}
                  disabled={submitting || loadingVisits || !formData.patient}
                  required
                >
                  <option value="">Select a visit</option>
                  {visits.map(visit => (
                    <option key={visit.id} value={visit.id}>
                      {formatDate(new Date(visit.scheduled_start), 'MMM dd, yyyy HH:mm')} -
                      {formatDate(new Date(visit.scheduled_end), 'HH:mm')}
                    </option>
                  ))}
                </select>
                {loadingVisits && <p className="text-sm text-gray-500 mt-1">Loading visits...</p>}
                {!loadingVisits && visits.length === 0 && formData.patient && (
                  <p className="text-sm text-red-500 mt-1">No recent visits found for this patient</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Therapist Notes */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="therapist_notes">
                  Therapist Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="therapist_notes"
                  name="therapist_notes"
                  rows="4"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.therapist_notes}
                  onChange={handleInputChange}
                  disabled={submitting}
                  placeholder="Enter your notes about the session"
                  required
                />
              </div>

              {/* Treatment Provided */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="treatment_provided">
                  Treatment Provided <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="treatment_provided"
                  name="treatment_provided"
                  rows="3"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.treatment_provided}
                  onChange={handleInputChange}
                  disabled={submitting}
                  placeholder="Describe the treatment provided during this session"
                  required
                />
              </div>

              {/* Patient Progress */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="patient_progress">
                  Patient Progress <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="patient_progress"
                  name="patient_progress"
                  rows="3"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.patient_progress}
                  onChange={handleInputChange}
                  disabled={submitting}
                  placeholder="Describe the patient's progress"
                  required
                />
              </div>

              {/* Pain Levels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pain_level_before">
                    Pain Level Before (0-10)
                  </label>
                  <input
                    type="number"
                    id="pain_level_before"
                    name="pain_level_before"
                    min="0"
                    max="10"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={formData.pain_level_before}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pain_level_after">
                    Pain Level After (0-10)
                  </label>
                  <input
                    type="number"
                    id="pain_level_after"
                    name="pain_level_after"
                    min="0"
                    max="10"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={formData.pain_level_after}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Mobility Assessment */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mobility_assessment">
                  Mobility Assessment
                </label>
                <textarea
                  id="mobility_assessment"
                  name="mobility_assessment"
                  rows="3"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.mobility_assessment}
                  onChange={handleInputChange}
                  disabled={submitting}
                  placeholder="Assess the patient's mobility"
                />
              </div>

              {/* Recommendations */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="recommendations">
                  Recommendations
                </label>
                <textarea
                  id="recommendations"
                  name="recommendations"
                  rows="3"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.recommendations}
                  onChange={handleInputChange}
                  disabled={submitting}
                  placeholder="Provide recommendations for the patient's home care"
                />
              </div>

              {/* Next Session Goals */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="next_session_goals">
                  Next Session Goals
                </label>
                <textarea
                  id="next_session_goals"
                  name="next_session_goals"
                  rows="3"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={formData.next_session_goals}
                  onChange={handleInputChange}
                  disabled={submitting}
                  placeholder="Set goals for the next session"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={() => navigate('/therapist/reports')}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={submitting || locationError}
              >
                {submitting ? 'Creating...' : 'Create Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewReportPage;
