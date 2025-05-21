"""
Purpose: Serializers for earnings models and financial management
Connected to: Earnings API endpoints and financial management
"""

import random
import calendar
from datetime import datetime, timedelta
from decimal import Decimal
from django.utils import timezone
from rest_framework import serializers
from .models import EarningRecord, SessionFeeConfig, FeeChangeLog, RevenueDistributionConfig
from users.serializers import TherapistSerializer, PatientSerializer, DoctorSerializer, UserSerializer


class MockDataMixin:
    """
    Mixin to provide mock data functionality for serializers
    when no real data exists in the database.
    """

    def to_representation(self, instance):
        """
        Override to_representation to add mock data indicators
        """
        representation = super().to_representation(instance)

        # If this is mock data, add indicator fields
        if isinstance(instance, dict) and instance.get('is_mock_data'):
            representation['is_mock_data'] = True
            representation['mock_data_message'] = (
                "You're viewing example data. Enter real financial information to see actual results."
            )

        return representation

class EarningRecordSerializer(MockDataMixin, serializers.ModelSerializer):
    therapist_details = TherapistSerializer(source='therapist', read_only=True)
    patient_details = PatientSerializer(source='patient', read_only=True)

    class Meta:
        model = EarningRecord
        fields = '__all__'

    @classmethod
    def generate_mock_data(cls, count=5):
        """Generate mock earnings records"""
        mock_records = []
        today = timezone.now().date()

        session_types = [
            'Initial Assessment', 'Follow-up Consultation', 'Physical Therapy',
            'Rehabilitation Session', 'Pain Management', 'Post-Surgery Recovery'
        ]

        for i in range(count):
            # Generate a date within the last 30 days
            date = today - timedelta(days=random.randint(0, 30))

            # Generate a random amount between ₹800 and ₹2000
            amount = Decimal(random.randint(800, 2000))

            # Determine session status (mostly completed for sample data)
            if i < int(count * 0.8):  # 80% completed
                status = 'completed'
                payment_status = 'paid'
                full_amount = amount
            elif i < int(count * 0.9):  # 10% cancelled with fee
                status = 'cancelled'
                payment_status = 'partial'
                full_amount = amount * 2  # Full amount would have been higher
                amount = amount * Decimal('0.5')  # 50% cancellation fee
            else:  # 10% missed
                status = 'missed'
                payment_status = 'not_applicable'
                full_amount = amount
                amount = Decimal('0.00')

            # Calculate revenue distribution (example: 45% admin, 45% therapist, 10% doctor)
            admin_amount = amount * Decimal('0.45')
            therapist_amount = amount * Decimal('0.45')
            doctor_amount = amount * Decimal('0.10')

            mock_records.append({
                'id': f"mock-{i+1}",
                'date': date.isoformat(),
                'session_type': random.choice(session_types),
                'amount': str(amount),
                'full_amount': str(full_amount),
                'status': status,
                'payment_status': payment_status,
                'payment_date': date.isoformat() if status == 'completed' else None,
                'notes': 'Example data for demonstration purposes',
                'admin_amount': str(admin_amount),
                'therapist_amount': str(therapist_amount),
                'doctor_amount': str(doctor_amount),
                'is_mock_data': True
            })

        return mock_records

class EarningsSummarySerializer(MockDataMixin, serializers.Serializer):
    """Serializer for earnings summary data"""
    totalEarned = serializers.DecimalField(max_digits=10, decimal_places=2)
    totalPotential = serializers.DecimalField(max_digits=10, decimal_places=2)
    completedSessions = serializers.IntegerField()
    cancelledSessions = serializers.IntegerField()
    missedSessions = serializers.IntegerField()
    attendedSessions = serializers.IntegerField()
    attendanceRate = serializers.FloatField()
    averagePerSession = serializers.DecimalField(max_digits=10, decimal_places=2)

    @classmethod
    def generate_mock_data(cls):
        """Generate mock earnings summary"""
        # Generate realistic summary data
        completed = random.randint(15, 25)
        cancelled = random.randint(2, 5)
        missed = random.randint(1, 3)
        attended = completed

        # Calculate total earned (average ₹1200 per session)
        avg_fee = Decimal('1200.00')
        total_earned = avg_fee * completed

        # Add cancellation fees (50% of regular fee)
        cancellation_fee = avg_fee * Decimal('0.5')
        total_earned += cancellation_fee * cancelled

        # Calculate total potential (if all sessions were completed)
        total_potential = avg_fee * (completed + cancelled + missed)

        # Calculate attendance rate
        total_sessions = attended + missed
        attendance_rate = (attended / total_sessions * 100) if total_sessions > 0 else 0

        # Calculate average per session
        average_per_session = (total_earned / attended) if attended > 0 else Decimal('0.00')

        return {
            'totalEarned': total_earned,
            'totalPotential': total_potential,
            'completedSessions': completed,
            'cancelledSessions': cancelled,
            'missedSessions': missed,
            'attendedSessions': attended,
            'attendanceRate': attendance_rate,
            'averagePerSession': average_per_session,
            'is_mock_data': True
        }

