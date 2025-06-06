from django.db import models

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
    )

    # Common fields for all users
    phone = models.CharField(max_length=15, blank=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

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


# Update the Patient model to include all fields referenced in serializers
class Patient(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
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

    def __str__(self):
        return f"{self.user.username}'s Patient Profile"

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


# Update the Therapist model to include all fields referenced in serializers
class Therapist(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='therapist_profile')

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

    def __str__(self):
        return f"Therapist: {self.user.username}"

    # Backward compatibility properties
    @property
    def account_approved(self):
        """Alias for is_approved for backward compatibility"""
        return self.is_approved

    @property
    def account_approval_date(self):
        """Alias for approval_date for backward compatibility"""
        return self.approval_date


# Update the Doctor model to include all fields referenced in serializers
class Doctor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    license_number = models.CharField(max_length=50)
    specialization = models.CharField(max_length=100, blank=True)
    hospital_affiliation = models.CharField(max_length=200, blank=True)
    years_of_experience = models.PositiveIntegerField(default=0)
    area = models.CharField(max_length=100, blank=True)
    # Add direct reference to area for easier access (optional)
    practice_area = models.ForeignKey('areas.Area', on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='direct_doctors',
                                    help_text="Doctor's practice area")

    def __str__(self):
        return f"Doctor: {self.user.username}"

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