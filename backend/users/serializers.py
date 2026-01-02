
"""
Purpose: Serializers for user-related models
Connected to: User authentication and profile management
"""

from rest_framework import serializers
from .models import User, Patient, Therapist, Doctor, ProfileChangeRequest
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import json

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer that supports authentication with:
    - Username
    - Email
    - Phone number

    This serializer also adds custom claims to the token and includes
    user data in the response.
    """
    username_field = 'username'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make username field optional to allow email/phone authentication
        self.fields[self.username_field].required = False
        # Add email and phone fields
        self.fields['email'] = serializers.EmailField(required=False)
        self.fields['phone'] = serializers.CharField(required=False)

    def validate(self, attrs):
        """
        Validate the authentication credentials and generate tokens

        This method:
        1. Checks if any identifier is provided (username, email, phone)
        2. Finds the user based on the provided identifier
        3. Validates the password
        4. Generates the token pair
        5. Adds user data to the response
        """
        # Check if any identifier is provided
        username = attrs.get('username')
        email = attrs.get('email')
        phone = attrs.get('phone')
        password = attrs.get('password')

        # Log validation attempt (without password)
        import logging
        logger = logging.getLogger('auth')
        logger.info(f"Validation attempt with: username={username}, email={email}, phone={phone}")

        # Validate required fields
        if not password:
            raise serializers.ValidationError({'password': 'Password is required'})

        if not any([username, email, phone]):
            raise serializers.ValidationError(
                {'username': ['Must include either username, email or phone number']}
            )

        # Try to find the user
        user = None
        User = get_user_model()

        # Try each identifier in order
        if username:
            try:
                user = User.objects.get(username=username)
                logger.info(f"Found user by username: {username}")
            except User.DoesNotExist:
                logger.info(f"No user found with username: {username}")
                pass

        if not user and email:
            try:
                user = User.objects.get(email=email)
                logger.info(f"Found user by email: {email}")
            except User.DoesNotExist:
                logger.info(f"No user found with email: {email}")
                pass

        if not user and phone:
            try:
                user = User.objects.get(phone=phone)
                logger.info(f"Found user by phone: {phone}")
            except User.DoesNotExist:
                logger.info(f"No user found with phone: {phone}")
                pass

        # Validate user and password
        if not user:
            logger.warning(f"Authentication failed: No user found with provided credentials")
            raise serializers.ValidationError(
                {'username': ['No active account found with the given credentials']}
            )

        if not user.check_password(password):
            logger.warning(f"Authentication failed: Invalid password for user {user.username}")
            raise serializers.ValidationError(
                {'username': ['No active account found with the given credentials']}
            )

        # Use the found user for token generation
        attrs[self.username_field] = user.username
        data = super().validate(attrs)

        # Add user data to response
        data['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'role': getattr(user, 'role', 'user'),
        }

        return data

    @classmethod
    def get_token(cls, user):
        """
        Add custom claims to the token
        """
        token = super().get_token(user)

        # Add custom claims
        token['role'] = getattr(user, 'role', 'user')
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
    area_name = serializers.SerializerMethodField(read_only=True)
    added_by_doctor_name = serializers.SerializerMethodField(read_only=True)
    assigned_doctor_name = serializers.SerializerMethodField(read_only=True)
    assigned_therapist_name = serializers.SerializerMethodField(read_only=True)
    approved_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Patient
        fields = ['id', 'user', 'date_of_birth', 'medical_history', 'gender', 'age',
                 'address', 'city', 'state', 'zip_code', 'referred_by',
                 'reference_detail', 'treatment_location', 'disease',
                 'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
                 'area', 'area_name',
                 'added_by_doctor', 'added_by_doctor_name',
                 'assigned_doctor', 'assigned_doctor_name',
                 'assigned_therapist', 'assigned_therapist_name',
                 'approval_status', 'approved_by', 'approved_by_name', 'approved_at', 'denial_reason',
                 'created_at', 'updated_at']
        read_only_fields = ['id', 'approved_by', 'approved_at', 'created_at', 'updated_at']

    def get_area_name(self, obj):
        """Return the name of the patient's area if available"""
        if obj.area:
            return f"{obj.area.name}, {obj.area.city}, {obj.area.state}"
        return None

    def get_added_by_doctor_name(self, obj):
        """Return the name of the doctor who added this patient"""
        if obj.added_by_doctor:
            return obj.added_by_doctor.user.get_full_name() or obj.added_by_doctor.user.username
        return None

    def get_assigned_doctor_name(self, obj):
        """Return the name of the assigned doctor"""
        if obj.assigned_doctor:
            return obj.assigned_doctor.user.get_full_name() or obj.assigned_doctor.user.username
        return None

    def get_assigned_therapist_name(self, obj):
        """Return the name of the assigned therapist"""
        if obj.assigned_therapist:
            return obj.assigned_therapist.user.get_full_name() or obj.assigned_therapist.user.username
        return None

    def get_approved_by_name(self, obj):
        """Return the name of the admin who approved this patient"""
        if obj.approved_by:
            return obj.approved_by.get_full_name() or obj.approved_by.username
        return None

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
    area_id = serializers.IntegerField(required=True, help_text="ID of the selected residential area")

    def validate_area_id(self, value):
        """
        Validate that the area_id corresponds to an existing Area
        """
        from areas.models import Area
        try:
            Area.objects.get(id=value)
        except Area.DoesNotExist:
            raise serializers.ValidationError("Selected area does not exist")
        return value


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