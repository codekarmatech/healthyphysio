"""
Purpose: URL routing for attendance-related endpoints
Connected to: Attendance views and holidays
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.AttendanceViewSet, basename='attendance')
router.register(r'holidays', views.HolidayViewSet)

urlpatterns = [
    path('', include(router.urls)),
]