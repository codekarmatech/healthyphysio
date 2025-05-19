import { normalizeResponse, getCount, getItems, getProperty, isMockData } from './responseNormalizer';

describe('Response Normalizer Utility', () => {
  describe('normalizeResponse', () => {
    test('handles null or undefined response', () => {
      expect(normalizeResponse(null)).toEqual({ items: [], count: 0, normalized: true });
      expect(normalizeResponse(undefined)).toEqual({ items: [], count: 0, normalized: true });
    });

    test('handles response with no data property', () => {
      const response = { status: 200 };
      expect(normalizeResponse(response)).toEqual({ items: [], count: 0, normalized: true });
    });

    test('handles response with array data', () => {
      const response = { data: [{ id: 1 }, { id: 2 }] };
      expect(normalizeResponse(response)).toEqual({
        items: [{ id: 1 }, { id: 2 }],
        count: 2,
        normalized: true
      });
    });

    test('handles response with paginated data', () => {
      const response = {
        data: {
          results: [{ id: 1 }, { id: 2 }],
          count: 10,
          next: 'http://example.com/api/items?page=2',
          previous: null
        }
      };
      expect(normalizeResponse(response)).toEqual({
        items: [{ id: 1 }, { id: 2 }],
        count: 10,
        next: 'http://example.com/api/items?page=2',
        previous: null,
        normalized: true
      });
    });

    test('handles response with collection key', () => {
      const response = {
        data: {
          items: [{ id: 1 }, { id: 2 }],
          meta: { total: 2 }
        }
      };
      expect(normalizeResponse(response, 'items')).toEqual({
        items: [{ id: 1 }, { id: 2 }],
        count: 2,
        meta: { total: 2 },
        normalized: true
      });
    });

    test('handles response with count but no items', () => {
      const response = {
        data: {
          count: 0
        }
      };
      expect(normalizeResponse(response)).toEqual({
        items: [],
        count: 0,
        normalized: true
      });
    });

    test('handles unknown response format', () => {
      const response = {
        data: {
          something: 'unexpected'
        }
      };
      expect(normalizeResponse(response)).toEqual({
        items: [],
        count: 0,
        originalData: { something: 'unexpected' },
        normalized: true
      });
    });
  });

  describe('getCount', () => {
    test('returns 0 for null or undefined response', () => {
      expect(getCount(null)).toBe(0);
      expect(getCount(undefined)).toBe(0);
    });

    test('returns count from normalized response', () => {
      const normalizedResponse = { count: 5, normalized: true };
      expect(getCount(normalizedResponse)).toBe(5);
    });

    test('normalizes response and returns count', () => {
      const response = { data: [1, 2, 3] };
      expect(getCount(response)).toBe(3);
    });
  });

  describe('getItems', () => {
    test('returns empty array for null or undefined response', () => {
      expect(getItems(null)).toEqual([]);
      expect(getItems(undefined)).toEqual([]);
    });

    test('returns items from normalized response', () => {
      const normalizedResponse = { items: [1, 2, 3], normalized: true };
      expect(getItems(normalizedResponse)).toEqual([1, 2, 3]);
    });

    test('normalizes response and returns items', () => {
      const response = { data: [1, 2, 3] };
      expect(getItems(response)).toEqual([1, 2, 3]);
    });
  });

  describe('getProperty', () => {
    test('returns default value for null or undefined response', () => {
      expect(getProperty(null, 'prop', 'default')).toBe('default');
      expect(getProperty(undefined, 'prop', 'default')).toBe('default');
    });

    test('returns property from response data', () => {
      const response = { data: { prop: 'value' } };
      expect(getProperty(response, 'prop')).toBe('value');
    });

    test('returns default value when property does not exist', () => {
      const response = { data: {} };
      expect(getProperty(response, 'prop', 'default')).toBe('default');
    });
  });

  describe('isMockData', () => {
    test('returns false for null or undefined response', () => {
      expect(isMockData(null)).toBe(false);
      expect(isMockData(undefined)).toBe(false);
    });

    test('returns true when isMockData is true in response data', () => {
      const response = { data: { isMockData: true } };
      expect(isMockData(response)).toBe(true);
    });

    test('returns true when isMockData is true in response itself', () => {
      const response = { isMockData: true };
      expect(isMockData(response)).toBe(true);
    });

    test('returns false when isMockData is false or not present', () => {
      expect(isMockData({ data: { isMockData: false } })).toBe(false);
      expect(isMockData({ data: {} })).toBe(false);
    });
  });
});
