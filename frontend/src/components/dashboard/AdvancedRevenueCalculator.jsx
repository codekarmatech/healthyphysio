import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import financialDashboardService from '../../services/financialDashboardService';

const AdvancedRevenueCalculator = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // State for total fee
  const [totalFee, setTotalFee] = useState('');

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

  // State for saving configuration
  const [saveConfiguration, setSaveConfiguration] = useState(false);
  const [configurationName, setConfigurationName] = useState('');

  // State for calculation result
  const [calculationResult, setCalculationResult] = useState(null);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

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

  // Calculate total percentage for validation
  const calculateTotalPercentage = () => {
    if (distributionType !== 'percentage') return 100;

    const admin = parseFloat(adminValue) || 0;
    const therapist = parseFloat(therapistValue) || 0;
    const doctor = parseFloat(doctorValue) || 0;

    return admin + therapist + doctor;
  };

  // Auto-calculate the third role's percentage - wrapped in useCallback
  const calculateThirdRolePercentage = useCallback(() => {
    if (distributionType !== 'percentage') return 0;

    let total = 0;
    let thirdRoleValue = 0;

    const admin = parseFloat(adminValue) || 0;
    const therapist = parseFloat(therapistValue) || 0;
    const doctor = parseFloat(doctorValue) || 0;

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

    return thirdRoleValue;
  }, [
    distributionType,
    adminValue,
    therapistValue,
    doctorValue,
    autoCalculateRole,
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
        // Auto-calculate the third role's percentage if needed
        // This is now handled by the useEffect hooks, so we don't need to call it here
        // calculateThirdRolePercentage();

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

  // Effect for real-time calculation
  useEffect(() => {
    if (useManualDistribution) {
      handleRealTimeCalculation();
    }
  }, [useManualDistribution, handleRealTimeCalculation, totalFee, adminValue, therapistValue, doctorValue, distributionType]);

  // Effects to trigger auto-calculation when values change
  useEffect(() => {
    if (distributionType === 'percentage' && autoCalculateRole === 'doctor' && useManualDistribution) {
      calculateThirdRolePercentage();
    }
  }, [adminValue, therapistValue, distributionType, autoCalculateRole, useManualDistribution, calculateThirdRolePercentage]);

  useEffect(() => {
    if (distributionType === 'percentage' && autoCalculateRole === 'therapist' && useManualDistribution) {
      calculateThirdRolePercentage();
    }
  }, [adminValue, doctorValue, distributionType, autoCalculateRole, useManualDistribution, calculateThirdRolePercentage]);

  useEffect(() => {
    if (distributionType === 'percentage' && autoCalculateRole === 'admin' && useManualDistribution) {
      calculateThirdRolePercentage();
    }
  }, [therapistValue, doctorValue, distributionType, autoCalculateRole, useManualDistribution, calculateThirdRolePercentage]);

  // Handle calculate button click
  const handleCalculate = async () => {
    if (!totalFee) {
      setError('Please enter a total fee amount.');
      return;
    }

    if (useManualDistribution) {
      // For percentage distribution, we need to ensure all values are set
      // For the auto-calculated role, the value should be set by the auto-calculation
      if (distributionType === 'percentage') {
        // Auto-calculate one last time to ensure values are up-to-date
        calculateThirdRolePercentage();

        // Check if any value is missing
        if (!adminValue || !therapistValue || !doctorValue) {
          setError('Please enter values for all stakeholders.');
          return;
        }

        // Check if percentages add up to 100%
        if (calculateTotalPercentage() !== 100) {
          setError('Percentage values must add up to 100%.');
          return;
        }
      } else {
        // For fixed distribution, all values must be manually entered
        if (!adminValue || !therapistValue || !doctorValue) {
          setError('Please enter values for all stakeholders.');
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
      const data = await financialDashboardService.calculateDistribution(
        parseFloat(totalFee),
        selectedConfig,
        useManualDistribution,
        distributionType,
        parseFloat(platformFee),
        parseFloat(adminValue),
        parseFloat(therapistValue),
        parseFloat(doctorValue),
        saveConfiguration,
        configurationName
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

      // Reset save configuration if successful
      if (saveConfiguration && data.config) {
        setSaveConfiguration(false);
        setConfigurationName('');

        // Add the new config to the list and select it
        setDistributionConfigs([...distributionConfigs, data.config]);
        setSelectedConfig(data.config.id);

        // Switch to using saved config
        setUseManualDistribution(false);
      }
    } catch (err) {
      console.error('Error calculating revenue distribution:', err);
      setError('Failed to calculate revenue distribution. Please try again later.');
    }
  };

  // Handle confirm button click
  const handleConfirm = () => {
    setConfirmed(true);
    handleCalculate();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Advanced Revenue Distribution Calculator</h2>

      {/* Error and Warning Messages */}
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
          >
            Confirm Anyway
          </button>
        </div>
      )}

      {/* Total Fee Input */}
      <div className="mb-6">
        <label htmlFor="total-fee" className="block text-sm font-medium text-gray-700 mb-1">
          Total Patient Charge (₹)
        </label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">₹</span>
          </div>
          <input
            id="total-fee"
            type="number"
            min="0"
            step="0.01"
            className="block w-full pl-7 pr-12 rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            value={totalFee}
            onChange={(e) => setTotalFee(e.target.value)}
            placeholder="Enter total amount"
          />
        </div>
      </div>

      {/* Distribution Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Distribution Method</label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-primary-600 focus:ring-primary-500"
              checked={!useManualDistribution}
              onChange={() => setUseManualDistribution(false)}
            />
            <span className="ml-2">Use Saved Configuration</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-primary-600 focus:ring-primary-500"
              checked={useManualDistribution}
              onChange={() => setUseManualDistribution(true)}
            />
            <span className="ml-2">Manual Distribution</span>
          </label>
        </div>
      </div>

      {/* Saved Configuration Selection */}
      {!useManualDistribution && (
        <div className="mb-6">
          <label htmlFor="distribution-config" className="block text-sm font-medium text-gray-700 mb-1">
            Distribution Configuration
          </label>
          <select
            id="distribution-config"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            value={selectedConfig || ''}
            onChange={(e) => setSelectedConfig(e.target.value)}
          >
            <option value="" disabled>Select a configuration</option>
            {distributionConfigs.map((config) => (
              <option key={config.id} value={config.id}>
                {config.name} {config.is_default ? '(Default)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Manual Distribution Inputs */}
      {useManualDistribution && (
        <div className="mb-6 space-y-4">
          {/* Platform Fee (Fixed at 3%) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Platform Fee (Fixed at 3%)
            </label>
            <div className="bg-gray-100 p-2 rounded-md">
              <p className="text-sm text-gray-700">
                Platform Fee: ₹{totalFee ? ((parseFloat(totalFee) * 3) / 100).toFixed(2) : '0.00'}
                (3% of ₹{totalFee || '0'})
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Distributable Amount: ₹{totalFee ? (parseFloat(totalFee) - ((parseFloat(totalFee) * 3) / 100)).toFixed(2) : '0.00'}
                (97% of ₹{totalFee || '0'})
              </p>
            </div>
          </div>

          {/* Distribution Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Distribution Type</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-primary-600 focus:ring-primary-500"
                  checked={distributionType === 'percentage'}
                  onChange={() => setDistributionType('percentage')}
                />
                <span className="ml-2">Percentage</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-primary-600 focus:ring-primary-500"
                  checked={distributionType === 'fixed'}
                  onChange={() => setDistributionType('fixed')}
                />
                <span className="ml-2">Fixed Amount</span>
              </label>
            </div>
          </div>

          {/* Auto-Calculate Role Selection (only for percentage distribution) */}
          {distributionType === 'percentage' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-Calculate Role (Enter values for the other two roles)
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-primary-600 focus:ring-primary-500"
                    checked={autoCalculateRole === 'admin'}
                    onChange={() => setAutoCalculateRole('admin')}
                  />
                  <span className="ml-2">Admin</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-primary-600 focus:ring-primary-500"
                    checked={autoCalculateRole === 'therapist'}
                    onChange={() => setAutoCalculateRole('therapist')}
                  />
                  <span className="ml-2">Therapist</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-primary-600 focus:ring-primary-500"
                    checked={autoCalculateRole === 'doctor'}
                    onChange={() => setAutoCalculateRole('doctor')}
                  />
                  <span className="ml-2">Doctor</span>
                </label>
              </div>
            </div>
          )}

          {/* Distribution Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="admin-value" className="block text-sm font-medium text-gray-700 mb-1">
                Admin {distributionType === 'percentage' ? '(%)' : '(₹)'}
                {distributionType === 'percentage' && autoCalculateRole === 'admin' && ' (Auto-Calculated)'}
              </label>
              <input
                id="admin-value"
                type="number"
                min="0"
                step="0.01"
                className={`block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                  distributionType === 'percentage' && autoCalculateRole === 'admin' ? 'bg-gray-100' : ''
                }`}
                value={adminValue}
                onChange={(e) => setAdminValue(e.target.value)}
                readOnly={distributionType === 'percentage' && autoCalculateRole === 'admin'}
              />
              {distributionType === 'percentage' && totalFee && adminValue && (
                <p className="mt-1 text-xs text-gray-500">
                  ₹{((parseFloat(totalFee) * 0.97 * parseFloat(adminValue)) / 100).toFixed(2)}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="therapist-value" className="block text-sm font-medium text-gray-700 mb-1">
                Therapist {distributionType === 'percentage' ? '(%)' : '(₹)'}
                {distributionType === 'percentage' && autoCalculateRole === 'therapist' && ' (Auto-Calculated)'}
              </label>
              <input
                id="therapist-value"
                type="number"
                min="0"
                step="0.01"
                className={`block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                  distributionType === 'percentage' && autoCalculateRole === 'therapist' ? 'bg-gray-100' : ''
                }`}
                value={therapistValue}
                onChange={(e) => setTherapistValue(e.target.value)}
                readOnly={distributionType === 'percentage' && autoCalculateRole === 'therapist'}
              />
              {distributionType === 'percentage' && totalFee && therapistValue && (
                <p className="mt-1 text-xs text-gray-500">
                  ₹{((parseFloat(totalFee) * 0.97 * parseFloat(therapistValue)) / 100).toFixed(2)}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="doctor-value" className="block text-sm font-medium text-gray-700 mb-1">
                Doctor {distributionType === 'percentage' ? '(%)' : '(₹)'}
                {distributionType === 'percentage' && autoCalculateRole === 'doctor' && ' (Auto-Calculated)'}
              </label>
              <input
                id="doctor-value"
                type="number"
                min="0"
                step="0.01"
                className={`block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                  distributionType === 'percentage' && autoCalculateRole === 'doctor' ? 'bg-gray-100' : ''
                }`}
                value={doctorValue}
                onChange={(e) => setDoctorValue(e.target.value)}
                readOnly={distributionType === 'percentage' && autoCalculateRole === 'doctor'}
              />
              {distributionType === 'percentage' && totalFee && doctorValue && (
                <p className="mt-1 text-xs text-gray-500">
                  ₹{((parseFloat(totalFee) * 0.97 * parseFloat(doctorValue)) / 100).toFixed(2)}
                </p>
              )}
            </div>
          </div>

          {/* Percentage Total (for validation) */}
          {distributionType === 'percentage' && (
            <div className={`text-sm ${calculateTotalPercentage() === 100 ? 'text-green-600' : 'text-red-600'}`}>
              Total: {calculateTotalPercentage()}% {calculateTotalPercentage() !== 100 && '(Must equal 100%)'}
            </div>
          )}

          {/* Save Configuration Option */}
          {isAdmin && (
            <div className="mt-4">
              <div className="flex items-center">
                <input
                  id="save-config"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={saveConfiguration}
                  onChange={(e) => setSaveConfiguration(e.target.checked)}
                />
                <label htmlFor="save-config" className="ml-2 block text-sm text-gray-700">
                  Save this configuration for future use
                </label>
              </div>

              {saveConfiguration && (
                <div className="mt-2">
                  <label htmlFor="config-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Configuration Name
                  </label>
                  <input
                    id="config-name"
                    type="text"
                    className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    value={configurationName}
                    onChange={(e) => setConfigurationName(e.target.value)}
                    placeholder="Enter a name for this configuration"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Calculate Button */}
      <div className="mt-6">
        <button
          type="button"
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          onClick={handleCalculate}
        >
          Calculate Distribution
        </button>
      </div>

      {/* Calculation Result */}
      {calculationResult && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Calculation Result</h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Patient Charge:</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">₹{calculationResult.total.toLocaleString()}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Platform Fee (3%):</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">₹{calculationResult.platform_fee.toLocaleString()}</p>
              </div>

              <div className="lg:col-span-2">
                <p className="text-sm font-medium text-gray-500">Distributable Amount (97%):</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">₹{calculationResult.distributable_amount.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-4 border-t border-gray-200 pt-4">
              <h4 className="text-md font-medium text-gray-800 mb-2">Distribution Breakdown</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="bg-white p-3 rounded-md shadow-sm">
                  <p className="text-sm font-medium text-gray-500">Admin:</p>
                  <p className={`mt-1 text-xl font-semibold ${calculationResult.below_threshold ? 'text-red-600' : 'text-gray-900'}`}>
                    ₹{calculationResult.admin.toLocaleString()}
                  </p>
                  {distributionType === 'percentage' && (
                    <p className="text-sm text-gray-500 mt-1">
                      {calculationResult.admin_percentage}% of distributable amount
                    </p>
                  )}
                  {calculationResult.below_threshold && (
                    <p className="text-xs text-red-600 mt-1">
                      Below minimum threshold of ₹400
                    </p>
                  )}
                </div>

                <div className="bg-white p-3 rounded-md shadow-sm">
                  <p className="text-sm font-medium text-gray-500">Therapist:</p>
                  <p className="mt-1 text-xl font-semibold text-gray-900">₹{calculationResult.therapist.toLocaleString()}</p>
                  {distributionType === 'percentage' && (
                    <p className="text-sm text-gray-500 mt-1">
                      {calculationResult.therapist_percentage}% of distributable amount
                    </p>
                  )}
                </div>

                <div className="bg-white p-3 rounded-md shadow-sm">
                  <p className="text-sm font-medium text-gray-500">Doctor:</p>
                  <p className="mt-1 text-xl font-semibold text-gray-900">₹{calculationResult.doctor.toLocaleString()}</p>
                  {distributionType === 'percentage' && (
                    <p className="text-sm text-gray-500 mt-1">
                      {calculationResult.doctor_percentage}% of distributable amount
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedRevenueCalculator;
