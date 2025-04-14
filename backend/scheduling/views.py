"""
Purpose: API views for appointment scheduling
Connected to: Appointment management
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
# Fix the import to use the correct permission class names
from users.permissions import IsAdminUser, IsTherapistUser, IsPatientUser
from .models import Appointment, RescheduleRequest
from .serializers import AppointmentSerializer, RescheduleRequestSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsAdminUser | IsTherapistUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Appointment.objects.all()
        elif user.is_therapist:
            try:
                therapist = user.therapist_profile
                return Appointment.objects.filter(therapist=therapist)
            except:
                return Appointment.objects.none()
        elif user.is_patient:
            try:
                patient = user.patient_profile
                return Appointment.objects.filter(patient=patient)
            except:
                return Appointment.objects.none()
        return Appointment.objects.none()
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        appointment = self.get_object()
        
        # Check if appointment is in the future
        if appointment.datetime < timezone.now():
            return Response(
                {"error": "Cannot cancel past appointments"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointment.status = 'CANCELLED'
        appointment.save()
        
        return Response(
            {"message": "Appointment cancelled successfully"},
            status=status.HTTP_200_OK
        )

class RescheduleRequestViewSet(viewsets.ModelViewSet):
    queryset = RescheduleRequest.objects.all()
    serializer_class = RescheduleRequestSerializer
    
    def get_permissions(self):
        if self.action in ['approve', 'reject']:
            permission_classes = [permissions.IsAuthenticated, IsAdminUser | IsTherapistUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return RescheduleRequest.objects.all()
        elif user.is_therapist:
            try:
                therapist = user.therapist_profile
                return RescheduleRequest.objects.filter(appointment__therapist=therapist)
            except:
                return RescheduleRequest.objects.none()
        elif user.is_patient:
            try:
                patient = user.patient_profile
                return RescheduleRequest.objects.filter(appointment__patient=patient)
            except:
                return RescheduleRequest.objects.none()
        return RescheduleRequest.objects.none()
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        reschedule_request = self.get_object()
        appointment = reschedule_request.appointment
        
        # Update appointment with new datetime
        appointment.datetime = reschedule_request.proposed_datetime
        appointment.status = 'CONFIRMED'
        appointment.save()
        
        # Update reschedule request
        reschedule_request.status = 'APPROVED'
        reschedule_request.save()
        
        return Response(
            {"message": "Reschedule request approved"},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        reschedule_request = self.get_object()
        
        # Update reschedule request
        reschedule_request.status = 'REJECTED'
        reschedule_request.save()
        
        return Response(
            {"message": "Reschedule request rejected"},
            status=status.HTTP_200_OK
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def validate_session_code_api(request, code):
    """
    Validate a session code for WebSocket connection
    """
    try:
        # Find appointment with this session code
        appointment = Appointment.objects.get(
            session_code=code,
            datetime__date=timezone.now().date(),  # Only today's appointments
            status='CONFIRMED'
        )
        
        # Check if appointment is active (within time window)
        now = timezone.now()
        start_time = appointment.datetime
        end_time = start_time + timezone.timedelta(minutes=appointment.duration)
        
        if now < start_time:
            return Response(
                {"valid": False, "message": "Session has not started yet"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if now > end_time:
            return Response(
                {"valid": False, "message": "Session has ended"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is authorized for this session
        user = request.user
        if user.is_admin:
            is_authorized = True
        elif user.is_therapist and appointment.therapist.user == user:
            is_authorized = True
        elif user.is_patient and appointment.patient.user == user:
            is_authorized = True
        else:
            is_authorized = False
        
        if not is_authorized:
            return Response(
                {"valid": False, "message": "Not authorized for this session"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Session is valid and user is authorized
        return Response({
            "valid": True,
            "appointment_id": appointment.id,
            "patient": appointment.patient.user.get_full_name(),
            "therapist": appointment.therapist.user.get_full_name(),
            "datetime": appointment.datetime,
            "duration": appointment.duration
        })
        
    except Appointment.DoesNotExist:
        return Response(
            {"valid": False, "message": "Invalid session code"},
            status=status.HTTP_404_NOT_FOUND
        )
