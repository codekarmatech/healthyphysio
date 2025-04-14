"""
Purpose: API views for attendance tracking
Connected to: Session management
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Session, Assessment, AssessmentVersion
from .serializers import SessionSerializer, AssessmentSerializer, AssessmentVersionSerializer
from scheduling.models import Appointment
from users.permissions import IsAdminUser, IsTherapist, IsPatient

class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Session.objects.all()
        elif user.is_therapist:
            # Therapists can only see sessions for their appointments
            therapist = user.therapist_profile
            return Session.objects.filter(appointment__therapist=therapist)
        elif user.is_patient:
            # Patients can only see their own sessions
            patient = user.patient_profile
            return Session.objects.filter(appointment__patient=patient)
        return Session.objects.none()

class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.all()
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Assessment.objects.all()
        elif user.is_therapist:
            # Therapists can see assessments for their sessions
            therapist = user.therapist_profile
            return Assessment.objects.filter(session__appointment__therapist=therapist)
        elif user.is_patient:
            # Patients can only see assessments shared with them
            patient = user.patient_profile
            return Assessment.objects.filter(
                session__appointment__patient=patient,
                shared_with_patient=True
            )
        return Assessment.objects.none()
    
    def perform_update(self, serializer):
        # Create a version history when assessment is updated
        old_assessment = self.get_object()
        changes = {}
        
        for field in ['content', 'shared_with_patient']:
            old_value = getattr(old_assessment, field)
            new_value = serializer.validated_data.get(field, old_value)
            if old_value != new_value:
                changes[field] = {'old': old_value, 'new': new_value}
        
        # Save the updated assessment
        assessment = serializer.save()
        
        # Create a version record if there are changes
        if changes:
            AssessmentVersion.objects.create(
                assessment=assessment,
                content=assessment.content,
                changes=changes,
                edited_by=self.request.user
            )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsPatient])
def approve_checkin(request, session_code):
    try:
        appointment = Appointment.objects.get(session_code=session_code)
        
        # Verify this is the patient's appointment
        if request.user.patient_profile != appointment.patient:
            return Response({"error": "You are not authorized to approve this check-in"}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        # Get or create session
        session, created = Session.objects.get_or_create(appointment=appointment)
        
        # Check if session is in the right state
        if session.status != Session.Status.CHECKIN_INITIATED:
            return Response({"error": "Session is not in check-in initiated state"}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Approve check-in
        success = session.approve_check_in()
        
        if success:
            return Response({"message": "Check-in approved successfully"})
        else:
            return Response({"error": "Failed to approve check-in"}, 
                           status=status.HTTP_400_BAD_REQUEST)
            
    except Appointment.DoesNotExist:
        return Response({"error": "Invalid session code"}, 
                       status=status.HTTP_404_NOT_FOUND)
