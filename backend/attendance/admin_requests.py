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

        # Apply the requested changes to the attendance record
        if self.request_type == 'change_status' and self.requested_status:
            # Store the original status for tracking changes
            original_status = self.attendance.status

            # Update the attendance record with the requested status
            self.attendance.status = self.requested_status
            self.attendance.notes = f"{self.attendance.notes or ''}\nChanged from {original_status} to {self.requested_status} via admin request."
            self.attendance.approved_by = admin_user
            self.attendance.approved_at = timezone.now()
            self.attendance.changed_from = original_status  # Track the original status

            # Make sure is_paid is updated based on the new status
            if self.requested_status in ['sick_leave', 'emergency_leave']:
                self.attendance.is_paid = False
            elif self.requested_status in ['present', 'approved_leave']:
                self.attendance.is_paid = True

            # Save the attendance record to persist changes
            self.attendance.save()

            # Log the change
            print(f"Attendance record updated: ID {self.attendance.id}, Status changed from {original_status} to {self.requested_status}")
        elif self.request_type == 'delete':
            # For delete requests, we need to handle the foreign key relationship
            # Store the attendance ID for logging
            attendance_id = getattr(self.attendance, 'id', None)
            
            # Delete the attendance record
            # Note: This will also delete the change request due to CASCADE
            if self.attendance:
                self.attendance.delete()
                print(f"Attendance record deleted: ID {attendance_id}")
            
            # No need to save the change request as it will be deleted along with the attendance
            return

        # For non-delete requests, save the change request after processing the attendance record
        self.save()

    def reject(self, admin_user):
        """Reject the attendance change request"""
        self.status = 'rejected'
        self.resolved_at = timezone.now()
        self.resolved_by = admin_user
        self.save()