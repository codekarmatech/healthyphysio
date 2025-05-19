"""
Purpose: Serializers for earnings models and financial management
Connected to: Earnings API endpoints and financial management
"""

from rest_framework import serializers
from .models import EarningRecord, SessionFeeConfig, FeeChangeLog, RevenueDistributionConfig
from users.serializers import TherapistSerializer, PatientSerializer, DoctorSerializer, UserSerializer

class EarningRecordSerializer(serializers.ModelSerializer):
    therapist_details = TherapistSerializer(source='therapist', read_only=True)
    patient_details = PatientSerializer(source='patient', read_only=True)

    class Meta:
        model = EarningRecord
        fields = '__all__'

class EarningsSummarySerializer(serializers.Serializer):
    """Serializer for earnings summary data"""
    totalEarned = serializers.DecimalField(max_digits=10, decimal_places=2)
    totalPotential = serializers.DecimalField(max_digits=10, decimal_places=2)
    completedSessions = serializers.IntegerField()
    cancelledSessions = serializers.IntegerField()
    missedSessions = serializers.IntegerField()
    attendedSessions = serializers.IntegerField()
    attendanceRate = serializers.FloatField()
    averagePerSession = serializers.DecimalField(max_digits=10, decimal_places=2)

class DailyEarningSerializer(serializers.Serializer):
    """Serializer for daily earnings data"""
    date = serializers.DateField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    sessions = serializers.IntegerField()

class MonthlyEarningsResponseSerializer(serializers.Serializer):
    """Serializer for the complete monthly earnings response"""
    earnings = EarningRecordSerializer(many=True)
    summary = EarningsSummarySerializer()
    dailyEarnings = DailyEarningSerializer(many=True)
    year = serializers.IntegerField()
    month = serializers.IntegerField()


class SessionFeeConfigSerializer(serializers.ModelSerializer):
    """Serializer for SessionFeeConfig model"""
    patient_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    current_fee = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = SessionFeeConfig
        fields = ['id', 'patient', 'patient_name', 'base_fee', 'custom_fee', 'current_fee',
                 'notes', 'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by_name', 'patient_name']

    def get_patient_name(self, obj):
        return f"{obj.patient.user.first_name} {obj.patient.user.last_name}"

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}"
        return None

    def create(self, validated_data):
        # Set created_by from the request
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)


class FeeChangeLogSerializer(serializers.ModelSerializer):
    """Serializer for FeeChangeLog model"""
    patient_name = serializers.SerializerMethodField()
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = FeeChangeLog
        fields = ['id', 'fee_config', 'previous_fee', 'new_fee', 'reason',
                 'patient_name', 'changed_by', 'changed_by_name', 'changed_at']
        read_only_fields = ['id', 'changed_at', 'changed_by_name', 'patient_name']

    def get_patient_name(self, obj):
        return f"{obj.fee_config.patient.user.first_name} {obj.fee_config.patient.user.last_name}"

    def get_changed_by_name(self, obj):
        if obj.changed_by:
            return f"{obj.changed_by.first_name} {obj.changed_by.last_name}"
        return None

    def create(self, validated_data):
        # Set changed_by from the request
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['changed_by'] = request.user
        return super().create(validated_data)


class RevenueDistributionConfigSerializer(serializers.ModelSerializer):
    """Serializer for RevenueDistributionConfig model"""
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = RevenueDistributionConfig
        fields = ['id', 'name', 'is_default', 'distribution_type',
                 'admin_value', 'therapist_value', 'doctor_value',
                 'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by_name']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}"
        return None

    def create(self, validated_data):
        # Set created_by from the request
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user

        # If this is set as default, unset other defaults
        if validated_data.get('is_default', False):
            RevenueDistributionConfig.objects.filter(is_default=True).update(is_default=False)

        return super().create(validated_data)

    def update(self, instance, validated_data):
        # If this is set as default, unset other defaults
        if validated_data.get('is_default', False) and not instance.is_default:
            RevenueDistributionConfig.objects.filter(is_default=True).update(is_default=False)

        return super().update(instance, validated_data)


class RevenueCalculatorSerializer(serializers.Serializer):
    """Serializer for revenue distribution calculator"""
    total_fee = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    distribution_config_id = serializers.IntegerField(required=False)

    def validate(self, data):
        # If distribution_config_id is provided, verify it exists
        distribution_config_id = data.get('distribution_config_id')
        if distribution_config_id:
            try:
                data['distribution_config'] = RevenueDistributionConfig.objects.get(id=distribution_config_id)
            except RevenueDistributionConfig.DoesNotExist:
                raise serializers.ValidationError({"distribution_config_id": "Distribution configuration not found"})
        else:
            # Use default configuration
            try:
                data['distribution_config'] = RevenueDistributionConfig.objects.get(is_default=True)
            except RevenueDistributionConfig.DoesNotExist:
                raise serializers.ValidationError({"distribution_config_id": "No default distribution configuration found"})

        return data


class FinancialSummarySerializer(serializers.Serializer):
    """Serializer for financial summary data"""
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    admin_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    therapist_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    doctor_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    collection_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    total_sessions = serializers.IntegerField()
    average_fee = serializers.DecimalField(max_digits=10, decimal_places=2)

    # Time period
    period_start = serializers.DateField()
    period_end = serializers.DateField()

    # Optional breakdown
    therapist_breakdown = serializers.ListField(required=False)
    area_breakdown = serializers.ListField(required=False)
    monthly_breakdown = serializers.ListField(required=False)