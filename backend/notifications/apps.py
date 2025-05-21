"""
Purpose: Configuration for the notifications app
Connected to: Django app registry
"""

from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'
    verbose_name = 'User Notifications'

    def ready(self):
        """Import signals when the app is ready"""
        import notifications.signals
