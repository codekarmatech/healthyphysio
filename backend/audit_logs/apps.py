from django.apps import AppConfig


class AuditLogsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'audit_logs'
    
    def ready(self):
        import audit_logs.signals  # Import signals when app is ready
