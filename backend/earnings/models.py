"""
Purpose: Track therapist earnings from appointments
Connected to: Users (Therapist), Scheduling (Appointments)
"""

from django.db import models
from django.utils import timezone
from users.models import Therapist, Patient
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
    
    class Meta:
        ordering = ['-date']
        indexes = [
            models.Index(fields=['therapist', 'date']),
            models.Index(fields=['patient', 'date']),
        ]