class DailyEarningSerializer(MockDataMixin, serializers.Serializer):
    """Serializer for daily earnings data"""
    date = serializers.DateField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    sessions = serializers.IntegerField()

    @classmethod
    def generate_mock_data(cls, year, month, days=15):
        """Generate mock daily earnings data for a month"""
        mock_daily_earnings = []

        # Get the number of days in the month
        days_in_month = calendar.monthrange(year, month)[1]

        # Generate data for a random selection of days in the month
        selected_days = sorted(random.sample(range(1, days_in_month + 1), min(days, days_in_month)))

        for day in selected_days:
            date = datetime(year, month, day).date()

            # Generate random sessions (1-3 per day)
            sessions = random.randint(1, 3)

            # Generate random amount (₹800-1500 per session)
            amount = Decimal(random.randint(800, 1500) * sessions)

            mock_daily_earnings.append({
                'date': date.isoformat(),
                'amount': amount,
                'sessions': sessions,
                'is_mock_data': True
            })

        return mock_daily_earnings

class MonthlyEarningsResponseSerializer(MockDataMixin, serializers.Serializer):
    """Serializer for the complete monthly earnings response"""
    earnings = EarningRecordSerializer(many=True)
    summary = EarningsSummarySerializer()
    dailyEarnings = DailyEarningSerializer(many=True)
    year = serializers.IntegerField()
    month = serializers.IntegerField()

    @classmethod
    def generate_mock_data(cls, year, month):
        """Generate complete mock monthly earnings response"""
        # Generate mock earnings records
        mock_earnings = EarningRecordSerializer.generate_mock_data(count=random.randint(10, 20))

        # Generate mock summary
        mock_summary = EarningsSummarySerializer.generate_mock_data()

        # Generate mock daily earnings
        mock_daily_earnings = DailyEarningSerializer.generate_mock_data(year, month)

        return {
            'earnings': mock_earnings,
            'summary': mock_summary,
            'dailyEarnings': mock_daily_earnings,
            'year': year,
            'month': month,
            'is_mock_data': True
        }


class SessionFeeConfigSerializer(MockDataMixin, serializers.ModelSerializer):
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
        if isinstance(obj, dict) and obj.get('is_mock_data'):
            return obj.get('patient_name', 'Mock Patient')
        return f"{obj.patient.user.first_name} {obj.patient.user.last_name}"

    def get_created_by_name(self, obj):
        if isinstance(obj, dict) and obj.get('is_mock_data'):
            return obj.get('created_by_name', 'Admin User')
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}"
        return None

    def create(self, validated_data):
        # Set created_by from the request
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)

    @classmethod
    def generate_mock_data(cls, count=5):
        """Generate mock session fee configurations"""
        mock_configs = []
        today = timezone.now()

        patient_names = [
            ('Ananya', 'Sharma'), ('Vikram', 'Patel'), ('Priya', 'Desai'),
            ('Rahul', 'Mehta'), ('Neha', 'Gupta'), ('Arjun', 'Singh')
        ]

        for i in range(count):
            # Generate random base fee between ₹800 and ₹1500
            base_fee = Decimal(random.randint(800, 1500))

            # 50% chance of having a custom fee
            has_custom_fee = random.choice([True, False])
            custom_fee = Decimal(random.randint(800, 2000)) if has_custom_fee else None

            # Get random patient name
            first_name, last_name = random.choice(patient_names)
            patient_name = f"{first_name} {last_name}"

            # Created date between 1-90 days ago
            days_ago = random.randint(1, 90)
            created_at = today - timedelta(days=days_ago)
            updated_at = created_at + timedelta(days=random.randint(0, days_ago))

            mock_configs.append({
                'id': f"mock-{i+1}",
                'patient': i+1,  # Mock patient ID
                'patient_name': patient_name,
                'base_fee': base_fee,
                'custom_fee': custom_fee,
                'current_fee': custom_fee if custom_fee else base_fee,
                'notes': 'Example fee configuration for demonstration purposes' if i == 0 else '',
                'created_by': 1,  # Mock admin ID
                'created_by_name': 'Admin User',
                'created_at': created_at.isoformat(),
                'updated_at': updated_at.isoformat(),
                'is_mock_data': True
            })

        return mock_configs


