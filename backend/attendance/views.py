"""
Purpose: API views for attendance tracking
Connected to: Session attendance management
"""

from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from datetime import datetime
import calendar

# User permissions
from users.permissions import IsAdminUser, IsTherapistUser, IsPatientUser
# Scheduling models and serializers
from scheduling.models import Appointment, Session
from scheduling.serializers import SessionSerializer
# User models
from users.models import Therapist

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsPatientUser])
def approve_checkin(request, session_code):
    # Use get_object_or_404 to handle the case when the appointment doesn't exist
    appointment = get_object_or_404(Appointment, session_code=session_code)
    
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
        # Use SessionSerializer to return the updated session data
        serializer = SessionSerializer(session)
        return Response({
            "message": "Check-in approved successfully",
            "session": serializer.data
        })
    else:
        return Response({"error": "Failed to approve check-in"}, 
                       status=status.HTTP_400_BAD_REQUEST)

# Import local app models and serializers
from .models import Attendance, Holiday, Leave, INDIAN_TZ
from .admin_requests import AttendanceChangeRequest
from .serializers import (
    AttendanceSerializer, HolidaySerializer, AttendanceMonthSerializer, 
    LeaveSerializer, AttendanceChangeRequestSerializer
)
from django.db.models import Count

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
            return IsTherapistUser().has_permission(request, view)
        
        # Handle approve action separately
        if view.action == 'approve':
            return IsAdminUser().has_permission(request, view)
        
        # Allow other methods for both therapists and admins
        return IsTherapistUser().has_permission(request, view) or IsAdminUser().has_permission(request, view)

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
                # Log this issue for administrators
                print(f"WARNING: User {self.request.user.username} has therapist role but no therapist profile")
                return Attendance.objects.none()
        
        # Filter by specific therapist ID if provided
        therapist_id = self.request.query_params.get('therapist_id')
        if therapist_id:
            try:
                therapist_id = int(therapist_id)
                queryset = queryset.filter(therapist_id=therapist_id)
            except (ValueError, TypeError):
                # Invalid therapist ID format
                return Attendance.objects.none()
        
        # Filter by specific date if provided
        date_param = self.request.query_params.get('date')
        if date_param:
            try:
                # Parse the date from YYYY-MM-DD format
                date_obj = datetime.strptime(date_param, '%Y-%m-%d').date()
                queryset = queryset.filter(date=date_obj)
            except (ValueError, TypeError):
                pass
        
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
            # Get the user's username for better error reporting
            username = self.request.user.username
            raise serializers.ValidationError({
                "error": "Therapist profile not found",
                "detail": f"User '{username}' does not have an associated therapist profile. Please contact an administrator."
            })
    
    @action(detail=True, methods=['put'])
    def approve(self, request, pk=None):
        # Verify the user is an admin
        if not IsAdminUser().has_permission(request, self):
            return Response(
                {"error": "Only administrators can approve attendance records"}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        attendance = self.get_object()
        attendance.approve(request.user)
        
        # Return the updated attendance record
        serializer = self.get_serializer(attendance)
        return Response({
            'status': 'attendance approved',
            'attendance': serializer.data
        })
        
    @action(detail=True, methods=['post'])
    def request_change(self, request, pk=None):
        """Create a change request for an existing attendance record"""
        attendance = self.get_object()
        
        # Check if the user is a therapist
        if self.request.user.role != 'therapist':
            return Response(
                {"error": "Only therapists can request attendance changes"}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Get the therapist profile
        try:
            therapist = Therapist.objects.get(user=self.request.user)
            
            # Check if the therapist owns this attendance record
            if attendance.therapist != therapist:
                return Response(
                    {"error": "You can only request changes for your own attendance records"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        except Therapist.DoesNotExist:
            return Response(
                {"error": "Therapist profile not found"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get request data
        requested_status = request.data.get('requested_status')
        reason = request.data.get('reason')
        
        # Validate the request
        if not requested_status:
            return Response(
                {"error": "Requested status is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not reason:
            return Response(
                {"error": "Reason for change is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if there's already a pending change request for this attendance
        existing_request = AttendanceChangeRequest.objects.filter(
            attendance=attendance,
            therapist=therapist,
            status='pending'
        ).first()
        
        if existing_request:
            return Response(
                {
                    "error": "You already have a pending change request for this attendance record.",
                    "change_request_id": existing_request.id,
                    "message": "You already have a pending change request for this attendance. Please wait for admin approval."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the change request
        try:
            # We already have the therapist from above
            change_request = AttendanceChangeRequest.objects.create(
                therapist=therapist,
                attendance=attendance,
                request_type='change_status',
                current_status=attendance.status,
                requested_status=requested_status,
                reason=reason
            )
            
            # Return the created change request
            serializer = AttendanceChangeRequestSerializer(change_request)
            return Response(
                {
                    "message": "Change request submitted successfully. An admin will review your request.",
                    "change_request": serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to create change request: {str(e)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def monthly_summary(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        
        # Get current date in Indian timezone
        now_in_india = timezone.now().astimezone(INDIAN_TZ)
        today_in_india = now_in_india.date()
        
        if not year or not month:
            year = today_in_india.year
            month = today_in_india.month
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
                therapist = Therapist.objects.get(user=request.user)
            except Therapist.DoesNotExist:
                return Response({
                    "error": "Therapist profile not found for your user account",
                    "detail": "Please contact an administrator to set up your therapist profile."
                }, status=status.HTTP_404_NOT_FOUND)
        else:
            # Check for therapist_id parameter (support both therapist_id and therapist for compatibility)
            therapist_id = request.query_params.get('therapist_id') or request.query_params.get('therapist')
            if not therapist_id:
                return Response({
                    "error": "Therapist ID is required for non-therapist users",
                    "detail": "Please provide a valid therapist_id parameter."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                therapist = Therapist.objects.get(id=therapist_id)
            except Therapist.DoesNotExist:
                # Get a list of valid therapist IDs to help with debugging
                valid_ids = list(Therapist.objects.values_list('id', flat=True))
                return Response({
                    "error": f"Therapist with ID {therapist_id} does not exist",
                    "detail": f"Available therapist IDs are: {valid_ids}. Please use one of these IDs."
                }, status=status.HTTP_404_NOT_FOUND)
        
        # Get all attendance records for the month
        attendances = Attendance.objects.filter(
            therapist=therapist,
            date__gte=start_date,
            date__lte=end_date
        )
        
        # Get holidays for the month
        holidays = Holiday.objects.filter(date__gte=start_date, date__lte=end_date)
        holiday_dates = [holiday.date for holiday in holidays]
        
        # Count attendances by status using aggregation
        status_counts = attendances.values('status').annotate(count=Count('id'))
        
        # Convert to a dictionary for easier access
        status_count_dict = {item['status']: item['count'] for item in status_counts}
        
        # Get counts for each status (default to 0 if not present)
        present_count = status_count_dict.get('present', 0)
        half_day_count = status_count_dict.get('half_day', 0)
        approved_leave_count = status_count_dict.get('approved_leave', 0)
        sick_leave_count = status_count_dict.get('sick_leave', 0)
        emergency_leave_count = status_count_dict.get('emergency_leave', 0)
        
        # Calculate absent days (excluding holidays)
        all_dates = [datetime(year, month, day).date() for day in range(1, last_day + 1)]
        attendance_dates = [att.date for att in attendances]
        
        # Only count past days as absent, and exclude Sundays unless there's an attendance record
        absent_dates = []
        for date in all_dates:
            if (date not in attendance_dates and 
                date not in holiday_dates and 
                date <= today_in_india and
                # Only automatically mark weekdays as absent (0-4 is Monday-Friday, 5 is Saturday)
                date.weekday() != 6):  # 6 is Sunday
                absent_dates.append(date)
        
        # Prepare days data
        days_data = []
        
        for day in range(1, last_day + 1):
            current_date = datetime(year, month, day).date()
            
            # Check if it's a holiday
            is_holiday = current_date in holiday_dates
            holiday_name = next((h.name for h in holidays if h.date == current_date), None)
            
            # Check if it's a Sunday
            is_sunday = current_date.weekday() == 6
            
            # Find attendance for this day
            attendance = next((att for att in attendances if att.date == current_date), None)
            
            if is_holiday:
                days_data.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "status": "holiday",
                    "holiday_name": holiday_name,
                    "is_paid": True
                })
            elif attendance:
                days_data.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "status": attendance.status,
                    "submitted_at": attendance.submitted_at.astimezone(INDIAN_TZ).strftime("%Y-%m-%dT%H:%M:%S%z") if attendance.submitted_at else None,
                    "approved_at": attendance.approved_at.astimezone(INDIAN_TZ).strftime("%Y-%m-%dT%H:%M:%S%z") if attendance.approved_at else None,
                    "is_approved": attendance.approved_by is not None,
                    "is_paid": attendance.is_paid,
                    "notes": attendance.notes
                })
            else:
                # For past dates with no attendance
                if current_date <= today_in_india:
                    # If it's a Sunday, mark as weekend (not counted as absent)
                    if is_sunday:
                        days_data.append({
                            "date": current_date.strftime("%Y-%m-%d"),
                            "status": "weekend",
                            "is_approved": False,
                            "is_paid": False
                        })
                    else:
                        # Regular absent day
                        days_data.append({
                            "date": current_date.strftime("%Y-%m-%d"),
                            "status": "absent",
                            "is_approved": False,
                            "is_paid": False
                        })
                else:
                    # Future dates
                    days_data.append({
                        "date": current_date.strftime("%Y-%m-%d"),
                        "status": "upcoming",
                        "is_approved": False,
                        "is_paid": False
                    })
        
        # Prepare response data
        response_data = {
            "present": present_count,
            "absent": len(absent_dates),
            "half_day": half_day_count,
            "approved_leaves": approved_leave_count,
            "sick_leaves": sick_leave_count,
            "emergency_leaves": emergency_leave_count,
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

class LeaveViewSet(viewsets.ModelViewSet):
    queryset = Leave.objects.all()
    serializer_class = LeaveSerializer
    permission_classes = [IsTherapistOrAdmin]
    
    def get_queryset(self):
        queryset = Leave.objects.all()
        
        # Filter by therapist if user is a therapist
        if self.request.user.role == 'therapist':
            try:
                therapist = Therapist.objects.get(user=self.request.user)
                queryset = queryset.filter(therapist=therapist)
            except Therapist.DoesNotExist:
                return Leave.objects.none()
        
        # Filter by status if provided
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(start_date__gte=start_date)
            except (ValueError, TypeError):
                pass
        
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(end_date__lte=end_date)
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
        """Approve a leave application (admin only)"""
        if request.user.role != 'admin':
            return Response({"error": "Only admins can approve leave applications"}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        leave = self.get_object()
        leave.approve(request.user)
        return Response({'status': 'leave application approved'})
    
    @action(detail=True, methods=['put'])
    def reject(self, request, pk=None):
        """Reject a leave application (admin only)"""
        if request.user.role != 'admin':
            return Response({"error": "Only admins can reject leave applications"}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        reason = request.data.get('reason')
        if not reason:
            return Response({"error": "Rejection reason is required"}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        leave = self.get_object()
        leave.reject(request.user, reason)
        return Response({'status': 'leave application rejected'})
    
    @action(detail=True, methods=['put'])
    def cancel(self, request, pk=None):
        """Cancel a leave application (therapist only)"""
        leave = self.get_object()
        
        # Only the therapist who applied for leave can cancel it
        if self.request.user.role == 'therapist':
            try:
                therapist = Therapist.objects.get(user=self.request.user)
                if leave.therapist != therapist:
                    return Response({"error": "You can only cancel your own leave applications"}, 
                                   status=status.HTTP_403_FORBIDDEN)
            except Therapist.DoesNotExist:
                return Response({"error": "Therapist profile not found"}, 
                               status=status.HTTP_400_BAD_REQUEST)
        
        reason = request.data.get('reason')
        if not reason:
            return Response({"error": "Cancellation reason is required"}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        leave.cancel(reason)
        return Response({'status': 'leave application cancelled'})


class AttendanceChangeRequestViewSet(viewsets.ModelViewSet):
    queryset = AttendanceChangeRequest.objects.all()
    serializer_class = AttendanceChangeRequestSerializer
    permission_classes = [IsTherapistOrAdmin]
    
    def get_queryset(self):
        queryset = AttendanceChangeRequest.objects.all()
        
        # Filter by therapist if user is a therapist
        if self.request.user.role == 'therapist':
            try:
                therapist = Therapist.objects.get(user=self.request.user)
                queryset = queryset.filter(therapist=therapist)
            except Therapist.DoesNotExist:
                return AttendanceChangeRequest.objects.none()
        
        # Filter by status if provided
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
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
        """Approve an attendance change request (admin only)"""
        if request.user.role != 'admin':
            return Response({"error": "Only admins can approve attendance change requests"}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        change_request = self.get_object()
        change_request.approve(request.user)
        return Response({'status': 'attendance change request approved'})
    
    @action(detail=True, methods=['put'])
    def reject(self, request, pk=None):
        """Reject an attendance change request (admin only)"""
        if request.user.role != 'admin':
            return Response({"error": "Only admins can reject attendance change requests"}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        change_request = self.get_object()
        change_request.reject(request.user)
        return Response({'status': 'attendance change request rejected'})
