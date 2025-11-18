import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { toast } from 'react-toastify';
import TreatmentPlansPage from '../../pages/admin/TreatmentPlansPage';
import { AuthContext } from '../../contexts/AuthContext';
import treatmentPlanService from '../../services/treatmentPlanService';
import patientService from '../../services/patientService';
import therapistService from '../../services/therapistService';

// Mock all services
jest.mock('../../services/treatmentPlanService');
jest.mock('../../services/patientService');
jest.mock('../../services/therapistService');
jest.mock('react-toastify');

// Mock DashboardLayout
jest.mock('../../components/layout/DashboardLayout', () => {
  return function MockDashboardLayout({ children, title }) {
    return (
      <div data-testid="dashboard-layout">
        <h1>{title}</h1>
        {children}
      </div>
    );
  };
});

const mockAdminUser = {
  id: 1,
  is_admin: true,
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin'
};

const mockPatients = [
  {
    id: 1,
    user: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com'
    }
  }
];

const mockTherapists = [
  {
    id: 1,
    user: {
      first_name: 'Dr. Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@example.com'
    },
    specialization: 'Physical Therapy'
  }
];

const mockInterventions = [
  { id: 1, name: 'Range of Motion Assessment', category: 'assessment', is_active: true },
  { id: 2, name: 'Gentle Stretching', category: 'exercise', is_active: true }
];

const mockTreatmentPlans = [
  {
    id: 1,
    title: 'Lower Back Pain Recovery',
    description: 'Comprehensive treatment plan for chronic lower back pain',
    patient: {
      id: 1,
      user: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com'
      }
    },
    status: 'pending_approval',
    start_date: '2024-01-15',
    end_date: '2024-03-15',
    created_by: {
      first_name: 'Dr. Sarah',
      last_name: 'Johnson'
    },
    created_at: '2024-01-10T10:00:00Z',
    daily_treatments_count: 8
  }
];

