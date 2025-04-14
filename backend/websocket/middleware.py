"""
Purpose: Authenticate WebSocket connections using JWT
Connected Endpoints: All WebSocket connections
Validation: Token validation
"""

from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from urllib.parse import parse_qs

User = get_user_model()

@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    """
    JWT authentication middleware for WebSocket connections
    """
    
    async def __call__(self, scope, receive, send):
        # Get the token from query string
        query_params = parse_qs(scope['query_string'].decode())
        token = query_params.get('token', [None])[0]
        
        # If token not in query string, check headers
        if not token and 'headers' in scope:
            headers = dict(scope['headers'])
            if b'authorization' in headers:
                auth_header = headers[b'authorization'].decode()
                if auth_header.startswith('Bearer '):
                    token = auth_header.split(' ')[1]
        
        scope['user'] = AnonymousUser()
        
        # Validate the token
        if token:
            try:
                # Decode the token
                access_token = AccessToken(token)
                user_id = access_token['user_id']
                
                # Get the user
                scope['user'] = await get_user(user_id)
                
                # Add token info to scope
                scope['token'] = {
                    'user_id': user_id,
                    'role': access_token.get('role', ''),
                    'exp': access_token['exp']
                }
                
            except (InvalidToken, TokenError):
                # Invalid token, user remains anonymous
                pass
        
        return await super().__call__(scope, receive, send)