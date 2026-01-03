"""
Purpose: Track session attendance, check-ins, and ratings
Connected to: Appointment scheduling, patient feedback
Fields:
  - check_in: Timestamp when therapist initiates session
  - check_out: Timestamp when session completes
  - rating: Patient feedback (0-5 scale)
"""

from django.db import models
from django.utils import timezone
from django.conf import settings
from datetime import timedelta, datetime
import pytz

# Define Indian timezone (Ahmedabad, Gujarat - UTC+5:30)
INDIAN_TZ = pytz.timezone('Asia/Kolkata')


class Holiday(models.Model):
    name = models.CharField(max_length=100)
    date = models.DateField(unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} - {self.date}"

class Attendance(models.Model):
    STATUS_CHOICES = (
        ('expected', 'Expected'),  # Auto-created when appointment is scheduled
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('half_day', 'Half Day'),
        ('approved_leave', 'Approved Leave'),
        ('sick_leave', 'Sick Leave'),
        ('emergency_leave', 'Emergency Leave'),
        ('available', 'Available (No Assignments)'),
    )

    therapist = models.ForeignKey('users.Therapist', on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='absent')
    submitted_at = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                   null=True, blank=True, related_name='approved_attendances')
    approved_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    is_paid = models.BooleanField(default=True)
    changed_from = models.CharField(max_length=20, blank=True, null=True, help_text="Previous status before change")

    class Meta:
        unique_together = ('therapist', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.therapist.user.username} - {self.date} - {self.status}"

    def approve(self, admin_user):
        """Approve attendance by admin"""
        self.approved_by = admin_user
        self.approved_at = timezone.now()
        self.save()

    @staticmethod
    def has_appointments(therapist, date):
        """
        Check if a therapist has any appointments on a given date

        Args:
            therapist: Therapist instance or ID
            date: Date to check (datetime.date object)

        Returns:
            bool: True if therapist has appointments, False otherwise
        """
        from scheduling.models import Appointment
        from django.utils import timezone

        # Convert therapist ID to therapist instance if needed
        therapist_id = therapist.id if hasattr(therapist, 'id') else therapist

        # Create datetime range for the given date
        start_datetime = timezone.make_aware(datetime.combine(date, datetime.min.time()))
        end_datetime = timezone.make_aware(datetime.combine(date, datetime.max.time()))

        # Check for appointments with active statuses
        appointment_count = Appointment.objects.filter(
            therapist_id=therapist_id,
            datetime__range=(start_datetime, end_datetime),
            status__in=['pending', 'scheduled', 'rescheduled', 'pending_reschedule']
        ).count()

        return appointment_count > 0

    @staticmethod
    def get_appointment_count(therapist, date):
        """
        Get the number of appointments for a therapist on a given date

        Args:
            therapist: Therapist instance or ID
            date: Date to check (datetime.date object)

        Returns:
            int: Number of appointments on the date
        """
        from scheduling.models import Appointment
        from django.utils import timezone

        # Convert therapist ID to therapist instance if needed
        therapist_id = therapist.id if hasattr(therapist, 'id') else therapist

        # Create datetime range for the given date
        start_datetime = timezone.make_aware(datetime.combine(date, datetime.min.time()))
        end_datetime = timezone.make_aware(datetime.combine(date, datetime.max.time()))

        return Appointment.objects.filter(
            therapist_id=therapist_id,
            datetime__range=(start_datetime, end_datetime),
            status__in=['pending', 'scheduled', 'rescheduled', 'pending_reschedule', 'completed']
        ).count()

    @staticmethod
    def validate_attendance_status(therapist, date, status):
        """
        Validate if the attendance status is appropriate for the given date

        Args:
            therapist: Therapist instance or ID
            date: Date to check (datetime.date object)
            status: Proposed attendance status

        Returns:
            dict: Validation result with 'valid' boolean and 'message' string
        """
        has_appointments = Attendance.has_appointments(therapist, date)
        appointment_count = Attendance.get_appointment_count(therapist, date)

        # Check if it's a weekend (Sunday = 6)
        is_weekend = date.weekday() == 6

        # Check if it's a holiday
        is_holiday = Holiday.objects.filter(date=date).exists()

        if status == 'absent':
            if not has_appointments:
                return {
                    'valid': False,
                    'message': 'Cannot mark as absent on days without scheduled appointments. Use availability status instead.',
                    'suggested_action': 'mark_availability'
                }
            if is_weekend:
                return {
                    'valid': False,
                    'message': 'Cannot mark as absent on weekends.',
                    'suggested_action': 'none'
                }
            if is_holiday:
                return {
                    'valid': False,
                    'message': 'Cannot mark as absent on holidays.',
                    'suggested_action': 'none'
                }

        elif status == 'present':
            if not has_appointments:
                return {
                    'valid': True,
                    'message': f'Marked as present with no scheduled appointments. Consider marking availability instead.',
                    'suggested_action': 'mark_availability',
                    'warning': True
                }

        elif status == 'available':
            if has_appointments:
                return {
                    'valid': False,
                    'message': f'Cannot mark as available when you have {appointment_count} scheduled appointment(s). Use attendance status instead.',
                    'suggested_action': 'mark_attendance'
                }

        return {
            'valid': True,
            'message': 'Status is valid for this date.',
            'suggested_action': 'none'
        }

    def save(self, *args, **kwargs):
        # Set is_paid based on status
        if self.status in ['sick_leave', 'emergency_leave', 'absent', 'available']:
            # Available days are not paid until appointments are completed
            self.is_paid = False
        elif self.status in ['present', 'approved_leave']:
            self.is_paid = True
        elif self.status == 'half_day':
            # Half day is paid at 50% rate
            self.is_paid = True

        super().save(*args, **kwargs)

