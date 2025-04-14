"""
Purpose: WebSocket URL routing
Connected Endpoints: ws://localhost:8000/ws/
Validation: URL pattern validation
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/attendance/(?P<session_code>PT-\d{8}-[A-Z]{3}-[A-Z0-9]{4})/$', consumers.AttendanceConsumer.as_asgi()),
]