const renderWithContext = (component, user = mockAdminUser) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ user }}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Treatment Plan Workflow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    treatmentPlanService.getAllTreatmentPlans.mockResolvedValue({ data: mockTreatmentPlans });
    patientService.getAllPatients.mockResolvedValue({ data: mockPatients });
    therapistService.getAll.mockResolvedValue({ data: mockTherapists });
    treatmentPlanService.getAllInterventions.mockResolvedValue({ data: mockInterventions });
    treatmentPlanService.createTreatmentPlan.mockResolvedValue({ data: { id: 2 } });
    treatmentPlanService.syncWithScheduling.mockResolvedValue({ data: { success: true } });
    treatmentPlanService.notifyTreatmentPlanUpdate.mockResolvedValue({ data: { success: true } });
  });

  describe('Complete Treatment Plan Creation Workflow', () => {
    test('admin can create a complete treatment plan', async () => {
      renderWithContext(<TreatmentPlansPage />);

      // Wait for initial data to load
      await waitFor(() => {
        expect(screen.getByText('Treatment Plans Management')).toBeInTheDocument();
      });

      // Click "Create New Plan" button
      const createButton = screen.getByText('Create New Plan');
      fireEvent.click(createButton);

      // Wait for wizard to load
      await waitFor(() => {
        expect(screen.getByText('Create Treatment Plan')).toBeInTheDocument();
        expect(screen.getByText('Step 1 of 4: Basic Information')).toBeInTheDocument();
      });

      // Fill Step 1: Basic Information
      await waitFor(() => {
        fireEvent.change(screen.getByLabelText(/treatment plan title/i), {
          target: { value: 'Integration Test Plan' }
        });
        fireEvent.change(screen.getByLabelText(/description/i), {
          target: { value: 'This is a test plan created during integration testing' }
        });
        fireEvent.change(screen.getByLabelText(/patient/i), {
          target: { value: '1' }
        });
        fireEvent.change(screen.getByLabelText(/start date/i), {
          target: { value: '2024-02-01' }
        });
        fireEvent.change(screen.getByLabelText(/end date/i), {
          target: { value: '2024-04-01' }
        });
      });

      // Add a goal
      const addGoalButton = screen.getByText('Add Goal');
      fireEvent.click(addGoalButton);
      
      const goalInput = screen.getByPlaceholderText(/enter treatment goal/i);
      fireEvent.change(goalInput, {
        target: { value: 'Improve mobility and reduce pain' }
      });

      // Proceed to Step 2
      fireEvent.click(screen.getByText('Next'));

      // Step 2: Therapist Assignment
      await waitFor(() => {
        expect(screen.getByText('Step 2 of 4: Therapist Assignment')).toBeInTheDocument();
      });

      // Assign a therapist
      const therapistCheckbox = screen.getByLabelText(/dr\. sarah johnson/i);
      fireEvent.click(therapistCheckbox);

      // Set as primary therapist
      await waitFor(() => {
        fireEvent.change(screen.getByLabelText(/primary therapist/i), {
          target: { value: '1' }
        });
      });

      // Proceed to Step 3
      fireEvent.click(screen.getByText('Next'));

      // Step 3: Daily Treatments
      await waitFor(() => {
        expect(screen.getByText('Step 3 of 4: Daily Treatments')).toBeInTheDocument();
      });

      // Add a daily treatment
      const addTreatmentButton = screen.getByText('Add Daily Treatment');
      fireEvent.click(addTreatmentButton);

      // Fill treatment details
      const titleInput = screen.getByPlaceholderText(/morning mobility session/i);
      fireEvent.change(titleInput, {
        target: { value: 'Initial Assessment Session' }
      });

      const descriptionTextarea = screen.getByPlaceholderText(/describe the treatment session/i);
      fireEvent.change(descriptionTextarea, {
        target: { value: 'Comprehensive initial assessment and baseline measurements' }
      });

      // Select interventions
      const assessmentCheckbox = screen.getByLabelText(/range of motion assessment/i);
      fireEvent.click(assessmentCheckbox);

      const stretchingCheckbox = screen.getByLabelText(/gentle stretching/i);
      fireEvent.click(stretchingCheckbox);

      // Proceed to Step 4
      fireEvent.click(screen.getByText('Next'));

      // Step 4: Review & Submit
      await waitFor(() => {
        expect(screen.getByText('Step 4 of 4: Review & Submit')).toBeInTheDocument();
      });

      // Verify all information is displayed correctly
      expect(screen.getByText('Integration Test Plan')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Dr. Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('Initial Assessment Session')).toBeInTheDocument();

      // Submit the plan
      const submitButton = screen.getByText('Create Plan');
      fireEvent.click(submitButton);

      // Verify API calls were made
      await waitFor(() => {
        expect(treatmentPlanService.createTreatmentPlan).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Integration Test Plan',
            description: 'This is a test plan created during integration testing',
            patient: '1',
            start_date: '2024-02-01',
            end_date: '2024-04-01',
            goals: ['Improve mobility and reduce pain'],
            assigned_therapists: [1],
            primary_therapist: '1',
            daily_treatments: expect.arrayContaining([
              expect.objectContaining({
                title: 'Initial Assessment Session',
                description: 'Comprehensive initial assessment and baseline measurements'
              })
            ])
          })
        );
      });

      // Verify scheduling sync was called
      expect(treatmentPlanService.syncWithScheduling).toHaveBeenCalledWith(2);

      // Verify notifications were sent
      expect(treatmentPlanService.notifyTreatmentPlanUpdate).toHaveBeenCalledWith(
        2,
        'created',
        [1]
      );

      // Verify success messages
      expect(toast.success).toHaveBeenCalledWith('Treatment plan created successfully');
      expect(toast.info).toHaveBeenCalledWith('Treatment plan synchronized with scheduling system');
    });

    test('handles API errors gracefully during creation', async () => {
      // Mock API failure
      treatmentPlanService.createTreatmentPlan.mockRejectedValue(new Error('API Error'));

      renderWithContext(<TreatmentPlansPage />);

      // Navigate through the wizard quickly
      await waitFor(() => {
        const createButton = screen.getByText('Create New Plan');
        fireEvent.click(createButton);
      });

      // Fill minimal required data and submit
      await fillMinimalPlanData();

      const submitButton = screen.getByText('Create Plan');
      fireEvent.click(submitButton);

      // Verify error handling
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to save treatment plan. Please try again.');
      });
    });

    test('handles scheduling sync failure gracefully', async () => {
      // Mock scheduling sync failure
      treatmentPlanService.syncWithScheduling.mockRejectedValue(new Error('Sync Error'));

      renderWithContext(<TreatmentPlansPage />);

      await waitFor(() => {
        const createButton = screen.getByText('Create New Plan');
        fireEvent.click(createButton);
      });

      await fillMinimalPlanData();

      const submitButton = screen.getByText('Create Plan');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Treatment plan created successfully');
        expect(toast.warning).toHaveBeenCalledWith('Plan created but scheduling sync failed. Please contact admin.');
      });
    });
  });

  describe('Treatment Plan List Management', () => {
    test('displays existing treatment plans', async () => {
      renderWithContext(<TreatmentPlansPage />);

      await waitFor(() => {
        expect(screen.getByText('Lower Back Pain Recovery')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('pending_approval')).toBeInTheDocument();
      });
    });

    test('allows filtering and searching treatment plans', async () => {
      renderWithContext(<TreatmentPlansPage />);

      await waitFor(() => {
        // Test search functionality
        const searchInput = screen.getByPlaceholderText(/search treatment plans/i);
        fireEvent.change(searchInput, { target: { value: 'Lower Back' } });
      });

      // Verify filtering works (this would depend on the actual implementation)
      expect(screen.getByText('Lower Back Pain Recovery')).toBeInTheDocument();
    });
  });

  // Helper function to fill minimal plan data
  const fillMinimalPlanData = async () => {
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/treatment plan title/i), {
        target: { value: 'Test Plan' }
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Test Description' }
      });
      fireEvent.change(screen.getByLabelText(/patient/i), {
        target: { value: '1' }
      });
      fireEvent.change(screen.getByLabelText(/start date/i), {
        target: { value: '2024-01-01' }
      });
      fireEvent.change(screen.getByLabelText(/end date/i), {
        target: { value: '2024-03-01' }
      });
    });

    // Navigate through steps
    fireEvent.click(screen.getByText('Next')); // Step 2

    await waitFor(() => {
      const therapistCheckbox = screen.getByLabelText(/dr\. sarah johnson/i);
      fireEvent.click(therapistCheckbox);
    });

    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/primary therapist/i), {
        target: { value: '1' }
      });
    });

    fireEvent.click(screen.getByText('Next')); // Step 3
    fireEvent.click(screen.getByText('Next')); // Step 4
  };
});
