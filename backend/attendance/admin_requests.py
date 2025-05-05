"""
Purpose: Handle admin requests for attendance changes
Connected to: Attendance tracking system
"""

from django.db import models
from django.utils import timezone
from django.conf import settings

class AttendanceChangeRequest(models.Model):
    REQUEST_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    REQUEST_TYPE_CHOICES = (
        ('change_status', 'Change Status'),
        ('delete', 'Delete Attendance'),
    )
    
    therapist = models.ForeignKey('users.Therapist', on_delete=models.CASCADE, related_name='attendance_change_requests')
    attendance = models.ForeignKey('attendance.Attendance', on_delete=models.CASCADE, related_name='change_requests')
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPE_CHOICES)
    current_status = models.CharField(max_length=20)
    requested_status = models.CharField(max_length=20, null=True, blank=True)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=REQUEST_STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
                                   null=True, blank=True, related_name='resolved_attendance_requests')
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.therapist.user.username} - {self.attendance.date} - {self.request_type}"
    
    def approve(self, admin_user):
        """Approve the attendance change request"""
        self.status = 'approved'
        self.resolved_at = timezone.now()
        self.resolved_by = admin_user
        self.save()
        
        # Apply the requested changes to the attendance record
        if self.request_type == 'change_status' and self.requested_status:
            self.attendance.status = self.requested_status
            self.attendance.notes = f"{self.attendance.notes or ''}\nChanged from {self.current_status} to {self.requested_status} via admin request."
            self.attendance.approved_by = admin_user
            self.attendance.approved_at = timezone.now()
            self.attendance.save()
        elif self.request_type == 'delete':
            self.attendance.delete()
    
    def reject(self, admin_user):
        """Reject the attendance change request"""
        self.status = 'rejected'
        self.resolved_at = timezone.now()
        self.resolved_by = admin_user
        self.save()