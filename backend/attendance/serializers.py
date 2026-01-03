"""
Purpose: Serializers for attendance tracking
Connected to: Session management and assessments
"""

from rest_framework import serializers
from .models import Attendance, Holiday, Leave, Availability, SessionTimeLog, PatientConcern, INDIAN_TZ
from .admin_requests import AttendanceChangeRequest
from django.utils import timezone
import datetime

class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = ['id', 'name', 'date', 'description']

class AttendanceSerializer(serializers.ModelSerializer):
    submitted_at_ist = serializers.SerializerMethodField()
    approved_at_ist = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    confirm_absent = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = Attendance
        fields = ['id', 'therapist', 'date', 'status', 'submitted_at',
                 'submitted_at_ist', 'approved_by', 'approved_at', 'approved_at_ist',
                 'notes', 'is_paid', 'can_edit', 'confirm_absent']
        read_only_fields = ['therapist', 'submitted_at', 'approved_by', 'approved_at', 'is_paid']

    def get_submitted_at_ist(self, obj):
        if obj.submitted_at:
            # Convert to IST (UTC+5:30)
            ist_time = timezone.localtime(obj.submitted_at, timezone=INDIAN_TZ)
            return ist_time.strftime("%Y-%m-%dT%H:%M:%S%z")
        return None

    def get_approved_at_ist(self, obj):
        if obj.approved_at:
            # Convert to IST (UTC+5:30)
            ist_time = timezone.localtime(obj.approved_at, timezone=INDIAN_TZ)
            return ist_time.strftime("%Y-%m-%dT%H:%M:%S%z")
        return None

    def get_can_edit(self, obj):
        """
        Determine if the attendance record can be edited by the therapist.
        Present status cannot be edited by therapists once submitted.
        """
        # If status is 'present', therapist cannot edit
        if obj.status == 'present':
            return False
        return True

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.submitted_at:
            representation['submitted_at'] = timezone.localtime(instance.submitted_at).strftime('%Y-%m-%dT%H:%M:%S%z')
        if instance.approved_at:
            representation['approved_at'] = timezone.localtime(instance.approved_at).strftime('%Y-%m-%dT%H:%M:%S%z')
        # Ensure notes and is_paid are included
        representation['notes'] = instance.notes
        representation['is_paid'] = instance.is_paid
        return representation

    def validate(self, data):
        # Get current date in Indian timezone
        now_in_india = timezone.now().astimezone(INDIAN_TZ)
        today_in_india = now_in_india.date()

        date = data.get('date', today_in_india)
        status = data.get('status')
        confirm_absent = data.get('confirm_absent', False)

        # Check if trying to mark present for a past date
        if status == 'present' and date < today_in_india:
            raise serializers.ValidationError("Cannot mark present for past dates.")

        # Allow marking absent for past dates (within reasonable limits, e.g., 7 days)
        if date < today_in_india - datetime.timedelta(days=7):
            raise serializers.ValidationError("Attendance can only be submitted for the current date or up to 7 days in the past.")

        # Don't allow future dates (except for leave applications)
        if date > today_in_india and status not in ['approved_leave']:
            raise serializers.ValidationError("Cannot submit attendance for future dates.")

        # Check if it's a Sunday (weekday 6 in Python)
        is_sunday = date.weekday() == 6

        # No special validation for Sundays - therapists can mark themselves present on Sundays too

        # Require confirmation for marking absent only if explicitly set to absent
        # This prevents issues when the status is not provided or is something else
        # Only require confirmation for new records, not updates
        if status == 'absent' and not confirm_absent and 'status' in data and not self.instance:
            raise serializers.ValidationError({
                "confirm_absent": "Please confirm that you want to be marked as absent from earning."
            })

        # Check if trying to update an existing record
        if self.instance:
            # If current status is 'present', therapist cannot change it
            if self.instance.status == 'present':
                raise serializers.ValidationError(
                    "You cannot edit attendance once marked as present. Please submit an admin request for changes."
                )

        # Always check for duplicates when creating new records
        if self.instance is None:
            request = self.context.get('request')
            if request and hasattr(request, 'user'):
                from users.models import Therapist
                try:
                    therapist = Therapist.objects.get(user=request.user)
                    # Add explicit date filtering
                    existing_attendance = Attendance.objects.filter(therapist=therapist, date=date).first()
                    if existing_attendance:
                        # If attendance already exists, provide a more helpful error message
                        if existing_attendance.status == 'present':
                            raise serializers.ValidationError({
                                "error": "Attendance already marked as present for this date. Use 'Request Change' button to submit a change request.",
                                "attendance_id": existing_attendance.id,
                                "status": existing_attendance.status,
                                "can_request_change": True,
                                "message": "You cannot edit attendance once marked as present. Please use the 'Request Change' button to submit a change request."
                            })
                        else:
                            raise serializers.ValidationError({
                                "error": f"Attendance already submitted as '{existing_attendance.status}' for this date. You can edit it.",
                                "attendance_id": existing_attendance.id,
                                "status": existing_attendance.status,
                                "can_edit": True,
                                "message": f"You have already submitted attendance as '{existing_attendance.status}' for this date. You can edit it."
                            })
                except Therapist.DoesNotExist:
                    pass

        return data

    def create(self, validated_data):
        # Remove confirm_absent from validated_data as it's not a model field
        validated_data.pop('confirm_absent', None)

        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            from users.models import Therapist
            try:
                therapist = Therapist.objects.get(user=request.user)
                validated_data['therapist'] = therapist
            except Therapist.DoesNotExist:
                raise serializers.ValidationError("Therapist profile not found for this user.")

        # Set date to today if not provided
        if 'date' not in validated_data:
            validated_data['date'] = timezone.now().date()

        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Remove confirm_absent from validated_data as it's not a model field
        validated_data.pop('confirm_absent', None)

        # If current status is 'present', therapist cannot change it
        if instance.status == 'present':
            # Get the requested status if provided
            requested_status = validated_data.get('status')

            # If a status change was requested, create a change request
            if requested_status and requested_status != instance.status:
                request = self.context.get('request')
                if request and hasattr(request, 'user'):
                    from users.models import Therapist
                    try:
                        therapist = Therapist.objects.get(user=request.user)

                        # Create a change request
                        from .admin_requests import AttendanceChangeRequest
                        change_request = AttendanceChangeRequest.objects.create(
                            therapist=therapist,
                            attendance=instance,
                            request_type='change_status',
                            current_status=instance.status,
                            requested_status=requested_status,
                            reason=validated_data.get('notes', 'Status change requested by therapist')
                        )

                        # Return a custom error with the change request ID
                        raise serializers.ValidationError({
                            "error": "You cannot edit attendance once marked as present. An admin request has been created.",
                            "change_request_id": change_request.id,
                            "can_request_change": True,
                            "message": "You cannot edit attendance once marked as present. Please use the 'Request Change' button to submit a change request."
                        })
                    except Therapist.DoesNotExist:
                        pass

            # If no status change was requested or user is not a therapist, just show the error
            raise serializers.ValidationError({
                "error": "You cannot edit attendance once marked as present. Please use the 'Request Change' button.",
                "attendance_id": instance.id,
                "status": instance.status,
                "can_request_change": True,
                "message": "You cannot edit attendance once marked as present. Please use the 'Request Change' button to submit a change request."
            })

        return super().update(instance, validated_data)

