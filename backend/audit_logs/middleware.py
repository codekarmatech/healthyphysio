"""
Purpose: Track current user for audit logging
Connected Endpoints: All HTTP requests
Validation: User identification for all actions
"""

from .signals import set_current_user, set_current_request

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
        
        # Clear thread local storage
        set_current_user(None)
        set_current_request(None)
        
        return response