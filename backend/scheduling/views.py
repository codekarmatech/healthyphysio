"""
Purpose: API views for appointment scheduling
Connected to: Appointment management
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
# Fix the import to use the correct permission class names
from users.permissions import IsAdminUser, IsTherapistUser, IsPatientUser
from .models import Appointment, RescheduleRequest, Session
from .serializers import AppointmentSerializer, RescheduleRequestSerializer, SessionSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            # Only admin can create new appointments
            permission_classes = [permissions.IsAuthenticated, IsAdminUser]
        elif self.action in ['update', 'partial_update']:
            # Admin and therapists can update appointments
            permission_classes = [permissions.IsAuthenticated, IsAdminUser | IsTherapistUser]
        elif self.action == 'destroy':
            # Only admin can delete appointments
            permission_classes = [permissions.IsAuthenticated, IsAdminUser]
        else:
            # Everyone can view appointments
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
    
    def update(self, request, *args, **kwargs):
        # Get the original appointment
        instance = self.get_object()
        
        # Store the original state for comparison
        original_data = {
            'therapist_id': instance.therapist.id if instance.therapist else None,
            'patient_id': instance.patient.id if instance.patient else None,
            'datetime': instance.datetime.isoformat() if instance.datetime else None,
            'duration_minutes': instance.duration_minutes,
            'status': instance.status,
            'type': instance.type,
            'issue': instance.issue,
            'notes': instance.notes,
            'previous_treatments': instance.previous_treatments,
            'pain_level': instance.pain_level,
            'mobility_issues': instance.mobility_issues
        }
        
        # Process the update
        response = super().update(request, *args, **kwargs)
        
        # If the update was successful, track changes
        if response.status_code == 200:
            instance.refresh_from_db()
            
            # Get the new state
            new_data = {
                'therapist_id': instance.therapist.id if instance.therapist else None,
                'patient_id': instance.patient.id if instance.patient else None,
                'datetime': instance.datetime.isoformat() if instance.datetime else None,
                'duration_minutes': instance.duration_minutes,
                'status': instance.status,
                'type': instance.type,
                'issue': instance.issue,
                'notes': instance.notes,
                'previous_treatments': instance.previous_treatments,
                'pain_level': instance.pain_level,
                'mobility_issues': instance.mobility_issues
            }
            
            # Find changes
            changes = []
            for field, old_value in original_data.items():
                new_value = new_data.get(field)
                if old_value != new_value:
                    changes.append({
                        'field': field,
                        'old_value': old_value,
                        'new_value': new_value,
                        'changed_at': timezone.now().isoformat(),
                        'changed_by': request.user.id
                    })
            
            # If there are changes, update the changes_log
            if changes:
                current_log = instance.changes_log or []
                instance.changes_log = current_log + changes
                instance.save(update_fields=['changes_log'])
        
        return response
    
    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        appointment = self.get_object()
        
        # Check if appointment is in the future
        if appointment.datetime < timezone.now():
            return Response(
                {"error": "Cannot reschedule past appointments"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the new datetime from request
        new_datetime = request.data.get('requested_datetime')
        if not new_datetime:
            return Response(
                {"error": "New datetime is required (requested_datetime)"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the reason from request
        reason = request.data.get('reason')
        if not reason:
            return Response(
                {"error": "Reason for rescheduling is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is admin (direct reschedule) or therapist (request reschedule)
        if request.user.is_admin:
            # Admin can directly reschedule
            old_datetime = appointment.datetime
            appointment.datetime = new_datetime
            appointment.status = Appointment.Status.RESCHEDULED
            appointment.reschedule_count += 1
            appointment.save()
            
            # Track the change
            if appointment.changes_log is None:
                appointment.changes_log = []
                
            appointment.changes_log.append({
                'field': 'datetime',
                'old_value': old_datetime.isoformat() if old_datetime else None,
                'new_value': new_datetime,
                'changed_at': timezone.now().isoformat(),
                'changed_by': request.user.id,
                'reason': reason
            })
            appointment.save(update_fields=['changes_log'])
            
            return Response(
                {"message": "Appointment rescheduled successfully"},
                status=status.HTTP_200_OK
            )
        else:
            # Create a reschedule request
            reschedule_request = RescheduleRequest.objects.create(
                appointment=appointment,
                requested_by=request.user,
                requested_datetime=new_datetime,
                reason=reason,
                status=RescheduleRequest.Status.PENDING
            )
            
            # Update appointment status to pending_reschedule
            appointment.status = 'pending_reschedule'
            appointment.save()
            
            # Track the change
            if appointment.changes_log is None:
                appointment.changes_log = []
                
            appointment.changes_log.append({
                'field': 'status',
                'old_value': appointment.status,
                'new_value': 'pending_reschedule',
                'changed_at': timezone.now().isoformat(),
                'changed_by': request.user.id,
                'reschedule_request_id': reschedule_request.id
            })
            appointment.save(update_fields=['changes_log'])
            
            return Response(
                {"message": "Reschedule request submitted successfully"},
                status=status.HTTP_200_OK
            )
    
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
        old_datetime = appointment.datetime
        appointment.datetime = reschedule_request.requested_datetime
        appointment.status = 'rescheduled'
        appointment.reschedule_count += 1
        appointment.save()
        
        # Update reschedule request
        reschedule_request.status = 'approved'
        reschedule_request.admin_notes = request.data.get('admin_notes', '')
        reschedule_request.save()
        
        # Track the change
        if appointment.changes_log is None:
            appointment.changes_log = []
            
        appointment.changes_log.append({
            'field': 'datetime',
            'old_value': old_datetime.isoformat() if old_datetime else None,
            'new_value': reschedule_request.requested_datetime.isoformat() if reschedule_request.requested_datetime else None,
            'changed_at': timezone.now().isoformat(),
            'changed_by': request.user.id,
            'reschedule_request_id': reschedule_request.id,
            'admin_notes': request.data.get('admin_notes', '')
        })
        
        appointment.changes_log.append({
            'field': 'status',
            'old_value': 'pending_reschedule',
            'new_value': 'rescheduled',
            'changed_at': timezone.now().isoformat(),
            'changed_by': request.user.id,
            'reschedule_request_id': reschedule_request.id,
            'admin_notes': request.data.get('admin_notes', '')
        })
        appointment.save(update_fields=['changes_log'])
        
        return Response(
            {"message": "Reschedule request approved"},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        reschedule_request = self.get_object()
        appointment = reschedule_request.appointment
        
        # Update reschedule request
        reschedule_request.status = 'rejected'
        reschedule_request.admin_notes = request.data.get('admin_notes', '')
        reschedule_request.save()
        
        # Revert appointment status to scheduled
        appointment.status = 'scheduled'
        appointment.save()
        
        # Track the change
        if appointment.changes_log is None:
            appointment.changes_log = []
            
        appointment.changes_log.append({
            'field': 'status',
            'old_value': 'pending_reschedule',
            'new_value': 'scheduled',
            'changed_at': timezone.now().isoformat(),
            'changed_by': request.user.id,
            'reschedule_request_id': reschedule_request.id,
            'admin_notes': request.data.get('admin_notes', '')
        })
        appointment.save(update_fields=['changes_log'])
        
        return Response(
            {"message": "Reschedule request rejected"},
            status=status.HTTP_200_OK
        )

class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsAdminUser | IsTherapistUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Session.objects.all()
        elif user.is_therapist:
            try:
                therapist = user.therapist_profile
                return Session.objects.filter(appointment__therapist=therapist)
            except:
                return Session.objects.none()
        elif user.is_patient:
            try:
                patient = user.patient_profile
                return Session.objects.filter(appointment__patient=patient)
            except:
                return Session.objects.none()
        return Session.objects.none()
    
    @action(detail=True, methods=['post'])
    def initiate_check_in(self, request, pk=None):
        session = self.get_object()
        success = session.initiate_check_in()
        
        if success:
            return Response({"message": "Check-in initiated successfully"})
        else:
            return Response(
                {"error": "Cannot initiate check-in for this session"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def approve_check_in(self, request, pk=None):
        session = self.get_object()
        success = session.approve_check_in()
        
        if success:
            return Response({"message": "Check-in approved successfully"})
        else:
            return Response(
                {"error": "Cannot approve check-in for this session"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        session = self.get_object()
        rating = request.data.get('rating')
        patient_notes = request.data.get('patient_notes', '')
        
        success = session.complete_session(rating, patient_notes)
        
        if success:
            return Response({"message": "Session completed successfully"})
        else:
            return Response(
                {"error": "Cannot complete this session"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def mark_missed(self, request, pk=None):
        session = self.get_object()
        success = session.mark_as_missed()
        
        if success:
            return Response({"message": "Session marked as missed"})
        else:
            return Response(
                {"error": "Cannot mark this session as missed"},
                status=status.HTTP_400_BAD_REQUEST
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
