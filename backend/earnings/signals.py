"""
Purpose: Signal handlers for earnings app
Connected to: Appointment model signals
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from decimal import Decimal

from scheduling.models import Appointment
from .models import EarningRecord

@receiver(post_save, sender=Appointment)
def create_or_update_earning_record(sender, instance, created, **kwargs):
    """
    Create or update an earning record when an appointment is saved
    Only create/update for completed or cancelled appointments
    """
    # Skip if the appointment is not completed or cancelled
    if instance.status not in [Appointment.Status.COMPLETED, Appointment.Status.CANCELLED]:
        return
    
    # Check if an earning record already exists for this appointment
    earning_record = EarningRecord.objects.filter(appointment=instance).first()
    
    # Calculate amount based on appointment status
    # Default fee based on appointment type
    if hasattr(instance, 'fee') and instance.fee:
        full_amount = instance.fee
    else:
        # Default fees based on appointment type
        if instance.type == Appointment.Type.INITIAL_ASSESSMENT:
            full_amount = Decimal('120.00')
        elif instance.type == Appointment.Type.EMERGENCY:
            full_amount = Decimal('150.00')
        else:
            full_amount = Decimal('80.00')
    
    if instance.status == Appointment.Status.COMPLETED:
        amount = full_amount
        payment_status = EarningRecord.PaymentStatus.PAID
    elif instance.status == Appointment.Status.CANCELLED:
        # Apply cancellation fee (50% of full amount) for late cancellations
        # Assume cancellation is late if it's within 24 hours of appointment
        is_late_cancellation = False
        if hasattr(instance, 'updated_at') and hasattr(instance, 'datetime'):
            cancellation_time = instance.updated_at
            appointment_time = instance.datetime
            if (appointment_time - cancellation_time).total_seconds() < 24 * 3600:
                is_late_cancellation = True
        
        if is_late_cancellation:
            amount = full_amount * Decimal('0.5')
            payment_status = EarningRecord.PaymentStatus.PARTIAL
        else:
            amount = Decimal('0.00')
            payment_status = EarningRecord.PaymentStatus.NOT_APPLICABLE
    else:
        amount = Decimal('0.00')
        payment_status = EarningRecord.PaymentStatus.NOT_APPLICABLE
    
    # Create or update the earning record
    if earning_record:
        # Update existing record
        earning_record.amount = amount
        earning_record.full_amount = full_amount
        earning_record.status = instance.status
        earning_record.payment_status = payment_status
        earning_record.payment_date = timezone.now().date() if payment_status == EarningRecord.PaymentStatus.PAID else None
        earning_record.save()
    else:
        # Create new record
        EarningRecord.objects.create(
            therapist=instance.therapist,
            patient=instance.patient,
            appointment=instance,
            date=instance.datetime.date(),
            session_type=instance.type or Appointment.Type.CONSULTATION,
            amount=amount,
            full_amount=full_amount,
            status=instance.status,
            payment_status=payment_status,
            payment_date=timezone.now().date() if payment_status == EarningRecord.PaymentStatus.PAID else None,
            notes=f"Automatically generated from appointment #{instance.id}"
        )