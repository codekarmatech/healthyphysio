"""
Purpose: Area management for geographical tracking of users
Connected to: Users (Therapist, Patient, Doctor)
"""

from django.db import models
from django.utils import timezone
from django.conf import settings
from users.models import User, Therapist, Patient, Doctor

class Area(models.Model):
    """
    Model for geographical areas where therapists provide services
    """
    name = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=10)
    description = models.TextField(blank=True)

    # Geographical coordinates for the center of the area
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}, {self.city}, {self.state}"

    class Meta:
        unique_together = ('name', 'city', 'state')
        ordering = ['state', 'city', 'name']


class TherapistServiceArea(models.Model):
    """
    Model for tracking which areas a therapist serves
    """
    therapist = models.ForeignKey(Therapist, on_delete=models.CASCADE, related_name='service_areas')
    area = models.ForeignKey(Area, on_delete=models.CASCADE, related_name='therapists')

    # Priority level (1-3, where 1 is highest priority)
    priority = models.PositiveSmallIntegerField(default=1,
                                              choices=[(1, 'Primary'), (2, 'Secondary'), (3, 'Tertiary')])

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.therapist.user.get_full_name()} - {self.area.name} (Priority: {self.priority})"

    class Meta:
        unique_together = ('therapist', 'area')
        ordering = ['therapist', 'priority']


class PatientArea(models.Model):
    """
    Model for tracking patient residential areas
    """
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='residential_area')
    area = models.ForeignKey(Area, on_delete=models.CASCADE, related_name='patients')

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.patient.user.get_full_name()} - {self.area.name}"

    class Meta:
        unique_together = ('patient', 'area')


class DoctorArea(models.Model):
    """
    Model for tracking doctor clinic/business areas
    """
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='clinic_areas')
    area = models.ForeignKey(Area, on_delete=models.CASCADE, related_name='doctors')

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.doctor.user.get_full_name()} - {self.area.name}"

    class Meta:
        unique_together = ('doctor', 'area')


class AreaRelationship(models.Model):
    """
    Model for tracking relationships between users in the same area
    """
    class RelationshipType(models.TextChoices):
        THERAPIST_PATIENT = 'therapist_patient', 'Therapist-Patient'
        DOCTOR_PATIENT = 'doctor_patient', 'Doctor-Patient'
        DOCTOR_THERAPIST = 'doctor_therapist', 'Doctor-Therapist'

    area = models.ForeignKey(Area, on_delete=models.CASCADE, related_name='relationships')
    relationship_type = models.CharField(max_length=20, choices=RelationshipType.choices)

    # User references - we'll use foreign keys to allow different combinations
    therapist = models.ForeignKey(Therapist, on_delete=models.CASCADE,
                                related_name='area_relationships', null=True, blank=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE,
                              related_name='area_relationships', null=True, blank=True)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE,
                             related_name='area_relationships', null=True, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.relationship_type == self.RelationshipType.THERAPIST_PATIENT:
            return f"Therapist: {self.therapist.user.get_full_name()} - Patient: {self.patient.user.get_full_name()}"
        elif self.relationship_type == self.RelationshipType.DOCTOR_PATIENT:
            return f"Doctor: {self.doctor.user.get_full_name()} - Patient: {self.patient.user.get_full_name()}"
        else:
            return f"Doctor: {self.doctor.user.get_full_name()} - Therapist: {self.therapist.user.get_full_name()}"

    class Meta:
        indexes = [
            models.Index(fields=['area', 'relationship_type']),
        ]
