"""
Purpose: Django signals for appointment-related events
Connected to: Attendance tracking, session time logging
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Appointment


@receiver(post_save, sender=Appointment)
def create_session_time_log(sender, instance, created, **kwargs):
    """
    When an appointment is created or scheduled, create a SessionTimeLog record.
    This allows therapists and patients to track session times.
    """
    from attendance.models import SessionTimeLog, Attendance

    # Only create for new appointments or when status changes to scheduled
    if created or instance.status in ['scheduled', 'pending']:
        # Get the appointment date
        appointment_date = instance.datetime.date()

        # Create or update SessionTimeLog
        SessionTimeLog.objects.get_or_create(
            appointment=instance,
            defaults={
                'therapist': instance.therapist,
                'patient': instance.patient,
                'date': appointment_date,
                'status': 'pending'
            }
        )

        # Create expected attendance record for the therapist
        Attendance.objects.get_or_create(
            therapist=instance.therapist,
            date=appointment_date,
            defaults={
                'status': 'expected',
                'notes': f'Expected for appointment {instance.session_code}'
            }
        )
