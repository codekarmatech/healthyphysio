"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from websocket.middleware import JWTAuthMiddleware
from monitoring.websocket_monitor import WebSocketMonitorMiddleware
import websocket.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AllowedHostsOriginValidator(
        WebSocketMonitorMiddleware(
            JWTAuthMiddleware(
                URLRouter(
                    websocket.routing.websocket_urlpatterns
                )
            )
        )
    ),
})