class FeeChangeLogSerializer(MockDataMixin, serializers.ModelSerializer):
    """Serializer for FeeChangeLog model"""
    patient_name = serializers.SerializerMethodField()
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = FeeChangeLog
        fields = ['id', 'fee_config', 'previous_fee', 'new_fee', 'reason',
                 'patient_name', 'changed_by', 'changed_by_name', 'changed_at']
        read_only_fields = ['id', 'changed_at', 'changed_by_name', 'patient_name']

    def get_patient_name(self, obj):
        if isinstance(obj, dict) and obj.get('is_mock_data'):
            return obj.get('patient_name', 'Mock Patient')
        return f"{obj.fee_config.patient.user.first_name} {obj.fee_config.patient.user.last_name}"

    def get_changed_by_name(self, obj):
        if isinstance(obj, dict) and obj.get('is_mock_data'):
            return obj.get('changed_by_name', 'Admin User')
        if obj.changed_by:
            return f"{obj.changed_by.first_name} {obj.changed_by.last_name}"
        return None

    def create(self, validated_data):
        # Set changed_by from the request
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['changed_by'] = request.user
        return super().create(validated_data)

    @classmethod
    def generate_mock_data(cls, count=10):
        """Generate mock fee change logs"""
        mock_logs = []
        today = timezone.now()

        patient_names = [
            ('Ananya', 'Sharma'), ('Vikram', 'Patel'), ('Priya', 'Desai'),
            ('Rahul', 'Mehta'), ('Neha', 'Gupta'), ('Arjun', 'Singh')
        ]

        change_reasons = [
            'Annual fee adjustment',
            'Patient requested discount',
            'Special package rate',
            'Promotional offer',
            'Complexity of treatment increased',
            'Extended session duration',
            'Additional services included'
        ]

        for i in range(count):
            # Generate random fees
            previous_fee = Decimal(random.randint(800, 1500))

            # 70% chance of fee increase, 30% chance of decrease
            if random.random() < 0.7:
                # Fee increase (5-20%)
                increase_factor = Decimal(random.uniform(1.05, 1.20))
                new_fee = previous_fee * increase_factor
            else:
                # Fee decrease (5-15%)
                decrease_factor = Decimal(random.uniform(0.85, 0.95))
                new_fee = previous_fee * decrease_factor

            # Round to whole rupees
            new_fee = new_fee.quantize(Decimal('1.'))

            # Get random patient name
            first_name, last_name = random.choice(patient_names)
            patient_name = f"{first_name} {last_name}"

            # Changed date between 1-180 days ago
            days_ago = random.randint(1, 180)
            changed_at = today - timedelta(days=days_ago)

            mock_logs.append({
                'id': f"mock-{i+1}",
                'fee_config': i % 5 + 1,  # Mock fee config ID
                'previous_fee': previous_fee,
                'new_fee': new_fee,
                'reason': random.choice(change_reasons),
                'patient_name': patient_name,
                'changed_by': 1,  # Mock admin ID
                'changed_by_name': 'Admin User',
                'changed_at': changed_at.isoformat(),
                'is_mock_data': True
            })

        # Sort by changed_at date (newest first)
        mock_logs.sort(key=lambda x: x['changed_at'], reverse=True)
        return mock_logs


