"""
Purpose: Serializers for audit logs
Connected Endpoints: GET /api/audit-logs/
Validation: Data formatting
"""

from rest_framework import serializers
from .models import AuditLog, AuditLogArchive
from django.utils import timezone

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_name', 'action', 'model_name', 
            'object_id', 'object_repr', 'previous_state', 'new_state',
            'ip_address', 'timestamp', 'integrity_hash'
        ]
    
    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return None
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.timestamp:
            representation['timestamp'] = timezone.localtime(instance.timestamp).strftime('%Y-%m-%dT%H:%M:%S%z')
        return representation


class AuditLogArchiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLogArchive
        fields = [
            'id', 'archive_date', 'start_date', 'end_date',
            'log_count', 'archive_file', 'integrity_hash'
        ]