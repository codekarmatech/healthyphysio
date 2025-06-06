"""
Purpose: Track therapist earnings from appointments and manage financial distribution
Connected to: Users (Therapist, Patient, Doctor), Scheduling (Appointments)
"""

from django.db import models
from django.utils import timezone
from django.conf import settings
from decimal import Decimal
import calendar
import datetime
from users.models import User, Therapist, Patient, Doctor
from scheduling.models import Appointment

class EarningRecord(models.Model):
    """Model for tracking individual earnings from appointments"""

    class PaymentStatus(models.TextChoices):
        PAID = 'paid', 'Paid'
        PARTIAL = 'partial', 'Partially Paid'
        UNPAID = 'unpaid', 'Unpaid'
        PENDING = 'pending', 'Pending Payment'
        SCHEDULED = 'scheduled', 'Payment Scheduled'
        NOT_APPLICABLE = 'not_applicable', 'Not Applicable'

    class PaymentMethod(models.TextChoices):
        BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
        CASH = 'cash', 'Cash'
        CHEQUE = 'cheque', 'Cheque'
        UPI = 'upi', 'UPI'
        OTHER = 'other', 'Other'

    therapist = models.ForeignKey(Therapist, on_delete=models.CASCADE, related_name='earnings')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='payments')
    appointment = models.OneToOneField(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name='earning')

    # Link to attendance and visit records for verification
    attendance = models.ForeignKey('attendance.Attendance', on_delete=models.SET_NULL, null=True, blank=True, related_name='earnings')
    visit = models.ForeignKey('visits.Visit', on_delete=models.SET_NULL, null=True, blank=True, related_name='earnings')

    date = models.DateField(default=timezone.now)
    session_type = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    full_amount = models.DecimalField(max_digits=10, decimal_places=2)

    status = models.CharField(max_length=20, choices=Appointment.Status.choices, default=Appointment.Status.COMPLETED)

    # Payment tracking fields
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID)
    payment_date = models.DateField(null=True, blank=True)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, null=True, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True, help_text="Reference number for the payment")
    payment_processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                           null=True, blank=True, related_name='processed_payments')
    payment_scheduled_date = models.DateField(null=True, blank=True, help_text="Date when payment is scheduled")
    is_verified = models.BooleanField(default=False, help_text="Whether the session was verified by geo-tracking")

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.therapist.user.username} - {self.patient.user.username} - {self.date} - ₹{self.amount}"

    # Revenue distribution fields
    admin_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Amount for admin")
    therapist_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Amount for therapist")
    doctor_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Amount for doctor")

    def mark_as_paid(self, payment_method, payment_reference='', payment_date=None, processed_by=None):
        """
        Mark the earning record as paid

        Args:
            payment_method: Method of payment (from PaymentMethod choices)
            payment_reference: Reference number for the payment
            payment_date: Date of payment (defaults to today)
            processed_by: User who processed the payment

        Returns:
            bool: True if successful
        """
        self.payment_status = self.PaymentStatus.PAID
        self.payment_method = payment_method
        self.payment_reference = payment_reference
        self.payment_date = payment_date or timezone.now().date()
        self.payment_processed_by = processed_by
        self.save()
        return True

    def schedule_payment(self, scheduled_date):
        """
        Schedule a payment for future processing

        Args:
            scheduled_date: Date when payment will be processed

        Returns:
            bool: True if successful
        """
        self.payment_status = self.PaymentStatus.SCHEDULED
        self.payment_scheduled_date = scheduled_date
        self.save()
        return True

    def verify_session(self, visit=None, attendance=None):
        """
        Verify that the session actually took place using geo-tracking data

        Args:
            visit: Visit object with geo-tracking data
            attendance: Attendance record for the session

        Returns:
            bool: True if verified, False otherwise
        """
        # Link to visit and attendance if provided
        if visit:
            self.visit = visit
        if attendance:
            self.attendance = attendance

        # Check if visit has geo-tracking data
        if self.visit and self.visit.location_updates.exists():
            self.is_verified = True
            self.save()
            return True

        # If no visit but attendance is marked as present
        if self.attendance and self.attendance.status == 'present':
            self.is_verified = True
            self.save()
            return True

        return False

    class Meta:
        ordering = ['-date']
        indexes = [
            models.Index(fields=['therapist', 'date']),
            models.Index(fields=['patient', 'date']),
            models.Index(fields=['payment_status']),
            models.Index(fields=['payment_date']),
            models.Index(fields=['payment_scheduled_date']),
            models.Index(fields=['is_verified']),
        ]


class SessionFeeConfig(models.Model):
    """Model for configuring session fees"""
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='fee_configs')
    base_fee = models.DecimalField(max_digits=10, decimal_places=2, help_text="Base fee for sessions in INR")

    # Optional fields for custom fee configurations
    custom_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,
                                   help_text="Custom fee override for this patient")
    notes = models.TextField(blank=True, help_text="Notes about fee configuration")

    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_fee_configs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        fee = self.custom_fee if self.custom_fee else self.base_fee
        return f"{self.patient.user.get_full_name()} - ₹{fee}"

    @property
    def current_fee(self):
        """Get the current applicable fee"""
        return self.custom_fee if self.custom_fee else self.base_fee

    class Meta:
        ordering = ['-updated_at']


