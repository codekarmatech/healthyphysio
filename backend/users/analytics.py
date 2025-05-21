"""
Purpose: Analytics functions for therapist performance comparison
Connected to: Therapist analytics API endpoints
"""

from django.db.models import Count, Sum, Avg, F, Q, FloatField
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from users.models import Therapist
from scheduling.models import Appointment
from earnings.models import EarningRecord
from visits.models import TherapistReport

def get_therapist_analytics(start_date=None, end_date=None, area_id=None, specialization=None):
    """
    Get analytics data for comparing therapist performance
    
    Args:
        start_date: Start date for filtering data
        end_date: End date for filtering data
        area_id: Filter by area ID
        specialization: Filter by specialization
        
    Returns:
        List of therapist analytics data
    """
    # Set default date range if not provided (last 30 days)
    if not end_date:
        end_date = timezone.now().date()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Base queryset for therapists
    therapists = Therapist.objects.filter(is_approved=True)
    
    # Apply filters
    if area_id:
        therapists = therapists.filter(
            Q(therapistservicearea__area_id=area_id) | 
            Q(user__areas__id=area_id)
        ).distinct()
    
    if specialization:
        therapists = therapists.filter(specialization__icontains=specialization)
    
    # Prepare result list
    result = []
    
    for therapist in therapists:
        # Get appointments for this therapist in the date range
        appointments = Appointment.objects.filter(
            therapist=therapist,
            datetime__date__gte=start_date,
            datetime__date__lte=end_date
        )
        
        # Calculate appointment metrics
        total_appointments = appointments.count()
        completed_appointments = appointments.filter(status='COMPLETED').count()
        cancelled_appointments = appointments.filter(status='CANCELLED').count()
        completion_rate = (completed_appointments / total_appointments * 100) if total_appointments > 0 else 0
        
        # Get earnings for this therapist in the date range
        earnings = EarningRecord.objects.filter(
            therapist=therapist,
            date__gte=start_date,
            date__lte=end_date
        )
        
        # Calculate earnings metrics
        total_earnings = earnings.aggregate(
            total=Coalesce(Sum('therapist_amount'), Decimal('0'), output_field=FloatField())
        )['total']
        
        # Get reports for this therapist in the date range
        reports = TherapistReport.objects.filter(
            therapist=therapist,
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        )
        
        # Calculate report metrics
        total_reports = reports.count()
        on_time_reports = reports.filter(status='SUBMITTED').count()
        late_reports = reports.filter(status='LATE_SUBMISSION').count()
        report_submission_rate = (on_time_reports / total_reports * 100) if total_reports > 0 else 0
        
        # Get unique patients for this therapist in the date range
        unique_patients = appointments.values('patient').distinct().count()
        
        # Calculate average session duration if available
        avg_duration = appointments.filter(status='COMPLETED').aggregate(
            avg_duration=Coalesce(Avg('duration'), 0, output_field=FloatField())
        )['avg_duration']
        
        # Add therapist data to result
        result.append({
            'id': therapist.id,
            'name': f"{therapist.user.first_name} {therapist.user.last_name}",
            'specialization': therapist.specialization,
            'years_of_experience': therapist.years_of_experience,
            'metrics': {
                'appointments': {
                    'total': total_appointments,
                    'completed': completed_appointments,
                    'cancelled': cancelled_appointments,
                    'completion_rate': round(completion_rate, 2)
                },
                'earnings': {
                    'total': float(total_earnings),
                    'per_appointment': round(float(total_earnings) / completed_appointments, 2) if completed_appointments > 0 else 0
                },
                'reports': {
                    'total': total_reports,
                    'on_time': on_time_reports,
                    'late': late_reports,
                    'submission_rate': round(report_submission_rate, 2)
                },
                'patients': {
                    'unique_count': unique_patients
                },
                'sessions': {
                    'avg_duration': round(avg_duration, 2)
                }
            }
        })
    
    return result
