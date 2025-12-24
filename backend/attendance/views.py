"""
Purpose: API views for attendance tracking
Connected to: Session attendance management
"""

from rest_framework import viewsets, permissions, serializers
from rest_framework import status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta
import calendar

# User permissions
from users.permissions import IsAdminUser, IsTherapistUser, IsPatientUser
# Scheduling models and serializers
from scheduling.models import Appointment, Session
from scheduling.serializers import SessionSerializer
# User models
from users.models import Therapist
# User utilities
from users.utils import get_therapist_from_user
#Import local app models and serializers
from .models import Attendance, Holiday, Leave, Availability, SessionTimeLog, INDIAN_TZ
from .admin_requests import AttendanceChangeRequest
from .serializers import (
    AttendanceSerializer, HolidaySerializer, AttendanceMonthSerializer,
    LeaveSerializer, AttendanceChangeRequestSerializer, AvailabilitySerializer,
    SessionTimeLogSerializer, SessionTimeLogListSerializer
)
from django.db.models import Count
from rest_framework.decorators import api_view
from rest_framework.response import Response



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


@api_view(['GET'])
def get_availability(request):
    """
    Get therapist availability for a date range
    """
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    therapist_id = request.query_params.get('therapist_id')

    if not start_date or not end_date or not therapist_id:
        return Response({'error': 'start_date, end_date, and therapist_id are required.'}, status=400)

    try:
        start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
    except Exception:
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)

    try:
        therapist = Therapist.objects.get(id=therapist_id)
    except Therapist.DoesNotExist:
        return Response({'error': 'Therapist not found.'}, status=404)

    availabilities = Availability.objects.filter(
        therapist=therapist,
        date__gte=start_date_obj,
        date__lte=end_date_obj
    ).order_by('date')

    serializer = AvailabilitySerializer(availabilities, many=True)
    return Response(serializer.data)

