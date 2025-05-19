"""
Purpose: Serializers for the visits app
Connected to: Visit tracking and therapist reports
"""

from rest_framework import serializers
from .models import Visit, LocationUpdate, ProximityAlert, TherapistReport
from users.serializers import PatientSerializer, TherapistSerializer
from scheduling.serializers import AppointmentSerializer, SessionSerializer
from django.utils import timezone

class LocationUpdateSerializer(serializers.ModelSerializer):
    """Serializer for location updates"""
    user_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = LocationUpdate
        fields = [
            'id', 'user', 'visit', 'latitude', 'longitude',
            'accuracy', 'timestamp', 'user_details'
        ]
        read_only_fields = ['id', 'timestamp']

    def get_user_details(self, obj):
        """Get basic user details"""
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'full_name': obj.user.get_full_name(),
            'role': obj.user.role
        }


class VisitSerializer(serializers.ModelSerializer):
    """Serializer for visits"""
    therapist_details = TherapistSerializer(source='therapist', read_only=True)
    patient_details = PatientSerializer(source='patient', read_only=True)
    appointment_details = AppointmentSerializer(source='appointment', read_only=True)
    location_updates = LocationUpdateSerializer(many=True, read_only=True)

    class Meta:
        model = Visit
        fields = [
            'id', 'appointment', 'therapist', 'patient', 'status',
            'scheduled_start', 'scheduled_end', 'actual_start', 'actual_end',
            'created_at', 'updated_at', 'therapist_details', 'patient_details',
            'appointment_details', 'location_updates'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """Validate visit data"""
        # Ensure scheduled_end is after scheduled_start
        if 'scheduled_start' in data and 'scheduled_end' in data:
            if data['scheduled_end'] <= data['scheduled_start']:
                raise serializers.ValidationError(
                    "Scheduled end time must be after scheduled start time"
                )

        # Ensure therapist and patient match the appointment
        if 'appointment' in data:
            appointment = data['appointment']
            if 'therapist' in data and data['therapist'] != appointment.therapist:
                raise serializers.ValidationError(
                    "Therapist must match the appointment's therapist"
                )
            if 'patient' in data and data['patient'] != appointment.patient:
                raise serializers.ValidationError(
                    "Patient must match the appointment's patient"
                )

        return data


class ProximityAlertSerializer(serializers.ModelSerializer):
    """Serializer for proximity alerts"""
    therapist_details = TherapistSerializer(source='therapist', read_only=True)
    patient_details = PatientSerializer(source='patient', read_only=True)
    therapist_location_details = LocationUpdateSerializer(source='therapist_location', read_only=True)
    patient_location_details = LocationUpdateSerializer(source='patient_location', read_only=True)
    acknowledged_by_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ProximityAlert
        fields = [
            'id', 'therapist', 'patient', 'therapist_location', 'patient_location',
            'distance', 'severity', 'status', 'created_at', 'acknowledged_at',
            'acknowledged_by', 'resolution_notes', 'therapist_details', 'patient_details',
            'therapist_location_details', 'patient_location_details', 'acknowledged_by_details'
        ]
        read_only_fields = ['id', 'created_at', 'acknowledged_at', 'acknowledged_by']

    def get_acknowledged_by_details(self, obj):
        """Get details of the user who acknowledged the alert"""
        if obj.acknowledged_by:
            return {
                'id': obj.acknowledged_by.id,
                'username': obj.acknowledged_by.username,
                'full_name': obj.acknowledged_by.get_full_name(),
                'role': obj.acknowledged_by.role
            }
        return None


class TherapistReportSerializer(serializers.ModelSerializer):
    """Serializer for therapist reports"""
    therapist_details = TherapistSerializer(source='therapist', read_only=True)
    patient_details = PatientSerializer(source='patient', read_only=True)
    visit_details = VisitSerializer(source='visit', read_only=True)
    session_details = SessionSerializer(source='session', read_only=True)
    reviewed_by_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = TherapistReport
        fields = [
            'id', 'therapist', 'patient', 'visit', 'session', 'report_date',
            'content', 'status', 'history', 'submitted_at', 'reviewed_at',
            'reviewed_by', 'review_notes', 'created_at', 'updated_at',
            'therapist_details', 'patient_details', 'visit_details',
            'session_details', 'reviewed_by_details',
            # New fields for time-based validation and location verification
            'is_late_submission', 'submission_location_latitude',
            'submission_location_longitude', 'submission_location_accuracy',
            'location_verified'
        ]
        read_only_fields = [
            'id', 'history', 'submitted_at', 'reviewed_at', 'reviewed_by',
            'created_at', 'updated_at', 'is_late_submission',
            'submission_location_latitude', 'submission_location_longitude',
            'submission_location_accuracy', 'location_verified'
        ]

    def get_reviewed_by_details(self, obj):
        """Get details of the user who reviewed the report"""
        if obj.reviewed_by:
            return {
                'id': obj.reviewed_by.id,
                'username': obj.reviewed_by.username,
                'full_name': obj.reviewed_by.get_full_name(),
                'role': obj.reviewed_by.role
            }
        return None
