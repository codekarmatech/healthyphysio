import treatmentPlanService from '../treatmentPlanService';
import api from '../api';

// Mock the api module
jest.mock('../api');

describe('TreatmentPlanService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Treatment Plans CRUD Operations', () => {
    test('getAllTreatmentPlans calls correct endpoint', async () => {
      const mockResponse = { data: [] };
      api.get.mockResolvedValue(mockResponse);

      const result = await treatmentPlanService.getAllTreatmentPlans();

      expect(api.get).toHaveBeenCalledWith('/treatment-plans/treatment-plans/', { params: {} });
      expect(result).toBe(mockResponse);
    });

    test('getTreatmentPlan calls correct endpoint with ID', async () => {
      const mockResponse = { data: { id: 1 } };
      api.get.mockResolvedValue(mockResponse);

      const result = await treatmentPlanService.getTreatmentPlan(1);

      expect(api.get).toHaveBeenCalledWith('/treatment-plans/treatment-plans/1/');
      expect(result).toBe(mockResponse);
    });

    test('createTreatmentPlan calls correct endpoint with data', async () => {
      const mockData = { title: 'Test Plan' };
      const mockResponse = { data: { id: 1, ...mockData } };
      api.post.mockResolvedValue(mockResponse);

      const result = await treatmentPlanService.createTreatmentPlan(mockData);

      expect(api.post).toHaveBeenCalledWith('/treatment-plans/treatment-plans/', mockData);
      expect(result).toBe(mockResponse);
    });

    test('updateTreatmentPlan calls correct endpoint with ID and data', async () => {
      const mockData = { title: 'Updated Plan' };
      const mockResponse = { data: { id: 1, ...mockData } };
      api.put.mockResolvedValue(mockResponse);

      const result = await treatmentPlanService.updateTreatmentPlan(1, mockData);

      expect(api.put).toHaveBeenCalledWith('/treatment-plans/treatment-plans/1/', mockData);
      expect(result).toBe(mockResponse);
    });

    test('deleteTreatmentPlan calls correct endpoint with ID', async () => {
      const mockResponse = { data: {} };
      api.delete.mockResolvedValue(mockResponse);

      const result = await treatmentPlanService.deleteTreatmentPlan(1);

      expect(api.delete).toHaveBeenCalledWith('/treatment-plans/treatment-plans/1/');
      expect(result).toBe(mockResponse);
    });
  });

  describe('Daily Treatments Operations', () => {
    test('getAllDailyTreatments calls correct endpoint', async () => {
      const mockResponse = { data: [] };
      api.get.mockResolvedValue(mockResponse);

      const result = await treatmentPlanService.getAllDailyTreatments();

      expect(api.get).toHaveBeenCalledWith('/treatment-plans/daily-treatments/', { params: {} });
      expect(result).toBe(mockResponse);
    });

    test('createDailyTreatment calls correct endpoint with data', async () => {
      const mockData = { title: 'Daily Treatment' };
      const mockResponse = { data: { id: 1, ...mockData } };
      api.post.mockResolvedValue(mockResponse);

      const result = await treatmentPlanService.createDailyTreatment(mockData);

      expect(api.post).toHaveBeenCalledWith('/treatment-plans/daily-treatments/', mockData);
      expect(result).toBe(mockResponse);
    });
  });

  describe('Interventions Operations', () => {
    test('getAllInterventions calls correct endpoint', async () => {
      const mockResponse = { data: [] };
      api.get.mockResolvedValue(mockResponse);

      const result = await treatmentPlanService.getAllInterventions();

      expect(api.get).toHaveBeenCalledWith('/treatment-plans/interventions/', { params: {} });
      expect(result).toBe(mockResponse);
    });

    test('getInterventions handles API errors gracefully', async () => {
      api.get.mockRejectedValue(new Error('API Error'));

      const result = await treatmentPlanService.getInterventions();

      expect(result.data).toBeDefined();
      expect(result.mock_data).toBe(true);
    });
  });

  describe('Scheduling Integration', () => {
    test('syncWithScheduling calls correct endpoint', async () => {
      const mockResponse = { data: { success: true } };
      api.post.mockResolvedValue(mockResponse);

      const result = await treatmentPlanService.syncWithScheduling(1);

      expect(api.post).toHaveBeenCalledWith('/treatment-plans/treatment-plans/1/sync-scheduling/');
      expect(result).toBe(mockResponse);
    });

    test('syncWithScheduling handles errors', async () => {
      api.post.mockRejectedValue(new Error('Sync Error'));

      await expect(treatmentPlanService.syncWithScheduling(1)).rejects.toThrow('Sync Error');
    });

    test('getRelatedAppointments calls correct endpoint', async () => {
      const mockResponse = { data: [] };
      api.get.mockResolvedValue(mockResponse);

      const result = await treatmentPlanService.getRelatedAppointments(1);

      expect(api.get).toHaveBeenCalledWith('/treatment-plans/treatment-plans/1/appointments/');
      expect(result).toBe(mockResponse);
    });

    test('getRelatedAppointments handles errors gracefully', async () => {
      api.get.mockRejectedValue(new Error('API Error'));

      const result = await treatmentPlanService.getRelatedAppointments(1);

      expect(result.data).toEqual([]);
    });
  });

  describe('Notification System', () => {
    test('notifyTreatmentPlanUpdate calls correct endpoint with data', async () => {
      const mockResponse = { data: { success: true } };
      api.post.mockResolvedValue(mockResponse);

      const result = await treatmentPlanService.notifyTreatmentPlanUpdate(1, 'created', [1, 2]);

      expect(api.post).toHaveBeenCalledWith('/treatment-plans/treatment-plans/1/notify/', {
        update_type: 'created',
        recipients: [1, 2]
      });
      expect(result).toBe(mockResponse);
    });

    test('notifyTreatmentPlanUpdate handles errors', async () => {
      api.post.mockRejectedValue(new Error('Notification Error'));

      await expect(
        treatmentPlanService.notifyTreatmentPlanUpdate(1, 'created', [1, 2])
      ).rejects.toThrow('Notification Error');
    });
  });

  describe('Sessions Operations', () => {
    test('getAllSessions calls correct endpoint', async () => {
      const mockResponse = { data: [] };
      api.get.mockResolvedValue(mockResponse);

      const result = await treatmentPlanService.getAllSessions();

      expect(api.get).toHaveBeenCalledWith('/treatment-plans/sessions/', { params: {} });
      expect(result).toBe(mockResponse);
    });

    test('completeSession calls correct endpoint', async () => {
      const mockData = { notes: 'Session completed' };
      const mockResponse = { data: { success: true } };
      api.post.mockResolvedValue(mockResponse);

      const result = await treatmentPlanService.completeSession(1, mockData);

      expect(api.post).toHaveBeenCalledWith('/treatment-plans/sessions/1/complete/', mockData);
      expect(result).toBe(mockResponse);
    });

    test('markSessionMissed calls correct endpoint', async () => {
      const mockResponse = { data: { success: true } };
      api.post.mockResolvedValue(mockResponse);

      const result = await treatmentPlanService.markSessionMissed(1);

      expect(api.post).toHaveBeenCalledWith('/treatment-plans/sessions/1/mark_missed/');
      expect(result).toBe(mockResponse);
    });
  });

  describe('Mock Data Methods', () => {
    test('getMockTreatmentPlans returns expected structure', async () => {
      const result = await treatmentPlanService.getMockTreatmentPlans();

      expect(result.data).toBeInstanceOf(Array);
      expect(result.mock_data).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('title');
      expect(result.data[0]).toHaveProperty('patient');
    });

    test('getMockInterventions returns expected structure', async () => {
      const result = await treatmentPlanService.getMockInterventions();

      expect(result.data).toBeInstanceOf(Array);
      expect(result.mock_data).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('name');
      expect(result.data[0]).toHaveProperty('category');
    });

    test('getMockDailyTreatments returns expected structure', async () => {
      const result = await treatmentPlanService.getMockDailyTreatments();

      expect(result.data).toBeInstanceOf(Array);
      expect(result.mock_data).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('day_number');
      expect(result.data[0]).toHaveProperty('interventions');
    });
  });

  describe('Error Handling', () => {
    test('getAllTreatmentPlans falls back to mock data on error', async () => {
      api.get.mockRejectedValue(new Error('API Error'));

      const result = await treatmentPlanService.getAllTreatmentPlans();

      expect(result.data).toBeInstanceOf(Array);
      expect(result.mock_data).toBe(true);
    });

    test('getDailyTreatments falls back to mock data on error', async () => {
      api.get.mockRejectedValue(new Error('API Error'));

      const result = await treatmentPlanService.getDailyTreatments(1);

      expect(result.data).toBeInstanceOf(Array);
      expect(result.mock_data).toBe(true);
    });
  });
});
