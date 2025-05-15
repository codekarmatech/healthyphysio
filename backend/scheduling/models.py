"""
Purpose: Appointment scheduling and session code management
Connected to: Attendance tracking, patient-therapist assignments
Fields:
  - session_code: Unique identifier (PT-YYYYMMDD-INITIALS-XXXX)
  - reschedule_count: Tracks number of rescheduling attempts
"""

from django.db import models
from django.utils import timezone
from users.models import User, Patient, Therapist
import random
import string
import uuid
from django.core.validators import MinValueValidator, MaxValueValidator

class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SCHEDULED = 'scheduled', 'Scheduled'
        RESCHEDULED = 'rescheduled', 'Rescheduled'
        PENDING_RESCHEDULE = 'pending_reschedule', 'Pending Reschedule'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
        MISSED = 'missed', 'Missed'

    class Type(models.TextChoices):
        INITIAL_ASSESSMENT = 'initial-assessment', 'Initial Assessment'
        FOLLOW_UP = 'follow-up', 'Follow-up Session'
        TREATMENT = 'treatment', 'Treatment Session'
        CONSULTATION = 'consultation', 'Consultation'
        EMERGENCY = 'emergency', 'Emergency Session'

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    therapist = models.ForeignKey(Therapist, on_delete=models.CASCADE, related_name='appointments')
    session_code = models.CharField(max_length=10, unique=True, blank=True)
    datetime = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    reschedule_count = models.IntegerField(default=0)
    type = models.CharField(max_length=30, choices=Type.choices, default=Type.INITIAL_ASSESSMENT)
    issue = models.TextField(blank=True)  # Reason for visit
    notes = models.TextField(blank=True)
    previous_treatments = models.TextField(blank=True)
    pain_level = models.CharField(max_length=2, blank=True, default='0')
    mobility_issues = models.TextField(blank=True)
    changes_log = models.JSONField(blank=True, null=True)  # Track changes to the appointment
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Generate a unique session code if not provided
        if not self.session_code:
            self.session_code = str(uuid.uuid4())[:10].upper()
        super().save(*args, **kwargs)

    def _generate_session_code(self):
        """Generate a unique session code in the format PT-YYYYMMDD-INITIALS-XXXX"""
        date_str = self.datetime.strftime('%Y%m%d')

        # Get patient initials (up to 3 characters)
        patient_name = self.patient.user.get_full_name() or self.patient.user.username
        name_parts = patient_name.split()
        initials = ''.join(part[0].upper() for part in name_parts[:3])
        initials = initials.ljust(3, 'X')[:3]  # Pad with 'X' if needed, limit to 3 chars

        # Generate random part (avoiding confusing characters)
        chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        random_part = ''.join(random.choice(chars) for _ in range(4))

        # Combine parts
        session_code = f"PT-{date_str}-{initials}-{random_part}"

        # Check for collisions and regenerate if needed (max 3 attempts)
        attempts = 0
        while Appointment.objects.filter(session_code=session_code).exists() and attempts < 3:
            random_part = ''.join(random.choice(chars) for _ in range(4))
            session_code = f"PT-{date_str}-{initials}-{random_part}"
            attempts += 1

        return session_code

    def can_reschedule(self):
        """Check if appointment can be rescheduled"""
        # Check reschedule count
        if self.reschedule_count >= 3:
            return False

        # Check if within 24 hours of appointment
        now = timezone.now()
        time_until_appointment = self.datetime - now
        hours_until_appointment = time_until_appointment.total_seconds() / 3600

        return hours_until_appointment > 24

    def __str__(self):
        return f"Appointment {self.session_code}: {self.patient.user.username} with {self.therapist.user.username}"


class RescheduleRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='reschedule_requests')
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reschedule_requests')
    requested_datetime = models.DateTimeField()
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Reschedule request for {self.appointment.session_code} by {self.requested_by.username}"


