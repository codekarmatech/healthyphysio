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
from datetime import datetime, timedelta

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

        appointment.status = Appointment.Status.CANCELLED
        appointment.save()

        return Response(
            {"message": "Appointment cancelled successfully"},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'], url_path='available-slots')
    def available_slots(self, request):
        """
        Get available time slots for a therapist on a specific date

        Query parameters:
        - therapist: ID of the therapist
        - date: Date in YYYY-MM-DD format

        Returns a list of available time slots in HH:MM format
        """
        print("Available slots endpoint called")
        print(f"Request query params: {request.query_params}")

        therapist_id = request.query_params.get('therapist')
        date_str = request.query_params.get('date')

        print(f"Therapist ID: {therapist_id}, Date: {date_str}")

        if not therapist_id or not date_str:
            print("Missing required parameters")
            return Response(
                {"error": "Both therapist and date parameters are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Parse the date
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()

            # Get all appointments for this therapist on this date
            start_datetime = timezone.make_aware(datetime.combine(date_obj, datetime.min.time()))
            end_datetime = timezone.make_aware(datetime.combine(date_obj, datetime.max.time()))

            # Get booked appointments - using status values from Appointment.Status
            booked_appointments = Appointment.objects.filter(
                therapist_id=therapist_id,
                datetime__range=(start_datetime, end_datetime),
                status__in=[
                    Appointment.Status.PENDING,
                    Appointment.Status.SCHEDULED,
                    Appointment.Status.RESCHEDULED,
                    Appointment.Status.PENDING_RESCHEDULE
                ]
            )

            # Get booked time slots
            booked_slots = []
            for appointment in booked_appointments:
                # Get the start and end times of the appointment
                appt_start_time = appointment.datetime
                appt_end_time = appt_start_time + timedelta(minutes=appointment.duration_minutes)

                # Store the appointment time range to check for overlaps
                booked_slots.append({
                    'start_datetime': appt_start_time,
                    'end_datetime': appt_end_time
                })

            # Generate all possible time slots from 8:00 AM to 7:30 PM
            # This ensures no appointments extend beyond 8:30 PM (assuming 60-minute appointments)
            all_slots = []

            # Get the appointment duration (default to 60 minutes if not specified)
            appointment_duration = request.query_params.get('duration', 60)
            try:
                appointment_duration = int(appointment_duration)
            except ValueError:
                appointment_duration = 60

            # Add all slots from 8:00 AM to 7:30 PM in 30-minute increments
            for hour in range(8, 20):  # 8 AM to 7 PM
                # Add the :00 slot
                if hour < 20:  # Up to 8 PM
                    start_time = f"{hour:02d}:00"
                    # Calculate end time based on appointment duration
                    end_hour = hour + (appointment_duration // 60)
                    end_minute = appointment_duration % 60

                    # If end time would be after 8:30 PM, skip this slot
                    if end_hour > 20 or (end_hour == 20 and end_minute > 30):
                        continue

                    end_time = f"{end_hour:02d}:{end_minute:02d}"
                    all_slots.append({"start_time": start_time, "end_time": end_time})

                # Add the :30 slot
                if hour < 19 or (hour == 19 and appointment_duration <= 60):  # Before 7:30 PM
                    start_time = f"{hour:02d}:30"
                    # Calculate end time based on appointment duration
                    end_hour = hour + (appointment_duration // 60)
                    end_minute = 30 + (appointment_duration % 60)

                    # Adjust if minutes exceed 60
                    if end_minute >= 60:
                        end_hour += 1
                        end_minute -= 60

                    # If end time would be after 8:30 PM, skip this slot
                    if end_hour > 20 or (end_hour == 20 and end_minute > 30):
                        continue

                    end_time = f"{end_hour:02d}:{end_minute:02d}"
                    all_slots.append({"start_time": start_time, "end_time": end_time})

            # Filter out slots that overlap with booked appointments
            available_slots = []
            for slot in all_slots:
                # Convert slot times to datetime objects for comparison
                slot_start_time_str = slot["start_time"]
                slot_end_time_str = slot["end_time"]

                slot_start_hour, slot_start_minute = map(int, slot_start_time_str.split(':'))
                slot_end_hour, slot_end_minute = map(int, slot_end_time_str.split(':'))

                slot_start_datetime = timezone.make_aware(datetime.combine(
                    date_obj,
                    datetime.min.time().replace(hour=slot_start_hour, minute=slot_start_minute)
                ))

                slot_end_datetime = timezone.make_aware(datetime.combine(
                    date_obj,
                    datetime.min.time().replace(hour=slot_end_hour, minute=slot_end_minute)
                ))

                # Check if this slot overlaps with any booked appointment
                is_available = True
                for booked_slot in booked_slots:
                    # Check for overlap
                    if (slot_start_datetime < booked_slot['end_datetime'] and
                        slot_end_datetime > booked_slot['start_datetime']):
                        is_available = False
                        break

                if is_available:
                    available_slots.append(slot)

            print(f"Returning {len(available_slots)} available slots")
            print(f"Sample slot: {available_slots[0] if available_slots else 'No slots available'}")
            return Response(available_slots)

        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
        if self.action in ['create', 'destroy']:
            # Only admin can create or delete sessions
            permission_classes = [permissions.IsAuthenticated, IsAdminUser]
        elif self.action in ['update', 'partial_update']:
            # Admin and therapists can update sessions
            permission_classes = [permissions.IsAuthenticated, IsAdminUser | IsTherapistUser]
        else:
            # Everyone can view sessions
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
        patient_feedback = request.data.get('patient_feedback', '')

        success = session.complete_session(rating, patient_notes, patient_feedback)

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

    @action(detail=True, methods=['post'])
    def update_report(self, request, pk=None):
        """Update the therapist's report for this session"""
        session = self.get_object()

        # Extract report data from request
        report_fields = [
            'therapist_notes', 'treatment_provided', 'patient_progress',
            'pain_level_before', 'pain_level_after', 'mobility_assessment',
            'recommendations', 'next_session_goals'
        ]

        report_data = {}
        for field in report_fields:
            if field in request.data:
                report_data[field] = request.data.get(field)

        # Update the report
        success = session.update_report(report_data, request.user)

        if success:
            return Response({
                "message": "Report updated successfully",
                "report_status": session.report_status
            })
        else:
            return Response(
                {"error": "Cannot update report for this session"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def submit_report(self, request, pk=None):
        """Submit the therapist's report for this session"""
        session = self.get_object()

        # Submit the report
        success = session.submit_report(request.user)

        if success:
            # TODO: Send notification to admin

            return Response({
                "message": "Report submitted successfully",
                "report_status": session.report_status,
                "submitted_at": session.report_submitted_at
            })
        else:
            return Response(
                {"error": "Cannot submit report for this session. Ensure all required fields are filled."},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def review_report(self, request, pk=None):
        """Review or flag a submitted report (admin only)"""
        session = self.get_object()
        flag = request.data.get('flag', False)
        notes = request.data.get('notes', '')

        # Review the report
        success = session.review_report(request.user, flag, notes)

        if success:
            return Response({
                "message": f"Report {'flagged' if flag else 'reviewed'} successfully",
                "report_status": session.report_status,
                "reviewed_at": session.report_reviewed_at
            })
        else:
            return Response(
                {"error": "Cannot review report for this session"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def pending_reports(self, request):
        """Get sessions with pending reports for the current user"""
        user = request.user

        if user.is_therapist:
            try:
                therapist = user.therapist_profile
                sessions = Session.objects.filter(
                    appointment__therapist=therapist,
                    status=Session.Status.COMPLETED,
                    report_status=Session.ReportStatus.PENDING
                )
                serializer = self.get_serializer(sessions, many=True)
                return Response(serializer.data)
            except:
                return Response([])
        else:
            return Response(
                {"error": "Only therapists can access pending reports"},
                status=status.HTTP_403_FORBIDDEN
            )

    @action(detail=False, methods=['get'])
    def submitted_reports(self, request):
        """Get sessions with submitted reports for admin review"""
        user = request.user

        if user.is_admin:
            sessions = Session.objects.filter(
                report_status=Session.ReportStatus.SUBMITTED
            )
            serializer = self.get_serializer(sessions, many=True)
            return Response(serializer.data)
        else:
            return Response(
                {"error": "Only administrators can access submitted reports"},
                status=status.HTTP_403_FORBIDDEN
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
