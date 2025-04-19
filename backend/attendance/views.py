"""
Purpose: API views for attendance tracking
Connected to: Session attendance management
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404

# Fix the import names to match the actual class names in permissions.py
from users.permissions import IsAdminUser, IsTherapistUser, IsPatientUser
from scheduling.models import Appointment
# Import the correct models - Session and Assessment instead of AttendanceRecord
from .models import Session, Assessment, AssessmentVersion
from .serializers import SessionSerializer, AssessmentSerializer
# Add this import for the Therapist model
from users.models import Therapist

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
@permission_classes([permissions.IsAuthenticated, IsPatientUser])  # Change IsPatient to IsPatientUser
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

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Attendance, Holiday
from .serializers import AttendanceSerializer, HolidaySerializer, AttendanceMonthSerializer
from django.utils import timezone
from datetime import datetime
import calendar
from django.db.models import Count, Q
from users.models import Therapist

class IsTherapistOrAdmin(permissions.BasePermission):
    """
    Custom permission to allow therapists to submit their own attendance
    and admins to approve attendance.
    """
    def has_permission(self, request, view):
        # Allow all read-only methods for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Handle POST requests specifically
        if request.method == 'POST':
            return request.user.is_authenticated and request.user.role == 'therapist'
        
        # Handle approve action separately
        if view.action == 'approve':
            return request.user.is_authenticated and request.user.role == 'admin'
        
        return True  # Changed from False to allow other methods for admins

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsTherapistOrAdmin]
    
    def get_queryset(self):
        queryset = Attendance.objects.all()
        
        # Filter by therapist if user is a therapist
        if self.request.user.role == 'therapist':
            try:
                therapist = Therapist.objects.get(user=self.request.user)
                queryset = queryset.filter(therapist=therapist)
            except Therapist.DoesNotExist:
                return Attendance.objects.none()
        
        # Filter by year and month if provided
        year = self.request.query_params.get('year')
        month = self.request.query_params.get('month')
        
        if year and month:
            try:
                year = int(year)
                month = int(month)
                _, last_day = calendar.monthrange(year, month)
                start_date = datetime(year, month, 1).date()
                end_date = datetime(year, month, last_day).date()
                queryset = queryset.filter(date__gte=start_date, date__lte=end_date)
            except (ValueError, TypeError):
                pass
        
        return queryset
    
    def perform_create(self, serializer):
        """Set the therapist to the current user's therapist profile"""
        try:
            therapist = Therapist.objects.get(user=self.request.user)
            serializer.save(therapist=therapist)
        except Therapist.DoesNotExist:
            raise serializers.ValidationError("Therapist profile not found for this user.")
    
    @action(detail=True, methods=['put'])
    def approve(self, request, pk=None):
        attendance = self.get_object()
        attendance.approve(request.user)
        return Response({'status': 'attendance approved'})
    
    @action(detail=False, methods=['get'])
    def monthly_summary(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        
        if not year or not month:
            today = timezone.now().date()
            year = today.year
            month = today.month
        else:
            year = int(year)
            month = int(month)
        
        # Get start and end date for the month
        _, last_day = calendar.monthrange(year, month)
        start_date = datetime(year, month, 1).date()
        end_date = datetime(year, month, last_day).date()
        
        # Get therapist
        if request.user.role == 'therapist':
            try:
                therapist = Therapist.objects.get(user=self.request.user)
            except Therapist.DoesNotExist:
                return Response({"error": "Therapist profile not found"}, 
                               status=status.HTTP_400_BAD_REQUEST)
        else:
            therapist_id = request.query_params.get('therapist_id')
            if not therapist_id:
                return Response({"error": "Therapist ID is required for non-therapist users"}, 
                               status=status.HTTP_400_BAD_REQUEST)
            try:
                therapist = Therapist.objects.get(id=therapist_id)
            except Therapist.DoesNotExist:
                return Response({"error": "Therapist not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Get all attendance records for the month
        attendances = Attendance.objects.filter(
            therapist=therapist,
            date__gte=start_date,
            date__lte=end_date
        )
        
        # Get holidays for the month
        holidays = Holiday.objects.filter(date__gte=start_date, date__lte=end_date)
        holiday_dates = [holiday.date for holiday in holidays]
        
        # Count approved attendances by status
        present_count = attendances.filter(status='present', approved_by__isnull=False).count()
        half_day_count = attendances.filter(status='half_day', approved_by__isnull=False).count()
        approved_leave_count = attendances.filter(status='approved_leave', approved_by__isnull=False).count()
        
        # Calculate absent days (excluding holidays)
        all_dates = [datetime(year, month, day).date() for day in range(1, last_day + 1)]
        attendance_dates = [att.date for att in attendances]
        absent_dates = [date for date in all_dates 
                       if date not in attendance_dates 
                       and date not in holiday_dates
                       and date <= timezone.now().date()]  # Only count past days as absent
        
        # Prepare days data
        days_data = []
        
        for day in range(1, last_day + 1):
            current_date = datetime(year, month, day).date()
            
            # Check if it's a holiday
            is_holiday = current_date in holiday_dates
            holiday_name = next((h.name for h in holidays if h.date == current_date), None)
            
            # Find attendance for this day
            attendance = next((att for att in attendances if att.date == current_date), None)
            
            if is_holiday:
                days_data.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "status": "holiday",
                    "holiday_name": holiday_name
                })
            elif attendance:
                days_data.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "status": attendance.status,
                    "submitted_at": attendance.submitted_at_ist if hasattr(attendance, 'submitted_at_ist') else None,
                    "approved_at": attendance.approved_at_ist if hasattr(attendance, 'approved_at_ist') and attendance.approved_by else None,
                    "is_approved": attendance.approved_by is not None
                })
            else:
                # For past dates with no attendance, mark as absent
                if current_date <= timezone.now().date():
                    days_data.append({
                        "date": current_date.strftime("%Y-%m-%d"),
                        "status": "absent",
                        "is_approved": False
                    })
                else:
                    # Future dates
                    days_data.append({
                        "date": current_date.strftime("%Y-%m-%d"),
                        "status": "upcoming",
                        "is_approved": False
                    })
        
        # Prepare response data
        response_data = {
            "present": present_count,
            "absent": len(absent_dates),
            "half_day": half_day_count,
            "approved_leaves": approved_leave_count,
            "holidays": len(holiday_dates),
            "days": days_data
        }
        
        return Response(response_data)

class HolidayViewSet(viewsets.ModelViewSet):
    queryset = Holiday.objects.all()
    serializer_class = HolidaySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Holiday.objects.all()
        
        # Filter by year and month if provided
        year = self.request.query_params.get('year')
        month = self.request.query_params.get('month')
        
        if year and month:
            try:
                year = int(year)
                month = int(month)
                _, last_day = calendar.monthrange(year, month)
                start_date = datetime(year, month, 1).date()
                end_date = datetime(year, month, last_day).date()
                queryset = queryset.filter(date__gte=start_date, date__lte=end_date)
            except (ValueError, TypeError):
                pass
        
        return queryset