class AvailabilitySerializer(serializers.ModelSerializer):
    submitted_at_ist = serializers.SerializerMethodField()

    class Meta:
        model = Availability
        fields = ['id', 'therapist', 'date', 'submitted_at', 'submitted_at_ist', 'notes']
        read_only_fields = ['therapist', 'submitted_at']

    def get_submitted_at_ist(self, obj):
        if obj.submitted_at:
            # Convert to IST (UTC+5:30)
            ist_time = timezone.localtime(obj.submitted_at, timezone=INDIAN_TZ)
            return ist_time.strftime("%Y-%m-%dT%H:%M:%S%z")
        return None

    def validate(self, data):
        # Get current date in Indian timezone
        now_in_india = timezone.now().astimezone(INDIAN_TZ)
        today_in_india = now_in_india.date()

        date = data.get('date', today_in_india)

        # Don't allow dates more than 30 days in the future
        if date > today_in_india + datetime.timedelta(days=30):
            raise serializers.ValidationError("Cannot submit availability for dates more than 30 days in the future.")

        # Check if therapist has appointments on this date
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            from users.models import Therapist
            try:
                therapist = Therapist.objects.get(user=request.user)

                # Check if therapist has appointments on this date
                from .models import Attendance
                has_appointments = Attendance.has_appointments(therapist, date)

                if has_appointments:
                    raise serializers.ValidationError({
                        "error": "You have appointments scheduled on this date. Please mark attendance instead of availability.",
                        "message": "You have appointments scheduled on this date. Please mark attendance instead of availability."
                    })

                # Check if attendance already exists for this date
                existing_attendance = Attendance.objects.filter(therapist=therapist, date=date).exists()
                if existing_attendance:
                    raise serializers.ValidationError({
                        "error": "You have already marked attendance for this date.",
                        "message": "You have already marked attendance for this date."
                    })

                # Check if availability already exists for this date
                if self.instance is None:  # Only check when creating new record
                    existing_availability = Availability.objects.filter(therapist=therapist, date=date).exists()
                    if existing_availability:
                        raise serializers.ValidationError({
                            "error": "You have already marked availability for this date.",
                            "message": "You have already marked availability for this date."
                        })

            except Therapist.DoesNotExist:
                pass

        return data

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            from users.models import Therapist
            try:
                therapist = Therapist.objects.get(user=request.user)
                validated_data['therapist'] = therapist
            except Therapist.DoesNotExist:
                raise serializers.ValidationError("Therapist profile not found for this user.")

        # Set date to today if not provided
        if 'date' not in validated_data:
            validated_data['date'] = timezone.now().date()

        return super().create(validated_data)


