"""
Purpose: Serializers for equipment models
Connected to: Equipment API endpoints
"""

from rest_framework import serializers
from .models import Category, Equipment, EquipmentAllocation, AllocationRequest
from users.serializers import UserSerializer, TherapistSerializer, PatientSerializer

class CategorySerializer(serializers.ModelSerializer):
    equipment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'equipment_count', 'created_at', 'updated_at']
    
    def get_equipment_count(self, obj):
        return obj.equipment.count()

class EquipmentSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), required=False, allow_null=True)
    
    class Meta:
        model = Equipment
        fields = '__all__'
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.category:
            representation['category'] = {
                'id': instance.category.id,
                'name': instance.category.name
            }
        return representation

class EquipmentAllocationSerializer(serializers.ModelSerializer):
    equipment_details = EquipmentSerializer(source='equipment', read_only=True)
    therapist_details = TherapistSerializer(source='therapist', read_only=True)
    patient_details = PatientSerializer(source='patient', read_only=True)
    allocated_by_details = UserSerializer(source='allocated_by', read_only=True)
    days_overdue = serializers.SerializerMethodField()
    extra_charges_amount = serializers.SerializerMethodField()
    
    class Meta:
        model = EquipmentAllocation
        fields = '__all__'
        
    def get_days_overdue(self, obj):
        if not obj.is_overdue():
            return 0
        from django.utils import timezone
        return (timezone.now().date() - obj.expected_return_date).days
    
    def get_extra_charges_amount(self, obj):
        return obj.calculate_extra_charges()

class AllocationRequestSerializer(serializers.ModelSerializer):
    equipment_details = EquipmentSerializer(source='equipment', read_only=True)
    therapist_details = TherapistSerializer(source='therapist', read_only=True)
    patient_details = PatientSerializer(source='patient', read_only=True)
    
    class Meta:
        model = AllocationRequest
        fields = '__all__'
        read_only_fields = ('status', 'admin_notes')