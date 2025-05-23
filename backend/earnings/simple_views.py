"""
Real data views for earnings API - replacing mock data with actual database queries
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import permissions, status
from django.utils import timezone
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from decimal import Decimal
import calendar
from datetime import date

from .models import EarningRecord
from users.models import Therapist
from attendance.models import Attendance

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def simple_therapist_monthly_earnings(request, therapist_id):
    """
    Get real monthly earnings data for a therapist from the database
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
    print(f"DEBUG: Real therapist_monthly_earnings called with therapist_id={therapist_id}, year={year}, month={month}")

    # Role-based access control
    user = request.user
    if user.is_therapist:
        try:
            therapist = Therapist.objects.get(user=user)
            if str(therapist.id) != str(therapist_id):
                return Response(
                    {"error": "You can only view your own earnings data"},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Therapist.DoesNotExist:
            return Response(
                {"error": "Therapist profile not found"},
                status=status.HTTP_400_BAD_REQUEST
            )
    elif not user.is_admin:
        return Response(
            {"error": "You don't have permission to view this earnings data"},
            status=status.HTTP_403_FORBIDDEN
        )

    # Get the therapist object
    try:
        therapist = get_object_or_404(Therapist, id=therapist_id)
    except Exception as e:
        return Response(
            {"error": f"Therapist not found: {str(e)}"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Create date range for the month
    start_date = date(year, month, 1)
    end_date = date(year, month, calendar.monthrange(year, month)[1])

    # Query earnings records for the therapist and month
    earnings_records = EarningRecord.objects.filter(
        therapist=therapist,
        date__gte=start_date,
        date__lte=end_date
    ).select_related('patient__user', 'appointment', 'attendance', 'visit').order_by('date')

    # Calculate summary statistics - use therapist_amount for therapists
    total_earned = earnings_records.aggregate(
        total=Sum('therapist_amount')
    )['total'] or Decimal('0.00')

    # Count sessions by status
    completed_sessions = earnings_records.filter(
        status='completed'
    ).count()

    cancelled_sessions = earnings_records.filter(
        status='cancelled'
    ).count()

    # Get attendance data for the month
    attendance_records = Attendance.objects.filter(
        therapist=therapist,
        date__gte=start_date,
        date__lte=end_date
    )

    attended_sessions = attendance_records.filter(status='present').count()
    missed_sessions = attendance_records.filter(status='absent').count()

    # Calculate attendance rate
    total_sessions = attended_sessions + missed_sessions
    attendance_rate = (attended_sessions / total_sessions * 100) if total_sessions > 0 else 0

    # Calculate average per session
    average_per_session = (total_earned / completed_sessions) if completed_sessions > 0 else Decimal('0.00')

    # Serialize earnings records
    earnings_data = []
    for record in earnings_records:
        earnings_data.append({
            'id': record.id,
            'date': record.date.isoformat(),
            'patient_name': record.patient.user.get_full_name(),
            'amount': float(record.therapist_amount),  # Show therapist's portion to therapists
            'full_amount': float(record.full_amount),
            'session_type': record.session_type,
            'status': record.status,
            'payment_status': record.payment_status,
            'payment_date': record.payment_date.isoformat() if record.payment_date else None,
            'is_verified': record.is_verified,
            'notes': record.notes,
            # Visit tracking information (therapist-visible)
            'visit_info': {
                'manual_location_verified': record.visit.manual_location_verified if record.visit else False,
                'actual_start': record.visit.actual_start.isoformat() if record.visit and record.visit.actual_start else None,
                'actual_end': record.visit.actual_end.isoformat() if record.visit and record.visit.actual_end else None,
                'manual_arrival_time': record.visit.manual_arrival_time.isoformat() if record.visit and record.visit.manual_arrival_time else None,
                'manual_departure_time': record.visit.manual_departure_time.isoformat() if record.visit and record.visit.manual_departure_time else None,
                'status': record.visit.status if record.visit else None
            } if record.visit else None
        })

    # Generate daily earnings breakdown
    daily_earnings = []
    for day in range(1, calendar.monthrange(year, month)[1] + 1):
        day_date = date(year, month, day)
        day_earnings = earnings_records.filter(date=day_date).aggregate(
            total=Sum('therapist_amount')
        )['total'] or Decimal('0.00')

        daily_earnings.append({
            'date': day_date.isoformat(),
            'amount': float(day_earnings),
            'sessions': earnings_records.filter(date=day_date).count()
        })

    # Check if this is real data or if we should indicate it's limited data
    has_real_data = earnings_records.exists()

    response_data = {
        "summary": {
            "totalEarned": float(total_earned),
            "monthlyEarned": float(total_earned),
            "averagePerSession": float(average_per_session),
            "attendedSessions": attended_sessions,
            "missedSessions": missed_sessions,
            "completedSessions": completed_sessions,
            "cancelledSessions": cancelled_sessions,
            "attendanceRate": round(attendance_rate, 2)
        },
        "earnings": earnings_data,
        "dailyEarnings": daily_earnings,
        "year": year,
        "month": month,
        "isMockData": False,
        "hasRealData": has_real_data,
        "therapist_info": {
            "id": therapist.id,
            "name": therapist.user.get_full_name(),
            "username": therapist.user.username
        }
    }

    # If no real data exists, add a note
    if not has_real_data:
        response_data["note"] = "No earnings records found for this month. Complete appointments and mark attendance to see earnings data."

    return Response(response_data)