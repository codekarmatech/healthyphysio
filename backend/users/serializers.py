
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
        fields = ['id', 'user', 'gender', 'age', 'address', 'city', 'state', 'zip_code', 'referred_by', 'reference_detail', 'treatment_location', 'disease']
        read_only_fields = ['id']

class TherapistSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Therapist
        fields = ['id', 'user', 'license_number', 'specialization', 'experience','residential_address', 'preferred_areas']
        read_only_fields = ['id']

class DoctorSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:        
        model = Doctor
        fields = ['id', 'user', 'license_number', 'specialization', 'hospital_affiliation', 'years_of_experience', 'area']
        read_only_fields = ['id']

class PatientSignupStep1Serializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)  # Assuming first name and last name are combined in the name field
    email = serializers.EmailField()
    mobile = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True)
    confirmPassword = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        if data['password'] != data['confirmPassword']:
            raise serializers.ValidationError("Passwords do not match.")
        return data


class PatientSignupStep2Serializer(serializers.Serializer):
    gender = serializers.CharField(max_length=20)
    age = serializers.IntegerField()
    address = serializers.CharField()
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    zipCode = serializers.CharField(max_length=10)


class PatientSignupStep3Serializer(serializers.Serializer):
    referred_by = serializers.CharField(max_length=255, allow_blank=True)
    referenceDetail = serializers.CharField(allow_blank=True, required=False)  # Optional
    treatmentLocation = serializers.ChoiceField(choices=[('Home visit', 'Home visit'), ('Telephonic consultation', 'Telephonic consultation')])
    disease = serializers.CharField()

    read_only_fields = ['id']