class RevenueDistributionConfigSerializer(MockDataMixin, serializers.ModelSerializer):
    """Serializer for RevenueDistributionConfig model"""
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = RevenueDistributionConfig
        fields = ['id', 'name', 'is_default', 'distribution_type',
                 'platform_fee_percentage', 'min_admin_amount',
                 'admin_value', 'therapist_value', 'doctor_value',
                 'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by_name']

    def validate_platform_fee_percentage(self, value):
        """Validate platform fee percentage"""
        if value < 0 or value > 100:
            raise serializers.ValidationError("Platform fee percentage must be between 0 and 100")
        return value

    def get_created_by_name(self, obj):
        if isinstance(obj, dict) and obj.get('is_mock_data'):
            return obj.get('created_by_name', 'Admin User')
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

    @classmethod
    def generate_mock_data(cls, count=3):
        """Generate mock revenue distribution configurations"""
        mock_configs = []
        today = timezone.now()

        # Default configuration names
        config_names = [
            'Standard Distribution (45/45/10)',
            'Therapist-focused (30/60/10)',
            'Doctor-referral Bonus (40/40/20)'
        ]

        for i in range(min(count, len(config_names))):
            # Created date between 1-90 days ago
            days_ago = random.randint(1, 90)
            created_at = today - timedelta(days=days_ago)
            updated_at = created_at + timedelta(days=random.randint(0, days_ago))

            # Set distribution values based on the configuration name
            if i == 0:  # Standard
                admin_value = Decimal('45')
                therapist_value = Decimal('45')
                doctor_value = Decimal('10')
                is_default = True
            elif i == 1:  # Therapist-focused
                admin_value = Decimal('30')
                therapist_value = Decimal('60')
                doctor_value = Decimal('10')
                is_default = False
            else:  # Doctor-referral Bonus
                admin_value = Decimal('40')
                therapist_value = Decimal('40')
                doctor_value = Decimal('20')
                is_default = False

            mock_configs.append({
                'id': f"mock-{i+1}",
                'name': config_names[i],
                'is_default': is_default,
                'distribution_type': 'percentage',
                'platform_fee_percentage': Decimal('3.00'),
                'min_admin_amount': Decimal('400.00'),
                'admin_value': admin_value,
                'therapist_value': therapist_value,
                'doctor_value': doctor_value,
                'created_by': 1,  # Mock admin ID
                'created_by_name': 'Admin User',
                'created_at': created_at.isoformat(),
                'updated_at': updated_at.isoformat(),
                'is_mock_data': True
            })

        return mock_configs


class RevenueCalculatorSerializer(serializers.Serializer):
    """Serializer for revenue distribution calculator"""
    total_fee = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    distribution_config_id = serializers.IntegerField(required=False)

    # Fields for manual distribution
    use_manual_distribution = serializers.BooleanField(required=False, default=False)
    distribution_type = serializers.ChoiceField(
        choices=RevenueDistributionConfig.DistributionType.choices,
        required=False
    )
    platform_fee_percentage = serializers.DecimalField(
        max_digits=5, decimal_places=2, required=False
    )
    admin_value = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False
    )
    therapist_value = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False
    )
    doctor_value = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False
    )

    # Fields for saving configuration
    save_configuration = serializers.BooleanField(required=False, default=False)
    configuration_name = serializers.CharField(required=False, max_length=100)

    def validate(self, data):
        if data.get('use_manual_distribution'):
            # Validate manual distribution
            if not data.get('distribution_type'):
                raise serializers.ValidationError({"distribution_type": "Distribution type is required for manual distribution"})

            if not data.get('admin_value'):
                raise serializers.ValidationError({"admin_value": "Admin value is required for manual distribution"})

            if not data.get('therapist_value'):
                raise serializers.ValidationError({"therapist_value": "Therapist value is required for manual distribution"})

            if not data.get('doctor_value'):
                raise serializers.ValidationError({"doctor_value": "Doctor value is required for manual distribution"})

            # Set default platform fee if not provided
            if 'platform_fee_percentage' not in data:
                data['platform_fee_percentage'] = 3.00

            # Validate platform fee percentage
            if data['platform_fee_percentage'] < 0 or data['platform_fee_percentage'] > 100:
                raise serializers.ValidationError({"platform_fee_percentage": "Platform fee percentage must be between 0 and 100"})

            # Validate percentage distribution
            if data['distribution_type'] == RevenueDistributionConfig.DistributionType.PERCENTAGE:
                total_percentage = data['admin_value'] + data['therapist_value'] + data['doctor_value']
                if total_percentage != 100:
                    raise serializers.ValidationError({
                        "admin_value": "Percentage values must add up to 100%",
                        "therapist_value": "Percentage values must add up to 100%",
                        "doctor_value": "Percentage values must add up to 100%"
                    })

            # Validate save configuration
            if data.get('save_configuration') and not data.get('configuration_name'):
                raise serializers.ValidationError({"configuration_name": "Configuration name is required to save"})

        else:
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


