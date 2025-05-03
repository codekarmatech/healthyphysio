# Final URL Structure for Earnings API

## Overview

This document outlines the final URL structure for the earnings API, which follows a role-based approach.

## URL Structure

### Base URL

```
/api/earnings/
```

### Role-Specific Endpoints

#### Therapist Earnings

```
/api/earnings/therapist/{therapist_id}/monthly/?year={year}&month={month}
```

This endpoint returns monthly earnings data for a specific therapist, including:
- List of individual earnings records
- Summary statistics (total earned, attendance rate, etc.)
- Daily earnings breakdown

#### Doctor Earnings

```
/api/earnings/doctor/{doctor_id}/monthly/?year={year}&month={month}
```

This endpoint will return monthly earnings data for a specific doctor (not yet implemented).

#### Admin Earnings Summary

```
/api/earnings/admin/summary/
```

This endpoint will return an earnings summary for administrators (not yet implemented).

### Legacy URL Support

For backward compatibility, the following URL is also supported:

```
/api/earnings/monthly/{therapist_id}/?year={year}&month={month}
```

This URL maps to the same endpoint as the therapist earnings URL.

## Frontend Integration

The frontend uses the EarningsService to interact with these endpoints:

```javascript
// Base path for all earnings endpoints
constructor() {
  super('/earnings/');
}

// Get monthly earnings for a therapist
async getMonthlyEarnings(therapistId, year, month) {
  return api.get(`${this.basePath}therapist/${therapistId}/monthly/?year=${year}&month=${month}`);
}
```

## Benefits of This Structure

1. **Role-Based Organization**: The URL structure clearly indicates which role the earnings data is for.
2. **Extensibility**: New role-specific endpoints can be added easily.
3. **Consistency**: All earnings-related endpoints are under the same base path.
4. **Backward Compatibility**: Legacy URLs are still supported.

## Testing

To test these endpoints:

1. Therapist Earnings: `/api/earnings/therapist/2/monthly/?year=2025&month=5`
2. Doctor Earnings: `/api/earnings/doctor/1/monthly/?year=2025&month=5` (returns 501 Not Implemented)
3. Admin Summary: `/api/earnings/admin/summary/` (returns 501 Not Implemented)
4. Legacy URL: `/api/earnings/monthly/2/?year=2025&month=5`