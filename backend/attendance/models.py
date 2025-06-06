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