class Session(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        CHECKIN_INITIATED = 'checkin_initiated', 'Check‑in Initiated'
        APPROVED_CHECKIN = 'approved_checkin', 'Approved Check‑in'
        MISSED_APPROVAL = 'missed_approval', 'Missed Approval'
        COMPLETED = 'completed', 'Completed'
        MISSED = 'missed', 'Missed'

    class ReportStatus(models.TextChoices):
        NOT_REQUIRED = 'not_required', 'Not Required'
        PENDING = 'pending', 'Pending'
        SUBMITTED = 'submitted', 'Submitted'
        REVIEWED = 'reviewed', 'Reviewed'
        FLAGGED = 'flagged', 'Flagged'

    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.CASCADE,
        related_name='session'
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    rating = models.FloatField(
        null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )

    # Patient feedback
    patient_notes = models.TextField(blank=True)
    patient_feedback = models.TextField(blank=True, help_text="Additional feedback from patient")

    # Therapist report fields
    report_status = models.CharField(
        max_length=20,
        choices=ReportStatus.choices,
        default=ReportStatus.NOT_REQUIRED,
        help_text="Status of the therapist's daily report"
    )
    report_submitted_at = models.DateTimeField(null=True, blank=True)
    report_reviewed_at = models.DateTimeField(null=True, blank=True)
    report_reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_sessions'
    )

    # Structured report fields
    therapist_notes = models.TextField(blank=True)
    treatment_provided = models.TextField(
        blank=True,
        help_text="Description of treatment provided during the session"
    )
    patient_progress = models.TextField(
        blank=True,
        help_text="Assessment of patient's progress"
    )
    pain_level_before = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        help_text="Patient's pain level before treatment (0-10)"
    )
    pain_level_after = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        help_text="Patient's pain level after treatment (0-10)"
    )
    mobility_assessment = models.TextField(
        blank=True,
        help_text="Assessment of patient's mobility"
    )
    recommendations = models.TextField(
        blank=True,
        help_text="Recommendations for patient's home care"
    )
    next_session_goals = models.TextField(
        blank=True,
        help_text="Goals for the next session"
    )

    # Report history for append-only functionality
    report_history = models.JSONField(default=list, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def initiate_check_in(self):
        if self.status == self.Status.PENDING:
            self.status   = self.Status.CHECKIN_INITIATED
            self.check_in = timezone.now()
            self.save()
            return True
        return False

    def approve_check_in(self):
        if self.status == self.Status.CHECKIN_INITIATED:
            self.status = self.Status.APPROVED_CHECKIN
            self.save()
            return True
        return False

    def complete_session(self, rating=None, patient_notes='', patient_feedback=''):
        """Complete a session with patient feedback"""
        if self.status == self.Status.APPROVED_CHECKIN:
            self.status = self.Status.COMPLETED
            self.check_out = timezone.now()
            if rating is not None:
                self.rating = rating
            if patient_notes:
                self.patient_notes = patient_notes
            if patient_feedback:
                self.patient_feedback = patient_feedback

            # Set report status to pending if session is completed
            self.report_status = self.ReportStatus.PENDING

            self.save()
            self.appointment.status = self.appointment.Status.COMPLETED
            self.appointment.save()
            return True
        return False

    def mark_as_missed(self):
        """Mark session as missed"""
        self.status = self.Status.MISSED
        self.save()
        self.appointment.status = self.appointment.Status.MISSED
        self.appointment.save()
        return True

    def update_report(self, report_data, therapist_user):
        """
        Update the therapist's report for this session

        Args:
            report_data (dict): Dictionary containing report fields
            therapist_user (User): The therapist user updating the report

        Returns:
            bool: True if successful, False otherwise
        """
        # Ensure only therapists can update reports
        if not therapist_user.is_therapist:
            return False

        # Ensure the therapist is assigned to this session
        if therapist_user != self.appointment.therapist.user:
            return False

        # Don't allow updates to submitted reports
        if self.report_status not in [self.ReportStatus.NOT_REQUIRED, self.ReportStatus.PENDING]:
            return False

        # Store current report data in history
        current_report = {
            'therapist_notes': self.therapist_notes,
            'treatment_provided': self.treatment_provided,
            'patient_progress': self.patient_progress,
            'pain_level_before': self.pain_level_before,
            'pain_level_after': self.pain_level_after,
            'mobility_assessment': self.mobility_assessment,
            'recommendations': self.recommendations,
            'next_session_goals': self.next_session_goals,
            'timestamp': timezone.now().isoformat(),
            'user': therapist_user.username
        }

        # Only add to history if there's existing content
        if (self.therapist_notes or self.treatment_provided or self.patient_progress or
            self.mobility_assessment or self.recommendations or self.next_session_goals):
            if not self.report_history:
                self.report_history = []
            self.report_history.append(current_report)

        # Update report fields
        for field, value in report_data.items():
            if hasattr(self, field) and field not in ['report_status', 'report_submitted_at',
                                                     'report_reviewed_at', 'report_reviewed_by']:
                setattr(self, field, value)

        # Update report status to pending if not already
        if self.report_status == self.ReportStatus.NOT_REQUIRED:
            self.report_status = self.ReportStatus.PENDING

        self.save()
        return True

    def submit_report(self, therapist_user):
        """
        Submit the therapist's report for this session

        Args:
            therapist_user (User): The therapist user submitting the report

        Returns:
            bool: True if successful, False otherwise
        """
        # Ensure only therapists can submit reports
        if not therapist_user.is_therapist:
            return False

        # Ensure the therapist is assigned to this session
        if therapist_user != self.appointment.therapist.user:
            return False

        # Only pending reports can be submitted
        if self.report_status != self.ReportStatus.PENDING:
            return False

        # Check if required fields are filled
        required_fields = ['therapist_notes', 'treatment_provided', 'patient_progress']
        for field in required_fields:
            if not getattr(self, field):
                return False

        # Update report status
        self.report_status = self.ReportStatus.SUBMITTED
        self.report_submitted_at = timezone.now()
        self.save()

        # TODO: Send notification to admin

        return True

    def review_report(self, admin_user, flag=False, notes=''):
        """
        Review or flag a submitted report

        Args:
            admin_user (User): The admin user reviewing the report
            flag (bool): Whether to flag the report for further review
            notes (str): Review notes

        Returns:
            bool: True if successful, False otherwise
        """
        # Ensure only admins can review reports
        if not admin_user.is_admin:
            return False

        # Only submitted reports can be reviewed
        if self.report_status != self.ReportStatus.SUBMITTED:
            return False

        # Update report status
        if flag:
            self.report_status = self.ReportStatus.FLAGGED
        else:
            self.report_status = self.ReportStatus.REVIEWED

        self.report_reviewed_at = timezone.now()
        self.report_reviewed_by = admin_user

        # Store review in history
        review_entry = {
            'action': 'flagged' if flag else 'reviewed',
            'notes': notes,
            'timestamp': timezone.now().isoformat(),
            'user': admin_user.username
        }

        if not self.report_history:
            self.report_history = []
        self.report_history.append(review_entry)

        self.save()
        return True

    def is_report_required(self):
        """Check if a report is required for this session"""
        return self.status == self.Status.COMPLETED and self.report_status == self.ReportStatus.PENDING

    def is_report_submitted(self):
        """Check if a report has been submitted for this session"""
        return self.report_status in [self.ReportStatus.SUBMITTED, self.ReportStatus.REVIEWED, self.ReportStatus.FLAGGED]

    def __str__(self):
        return f"Session for {self.appointment.session_code} — {self.get_status_display()}"