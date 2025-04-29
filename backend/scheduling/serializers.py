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
    reason_for_visit = serializers.CharField(source='issue', required=False, allow_blank=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'therapist', 'session_code', 'datetime', 'local_datetime', 
            'duration_minutes', 'status', 'reschedule_count', 'type', 'issue', 
            'reason_for_visit', 'notes', 'previous_treatments', 'pain_level', 
            'mobility_issues', 'changes_log', 'created_at', 'updated_at', 
            'patient_details', 'therapist_details'
        ]
        read_only_fields = ['id', 'session_code', 'created_at', 'updated_at']
    
    def get_local_datetime(self, obj):
        return timezone.localtime(obj.datetime).strftime('%Y-%m-%dT%H:%M:%S%z')
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.created_at:
            representation['created_at'] = timezone.localtime(instance.created_at).strftime('%Y-%m-%dT%H:%M:%S%z')
        if instance.updated_at:
            representation['updated_at'] = timezone.localtime(instance.updated_at).strftime('%Y-%m-%dT%H:%M:%S%z')
        if instance.datetime:
            representation['datetime'] = timezone.localtime(instance.datetime).strftime('%Y-%m-%dT%H:%M:%S%z')
        return representation

class RescheduleRequestSerializer(serializers.ModelSerializer):
    appointment_details = AppointmentSerializer(source='appointment', read_only=True)
    requested_by_details = serializers.SerializerMethodField()
    
    class Meta:
        model = RescheduleRequest
        fields = [
            'id', 'appointment', 'requested_by', 'requested_datetime', 
            'reason', 'status', 'admin_notes', 'created_at', 'updated_at',
            'appointment_details', 'requested_by_details'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_requested_by_details(self, obj):
        if obj.requested_by:
            return {
                'id': obj.requested_by.id,
                'first_name': obj.requested_by.first_name,
                'last_name': obj.requested_by.last_name,
                'email': obj.requested_by.email,
                'role': obj.requested_by.role
            }
        return None
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.requested_datetime:
            representation['requested_datetime'] = timezone.localtime(instance.requested_datetime).strftime('%Y-%m-%dT%H:%M:%S%z')
        if instance.created_at:
            representation['created_at'] = timezone.localtime(instance.created_at).strftime('%Y-%m-%dT%H:%M:%S%z')
        if instance.updated_at:
            representation['updated_at'] = timezone.localtime(instance.updated_at).strftime('%Y-%m-%dT%H:%M:%S%z')
        return representation

class SessionSerializer(serializers.ModelSerializer):
    local_datetime = serializers.SerializerMethodField()
    
    class Meta:
        model = Session
        fields = ['id', 'appointment', 'status', 'check_in', 'check_out', 
                 'rating', 'patient_notes', 'therapist_notes', 'created_at', 
                 'updated_at', 'local_datetime']
    
    def get_local_datetime(self, obj):
        if obj.appointment and obj.appointment.datetime:
            return timezone.localtime(obj.appointment.datetime).strftime('%Y-%m-%dT%H:%M:%S%z')
        return None
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.check_in:
            representation['check_in'] = timezone.localtime(instance.check_in).strftime('%Y-%m-%dT%H:%M:%S%z')
        if instance.check_out:
            representation['check_out'] = timezone.localtime(instance.check_out).strftime('%Y-%m-%dT%H:%M:%S%z')
        if instance.created_at:
            representation['created_at'] = timezone.localtime(instance.created_at).strftime('%Y-%m-%dT%H:%M:%S%z')
        if instance.updated_at:
            representation['updated_at'] = timezone.localtime(instance.updated_at).strftime('%Y-%m-%dT%H:%M:%S%z')
        return representation