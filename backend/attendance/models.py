"""
Purpose: Track session attendance, check-ins, and ratings
Connected to: Appointment scheduling, patient feedback
Fields:
  - check_in: Timestamp when therapist initiates session
  - check_out: Timestamp when session completes
  - rating: Patient feedback (0-5 scale)
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from scheduling.models import Appointment

class Session(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        CHECKIN_INITIATED = 'checkin_initiated', 'Check-in Initiated'
        APPROVED_CHECKIN = 'approved_checkin', 'Approved Check-in'
        MISSED_APPROVAL = 'missed_approval', 'Missed Approval'
        COMPLETED = 'completed', 'Completed'
        MISSED = 'missed', 'Missed'
    
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='session')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    rating = models.FloatField(
        null=True, 
        blank=True, 
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    patient_notes = models.TextField(blank=True)
    therapist_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def initiate_check_in(self):
        """Therapist initiates check-in process"""
        if self.status == self.Status.PENDING:
            self.status = self.Status.CHECKIN_INITIATED
            self.check_in = timezone.now()
            self.save()
            return True
        return False
    
    def approve_check_in(self):
        """Patient approves check-in"""
        if self.status == self.Status.CHECKIN_INITIATED:
            self.status = self.Status.APPROVED_CHECKIN
            self.save()
            return True
        return False
    
    def complete_session(self, rating=None, patient_notes=''):
        """Complete the session with optional rating and notes"""
        if self.status == self.Status.APPROVED_CHECKIN:
            self.status = self.Status.COMPLETED
            self.check_out = timezone.now()
            if rating is not None:
                self.rating = rating
            if patient_notes:
                self.patient_notes = patient_notes
            self.save()
            
            # Update the appointment status
            self.appointment.status = self.appointment.Status.COMPLETED
            self.appointment.save()
            return True
        return False
    
    def mark_as_missed(self):
        """Mark session as missed"""
        self.status = self.Status.MISSED
        self.save()
        
        # Update the appointment status
        self.appointment.status = self.appointment.Status.MISSED
        self.appointment.save()
        return True
    
    def __str__(self):
        return f"Session for {self.appointment.session_code} - {self.get_status_display()}"


class Assessment(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='assessments')
    content = models.TextField()
    shared_with_patient = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Assessment for {self.session.appointment.session_code}"


class AssessmentVersion(models.Model):
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='versions')
    content = models.TextField()
    changes = models.JSONField(default=dict)  # {field: {old: val, new: val}}
    edited_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Version {self.id} of {self.assessment}"