class AttendanceMonthSerializer(serializers.Serializer):
    present = serializers.IntegerField()
    absent = serializers.IntegerField()
    half_day = serializers.IntegerField()
    approved_leaves = serializers.IntegerField()
    holidays = serializers.IntegerField()
    days = serializers.ListField()

class LeaveSerializer(serializers.ModelSerializer):
    submitted_at_ist = serializers.SerializerMethodField()
    approved_at_ist = serializers.SerializerMethodField()
    duration = serializers.SerializerMethodField()

    class Meta:
        model = Leave
        fields = ['id', 'therapist', 'start_date', 'end_date', 'leave_type',
                 'reason', 'status', 'submitted_at', 'submitted_at_ist',
                 'approved_by', 'approved_at', 'approved_at_ist', 'rejection_reason',
                 'cancellation_reason', 'duration']
        read_only_fields = ['therapist', 'submitted_at', 'approved_by', 'approved_at',
                           'status', 'rejection_reason', 'cancellation_reason']

    def get_submitted_at_ist(self, obj):
        if obj.submitted_at:
            # Convert to IST (UTC+5:30)
            ist_time = timezone.localtime(obj.submitted_at, timezone=INDIAN_TZ)
            return ist_time.strftime("%Y-%m-%dT%H:%M:%S%z")
        return None

    def get_approved_at_ist(self, obj):
        if obj.approved_at:
            # Convert to IST (UTC+5:30)
            ist_time = timezone.localtime(obj.approved_at, timezone=INDIAN_TZ)
            return ist_time.strftime("%Y-%m-%dT%H:%M:%S%z")
        return None

    def get_duration(self, obj):
        """Calculate the duration of leave in days"""
        if obj.start_date and obj.end_date:
            # Add 1 to include both start and end dates
            return (obj.end_date - obj.start_date).days + 1
        return 0

    def validate(self, data):
        # Get current date in Indian timezone
        now_in_india = timezone.now().astimezone(INDIAN_TZ)
        today_in_india = now_in_india.date()

        start_date = data.get('start_date')
        end_date = data.get('end_date')
        leave_type = data.get('leave_type')

        # End date should be after or equal to start date
        if end_date < start_date:
            raise serializers.ValidationError("End date cannot be before start date")

        # Regular leave must be applied at least 2 days in advance
        if leave_type == 'regular' and start_date < today_in_india + datetime.timedelta(days=2):
            raise serializers.ValidationError("Regular leave must be applied at least 2 days in advance")

        return data

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            from users.models import Therapist
            try:
                therapist = Therapist.objects.get(user=request.user)
                validated_data['therapist'] = therapist
            except Therapist.DoesNotExist:
                raise serializers.ValidationError("Therapist profile not found for this user.")

        return super().create(validated_data)


