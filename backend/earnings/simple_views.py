"""
Simplified views for earnings API
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import permissions
from django.utils import timezone

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def simple_therapist_monthly_earnings(request, therapist_id):
    """
    Simplified version of the therapist monthly earnings endpoint
    """
    # Get query parameters and convert to integers
    try:
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', timezone.now().month))
    except (ValueError, TypeError):
        # Default to current year/month if conversion fails
        year = timezone.now().year
        month = timezone.now().month
    
    # Log the request
    print(f"DEBUG: Simple therapist_monthly_earnings called with therapist_id={therapist_id}, year={year}, month={month}")
    
    # Return a response in the expected format
    return Response({
        "summary": {
            "totalEarned": 1250.00,
            "monthlyEarned": 1250.00,
            "averagePerSession": 125.00,
            "attendedSessions": 10,
            "missedSessions": 2,
            "attendanceRate": 83
        },
        "earnings": [
            {
                "id": 1,
                "date": f"{year}-{month:02d}-01",
                "patient_name": "John Doe",
                "amount": 125.00,
                "session_type": "Regular Session",
                "status": "completed"
            },
            {
                "id": 2,
                "date": f"{year}-{month:02d}-03",
                "patient_name": "Jane Smith",
                "amount": 125.00,
                "session_type": "Regular Session",
                "status": "completed"
            }
        ],
        "isMockData": True
    })