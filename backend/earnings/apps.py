"""
Purpose: Configuration for the earnings app
Connected to: Django app registry
"""

from django.apps import AppConfig


class EarningsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'earnings'
    verbose_name = 'Earnings Management'
    
    def ready(self):
        """Import signals when the app is ready"""
        import earnings.signals
