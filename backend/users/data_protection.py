"""
Data Protection and Compliance Module for HealthyPhysio Platform
Implements DPDP Act 2023 and Indian healthcare data protection requirements
"""

from django.db import models
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


class DataRetentionPolicy(models.Model):
    """
    Defines data retention policies for different types of healthcare data
    Based on Indian healthcare regulations and DPDP Act 2023
    """
    DATA_TYPE_CHOICES = [
        ('patient_personal', 'Patient Personal Data'),
        ('patient_medical', 'Patient Medical Records'),
        ('therapist_professional', 'Therapist Professional Data'),
        ('doctor_professional', 'Doctor Professional Data'),
        ('treatment_records', 'Treatment Records'),
        ('appointment_history', 'Appointment History'),
        ('financial_records', 'Financial Records'),
        ('audit_logs', 'Audit Logs'),
        ('system_logs', 'System Logs'),
    ]

    data_type = models.CharField(max_length=50, choices=DATA_TYPE_CHOICES, unique=True)
    retention_period_days = models.PositiveIntegerField(
        help_text="Number of days to retain data after deletion request"
    )
    legal_basis = models.TextField(
        help_text="Legal justification for retention period"
    )
    can_override_deletion = models.BooleanField(
        default=False,
        help_text="Whether this data type can override user deletion requests"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Data Retention Policy"
        verbose_name_plural = "Data Retention Policies"

    def __str__(self):
        return f"{self.get_data_type_display()} - {self.retention_period_days} days"


class AccountDeletionRequest(models.Model):
    """
    Tracks user account deletion requests with admin approval workflow
    Implements DPDP Act 2023 compliance requirements
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Admin Review'),
        ('approved', 'Approved - Processing'),
        ('completed', 'Deletion Completed'),
        ('rejected', 'Rejected'),
        ('on_hold', 'On Hold - Legal Review'),
    ]

    DELETION_TYPE_CHOICES = [
        ('soft', 'Soft Delete (Anonymize)'),
        ('hard', 'Hard Delete (Permanent)'),
        ('partial', 'Partial Delete (Retain Medical Records)'),
    ]

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='deletion_requests')
    requested_at = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(help_text="User's reason for deletion request")

    # Admin review fields
    reviewed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_deletion_requests'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True, help_text="Admin review notes")

    # Deletion execution fields
    deletion_type = models.CharField(max_length=20, choices=DELETION_TYPE_CHOICES, null=True, blank=True)
    scheduled_deletion_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Legal compliance fields
    legal_hold = models.BooleanField(default=False, help_text="Legal hold prevents deletion")
    legal_hold_reason = models.TextField(blank=True)
    retention_override = models.BooleanField(default=False, help_text="Override deletion for retention requirements")
    retention_override_reason = models.TextField(blank=True)

    # DPDP Act 2023 compliance tracking
    notification_sent_at = models.DateTimeField(null=True, blank=True)
    compliance_deadline = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-requested_at']
        verbose_name = "Account Deletion Request"
        verbose_name_plural = "Account Deletion Requests"

    def __str__(self):
        return f"Deletion request for {self.user.username} - {self.status}"

    def save(self, *args, **kwargs):
        # Set compliance deadline (30 days from request as per DPDP Act 2023)
        if not self.compliance_deadline:
            if self.requested_at:
                self.compliance_deadline = self.requested_at + timedelta(days=30)
            else:
                # If requested_at is not set yet (during creation), set it to now
                self.compliance_deadline = timezone.now() + timedelta(days=30)
        super().save(*args, **kwargs)

    def is_overdue(self):
        """Check if deletion request is overdue per DPDP Act 2023"""
        if self.compliance_deadline and self.status in ['pending', 'approved']:
            return timezone.now() > self.compliance_deadline
        return False

    def can_be_processed(self):
        """Check if deletion can be processed (no legal holds)"""
        return not self.legal_hold and not self.retention_override

    def approve(self, admin_user, deletion_type='soft', notes=''):
        """Approve deletion request"""
        self.status = 'approved'
        self.reviewed_by = admin_user
        self.reviewed_at = timezone.now()
        self.deletion_type = deletion_type
        self.admin_notes = notes

        # Schedule deletion for immediate processing
        self.scheduled_deletion_date = timezone.now()
        self.save()

        logger.info(f"Deletion request approved for user {self.user.username} by {admin_user.username}")

    def reject(self, admin_user, reason):
        """Reject deletion request"""
        self.status = 'rejected'
        self.reviewed_by = admin_user
        self.reviewed_at = timezone.now()
        self.admin_notes = reason
        self.save()

        logger.info(f"Deletion request rejected for user {self.user.username} by {admin_user.username}")

    def place_legal_hold(self, reason):
        """Place legal hold on deletion request"""
        self.legal_hold = True
        self.legal_hold_reason = reason
        self.status = 'on_hold'
        self.save()

        logger.warning(f"Legal hold placed on deletion request for user {self.user.username}")


class DataAnonymizationLog(models.Model):
    """
    Tracks data anonymization activities for compliance reporting
    """
    deletion_request = models.ForeignKey(AccountDeletionRequest, on_delete=models.CASCADE)
    data_type = models.CharField(max_length=50)
    table_name = models.CharField(max_length=100)
    records_affected = models.PositiveIntegerField()
    anonymization_method = models.CharField(max_length=100)
    processed_at = models.DateTimeField(auto_now_add=True)
    processed_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)

    class Meta:
        verbose_name = "Data Anonymization Log"
        verbose_name_plural = "Data Anonymization Logs"

    def __str__(self):
        return f"Anonymized {self.records_affected} {self.data_type} records"


class ComplianceReport(models.Model):
    """
    Generates compliance reports for DPDP Act 2023 and healthcare regulations
    """
    REPORT_TYPE_CHOICES = [
        ('monthly', 'Monthly Compliance Report'),
        ('quarterly', 'Quarterly Compliance Report'),
        ('annual', 'Annual Compliance Report'),
        ('audit', 'Audit Compliance Report'),
    ]

    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    period_start = models.DateField()
    period_end = models.DateField()
    generated_at = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)

    # Metrics
    total_deletion_requests = models.PositiveIntegerField(default=0)
    approved_deletions = models.PositiveIntegerField(default=0)
    rejected_deletions = models.PositiveIntegerField(default=0)
    overdue_requests = models.PositiveIntegerField(default=0)
    legal_holds = models.PositiveIntegerField(default=0)

    report_data = models.JSONField(default=dict, help_text="Detailed compliance metrics")

    class Meta:
        verbose_name = "Compliance Report"
        verbose_name_plural = "Compliance Reports"
        unique_together = ['report_type', 'period_start', 'period_end']

    def __str__(self):
        return f"{self.get_report_type_display()} - {self.period_start} to {self.period_end}"


# Default retention policies based on Indian healthcare regulations
DEFAULT_RETENTION_POLICIES = [
    {
        'data_type': 'patient_medical',
        'retention_period_days': 2555,  # 7 years
        'legal_basis': 'Indian Medical Council regulations require 7-year retention of medical records',
        'can_override_deletion': True,
    },
    {
        'data_type': 'treatment_records',
        'retention_period_days': 2555,  # 7 years
        'legal_basis': 'Physiotherapy treatment records must be retained for 7 years',
        'can_override_deletion': True,
    },
    {
        'data_type': 'patient_personal',
        'retention_period_days': 90,  # 3 months
        'legal_basis': 'DPDP Act 2023 allows reasonable retention period for personal data',
        'can_override_deletion': False,
    },
    {
        'data_type': 'financial_records',
        'retention_period_days': 2555,  # 7 years
        'legal_basis': 'Income Tax Act requires 7-year retention of financial records',
        'can_override_deletion': True,
    },
    {
        'data_type': 'audit_logs',
        'retention_period_days': 2555,  # 7 years
        'legal_basis': 'Security audit requirements for healthcare data',
        'can_override_deletion': True,
    },
]
