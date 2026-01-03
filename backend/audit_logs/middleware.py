"""
Purpose: Track current user for audit logging and log API access
Connected Endpoints: All HTTP requests
Validation: User identification for all actions
"""

from .signals import set_current_user, set_current_request
from .models import AuditLog

# Paths to exclude from access logging (to avoid noise)
EXCLUDED_PATHS = [
    '/api/auth/token/refresh/',
    '/api/health/',
    '/static/',
    '/media/',
    '/favicon.ico',
    '/__debug__/',
]

# Paths that should be logged as ACCESS actions
ACCESS_LOG_PATHS = [
    '/api/audit-logs/',
    '/api/users/',
    '/api/patients/',
    '/api/therapists/',
    '/api/appointments/',
    '/api/earnings/',
    '/api/visits/',
    '/api/assessments/',
]


class AuditLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Set current user and request in thread local storage
        if request.user.is_authenticated:
            set_current_user(request.user)
        else:
            set_current_user(None)
        
        set_current_request(request)
        
        # Process the request
        response = self.get_response(request)
        
        # Log API access for authenticated users on specific paths
        self._log_api_access(request, response)
        
        # Clear thread local storage
        set_current_user(None)
        set_current_request(None)
        
        return response
    
    def _log_api_access(self, request, response):
        """Log API access for auditing purposes"""
        # Only log for authenticated users
        if not request.user.is_authenticated:
            return
        
        # Skip excluded paths
        path = request.path
        if any(path.startswith(excluded) for excluded in EXCLUDED_PATHS):
            return
        
        # Only log GET requests on sensitive paths (to track data access)
        if request.method != 'GET':
            return
        
        # Check if path should be logged
        should_log = any(path.startswith(log_path) for log_path in ACCESS_LOG_PATHS)
        if not should_log:
            return
        
        # Don't log if response was an error
        if response.status_code >= 400:
            return
        
        try:
            # Extract endpoint info from path
            path_parts = path.strip('/').split('/')
            model_name = path_parts[1] if len(path_parts) > 1 else 'Unknown'
            object_id = path_parts[2] if len(path_parts) > 2 and path_parts[2].isdigit() else 'list'
            
            AuditLog.objects.create(
                user=request.user,
                action='ACCESS',
                model_name=model_name.capitalize(),
                object_id=object_id,
                object_repr=f"GET {path}",
                previous_state=None,
                new_state={'query_params': dict(request.GET)} if request.GET else None,
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]
            )
        except Exception as e:
            # Don't let logging errors break the request
            pass