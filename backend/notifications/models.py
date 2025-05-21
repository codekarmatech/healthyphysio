"""
Purpose: Store and manage user notifications
Connected to: Users, Therapists, Patients, Doctors, Admins
Fields:
  - recipient: User who receives the notification
  - sender: User who triggered the notification (optional)
  - notification_type: Category of notification
  - content: JSON data with notification details
  - is_read: Whether the notification has been read
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class Notification(models.Model):
    """Model for storing user notifications"""

    class NotificationType(models.TextChoices):
        APPROVAL = 'approval', 'Approval'
        REPORT = 'report', 'Report'
        APPOINTMENT = 'appointment', 'Appointment'
        ATTENDANCE = 'attendance', 'Attendance'
        TREATMENT_PLAN = 'treatment_plan', 'Treatment Plan'
        EQUIPMENT = 'equipment', 'Equipment'
        VISIT = 'visit', 'Visit'
        SYSTEM = 'system', 'System'
        OTHER = 'other', 'Other'

    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_notifications'
    )
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    content = models.JSONField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    url = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient']),
            models.Index(fields=['is_read']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.title}"

    def mark_as_read(self):
        """Mark the notification as read"""
        self.is_read = True
        self.save(update_fields=['is_read', 'updated_at'])
        return True

    def mark_as_unread(self):
        """Mark the notification as unread"""
        self.is_read = False
        self.save(update_fields=['is_read', 'updated_at'])
        return True
