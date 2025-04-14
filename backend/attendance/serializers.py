"""
Purpose: Serializers for attendance tracking
Connected to: Session management and assessments
"""

from rest_framework import serializers
from .models import Session, Assessment, AssessmentVersion
from scheduling.serializers import AppointmentSerializer

class SessionSerializer(serializers.ModelSerializer):
    appointment_details = AppointmentSerializer(source='appointment', read_only=True)
    
    class Meta:
        model = Session
        fields = [
            'id', 'appointment', 'status', 'check_in', 'check_out', 
            'rating', 'patient_notes', 'therapist_notes', 'created_at', 
            'updated_at', 'appointment_details'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class AssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = [
            'id', 'session', 'content', 'shared_with_patient', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class AssessmentVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentVersion
        fields = [
            'id', 'assessment', 'content', 'changes', 
            'edited_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']