"""
Purpose: Track therapist earnings from appointments and manage financial distribution
Connected to: Users (Therapist, Patient, Doctor), Scheduling (Appointments)
"""

from django.db import models
from django.utils import timezone
from django.conf import settings
from decimal import Decimal
from users.models import User, Therapist, Patient, Doctor
from scheduling.models import Appointment

class EarningRecord(models.Model):
    """Model for tracking individual earnings from appointments"""

    class PaymentStatus(models.TextChoices):
        PAID = 'paid', 'Paid'
        PARTIAL = 'partial', 'Partially Paid'
        UNPAID = 'unpaid', 'Unpaid'
        NOT_APPLICABLE = 'not_applicable', 'Not Applicable'

    therapist = models.ForeignKey(Therapist, on_delete=models.CASCADE, related_name='earnings')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='payments')
    appointment = models.OneToOneField(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name='earning')

    date = models.DateField(default=timezone.now)
    session_type = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    full_amount = models.DecimalField(max_digits=10, decimal_places=2)

    status = models.CharField(max_length=20, choices=Appointment.Status.choices, default=Appointment.Status.COMPLETED)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PAID)
    payment_date = models.DateField(null=True, blank=True)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.therapist.user.username} - {self.patient.user.username} - {self.date} - ${self.amount}"

    # New fields for revenue distribution
    admin_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Amount for admin")
    therapist_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Amount for therapist")
    doctor_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Amount for doctor")

    class Meta:
        ordering = ['-date']
        indexes = [
            models.Index(fields=['therapist', 'date']),
            models.Index(fields=['patient', 'date']),
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