class AttendanceChangeRequestSerializer(serializers.ModelSerializer):
    therapist_name = serializers.SerializerMethodField()
    attendance_date = serializers.SerializerMethodField()
    created_at_ist = serializers.SerializerMethodField()
    resolved_at_ist = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceChangeRequest
        fields = ['id', 'therapist', 'therapist_name', 'attendance', 'attendance_date',
                 'request_type', 'current_status', 'requested_status', 'reason',
                 'status', 'created_at', 'created_at_ist', 'resolved_at',
                 'resolved_at_ist', 'resolved_by']
        read_only_fields = ['therapist', 'status', 'created_at', 'resolved_at', 'resolved_by']

    def get_therapist_name(self, obj):
        return f"{obj.therapist.user.first_name} {obj.therapist.user.last_name}"

    def get_attendance_date(self, obj):
        return obj.attendance.date.strftime("%Y-%m-%d")

    def get_created_at_ist(self, obj):
        if obj.created_at:
            ist_time = timezone.localtime(obj.created_at, timezone=INDIAN_TZ)
            return ist_time.strftime("%Y-%m-%dT%H:%M:%S%z")
        return None

    def get_resolved_at_ist(self, obj):
        if obj.resolved_at:
            ist_time = timezone.localtime(obj.resolved_at, timezone=INDIAN_TZ)
            return ist_time.strftime("%Y-%m-%dT%H:%M:%S%z")
        return None

    def validate(self, data):
        request_type = data.get('request_type')
        requested_status = data.get('requested_status')

        if request_type == 'change_status' and not requested_status:
            raise serializers.ValidationError("Requested status is required for status change requests")

        return data

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            from users.models import Therapist
            try:
                therapist = Therapist.objects.get(user=request.user)
                validated_data['therapist'] = therapist

                # Set the current status from the attendance record
                attendance = validated_data.get('attendance')
                validated_data['current_status'] = attendance.status

            except Therapist.DoesNotExist:
                raise serializers.ValidationError("Therapist profile not found for this user.")

        return super().create(validated_data)


class SessionTimeLogSerializer(serializers.ModelSerializer):
    """Serializer for SessionTimeLog model"""
    therapist_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    appointment_session_code = serializers.SerializerMethodField()
    therapist_reached_time_ist = serializers.SerializerMethodField()
    therapist_leaving_time_ist = serializers.SerializerMethodField()
    patient_confirmed_arrival_ist = serializers.SerializerMethodField()
    patient_confirmed_departure_ist = serializers.SerializerMethodField()
    therapist_duration_display = serializers.ReadOnlyField()
    patient_duration_display = serializers.ReadOnlyField()
    is_complete = serializers.ReadOnlyField()

    class Meta:
        model = SessionTimeLog
        fields = [
            'id', 'appointment', 'therapist', 'patient', 'date', 'status',
            'therapist_name', 'patient_name', 'appointment_session_code',
            # Therapist timestamps
            'therapist_reached_time', 'therapist_reached_time_ist',
            'therapist_leaving_time', 'therapist_leaving_time_ist',
            'therapist_duration_minutes', 'therapist_duration_display',
            # Patient timestamps
            'patient_confirmed_arrival', 'patient_confirmed_arrival_ist',
            'patient_confirmed_departure', 'patient_confirmed_departure_ist',
            'patient_confirmed_duration_minutes', 'patient_duration_display',
            # Discrepancy info
            'has_discrepancy', 'discrepancy_minutes', 'discrepancy_notes',
            'discrepancy_resolved', 'resolved_by', 'resolved_at',
            # Status and metadata
            'is_complete', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'therapist', 'patient', 'therapist_reached_time', 'therapist_leaving_time',
            'patient_confirmed_arrival', 'patient_confirmed_departure',
            'therapist_duration_minutes', 'patient_confirmed_duration_minutes',
            'has_discrepancy', 'discrepancy_minutes', 'discrepancy_resolved',
            'resolved_by', 'resolved_at', 'created_at', 'updated_at'
        ]

    def get_therapist_name(self, obj):
        return f"{obj.therapist.user.first_name} {obj.therapist.user.last_name}"

    def get_patient_name(self, obj):
        return f"{obj.patient.user.first_name} {obj.patient.user.last_name}"

    def get_appointment_session_code(self, obj):
        return obj.appointment.session_code

    def get_therapist_reached_time_ist(self, obj):
        if obj.therapist_reached_time:
            ist_time = timezone.localtime(obj.therapist_reached_time, timezone=INDIAN_TZ)
            return ist_time.strftime("%Y-%m-%dT%H:%M:%S%z")
        return None

    def get_therapist_leaving_time_ist(self, obj):
        if obj.therapist_leaving_time:
            ist_time = timezone.localtime(obj.therapist_leaving_time, timezone=INDIAN_TZ)
            return ist_time.strftime("%Y-%m-%dT%H:%M:%S%z")
        return None

    def get_patient_confirmed_arrival_ist(self, obj):
        if obj.patient_confirmed_arrival:
            ist_time = timezone.localtime(obj.patient_confirmed_arrival, timezone=INDIAN_TZ)
            return ist_time.strftime("%Y-%m-%dT%H:%M:%S%z")
        return None

    def get_patient_confirmed_departure_ist(self, obj):
        if obj.patient_confirmed_departure:
            ist_time = timezone.localtime(obj.patient_confirmed_departure, timezone=INDIAN_TZ)
            return ist_time.strftime("%Y-%m-%dT%H:%M:%S%z")
        return None


class SessionTimeLogListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing SessionTimeLogs"""
    therapist_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    appointment_session_code = serializers.SerializerMethodField()

    class Meta:
        model = SessionTimeLog
        fields = [
            'id', 'appointment', 'date', 'status',
            'therapist_name', 'patient_name', 'appointment_session_code',
            'therapist_duration_minutes', 'patient_confirmed_duration_minutes',
            'has_discrepancy', 'discrepancy_minutes'
        ]

    def get_therapist_name(self, obj):
        return f"{obj.therapist.user.first_name} {obj.therapist.user.last_name}"

    def get_patient_name(self, obj):
        return f"{obj.patient.user.first_name} {obj.patient.user.last_name}"

    def get_appointment_session_code(self, obj):
        return obj.appointment.session_code


class PatientConcernSerializer(serializers.ModelSerializer):
    """Serializer for patient concerns/feedback about therapy sessions"""
    patient_name = serializers.SerializerMethodField()
    therapist_name = serializers.SerializerMethodField()
    responded_by_name = serializers.SerializerMethodField()
    category_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    priority_display = serializers.SerializerMethodField()
    created_at_ist = serializers.SerializerMethodField()
    responded_at_ist = serializers.SerializerMethodField()

    class Meta:
        model = PatientConcern
        fields = [
            'id', 'patient', 'patient_name', 'therapist', 'therapist_name',
            'appointment', 'session_date', 'category', 'category_display',
            'subject', 'description', 'status', 'status_display',
            'priority', 'priority_display', 'admin_response',
            'responded_by', 'responded_by_name', 'responded_at', 'responded_at_ist',
            'requires_call', 'call_completed', 'call_notes',
            'created_at', 'created_at_ist', 'updated_at'
        ]
        read_only_fields = [
            'patient', 'admin_response', 'responded_by', 'responded_at',
            'requires_call', 'call_completed', 'call_notes', 'created_at', 'updated_at'
        ]

    def get_patient_name(self, obj):
        return obj.patient.user.get_full_name() if obj.patient else None

    def get_therapist_name(self, obj):
        return obj.therapist.user.get_full_name() if obj.therapist else None

    def get_responded_by_name(self, obj):
        return obj.responded_by.get_full_name() if obj.responded_by else None

    def get_category_display(self, obj):
        return obj.get_category_display()

    def get_status_display(self, obj):
        return obj.get_status_display()

    def get_priority_display(self, obj):
        return obj.get_priority_display()

    def get_created_at_ist(self, obj):
        if obj.created_at:
            ist_time = timezone.localtime(obj.created_at, timezone=INDIAN_TZ)
            return ist_time.strftime("%Y-%m-%dT%H:%M:%S%z")
        return None

    def get_responded_at_ist(self, obj):
        if obj.responded_at:
            ist_time = timezone.localtime(obj.responded_at, timezone=INDIAN_TZ)
            return ist_time.strftime("%Y-%m-%dT%H:%M:%S%z")
        return None


class PatientConcernCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating patient concerns"""
    class Meta:
        model = PatientConcern
        fields = [
            'therapist', 'appointment', 'session_date',
            'category', 'subject', 'description', 'priority'
        ]

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request.user, 'patient_profile'):
            validated_data['patient'] = request.user.patient_profile
        return super().create(validated_data)


class PatientConcernAdminResponseSerializer(serializers.Serializer):
    """Serializer for admin response to patient concerns"""
    response_text = serializers.CharField(required=True)
    requires_call = serializers.BooleanField(default=False)
    status = serializers.ChoiceField(
        choices=['acknowledged', 'in_progress', 'resolved', 'closed'],
        default='acknowledged'
    )