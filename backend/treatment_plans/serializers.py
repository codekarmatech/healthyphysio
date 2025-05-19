from rest_framework import serializers
from .models import (
    TreatmentPlan, TreatmentPlanVersion, TreatmentPlanChangeRequest,
    DailyTreatment, Intervention, TreatmentSession
)
from users.models import User, Patient, Therapist

class UserSerializer(serializers.ModelSerializer):
    """Simplified User serializer for nested relationships"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'full_name', 'role')
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

class PatientSerializer(serializers.ModelSerializer):
    """Simplified Patient serializer for nested relationships"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Patient
        fields = ('id', 'user')

class TherapistSerializer(serializers.ModelSerializer):
    """Simplified Therapist serializer for nested relationships"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Therapist
        fields = ('id', 'user')

class InterventionSerializer(serializers.ModelSerializer):
    """Serializer for Intervention model"""
    created_by_details = UserSerializer(source='created_by', read_only=True)
    
    class Meta:
        model = Intervention
        fields = '__all__'

class DailyTreatmentSerializer(serializers.ModelSerializer):
    """Serializer for DailyTreatment model"""
    intervention_details = serializers.SerializerMethodField()
    
    class Meta:
        model = DailyTreatment
        fields = '__all__'
    
    def get_intervention_details(self, obj):
        """Get details of interventions from their IDs"""
        if not obj.interventions:
            return []
        
        # Extract intervention IDs from the JSON field
        intervention_ids = [item.get('id') for item in obj.interventions if 'id' in item]
        
        # Get intervention objects
        interventions = Intervention.objects.filter(id__in=intervention_ids)
        
        # Create a mapping of id -> intervention
        intervention_map = {str(intervention.id): intervention for intervention in interventions}
        
        # Enhance the original interventions data with full intervention details
        result = []
        for item in obj.interventions:
            if 'id' in item and item['id'] in intervention_map:
                intervention = intervention_map[item['id']]
                enhanced_item = {
                    **item,
                    'name': intervention.name,
                    'category': intervention.category,
                    'description': intervention.description
                }
                result.append(enhanced_item)
            else:
                result.append(item)
        
        return result

class TreatmentPlanVersionSerializer(serializers.ModelSerializer):
    """Serializer for TreatmentPlanVersion model"""
    created_by_details = UserSerializer(source='created_by', read_only=True)
    
    class Meta:
        model = TreatmentPlanVersion
        fields = '__all__'

class TreatmentPlanChangeRequestSerializer(serializers.ModelSerializer):
    """Serializer for TreatmentPlanChangeRequest model"""
    requested_by_details = UserSerializer(source='requested_by', read_only=True)
    resolved_by_details = UserSerializer(source='resolved_by', read_only=True)
    treatment_plan_details = serializers.SerializerMethodField()
    
    class Meta:
        model = TreatmentPlanChangeRequest
        fields = '__all__'
    
    def get_treatment_plan_details(self, obj):
        """Get basic details of the treatment plan"""
        return {
            'id': obj.treatment_plan.id,
            'title': obj.treatment_plan.title,
            'patient': obj.treatment_plan.patient.user.get_full_name(),
            'status': obj.treatment_plan.status
        }

class TreatmentSessionSerializer(serializers.ModelSerializer):
    """Serializer for TreatmentSession model"""
    therapist_details = TherapistSerializer(source='therapist', read_only=True)
    patient_details = PatientSerializer(source='patient', read_only=True)
    treatment_plan_details = serializers.SerializerMethodField()
    daily_treatment_details = serializers.SerializerMethodField()
    intervention_details = serializers.SerializerMethodField()
    
    class Meta:
        model = TreatmentSession
        fields = '__all__'
    
    def get_treatment_plan_details(self, obj):
        """Get basic details of the treatment plan"""
        if not obj.treatment_plan:
            return None
        return {
            'id': obj.treatment_plan.id,
            'title': obj.treatment_plan.title,
            'status': obj.treatment_plan.status
        }
    
    def get_daily_treatment_details(self, obj):
        """Get basic details of the daily treatment"""
        if not obj.daily_treatment:
            return None
        return {
            'id': obj.daily_treatment.id,
            'day_number': obj.daily_treatment.day_number,
            'title': obj.daily_treatment.title
        }
    
    def get_intervention_details(self, obj):
        """Get details of interventions performed from their IDs"""
        if not obj.interventions_performed:
            return []
        
        # Extract intervention IDs from the JSON field
        intervention_ids = [item.get('id') for item in obj.interventions_performed if 'id' in item]
        
        # Get intervention objects
        interventions = Intervention.objects.filter(id__in=intervention_ids)
        
        # Create a mapping of id -> intervention
        intervention_map = {str(intervention.id): intervention for intervention in interventions}
        
        # Enhance the original interventions data with full intervention details
        result = []
        for item in obj.interventions_performed:
            if 'id' in item and item['id'] in intervention_map:
                intervention = intervention_map[item['id']]
                enhanced_item = {
                    **item,
                    'name': intervention.name,
                    'category': intervention.category,
                    'description': intervention.description
                }
                result.append(enhanced_item)
            else:
                result.append(item)
        
        return result

class TreatmentPlanSerializer(serializers.ModelSerializer):
    """Serializer for TreatmentPlan model"""
    patient_details = PatientSerializer(source='patient', read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)
    approved_by_details = UserSerializer(source='approved_by', read_only=True)
    daily_treatments = DailyTreatmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = TreatmentPlan
        fields = '__all__'
