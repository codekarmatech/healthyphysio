"""
Purpose: Serializers for appointment scheduling
Connected to: Appointment creation and management
"""

from rest_framework import serializers
from .models import Appointment, RescheduleRequest, Session
from users.serializers import PatientSerializer, TherapistSerializer
from django.utils import timezone

class AppointmentSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    therapist_details = TherapistSerializer(source='therapist', read_only=True)
    local_datetime = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'therapist', 'session_code', 'datetime', 'local_datetime', 
            'duration_minutes', 'status', 'reschedule_count', 'issue', 
            'notes', 'created_at', 'updated_at', 'patient_details', 
            'therapist_details'
        ]
        read_only_fields = ['id', 'session_code', 'created_at', 'updated_at']
    
    def get_local_datetime(self, obj):
        return timezone.localtime(obj.datetime).strftime('%Y-%m-%d %H:%M:%S')

class RescheduleRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = RescheduleRequest
        fields = [
            'id', 'appointment', 'requested_by', 'requested_datetime', 
            'reason', 'status', 'admin_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SessionSerializer(serializers.ModelSerializer):
    local_datetime = serializers.SerializerMethodField()
    
    class Meta:
        model = Session
        fields = ['id', 'appointment', 'status', 'check_in', 'check_out', 
                 'rating', 'patient_notes', 'therapist_notes', 'created_at', 
                 'updated_at', 'local_datetime']
    
    def get_local_datetime(self, obj):
        if obj.appointment and obj.appointment.datetime:
            return timezone.localtime(obj.appointment.datetime).strftime('%Y-%m-%d %H:%M:%S')
        return None