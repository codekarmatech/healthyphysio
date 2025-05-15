import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminReportViewPage from '../AdminReportViewPage';
import sessionService from '../../../services/sessionService';

// Mock the services
jest.mock('../../../services/sessionService');
jest.mock('react-toastify');

// Mock the context
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
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

describe('AdminReportViewPage', () => {
  const mockSession = {
    id: '1',
    status: 'completed',
    report_status: 'submitted',
    report_submitted_at: '2023-01-01T12:00:00+0000',
    local_datetime: '2023-01-01T10:00:00+0000',
    therapist_notes: 'Detailed therapist notes',
    treatment_provided: 'Physical therapy and exercises',
    patient_progress: 'Good progress, improving mobility',
    pain_level_before: 7,
    pain_level_after: 4,
    mobility_assessment: 'Limited range of motion in shoulder',
    recommendations: 'Continue with home exercises',
    next_session_goals: 'Increase shoulder mobility',
    report_history: [
      {
        therapist_notes: 'Initial notes',
        treatment_provided: 'Initial treatment',
        patient_progress: 'Initial progress',
        timestamp: '2023-01-01T11:00:00+0000',
        user: 'therapist'
      }
    ],
    appointment_details: {
      session_code: 'PT-20230101-TST-ABCD',
      patient_details: {
        user: {
          first_name: 'Test',
          last_name: 'Patient'
        }
      },
      therapist_details: {
        user: {
          first_name: 'Test',
          last_name: 'Therapist'
        }
      }
    }
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    sessionService.getById.mockResolvedValue({ data: mockSession });
    sessionService.reviewReport.mockResolvedValue({
      data: {
        message: 'Report reviewed successfully',
        report_status: 'reviewed',
        reviewed_at: '2023-01-01T14:00:00+0000'
      }
    });
  });

  test('renders loading state initially', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/report/1']}>
        <Routes>
          <Route path="/admin/report/:id" element={<AdminReportViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toHaveTextContent('View Report');
  });

  test('renders report details after loading', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/report/1']}>
        <Routes>
          <Route path="/admin/report/:id" element={<AdminReportViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the session to load
    await waitFor(() => {
      expect(sessionService.getById).toHaveBeenCalledWith('1');
    });

    // Check that report information is displayed using findByText
    await screen.findByText('Session Report');
    await screen.findByText(/Test Therapist/);
    await screen.findByText(/Test Patient/);
    await screen.findByText('Report Content');
    await screen.findByText('Therapist Notes');
    await screen.findByText('Detailed therapist notes');
    await screen.findByText('Treatment Provided');
    await screen.findByText('Physical therapy and exercises');
    await screen.findByText('Patient Progress');
    await screen.findByText('Good progress, improving mobility');

    // Check that pain assessment is displayed
    await screen.findByText('Pain Assessment');
    await screen.findByText(/Before Treatment:/);
    await screen.findByText(/7\/10/);
    await screen.findByText(/After Treatment:/);
    await screen.findByText(/4\/10/);

    // Check that other sections are displayed
    await screen.findByText('Mobility Assessment');
    await screen.findByText('Limited range of motion in shoulder');
    await screen.findByText('Recommendations');
    await screen.findByText('Continue with home exercises');
    await screen.findByText('Next Session Goals');
    await screen.findByText('Increase shoulder mobility');

    // Check that report history is displayed
    await screen.findByText('Report History');
    await screen.findByText('Initial notes');
  });

  test('allows reviewing a report', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/report/1']}>
        <Routes>
          <Route path="/admin/report/:id" element={<AdminReportViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the session to load
    await waitFor(() => {
      expect(sessionService.getById).toHaveBeenCalledWith('1');
    });

    // Enter review notes
    const notesInput = await screen.findByLabelText('Review Notes');
    fireEvent.change(notesInput, { target: { value: 'Looks good' } });

    // Click approve button
    const approveButton = screen.getByText('Approve Report');
    fireEvent.click(approveButton);

    // Check that service was called correctly - one assertion per waitFor
    await waitFor(() => expect(sessionService.reviewReport).toHaveBeenCalledWith('1', false, 'Looks good'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Report reviewed successfully'));
  });

  test('allows flagging a report', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/report/1']}>
        <Routes>
          <Route path="/admin/report/:id" element={<AdminReportViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the session to load
    await waitFor(() => {
      expect(sessionService.getById).toHaveBeenCalledWith('1');
    });

    // Enter review notes
    const notesInput = await screen.findByLabelText('Review Notes');
    fireEvent.change(notesInput, { target: { value: 'Needs more detail' } });

    // Click flag button
    const flagButton = screen.getByText('Flag for Review');
    fireEvent.click(flagButton);

    // Check that service was called correctly - one assertion per waitFor
    await waitFor(() => expect(sessionService.reviewReport).toHaveBeenCalledWith('1', true, 'Needs more detail'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Report flagged successfully'));
  });

  test('does not show review section for already reviewed reports', async () => {
    // Mock a reviewed session
    const reviewedSession = {
      ...mockSession,
      report_status: 'reviewed',
      report_reviewed_at: '2023-01-01T14:00:00+0000',
      report_reviewed_by: {
        id: '1',
        username: 'admin',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin'
      }
    };

    sessionService.getById.mockResolvedValue({ data: reviewedSession });

    render(
      <MemoryRouter initialEntries={['/admin/report/1']}>
        <Routes>
          <Route path="/admin/report/:id" element={<AdminReportViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the session to load
    await waitFor(() => {
      expect(sessionService.getById).toHaveBeenCalledWith('1');
    });

    // Check that review section is not displayed - one assertion per waitFor
    await waitFor(() => expect(screen.queryByText('Review Report')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.queryByLabelText('Review Notes')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.queryByText('Approve Report')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.queryByText('Flag for Review')).not.toBeInTheDocument());
  });

  test('renders error when session not found', async () => {
    // Mock API error
    sessionService.getById.mockRejectedValue(new Error('Session not found'));

    render(
      <MemoryRouter initialEntries={['/admin/report/999']}>
        <Routes>
          <Route path="/admin/report/:id" element={<AdminReportViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the API call to fail
    await waitFor(() => {
      expect(sessionService.getById).toHaveBeenCalledWith('999');
    });

    // Check that error message is displayed using findByText
    await screen.findByText('Failed to load session data. Please try again.');
  });
});
