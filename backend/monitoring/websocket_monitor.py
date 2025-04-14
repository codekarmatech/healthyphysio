"""
Purpose: Monitor WebSocket connections and failed login attempts
Connected Endpoints: All WebSocket connections
Validation: Security monitoring
"""

import logging
import json
from datetime import datetime
from django.conf import settings
from channels.middleware import BaseMiddleware

# Configure logging
logger = logging.getLogger('websocket_monitor')
logger.setLevel(logging.INFO)

# Create file handler
handler = logging.FileHandler(settings.BASE_DIR / 'logs' / 'websocket.log')
handler.setLevel(logging.INFO)

# Create formatter
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)

# Add handler to logger
logger.addHandler(handler)

class WebSocketMonitorMiddleware(BaseMiddleware):
    """
    Middleware to monitor WebSocket connections
    """
    
    async def __call__(self, scope, receive, send):
        # Log connection attempt
        client_ip = scope.get('client', ('Unknown', 0))[0]
        path = scope.get('path', 'Unknown')
        
        # Get user if authenticated
        user = scope.get('user', None)
        user_info = f"User: {user.username}" if user and user.is_authenticated else "Unauthenticated"
        
        # Log connection
        logger.info(f"WebSocket connection attempt: {client_ip} - {path} - {user_info}")
        
        # Intercept receive to monitor messages
        original_receive = receive
        
        async def receive_wrapper():
            message = await original_receive()
            
            # Log message type
            if message['type'] == 'websocket.connect':
                logger.info(f"WebSocket connected: {client_ip} - {path} - {user_info}")
            elif message['type'] == 'websocket.disconnect':
                logger.info(f"WebSocket disconnected: {client_ip} - {path} - {user_info} - Code: {message.get('code', 'Unknown')}")
            elif message['type'] == 'websocket.receive':
                # Log message content (excluding sensitive data)
                try:
                    data = json.loads(message.get('text', '{}'))
                    # Remove sensitive fields
                    if 'password' in data:
                        data['password'] = '[REDACTED]'
                    if 'token' in data:
                        data['token'] = '[REDACTED]'
                    
                    logger.info(f"WebSocket message received: {client_ip} - {path} - {user_info} - Action: {data.get('action', 'Unknown')}")
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON in WebSocket message: {client_ip} - {path} - {user_info}")
            
            return message
        
        # Intercept send to monitor responses
        original_send = send
        
        async def send_wrapper(message):
            # Log message type
            if message['type'] == 'websocket.accept':
                logger.info(f"WebSocket accepted: {client_ip} - {path} - {user_info}")
            elif message['type'] == 'websocket.close':
                logger.info(f"WebSocket closed by server: {client_ip} - {path} - {user_info} - Code: {message.get('code', 'Unknown')}")
            elif message['type'] == 'websocket.send':
                # Log response type (excluding sensitive data)
                try:
                    if 'text' in message:
                        data = json.loads(message['text'])
                        logger.info(f"WebSocket response sent: {client_ip} - {path} - {user_info} - Type: {data.get('type', 'Unknown')}")
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON in WebSocket response: {client_ip} - {path} - {user_info}")
            
            return await original_send(message)
        
        # Call the next middleware with wrapped receive and send
        return await super().__call__(scope, receive_wrapper, send_wrapper)