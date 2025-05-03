# Earnings Module

This module tracks therapist earnings from appointments and provides API endpoints for retrieving earnings data.

## Features

- Track earnings from completed and cancelled appointments
- Calculate earnings summaries by month
- Generate sample data for new therapists
- Automatically create earnings records when appointments are completed or cancelled

## API Endpoints

### Get Monthly Earnings

```
GET /api/earnings/monthly/{therapist_id}/?year={year}&month={month}
```

Returns earnings data for a specific therapist for a given month, including:
- List of individual earnings records
- Summary statistics (total earned, attendance rate, etc.)
- Daily earnings breakdown

#### Response Format

```json
{
  "earnings": [
    {
      "id": 1,
      "therapist": 1,
      "patient": 5,
      "date": "2023-05-15",
      "session_type": "Physical Therapy",
      "amount": "75.00",
      "full_amount": "75.00",
      "status": "completed",
      "payment_status": "paid",
      "payment_date": "2023-05-15",
      "notes": "Automatically generated from appointment #123"
    },
    ...
  ],
  "summary": {
    "totalEarned": "750.00",
    "totalPotential": "900.00",
    "completedSessions": 8,
    "cancelledSessions": 2,
    "missedSessions": 1,
    "attendedSessions": 8,
    "attendanceRate": 88.89,
    "averagePerSession": "93.75"
  },
  "dailyEarnings": [
    {
      "date": "2023-05-01",
      "amount": "150.00",
      "sessions": 2
    },
    ...
  ],
  "year": 2023,
  "month": 5
}
```

## Sample Data for New Therapists

For therapists who don't have any real earnings data yet, the API will return sample data to demonstrate how the earnings dashboard will look once they start seeing patients.

## Management Commands

### Generate Sample Earnings Data

To generate sample earnings data for testing:

```bash
python manage.py generate_earnings --therapist_id=1 --month=5 --year=2023 --count=10
```

Parameters:
- `--therapist_id`: ID of the therapist to generate earnings for (optional, will use a random therapist if not provided)
- `--month`: Month (1-12) to generate earnings for (optional, defaults to current month)
- `--year`: Year to generate earnings for (optional, defaults to current year)
- `--count`: Number of earnings records to generate (optional, defaults to 10)

## Integration with Appointments

Earnings records are automatically created when:
- An appointment is marked as completed
- An appointment is cancelled (with or without a cancellation fee)

This is handled by the signal handler in `signals.py`.