"""
Purpose: Equipment management and allocation tracking
Connected to: Users (Admin, Therapist, Patient)
Fields:
  - equipment: Details of physical therapy equipment
  - allocation: Tracks which equipment is allocated to which therapist/patient
"""

from django.db import models
from django.utils import timezone
from users.models import User, Therapist, Patient
from django.db import models

class Category(models.Model):
    """Model for equipment categories"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Categories"

class Equipment(models.Model):
    """Model for physical therapy equipment owned by admin"""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    photo = models.ImageField(upload_to='equipment/', blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    serial_number = models.CharField(max_length=100, blank=True)
    purchase_date = models.DateField(default=timezone.now)
    is_available = models.BooleanField(default=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='equipment')
    has_serial_number = models.BooleanField(default=True)
    tracking_id = models.CharField(max_length=100, blank=True)
    condition = models.CharField(max_length=20, default='new')
    quantity = models.PositiveIntegerField(default=1)
    related_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='related_items')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        if self.has_serial_number and self.serial_number:
            return f"{self.name} ({self.serial_number})"
        elif self.tracking_id:
            return f"{self.name} ({self.tracking_id})"
        return self.name


class EquipmentAllocation(models.Model):
    """Model for tracking equipment allocation to therapists and patients"""
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        RETURNED = 'returned', 'Returned'
        OVERDUE = 'overdue', 'Overdue'
    
    class LocationChoice(models.TextChoices):
        THERAPIST = 'therapist', 'With Therapist'
        PATIENT = 'patient', 'At Patient\'s Home'
    
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name='allocations')
    therapist = models.ForeignKey(Therapist, on_delete=models.CASCADE, related_name='equipment_allocations')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='equipment_allocations')
    allocated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='equipment_allocations_made')
    
    allocation_date = models.DateTimeField(default=timezone.now)
    expected_return_date = models.DateField()
    actual_return_date = models.DateField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    location = models.CharField(max_length=20, choices=LocationChoice.choices, default=LocationChoice.THERAPIST)
    
    notes = models.TextField(blank=True)
    extension_reason = models.TextField(blank=True)
    extra_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.equipment.name} - {self.therapist.user.username} - {self.patient.user.username}"
    
    def is_overdue(self):
        """Check if the equipment return is overdue"""
        if self.actual_return_date:
            return False
        return timezone.now().date() > self.expected_return_date
    
    def calculate_extra_charges(self, daily_rate=None):
        """Calculate extra charges for overdue equipment"""
        if not self.is_overdue() or self.actual_return_date:
            return 0
            
        # Default daily rate is 1% of equipment price if not specified
        if daily_rate is None:
            daily_rate = self.equipment.price * 0.01
            
        days_overdue = (timezone.now().date() - self.expected_return_date).days
        return days_overdue * daily_rate
    
    def save(self, *args, **kwargs):
        # Check if status should be set to overdue
        if self.is_overdue() and self.status != self.Status.OVERDUE:
            self.status = self.Status.OVERDUE
            
        # Update equipment availability
        if self.status == self.Status.RETURNED and not self.actual_return_date:
            self.actual_return_date = timezone.now().date()
            self.equipment.is_available = True
            self.equipment.save()
        elif self.status in [self.Status.APPROVED, self.Status.OVERDUE]:
            self.equipment.is_available = False
            self.equipment.save()
            
        super().save(*args, **kwargs)


class AllocationRequest(models.Model):
    """Model for therapists to request equipment allocation to patients"""
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
    
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name='allocation_requests')
    therapist = models.ForeignKey(Therapist, on_delete=models.CASCADE, related_name='equipment_requests')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='equipment_requests')
    
    requested_date = models.DateTimeField(default=timezone.now)
    requested_until = models.DateField()
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    location = models.CharField(
        max_length=20, 
        choices=EquipmentAllocation.LocationChoice.choices, 
        default=EquipmentAllocation.LocationChoice.PATIENT
    )
    
    reason = models.TextField()
    admin_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Request: {self.equipment.name} for {self.patient.user.username} by {self.therapist.user.username}"

# Create your models here.
