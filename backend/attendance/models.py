"""
Purpose: Track session attendance, check-ins, and ratings
Connected to: Appointment scheduling, patient feedback
Fields:
  - check_in: Timestamp when therapist initiates session
  - check_out: Timestamp when session completes
  - rating: Patient feedback (0-5 scale)
"""

from django.db import models
from django.utils import timezone
from django.conf import settings


class Holiday(models.Model):
    name = models.CharField(max_length=100)
    date = models.DateField(unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} - {self.date}"

class Attendance(models.Model):
    STATUS_CHOICES = (
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('half_day', 'Half Day'),
        ('approved_leave', 'Approved Leave'),
    )
    
    therapist = models.ForeignKey('users.Therapist', on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='absent')
    submitted_at = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
                                   null=True, blank=True, related_name='approved_attendances')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('therapist', 'date')
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.therapist.user.username} - {self.date} - {self.status}"
    
    def approve(self, admin_user):
        """Approve attendance by admin"""
        self.approved_by = admin_user
        self.approved_at = timezone.now()
        self.save()