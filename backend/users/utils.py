"""
Purpose: Utility functions for user-related operations
Connected to: User and profile management
"""

from django.contrib.auth import get_user_model
from .models import Therapist, Patient, Doctor

User = get_user_model()

def get_therapist_from_user(user):
    """
    Get the therapist profile associated with a user.
    
    Args:
        user: User instance or user ID
        
    Returns:
        Therapist instance or None if not found
    """
    if not user:
        return None
        
    # If user is already a Therapist instance, return it
    if isinstance(user, Therapist):
        return user
        
    # If user is a user ID (integer or string)
    if isinstance(user, (int, str)):
        try:
            # Try to get the user first
            user_obj = User.objects.get(id=user)
            # Then get the therapist profile
            return Therapist.objects.get(user=user_obj)
        except (User.DoesNotExist, Therapist.DoesNotExist, ValueError):
            # Try directly with therapist ID
            try:
                return Therapist.objects.get(id=user)
            except (Therapist.DoesNotExist, ValueError):
                return None
    
    # If user is a User instance
    try:
        return user.therapist_profile
    except (AttributeError, Therapist.DoesNotExist):
        return None

def get_patient_from_user(user):
    """
    Get the patient profile associated with a user.
    
    Args:
        user: User instance or user ID
        
    Returns:
        Patient instance or None if not found
    """
    if not user:
        return None
        
    # If user is already a Patient instance, return it
    if isinstance(user, Patient):
        return user
        
    # If user is a user ID (integer or string)
    if isinstance(user, (int, str)):
        try:
            # Try to get the user first
            user_obj = User.objects.get(id=user)
            # Then get the patient profile
            return Patient.objects.get(user=user_obj)
        except (User.DoesNotExist, Patient.DoesNotExist, ValueError):
            # Try directly with patient ID
            try:
                return Patient.objects.get(id=user)
            except (Patient.DoesNotExist, ValueError):
                return None
    
    # If user is a User instance
    try:
        return user.patient_profile
    except (AttributeError, Patient.DoesNotExist):
        return None

def get_doctor_from_user(user):
    """
    Get the doctor profile associated with a user.
    
    Args:
        user: User instance or user ID
        
    Returns:
        Doctor instance or None if not found
    """
    if not user:
        return None
        
    # If user is already a Doctor instance, return it
    if isinstance(user, Doctor):
        return user
        
    # If user is a user ID (integer or string)
    if isinstance(user, (int, str)):
        try:
            # Try to get the user first
            user_obj = User.objects.get(id=user)
            # Then get the doctor profile
            return Doctor.objects.get(user=user_obj)
        except (User.DoesNotExist, Doctor.DoesNotExist, ValueError):
            # Try directly with doctor ID
            try:
                return Doctor.objects.get(id=user)
            except (Doctor.DoesNotExist, ValueError):
                return None
    
    # If user is a User instance
    try:
        return user.doctor_profile
    except (AttributeError, Doctor.DoesNotExist):
        return None