class FeeChangeLog(models.Model):
    """Model for tracking changes to session fees"""
    fee_config = models.ForeignKey(SessionFeeConfig, on_delete=models.CASCADE, related_name='change_logs')
    previous_fee = models.DecimalField(max_digits=10, decimal_places=2)
    new_fee = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField(blank=True, help_text="Reason for the fee change")

    # Metadata
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='fee_changes')
    changed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.fee_config.patient.user.get_full_name()} - ₹{self.previous_fee} to ₹{self.new_fee}"

    class Meta:
        ordering = ['-changed_at']


class PaymentSchedule(models.Model):
    """Model for scheduling therapist payments"""

    class ScheduleType(models.TextChoices):
        MONTHLY_15TH = 'monthly_15th', '15th of Every Month'
        MONTHLY_30TH = 'monthly_30th', '30th of Every Month'
        CUSTOM = 'custom', 'Custom Schedule'

    therapist = models.ForeignKey(Therapist, on_delete=models.CASCADE, related_name='payment_schedules')
    schedule_type = models.CharField(max_length=20, choices=ScheduleType.choices, default=ScheduleType.MONTHLY_15TH)
    custom_day = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Day of month for custom schedule")
    is_active = models.BooleanField(default=True)

    # Notification settings
    send_reminders = models.BooleanField(default=True)
    reminder_days = models.JSONField(default=list, help_text="Days before payment to send reminders")

    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_payment_schedules')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.therapist.user.get_full_name()} - {self.get_schedule_type_display()}"

    def get_next_payment_date(self):
        """Calculate the next payment date based on schedule type"""
        today = timezone.now().date()
        current_month = today.month
        current_year = today.year

        # Get the last day of current month
        _, last_day = calendar.monthrange(current_year, current_month)

        if self.schedule_type == self.ScheduleType.MONTHLY_15TH:
            payment_day = 15
        elif self.schedule_type == self.ScheduleType.MONTHLY_30TH:
            # Use the last day of month if it has fewer than 30 days
            payment_day = min(30, last_day)
        else:  # CUSTOM
            payment_day = self.custom_day or 1

        # Create date object for payment day in current month
        payment_date = datetime.date(current_year, current_month, min(payment_day, last_day))

        # If payment date has passed, move to next month
        if payment_date < today:
            if current_month == 12:
                next_month = 1
                next_year = current_year + 1
            else:
                next_month = current_month + 1
                next_year = current_year

            _, next_month_last_day = calendar.monthrange(next_year, next_month)
            payment_day = min(payment_day, next_month_last_day)
            payment_date = datetime.date(next_year, next_month, payment_day)

        return payment_date

    def get_reminder_dates(self):
        """Get dates when reminders should be sent"""
        if not self.send_reminders:
            return []

        payment_date = self.get_next_payment_date()
        reminder_days = self.reminder_days or [7, 3, 1]  # Default reminder days

        reminder_dates = []
        for days in reminder_days:
            reminder_date = payment_date - datetime.timedelta(days=days)
            if reminder_date >= timezone.now().date():
                reminder_dates.append(reminder_date)

        return reminder_dates

    class Meta:
        ordering = ['therapist__user__first_name', 'therapist__user__last_name']
        unique_together = ('therapist', 'schedule_type')


