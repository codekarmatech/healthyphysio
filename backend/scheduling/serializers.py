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
    appointment_details = AppointmentSerializer(source='appointment', read_only=True)
    report_reviewed_by_details = serializers.SerializerMethodField(read_only=True)
    is_report_required = serializers.SerializerMethodField(read_only=True)
    is_report_submitted = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Session
        fields = [
            'id', 'appointment', 'status', 'check_in', 'check_out',
            'rating', 'patient_notes', 'patient_feedback',
            # Report status fields
            'report_status', 'report_submitted_at', 'report_reviewed_at', 'report_reviewed_by',
            # Structured report fields
            'therapist_notes', 'treatment_provided', 'patient_progress',
            'pain_level_before', 'pain_level_after', 'mobility_assessment',
            'recommendations', 'next_session_goals',
            # History and metadata
            'report_history', 'created_at', 'updated_at',
            # Computed fields
            'local_datetime', 'appointment_details', 'report_reviewed_by_details',
            'is_report_required', 'is_report_submitted'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'report_submitted_at',
            'report_reviewed_at', 'report_reviewed_by', 'report_history'
        ]

    def get_local_datetime(self, obj):
        if obj.appointment and obj.appointment.datetime:
            return timezone.localtime(obj.appointment.datetime).strftime('%Y-%m-%dT%H:%M:%S%z')
        return None

    def get_report_reviewed_by_details(self, obj):
        if obj.report_reviewed_by:
            return {
                'id': obj.report_reviewed_by.id,
                'username': obj.report_reviewed_by.username,
                'full_name': f"{obj.report_reviewed_by.first_name} {obj.report_reviewed_by.last_name}".strip(),
                'role': obj.report_reviewed_by.role
            }
        return None

    def get_is_report_required(self, obj):
        return obj.is_report_required()

    def get_is_report_submitted(self, obj):
        return obj.is_report_submitted()

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Format datetime fields
        datetime_fields = ['check_in', 'check_out', 'created_at', 'updated_at',
                          'report_submitted_at', 'report_reviewed_at']

        for field in datetime_fields:
            if instance.__dict__.get(field):
                representation[field] = timezone.localtime(getattr(instance, field)).strftime('%Y-%m-%dT%H:%M:%S%z')

        return representation

    def validate(self, data):
        """Validate report data"""
        # If updating report fields, ensure they're valid
        report_fields = [
            'therapist_notes', 'treatment_provided', 'patient_progress',
            'pain_level_before', 'pain_level_after', 'mobility_assessment',
            'recommendations', 'next_session_goals'
        ]

        # Check if any report fields are being updated
        updating_report = any(field in data for field in report_fields)

        if updating_report:
            # Ensure pain levels are between 0 and 10
            if 'pain_level_before' in data and data['pain_level_before'] is not None:
                if data['pain_level_before'] < 0 or data['pain_level_before'] > 10:
                    raise serializers.ValidationError({"pain_level_before": "Pain level must be between 0 and 10"})

            if 'pain_level_after' in data and data['pain_level_after'] is not None:
                if data['pain_level_after'] < 0 or data['pain_level_after'] > 10:
                    raise serializers.ValidationError({"pain_level_after": "Pain level must be between 0 and 10"})

        return data