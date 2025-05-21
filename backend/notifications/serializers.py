"""
Purpose: Serializers for notification models
Connected Endpoints: Notification API endpoints
Validation: Data formatting and validation
"""

from rest_framework import serializers
from .models import Notification
from django.utils import timezone

class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for the Notification model"""
    
    recipient_name = serializers.SerializerMethodField()
    sender_name = serializers.SerializerMethodField()
    created_at_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'recipient_name', 'sender', 'sender_name',
            'notification_type', 'title', 'message', 'content', 'is_read',
            'url', 'created_at', 'created_at_formatted', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_recipient_name(self, obj):
        """Get the recipient's full name or username"""
        if obj.recipient:
            return obj.recipient.get_full_name() or obj.recipient.username
        return None
    
    def get_sender_name(self, obj):
        """Get the sender's full name or username"""
        if obj.sender:
            return obj.sender.get_full_name() or obj.sender.username
        return None
    
    def get_created_at_formatted(self, obj):
        """Format the created_at timestamp"""
        if obj.created_at:
            return timezone.localtime(obj.created_at).strftime('%Y-%m-%dT%H:%M:%S%z')
        return None
