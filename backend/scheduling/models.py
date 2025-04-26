"""
Purpose: Appointment scheduling and session code management
Connected to: Attendance tracking, patient-therapist assignments
Fields:
  - session_code: Unique identifier (PT-YYYYMMDD-INITIALS-XXXX)
  - reschedule_count: Tracks number of rescheduling attempts
"""

from django.db import models
from django.utils import timezone
from users.models import User, Patient, Therapist
import random
import string
import uuid
from django.core.validators import MinValueValidator, MaxValueValidator

class Appointment(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = 'scheduled', 'Scheduled'
        RESCHEDULED = 'rescheduled', 'Rescheduled'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
        MISSED = 'missed', 'Missed'
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    therapist = models.ForeignKey(Therapist, on_delete=models.CASCADE, related_name='appointments')
    session_code = models.CharField(max_length=10, unique=True, blank=True)
    datetime = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    reschedule_count = models.IntegerField(default=0)
    issue = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Generate a unique session code if not provided
        if not self.session_code:
            self.session_code = str(uuid.uuid4())[:10].upper()
        super().save(*args, **kwargs)
    
    def _generate_session_code(self):
        """Generate a unique session code in the format PT-YYYYMMDD-INITIALS-XXXX"""
        date_str = self.datetime.strftime('%Y%m%d')
        
        # Get patient initials (up to 3 characters)
        patient_name = self.patient.user.get_full_name() or self.patient.user.username
        name_parts = patient_name.split()
        initials = ''.join(part[0].upper() for part in name_parts[:3])
        initials = initials.ljust(3, 'X')[:3]  # Pad with 'X' if needed, limit to 3 chars
        
        # Generate random part (avoiding confusing characters)
        chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        random_part = ''.join(random.choice(chars) for _ in range(4))
        
        # Combine parts
        session_code = f"PT-{date_str}-{initials}-{random_part}"
        
        # Check for collisions and regenerate if needed (max 3 attempts)
        attempts = 0
        while Appointment.objects.filter(session_code=session_code).exists() and attempts < 3:
            random_part = ''.join(random.choice(chars) for _ in range(4))
            session_code = f"PT-{date_str}-{initials}-{random_part}"
            attempts += 1
        
        return session_code
    
    def can_reschedule(self):
        """Check if appointment can be rescheduled"""
        # Check reschedule count
        if self.reschedule_count >= 3:
            return False
        
        # Check if within 24 hours of appointment
        now = timezone.now()
        time_until_appointment = self.datetime - now
        hours_until_appointment = time_until_appointment.total_seconds() / 3600
        
        return hours_until_appointment > 24
    
    def __str__(self):
        return f"Appointment {self.session_code}: {self.patient.user.username} with {self.therapist.user.username}"


class RescheduleRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
    
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='reschedule_requests')
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reschedule_requests')
    requested_datetime = models.DateTimeField()
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Reschedule request for {self.appointment.session_code} by {self.requested_by.username}"
    

class Session(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        CHECKIN_INITIATED = 'checkin_initiated', 'Check‑in Initiated'
        APPROVED_CHECKIN = 'approved_checkin', 'Approved Check‑in'
        MISSED_APPROVAL = 'missed_approval', 'Missed Approval'
        COMPLETED = 'completed', 'Completed'
        MISSED = 'missed', 'Missed'
    
    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.CASCADE,
        related_name='session'
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    rating = models.FloatField(
        null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    patient_notes   = models.TextField(blank=True)
    therapist_notes = models.TextField(blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    def initiate_check_in(self):
        if self.status == self.Status.PENDING:
            self.status   = self.Status.CHECKIN_INITIATED
            self.check_in = timezone.now()
            self.save()
            return True
        return False

    def approve_check_in(self):
        if self.status == self.Status.CHECKIN_INITIATED:
            self.status = self.Status.APPROVED_CHECKIN
            self.save()
            return True
        return False

    def complete_session(self, rating=None, patient_notes=''):
        if self.status == self.Status.APPROVED_CHECKIN:
            self.status    = self.Status.COMPLETED
            self.check_out = timezone.now()
            if rating is not None:
                self.rating = rating
            if patient_notes:
                self.patient_notes = patient_notes
            self.save()
            self.appointment.status = self.appointment.Status.COMPLETED
            self.appointment.save()
            return True
        return False

    def mark_as_missed(self):
        self.status = self.Status.MISSED
        self.save()
        self.appointment.status = self.appointment.Status.MISSED
        self.appointment.save()
        return True

    def __str__(self):
        return f"Session for {self.appointment.session_code} — {self.get_status_display()}"