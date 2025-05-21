"""
Purpose: Signal handlers for creating notifications
Connected to: Various models that trigger notifications
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Notification

User = get_user_model()

def create_notification(recipient, notification_type, title, message, sender=None, content=None, url=''):
    """
    Helper function to create a notification
    
    Args:
        recipient: User who will receive the notification
        notification_type: Type of notification (from Notification.NotificationType)
        title: Notification title
        message: Notification message
        sender: User who triggered the notification (optional)
        content: Additional JSON data (optional)
        url: URL to redirect to when clicked (optional)
    
    Returns:
        Notification object
    """
    notification = Notification.objects.create(
        recipient=recipient,
        sender=sender,
        notification_type=notification_type,
        title=title,
        message=message,
        content=content,
        url=url
    )
    return notification

# Example signal handler for therapist approval
@receiver(post_save, sender='users.Therapist')
def therapist_approval_notification(sender, instance, created, **kwargs):
    """Create notification when therapist is approved"""
    # Skip if this is a new therapist (not an approval update)
    if created:
        return
    
    # Check if any approval fields changed
    approval_fields = [
        ('is_approved', 'account_approved', 'Your account has been approved'),
        ('treatment_plans_approved', 'treatment_plans_approved', 'You now have access to treatment plans'),
        ('reports_approved', 'reports_approved', 'You now have access to reports'),
        ('attendance_approved', 'attendance_approved', 'You now have access to attendance tracking')
    ]
    
    for field, notification_key, message in approval_fields:
        # Get previous value from instance._previous_field if it exists
        previous_value = getattr(instance, f'_previous_{field}', None)
        current_value = getattr(instance, field)
        
        # If field changed from False to True, create notification
        if previous_value is False and current_value is True:
            create_notification(
                recipient=instance.user,
                notification_type='approval',
                title='Feature Approved',
                message=message,
                content={
                    'feature': notification_key,
                    'approved': True
                },
                url='/therapist/dashboard'
            )