#

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
            therapist = get_therapist_from_user(self.request.user)
            if therapist:
                queryset = queryset.filter(therapist=therapist)
            else:
                # Log this issue for administrators
                print(f"WARNING: User {self.request.user.username} has therapist role but no therapist profile")
                return Attendance.objects.none()

        # Filter by specific therapist ID if provided
        therapist_id = self.request.query_params.get('therapist_id')
        if therapist_id:
            therapist = get_therapist_from_user(therapist_id)
            if therapist:
                queryset = queryset.filter(therapist=therapist)

        return queryset

    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get attendance history for a therapist"""
        # Log the request for debugging
        print(f"Attendance history request - User: {request.user.username}, Role: {request.user.role}")

        # Get query parameters
        therapist_id = request.query_params.get('therapist_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        status = request.query_params.get('status')

        # Check if the user is authorized to view this therapist's attendance
        if request.user.role == 'therapist':
            try:
                # If the user is a therapist, they can only view their own attendance
                therapist = Therapist.objects.get(user=request.user)
                print(f"User's therapist ID: {therapist.id}, Requested therapist ID: {therapist_id}")

                # For therapists, the user ID is the therapist ID
                # So we need to check if the requested therapist ID matches either:
                # 1. The therapist.id (from the Therapist model)
                # 2. The user.id (since in the frontend, user.id is used as therapist ID)
                if therapist_id and str(therapist.id) != str(therapist_id) and str(request.user.id) != str(therapist_id):
                    print(f"Access denied: User's therapist ID ({therapist.id}) or user ID ({request.user.id}) doesn't match requested ID ({therapist_id})")
                    return Response(
                        {"error": "You can only view your own attendance history"},
                        status=status.HTTP_403_FORBIDDEN
                    )

                # Use the therapist's ID for filtering
                therapist_id = therapist.id

            except Therapist.DoesNotExist:
                print(f"Therapist profile not found for user: {request.user.username}")
                return Response(
                    {"error": "Therapist profile not found"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Build the queryset
        queryset = self.get_queryset()

        # Apply filters
        if therapist_id:
            # Use the utility function to get the therapist from either user ID or therapist ID
            therapist = get_therapist_from_user(therapist_id)

            if therapist:
                queryset = queryset.filter(therapist=therapist)
            else:
                return Response(
                    {"error": f"Therapist with ID {therapist_id} not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__gte=start_date)
            except ValueError:
                pass

        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__lte=end_date)
            except ValueError:
                pass

        if status:
            queryset = queryset.filter(status=status)

        # Order by date (most recent first)
        queryset = queryset.order_by('-date')

        # Limit to 30 records by default
        limit = int(request.query_params.get('limit', 30))
        queryset = queryset[:limit]

        # Serialize the data
        serializer = self.get_serializer(queryset, many=True)

        # If no real data is found, return a few mock records as examples
        if not serializer.data:
            print("No attendance records found, returning mock data")
            mock_data = self._generate_mock_attendance_data(therapist_id)
            return Response(mock_data)

        return Response(serializer.data)

    def _generate_mock_attendance_data(self, therapist_id):
        """Generate mock attendance data for demonstration purposes"""
        mock_data = []
        today = datetime.now().date()

        # Generate 3 mock records
        statuses = ['present', 'absent', 'half_day']

        for i in range(3):
            date = today - timedelta(days=i)
            status = statuses[i % len(statuses)]

            # Create a timestamp for submitted_at
            submitted_at = datetime.now() - timedelta(days=i, hours=8)

            # Create a timestamp for approved_at (if approved)
            approved_at = submitted_at + timedelta(hours=1) if status != 'absent' else None

            mock_data.append({
                'id': f'mock-{i}',
                'therapist': therapist_id,
                'date': date.strftime('%Y-%m-%d'),
                'status': status,
                'submitted_at': submitted_at.isoformat(),
                'submitted_at_ist': submitted_at.isoformat(),
                'approved_by': 1 if status != 'absent' else None,
                'approved_at': approved_at.isoformat() if approved_at else None,
                'approved_at_ist': approved_at.isoformat() if approved_at else None,
                'notes': f'EXAMPLE DATA: This is how a {status} record will appear',
                'is_paid': True,
                'can_edit': False,
                'is_mock': True  # Flag to indicate this is mock data
            })

        return mock_data

    def perform_create(self, serializer):
        """Set the therapist to the current user's therapist profile and handle availability status"""
        therapist = get_therapist_from_user(self.request.user)
        if not therapist:
            # Get the user's username for better error reporting
            username = self.request.user.username
            raise serializers.ValidationError({
                "error": "Therapist profile not found",
                "detail": f"User '{username}' does not have an associated therapist profile. Please contact an administrator."
            })

        # Get the date from the serializer data
        date_str = serializer.validated_data.get('date')
        if not date_str:
            raise serializers.ValidationError({
                "error": "Date is required",
                "detail": "Please provide a valid date for the attendance record."
            })

        # Convert string date to date object if needed
        if isinstance(date_str, str):
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                raise serializers.ValidationError({
                    "error": "Invalid date format",
                    "detail": "Date must be in YYYY-MM-DD format."
                })
        else:
            date = date_str

        # Get the status from the serializer data
        status = serializer.validated_data.get('status', 'present')

        # Validate attendance status using the enhanced validation method
        validation_result = Attendance.validate_attendance_status(therapist, date, status)

        if not validation_result['valid']:
            error_data = {
                "error": validation_result['message'],
                "suggested_action": validation_result['suggested_action'],
                "appointment_count": Attendance.get_appointment_count(therapist, date),
                "has_appointments": Attendance.has_appointments(therapist, date)
            }

            # Add suggested status based on the situation
            if validation_result['suggested_action'] == 'mark_availability':
                error_data['suggested_status'] = 'available'
            elif validation_result['suggested_action'] == 'mark_attendance':
                error_data['suggested_status'] = 'present'

            raise serializers.ValidationError(error_data)

        # Check for existing attendance record
        existing_attendance = Attendance.objects.filter(
            therapist=therapist,
            date=date
        ).first()

        if existing_attendance:
            raise serializers.ValidationError({
                "error": f"Attendance already submitted for {date}",
                "detail": "You have already submitted attendance for this date. Use the change request feature to modify it.",
                "existing_status": existing_attendance.status
            })

        # Add validation warning to notes if applicable
        if validation_result.get('warning'):
            existing_notes = serializer.validated_data.get('notes', '')
            warning_note = f"Warning: {validation_result['message']}"
            if existing_notes:
                serializer.validated_data['notes'] = f"{existing_notes}\n\n{warning_note}"
            else:
                serializer.validated_data['notes'] = warning_note

        print(f"Creating attendance for therapist {therapist.id} on {date} with status '{status}'. Validation passed.")

        serializer.save(therapist=therapist)

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

        # Get the therapist profile using the utility function
        therapist = get_therapist_from_user(self.request.user)

        if not therapist:
            return Response(
                {"error": "Therapist profile not found"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if the therapist owns this attendance record
        if attendance.therapist != therapist:
            return Response(
                {"error": "You can only request changes for your own attendance records"},
                status=status.HTTP_403_FORBIDDEN
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
        available_count = status_count_dict.get('available', 0)

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

            # Check if therapist has appointments on this day
            has_appointments = Attendance.has_appointments(therapist, current_date)

            if is_holiday:
                days_data.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "status": "holiday",
                    "holiday_name": holiday_name,
                    "is_paid": True
                })
            elif attendance:
                # If status is 'available' but there are appointments, add a note
                notes = attendance.notes or ""
                if attendance.status == 'available' and has_appointments:
                    notes += " (Note: You have appointments scheduled on this day)"

                days_data.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "status": attendance.status,
                    "submitted_at": attendance.submitted_at.astimezone(INDIAN_TZ).strftime("%Y-%m-%dT%H:%M:%S%z") if attendance.submitted_at else None,
                    "approved_at": attendance.approved_at.astimezone(INDIAN_TZ).strftime("%Y-%m-%dT%H:%M:%S%z") if attendance.approved_at else None,
                    "is_approved": attendance.approved_by is not None,
                    "is_paid": attendance.is_paid,
                    "notes": notes,
                    "has_appointments": has_appointments
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
                            "is_paid": False,
                            "has_appointments": has_appointments
                        })
                    else:
                        # If no appointments, mark as "free_day" instead of "absent"
                        if not has_appointments:
                            days_data.append({
                                "date": current_date.strftime("%Y-%m-%d"),
                                "status": "free_day",
                                "display_status": "Free Day (available for assignment)",
                                "is_approved": False,
                                "is_paid": False,
                                "has_appointments": False
                            })
                        else:
                            # Regular absent day (with appointments)
                            days_data.append({
                                "date": current_date.strftime("%Y-%m-%d"),
                                "status": "absent",
                                "is_approved": False,
                                "is_paid": False,
                                "has_appointments": True
                            })
                else:
                    # Future dates
                    days_data.append({
                        "date": current_date.strftime("%Y-%m-%d"),
                        "status": "upcoming",
                        "is_approved": False,
                        "is_paid": False,
                        "has_appointments": has_appointments
                    })

        # Prepare response data
        response_data = {
            "present": present_count,
            "absent": len(absent_dates),
            "half_day": half_day_count,
            "approved_leaves": approved_leave_count,
            "sick_leaves": sick_leave_count,
            "emergency_leaves": emergency_leave_count,
            "available": available_count,
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

    @action(detail=False, methods=['get'])
    def therapist_leaves(self, request, therapist_id=None):
        """Get leave applications for a specific therapist"""
        # Log the request for debugging
        print(f"Therapist leaves request - User: {self.request.user.username}, Role: {self.request.user.role}, Requested therapist ID: {therapist_id}")

        # Check if the user is authorized to view this therapist's leaves
        if self.request.user.role == 'therapist':
            try:
                # If the user is a therapist, they can only view their own leaves
                therapist = Therapist.objects.get(user=self.request.user)
                print(f"User's therapist ID: {therapist.id}, Requested therapist ID: {therapist_id}")

                # For therapists, the user ID is the therapist ID
                # So we need to check if the requested therapist ID matches either:
                # 1. The therapist.id (from the Therapist model)
                # 2. The user.id (since in the frontend, user.id is used as therapist ID)
                if str(therapist.id) != str(therapist_id) and str(self.request.user.id) != str(therapist_id):
                    print(f"Access denied: User's therapist ID ({therapist.id}) or user ID ({self.request.user.id}) doesn't match requested ID ({therapist_id})")
                    return Response(
                        {"error": "You can only view your own leave applications"},
                        status=status.HTTP_403_FORBIDDEN
                    )
                else:
                    print(f"Access granted: User ID or therapist ID matches requested ID")
            except Therapist.DoesNotExist:
                print(f"Therapist profile not found for user: {self.request.user.username}")
                # Even if the therapist profile doesn't exist, if the user.id matches the requested ID, allow access
                if str(self.request.user.id) == str(therapist_id):
                    print(f"Access granted: User ID matches requested ID even though therapist profile not found")
                    pass
                else:
                    return Response(
                        {"error": "Therapist profile not found"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

        # Get the therapist
        try:
            # First try to find the therapist by ID
            therapist = Therapist.objects.get(id=therapist_id)
            print(f"Found therapist by ID: {therapist.user.username} (ID: {therapist.id})")
        except Therapist.DoesNotExist:
            # If not found, try to find by user ID
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                user = User.objects.get(id=therapist_id)
                if user.role == 'therapist':
                    try:
                        therapist = Therapist.objects.get(user=user)
                        print(f"Found therapist by user ID: {therapist.user.username} (ID: {therapist.id})")
                    except Therapist.DoesNotExist:
                        print(f"User with ID {therapist_id} is a therapist but has no therapist profile")
                        return Response(
                            {"error": f"User with ID {therapist_id} is a therapist but has no therapist profile"},
                            status=status.HTTP_404_NOT_FOUND
                        )
                else:
                    print(f"User with ID {therapist_id} is not a therapist")
                    return Response(
                        {"error": f"User with ID {therapist_id} is not a therapist"},
                        status=status.HTTP_404_NOT_FOUND
                    )
            except User.DoesNotExist:
                print(f"Neither therapist nor user with ID {therapist_id} found in database")
                return Response(
                    {"error": f"Therapist with ID {therapist_id} not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Get leave applications for this therapist
        leaves = Leave.objects.filter(therapist=therapist)
        print(f"Found {leaves.count()} leave applications for therapist ID {therapist_id}")

        # Apply additional filters if provided
        status_param = request.query_params.get('status')
        if status_param:
            print(f"Filtering by status: {status_param}")
            leaves = leaves.filter(status=status_param)

        # Filter by date range if provided
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                print(f"Filtering by start date: {start_date}")
                leaves = leaves.filter(start_date__gte=start_date)
            except (ValueError, TypeError) as e:
                print(f"Invalid start date format: {start_date}, error: {str(e)}")
                pass

        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                print(f"Filtering by end date: {end_date}")
                leaves = leaves.filter(end_date__lte=end_date)
            except (ValueError, TypeError) as e:
                print(f"Invalid end date format: {end_date}, error: {str(e)}")
                pass

        # Order by most recent first
        leaves = leaves.order_by('-submitted_at')

        # Serialize the data
        serializer = self.get_serializer(leaves, many=True)
        print(f"Returning {len(serializer.data)} leave applications")
        return Response(serializer.data)


class AvailabilityViewSet(viewsets.ModelViewSet):
    """
    API endpoint for therapist availability
    Allows therapists to mark themselves as available for days with no appointments
    """
    queryset = Availability.objects.all()
    serializer_class = AvailabilitySerializer
    permission_classes = [IsTherapistOrAdmin]

    def get_queryset(self):
        queryset = Availability.objects.all()

        # Filter by therapist if user is a therapist
        if self.request.user.role == 'therapist':
            therapist = get_therapist_from_user(self.request.user)
            if therapist:
                queryset = queryset.filter(therapist=therapist)
            else:
                # Log this issue for administrators
                print(f"WARNING: User {self.request.user.username} has therapist role but no therapist profile")
                return Availability.objects.none()

        # Filter by specific therapist ID if provided
        therapist_id = self.request.query_params.get('therapist_id')
        if therapist_id:
            therapist = get_therapist_from_user(therapist_id)
            if therapist:
                queryset = queryset.filter(therapist=therapist)

        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__gte=start_date)
            except ValueError:
                pass

        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__lte=end_date)
            except ValueError:
                pass

        return queryset

    def perform_create(self, serializer):
        """Set the therapist to the current user's therapist profile"""
        therapist = get_therapist_from_user(self.request.user)
        if therapist:
            serializer.save(therapist=therapist)
        else:
            # Get the user's username for better error reporting
            username = self.request.user.username
            raise serializers.ValidationError({
                "error": "Therapist profile not found",
                "detail": f"User '{username}' does not have an associated therapist profile. Please contact an administrator."
            })

    @action(detail=False, methods=['get'])
    def monthly_summary(self, request):
        """Get monthly availability summary for a therapist"""
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
            # Check for therapist_id parameter
            therapist_id = request.query_params.get('therapist_id')
            if not therapist_id:
                return Response({
                    "error": "Therapist ID is required for non-therapist users",
                    "detail": "Please provide a valid therapist_id parameter."
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                therapist = Therapist.objects.get(id=therapist_id)
            except Therapist.DoesNotExist:
                return Response({
                    "error": f"Therapist with ID {therapist_id} does not exist",
                    "detail": "Please provide a valid therapist ID."
                }, status=status.HTTP_404_NOT_FOUND)

        # Get all availability records for the month
        availabilities = Availability.objects.filter(
            therapist=therapist,
            date__gte=start_date,
            date__lte=end_date
        )

        # Get holidays for the month
        holidays = Holiday.objects.filter(date__gte=start_date, date__lte=end_date)
        holiday_dates = [holiday.date for holiday in holidays]

        # Count availabilities
        availability_count = availabilities.count()

        # Prepare days data
        days_data = []

        for day in range(1, last_day + 1):
            current_date = datetime(year, month, day).date()

            # Check if it's a holiday
            is_holiday = current_date in holiday_dates
            holiday_name = next((h.name for h in holidays if h.date == current_date), None)

            # Check if it's a Sunday
            is_sunday = current_date.weekday() == 6

            # Find availability for this day
            availability = availabilities.filter(date=current_date).first()

            # Check if therapist has appointments on this day
            has_appointments = Attendance.has_appointments(therapist, current_date)

            if is_holiday:
                days_data.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "status": "holiday",
                    "holiday_name": holiday_name,
                    "is_paid": False
                })
            elif availability:
                days_data.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "status": "available",
                    "submitted_at": availability.submitted_at.astimezone(INDIAN_TZ).strftime("%Y-%m-%dT%H:%M:%S%z"),
                    "is_paid": False,
                    "notes": availability.notes,
                    "has_appointments": has_appointments
                })
            else:
                # For past dates with no availability
                if current_date <= today_in_india:
                    # If it's a Sunday, mark as weekend
                    if is_sunday:
                        days_data.append({
                            "date": current_date.strftime("%Y-%m-%d"),
                            "status": "weekend",
                            "is_paid": False,
                            "has_appointments": has_appointments
                        })
                    else:
                        # Regular day with no availability
                        days_data.append({
                            "date": current_date.strftime("%Y-%m-%d"),
                            "status": "no_availability",
                            "is_paid": False,
                            "has_appointments": has_appointments
                        })
                else:
                    # Future dates
                    days_data.append({
                        "date": current_date.strftime("%Y-%m-%d"),
                        "status": "upcoming",
                        "is_paid": False,
                        "has_appointments": has_appointments
                    })

        # Prepare response data
        response_data = {
            "available_days": availability_count,
            "holidays": len(holiday_dates),
            "days": days_data
        }

        return Response(response_data)


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

        # Get the attendance record before changes
        attendance_before = change_request.attendance
        old_status = attendance_before.status

        # Approve the change request (this updates the attendance record)
        change_request.approve(request.user)

        # Get the updated attendance record
        attendance_after = change_request.attendance
        new_status = attendance_after.status

        # Return detailed information about the change
        return Response({
            'status': 'attendance change request approved',
            'message': f'Attendance status changed from {old_status} to {new_status}',
            'attendance': {
                'id': attendance_after.id,
                'date': attendance_after.date,
                'status': attendance_after.status,
                'approved_by': request.user.username,
                'approved_at': timezone.now().isoformat()
            },
            'change_request': {
                'id': change_request.id,
                'status': change_request.status,
                'resolved_at': change_request.resolved_at.isoformat() if change_request.resolved_at else None
            }
        })

    @action(detail=True, methods=['put'])
    def reject(self, request, pk=None):
        """Reject an attendance change request (admin only)"""
        if request.user.role != 'admin':
            return Response({"error": "Only admins can reject attendance change requests"},
                           status=status.HTTP_403_FORBIDDEN)

        change_request = self.get_object()
        change_request.reject(request.user)
        return Response({'status': 'attendance change request rejected'})


class SessionTimeLogViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing session time logs.
    Tracks therapist arrival/departure and patient confirmations.
    """
    queryset = SessionTimeLog.objects.all()
    serializer_class = SessionTimeLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return SessionTimeLogListSerializer
        return SessionTimeLogSerializer

    def get_queryset(self):
        """Filter queryset based on user role"""
        user = self.request.user
        queryset = SessionTimeLog.objects.all()

        if user.role == 'admin':
            # Admin can see all session time logs
            pass
        elif user.role == 'therapist':
            # Therapist can only see their own session time logs
            try:
                therapist = Therapist.objects.get(user=user)
                queryset = queryset.filter(therapist=therapist)
            except Therapist.DoesNotExist:
                return SessionTimeLog.objects.none()
        elif user.role == 'patient':
            # Patient can only see their own session time logs
            try:
                from users.models import Patient
                patient = Patient.objects.get(user=user)
                queryset = queryset.filter(patient=patient)
            except:
                return SessionTimeLog.objects.none()
        else:
            return SessionTimeLog.objects.none()

        # Apply filters
        date_param = self.request.query_params.get('date')
        if date_param:
            queryset = queryset.filter(date=date_param)

        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(date__gte=date_from)

        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(date__lte=date_to)

        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        has_discrepancy = self.request.query_params.get('has_discrepancy')
        if has_discrepancy:
            queryset = queryset.filter(has_discrepancy=has_discrepancy.lower() == 'true')

        therapist_id = self.request.query_params.get('therapist_id')
        if therapist_id and user.role == 'admin':
            queryset = queryset.filter(therapist_id=therapist_id)

        patient_id = self.request.query_params.get('patient_id')
        if patient_id and user.role in ['admin', 'therapist']:
            queryset = queryset.filter(patient_id=patient_id)

        return queryset.order_by('-date', '-created_at')

    @action(detail=True, methods=['post'], url_path='therapist-reached')
    def therapist_reached(self, request, pk=None):
        """Therapist marks arrival at patient's house"""
        session_log = self.get_object()

        # Verify the user is the therapist for this session
        if request.user.role != 'therapist':
            return Response(
                {"error": "Only therapists can mark arrival"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            therapist = Therapist.objects.get(user=request.user)
            if session_log.therapist != therapist:
                return Response(
                    {"error": "You are not assigned to this session"},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Therapist.DoesNotExist:
            return Response(
                {"error": "Therapist profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if session_log.therapist_reached_time:
            return Response(
                {"error": "Arrival already recorded"},
                status=status.HTTP_400_BAD_REQUEST
            )

        session_log.therapist_reached()
        serializer = self.get_serializer(session_log)
        return Response({
            "message": "Arrival recorded successfully",
            "data": serializer.data
        })

    @action(detail=True, methods=['post'], url_path='therapist-leaving')
    def therapist_leaving(self, request, pk=None):
        """Therapist marks departure from patient's house"""
        session_log = self.get_object()

        # Verify the user is the therapist for this session
        if request.user.role != 'therapist':
            return Response(
                {"error": "Only therapists can mark departure"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            therapist = Therapist.objects.get(user=request.user)
            if session_log.therapist != therapist:
                return Response(
                    {"error": "You are not assigned to this session"},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Therapist.DoesNotExist:
            return Response(
                {"error": "Therapist profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        success = session_log.therapist_leaving()
        if not success:
            return Response(
                {"error": "Must record arrival before departure"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(session_log)
        return Response({
            "message": "Departure recorded successfully",
            "duration_minutes": session_log.therapist_duration_minutes,
            "data": serializer.data
        })

    @action(detail=True, methods=['post'], url_path='patient-confirm-arrival')
    def patient_confirm_arrival(self, request, pk=None):
        """Patient confirms therapist has arrived"""
        session_log = self.get_object()

        # Verify the user is the patient for this session
        if request.user.role != 'patient':
            return Response(
                {"error": "Only patients can confirm arrival"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            from users.models import Patient
            patient = Patient.objects.get(user=request.user)
            if session_log.patient != patient:
                return Response(
                    {"error": "This is not your session"},
                    status=status.HTTP_403_FORBIDDEN
                )
        except:
            return Response(
                {"error": "Patient profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if session_log.patient_confirmed_arrival:
            return Response(
                {"error": "Arrival already confirmed"},
                status=status.HTTP_400_BAD_REQUEST
            )

        session_log.patient_confirm_arrival()
        serializer = self.get_serializer(session_log)
        return Response({
            "message": "Therapist arrival confirmed",
            "data": serializer.data
        })

    @action(detail=True, methods=['post'], url_path='patient-confirm-departure')
    def patient_confirm_departure(self, request, pk=None):
        """Patient confirms therapist has left"""
        session_log = self.get_object()

        # Verify the user is the patient for this session
        if request.user.role != 'patient':
            return Response(
                {"error": "Only patients can confirm departure"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            from users.models import Patient
            patient = Patient.objects.get(user=request.user)
            if session_log.patient != patient:
                return Response(
                    {"error": "This is not your session"},
                    status=status.HTTP_403_FORBIDDEN
                )
        except:
            return Response(
                {"error": "Patient profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        success = session_log.patient_confirm_departure()
        if not success:
            return Response(
                {"error": "Must confirm arrival before departure"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(session_log)
        return Response({
            "message": "Therapist departure confirmed",
            "duration_minutes": session_log.patient_confirmed_duration_minutes,
            "has_discrepancy": session_log.has_discrepancy,
            "data": serializer.data
        })

    @action(detail=True, methods=['post'], url_path='resolve-discrepancy')
    def resolve_discrepancy(self, request, pk=None):
        """Admin resolves a discrepancy between therapist and patient times"""
        if request.user.role != 'admin':
            return Response(
                {"error": "Only admins can resolve discrepancies"},
                status=status.HTTP_403_FORBIDDEN
            )

        session_log = self.get_object()

        if not session_log.has_discrepancy:
            return Response(
                {"error": "No discrepancy to resolve"},
                status=status.HTTP_400_BAD_REQUEST
            )

        notes = request.data.get('notes', '')
        session_log.resolve_discrepancy(request.user, notes)

        serializer = self.get_serializer(session_log)
        return Response({
            "message": "Discrepancy resolved",
            "data": serializer.data
        })

    @action(detail=False, methods=['get'], url_path='discrepancies')
    def discrepancies(self, request):
        """Get all sessions with discrepancies (admin only)"""
        if request.user.role != 'admin':
            return Response(
                {"error": "Only admins can view discrepancies"},
                status=status.HTTP_403_FORBIDDEN
            )

        queryset = SessionTimeLog.objects.filter(
            has_discrepancy=True,
            discrepancy_resolved=False
        ).order_by('-date')

        serializer = SessionTimeLogListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='today')
    def today_sessions(self, request):
        """Get today's session time logs for the current user"""
        today = timezone.now().astimezone(INDIAN_TZ).date()
        queryset = self.get_queryset().filter(date=today)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='by-appointment/(?P<appointment_id>[^/.]+)')
    def by_appointment(self, request, appointment_id=None):
        """Get session time log for a specific appointment"""
        try:
            session_log = SessionTimeLog.objects.get(appointment_id=appointment_id)

            # Check permissions
            user = request.user
            if user.role == 'therapist':
                therapist = Therapist.objects.get(user=user)
                if session_log.therapist != therapist:
                    return Response(
                        {"error": "You are not assigned to this session"},
                        status=status.HTTP_403_FORBIDDEN
                    )
            elif user.role == 'patient':
                from users.models import Patient
                patient = Patient.objects.get(user=user)
                if session_log.patient != patient:
                    return Response(
                        {"error": "This is not your session"},
                        status=status.HTTP_403_FORBIDDEN
                    )

            serializer = self.get_serializer(session_log)
            return Response(serializer.data)
        except SessionTimeLog.DoesNotExist:
            return Response(
                {"error": "Session time log not found for this appointment"},
                status=status.HTTP_404_NOT_FOUND
            )
