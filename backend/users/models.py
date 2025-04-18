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
    gender = models.CharField(max_length=20, blank=True)
    age = models.IntegerField(null=True, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=10, blank=True)
    referred_by = models.CharField(max_length=255, blank=True)
    reference_detail = models.TextField(blank=True)
    treatment_location = models.CharField(max_length=50, blank=True)
    disease = models.CharField(max_length=255, blank=True)
    
    def __str__(self):
        return f"{self.user.username}'s Patient Profile"


# Update the Therapist model to include all fields referenced in serializers
class Therapist(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='therapist_profile')
    photo = EncryptedFileField(upload_to='therapists/', blank=True, null=True)
    license_number = models.CharField(max_length=50)
    specialization = models.CharField(max_length=100, blank=True)
    years_of_experience = models.PositiveIntegerField(default=0)
    experience = models.TextField(blank=True)  # Additional field for detailed experience
    residential_address = models.TextField(blank=True)
    preferred_areas = models.TextField(blank=True)
    
    def __str__(self):
        return f"Therapist: {self.user.username}"


# Update the Doctor model to include all fields referenced in serializers
class Doctor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    license_number = models.CharField(max_length=50)
    specialization = models.CharField(max_length=100, blank=True)
    hospital_affiliation = models.CharField(max_length=200, blank=True)
    years_of_experience = models.PositiveIntegerField(default=0)
    area = models.CharField(max_length=100, blank=True)
    
    def __str__(self):
        return f"Doctor: {self.user.username}"