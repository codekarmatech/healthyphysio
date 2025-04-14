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
from encrypted_files.fields import EncryptedFileField

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


class Patient(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    medical_history = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"Patient: {self.user.username}"


class Therapist(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='therapist_profile')
    photo = EncryptedFileField(upload_to='therapists/', blank=True, null=True)
    license_number = models.CharField(max_length=50)
    specialization = models.CharField(max_length=100, blank=True)
    
    def __str__(self):
        return f"Therapist: {self.user.username}"


class Doctor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    license_number = models.CharField(max_length=50)
    specialization = models.CharField(max_length=100, blank=True)
    
    def __str__(self):
        return f"Doctor: {self.user.username}"