class Availability(models.Model):
    """
    Model to track therapist availability for days with no appointments
    This is separate from attendance, which tracks days with actual appointments
    """
    therapist = models.ForeignKey('users.Therapist', on_delete=models.CASCADE, related_name='availabilities')
    date = models.DateField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('therapist', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.therapist.user.username} - {self.date} - Available"


class Leave(models.Model):
    LEAVE_TYPE_CHOICES = (
        ('regular', 'Regular Leave'),
        ('sick', 'Sick Leave'),
        ('emergency', 'Emergency Leave'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    )

    therapist = models.ForeignKey('users.Therapist', on_delete=models.CASCADE, related_name='leaves')
    start_date = models.DateField()
    end_date = models.DateField()
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPE_CHOICES)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    submitted_at = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                   null=True, blank=True, related_name='approved_leaves')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)
    cancellation_reason = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.therapist.user.username} - {self.start_date} to {self.end_date} - {self.leave_type}"

    def clean(self):
        from django.core.exceptions import ValidationError

        # End date should be after or equal to start date
        if self.end_date < self.start_date:
            raise ValidationError("End date cannot be before start date")

        # Get current date in Indian timezone
        now_in_india = timezone.now().astimezone(INDIAN_TZ)
        today_in_india = now_in_india.date()

        # Regular leave must be applied at least 2 days in advance
        if self.leave_type == 'regular' and self.start_date < today_in_india + timedelta(days=2):
            raise ValidationError("Regular leave must be applied at least 2 days in advance")

        # Sick and emergency leave can be applied anytime, but will be unpaid
        # This is handled in the Attendance model's save method

    def approve(self, admin_user):
        """Approve leave application"""
        self.approved_by = admin_user
        self.approved_at = timezone.now()
        self.status = 'approved'
        self.save()

        # Create attendance records for the leave period
        self._create_attendance_records()

    def reject(self, admin_user, reason):
        """Reject leave application"""
        self.approved_by = admin_user
        self.approved_at = timezone.now()
        self.status = 'rejected'
        self.rejection_reason = reason
        self.save()

    def cancel(self, reason):
        """Cancel leave application"""
        self.status = 'cancelled'
        self.cancellation_reason = reason
        self.save()

        # Remove any attendance records created for this leave
        self._remove_attendance_records()

    def _create_attendance_records(self):
        """Create attendance records for the leave period"""
        from datetime import timedelta

        current_date = self.start_date
        status = 'approved_leave'

        # For sick and emergency leave, use different status and mark as unpaid
        if self.leave_type in ['sick', 'emergency']:
            status = f"{self.leave_type}_leave"

        # Create attendance records for each day in the leave period
        while current_date <= self.end_date:
            # Check if attendance record already exists
            attendance, created = Attendance.objects.get_or_create(
                therapist=self.therapist,
                date=current_date,
                defaults={
                    'status': status,
                    'notes': f"Automatically created from leave application #{self.id}",
                    'approved_by': self.approved_by,
                    'approved_at': self.approved_at
                }
            )

            # If record exists but wasn't created from leave, update it
            if not created and not attendance.notes:
                attendance.status = status
                attendance.notes = f"Updated from leave application #{self.id}"
                attendance.approved_by = self.approved_by
                attendance.approved_at = self.approved_at
                attendance.save()

            current_date += timedelta(days=1)

    def _remove_attendance_records(self):
        """Remove attendance records created for this leave"""
        # Find and delete attendance records created from this leave
        Attendance.objects.filter(
            therapist=self.therapist,
            date__range=(self.start_date, self.end_date),
            notes__contains=f"leave application #{self.id}"
        ).delete()