class FinancialSummarySerializer(MockDataMixin, serializers.Serializer):
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

    @classmethod
    def generate_mock_data(cls, start_date=None, end_date=None):
        """Generate mock financial summary data"""
        if not start_date:
            today = timezone.now().date()
            start_date = datetime(today.year, today.month, 1).date()

        if not end_date:
            today = timezone.now().date()
            last_day = calendar.monthrange(today.year, today.month)[1]
            end_date = datetime(today.year, today.month, last_day).date()

        # Generate realistic financial data
        total_sessions = random.randint(40, 80)
        avg_fee = Decimal(random.randint(1000, 1500))
        total_revenue = total_sessions * avg_fee

        # Calculate revenue distribution
        platform_fee = total_revenue * Decimal('0.03')  # 3% platform fee
        distributable = total_revenue - platform_fee

        admin_revenue = distributable * Decimal('0.45')  # 45% to admin
        therapist_revenue = distributable * Decimal('0.45')  # 45% to therapists
        doctor_revenue = distributable * Decimal('0.10')  # 10% to doctors

        # Calculate payment statistics
        paid_amount = total_revenue * Decimal(random.uniform(0.85, 0.95))  # 85-95% paid
        pending_amount = total_revenue - paid_amount
        collection_rate = (paid_amount / total_revenue * 100) if total_revenue > 0 else Decimal('0.00')

        # Generate therapist breakdown
        therapist_breakdown = []
        therapist_names = [
            ('Ananya', 'Sharma'), ('Vikram', 'Patel'), ('Priya', 'Desai'),
            ('Rahul', 'Mehta'), ('Neha', 'Gupta'), ('Arjun', 'Singh')
        ]

        remaining_sessions = total_sessions
        for i, (first_name, last_name) in enumerate(therapist_names):
            if i == len(therapist_names) - 1:
                # Last therapist gets all remaining sessions
                sessions = remaining_sessions
            else:
                # Distribute sessions somewhat randomly
                sessions = random.randint(5, max(6, remaining_sessions // (len(therapist_names) - i)))
                remaining_sessions -= sessions

            therapist_amount = sessions * avg_fee * Decimal('0.45')  # 45% to therapist

            therapist_breakdown.append({
                'therapist__id': f"mock-{i+1}",
                'therapist__user__first_name': first_name,
                'therapist__user__last_name': last_name,
                'total': therapist_amount,
                'sessions': sessions
            })

        # Generate monthly revenue data for the past 6 months
        monthly_revenue = []
        today = timezone.now().date()

        for i in range(5, -1, -1):
            month_date = today.replace(day=1) - timedelta(days=1)  # Last day of previous month
            month_date = month_date.replace(day=1)  # First day of previous month
            month_date = month_date - timedelta(days=30*i)  # Go back i months

            # Generate somewhat realistic trend (growing revenue)
            factor = 0.7 + (0.3 * (6-i) / 6)  # 70% to 100% of current revenue
            month_total = total_revenue * Decimal(factor)

            month_admin = month_total * Decimal('0.45')
            month_therapist = month_total * Decimal('0.45')
            month_doctor = month_total * Decimal('0.10')

            monthly_revenue.append({
                'month': month_date.month,
                'year': month_date.year,
                'month_name': month_date.strftime('%b'),
                'total': month_total,
                'admin': month_admin,
                'therapist': month_therapist,
                'doctor': month_doctor
            })

        return {
            'total_revenue': total_revenue,
            'admin_revenue': admin_revenue,
            'therapist_revenue': therapist_revenue,
            'doctor_revenue': doctor_revenue,
            'pending_amount': pending_amount,
            'paid_amount': paid_amount,
            'collection_rate': collection_rate,
            'total_sessions': total_sessions,
            'average_fee': avg_fee,
            'period_start': start_date,
            'period_end': end_date,
            'therapist_breakdown': therapist_breakdown,
            'monthly_breakdown': monthly_revenue,
            'is_mock_data': True
        }