"""
Purpose: Serializers for area management
Connected to: Area models and API views
"""

from rest_framework import serializers
from .models import Area, TherapistServiceArea, PatientArea, DoctorArea, AreaRelationship
from users.serializers import TherapistSerializer, PatientSerializer, DoctorSerializer, UserSerializer


class AreaSerializer(serializers.ModelSerializer):
    """Serializer for Area model"""

    class Meta:
        model = Area
        fields = ['id', 'name', 'city', 'state', 'zip_code', 'description',
                 'latitude', 'longitude', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class TherapistServiceAreaSerializer(serializers.ModelSerializer):
    """Serializer for TherapistServiceArea model"""
    area = AreaSerializer(read_only=True)
    area_id = serializers.PrimaryKeyRelatedField(
        queryset=Area.objects.all(),
        write_only=True,
        source='area'
    )
    therapist_name = serializers.SerializerMethodField()

    class Meta:
        model = TherapistServiceArea
        fields = ['id', 'therapist', 'area', 'area_id', 'priority', 'therapist_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_therapist_name(self, obj):
        return f"{obj.therapist.user.first_name} {obj.therapist.user.last_name}"


class PatientAreaSerializer(serializers.ModelSerializer):
    """Serializer for PatientArea model"""
    area = AreaSerializer(read_only=True)
    area_id = serializers.PrimaryKeyRelatedField(
        queryset=Area.objects.all(),
        write_only=True,
        source='area'
    )
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = PatientArea
        fields = ['id', 'patient', 'area', 'area_id', 'patient_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        return f"{obj.patient.user.first_name} {obj.patient.user.last_name}"


class DoctorAreaSerializer(serializers.ModelSerializer):
    """Serializer for DoctorArea model"""
    area = AreaSerializer(read_only=True)
    area_id = serializers.PrimaryKeyRelatedField(
        queryset=Area.objects.all(),
        write_only=True,
        source='area'
    )
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = DoctorArea
        fields = ['id', 'doctor', 'area', 'area_id', 'doctor_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_doctor_name(self, obj):
        return f"{obj.doctor.user.first_name} {obj.doctor.user.last_name}"


class AreaRelationshipSerializer(serializers.ModelSerializer):
    """Serializer for AreaRelationship model"""
    area = AreaSerializer(read_only=True)
    area_id = serializers.PrimaryKeyRelatedField(
        queryset=Area.objects.all(),
        write_only=True,
        source='area'
    )

    class Meta:
        model = AreaRelationship
        fields = ['id', 'area', 'area_id', 'relationship_type',
                 'therapist', 'patient', 'doctor', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class AreaAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for Area analytics data"""
    therapist_count = serializers.SerializerMethodField()
    patient_count = serializers.SerializerMethodField()
    doctor_count = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = Area
        fields = ['id', 'name', 'display_name', 'city', 'state', 'zip_code',
                 'therapist_count', 'patient_count', 'doctor_count',
                 'latitude', 'longitude']

    def get_display_name(self, obj):
        """Return a proper display name for the area, clearly identifying cities"""
        # If name is the same as city, add a city indicator
        if obj.name.lower() == obj.city.lower() and obj.city:
            return f"{obj.name} (City)"
        return obj.name

    def get_therapist_count(self, obj):
        return obj.therapists.count()

    def get_patient_count(self, obj):
        return obj.patients.count()

    def get_doctor_count(self, obj):
        return obj.doctors.count()


class AreaDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for Area with user counts and relationships"""
    therapist_count = serializers.SerializerMethodField()
    patient_count = serializers.SerializerMethodField()
    doctor_count = serializers.SerializerMethodField()
    therapists = serializers.SerializerMethodField()
    patients = serializers.SerializerMethodField()
    doctors = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = Area
        fields = ['id', 'name', 'display_name', 'city', 'state', 'zip_code', 'description',
                 'therapist_count', 'patient_count', 'doctor_count',
                 'therapists', 'patients', 'doctors',
                 'latitude', 'longitude', 'created_at', 'updated_at']

    def get_display_name(self, obj):
        """Return a proper display name for the area, clearly identifying cities"""
        # If name is the same as city, add a city indicator
        if obj.name.lower() == obj.city.lower() and obj.city:
            return f"{obj.name} (City)"
        return obj.name

    def get_therapist_count(self, obj):
        return obj.therapists.count()

    def get_patient_count(self, obj):
        return obj.patients.count()

    def get_doctor_count(self, obj):
        return obj.doctors.count()

    def get_therapists(self, obj):
        therapist_areas = obj.therapists.all()
        return [
            {
                'id': ta.therapist.id,
                'name': f"{ta.therapist.user.first_name} {ta.therapist.user.last_name}",
                'priority': ta.priority,
                'specialization': ta.therapist.specialization,
                'experience': ta.therapist.years_of_experience
            }
            for ta in therapist_areas
        ]

    def get_patients(self, obj):
        patient_areas = obj.patients.all()
        return [
            {
                'id': pa.patient.id,
                'name': f"{pa.patient.user.first_name} {pa.patient.user.last_name}"
            }
            for pa in patient_areas
        ]

    def get_doctors(self, obj):
        doctor_areas = obj.doctors.all()
        return [
            {
                'id': da.doctor.id,
                'name': f"{da.doctor.user.first_name} {da.doctor.user.last_name}",
                'specialization': da.doctor.specialization
            }
            for da in doctor_areas
        ]
