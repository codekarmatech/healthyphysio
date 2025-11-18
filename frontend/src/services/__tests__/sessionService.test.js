import sessionService from '../sessionService';
import api from '../api';

// Mock the api module
jest.mock('../api');

describe('sessionService', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    api.get.mockResolvedValue({ data: 'mock data' });
    api.post.mockResolvedValue({ data: 'mock data' });
    api.put.mockResolvedValue({ data: 'mock data' });
    api.patch.mockResolvedValue({ data: 'mock data' });
  });

  test('getByAppointment calls the correct endpoint', () => {
    sessionService.getByAppointment('123');
    expect(api.get).toHaveBeenCalledWith('/scheduling/sessions/?appointment=123');
  });

  test('initiateCheckIn calls the correct endpoint', async () => {
    await sessionService.initiateCheckIn('123');
    expect(api.post).toHaveBeenCalledWith('/scheduling/sessions/123/initiate_check_in/', {});
  });

  test('approveCheckIn calls the correct endpoint', async () => {
    await sessionService.approveCheckIn('123');
    expect(api.post).toHaveBeenCalledWith('/scheduling/sessions/123/approve_check_in/', {});
  });

  test('completeSession calls the correct endpoint with data', async () => {
    const data = {
      rating: 4,
      patient_notes: 'Good session',
      patient_feedback: 'Very helpful'
    };
    await sessionService.completeSession('123', data);
    expect(api.post).toHaveBeenCalledWith('/scheduling/sessions/123/complete/', data);
  });

  test('markAsMissed calls the correct endpoint', async () => {
    await sessionService.markAsMissed('123');
    expect(api.post).toHaveBeenCalledWith('/scheduling/sessions/123/mark_missed/', {});
  });

  test('validateSessionCode calls the correct endpoint', async () => {
    await sessionService.validateSessionCode('PT-20230101-TST-ABCD');
    expect(api.get).toHaveBeenCalledWith('/scheduling/validate-session-code/PT-20230101-TST-ABCD/');
  });

  // New report-related tests
  test('updateReport calls the correct endpoint with data', async () => {
    const reportData = {
      therapist_notes: 'Test notes',
      treatment_provided: 'Test treatment',
      patient_progress: 'Test progress'
    };
    await sessionService.updateReport('123', reportData);
    expect(api.post).toHaveBeenCalledWith('/scheduling/sessions/123/update_report/', reportData);
  });

  test('submitReport calls the correct endpoint', async () => {
    await sessionService.submitReport('123');
    expect(api.post).toHaveBeenCalledWith('/scheduling/sessions/123/submit_report/', {});
  });

  test('reviewReport calls the correct endpoint with flag=false', async () => {
    await sessionService.reviewReport('123', false, 'Looks good');
    expect(api.post).toHaveBeenCalledWith('/scheduling/sessions/123/review_report/', {
      flag: false,
      notes: 'Looks good'
    });
  });

  test('reviewReport calls the correct endpoint with flag=true', async () => {
    await sessionService.reviewReport('123', true, 'Needs more detail');
    expect(api.post).toHaveBeenCalledWith('/scheduling/sessions/123/review_report/', {
      flag: true,
      notes: 'Needs more detail'
    });
  });

  test('getPendingReports calls the correct endpoint', async () => {
    await sessionService.getPendingReports();
    expect(api.get).toHaveBeenCalledWith('/scheduling/sessions/pending_reports/');
  });

  test('getSubmittedReports calls the correct endpoint', async () => {
    await sessionService.getSubmittedReports();
    expect(api.get).toHaveBeenCalledWith('/scheduling/sessions/submitted_reports/');
  });
});
