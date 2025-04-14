"""
Purpose: Custom permissions for role-based access control
Connected to: API views and authentication
"""

from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_admin

class IsTherapist(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_therapist

class IsDoctor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_doctor

class IsPatient(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_patient