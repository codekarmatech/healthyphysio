import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'react-toastify';
import SubmittedReportsPage from '../SubmittedReportsPage';
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

describe('SubmittedReportsPage', () => {
  const mockSubmittedSessions = [
    {
      id: '1',
      status: 'completed',
      report_status: 'submitted',
      report_submitted_at: '2023-01-01T12:00:00+0000',
      local_datetime: '2023-01-01T10:00:00+0000',
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
    },
    {
      id: '2',
      status: 'completed',
      report_status: 'submitted',
      report_submitted_at: '2023-01-02T12:00:00+0000',
      local_datetime: '2023-01-02T10:00:00+0000',
      appointment_details: {
        session_code: 'PT-20230102-TST-EFGH',
        patient_details: {
          user: {
            first_name: 'Another',
            last_name: 'Patient'
          }
        },
        therapist_details: {
          user: {
            first_name: 'Another',
            last_name: 'Therapist'
          }
        }
      }
    }
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    sessionService.getSubmittedReports.mockResolvedValue({ data: mockSubmittedSessions });
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
      <MemoryRouter>
        <SubmittedReportsPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toHaveTextContent('Submitted Reports');
  });

  test('renders submitted reports after loading', async () => {
    render(
      <MemoryRouter>
        <SubmittedReportsPage />
      </MemoryRouter>
    );

    // Wait for the reports to load
    await waitFor(() => {
      expect(sessionService.getSubmittedReports).toHaveBeenCalled();
    });

    // Check that reports are displayed using findByText
    await screen.findByText('Submitted Session Reports');
    await screen.findByText('Test Therapist');
    await screen.findByText('Another Therapist');
    await screen.findByText('Test Patient');
    await screen.findByText('Another Patient');

    // Check that action buttons are present
    const viewButtons = await screen.findAllByText('View');
    const reviewButtons = await screen.findAllByText('Review');
    expect(viewButtons).toHaveLength(2);
    expect(reviewButtons).toHaveLength(2);

    // Check link href using findByRole
    const firstViewLink = await screen.findByRole('link', { name: 'View', href: '/admin/report/1' });
    expect(firstViewLink).toHaveAttribute('href', '/admin/report/1');
  });

  test('opens review modal when review button is clicked', async () => {
    render(
      <MemoryRouter>
        <SubmittedReportsPage />
      </MemoryRouter>
    );

    // Wait for the reports to load
    await waitFor(() => {
      expect(sessionService.getSubmittedReports).toHaveBeenCalled();
    });

    // Click the review button
    const reviewButtons = await screen.findAllByText('Review');
    fireEvent.click(reviewButtons[0]);

    // Check that modal is displayed
    expect(screen.getByText('Review Report')).toBeInTheDocument();
    expect(screen.getByText(/Test Therapist/)).toBeInTheDocument();
    expect(screen.getByText(/Test Patient/)).toBeInTheDocument();
    expect(screen.getByLabelText('Review Notes')).toBeInTheDocument();
    expect(screen.getByText('Approve Report')).toBeInTheDocument();
    expect(screen.getByText('Flag for Review')).toBeInTheDocument();
  });

  test('approves report when approve button is clicked', async () => {
    render(
      <MemoryRouter>
        <SubmittedReportsPage />
      </MemoryRouter>
    );

    // Wait for the reports to load
    await waitFor(() => {
      expect(sessionService.getSubmittedReports).toHaveBeenCalled();
    });

    // Click the review button
    const reviewButtons = await screen.findAllByText('Review');
    fireEvent.click(reviewButtons[0]);

    // Enter review notes
    const notesInput = screen.getByLabelText('Review Notes');
    fireEvent.change(notesInput, { target: { value: 'Looks good' } });

    // Click approve button
    const approveButton = screen.getByText('Approve Report');
    fireEvent.click(approveButton);

    // Check that service was called correctly - one assertion per waitFor
    await waitFor(() => expect(sessionService.reviewReport).toHaveBeenCalledWith('1', false, 'Looks good'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Report approved successfully'));

    // Check that modal is closed
    await waitFor(() => {
      expect(screen.queryByText('Review Report')).not.toBeInTheDocument();
    });
  });

  test('flags report when flag button is clicked', async () => {
    render(
      <MemoryRouter>
        <SubmittedReportsPage />
      </MemoryRouter>
    );

    // Wait for the reports to load
    await waitFor(() => {
      expect(sessionService.getSubmittedReports).toHaveBeenCalled();
    });

    // Click the review button
    const reviewButtons = await screen.findAllByText('Review');
    fireEvent.click(reviewButtons[0]);

    // Enter review notes
    const notesInput = screen.getByLabelText('Review Notes');
    fireEvent.change(notesInput, { target: { value: 'Needs more detail' } });

    // Click flag button
    const flagButton = screen.getByText('Flag for Review');
    fireEvent.click(flagButton);

    // Check that service was called correctly - one assertion per waitFor
    await waitFor(() => expect(sessionService.reviewReport).toHaveBeenCalledWith('1', true, 'Needs more detail'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Report flagged successfully'));
  });

  test('renders message when no submitted reports', async () => {
    // Mock empty response
    sessionService.getSubmittedReports.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <SubmittedReportsPage />
      </MemoryRouter>
    );

    // Wait for the reports to load
    await waitFor(() => {
      expect(sessionService.getSubmittedReports).toHaveBeenCalled();
    });

    // Check that empty message is displayed using findByText
    await screen.findByText('No submitted reports pending review.');
  });

  test('renders error message when API fails', async () => {
    // Mock API error
    sessionService.getSubmittedReports.mockRejectedValue(new Error('API error'));

    render(
      <MemoryRouter>
        <SubmittedReportsPage />
      </MemoryRouter>
    );

    // Wait for the API call to fail
    await waitFor(() => {
      expect(sessionService.getSubmittedReports).toHaveBeenCalled();
    });

    // Check that error message is displayed using findByText
    await screen.findByText('Failed to load submitted reports. Please try again.');
  });
});
