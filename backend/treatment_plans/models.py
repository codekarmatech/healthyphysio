"""
Purpose: Manage physiotherapy treatment plans with approval workflow
Connected to: Users, Appointments, Sessions
Fields:
  - interventions: Stores the list of treatment interventions
  - approval_status: Tracks approval state of plans and change requests
"""

from django.db import models
from django.utils import timezone
from django.conf import settings
from users.models import User, Patient, Therapist

class TreatmentPlan(models.Model):
    """Main treatment plan model"""
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PENDING_APPROVAL = 'pending_approval', 'Pending Approval'
        APPROVED = 'approved', 'Approved'
        COMPLETED = 'completed', 'Completed'
        ARCHIVED = 'archived', 'Archived'

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='treatment_plans')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_treatment_plans')
    title = models.CharField(max_length=255)
    description = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_treatment_plans'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def submit_for_approval(self):
        """Submit the treatment plan for admin approval"""
        if self.status == self.Status.DRAFT:
            self.status = self.Status.PENDING_APPROVAL
            self.save()
            return True
        return False

    def approve(self, admin_user):
        """Approve the treatment plan (admin only)"""
        if self.status == self.Status.PENDING_APPROVAL and admin_user.is_admin:
            self.status = self.Status.APPROVED
            self.approved_by = admin_user
            self.approved_at = timezone.now()
            self.save()
            return True
        return False

    def complete(self):
        """Mark the treatment plan as completed"""
        if self.status == self.Status.APPROVED:
            self.status = self.Status.COMPLETED
            self.save()
            return True
        return False

    def archive(self):
        """Archive the treatment plan"""
        self.status = self.Status.ARCHIVED
        self.save()
        return True

    def __str__(self):
        return f"{self.title} - {self.patient.user.get_full_name()}"

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['created_by', 'status']),
            models.Index(fields=['status']),
        ]

class TreatmentPlanVersion(models.Model):
    """Tracks versions of treatment plans"""
    treatment_plan = models.ForeignKey(TreatmentPlan, on_delete=models.CASCADE, related_name='versions')
    data = models.JSONField()  # Stores the complete plan data
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Version of {self.treatment_plan.title} at {self.created_at}"

class TreatmentPlanChangeRequest(models.Model):
    """Tracks change requests from therapists"""
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    treatment_plan = models.ForeignKey(TreatmentPlan, on_delete=models.CASCADE, related_name='change_requests')
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='requested_plan_changes')
    current_data = models.JSONField()
    requested_data = models.JSONField()
    reason = models.TextField()
    urgency = models.CharField(max_length=10, choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High')
    ], default='medium')
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_plan_changes'
    )
    rejection_reason = models.TextField(blank=True)

    def approve(self, admin_user):
        """Approve the change request (admin only)"""
        if not admin_user.is_admin:
            return False

        self.status = self.Status.APPROVED
        self.resolved_at = timezone.now()
        self.resolved_by = admin_user

        # Create a new version with the current data
        TreatmentPlanVersion.objects.create(
            treatment_plan=self.treatment_plan,
            data=self.current_data,
            created_by=self.treatment_plan.created_by
        )

        # Update the treatment plan with the requested changes
        for key, value in self.requested_data.items():
            if hasattr(self.treatment_plan, key):
                setattr(self.treatment_plan, key, value)

        self.treatment_plan.save()
        self.save()
        return True

    def reject(self, admin_user, reason):
        """Reject the change request (admin only)"""
        if not admin_user.is_admin:
            return False

        self.status = self.Status.REJECTED
        self.resolved_at = timezone.now()
        self.resolved_by = admin_user
        self.rejection_reason = reason
        self.save()
        return True

    def __str__(self):
        return f"Change request for {self.treatment_plan.title} by {self.requested_by.username}"

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['treatment_plan', 'status']),
            models.Index(fields=['requested_by', 'status']),
            models.Index(fields=['status']),
        ]

class Intervention(models.Model):
    """Standard physiotherapy interventions"""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['is_active']),
        ]

class DailyTreatment(models.Model):
    """Daily treatment schedule within a treatment plan"""
    treatment_plan = models.ForeignKey(TreatmentPlan, on_delete=models.CASCADE, related_name='daily_treatments')
    day_number = models.PositiveIntegerField()
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    interventions = models.JSONField(default=list)  # List of intervention IDs with details
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Day {self.day_number} - {self.title} ({self.treatment_plan.title})"

    class Meta:
        ordering = ['treatment_plan', 'day_number']
        unique_together = ['treatment_plan', 'day_number']

class TreatmentSession(models.Model):
    """Records of actual treatment sessions performed"""
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        MISSED = 'missed', 'Missed'

    treatment_plan = models.ForeignKey(TreatmentPlan, on_delete=models.CASCADE, related_name='sessions')
    daily_treatment = models.ForeignKey(DailyTreatment, on_delete=models.SET_NULL, null=True, related_name='sessions')
    therapist = models.ForeignKey(Therapist, on_delete=models.CASCADE, related_name='treatment_sessions')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='treatment_sessions')
    scheduled_date = models.DateField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Session details
    interventions_performed = models.JSONField(default=list)  # List of intervention IDs with duration and notes
    pain_level_before = models.IntegerField(null=True, blank=True)
    pain_level_after = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)

    def complete(self, data):
        """Mark the session as completed with the provided data"""
        self.status = self.Status.COMPLETED
        self.completed_at = timezone.now()

        # Update fields from data
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)

        self.save()
        return True

    def mark_missed(self):
        """Mark the session as missed"""
        self.status = self.Status.MISSED
        self.save()
        return True

    def __str__(self):
        return f"Session for {self.patient.user.get_full_name()} on {self.scheduled_date}"

    class Meta:
        ordering = ['-scheduled_date']
        indexes = [
            models.Index(fields=['treatment_plan', 'status']),
            models.Index(fields=['therapist', 'status']),
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['scheduled_date']),
        ]
