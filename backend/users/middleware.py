"""
Purpose: Monitor failed login attempts
Connected Endpoints: All authentication endpoints
Validation: Security monitoring
"""

import logging
import json
import os
from django.utils import timezone
from django.conf import settings

# Create logs directory if it doesn't exist
log_dir = settings.BASE_DIR / 'logs'
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# Configure logging
logger = logging.getLogger('auth_monitor')
logger.setLevel(logging.INFO)

# Create file handler
handler = logging.FileHandler(settings.BASE_DIR / 'logs' / 'auth.log')
handler.setLevel(logging.INFO)

# Create formatter
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)

# Add handler to logger
logger.addHandler(handler)

class AuthMonitorMiddleware:
    """
    Middleware to monitor authentication attempts
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Process the request
        response = self.get_response(request)
        
        # Check if this is an authentication endpoint
        if request.path == '/api/auth/token/' and request.method == 'POST':
            self._log_auth_attempt(request, response)
        
        return response
    
    def _log_auth_attempt(self, request, response):
        """Log authentication attempt"""
        # Get client IP
        client_ip = self._get_client_ip(request)
        
        # Get username from request
        username = None
        try:
            if request.body:
                body = json.loads(request.body.decode('utf-8'))
                username = body.get('username', None)
        except json.JSONDecodeError:
            pass
        
        # Check if login was successful
        is_successful = response.status_code == 200
        
        # Log the attempt
        if is_successful:
            logger.info(f"Successful login: {username} - {client_ip}")
        else:
            logger.warning(f"Failed login attempt: {username} - {client_ip}")
            
            # Create audit log for failed login
            from audit_logs.models import AuditLog
            AuditLog.objects.create(
                action='LOGIN',
                model_name='User',
                object_id='N/A',
                object_repr=f"Failed login attempt: {username}",
                previous_state=None,
                new_state={
                    'username': username,
                    'timestamp': timezone.now().isoformat(),
                    'ip_address': client_ip,
                    'user_agent': request.META.get('HTTP_USER_AGENT', '')
                },
                ip_address=client_ip,
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
    
    def _get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip