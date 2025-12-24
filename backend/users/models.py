from django.db import models
from datetime import timedelta

# Create your models here.
"""
Purpose: Custom user model with role choices
Connected to: All authentication workflows
Fields:
  - role: Choices (PATIENT, THERAPIST, DOCTOR, ADMIN)
  - photo: Encrypted therapist profile
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
# Replace the problematic import
# from encrypted_files import fields

# Use Django's built-in encryption or create our own encryption module
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.core.files.storage import FileSystemStorage
from django.conf import settings
from cryptography.fernet import Fernet
import base64
import os
import json
from django.utils import timezone

# Create a custom encryption field first
class EncryptedFileField(models.FileField):
    # Simple implementation - we'll enhance this later
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    # We'll implement the actual encryption in the storage class

# Now define the User model
class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', _('Admin')
        PATIENT = 'patient', _('Patient')
        THERAPIST = 'therapist', _('Therapist')
        DOCTOR = 'doctor', _('Doctor')

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.PATIENT,
        null=False,
        blank=False,
        help_text="User role is required for security and access control"
    )

    # Common fields for all users
    phone = models.CharField(max_length=15, blank=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    def clean(self):
        """Validate that user has a proper role assigned"""
        from django.core.exceptions import ValidationError

        if not self.role:
            raise ValidationError("User role is required for security and access control")

        if self.role not in [choice[0] for choice in self.Role.choices]:
            raise ValidationError(f"Invalid role: {self.role}")

    def save(self, *args, **kwargs):
        """Override save to ensure validation is called"""
        self.clean()
        super().save(*args, **kwargs)

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_patient(self):
        return self.role == self.Role.PATIENT

    @property
    def is_therapist(self):
        return self.role == self.Role.THERAPIST

    @property
    def is_doctor(self):
        return self.role == self.Role.DOCTOR


# Custom manager for Patient to handle soft deletion
class PatientManager(models.Manager):
    def get_queryset(self):
        """Return only non-deleted patients by default"""
        return super().get_queryset().filter(is_deleted=False)

    def all_including_deleted(self):
        """Return all patients including soft-deleted ones"""
        return super().get_queryset()

    def deleted_only(self):
        """Return only soft-deleted patients"""
        return super().get_queryset().filter(is_deleted=True)


# Update the Patient model to include all fields referenced in serializers
class Patient(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')

    # Soft deletion support for DPDP Act 2023 compliance
    is_deleted = models.BooleanField(default=False, help_text="Soft deletion flag for data protection compliance")
    deleted_at = models.DateTimeField(null=True, blank=True, help_text="When the patient was soft deleted")
    deletion_reason = models.TextField(blank=True, help_text="Reason for account deletion request")

    # Data retention compliance
    data_retention_override = models.BooleanField(default=False, help_text="Override deletion for legal/medical retention requirements")
    retention_reason = models.TextField(blank=True, help_text="Legal reason for data retention override")

    medical_history = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, blank=False)
    age = models.IntegerField(null=False, blank=False)
    address = models.TextField(blank=False)
    city = models.CharField(max_length=100, blank=False)
    state = models.CharField(max_length=100, blank=False)
    zip_code = models.CharField(max_length=10, blank=False)
    referred_by = models.CharField(max_length=255, blank=True)
    reference_detail = models.TextField(blank=True)
    treatment_location = models.CharField(max_length=50, blank=False)
    disease = models.CharField(max_length=255, blank=False)
    emergency_contact_name = models.CharField(max_length=255, blank=False)
    emergency_contact_phone = models.CharField(max_length=20, blank=False)
    emergency_contact_relationship = models.CharField(max_length=100, blank=False)
    # Add direct reference to area for easier access - now required
    area = models.ForeignKey('areas.Area', on_delete=models.SET_NULL, null=True, blank=False,
                            related_name='direct_patients',
                            help_text="Patient's residential area (required)")

    # Custom manager
    objects = PatientManager()

    def __str__(self):
        return f"{self.user.username}'s Patient Profile"

    def soft_delete(self, reason="User requested deletion"):
        """Soft delete the patient with DPDP Act 2023 compliance"""
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deletion_reason = reason
        self.save()

    def restore(self):
        """Restore a soft-deleted patient"""
        self.is_deleted = False
        self.deleted_at = None
        self.deletion_reason = ""
        self.save()

    def can_be_hard_deleted(self):
        """Check if patient can be permanently deleted based on retention requirements"""
        from django.utils import timezone
        from datetime import timedelta

        # If retention override is set, cannot be hard deleted
        if self.data_retention_override:
            return False

        # Check if soft deleted for more than 7 years (physiotherapy record retention)
        if self.deleted_at:
            retention_period = timedelta(days=2555)  # 7 years
            return timezone.now() - self.deleted_at > retention_period

        return False

    def save(self, *args, **kwargs):
        """
        Override save method to ensure PatientArea relationship is maintained
        whenever the direct area reference is set or changed
        """
        # First save the patient to ensure it has an ID
        super().save(*args, **kwargs)

        # If area is set, ensure the PatientArea relationship exists
        if self.area:
            from areas.models import PatientArea
            # Get or create the PatientArea relationship
            patient_area, created = PatientArea.objects.get_or_create(
                patient=self,
                defaults={'area': self.area}
            )

            # If the relationship already existed but with a different area,
            # update it to match the direct reference
            if not created and patient_area.area != self.area:
                patient_area.area = self.area
                patient_area.save()


# Custom manager for Therapist to handle soft deletion
class TherapistManager(models.Manager):
    def get_queryset(self):
        """Return only non-deleted therapists by default"""
        return super().get_queryset().filter(is_deleted=False)

    def all_including_deleted(self):
        """Return all therapists including soft-deleted ones"""
        return super().get_queryset()

    def deleted_only(self):
        """Return only soft-deleted therapists"""
        return super().get_queryset().filter(is_deleted=True)


# Update the Therapist model to include all fields referenced in serializers
class Therapist(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='therapist_profile')

    # Soft deletion support
    is_deleted = models.BooleanField(default=False, help_text="Soft deletion flag")
    deleted_at = models.DateTimeField(null=True, blank=True, help_text="When the therapist was soft deleted")

    # General account approval
    is_approved = models.BooleanField(default=False)
    approval_date = models.DateTimeField(null=True, blank=True)

    # Feature-specific approvals
    treatment_plans_approved = models.BooleanField(default=False, help_text='Whether the therapist is approved to access treatment plans')
    treatment_plans_approval_date = models.DateTimeField(null=True, blank=True)

    reports_approved = models.BooleanField(default=False, help_text='Whether the therapist is approved to access and submit reports')
    reports_approval_date = models.DateTimeField(null=True, blank=True)

    attendance_approved = models.BooleanField(default=False, help_text='Whether the therapist is approved to mark attendance')
    attendance_approval_date = models.DateTimeField(null=True, blank=True)

    # Other profile fields
    photo = EncryptedFileField(upload_to='therapists/', blank=True, null=True)
    license_number = models.CharField(max_length=50)
    specialization = models.CharField(max_length=100, blank=True)
    years_of_experience = models.PositiveIntegerField(default=0)
    experience = models.TextField(blank=True)  # Additional field for detailed experience
    residential_address = models.TextField(blank=True)
    preferred_areas = models.TextField(blank=True)

    # Custom manager
    objects = TherapistManager()

    def __str__(self):
        return f"Therapist: {self.user.username}"

    def soft_delete(self):
        """Soft delete the therapist"""
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        """Restore a soft-deleted therapist"""
        self.is_deleted = False
        self.deleted_at = None
        self.save()

    # Backward compatibility properties
    @property
    def account_approved(self):
        """Alias for is_approved for backward compatibility"""
        return self.is_approved

    @property
    def account_approval_date(self):
        """Alias for approval_date for backward compatibility"""
        return self.approval_date

    def is_available_on_date(self, date):
        """
        Check if therapist is available on a specific date.
        Returns tuple (is_available, reason)
        
        Therapist is NOT available if:
        1. They have approved leave on that date
        2. They have half_day attendance on that date
        3. They have more than 4 appointments on that date
        """
        from attendance.models import Attendance, Leave
        from scheduling.models import Appointment
        
        # Check for approved leave
        leave = Leave.objects.filter(
            therapist=self,
            start_date__lte=date,
            end_date__gte=date,
            status='approved'
        ).first()
        
        if leave:
            return (False, f"On {leave.leave_type} leave")
        
        # Check for half_day attendance
        attendance = Attendance.objects.filter(
            therapist=self,
            date=date,
            status='half_day'
        ).first()
        
        if attendance:
            return (False, "Half day - limited availability")
        
        # Check for sick/emergency leave attendance
        leave_attendance = Attendance.objects.filter(
            therapist=self,
            date=date,
            status__in=['sick_leave', 'emergency_leave']
        ).first()
        
        if leave_attendance:
            return (False, f"On {leave_attendance.status.replace('_', ' ')}")
        
        # Check appointment count (max 4 per day)
        appointment_count = Appointment.objects.filter(
            therapist=self,
            datetime__date=date,
            status__in=['scheduled', 'rescheduled', 'pending']
        ).count()
        
        if appointment_count >= 4:
            return (False, f"Maximum appointments reached ({appointment_count}/4)")
        
        return (True, f"Available ({appointment_count}/4 appointments)")

    def get_availability_status(self, date):
        """
        Get detailed availability status for a date.
        Returns dict with availability info.
        """
        is_available, reason = self.is_available_on_date(date)
        
        from scheduling.models import Appointment
        
        # Get appointments for the date
        appointments = Appointment.objects.filter(
            therapist=self,
            datetime__date=date,
            status__in=['scheduled', 'rescheduled', 'pending', 'completed']
        ).order_by('datetime')
        
        # Get time slots that are already booked
        booked_slots = []
        for apt in appointments:
            booked_slots.append({
                'start': apt.datetime.strftime('%H:%M'),
                'end': (apt.datetime + timedelta(minutes=apt.duration_minutes)).strftime('%H:%M'),
                'patient': apt.patient.user.get_full_name() if apt.patient else 'Unknown',
                'status': apt.status
            })
        
        return {
            'is_available': is_available,
            'reason': reason,
            'appointment_count': appointments.count(),
            'max_appointments': 4,
            'booked_slots': booked_slots
        }

    def has_time_conflict(self, date, start_time, duration_minutes):
        """
        Check if a new appointment would conflict with existing appointments.
        Returns tuple (has_conflict, conflicting_appointment)
        """
        from scheduling.models import Appointment
        from datetime import datetime, timedelta
        
        # Combine date and time
        new_start = datetime.combine(date, start_time)
        new_end = new_start + timedelta(minutes=duration_minutes)
        
        # Get existing appointments for the date
        existing_appointments = Appointment.objects.filter(
            therapist=self,
            datetime__date=date,
            status__in=['scheduled', 'rescheduled', 'pending']
        )
        
        for apt in existing_appointments:
            apt_end = apt.datetime + timedelta(minutes=apt.duration_minutes)
            
            # Check for overlap
            if (new_start < apt_end and new_end > apt.datetime):
                return (True, apt)
        
        return (False, None)


# Update the Doctor model to include all fields referenced in serializers
# Custom manager for Doctor to handle soft deletion
class DoctorManager(models.Manager):
    def get_queryset(self):
        """Return only non-deleted doctors by default"""
        return super().get_queryset().filter(is_deleted=False)

    def all_including_deleted(self):
        """Return all doctors including soft-deleted ones"""
        return super().get_queryset()

    def deleted_only(self):
        """Return only soft-deleted doctors"""
        return super().get_queryset().filter(is_deleted=True)


class Doctor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')

    # Soft deletion support for DPDP Act 2023 compliance
    is_deleted = models.BooleanField(default=False, help_text="Soft deletion flag for data protection compliance")
    deleted_at = models.DateTimeField(null=True, blank=True, help_text="When the doctor was soft deleted")
    deletion_reason = models.TextField(blank=True, help_text="Reason for account deletion request")

    # Data retention compliance
    data_retention_override = models.BooleanField(default=False, help_text="Override deletion for legal/medical retention requirements")
    retention_reason = models.TextField(blank=True, help_text="Legal reason for data retention override")

    license_number = models.CharField(max_length=50)
    specialization = models.CharField(max_length=100, blank=True)
    hospital_affiliation = models.CharField(max_length=200, blank=True)
    years_of_experience = models.PositiveIntegerField(default=0)
    area = models.CharField(max_length=100, blank=True)
    # Add direct reference to area for easier access (optional)
    practice_area = models.ForeignKey('areas.Area', on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='direct_doctors',
                                    help_text="Doctor's practice area")

    # Custom manager
    objects = DoctorManager()

    def __str__(self):
        return f"Doctor: {self.user.username}"

    def soft_delete(self, reason="User requested deletion"):
        """Soft delete the doctor with DPDP Act 2023 compliance"""
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deletion_reason = reason
        self.save()

    def restore(self):
        """Restore a soft-deleted doctor"""
        self.is_deleted = False
        self.deleted_at = None
        self.deletion_reason = ""
        self.save()

    def can_be_hard_deleted(self):
        """Check if doctor can be permanently deleted based on retention requirements"""
        from django.utils import timezone
        from datetime import timedelta

        # If retention override is set, cannot be hard deleted
        if self.data_retention_override:
            return False

        # Check if soft deleted for more than 7 years (medical record retention)
        if self.deleted_at:
            retention_period = timedelta(days=2555)  # 7 years
            return timezone.now() - self.deleted_at > retention_period

        return False

    def save(self, *args, **kwargs):
        """
        Override save method to ensure DoctorArea relationship is maintained
        whenever the direct practice_area reference is set or changed
        """
        # First save the doctor to ensure it has an ID
        super().save(*args, **kwargs)

        # If practice_area is set, ensure the DoctorArea relationship exists
        if self.practice_area:
            from areas.models import DoctorArea
            # Get or create the DoctorArea relationship
            doctor_area, created = DoctorArea.objects.get_or_create(
                doctor=self,
                defaults={'area': self.practice_area}
            )

            # If the relationship already existed but with a different area,
            # update it to match the direct reference
            if not created and doctor_area.area != self.practice_area:
                doctor_area.area = self.practice_area
                doctor_area.save()


class ProfileChangeRequest(models.Model):
    """
    Model to track therapist profile change requests that require admin approval
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    therapist = models.ForeignKey(Therapist, on_delete=models.CASCADE, related_name='change_requests')
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requested_profile_changes')
    current_data = models.TextField(help_text="JSON representation of current profile data")
    requested_data = models.TextField(help_text="JSON representation of requested changes")
    reason = models.TextField(blank=True, help_text="Reason for the change request")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='resolved_profile_changes')
    rejection_reason = models.TextField(blank=True, help_text="Reason for rejection if applicable")

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Profile change request for {self.therapist.user.username} ({self.status})"

    def save(self, *args, **kwargs):
        # Convert dictionaries to JSON strings if they're not already strings
        if isinstance(self.current_data, dict):
            self.current_data = json.dumps(self.current_data)
        if isinstance(self.requested_data, dict):
            self.requested_data = json.dumps(self.requested_data)
        super().save(*args, **kwargs)

    def get_current_data(self):
        """Get the current data as a dictionary"""
        if isinstance(self.current_data, str):
            return json.loads(self.current_data)
        return self.current_data

    def get_requested_data(self):
        """Get the requested data as a dictionary"""
        if isinstance(self.requested_data, str):
            return json.loads(self.requested_data)
        return self.requested_data

    def approve(self, admin_user):
        """Approve the change request and apply changes"""
        self.status = 'approved'
        self.resolved_at = timezone.now()
        self.resolved_by = admin_user

        # Apply the requested changes to the therapist profile
        requested_data = self.get_requested_data()

        # Update each field in the therapist profile
        for field, value in requested_data.items():
            if hasattr(self.therapist, field):
                setattr(self.therapist, field, value)

        # Save the therapist profile
        self.therapist.save()

        # Save the change request
        self.save()

    def reject(self, admin_user, reason):
        """Reject the change request"""
        self.status = 'rejected'
        self.resolved_at = timezone.now()
        self.resolved_by = admin_user
        self.rejection_reason = reason
        self.save()