"""
Purpose: Serializers for user-related models
Connected to: User authentication and profile management
"""

from rest_framework import serializers
from .models import User, Patient, Therapist, Doctor

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone']
        read_only_fields = ['id']

class PatientSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    
    class Meta:
        model = Patient
        fields = ['id', 'user', 'medical_history', 'date_of_birth']
        read_only_fields = ['id']

class TherapistSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    
    class Meta:
        model = Therapist
        fields = ['id', 'user', 'license_number', 'specialization']
        read_only_fields = ['id']

class DoctorSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    
    class Meta:
        model = Doctor
        fields = ['id', 'user', 'license_number', 'specialization']
        read_only_fields = ['id']