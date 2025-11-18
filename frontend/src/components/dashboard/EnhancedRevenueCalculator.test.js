import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedRevenueCalculator from './EnhancedRevenueCalculator';
import { AuthProvider } from '../../contexts/AuthContext';
import financialDashboardService from '../../services/financialDashboardService';

// Mock the financialDashboardService
jest.mock('../../services/financialDashboardService', () => ({
  getPatients: jest.fn(),
  getPatientAppointments: jest.fn(),
  getDistributionConfigs: jest.fn(),
  calculateDistribution: jest.fn(),
  applyDistribution: jest.fn(),
  getMockPatients: jest.fn(),
  getMockPatientAppointments: jest.fn()
}));

// Mock the AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { role: 'admin', firstName: 'Rajavi', lastName: 'Dixit' }
  })),
  AuthProvider: ({ children }) => <div>{children}</div>
}));

describe('EnhancedRevenueCalculator', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock responses
    financialDashboardService.getDistributionConfigs.mockResolvedValue([
      { id: 1, name: 'Default Config', is_default: true },
      { id: 2, name: 'Custom Config', is_default: false }
    ]);

    financialDashboardService.getPatients.mockResolvedValue({
      results: [
        {
          id: 1,
          user: {
            id: 101,
            first_name: 'Rahul',
            last_name: 'Mehta',
            email: 'rahul.mehta@example.com',
            phone: '+91 9876543201'
          },
          age: 45,
          gender: 'Male',
          address: 'Satellite, Ahmedabad',
          medical_history: 'Chronic back pain',
          pending_payments: 2,
          total_sessions: 8,
          completed_sessions: 7,
          attendance_rate: 87.5,
          last_appointment: '2023-06-15',
          area: 'Satellite'
        }
      ],
      count: 1
    });

    financialDashboardService.getPatientAppointments.mockResolvedValue({
      results: [
        {
          id: 101,
          patient_id: 1,
          therapist_id: 1,
          doctor_id: 2,
          date: '2023-06-15',
          start_time: '10:00:00',
          end_time: '11:00:00',
          status: 'completed',
          payment_status: 'pending',
          attendance_status: 'attended',
          session_notes: 'Initial assessment completed',
          therapy_type: 'Physical Therapy',
          fee: 1200,
          therapist_name: 'Rajesh Sharma',
          doctor_name: 'Dr. Anjali Gupta'
        }
      ],
      count: 1
    });

    financialDashboardService.calculateDistribution.mockResolvedValue({
      distribution: {
        admin: 400,
        therapist: 450,
        doctor: 314,
        platform_fee: 36,
        total: 1200,
        distributable_amount: 1164,
        below_threshold: false,
        admin_percentage: 34.36,
        therapist_percentage: 38.66,
        doctor_percentage: 26.98
      }
    });

    financialDashboardService.applyDistribution.mockResolvedValue({
      success: true,
      message: 'Distribution applied successfully'
    });
  });

  // Helper function to render component with AuthProvider
  const renderWithAuth = (component) => {
    return render(
      <AuthProvider>
        {component}
      </AuthProvider>
    );
  };

  test('renders the component correctly', async () => {
    renderWithAuth(<EnhancedRevenueCalculator />);

    // Check if the component title is rendered
    expect(screen.getByText('Enhanced Revenue Distribution Calculator')).toBeInTheDocument();

    // Check if patient selection section is rendered
    expect(screen.getByText('Patient Selection')).toBeInTheDocument();

    // Check if the search input is rendered
    expect(screen.getByPlaceholderText('Search by name, email, or phone')).toBeInTheDocument();

    // Check if the distribution section is rendered
    expect(screen.getByText('Revenue Distribution')).toBeInTheDocument();

    // Wait for distribution configs to be loaded
    await waitFor(() => {
      expect(financialDashboardService.getDistributionConfigs).toHaveBeenCalled();
    });
  });

  test('searches for patients and selects one', async () => {
    renderWithAuth(<EnhancedRevenueCalculator />);

    // Type in the search box
    const searchInput = screen.getByPlaceholderText('Search by name, email, or phone');
    fireEvent.change(searchInput, { target: { value: 'Rahul' } });

    // Wait for the search to complete
    await waitFor(() => {
      expect(financialDashboardService.getPatients).toHaveBeenCalledWith('Rahul', 1, 10);
    });

    // Wait for patient to appear in the list
    await waitFor(() => {
      expect(screen.getByText('Rahul Mehta')).toBeInTheDocument();
    });

    // Click on the patient
    fireEvent.click(screen.getByText('Rahul Mehta'));

    // Check if patient appointments are fetched
    await waitFor(() => {
      expect(financialDashboardService.getPatientAppointments).toHaveBeenCalledWith(1, false, 'all');
    });

    // Check if patient details are displayed
    await waitFor(() => {
      expect(screen.getByText('Selected Patient')).toBeInTheDocument();
    });

    // Check if patient age and gender are displayed
    await waitFor(() => {
      expect(screen.getByText('45 years, Male')).toBeInTheDocument();
    });
  });

  test('selects an appointment and calculates distribution', async () => {
    renderWithAuth(<EnhancedRevenueCalculator />);

    // Setup patient selection
    await waitFor(() => {
      expect(financialDashboardService.getDistributionConfigs).toHaveBeenCalled();
    });

    // Simulate patient search and selection
    const searchInput = screen.getByPlaceholderText('Search by name, email, or phone');
    fireEvent.change(searchInput, { target: { value: 'Rahul' } });

    await waitFor(() => {
      expect(screen.getByText('Rahul Mehta')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Rahul Mehta'));

    // Wait for appointments to load
    await waitFor(() => {
      expect(financialDashboardService.getPatientAppointments).toHaveBeenCalled();
    });

    // Select an appointment (wait for it to appear first)
    await waitFor(() => {
      expect(screen.getByText('Physical Therapy')).toBeInTheDocument();
    });

    // Click on the appointment
    fireEvent.click(screen.getByText('Physical Therapy'));

    // Check if the fee is automatically set
    await waitFor(() => {
      const feeInput = screen.getByLabelText('Total Fee Amount (₹)');
      expect(feeInput.value).toBe('1200');
    });

    // Enable manual distribution
    const manualDistributionCheckbox = screen.getByLabelText('Manual Distribution');
    fireEvent.click(manualDistributionCheckbox);

    // Set distribution values
    const adminInput = screen.getByLabelText(/Admin \(%\)/);
    const therapistInput = screen.getByLabelText(/Therapist \(%\)/);

    fireEvent.change(adminInput, { target: { value: '40' } });
    fireEvent.change(therapistInput, { target: { value: '40' } });

    // Click calculate button
    const calculateButton = screen.getByText('Calculate Distribution');
    fireEvent.click(calculateButton);

    // Check if calculation API is called
    await waitFor(() => {
      expect(financialDashboardService.calculateDistribution).toHaveBeenCalled();
    });

    // Check if results are displayed
    await waitFor(() => {
      expect(screen.getByText('Calculation Results')).toBeInTheDocument();
    });
  });

  test('applies distribution to an appointment', async () => {
    renderWithAuth(<EnhancedRevenueCalculator />);

    // Setup patient and appointment selection
    await waitFor(() => {
      expect(financialDashboardService.getDistributionConfigs).toHaveBeenCalled();
    });

    // Simulate patient search and selection
    const searchInput = screen.getByPlaceholderText('Search by name, email, or phone');
    fireEvent.change(searchInput, { target: { value: 'Rahul' } });

    await waitFor(() => {
      expect(screen.getByText('Rahul Mehta')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Rahul Mehta'));

    // Wait for appointments to load and select one
    await waitFor(() => {
      expect(screen.getByText('Physical Therapy')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Physical Therapy'));

    // Calculate distribution
    const calculateButton = screen.getByText('Calculate Distribution');
    fireEvent.click(calculateButton);

    // Mock the calculation result
    await waitFor(() => {
      expect(financialDashboardService.calculateDistribution).toHaveBeenCalled();
    });

    // Apply distribution
    const applyButton = screen.getByText('Apply Distribution');
    fireEvent.click(applyButton);

    // Check if apply API is called
    await waitFor(() => {
      expect(financialDashboardService.applyDistribution).toHaveBeenCalled();
    });

    // Check for success message
    await waitFor(() => {
      expect(screen.getByText(/Distribution successfully applied and saved/)).toBeInTheDocument();
    });
  });
});