class SessionTimeLog(models.Model):
    """
    Track session times from both therapist and patient perspectives.
    Used to verify attendance and detect discrepancies between reported times.
    All times are stored in IST (Asia/Kolkata timezone).
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('therapist_reached', 'Therapist Reached'),
        ('in_progress', 'In Progress'),
        ('therapist_left', 'Therapist Left'),
        ('patient_confirmed', 'Patient Confirmed'),
        ('verified', 'Verified'),
        ('disputed', 'Disputed'),
    )

    appointment = models.ForeignKey(
        'scheduling.Appointment',
        on_delete=models.CASCADE,
        related_name='session_time_logs'
    )
    therapist = models.ForeignKey(
        'users.Therapist',
        on_delete=models.CASCADE,
        related_name='session_time_logs'
    )
    patient = models.ForeignKey(
        'users.Patient',
        on_delete=models.CASCADE,
        related_name='session_time_logs'
    )
    date = models.DateField()

    # Therapist timestamps (IST)
    therapist_reached_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Time when therapist clicked 'Reached Patient House' button"
    )
    therapist_leaving_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Time when therapist clicked 'Leaving Patient House' button"
    )

    # Patient confirmation timestamps (IST)
    patient_confirmed_arrival = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Time when patient confirmed therapist arrival"
    )
    patient_confirmed_departure = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Time when patient confirmed therapist departure"
    )

    # Therapist geo-coordinates when marking arrival/departure
    therapist_arrival_latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        help_text="Therapist GPS latitude when marking arrival"
    )
    therapist_arrival_longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        help_text="Therapist GPS longitude when marking arrival"
    )
    therapist_arrival_accuracy = models.FloatField(
        null=True, blank=True,
        help_text="GPS accuracy in meters when therapist marked arrival"
    )
    therapist_departure_latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        help_text="Therapist GPS latitude when marking departure"
    )
    therapist_departure_longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        help_text="Therapist GPS longitude when marking departure"
    )
    therapist_departure_accuracy = models.FloatField(
        null=True, blank=True,
        help_text="GPS accuracy in meters when therapist marked departure"
    )

    # Patient geo-coordinates when confirming arrival/departure
    patient_arrival_latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        help_text="Patient GPS latitude when confirming therapist arrival"
    )
    patient_arrival_longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        help_text="Patient GPS longitude when confirming therapist arrival"
    )
    patient_arrival_accuracy = models.FloatField(
        null=True, blank=True,
        help_text="GPS accuracy in meters when patient confirmed arrival"
    )
    patient_departure_latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        help_text="Patient GPS latitude when confirming therapist departure"
    )
    patient_departure_longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        help_text="Patient GPS longitude when confirming therapist departure"
    )
    patient_departure_accuracy = models.FloatField(
        null=True, blank=True,
        help_text="GPS accuracy in meters when patient confirmed departure"
    )

    # Track if location was added later (not at the time of confirmation)
    therapist_arrival_location_added_later = models.BooleanField(
        default=False,
        help_text="Whether therapist arrival location was added after the initial confirmation"
    )
    therapist_departure_location_added_later = models.BooleanField(
        default=False,
        help_text="Whether therapist departure location was added after the initial confirmation"
    )
    patient_arrival_location_added_later = models.BooleanField(
        default=False,
        help_text="Whether patient arrival location was added after the initial confirmation"
    )
    patient_departure_location_added_later = models.BooleanField(
        default=False,
        help_text="Whether patient departure location was added after the initial confirmation"
    )

    # Calculated durations (in minutes)
    therapist_duration_minutes = models.IntegerField(
        null=True,
        blank=True,
        help_text="Duration calculated from therapist timestamps"
    )
    patient_confirmed_duration_minutes = models.IntegerField(
        null=True,
        blank=True,
        help_text="Duration calculated from patient confirmation timestamps"
    )

    # Discrepancy tracking
    has_discrepancy = models.BooleanField(
        default=False,
        help_text="True if therapist and patient times differ significantly"
    )
    discrepancy_minutes = models.IntegerField(
        null=True,
        blank=True,
        help_text="Difference in minutes between therapist and patient reported durations"
    )
    discrepancy_notes = models.TextField(
        blank=True,
        help_text="Admin notes about the discrepancy"
    )
    discrepancy_resolved = models.BooleanField(
        default=False,
        help_text="True if admin has reviewed and resolved the discrepancy"
    )
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_session_discrepancies'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('appointment', 'date')
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"Session {self.appointment.session_code} - {self.date} - {self.status}"

    def therapist_reached(self, location_data=None):
        """Record therapist arrival at patient's house with optional geo-coordinates"""
        now = timezone.now().astimezone(INDIAN_TZ)
        self.therapist_reached_time = now
        self.status = 'therapist_reached'

        # Store geo-coordinates if provided
        if location_data:
            self.therapist_arrival_latitude = location_data.get('latitude')
            self.therapist_arrival_longitude = location_data.get('longitude')
            self.therapist_arrival_accuracy = location_data.get('accuracy')

        self.save()
        return True

    def therapist_leaving(self, location_data=None):
        """Record therapist departure from patient's house with optional geo-coordinates"""
        if not self.therapist_reached_time:
            return False

        now = timezone.now().astimezone(INDIAN_TZ)
        self.therapist_leaving_time = now

        # Store geo-coordinates if provided
        if location_data:
            self.therapist_departure_latitude = location_data.get('latitude')
            self.therapist_departure_longitude = location_data.get('longitude')
            self.therapist_departure_accuracy = location_data.get('accuracy')

        # Calculate duration
        duration = now - self.therapist_reached_time
        self.therapist_duration_minutes = int(duration.total_seconds() / 60)

        self.status = 'therapist_left'
        self.save()

        # Check for discrepancy if patient has already confirmed
        self._check_discrepancy()
        return True

    def patient_confirm_arrival(self, location_data=None):
        """Patient confirms therapist has arrived with optional geo-coordinates"""
        now = timezone.now().astimezone(INDIAN_TZ)
        self.patient_confirmed_arrival = now

        # Store geo-coordinates if provided
        if location_data:
            self.patient_arrival_latitude = location_data.get('latitude')
            self.patient_arrival_longitude = location_data.get('longitude')
            self.patient_arrival_accuracy = location_data.get('accuracy')

        if self.status == 'pending':
            self.status = 'in_progress'
        self.save()
        return True

    def patient_confirm_departure(self, location_data=None):
        """Patient confirms therapist has left with optional geo-coordinates"""
        if not self.patient_confirmed_arrival:
            return False

        now = timezone.now().astimezone(INDIAN_TZ)
        self.patient_confirmed_departure = now

        # Store geo-coordinates if provided
        if location_data:
            self.patient_departure_latitude = location_data.get('latitude')
            self.patient_departure_longitude = location_data.get('longitude')
            self.patient_departure_accuracy = location_data.get('accuracy')

        # Calculate duration
        duration = now - self.patient_confirmed_arrival
        self.patient_confirmed_duration_minutes = int(duration.total_seconds() / 60)

        self.status = 'patient_confirmed'
        self.save()

        # Check for discrepancy
        self._check_discrepancy()
        return True

    def _check_discrepancy(self):
        """Check if there's a significant discrepancy between therapist and patient times"""
        if self.therapist_duration_minutes and self.patient_confirmed_duration_minutes:
            difference = abs(self.therapist_duration_minutes - self.patient_confirmed_duration_minutes)

            # Flag if difference is more than 10 minutes
            if difference > 10:
                self.has_discrepancy = True
                self.discrepancy_minutes = difference
            else:
                self.has_discrepancy = False
                self.status = 'verified'

            self.save()

    def resolve_discrepancy(self, admin_user, notes=''):
        """Admin resolves a discrepancy"""
        self.discrepancy_resolved = True
        self.resolved_by = admin_user
        self.resolved_at = timezone.now()
        self.discrepancy_notes = notes
        self.status = 'verified'
        self.save()
        return True

    @property
    def is_complete(self):
        """Check if both therapist and patient have recorded times"""
        return (
            self.therapist_reached_time and
            self.therapist_leaving_time and
            self.patient_confirmed_arrival and
            self.patient_confirmed_departure
        )

    @property
    def therapist_duration_display(self):
        """Display therapist duration in human-readable format"""
        if not self.therapist_duration_minutes:
            return None
        hours = self.therapist_duration_minutes // 60
        minutes = self.therapist_duration_minutes % 60
        if hours > 0:
            return f"{hours}h {minutes}m"
        return f"{minutes}m"

    @property
    def patient_duration_display(self):
        """Display patient confirmed duration in human-readable format"""
        if not self.patient_confirmed_duration_minutes:
            return None
        hours = self.patient_confirmed_duration_minutes // 60
        minutes = self.patient_confirmed_duration_minutes % 60
        if hours > 0:
            return f"{hours}h {minutes}m"
        return f"{minutes}m"


