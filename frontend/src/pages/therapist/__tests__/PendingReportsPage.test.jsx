import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PendingReportsPage from '../PendingReportsPage';
import sessionService from '../../../services/sessionService';

// Mock the services
jest.mock('../../../services/sessionService');

// Mock the context
jest.mock('../../../contexts/AuthContext', () => ({
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

describe('PendingReportsPage', () => {
  const mockPendingSessions = [
    {
      id: '1',
      status: 'completed',
      report_status: 'pending',
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
    },
    {
      id: '2',
      status: 'completed',
      report_status: 'pending',
      local_datetime: '2023-01-02T10:00:00+0000',
      appointment_details: {
        session_code: 'PT-20230102-TST-EFGH',
        patient_details: {
          user: {
            first_name: 'Another',
            last_name: 'Patient'
          }
        }
      }
    }
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    sessionService.getPendingReports.mockResolvedValue({ data: mockPendingSessions });
  });

  test('renders loading state initially', async () => {
    render(
      <MemoryRouter>
        <PendingReportsPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toHaveTextContent('Pending Reports');
  });

  test('renders pending reports after loading', async () => {
    render(
      <MemoryRouter>
        <PendingReportsPage />
      </MemoryRouter>
    );

    // Wait for the reports to load
    await waitFor(() => {
      expect(sessionService.getPendingReports).toHaveBeenCalled();
    });

    // Check that reports are displayed using findByText
    await screen.findByText('Pending Session Reports');
    await screen.findByText('Test Patient');
    await screen.findByText('Another Patient');
    await screen.findByText('PT-20230101-TST-ABCD');
    await screen.findByText('PT-20230102-TST-EFGH');

    // Check that links to report pages are correct
    const links = await screen.findAllByText('Complete Report');
    expect(links).toHaveLength(2);

    // Get the links and check their href attributes
    const firstLink = await screen.findByRole('link', { name: 'Complete Report', href: '/therapist/report/1' });
    const secondLink = await screen.findByRole('link', { name: 'Complete Report', href: '/therapist/report/2' });
    expect(firstLink).toHaveAttribute('href', '/therapist/report/1');
    expect(secondLink).toHaveAttribute('href', '/therapist/report/2');
  });

  test('renders message when no pending reports', async () => {
    // Mock empty response
    sessionService.getPendingReports.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <PendingReportsPage />
      </MemoryRouter>
    );

    // Wait for the reports to load
    await waitFor(() => {
      expect(sessionService.getPendingReports).toHaveBeenCalled();
    });

    // Check that empty message is displayed using findByText
    await screen.findByText('No pending reports. All your sessions have been documented.');
  });

  test('renders error message when API fails', async () => {
    // Mock API error
    sessionService.getPendingReports.mockRejectedValue(new Error('API error'));

    render(
      <MemoryRouter>
        <PendingReportsPage />
      </MemoryRouter>
    );

    // Wait for the API call to fail
    await waitFor(() => {
      expect(sessionService.getPendingReports).toHaveBeenCalled();
    });

    // Check that error message is displayed using findByText
    await screen.findByText('Failed to load pending reports. Please try again.');
  });
});
