"""
Purpose: API views for appointment scheduling
Connected to: Appointment management
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Appointment, RescheduleRequest
from .serializers import AppointmentSerializer, RescheduleRequestSerializer
from users.permissions import IsAdminUser, IsTherapist, IsPatient

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Appointment.objects.all()
        elif user.is_therapist:
            # Therapists can only see their assigned appointments
            therapist = user.therapist_profile
            return Appointment.objects.filter(therapist=therapist)
        elif user.is_patient:
            # Patients can only see their own appointments
            patient = user.patient_profile
            return Appointment.objects.filter(patient=patient)
        return Appointment.objects.none()
    
    def perform_create(self, serializer):
        # Only admins can create appointments
        if not self.request.user.is_admin:
            raise permissions.PermissionDenied("Only admins can create appointments")
        serializer.save()

class RescheduleRequestViewSet(viewsets.ModelViewSet):
    queryset = RescheduleRequest.objects.all()
    serializer_class = RescheduleRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return RescheduleRequest.objects.all()
        # Others can only see their own requests
        return RescheduleRequest.objects.filter(requested_by=user)
    
    def perform_create(self, serializer):
        appointment = serializer.validated_data['appointment']
        
        # Check if appointment can be rescheduled
        if not appointment.can_reschedule():
            return Response(
                {"error": "This appointment cannot be rescheduled. Either the maximum number of reschedules has been reached or it's within 24 hours of the appointment."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer.save(requested_by=self.request.user)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def validate_session_code(request, code):
    try:
        appointment = Appointment.objects.get(session_code=code)
        # Check if user has permission to view this appointment
        user = request.user
        if user.is_admin:
            is_valid = True
        elif user.is_therapist and appointment.therapist.user == user:
            is_valid = True
        elif user.is_patient and appointment.patient.user == user:
            is_valid = True
        else:
            is_valid = False
            
        return Response({"is_valid": is_valid})
    except Appointment.DoesNotExist:
        return Response({"is_valid": False})