class PatientConcern(models.Model):
    """
    Model to track patient concerns/feedback about therapy sessions.
    Allows patients to report issues with specific session dates for admin review.
    Framed positively as "Session Feedback" rather than complaints.
    """
    CATEGORY_CHOICES = (
        ('service_quality', 'Service Quality'),
        ('timing', 'Timing or Punctuality'),
        ('communication', 'Communication'),
        ('treatment', 'Treatment Approach'),
        ('professionalism', 'Professionalism'),
        ('payment', 'Payment Related'),
        ('other', 'Other'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending Review'),
        ('acknowledged', 'Acknowledged'),
        ('in_progress', 'Being Addressed'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    )

    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )

    patient = models.ForeignKey(
        'users.Patient',
        on_delete=models.CASCADE,
        related_name='concerns'
    )
    therapist = models.ForeignKey(
        'users.Therapist',
        on_delete=models.CASCADE,
        related_name='patient_concerns',
        null=True,
        blank=True,
        help_text="Therapist related to this concern (if applicable)"
    )
    appointment = models.ForeignKey(
        'scheduling.Appointment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='patient_concerns',
        help_text="Specific appointment this concern relates to"
    )
    session_date = models.DateField(
        help_text="Date of the session this concern relates to"
    )
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='other'
    )
    subject = models.CharField(
        max_length=200,
        help_text="Brief subject/title of the concern"
    )
    description = models.TextField(
        help_text="Detailed description of the concern"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium'
    )

    # Admin response
    admin_response = models.TextField(
        blank=True,
        help_text="Admin's response to the patient's concern"
    )
    responded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='responded_concerns'
    )
    responded_at = models.DateTimeField(null=True, blank=True)

    # Follow-up tracking
    requires_call = models.BooleanField(
        default=False,
        help_text="Whether admin needs to call the patient"
    )
    call_completed = models.BooleanField(default=False)
    call_notes = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', 'created_at']),
            models.Index(fields=['therapist', 'created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return f"Concern from {self.patient.user.get_full_name()} - {self.subject[:50]}"

    def acknowledge(self, admin_user, response_text):
        """Acknowledge the concern and send standard response"""
        self.status = 'acknowledged'
        self.admin_response = response_text
        self.responded_by = admin_user
        self.responded_at = timezone.now()
        self.save()
        return True

    def mark_requires_call(self, admin_user):
        """Mark that this concern requires a phone call to patient"""
        self.requires_call = True
        self.responded_by = admin_user
        self.save()
        return True

    def complete_call(self, notes=''):
        """Mark the follow-up call as completed"""
        self.call_completed = True
        self.call_notes = notes
        self.save()
        return True

    def resolve(self, admin_user, resolution_notes=''):
        """Mark concern as resolved"""
        self.status = 'resolved'
        if resolution_notes:
            self.admin_response = f"{self.admin_response}\n\nResolution: {resolution_notes}" if self.admin_response else resolution_notes
        self.responded_by = admin_user
        self.responded_at = timezone.now()
        self.save()
        return True

    def close(self):
        """Close the concern"""
        self.status = 'closed'
        self.save()
        return True