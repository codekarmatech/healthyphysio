from rest_framework import serializers
from .models import Assessment, AssessmentVersion

class AssessmentVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentVersion
        fields = ['id', 'edited_by', 'data', 'created_at']
        read_only_fields = ['id', 'edited_by', 'created_at']

class AssessmentSerializer(serializers.ModelSerializer):
    versions = AssessmentVersionSerializer(many=True, read_only=True)

    class Meta:
        model = Assessment
        fields = [
            'id', 'session', 'created_by',
            'pending_admin_approval', 'approved_for_doctors',
            'created_at', 'updated_at', 'versions'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_at', 'updated_at', 'versions'
        ]

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['created_by'] = user
        assessment = super().create(validated_data)
        return assessment

    def update(self, instance, validated_data):
        # Versioning on update
        user = self.context['request'].user
        # snapshot old data
        AssessmentVersion.objects.create(
            assessment=instance,
            edited_by=user,
            data=AssessmentSerializer(instance).data
        )
        instance = super().update(instance, validated_data)
        return instance