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

    # Manual location verification fields
    manual_location_address = models.TextField(blank=True, null=True,
        help_text="Manually entered address by therapist")
    manual_location_landmark = models.CharField(max_length=255, blank=True, null=True,
        help_text="Nearest landmark to the visit location")
    manual_arrival_time = models.TimeField(null=True, blank=True,
        help_text="Manually entered arrival time")
    manual_departure_time = models.TimeField(null=True, blank=True,
        help_text="Manually entered departure time")
    manual_location_notes = models.TextField(blank=True, null=True,
        help_text="Additional notes about the location")
    manual_location_verified = models.BooleanField(default=False,
        help_text="Whether the manual location has been verified by admin")

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

    def submit_manual_location(self, location_data):
        """
        Submit manual location information for a visit

        Args:
            location_data (dict): Dictionary containing manual location fields
                - manual_location_address: Address of the visit
                - manual_location_landmark: Nearest landmark
                - manual_arrival_time: Time of arrival
                - manual_departure_time: Time of departure
                - manual_location_notes: Additional notes

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Update manual location fields
            self.manual_location_address = location_data.get('manual_location_address', '')
            self.manual_location_landmark = location_data.get('manual_location_landmark', '')
            self.manual_location_notes = location_data.get('manual_location_notes', '')

            # Handle time fields
            arrival_time = location_data.get('manual_arrival_time')
            departure_time = location_data.get('manual_departure_time')

            if arrival_time:
                self.manual_arrival_time = arrival_time

            if departure_time:
                self.manual_departure_time = departure_time

            # Save the visit
            self.save()

            # Create a system note about manual location submission
            note = f"Manual location information submitted: {self.manual_location_address}"

            # TODO: Add to visit history or notes if such functionality exists

            return True
        except Exception as e:
            print(f"Error submitting manual location: {str(e)}")
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
        LATE_SUBMISSION = 'late_submission', 'Late Submission'

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
        max_length=15,  # Increased length to accommodate 'late_submission'
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

    # New fields for time-based validation and location verification
    is_late_submission = models.BooleanField(default=False)
    submission_location_latitude = models.FloatField(null=True, blank=True)
    submission_location_longitude = models.FloatField(null=True, blank=True)
    submission_location_accuracy = models.FloatField(null=True, blank=True)
    location_verified = models.BooleanField(default=False)

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

    def submit(self, location_data=None):
        """
        Submit the report with time-based validation and location verification

        Args:
            location_data (dict): Optional location data with latitude, longitude, and accuracy
        """
        if self.status == self.Status.DRAFT:
            now = timezone.now()
            self.submitted_at = now

            # Check if this is a late submission (more than 1 hour after visit end)
            if self.visit and self.visit.scheduled_end:
                time_diff = now - self.visit.scheduled_end
                hours_diff = time_diff.total_seconds() / 3600

                if hours_diff > 12:
                    # Too late to submit (more than 12 hours after visit)
                    return False
                elif hours_diff > 1:
                    # Late submission (between 1 and 12 hours after visit)
                    self.is_late_submission = True
                    self.status = self.Status.LATE_SUBMISSION
                else:
                    # On-time submission (within 1 hour of visit end)
                    self.status = self.Status.SUBMITTED
            else:
                # No visit associated, default to submitted
                self.status = self.Status.SUBMITTED

            # Store location data if provided
            if location_data:
                self.submission_location_latitude = location_data.get('latitude')
                self.submission_location_longitude = location_data.get('longitude')
                self.submission_location_accuracy = location_data.get('accuracy')

                # Verify location if visit has patient location
                if self.visit:
                    patient_locations = self.visit.location_updates.filter(
                        user=self.patient.user
                    ).order_by('-timestamp')

                    if patient_locations.exists():
                        patient_location = patient_locations.first()

                        # Calculate distance between therapist and patient
                        from math import radians, cos, sin, asin, sqrt

                        def haversine(lon1, lat1, lon2, lat2):
                            """Calculate distance between two points in meters"""
                            # Convert decimal degrees to radians
                            lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

                            # Haversine formula
                            dlon = lon2 - lon1
                            dlat = lat2 - lat1
                            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                            c = 2 * asin(sqrt(a))
                            r = 6371000  # Radius of earth in meters
                            return c * r

                        distance = haversine(
                            self.submission_location_longitude,
                            self.submission_location_latitude,
                            patient_location.longitude,
                            patient_location.latitude
                        )

                        # If within 100 meters, consider location verified
                        if distance < 100:
                            self.location_verified = True

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
