from django.utils import timezone

def aware_datetime(*args, **kwargs):
    """
    Helper function to create timezone-aware datetime objects for tests.
    
    Usage:
    Instead of using datetime(2025, 4, 1), use aware_datetime(2025, 4, 1)
    """
    from datetime import datetime
    dt = datetime(*args, **kwargs)
    return timezone.make_aware(dt, timezone.get_current_timezone())