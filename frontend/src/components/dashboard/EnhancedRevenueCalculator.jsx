import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import financialDashboardService from '../../services/financialDashboardService';

/**
 * Enhanced Revenue Calculator Component
 * Provides a comprehensive financial management system that connects
 * patient records, appointments, and financial distributions
 */
const EnhancedRevenueCalculator = () => {
  const { user } = useAuth();
  // Use isAdmin to conditionally render admin-only features
  const isAdmin = user?.role === 'admin';
  const searchTimeoutRef = useRef(null);

  // State for patient selection
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [patientsPage, setPatientsPage] = useState(1);
  const [patientsPageSize] = useState(10);
  const [totalPatients, setTotalPatients] = useState(0);
  const [isMockPatientData, setIsMockPatientData] = useState(false);

  // State for therapist selection
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [therapistSearchQuery, setTherapistSearchQuery] = useState('');
  const [isSearchingTherapists, setIsSearchingTherapists] = useState(false);
  const [therapistsPage, setTherapistsPage] = useState(1);
  const [therapistsPageSize] = useState(10);
  const [totalTherapists, setTotalTherapists] = useState(0);
  const [isMockTherapistData, setIsMockTherapistData] = useState(false);

  // State for appointment selection
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [includePaidAppointments, setIncludePaidAppointments] = useState(false);
  const [appointmentAttendanceFilter, setAppointmentAttendanceFilter] = useState('all');
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [isMockAppointmentData, setIsMockAppointmentData] = useState(false);

  // State for total fee
  const [totalFee, setTotalFee] = useState('');
  const [useAppointmentFee, setUseAppointmentFee] = useState(true);
  const [isManualFeeOverride, setIsManualFeeOverride] = useState(false);

  // State for distribution configs
  const [distributionConfigs, setDistributionConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState('');

  // State for manual distribution
  const [useManualDistribution, setUseManualDistribution] = useState(false);
  const [distributionType, setDistributionType] = useState('percentage');
  const [platformFee] = useState(3); // Fixed at 3%, not changeable
  const [adminValue, setAdminValue] = useState('');
  const [therapistValue, setTherapistValue] = useState('');
  const [doctorValue, setDoctorValue] = useState('');
  const [autoCalculateRole, setAutoCalculateRole] = useState('doctor'); // Which role to auto-calculate

  // State for payment details
  const [paymentStatus, setPaymentStatus] = useState('completed');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // State for calculation result
  const [calculationResult, setCalculationResult] = useState(null);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch patients with debounced search
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set a new timeout to fetch patients after 500ms of no typing
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingPatients(true);
      try {
        const data = await financialDashboardService.getPatients(
          patientSearchQuery,
          patientsPage,
          patientsPageSize
        );
        setPatients(data.results || []);
        setTotalPatients(data.count || 0);
        setIsMockPatientData(data.is_mock_data || false);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError('Failed to load patients. Using mock data instead.');
        const mockData = financialDashboardService.getMockPatients();
        setPatients(mockData);
        setTotalPatients(mockData.length);
        setIsMockPatientData(true);
      } finally {
        setIsSearchingPatients(false);
      }
    }, 500);

    // Cleanup function to clear the timeout if the component unmounts
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [patientSearchQuery, patientsPage, patientsPageSize]);

  // Fetch therapists with debounced search
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set a new timeout to fetch therapists after 500ms of no typing
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingTherapists(true);
      try {
        const data = await financialDashboardService.getTherapists(
          therapistSearchQuery,
          therapistsPage,
          therapistsPageSize
        );
        setTherapists(data.results || []);
        setTotalTherapists(data.count || 0);
        setIsMockTherapistData(data.is_mock_data || false);
      } catch (err) {
        console.error('Error fetching therapists:', err);
        setError('Failed to load therapists. Using mock data instead.');
        const mockData = financialDashboardService.getMockTherapists();
        setTherapists(mockData);
        setTotalTherapists(mockData.length);
        setIsMockTherapistData(true);
      } finally {
        setIsSearchingTherapists(false);
      }
    }, 500);

    // Cleanup function to clear the timeout if the component unmounts
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [therapistSearchQuery, therapistsPage, therapistsPageSize]);

  // Fetch distribution configs on component mount
  useEffect(() => {
    const fetchDistributionConfigs = async () => {
      try {
        const data = await financialDashboardService.getDistributionConfigs();
        setDistributionConfigs(data);
        if (data.length > 0) {
          const defaultConfig = data.find(config => config.is_default) || data[0];
          setSelectedConfig(defaultConfig.id);
        }
      } catch (err) {
        console.error('Error fetching distribution configs:', err);
        setError('Failed to load distribution configurations. Please try again later.');
      }
    };

    fetchDistributionConfigs();
  }, []);

  // Fetch appointments when patient is selected
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!selectedPatient) {
        setAppointments([]);
        setSelectedAppointment(null);
        return;
      }

      setIsLoadingAppointments(true);
      try {
        const data = await financialDashboardService.getPatientAppointments(
          selectedPatient.id,
          includePaidAppointments,
          appointmentAttendanceFilter
        );
        setAppointments(data.results || []);
        setIsMockAppointmentData(data.is_mock_data || false);
        setSelectedAppointment(null);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Failed to load appointments. Using mock data instead.');
        const mockAppointments = financialDashboardService.getMockPatientAppointments(selectedPatient.id);
        setAppointments(mockAppointments);
        setIsMockAppointmentData(true);
      } finally {
        setIsLoadingAppointments(false);
      }
    };

    fetchAppointments();
  }, [selectedPatient, includePaidAppointments, appointmentAttendanceFilter]);

  // Update fee when appointment is selected
  useEffect(() => {
    if (selectedAppointment && useAppointmentFee) {
      setTotalFee(selectedAppointment.fee.toString());
      setIsManualFeeOverride(false);
    }
  }, [selectedAppointment, useAppointmentFee]);

  // Calculate total percentage for validation
  const calculateTotalPercentage = () => {
    if (distributionType !== 'percentage') return 100;

    const admin = parseFloat(adminValue) || 0;
    const therapist = parseFloat(therapistValue) || 0;
    const doctor = parseFloat(doctorValue) || 0;

    return admin + therapist + doctor;
  };

  // Auto-calculate the third role's value (percentage or fixed amount) - wrapped in useCallback
  const calculateThirdRoleValue = useCallback(() => {
    let total = 0;
    let thirdRoleValue = 0;

    const admin = parseFloat(adminValue) || 0;
    const therapist = parseFloat(therapistValue) || 0;
    const doctor = parseFloat(doctorValue) || 0;
    const fee = parseFloat(totalFee) || 0;

    if (distributionType === 'percentage') {
      // Calculate for percentage distribution
      if (autoCalculateRole === 'admin') {
        total = therapist + doctor;
        thirdRoleValue = total > 100 ? 0 : 100 - total;
        if (adminValue !== thirdRoleValue.toString()) {
          setAdminValue(thirdRoleValue.toString());
        }
      } else if (autoCalculateRole === 'therapist') {
        total = admin + doctor;
        thirdRoleValue = total > 100 ? 0 : 100 - total;
        if (therapistValue !== thirdRoleValue.toString()) {
          setTherapistValue(thirdRoleValue.toString());
        }
      } else if (autoCalculateRole === 'doctor') {
        total = admin + therapist;
        thirdRoleValue = total > 100 ? 0 : 100 - total;
        if (doctorValue !== thirdRoleValue.toString()) {
          setDoctorValue(thirdRoleValue.toString());
        }
      }
    } else if (distributionType === 'fixed' && fee > 0) {
      // Calculate for fixed amount distribution
      // First, calculate platform fee (fixed at 3%)
      const platformFeeAmount = (fee * 3) / 100;
      const distributableAmount = fee - platformFeeAmount;

      if (autoCalculateRole === 'admin') {
        total = therapist + doctor;
        thirdRoleValue = total > distributableAmount ? 0 : distributableAmount - total;
        if (adminValue !== thirdRoleValue.toFixed(2)) {
          setAdminValue(thirdRoleValue.toFixed(2));
        }
      } else if (autoCalculateRole === 'therapist') {
        total = admin + doctor;
        thirdRoleValue = total > distributableAmount ? 0 : distributableAmount - total;
        if (therapistValue !== thirdRoleValue.toFixed(2)) {
          setTherapistValue(thirdRoleValue.toFixed(2));
        }
      } else if (autoCalculateRole === 'doctor') {
        total = admin + therapist;
        thirdRoleValue = total > distributableAmount ? 0 : distributableAmount - total;
        if (doctorValue !== thirdRoleValue.toFixed(2)) {
          setDoctorValue(thirdRoleValue.toFixed(2));
        }
      }
    }

    return thirdRoleValue;
  }, [
    distributionType,
    adminValue,
    therapistValue,
    doctorValue,
    autoCalculateRole,
    totalFee,
    setAdminValue,
    setTherapistValue,
    setDoctorValue
  ]);

  // Handle real-time calculation - wrapped in useCallback to prevent recreation on every render
  const handleRealTimeCalculation = useCallback(() => {
    if (!totalFee) return;

    const fee = parseFloat(totalFee);
    if (isNaN(fee) || fee <= 0) return;

    // Calculate platform fee (fixed at 3%)
    const platformFeeAmount = (fee * 3) / 100;
    const distributableAmount = fee - platformFeeAmount;

    let adminAmount, therapistAmount, doctorAmount;

    if (useManualDistribution) {
      if (distributionType === 'percentage') {
        // Now calculate the actual amounts
        const admin = parseFloat(adminValue) || 0;
        const therapist = parseFloat(therapistValue) || 0;
        const doctor = parseFloat(doctorValue) || 0;

        // Only proceed if percentages add up to 100%
        const totalPct = admin + therapist + doctor;
        if (Math.abs(totalPct - 100) > 0.01) return;

        adminAmount = (distributableAmount * admin) / 100;
        therapistAmount = (distributableAmount * therapist) / 100;
        doctorAmount = (distributableAmount * doctor) / 100;
      } else {
        // Fixed amounts
        adminAmount = parseFloat(adminValue) || 0;
        therapistAmount = parseFloat(therapistValue) || 0;
        doctorAmount = parseFloat(doctorValue) || 0;

        // Adjust if fixed amounts exceed distributable amount
        const totalFixed = adminAmount + therapistAmount + doctorAmount;
        if (totalFixed > distributableAmount) {
          const scaleFactor = distributableAmount / totalFixed;
          adminAmount *= scaleFactor;
          therapistAmount *= scaleFactor;
          doctorAmount *= scaleFactor;
        }
      }
    } else {
      // Can't do real-time calculation for selected config
      return;
    }

    // Check if admin amount is below threshold
    const belowThreshold = adminAmount < 400;

    setCalculationResult({
      admin: adminAmount,
      therapist: therapistAmount,
      doctor: doctorAmount,
      platform_fee: platformFeeAmount,
      total: fee,
      distributable_amount: distributableAmount,
      below_threshold: belowThreshold,
      // Add percentage values for display
      admin_percentage: parseFloat(adminValue) || 0,
      therapist_percentage: parseFloat(therapistValue) || 0,
      doctor_percentage: parseFloat(doctorValue) || 0
    });

    if (belowThreshold) {
      setWarning('Warning: Admin earnings are below the minimum threshold of ₹400.');
    } else {
      setWarning(null);
    }
  }, [
    totalFee,
    useManualDistribution,
    distributionType,
    adminValue,
    therapistValue,
    doctorValue
  ]);

  // Effects to trigger auto-calculation when values change
  useEffect(() => {
    if (autoCalculateRole === 'doctor' && useManualDistribution) {
      calculateThirdRoleValue();
    }
  }, [adminValue, therapistValue, distributionType, autoCalculateRole, useManualDistribution, calculateThirdRoleValue, totalFee]);

  useEffect(() => {
    if (autoCalculateRole === 'therapist' && useManualDistribution) {
      calculateThirdRoleValue();
    }
  }, [adminValue, doctorValue, distributionType, autoCalculateRole, useManualDistribution, calculateThirdRoleValue, totalFee]);

  useEffect(() => {
    if (autoCalculateRole === 'admin' && useManualDistribution) {
      calculateThirdRoleValue();
    }
  }, [therapistValue, doctorValue, distributionType, autoCalculateRole, useManualDistribution, calculateThirdRoleValue, totalFee]);

  // Effect for real-time calculation
  useEffect(() => {
    if (useManualDistribution) {
      handleRealTimeCalculation();
    }
  }, [useManualDistribution, handleRealTimeCalculation, totalFee, adminValue, therapistValue, doctorValue, distributionType]);

  // Handle patient selection
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setSelectedAppointment(null);
    setSelectedTherapist(null); // Clear selected therapist when patient changes
    // Clear any success message when changing patient
    setSuccess(null);
  };

  // Handle therapist selection
  const handleTherapistSelect = (therapist) => {
    setSelectedTherapist(therapist);
    // Clear any success message when changing therapist
    setSuccess(null);
  };

  // Handle pagination for patients
  const handlePatientsPageChange = (newPage) => {
    setPatientsPage(newPage);
  };

  // Handle pagination for therapists
  const handleTherapistsPageChange = (newPage) => {
    setTherapistsPage(newPage);
  };

  // Handle appointment selection
  const handleAppointmentSelect = (appointment) => {
    setSelectedAppointment(appointment);
    if (useAppointmentFee) {
      setTotalFee(appointment.fee.toString());
      setIsManualFeeOverride(false);
    }
    // Clear any success message when changing appointment
    setSuccess(null);
  };

  // Handle fee change
  const handleFeeChange = (e) => {
    setTotalFee(e.target.value);
    if (selectedAppointment && useAppointmentFee) {
      setIsManualFeeOverride(e.target.value !== selectedAppointment.fee.toString());
    }
  };

  // Handle calculate button click
  const handleCalculate = async () => {
    // Reset success message
    setSuccess(null);

    if (!totalFee) {
      setError('Please enter a total fee amount.');
      return;
    }

    if (useManualDistribution) {
      // For both distribution types, we need to ensure all values are set
      // Auto-calculate one last time to ensure values are up-to-date
      calculateThirdRoleValue();

      // Check if any value is missing
      if (!adminValue || !therapistValue || !doctorValue) {
        setError('Please enter values for all stakeholders.');
        return;
      }

      // Check if percentages add up to 100% for percentage distribution
      if (distributionType === 'percentage') {
        if (calculateTotalPercentage() !== 100) {
          setError('Percentage values must add up to 100%.');
          return;
        }
      }
    } else if (!selectedConfig) {
      setError('Please select a distribution configuration.');
      return;
    }

    // Check if warning is acknowledged
    if (calculationResult?.below_threshold && !confirmed) {
      setWarning('Admin earnings are below the minimum threshold of ₹400. Please confirm to proceed.');
      return;
    }

    try {
      const patientId = selectedPatient ? selectedPatient.id : null;
      const appointmentId = selectedAppointment ? selectedAppointment.id : null;

      const data = await financialDashboardService.calculateDistribution(
        parseFloat(totalFee),
        selectedConfig,
        useManualDistribution,
        distributionType,
        parseFloat(platformFee),
        parseFloat(adminValue),
        parseFloat(therapistValue),
        parseFloat(doctorValue),
        false, // Don't save configuration here
        '',
        patientId,
        appointmentId
      );

      setCalculationResult(data.distribution);
      setError(null);

      // Reset confirmation after successful calculation
      setConfirmed(false);

      // Check if admin amount is below threshold
      if (data.distribution.below_threshold) {
        setWarning('Warning: Admin earnings are below the minimum threshold of ₹400.');
      } else {
        setWarning(null);
      }
    } catch (err) {
      console.error('Error calculating revenue distribution:', err);
      setError('Failed to calculate revenue distribution. Please try again later.');
    }
  };

  // Handle apply distribution button click
  const handleApplyDistribution = async () => {
    if (!calculationResult) {
      setError('Please calculate the distribution first.');
      return;
    }

    if (!selectedPatient) {
      setError('Please select a patient.');
      return;
    }

    if (!selectedTherapist) {
      setError('Please select a therapist.');
      return;
    }

    if (!selectedAppointment) {
      setError('Please select an appointment or session.');
      return;
    }

    // Confirm if admin earnings are below threshold
    if (calculationResult.below_threshold && !confirmed) {
      setWarning('Admin earnings are below the minimum threshold of ₹400. Please confirm to proceed.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await financialDashboardService.applyDistribution(
        selectedAppointment.id,
        selectedPatient.id,
        selectedTherapist.id,
        calculationResult,
        paymentStatus,
        paymentMethod
      );

      if (result.is_mock_data) {
        setSuccess('Distribution successfully applied and saved! (Demo mode)');
      } else {
        setSuccess('Distribution successfully applied and saved!');
      }

      // Reset warning and error states
      setWarning(null);
      setError(null);
      setConfirmed(false);

      // Refresh appointments list to reflect the updated payment status
      setIsLoadingAppointments(true);
      try {
        const updatedAppointments = await financialDashboardService.getPatientAppointments(
          selectedPatient.id,
          includePaidAppointments,
          appointmentAttendanceFilter
        );
        setAppointments(updatedAppointments.results || []);
        setIsMockAppointmentData(updatedAppointments.is_mock_data || false);

        // Clear selected appointment if it's now paid and we're not showing paid appointments
        if (paymentStatus === 'completed' && !includePaidAppointments) {
          setSelectedAppointment(null);
        }
      } catch (err) {
        console.error('Error refreshing appointments:', err);
      } finally {
        setIsLoadingAppointments(false);
      }
    } catch (err) {
      console.error('Error applying distribution:', err);
      setError('Failed to apply distribution. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to format currency values
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(parseFloat(value));
  };

  // Helper function to get color for attendance status
  const getAttendanceStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'attended':
        return 'bg-green-100 text-green-800';
      case 'missed':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get color for payment status
  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle confirm button click
  const handleConfirm = () => {
    setConfirmed(true);
    // If we're confirming for calculation, run calculate again
    if (!calculationResult) {
      handleCalculate();
    }
    // If we're confirming for apply distribution, run apply distribution
    else {
      handleApplyDistribution();
    }
  };



  return (
    <div className="bg-white rounded-lg shadow-md p-5 md:p-7">

      {/* Error, Warning, and Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {warning && !confirmed && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded flex justify-between items-center">
          <span>{warning}</span>
          <button
            onClick={handleConfirm}
            className="ml-4 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
            disabled={isSubmitting}
          >
            Confirm Anyway
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Admin-only message */}
      {isAdmin && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded">
          <p className="text-sm font-medium">Admin Access: Full control over revenue distribution settings</p>
        </div>
      )}

      {/* Mock Data Indicators */}
      {(isMockPatientData || isMockTherapistData || isMockAppointmentData) && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          <p className="font-medium">Demo Mode</p>
          <p className="text-sm">
            {isMockPatientData && 'Using example patient data. '}
            {isMockTherapistData && 'Using example therapist data. '}
            {isMockAppointmentData && 'Using example appointment data. '}
            This is for demonstration purposes only.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Patient Selection */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-5 h-full">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Patient Selection</h3>

            {/* Patient Search */}
            <div className="mb-4">
              <label htmlFor="patient-search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Patient
              </label>
              <div className="flex mb-2">
                <input
                  id="patient-search"
                  type="text"
                  className="flex-grow rounded-l-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={patientSearchQuery}
                  onChange={(e) => setPatientSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or phone"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsSearchingPatients(true);
                    }
                  }}
                />
                <button
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-r-md"
                  onClick={() => setIsSearchingPatients(true)}
                  disabled={isSearchingPatients}
                >
                  {isSearchingPatients ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Searching
                    </span>
                  ) : (
                    'Search'
                  )}
                </button>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  onClick={() => {
                    setPatientSearchQuery('');
                    setIsSearchingPatients(true);
                  }}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded transition-colors duration-200"
                >
                  All Patients
                </button>
                <button
                  onClick={() => {
                    setPatientSearchQuery('pending');
                    setIsSearchingPatients(true);
                  }}
                  className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded transition-colors duration-200"
                >
                  Pending Payments
                </button>
                <button
                  onClick={() => {
                    setPatientSearchQuery('recent');
                    setIsSearchingPatients(true);
                  }}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors duration-200"
                >
                  Recent Patients
                </button>
              </div>

              {/* Search Tips */}
              <div className="text-xs text-gray-500 italic">
                Tip: Search by name, email, phone, or use the quick filters above
              </div>
            </div>

            {/* Patient List */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Patient
              </label>
              <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                {isSearchingPatients ? (
                  <div className="p-4 text-center text-gray-500">Searching...</div>
                ) : patients.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No patients found</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {patients.map((patient) => (
                      <li
                        key={patient.id}
                        className={`p-3 cursor-pointer hover:bg-gray-50 ${
                          selectedPatient?.id === patient.id ? 'bg-primary-50' : ''
                        }`}
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">{patient.user.first_name} {patient.user.last_name}</p>
                            <p className="text-sm text-gray-500">{patient.user.phone}</p>
                          </div>
                          {patient.pending_payments > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {patient.pending_payments} pending
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Pagination */}
              {totalPatients > patientsPageSize && (
                <div className="flex justify-between items-center mt-2 text-sm">
                  <button
                    onClick={() => handlePatientsPageChange(patientsPage - 1)}
                    disabled={patientsPage === 1 || isSearchingPatients}
                    className={`px-2 py-1 rounded ${
                      patientsPage === 1 || isSearchingPatients
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    Previous
                  </button>
                  <span className="text-gray-600">
                    Page {patientsPage} of {Math.ceil(totalPatients / patientsPageSize)}
                  </span>
                  <button
                    onClick={() => handlePatientsPageChange(patientsPage + 1)}
                    disabled={patientsPage >= Math.ceil(totalPatients / patientsPageSize) || isSearchingPatients}
                    className={`px-2 py-1 rounded ${
                      patientsPage >= Math.ceil(totalPatients / patientsPageSize) || isSearchingPatients
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* Selected Patient Details */}
            {selectedPatient && (
              <div className="p-4 bg-white rounded-md shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-800">Selected Patient</h4>
                  <button
                    onClick={() => {
                      setSelectedPatient(null);
                      setSelectedAppointment(null);
                      setSelectedTherapist(null);
                      setSuccess(null);
                    }}
                    className="text-gray-500 hover:text-red-500 transition-colors duration-200"
                    title="Clear selection"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-start">
                  <div className="bg-primary-100 text-primary-700 rounded-full h-10 w-10 flex items-center justify-center mr-3">
                    <span className="font-medium text-sm">
                      {selectedPatient.user.first_name.charAt(0)}
                      {selectedPatient.user.last_name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {selectedPatient.user.first_name} {selectedPatient.user.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedPatient.age} years, {selectedPatient.gender}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedPatient.user.phone}
                    </p>
                    <p className="text-sm text-gray-600">
                      Area: {selectedPatient.area_name || selectedPatient.area || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Medical History:</span> {selectedPatient.medical_history}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Total Sessions:</span> {selectedPatient.total_sessions}
                    </div>
                    <div>
                      <span className="font-medium">Attendance:</span> {selectedPatient.attendance_rate}%
                    </div>
                    <div>
                      <span className="font-medium">Last Visit:</span> {selectedPatient.last_appointment}
                    </div>
                    <div>
                      <span className="font-medium">Pending:</span> {selectedPatient.pending_payments}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle Column - Therapist Selection (Only visible when a patient is selected) */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-5 h-full">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Therapist Selection</h3>

            {selectedPatient ? (
              <>
                {/* Therapist Search */}
                <div className="mb-4">
                  <label htmlFor="therapist-search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search Therapist
                  </label>
                  <div className="flex mb-2">
                    <input
                      id="therapist-search"
                      type="text"
                      className="flex-grow rounded-l-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={therapistSearchQuery}
                      onChange={(e) => setTherapistSearchQuery(e.target.value)}
                      placeholder="Search by name or specialization"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setIsSearchingTherapists(true);
                        }
                      }}
                    />
                    <button
                      className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-r-md"
                      onClick={() => setIsSearchingTherapists(true)}
                      disabled={isSearchingTherapists}
                    >
                      {isSearchingTherapists ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Searching
                        </span>
                      ) : (
                        'Search'
                      )}
                    </button>
                  </div>

                  {/* Quick Filters */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    <button
                      onClick={() => {
                        setTherapistSearchQuery('');
                        setIsSearchingTherapists(true);
                      }}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded transition-colors duration-200"
                    >
                      All Therapists
                    </button>
                    <button
                      onClick={() => {
                        setTherapistSearchQuery('experienced');
                        setIsSearchingTherapists(true);
                      }}
                      className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded transition-colors duration-200"
                    >
                      Experienced
                    </button>
                    <button
                      onClick={() => {
                        setTherapistSearchQuery(selectedPatient?.area || '');
                        setIsSearchingTherapists(true);
                      }}
                      className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors duration-200"
                    >
                      Same Area
                    </button>
                  </div>

                  {/* Search Tips */}
                  <div className="text-xs text-gray-500 italic">
                    Tip: Search by name, specialization, or use the quick filters above
                  </div>
                </div>

                {/* Therapist List */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Therapist
                  </label>
                  <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                    {isSearchingTherapists ? (
                      <div className="p-4 text-center text-gray-500">Searching...</div>
                    ) : therapists.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No therapists found</div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {therapists.map((therapist) => (
                          <li
                            key={therapist.id}
                            className={`p-3 cursor-pointer hover:bg-gray-50 ${
                              selectedTherapist?.id === therapist.id ? 'bg-primary-50' : ''
                            }`}
                            onClick={() => handleTherapistSelect(therapist)}
                          >
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium">{therapist.user.first_name} {therapist.user.last_name}</p>
                                <p className="text-sm text-gray-500">{therapist.specialization}</p>
                              </div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {therapist.experience_years} yrs
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Pagination */}
                  {totalTherapists > therapistsPageSize && (
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <button
                        onClick={() => handleTherapistsPageChange(therapistsPage - 1)}
                        disabled={therapistsPage === 1 || isSearchingTherapists}
                        className={`px-2 py-1 rounded ${
                          therapistsPage === 1 || isSearchingTherapists
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-primary-600 hover:bg-primary-50'
                        }`}
                      >
                        Previous
                      </button>
                      <span className="text-gray-600">
                        Page {therapistsPage} of {Math.ceil(totalTherapists / therapistsPageSize)}
                      </span>
                      <button
                        onClick={() => handleTherapistsPageChange(therapistsPage + 1)}
                        disabled={therapistsPage >= Math.ceil(totalTherapists / therapistsPageSize) || isSearchingTherapists}
                        className={`px-2 py-1 rounded ${
                          therapistsPage >= Math.ceil(totalTherapists / therapistsPageSize) || isSearchingTherapists
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-primary-600 hover:bg-primary-50'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>

                {/* Selected Therapist Details */}
                {selectedTherapist && (
                  <div className="p-4 bg-white rounded-md shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-800">Selected Therapist</h4>
                      <button
                        onClick={() => {
                          setSelectedTherapist(null);
                          setSuccess(null);
                        }}
                        className="text-gray-500 hover:text-red-500 transition-colors duration-200"
                        title="Clear selection"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-blue-100 text-blue-700 rounded-full h-10 w-10 flex items-center justify-center mr-3">
                        <span className="font-medium text-sm">
                          {selectedTherapist.user.first_name.charAt(0)}
                          {selectedTherapist.user.last_name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {selectedTherapist.user.first_name} {selectedTherapist.user.last_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedTherapist.specialization}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedTherapist.experience_years} years experience
                        </p>
                        <p className="text-sm text-gray-600">
                          Areas: {selectedTherapist.area_names ? selectedTherapist.area_names.join(', ') :
                                 (selectedTherapist.areas ? selectedTherapist.areas.join(', ') : 'Not specified')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Bio:</span> {selectedTherapist.bio}
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Total Sessions:</span> {selectedTherapist.total_sessions}
                        </div>
                        <div>
                          <span className="font-medium">Completed:</span> {selectedTherapist.completed_sessions}
                        </div>
                        <div>
                          <span className="font-medium">Total Earnings:</span> {formatCurrency(selectedTherapist.total_earnings)}
                        </div>
                        <div>
                          <span className="font-medium">Avg. Fee:</span> {formatCurrency(selectedTherapist.average_fee)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="mt-2">Please select a patient first</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle Column - Appointment Selection */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-5 h-full">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Appointment Selection</h3>

            {/* Appointment Filters */}
            <div className="mb-4">
              <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 mb-4">
                <h4 className="font-medium text-gray-800 mb-2">Filter Options</h4>

                {/* Include Paid Appointments Toggle */}
                <div className="flex items-center mb-3">
                  <input
                    id="include-paid"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={includePaidAppointments}
                    onChange={(e) => setIncludePaidAppointments(e.target.checked)}
                    disabled={!selectedPatient}
                  />
                  <label htmlFor="include-paid" className="ml-2 block text-sm text-gray-900">
                    Include Paid Appointments
                  </label>
                </div>

                {/* Attendance Status Filter */}
                <div className="flex flex-col">
                  <label htmlFor="attendance-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Attendance Status
                  </label>
                  <select
                    id="attendance-filter"
                    className="rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    value={appointmentAttendanceFilter}
                    onChange={(e) => setAppointmentAttendanceFilter(e.target.value)}
                    disabled={!selectedPatient}
                  >
                    <option value="all">All Statuses</option>
                    <option value="attended">Attended Only</option>
                    <option value="missed">Missed Only</option>
                    <option value="scheduled">Scheduled Only</option>
                  </select>
                </div>

                {/* Quick Filter Buttons */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Quick Filters:</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setIncludePaidAppointments(false);
                        setAppointmentAttendanceFilter('all');
                      }}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded transition-colors duration-200"
                      disabled={!selectedPatient}
                    >
                      Unpaid Only
                    </button>
                    <button
                      onClick={() => {
                        setIncludePaidAppointments(true);
                        setAppointmentAttendanceFilter('attended');
                      }}
                      className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded transition-colors duration-200"
                      disabled={!selectedPatient}
                    >
                      All Attended
                    </button>
                    <button
                      onClick={() => {
                        setIncludePaidAppointments(true);
                        setAppointmentAttendanceFilter('all');
                      }}
                      className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors duration-200"
                      disabled={!selectedPatient}
                    >
                      Show All
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointments List */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Appointment
              </label>
              <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                {!selectedPatient ? (
                  <div className="p-4 text-center text-gray-500">Please select a patient first</div>
                ) : isLoadingAppointments ? (
                  <div className="p-4 text-center text-gray-500">Loading appointments...</div>
                ) : appointments.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No appointments found</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {appointments.map((appointment) => (
                      <li
                        key={appointment.id}
                        className={`p-3 cursor-pointer hover:bg-gray-50 ${
                          selectedAppointment?.id === appointment.id ? 'bg-primary-50' : ''
                        }`}
                        onClick={() => handleAppointmentSelect(appointment)}
                      >
                        <div className="flex justify-between mb-1">
                          <div className="font-medium">
                            {appointment.date} • {appointment.start_time.substring(0, 5)}-{appointment.end_time.substring(0, 5)}
                          </div>
                          <div className="flex space-x-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getAttendanceStatusColor(appointment.attendance_status)}`}>
                              {appointment.attendance_status}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(appointment.payment_status)}`}>
                              {appointment.payment_status}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          <div>Therapist: {appointment.therapist_name}</div>
                          <div>Type: {appointment.therapy_type}</div>
                          <div>Fee: {formatCurrency(appointment.fee)}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Selected Appointment Details */}
            {selectedAppointment && (
              <div className="p-4 bg-white rounded-md shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-800">Selected Appointment</h4>
                  <button
                    onClick={() => {
                      setSelectedAppointment(null);
                      setSuccess(null);
                    }}
                    className="text-gray-500 hover:text-red-500 transition-colors duration-200"
                    title="Clear selection"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div>
                    <span className="font-medium">Date:</span> {selectedAppointment.date}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span> {selectedAppointment.start_time.substring(0, 5)}-{selectedAppointment.end_time.substring(0, 5)}
                  </div>
                  <div>
                    <span className="font-medium">Therapist:</span> {selectedAppointment.therapist_name}
                  </div>
                  <div>
                    <span className="font-medium">Doctor:</span> {selectedAppointment.doctor_name}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {selectedAppointment.therapy_type}
                  </div>
                  <div>
                    <span className="font-medium">Fee:</span> {formatCurrency(selectedAppointment.fee)}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getAttendanceStatusColor(selectedAppointment.attendance_status)}`}>
                    {selectedAppointment.attendance_status}
                  </div>
                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedAppointment.payment_status)}`}>
                    {selectedAppointment.payment_status}
                  </div>
                </div>

                {selectedAppointment.session_notes && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Session Notes:</span> {selectedAppointment.session_notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Distribution Calculator */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-4 h-full">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Revenue Distribution</h3>

            {/* Fee Input */}
            <div className="mb-4">
              <label htmlFor="total-fee" className="block text-sm font-medium text-gray-700 mb-1">
                Total Fee Amount (₹)
              </label>
              <div className="flex items-center">
                <input
                  id="total-fee"
                  type="number"
                  className={`rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm w-full ${
                    isManualFeeOverride ? 'border-yellow-500 bg-yellow-50' : ''
                  }`}
                  value={totalFee}
                  onChange={handleFeeChange}
                  placeholder="Enter total fee amount"
                />
                {isManualFeeOverride && (
                  <span className="ml-2 text-xs text-yellow-600">Manual override</span>
                )}
              </div>
              {selectedAppointment && (
                <div className="mt-1 flex items-center">
                  <input
                    id="use-appointment-fee"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={useAppointmentFee}
                    onChange={(e) => {
                      setUseAppointmentFee(e.target.checked);
                      if (e.target.checked && selectedAppointment) {
                        setTotalFee(selectedAppointment.fee.toString());
                        setIsManualFeeOverride(false);
                      }
                    }}
                  />
                  <label htmlFor="use-appointment-fee" className="ml-2 block text-sm text-gray-700">
                    Use appointment fee
                  </label>
                </div>
              )}
            </div>

            {/* Distribution Type Selection */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <input
                  id="use-manual-distribution"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={useManualDistribution}
                  onChange={(e) => setUseManualDistribution(e.target.checked)}
                />
                <label htmlFor="use-manual-distribution" className="ml-2 block text-sm text-gray-700">
                  Manual Distribution
                </label>
              </div>

              {!useManualDistribution ? (
                <div>
                  <label htmlFor="distribution-config" className="block text-sm font-medium text-gray-700 mb-1">
                    Distribution Configuration
                  </label>
                  <select
                    id="distribution-config"
                    className="rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm w-full"
                    value={selectedConfig}
                    onChange={(e) => setSelectedConfig(e.target.value)}
                  >
                    <option value="">Select a configuration</option>
                    {distributionConfigs.map((config) => (
                      <option key={config.id} value={config.id}>
                        {config.name} {config.is_default ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="distribution-type" className="block text-sm font-medium text-gray-700">
                      Distribution Type
                    </label>
                    <select
                      id="distribution-type"
                      className="rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={distributionType}
                      onChange={(e) => setDistributionType(e.target.value)}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div className="mb-2">
                    <label htmlFor="auto-calculate-role" className="block text-sm font-medium text-gray-700 mb-1">
                      Auto-Calculate Role
                    </label>
                    <select
                      id="auto-calculate-role"
                      className="rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm w-full"
                      value={autoCalculateRole}
                      onChange={(e) => setAutoCalculateRole(e.target.value)}
                    >
                      <option value="admin">Admin</option>
                      <option value="therapist">Therapist</option>
                      <option value="doctor">Doctor</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div>
                      <label htmlFor="admin-value" className="block text-sm font-medium text-gray-700 mb-1">
                        Admin {distributionType === 'percentage' ? '(%)' : '(₹)'}
                      </label>
                      <input
                        id="admin-value"
                        type="number"
                        className={`rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm w-full ${
                          autoCalculateRole === 'admin' ? 'bg-gray-100' : ''
                        }`}
                        value={adminValue}
                        onChange={(e) => setAdminValue(e.target.value)}
                        readOnly={autoCalculateRole === 'admin'}
                      />
                    </div>
                    <div>
                      <label htmlFor="therapist-value" className="block text-sm font-medium text-gray-700 mb-1">
                        Therapist {distributionType === 'percentage' ? '(%)' : '(₹)'}
                      </label>
                      <input
                        id="therapist-value"
                        type="number"
                        className={`rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm w-full ${
                          autoCalculateRole === 'therapist' ? 'bg-gray-100' : ''
                        }`}
                        value={therapistValue}
                        onChange={(e) => setTherapistValue(e.target.value)}
                        readOnly={autoCalculateRole === 'therapist'}
                      />
                    </div>
                    <div>
                      <label htmlFor="doctor-value" className="block text-sm font-medium text-gray-700 mb-1">
                        Doctor {distributionType === 'percentage' ? '(%)' : '(₹)'}
                      </label>
                      <input
                        id="doctor-value"
                        type="number"
                        className={`rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm w-full ${
                          autoCalculateRole === 'doctor' ? 'bg-gray-100' : ''
                        }`}
                        value={doctorValue}
                        onChange={(e) => setDoctorValue(e.target.value)}
                        readOnly={autoCalculateRole === 'doctor'}
                      />
                    </div>
                  </div>

                  {distributionType === 'percentage' && (
                    <div className="text-sm text-gray-600 mb-2">
                      <div className="flex justify-between">
                        <span>Platform Fee (fixed):</span>
                        <span>{platformFee}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Percentage:</span>
                        <span className={Math.abs(calculateTotalPercentage() - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}>
                          {calculateTotalPercentage()}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Details */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Payment Details</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="payment-status" className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    id="payment-status"
                    className="rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm w-full"
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                  >
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="payment-method" className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    id="payment-method"
                    className="rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm w-full"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="online">Online</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2">
              <button
                onClick={handleCalculate}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
                disabled={isSubmitting}
              >
                Calculate Distribution
              </button>
              <button
                onClick={handleApplyDistribution}
                className={`px-4 py-2 rounded-md ${
                  calculationResult && selectedPatient && selectedAppointment
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!calculationResult || !selectedPatient || !selectedAppointment || isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Apply Distribution'
                )}
              </button>
            </div>

            {/* Calculation Results */}
            {calculationResult && (
              <div className="mt-4 p-3 bg-white rounded-md shadow-sm border border-gray-200">
                <h4 className="font-medium text-gray-800 mb-2">Calculation Results</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Total Fee:</span> {formatCurrency(calculationResult.total)}
                  </div>
                  <div>
                    <span className="font-medium">Platform Fee:</span> {formatCurrency(calculationResult.platform_fee)}
                  </div>
                  <div>
                    <span className="font-medium">Distributable:</span> {formatCurrency(calculationResult.distributable_amount)}
                  </div>
                  <div></div>
                  <div className="col-span-2 border-t border-gray-200 pt-2 mt-1"></div>
                  <div>
                    <span className="font-medium">Admin:</span> {formatCurrency(calculationResult.admin)}
                    {distributionType === 'percentage' && ` (${calculationResult.admin_percentage}%)`}
                  </div>
                  <div>
                    <span className="font-medium">Therapist:</span> {formatCurrency(calculationResult.therapist)}
                    {distributionType === 'percentage' && ` (${calculationResult.therapist_percentage}%)`}
                  </div>
                  <div>
                    <span className="font-medium">Doctor:</span> {formatCurrency(calculationResult.doctor)}
                    {distributionType === 'percentage' && ` (${calculationResult.doctor_percentage}%)`}
                  </div>
                </div>
                {calculationResult.below_threshold && (
                  <div className="mt-2 text-sm text-yellow-600">
                    Warning: Admin earnings are below the minimum threshold of ₹400.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-6 text-sm text-gray-500 text-center">
        <p>Note: All financial distributions are recorded in the system and reflected in earnings reports.</p>
      </div>
    </div>
  );
};

export default EnhancedRevenueCalculator;
