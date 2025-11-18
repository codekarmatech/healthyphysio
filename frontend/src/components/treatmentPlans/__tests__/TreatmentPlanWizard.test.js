import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TreatmentPlanWizard from '../TreatmentPlanWizard';

// Mock modules first
jest.mock('../../../services/patientService', () => ({
  getAllPatients: jest.fn()
}));

jest.mock('../../../services/therapistService', () => ({
  getAll: jest.fn()
}));

jest.mock('../../../services/treatmentPlanService', () => ({
  getAllInterventions: jest.fn(),
  createTreatmentPlan: jest.fn(),
  syncWithScheduling: jest.fn(),
  notifyTreatmentPlanUpdate: jest.fn()
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn()
  }
}));

// Import mocked services
import patientService from '../../../services/patientService';
import therapistService from '../../../services/therapistService';
import treatmentPlanService from '../../../services/treatmentPlanService';

// Mock data
const mockUser = {
  id: 1,
  is_admin: true,
  firstName: 'Admin',
  lastName: 'User'
};

const mockPatients = [
  {
    id: 1,
    user: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com'
    }
  },
  {
    id: 2,
    user: {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com'
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
  },
  {
    id: 2,
    user: {
      first_name: 'Dr. Michael',
      last_name: 'Chen',
      email: 'michael.chen@example.com'
    },
    specialization: 'Occupational Therapy'
  }
];

const mockInterventions = [
  { id: 1, name: 'Range of Motion Assessment', category: 'assessment', is_active: true },
  { id: 2, name: 'Gentle Stretching', category: 'exercise', is_active: true },
  { id: 3, name: 'Manual Therapy', category: 'therapy', is_active: true }
];

// Mock AuthContext
const mockAuthContext = {
  user: {
    id: 1,
    is_admin: true,
    firstName: 'Admin',
    lastName: 'User'
  }
};

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

const renderComponent = (props = {}) => {
  return render(<TreatmentPlanWizard {...props} />);
};

describe('TreatmentPlanWizard', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock responses
    patientService.getAllPatients.mockResolvedValue({ data: mockPatients });
    therapistService.getAll.mockResolvedValue({ data: mockTherapists });
    treatmentPlanService.getAllInterventions.mockResolvedValue({ data: mockInterventions });
    treatmentPlanService.createTreatmentPlan.mockResolvedValue({ data: { id: 1 } });
    treatmentPlanService.syncWithScheduling.mockResolvedValue({ data: { success: true } });
    treatmentPlanService.notifyTreatmentPlanUpdate.mockResolvedValue({ data: { success: true } });
  });

  describe('Initial Loading', () => {
    test('loads initial data correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(patientService.getAllPatients).toHaveBeenCalled();
        expect(therapistService.getAll).toHaveBeenCalled();
        expect(treatmentPlanService.getAllInterventions).toHaveBeenCalled();
      });
    });

    test('handles API errors gracefully', async () => {
      patientService.getAllPatients.mockRejectedValue(new Error('API Error'));

      renderComponent();

      await waitFor(() => {
        // Just check that the component doesn't crash
        expect(screen.getByText('Create Treatment Plan')).toBeInTheDocument();
      });
    });
  });

  describe('Basic Functionality', () => {
    test('renders treatment plan wizard', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Create Treatment Plan')).toBeInTheDocument();
        expect(screen.getByText('Step 1 of 4: Basic Information')).toBeInTheDocument();
      });
    });

    test('displays step indicator', async () => {
      renderComponent();

      await waitFor(() => {
        // Check that step indicators are present
        const stepIndicators = screen.getAllByText(/[1-4]/);
        expect(stepIndicators.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Service Integration', () => {
    test('calls patient service on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(patientService.getAllPatients).toHaveBeenCalled();
      });
    });

    test('calls therapist service for admin users', async () => {
      renderComponent();

      await waitFor(() => {
        expect(therapistService.getAll).toHaveBeenCalled();
      });
    });

    test('calls intervention service on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(treatmentPlanService.getAllInterventions).toHaveBeenCalled();
      });
    });
  });

});
