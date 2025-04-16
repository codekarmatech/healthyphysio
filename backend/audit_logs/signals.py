"""
Purpose: Automatically generate audit logs on model changes
Connected Endpoints: Django model signals
Validation: Complete state capture for all changes
"""

from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.db import models
import inspect
import threading
from .models import AuditLog
from django.core.serializers.json import DjangoJSONEncoder
import json
import sys

# Thread local storage to track current user from request
_thread_locals = threading.local()

def get_current_user():
    return getattr(_thread_locals, 'user', None)

def get_current_request():
    return getattr(_thread_locals, 'request', None)

def set_current_user(user):
    _thread_locals.user = user

def set_current_request(request):
    _thread_locals.request = request

# Models to exclude from audit logging
EXCLUDED_MODELS = [
    'AuditLog',
    'AuditLogArchive',
    'Session',
    'ContentType',
    'Permission',
    'Migration',  # Add Migration model to excluded models
]

# Check if we're running migrations
RUNNING_MIGRATIONS = 'migrate' in sys.argv

@receiver(pre_save)
def pre_save_handler(sender, instance, **kwargs):
    """Store the pre-save state of the instance"""
    # Skip if running migrations
    if RUNNING_MIGRATIONS:
        return
        
    # Skip excluded models
    if sender.__name__ in EXCLUDED_MODELS:
        return
    
    # Skip if this is a new instance
    if not instance.pk:
        return
    
    try:
        # Get the current instance from the database
        old_instance = sender.objects.get(pk=instance.pk)
        # Store the old state on the instance for later use
        instance._pre_save_state = {
            field.name: getattr(old_instance, field.name)
            for field in sender._meta.fields
            if not isinstance(field, models.FileField)  # Skip file fields
        }
    except sender.DoesNotExist:
        # Instance is new
        instance._pre_save_state = {}

@receiver(post_save)
def post_save_handler(sender, instance, created, **kwargs):
    """Create an audit log entry after a model is saved"""
    # Skip if running migrations
    if RUNNING_MIGRATIONS:
        return
        
    # Skip excluded models
    if sender.__name__ in EXCLUDED_MODELS:
        return
    
    # Get the current user and request
    user = get_current_user()
    request = get_current_request()
    
    # Get IP and user agent if available
    ip_address = None
    user_agent = ''
    if request:
        ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    # Determine the action
    action = 'CREATE' if created else 'UPDATE'
    
    # Get the previous state
    previous_state = getattr(instance, '_pre_save_state', {}) if not created else {}
    
    # Get the current state
    current_state = {
        field.name: getattr(instance, field.name)
        for field in sender._meta.fields
        if not isinstance(field, models.FileField)  # Skip file fields
    }
    
    # When creating the AuditLog, ensure any datetime objects are properly serialized
    if previous_state:
        previous_state = json.loads(json.dumps(previous_state, cls=DjangoJSONEncoder))
    
    # Fix: Use current_state instead of new_state
    if current_state:
        current_state = json.loads(json.dumps(current_state, cls=DjangoJSONEncoder))
    
    AuditLog.objects.create(
        user=user,
        action=action,
        model_name=sender.__name__,  # Fix: Use sender.__name__ instead of model_name
        object_id=str(instance.pk),
        object_repr=str(instance)[:255],
        previous_state=previous_state,
        new_state=current_state,  # Fix: Use current_state instead of new_state
        ip_address=ip_address,
        user_agent=user_agent
    )

@receiver(post_delete)
def post_delete_handler(sender, instance, **kwargs):
    """Create an audit log entry after a model is deleted"""
    # Skip if running migrations
    if RUNNING_MIGRATIONS:
        return
        
    # Skip excluded models
    if sender.__name__ in EXCLUDED_MODELS:
        return
    
    # Get the current user and request
    user = get_current_user()
    request = get_current_request()
    
    # Get IP and user agent if available
    ip_address = None
    user_agent = ''
    if request:
        ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    # Get the final state before deletion
    final_state = {
        field.name: getattr(instance, field.name)
        for field in sender._meta.fields
        if not isinstance(field, models.FileField)  # Skip file fields
    }
    
    # Create the audit log
    AuditLog.objects.create(
        user=user,
        action='DELETE',
        model_name=sender.__name__,
        object_id=str(instance.pk),
        object_repr=str(instance)[:255],
        previous_state=final_state,
        new_state=None,
        ip_address=ip_address,
        user_agent=user_agent
    )