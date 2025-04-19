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
from django.forms.models import model_to_dict

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
def log_model_change(sender, instance, created=False, **kwargs):
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
        # Before serializing, convert complex objects to their string representation or ID
        def prepare_for_json(data):
            if isinstance(data, dict):
                return {k: prepare_for_json(v) for k, v in data.items()}
            elif isinstance(data, (list, tuple)):
                return [prepare_for_json(item) for item in data]
            elif hasattr(data, 'pk') and hasattr(data, '__class__'):
                # For model instances, just store the ID and model name
                return f"{data.__class__.__name__}:{data.pk}"
            else:
                return data
        
        # Apply the conversion before JSON serialization
        previous_state = prepare_for_json(previous_state)
        previous_state = json.loads(json.dumps(previous_state, cls=DjangoJSONEncoder))
    
    # Fix: Use current_state instead of new_state
    if current_state:
        # Convert instance into plain dict of its fields (FKs → IDs)
        state_dict     = model_to_dict(instance, fields=[f.name for f in instance._meta.fields])
        current_state  = state_dict
    
    # Create a serializable data dictionary instead of using the raw instance
    serialized_data = {
        'id': instance.id,
        # Add other relevant fields, but avoid FK objects directly
    }
    
    # If there's a user FK, just store the ID and username
    if hasattr(instance, 'user') and instance.user:
        serialized_data['user_id'] = instance.user.id
        serialized_data['username'] = instance.user.username
    
    # Use DjangoJSONEncoder for safe serialization
    # Create a serializable representation
    serializable_data = {}
    for field in instance._meta.fields:
        field_name = field.name
        field_value = getattr(instance, field_name)
        
        # Handle non-serializable types
        if hasattr(field_value, 'pk'):
            # For foreign keys, just store the ID
            serializable_data[field_name + '_id'] = field_value.pk
        elif isinstance(field_value, (str, int, float, bool, type(None))):
            # These types are JSON serializable
            serializable_data[field_name] = field_value
    
    model_name = sender.__name__
    object_repr = str(instance)[:255]
    AuditLog.objects.create(
        user=user,
        action=action,
        model_name=sender.__name__,
        object_id=str(instance.id),
        object_repr=object_repr,
        previous_state=(previous_state if not created else None),
        new_state=serialized_data,
        ip_address=ip_address,
        user_agent=user_agent,
        # timestamp is auto‑populated by auto_now_add
        # integrity_hash will be generated in AuditLog.save()
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
    
    # Get the final state before deletion - handle foreign keys properly
    final_state = {}
    for field in sender._meta.fields:
        if isinstance(field, models.ForeignKey):
            # Store the ID instead of the object
            final_state[f'{field.name}_id'] = getattr(instance, f'{field.name}_id', None)
        else:
            final_state[field.name] = str(getattr(instance, field.name, ''))  # Convert to string for non-serializable types
    
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