"""
Purpose: Track all data changes for HIPAA compliance
Connected Endpoints: Internal Django signals
Validation: Cryptographic integrity verification
"""

import hashlib
import json
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

User = get_user_model()

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('ACCESS', 'Access'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=50)
    object_repr = models.CharField(max_length=255)
    previous_state = models.JSONField(null=True, blank=True)
    new_state = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    integrity_hash = models.CharField(max_length=64)
    
    def save(self, *args, **kwargs):
        # Generate timestamp if not provided
        if not self.timestamp:
            self.timestamp = timezone.now()
            
        # Generate integrity hash
        self.generate_integrity_hash()
        
        super().save(*args, **kwargs)
    
    def generate_integrity_hash(self):
        # Create a dictionary of the fields to hash
        data = {
            'action': self.action,
            'model_name': self.model_name,
            'object_id': self.object_id,
            'object_repr': self.object_repr,
            'previous_state': self.previous_state,
            'new_state': self.new_state,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'timestamp': self.timestamp.isoformat() if hasattr(self.timestamp, 'isoformat') else str(self.timestamp),
            'user_id': str(self.user.id) if self.user else None,
        }
        
        # Convert to JSON using Django's JSON encoder which handles dates and UUIDs
        json_data = json.dumps(data, sort_keys=True, cls=DjangoJSONEncoder)
        hash_object = hashlib.sha256(json_data.encode())
        self.integrity_hash = hash_object.hexdigest()
    
    def verify_integrity(self):
        """Verify the integrity of the log entry by recomputing the hash"""
        current_hash = self.integrity_hash
        self.integrity_hash = ''
        self.generate_integrity_hash()
        new_hash = self.integrity_hash
        self.integrity_hash = current_hash
        return current_hash == new_hash
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['model_name', 'object_id']),
            models.Index(fields=['user']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['action']),
        ]
    
    def __str__(self):
        return f"{self.action} {self.model_name} {self.object_id} at {self.timestamp}"


class AuditLogArchive(models.Model):
    """Archive for audit logs older than retention period"""
    archive_date = models.DateField(auto_now_add=True)
    start_date = models.DateField()
    end_date = models.DateField()
    log_count = models.PositiveIntegerField()
    archive_file = models.FileField(upload_to='audit_archives/')
    integrity_hash = models.CharField(max_length=64)
    
    def __str__(self):
        return f"Archive from {self.start_date} to {self.end_date} ({self.log_count} logs)"
