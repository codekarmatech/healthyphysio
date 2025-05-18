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

    This middleware properly handles authentication monitoring without causing
    RawPostDataException by using a custom request wrapper that caches the
    request body.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only process auth endpoints
        is_auth_endpoint = request.path == '/api/auth/token/' and request.method == 'POST'

        # For auth endpoints, use a request body cache
        if is_auth_endpoint:
            # Cache the request body by reading it once
            try:
                # Store the original request body
                body = request.body
                # Parse the body to extract authentication information
                if body:
                    try:
                        body_data = json.loads(body.decode('utf-8'))
                        # Store authentication information in request for later use
                        request.META['AUTH_USERNAME'] = body_data.get('username')
                        request.META['AUTH_EMAIL'] = body_data.get('email')
                        request.META['AUTH_PHONE'] = body_data.get('phone')
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        # If we can't parse the body, just continue
                        pass
            except Exception as e:
                # If we can't read the body, just continue
                logger.error(f"Error reading request body: {str(e)}")

        # Process the request
        response = self.get_response(request)

        # Log authentication attempts for auth endpoints
        if is_auth_endpoint:
            self._log_auth_attempt(request, response)

        return response

    def _log_auth_attempt(self, request, response):
        """
        Log authentication attempt using metadata stored in request

        This method uses the authentication information stored in request.META
        to avoid accessing request.body again, which would cause RawPostDataException.
        """
        # Get client IP
        client_ip = self._get_client_ip(request)

        # Get authentication identifiers from request metadata
        username = request.META.get('AUTH_USERNAME')
        email = request.META.get('AUTH_EMAIL')
        phone = request.META.get('AUTH_PHONE')

        # Use the first available identifier
        identifier = username or email or phone or 'unknown'

        # Check if login was successful
        is_successful = response.status_code == 200

        # Log the attempt
        if is_successful:
            logger.info(f"Successful login: {identifier} - {client_ip}")
        else:
            logger.warning(f"Failed login attempt: {identifier} - {client_ip}")

            # Create audit log for failed login
            from audit_logs.models import AuditLog
            AuditLog.objects.create(
                action='LOGIN',
                model_name='User',
                object_id='N/A',
                object_repr=f"Failed login attempt: {identifier}",
                previous_state=None,
                new_state={
                    'identifier': identifier,
                    'username': username,
                    'email': email,
                    'phone': phone,
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