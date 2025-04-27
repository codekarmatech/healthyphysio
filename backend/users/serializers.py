
"""
Purpose: Serializers for user-related models
Connected to: User authentication and profile management
"""

from rest_framework import serializers
from .models import User, Patient, Therapist, Doctor
from django.utils import timezone

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'date_joined']
        read_only_fields = ['date_joined']
        extra_kwargs = {'password': {'write_only': True}}
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.date_joined:
            representation['date_joined'] = timezone.localtime(instance.date_joined).strftime('%Y-%m-%dT%H:%M:%S%z')
        return representation

class PatientSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Patient
        fields = ['id', 'user', 'date_of_birth', 'medical_history', 'gender', 'age', 
                 'address', 'city', 'state', 'zip_code', 'referred_by', 
                 'reference_detail', 'treatment_location', 'disease']
        read_only_fields = ['id']
        
    def create(self, validated_data):
        """
        Override create method to handle user relationship properly
        """
        # Check if user is provided as an object or an ID
        user = validated_data.pop('user', None)
        
        if isinstance(user, dict):
            # If user is a dictionary, it's a nested object
            user_serializer = UserSerializer(data=user)
            if user_serializer.is_valid():
                user_obj = user_serializer.save()
                patient = Patient.objects.create(user=user_obj, **validated_data)
                return patient
            else:
                raise serializers.ValidationError(user_serializer.errors)
        elif isinstance(user, int) or isinstance(user, str):
            # If user is an ID
            try:
                user_obj = User.objects.get(id=user)
                patient = Patient.objects.create(user=user_obj, **validated_data)
                return patient
            except User.DoesNotExist:
                raise serializers.ValidationError("User with this ID does not exist")
        elif user is not None:
            # If user is already a User object
            patient = Patient.objects.create(user=user, **validated_data)
            return patient
        else:
            raise serializers.ValidationError("User is required")

class TherapistSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Therapist
        fields = ['id', 'user', 'license_number', 'specialization', 'years_of_experience', 
                 'photo', 'experience', 'residential_address', 'preferred_areas', 
                 'is_approved', 'approval_date']
        read_only_fields = ['id']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.approval_date:
            representation['approval_date'] = timezone.localtime(instance.approval_date).strftime('%Y-%m-%dT%H:%M:%S%z')
        return representation

class DoctorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:        
        model = Doctor
        fields = ['id', 'user', 'license_number', 'specialization', 'hospital_affiliation', 
                 'years_of_experience', 'area']
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