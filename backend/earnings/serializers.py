"""
Purpose: Serializers for earnings models
Connected to: Earnings API endpoints
"""

from rest_framework import serializers
from .models import EarningRecord
from users.serializers import TherapistSerializer, PatientSerializer

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