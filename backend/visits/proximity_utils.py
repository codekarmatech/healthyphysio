"""
Utility functions for proximity alert detection
"""
from math import radians, sin, cos, sqrt, atan2
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q

from .models import ProximityAlert, LocationUpdate
from users.models import Therapist, Patient
from scheduling.models import Appointment


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    Returns distance in meters
    """
    R = 6371000  # Earth's radius in meters

    lat1, lon1, lat2, lon2 = map(radians, [float(lat1), float(lon1), float(lat2), float(lon2)])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c


def has_scheduled_appointment(therapist, patient, time_window_minutes=60):
    """
    Check if there's a scheduled appointment between therapist and patient
    within the specified time window
    """
    now = timezone.now()
    window_start = now - timedelta(minutes=time_window_minutes)
    window_end = now + timedelta(minutes=time_window_minutes)
    
    return Appointment.objects.filter(
        therapist=therapist,
        patient=patient,
        datetime__gte=window_start,
        datetime__lte=window_end,
        status__in=['SCHEDULED', 'CONFIRMED', 'RESCHEDULED']
    ).exists()


def check_therapist_proximity(therapist, proximity_threshold_meters=200):
    """
    Check if a therapist is within proximity of any patient's home
    without a scheduled appointment
    
    Returns list of alerts created
    """
    alerts_created = []
    
    # Get therapist's current location
    if not therapist.current_latitude or not therapist.current_longitude:
        return alerts_created
    
    # Check if location is recent (within last 10 minutes)
    if therapist.current_location_updated_at:
        age = timezone.now() - therapist.current_location_updated_at
        if age.total_seconds() > 600:  # 10 minutes
            return alerts_created
    
    # Get all patients with home coordinates
    patients_with_coords = Patient.objects.filter(
        home_latitude__isnull=False,
        home_longitude__isnull=False
    ).exclude(
        assigned_therapist=therapist  # Exclude patients assigned to this therapist for now
    )
    
    for patient in patients_with_coords:
        # Calculate distance
        distance = haversine_distance(
            therapist.current_latitude,
            therapist.current_longitude,
            patient.home_latitude,
            patient.home_longitude
        )
        
        if distance <= proximity_threshold_meters:
            # Check if there's a scheduled appointment
            if not has_scheduled_appointment(therapist, patient):
                # Check if alert already exists for this pair in the last hour
                recent_alert = ProximityAlert.objects.filter(
                    therapist=therapist,
                    patient=patient,
                    created_at__gte=timezone.now() - timedelta(hours=1),
                    status__in=['active', 'acknowledged']
                ).exists()
                
                if not recent_alert:
                    # Determine severity based on distance
                    if distance < 50:
                        severity = 'high'
                    elif distance < 100:
                        severity = 'medium'
                    else:
                        severity = 'low'
                    
                    # Create the alert
                    alert = ProximityAlert.objects.create(
                        therapist=therapist,
                        patient=patient,
                        distance=distance,
                        severity=severity,
                        status='active'
                    )
                    alerts_created.append(alert)
    
    return alerts_created


def check_all_therapist_proximities(proximity_threshold_meters=200):
    """
    Check proximity for all therapists with location permission
    Returns total number of alerts created
    """
    total_alerts = []
    
    therapists = Therapist.objects.filter(
        location_permission_granted=True,
        location_permission_revoked=False,
        current_latitude__isnull=False,
        current_longitude__isnull=False
    )
    
    for therapist in therapists:
        alerts = check_therapist_proximity(therapist, proximity_threshold_meters)
        total_alerts.extend(alerts)
    
    return total_alerts


def get_active_proximity_alerts():
    """Get all active proximity alerts for admin dashboard"""
    return ProximityAlert.objects.filter(
        status='active'
    ).select_related(
        'therapist__user', 
        'patient__user'
    ).order_by('-created_at')


def get_proximity_alert_stats():
    """Get statistics about proximity alerts"""
    now = timezone.now()
    today = now.date()
    
    return {
        'active': ProximityAlert.objects.filter(status='active').count(),
        'today': ProximityAlert.objects.filter(created_at__date=today).count(),
        'high_severity': ProximityAlert.objects.filter(
            status='active', 
            severity='high'
        ).count(),
        'acknowledged': ProximityAlert.objects.filter(
            status='acknowledged'
        ).count(),
        'resolved_today': ProximityAlert.objects.filter(
            status='resolved',
            created_at__date=today
        ).count(),
    }
