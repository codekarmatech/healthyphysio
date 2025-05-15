
"""
Purpose: Serializers for user-related models
Connected to: User authentication and profile management
"""

from rest_framework import serializers
from .models import User, Patient, Therapist, Doctor, ProfileChangeRequest
from django.utils import timezone
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import json

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['role'] = user.role
        token['email'] = user.email
        token['name'] = user.get_full_name() or user.username

        return token

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
    user = UserSerializer(read_only=True)

    class Meta:
        model = Therapist
        fields = [
            'id', 'user', 'license_number', 'specialization', 'years_of_experience',
            'photo', 'experience', 'residential_address', 'preferred_areas',
            # Approval fields
            'is_approved', 'approval_date',
            # Feature-specific approval fields
            'treatment_plans_approved', 'treatment_plans_approval_date',
            'reports_approved', 'reports_approval_date',
            'attendance_approved', 'attendance_approval_date'
        ]
        read_only_fields = [
            'id', 'is_approved', 'approval_date',
            'treatment_plans_approved', 'treatment_plans_approval_date',
            'reports_approved', 'reports_approval_date',
            'attendance_approved', 'attendance_approval_date'
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Format date fields
        if 'approval_date' in representation and instance.approval_date:
            representation['approval_date'] = timezone.localtime(instance.approval_date).strftime('%Y-%m-%dT%H:%M:%S%z')

        if 'treatment_plans_approval_date' in representation and instance.treatment_plans_approval_date:
            representation['treatment_plans_approval_date'] = timezone.localtime(instance.treatment_plans_approval_date).strftime('%Y-%m-%dT%H:%M:%S%z')

        if 'reports_approval_date' in representation and instance.reports_approval_date:
            representation['reports_approval_date'] = timezone.localtime(instance.reports_approval_date).strftime('%Y-%m-%dT%H:%M:%S%z')

        if 'attendance_approval_date' in representation and instance.attendance_approval_date:
            representation['attendance_approval_date'] = timezone.localtime(instance.attendance_approval_date).strftime('%Y-%m-%dT%H:%M:%S%z')

        # Add compatibility fields for the frontend
        representation['account_approved'] = instance.is_approved
        representation['account_approval_date'] = representation.get('approval_date')

        return representation

    def update(self, instance, validated_data):
        """
        Override update method to handle profile update requests
        """
        # Create a change request instead of directly updating the profile
        from .models import ProfileChangeRequest

        # Get the current user from the context
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user

            # Create a change request with the current data and requested changes
            ProfileChangeRequest.objects.create(
                therapist=instance,
                requested_by=user,
                current_data={
                    'license_number': instance.license_number,
                    'specialization': instance.specialization,
                    'years_of_experience': instance.years_of_experience,
                    'experience': instance.experience,
                    'residential_address': instance.residential_address,
                    'preferred_areas': instance.preferred_areas,
                },
                requested_data=validated_data,
                status='pending'
            )

            # Return the instance without changes, as they will be applied after approval
            return instance

        # If no request context is available, just update normally (for admin use)
        return super().update(instance, validated_data)

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


class ProfileChangeRequestSerializer(serializers.ModelSerializer):
    therapist = serializers.PrimaryKeyRelatedField(read_only=True)
    requested_by = UserSerializer(read_only=True)
    resolved_by = UserSerializer(read_only=True)
    current_data = serializers.JSONField(read_only=True)
    requested_data = serializers.JSONField()

    class Meta:
        model = ProfileChangeRequest
        fields = ['id', 'therapist', 'requested_by', 'current_data', 'requested_data',
                 'reason', 'status', 'created_at', 'resolved_at', 'resolved_by', 'rejection_reason']
        read_only_fields = ['id', 'therapist', 'requested_by', 'current_data', 'status',
                           'created_at', 'resolved_at', 'resolved_by', 'rejection_reason']

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Convert string JSON to actual JSON objects
        if 'current_data' in representation and isinstance(representation['current_data'], str):
            representation['current_data'] = json.loads(representation['current_data'])

        if 'requested_data' in representation and isinstance(representation['requested_data'], str):
            representation['requested_data'] = json.loads(representation['requested_data'])

        # Format timestamps
        if instance.created_at:
            representation['created_at'] = timezone.localtime(instance.created_at).strftime('%Y-%m-%dT%H:%M:%S%z')

        if instance.resolved_at:
            representation['resolved_at'] = timezone.localtime(instance.resolved_at).strftime('%Y-%m-%dT%H:%M:%S%z')

        return representation