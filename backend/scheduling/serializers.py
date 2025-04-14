"""
Purpose: Serializers for appointment scheduling
Connected to: Appointment creation and management
"""

from rest_framework import serializers
from .models import Appointment, RescheduleRequest
from users.serializers import PatientSerializer, TherapistSerializer

class AppointmentSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    therapist_details = TherapistSerializer(source='therapist', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'therapist', 'session_code', 'datetime', 
            'duration_minutes', 'status', 'reschedule_count', 'issue', 
            'notes', 'created_at', 'updated_at', 'patient_details', 
            'therapist_details'
        ]
        read_only_fields = ['id', 'session_code', 'created_at', 'updated_at']

class RescheduleRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = RescheduleRequest
        fields = [
            'id', 'appointment', 'requested_by', 'requested_datetime', 
            'reason', 'status', 'admin_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']