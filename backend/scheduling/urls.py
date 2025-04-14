"""
Purpose: URL routing for scheduling-related endpoints
Connected to: Appointment views
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'appointments', views.AppointmentViewSet)
router.register(r'reschedule-requests', views.RescheduleRequestViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('validate-session-code/<str:code>/', views.validate_session_code, name='validate_session_code'),
]