import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { toast } from 'react-toastify';
import TherapistReportPage from '../TherapistReportPage';
import sessionService from '../../../services/sessionService';

// Mock the services
jest.mock('../../../services/sessionService');
jest.mock('react-toastify');

// Mock the context
jest.mock('../../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    user: {
      id: '1',
      firstName: 'Test',
      lastName: 'Therapist',
      role: 'therapist',
      therapist_id: '1'
    }
  })
}));

// Mock the components
jest.mock('../../../components/layout/DashboardLayout', () => ({
  __esModule: true,
  default: ({ children }) => React.createElement('div', { 'data-testid': 'dashboard-layout' }, children)
}));

jest.mock('../../../components/layout/Header', () => ({
  __esModule: true,
  default: ({ title }) => React.createElement('div', { 'data-testid': 'header' }, title)
}));

jest.mock('../../../components/layout/Footer', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'footer' }, 'Footer')
}));

jest.mock('../../../components/common/Spinner', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'spinner' }, 'Loading...')
}));

describe('TherapistReportPage', () => {
  const mockSession = {
    id: '1',
    appointment: '1',
    status: 'completed',
    report_status: 'pending',
    therapist_notes: '',
    treatment_provided: '',
    patient_progress: '',
    pain_level_before: '',
    pain_level_after: '',
    mobility_assessment: '',
    recommendations: '',
    next_session_goals: '',
    report_history: [],
    local_datetime: '2023-01-01T10:00:00+0000',
    appointment_details: {
      session_code: 'PT-20230101-TST-ABCD',
      patient_details: {
        user: {
          first_name: 'Test',
          last_name: 'Patient'
        }
      }
    }
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    sessionService.getById.mockResolvedValue({ data: mockSession });
    sessionService.updateReport.mockResolvedValue({ data: { message: 'Report updated successfully' } });
    sessionService.submitReport.mockResolvedValue({
      data: {
        message: 'Report submitted successfully',
        report_status: 'submitted',
        submitted_at: '2023-01-01T12:00:00+0000'
      }
    });
  });

  test('renders loading state initially', async () => {
    render(
      <MemoryRouter initialEntries={['/therapist/report/1']}>
        <Routes>
          <Route path="/therapist/report/:id" element={<TherapistReportPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toHaveTextContent('Therapist Daily Report');
  });

  test('renders session information after loading', async () => {
    render(
      <MemoryRouter initialEntries={['/therapist/report/1']}>
        <Routes>
          <Route path="/therapist/report/:id" element={<TherapistReportPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the session to load
    await waitFor(() => {
      expect(sessionService.getById).toHaveBeenCalledWith('1');
    });

    // Check that session information is displayed using findByText
    await screen.findByText(/Patient:/);
    await screen.findByText(/Test Patient/);
    await screen.findByText(/Session Code:/);
    await screen.findByText(/PT-20230101-TST-ABCD/);
  });

  test('allows updating report fields', async () => {
    render(
      <MemoryRouter initialEntries={['/therapist/report/1']}>
        <Routes>
          <Route path="/therapist/report/:id" element={<TherapistReportPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the session to load
    await waitFor(() => {
      expect(sessionService.getById).toHaveBeenCalledWith('1');
    });

    // Fill out the form
    const therapistNotesInput = await screen.findByLabelText(/Therapist Notes/);
    const treatmentProvidedInput = await screen.findByLabelText(/Treatment Provided/);
    const patientProgressInput = await screen.findByLabelText(/Patient Progress/);

    fireEvent.change(therapistNotesInput, { target: { value: 'Test therapist notes' } });
    fireEvent.change(treatmentProvidedInput, { target: { value: 'Test treatment provided' } });
    fireEvent.change(patientProgressInput, { target: { value: 'Test patient progress' } });

    // Save the draft
    const saveDraftButton = screen.getByText('Save Draft');
    fireEvent.click(saveDraftButton);

    // Check that the service was called with the correct data - one assertion per waitFor
    await waitFor(() => expect(sessionService.updateReport).toHaveBeenCalledWith('1', expect.objectContaining({
      therapist_notes: 'Test therapist notes',
      treatment_provided: 'Test treatment provided',
      patient_progress: 'Test patient progress'
    })));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Report saved successfully'));
  });

  test('allows submitting a report with required fields', async () => {
    render(
      <MemoryRouter initialEntries={['/therapist/report/1']}>
        <Routes>
          <Route path="/therapist/report/:id" element={<TherapistReportPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the session to load
    await waitFor(() => {
      expect(sessionService.getById).toHaveBeenCalledWith('1');
    });

    // Fill out the required fields
    const therapistNotesInput = await screen.findByLabelText(/Therapist Notes/);
    const treatmentProvidedInput = await screen.findByLabelText(/Treatment Provided/);
    const patientProgressInput = await screen.findByLabelText(/Patient Progress/);

    fireEvent.change(therapistNotesInput, { target: { value: 'Test therapist notes' } });
    fireEvent.change(treatmentProvidedInput, { target: { value: 'Test treatment provided' } });
    fireEvent.change(patientProgressInput, { target: { value: 'Test patient progress' } });

    // Submit the report
    const submitButton = screen.getByText('Submit Final Report');
    fireEvent.click(submitButton);

    // Check that the services were called correctly - one assertion per waitFor
    await waitFor(() => expect(sessionService.updateReport).toHaveBeenCalledWith('1', expect.objectContaining({
      therapist_notes: 'Test therapist notes',
      treatment_provided: 'Test treatment provided',
      patient_progress: 'Test patient progress'
    })));
    await waitFor(() => expect(sessionService.submitReport).toHaveBeenCalledWith('1'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Report submitted successfully'));
  });

  test('shows error when submitting without required fields', async () => {
    render(
      <MemoryRouter initialEntries={['/therapist/report/1']}>
        <Routes>
          <Route path="/therapist/report/:id" element={<TherapistReportPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the session to load
    await waitFor(() => {
      expect(sessionService.getById).toHaveBeenCalledWith('1');
    });

    // Submit without filling required fields
    const submitButton = screen.getByText('Submit Final Report');
    fireEvent.click(submitButton);

    // Check that toast.error was called - one assertion per waitFor
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    await waitFor(() => expect(sessionService.submitReport).not.toHaveBeenCalled());
  });

  test('displays report history if available', async () => {
    // Mock session with history
    const sessionWithHistory = {
      ...mockSession,
      report_history: [
        {
          therapist_notes: 'Previous notes',
          treatment_provided: 'Previous treatment',
          patient_progress: 'Previous progress',
          timestamp: '2023-01-01T09:00:00+0000',
          user: 'therapist'
        },
        {
          action: 'reviewed',
          notes: 'Looks good',
          timestamp: '2023-01-01T10:00:00+0000',
          user: 'admin'
        }
      ]
    };

    sessionService.getById.mockResolvedValue({ data: sessionWithHistory });

    render(
      <MemoryRouter initialEntries={['/therapist/report/1']}>
        <Routes>
          <Route path="/therapist/report/:id" element={<TherapistReportPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the session to load
    await waitFor(() => {
      expect(sessionService.getById).toHaveBeenCalledWith('1');
    });

    // Check that history is displayed using findByText
    await screen.findByText('Report History');
    await screen.findByText('Previous notes');
    await screen.findByText('Looks good');
  });
});
