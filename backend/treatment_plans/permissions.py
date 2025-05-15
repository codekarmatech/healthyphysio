from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to create/edit/delete objects.
    Others can only view.
    """

    def has_permission(self, request, view):  # view param required by DRF
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to admin users
        return request.user and request.user.is_admin

class IsTherapistOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow therapists and admins to access objects.
    """

    def has_permission(self, request, view):  # view param required by DRF
        # Allow access only to authenticated users who are therapists or admins
        return request.user and (request.user.is_therapist or request.user.is_admin)

    def has_object_permission(self, request, view, obj):  # view param required by DRF
        # Allow admins full access
        if request.user.is_admin:
            return True

        # For therapists, check if they are assigned to the object
        if hasattr(obj, 'therapist'):
            return obj.therapist.user == request.user

        # For treatment plans, check if the therapist is assigned to the patient
        if hasattr(obj, 'patient'):
            # Check if the therapist is assigned to this patient
            # This would need to be customized based on your specific model relationships
            return obj.patient.appointments.filter(therapist__user=request.user).exists()

        return False

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admins to edit it.
    """

    def has_object_permission(self, request, view, obj):  # view param required by DRF
        # Allow admins full access
        if request.user.is_admin:
            return True

        # Allow read access to therapists for their patients' objects
        if request.method in permissions.SAFE_METHODS and request.user.is_therapist:
            if hasattr(obj, 'patient'):
                return obj.patient.appointments.filter(therapist__user=request.user).exists()

        # Allow patients to view their own objects
        if request.method in permissions.SAFE_METHODS and request.user.is_patient:
            if hasattr(obj, 'patient'):
                return obj.patient.user == request.user

        # Check if the user is the owner
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user

        return False