class RevenueDistributionConfig(models.Model):
    """Model for configuring revenue distribution"""
    class DistributionType(models.TextChoices):
        PERCENTAGE = 'percentage', 'Percentage'
        FIXED = 'fixed', 'Fixed Amount'

    name = models.CharField(max_length=100, help_text="Name of this distribution configuration")
    is_default = models.BooleanField(default=False, help_text="Whether this is the default configuration")
    distribution_type = models.CharField(
        max_length=10,
        choices=DistributionType.choices,
        default=DistributionType.PERCENTAGE,
        help_text="Type of distribution (percentage or fixed amount)"
    )

    # Platform fee
    platform_fee_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=3.00,
        help_text="Platform fee percentage to be deducted from total amount"
    )

    # Minimum admin amount threshold for warning
    min_admin_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=400.00,
        help_text="Minimum admin amount threshold for warning"
    )

    # Distribution values
    admin_value = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Percentage or fixed amount for admin"
    )
    therapist_value = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Percentage or fixed amount for therapist"
    )
    doctor_value = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Percentage or fixed amount for referring doctor"
    )

    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_distributions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_distribution_type_display()})"

    def calculate_distribution(self, total_fee):
        """
        Calculate the distribution of a given fee
        Returns a dictionary with amounts for each role
        """
        total_fee = Decimal(str(total_fee))  # Ensure we're working with Decimal

        # Calculate platform fee
        platform_fee = (Decimal(self.platform_fee_percentage) / 100) * total_fee
        platform_fee = round(platform_fee, 2)

        # Amount left for distribution after platform fee
        distributable_amount = total_fee - platform_fee

        if self.distribution_type == self.DistributionType.PERCENTAGE:
            # Ensure percentages add up to 100
            total_percentage = self.admin_value + self.therapist_value + self.doctor_value
            if total_percentage != 100:
                # Normalize to 100%
                admin_pct = (self.admin_value / total_percentage) * 100
                therapist_pct = (self.therapist_value / total_percentage) * 100
                doctor_pct = (self.doctor_value / total_percentage) * 100
            else:
                admin_pct = self.admin_value
                therapist_pct = self.therapist_value
                doctor_pct = self.doctor_value

            # Calculate amounts from distributable amount (after platform fee)
            admin_amount = (Decimal(admin_pct) / 100) * distributable_amount
            therapist_amount = (Decimal(therapist_pct) / 100) * distributable_amount
            doctor_amount = (Decimal(doctor_pct) / 100) * distributable_amount
        else:
            # Fixed amounts
            admin_amount = self.admin_value
            therapist_amount = self.therapist_value
            doctor_amount = self.doctor_value

            # Adjust if fixed amounts exceed distributable amount
            total_fixed = admin_amount + therapist_amount + doctor_amount
            if total_fixed > distributable_amount:
                # Scale proportionally
                scale_factor = distributable_amount / total_fixed
                admin_amount *= scale_factor
                therapist_amount *= scale_factor
                doctor_amount *= scale_factor

        # Round to 2 decimal places
        admin_amount = round(admin_amount, 2)
        therapist_amount = round(therapist_amount, 2)
        doctor_amount = round(doctor_amount, 2)

        # Ensure the sum equals the distributable amount (handle rounding errors)
        calculated_total = admin_amount + therapist_amount + doctor_amount
        if calculated_total != distributable_amount:
            # Adjust the largest amount to make the total match
            difference = distributable_amount - calculated_total
            if admin_amount >= therapist_amount and admin_amount >= doctor_amount:
                admin_amount += difference
            elif therapist_amount >= admin_amount and therapist_amount >= doctor_amount:
                therapist_amount += difference
            else:
                doctor_amount += difference

        # Check if admin amount is below threshold
        below_threshold = admin_amount < self.min_admin_amount

        return {
            'admin': admin_amount,
            'therapist': therapist_amount,
            'doctor': doctor_amount,
            'platform_fee': platform_fee,
            'total': total_fee,
            'distributable_amount': distributable_amount,
            'below_threshold': below_threshold
        }

    class Meta:
        ordering = ['-is_default', 'name']


class PaymentBatch(models.Model):
    """Model for tracking batches of payments processed together"""

    class BatchStatus(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SCHEDULED = 'scheduled', 'Scheduled'
        PROCESSING = 'processing', 'Processing'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'
        CANCELLED = 'cancelled', 'Cancelled'

    name = models.CharField(max_length=100, help_text="Name of this payment batch")
    status = models.CharField(max_length=20, choices=BatchStatus.choices, default=BatchStatus.DRAFT)
    payment_date = models.DateField(default=timezone.now, help_text="Date when payments were/will be processed")
    payment_method = models.CharField(
        max_length=20,
        choices=EarningRecord.PaymentMethod.choices,
        default=EarningRecord.PaymentMethod.BANK_TRANSFER
    )
    notes = models.TextField(blank=True, help_text="Notes about this payment batch")

    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_payment_batches')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.payment_date} - {self.get_status_display()}"

    def get_total_amount(self):
        """Calculate the total amount for this batch"""
        return self.payments.aggregate(total=models.Sum('amount'))['total'] or 0

    def get_payment_count(self):
        """Get the number of payments in this batch"""
        return self.payments.count()

    def process_batch(self):
        """Process all payments in this batch"""
        if self.status != self.BatchStatus.DRAFT and self.status != self.BatchStatus.SCHEDULED:
            return False

        self.status = self.BatchStatus.PROCESSING
        self.save()

        success = True
        for payment in self.payments.all():
            try:
                payment.mark_as_paid(
                    payment_method=self.payment_method,
                    payment_date=self.payment_date,
                    processed_by=self.created_by
                )
            except Exception as e:
                success = False
                print(f"Error processing payment {payment.id}: {e}")

        if success:
            self.status = self.BatchStatus.COMPLETED
        else:
            self.status = self.BatchStatus.FAILED

        self.processed_at = timezone.now()
        self.save()
        return success

    def cancel_batch(self):
        """Cancel this payment batch"""
        if self.status == self.BatchStatus.COMPLETED:
            return False

        self.status = self.BatchStatus.CANCELLED
        self.save()
        return True

    class Meta:
        ordering = ['-payment_date', '-created_at']
        verbose_name_plural = "Payment Batches"
