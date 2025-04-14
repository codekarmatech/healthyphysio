"""
Purpose: Custom permissions for role-based access control
Connected Endpoints: All API endpoints
Validation: Role hierarchy checks
"""

from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """
    Allows access only to admin users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')


class IsTherapistUser(permissions.BasePermission):
    """
    Allows access only to therapist users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'therapist')


class IsDoctorUser(permissions.BasePermission):
    """
    Allows access only to doctor users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'doctor')


class IsPatientUser(permissions.BasePermission):
    """
    Allows access only to patient users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'patient')


class HasRoleOrHigher(permissions.BasePermission):
    """
    Allows access based on role hierarchy.
    """
    def __init__(self, required_role):
        self.required_role = required_role
        self.role_hierarchy = {
            'admin': 4,
            'therapist': 3,
            'doctor': 2,
            'patient': 1
        }
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        user_role = request.user.role
        
        # Admin has access to everything
        if user_role == 'admin':
            return True
        
        # Check if user's role is higher or equal in hierarchy
        return self.role_hierarchy.get(user_role, 0) >= self.role_hierarchy.get(self.required_role, 0)