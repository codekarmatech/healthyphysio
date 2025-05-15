"""
Purpose: Track therapist visits and location data for safety monitoring
Connected to: Appointments, Sessions, Users
Fields:
  - location_data: Stores geo-coordinates for safety tracking
  - proximity_alerts: Tracks unauthorized proximity between therapists and patients
"""

from django.db import models
from django.utils import timezone
from django.conf import settings
from users.models import User, Patient, Therapist
from scheduling.models import Appointment, Session

class Visit(models.Model):
    """
    Tracks a therapist's visit to a patient, including location data
    """
    class Status(models.TextChoices):
        SCHEDULED = 'scheduled', 'Scheduled'
        EN_ROUTE = 'en_route', 'En Route'
        ARRIVED = 'arrived', 'Arrived'
        IN_SESSION = 'in_session', 'In Session'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.CASCADE,
        related_name='visit'
    )
    therapist = models.ForeignKey(
        Therapist,
        on_delete=models.CASCADE,
        related_name='visits'
    )
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='visits'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SCHEDULED
    )
    scheduled_start = models.DateTimeField()
    scheduled_end = models.DateTimeField()
    actual_start = models.DateTimeField(null=True, blank=True)
    actual_end = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Visit: {self.therapist.user.get_full_name()} to {self.patient.user.get_full_name()} on {self.scheduled_start.date()}"

    def start_visit(self):
        """Mark visit as started"""
        if self.status == self.Status.SCHEDULED or self.status == self.Status.EN_ROUTE:
            self.status = self.Status.ARRIVED
            self.actual_start = timezone.now()
            self.save()
            return True
        return False

    def start_session(self):
        """Mark session as started"""
        if self.status == self.Status.ARRIVED:
            self.status = self.Status.IN_SESSION
            self.save()
            return True
        return False

    def complete_visit(self):
        """Mark visit as completed"""
        if self.status == self.Status.IN_SESSION:
            self.status = self.Status.COMPLETED
            self.actual_end = timezone.now()
            self.save()
            return True
        return False

    def cancel_visit(self):
        """Mark visit as cancelled"""
        if self.status != self.Status.COMPLETED:
            self.status = self.Status.CANCELLED
            self.save()
            return True
        return False

    class Meta:
        ordering = ['-scheduled_start']
        indexes = [
            models.Index(fields=['therapist', 'scheduled_start']),
            models.Index(fields=['patient', 'scheduled_start']),
            models.Index(fields=['status']),
        ]


class LocationUpdate(models.Model):
    """
    Stores location updates from therapists and patients
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='location_updates'
    )
    visit = models.ForeignKey(
        Visit,
        on_delete=models.CASCADE,
        related_name='location_updates',
        null=True,
        blank=True
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    accuracy = models.FloatField(help_text="Accuracy in meters")
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Location of {self.user.username} at {self.timestamp}"

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['visit', 'timestamp']),
        ]


class ProximityAlert(models.Model):
    """
    Records alerts when therapists and patients are in proximity outside of scheduled times
    """
    class Severity(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        CRITICAL = 'critical', 'Critical'

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        ACKNOWLEDGED = 'acknowledged', 'Acknowledged'
        RESOLVED = 'resolved', 'Resolved'
        FALSE_ALARM = 'false_alarm', 'False Alarm'

    therapist = models.ForeignKey(
        Therapist,
        on_delete=models.CASCADE,
        related_name='proximity_alerts'
    )
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='proximity_alerts'
    )
    therapist_location = models.ForeignKey(
        LocationUpdate,
        on_delete=models.SET_NULL,
        null=True,
        related_name='therapist_alerts'
    )
    patient_location = models.ForeignKey(
        LocationUpdate,
        on_delete=models.SET_NULL,
        null=True,
        related_name='patient_alerts'
    )
    distance = models.FloatField(help_text="Distance in meters")
    severity = models.CharField(
        max_length=10,
        choices=Severity.choices,
        default=Severity.MEDIUM
    )
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.ACTIVE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    acknowledged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='acknowledged_alerts'
    )
    resolution_notes = models.TextField(blank=True)

    def acknowledge(self, user):
        """Acknowledge the alert"""
        self.status = self.Status.ACKNOWLEDGED
        self.acknowledged_at = timezone.now()
        self.acknowledged_by = user
        self.save()
        return True

    def resolve(self, notes=''):
        """Resolve the alert"""
        self.status = self.Status.RESOLVED
        self.resolution_notes = notes
        self.save()
        return True

    def mark_false_alarm(self, notes=''):
        """Mark as false alarm"""
        self.status = self.Status.FALSE_ALARM
        self.resolution_notes = notes
        self.save()
        return True

    def __str__(self):
        return f"Alert: {self.therapist.user.get_full_name()} and {self.patient.user.get_full_name()} - {self.get_severity_display()}"

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['therapist', 'created_at']),
            models.Index(fields=['patient', 'created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['severity']),
        ]


class TherapistReport(models.Model):
    """
    Daily analytical reports submitted by therapists
    """
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SUBMITTED = 'submitted', 'Submitted'
        REVIEWED = 'reviewed', 'Reviewed'
        FLAGGED = 'flagged', 'Flagged'

    therapist = models.ForeignKey(
        Therapist,
        on_delete=models.CASCADE,
        related_name='reports'
    )
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='therapist_reports'
    )
    visit = models.ForeignKey(
        Visit,
        on_delete=models.CASCADE,
        related_name='reports',
        null=True,
        blank=True
    )
    session = models.ForeignKey(
        Session,
        on_delete=models.CASCADE,
        related_name='reports',
        null=True,
        blank=True
    )
    report_date = models.DateField(default=timezone.now)
    content = models.TextField()
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.DRAFT
    )
    history = models.JSONField(default=list)
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_reports'
    )
    review_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def append_content(self, new_content):
        """Append new content to the report, preserving history"""
        # Add current content to history
        if not self.history:
            self.history = []

        self.history.append({
            'content': self.content,
            'timestamp': timezone.now().isoformat(),
            'user': self.therapist.user.username
        })

        # Update content
        self.content = new_content
        self.save()
        return True

    def submit(self):
        """Submit the report"""
        if self.status == self.Status.DRAFT:
            self.status = self.Status.SUBMITTED
            self.submitted_at = timezone.now()
            self.save()
            return True
        return False

    def review(self, admin_user, notes=''):
        """Mark report as reviewed"""
        if self.status == self.Status.SUBMITTED:
            self.status = self.Status.REVIEWED
            self.reviewed_at = timezone.now()
            self.reviewed_by = admin_user
            self.review_notes = notes
            self.save()
            return True
        return False

    def flag(self, admin_user, notes=''):
        """Flag report for further review"""
        self.status = self.Status.FLAGGED
        self.reviewed_at = timezone.now()
        self.reviewed_by = admin_user
        self.review_notes = notes
        self.save()
        return True

    def __str__(self):
        return f"Report by {self.therapist.user.get_full_name()} for {self.patient.user.get_full_name()} on {self.report_date}"

    class Meta:
        ordering = ['-report_date']
        indexes = [
            models.Index(fields=['therapist', 'report_date']),
            models.Index(fields=['patient', 'report_date']),
            models.Index(fields=['status']),
        ]
