"""
Purpose: Serializers for attendance tracking
Connected to: Session management and assessments
"""

from rest_framework import serializers
from .models import Attendance, Holiday
from django.utils import timezone

class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = ['id', 'name', 'date', 'description']

class AttendanceSerializer(serializers.ModelSerializer):
    submitted_at_ist = serializers.SerializerMethodField()
    approved_at_ist = serializers.SerializerMethodField()
    
    class Meta:
        model = Attendance
        fields = ['id', 'therapist', 'date', 'status', 'submitted_at', 
                 'submitted_at_ist', 'approved_by', 'approved_at', 'approved_at_ist']
        read_only_fields = ['therapist', 'submitted_at', 'approved_by', 'approved_at']
    
    def get_submitted_at_ist(self, obj):
        if obj.submitted_at:
            # Convert to IST (UTC+5:30)
            ist_time = obj.submitted_at.astimezone(timezone.get_fixed_timezone(330))
            return ist_time.strftime("%I:%M %p IST")
        return None
    
    def get_approved_at_ist(self, obj):
        if obj.approved_at:
            # Convert to IST (UTC+5:30)
            ist_time = obj.approved_at.astimezone(timezone.get_fixed_timezone(330))
            return ist_time.strftime("%I:%M %p IST")
        return None
    
    def validate(self, data):
        today = timezone.now().date()
        if 'date' in data and data['date'] != today:
            raise serializers.ValidationError("Attendance can only be submitted for the current date.")
        
        # Always check for duplicates when creating new records
        if self.instance is None:
            request = self.context.get('request')
            if request and hasattr(request, 'user'):
                from users.models import Therapist
                try:
                    therapist = Therapist.objects.get(user=request.user)
                    date = data.get('date', today)
                    # Add explicit date filtering
                    if Attendance.objects.filter(therapist=therapist, date=date).exists():
                        raise serializers.ValidationError("Attendance already submitted for this date.")
                except Therapist.DoesNotExist:
                    pass
        
        return data
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            from users.models import Therapist
            try:
                therapist = Therapist.objects.get(user=request.user)
                validated_data['therapist'] = therapist
            except Therapist.DoesNotExist:
                raise serializers.ValidationError("Therapist profile not found for this user.")
        
        # Set date to today if not provided
        if 'date' not in validated_data:
            validated_data['date'] = timezone.now().date()
            
        return super().create(validated_data)

class AttendanceMonthSerializer(serializers.Serializer):
    present = serializers.IntegerField()
    absent = serializers.IntegerField()
    half_day = serializers.IntegerField()
    approved_leaves = serializers.IntegerField()
    holidays = serializers.IntegerField()
    days = serializers.ListField()