"""
Purpose: URL routing for attendance-related endpoints
Connected to: Attendance views, seesions, assessments, and holidays
Fields:
  - attendance_date: Date of attendance
  - user: User who attended
  - status: Attendance status (e.g., present, absent, late)
  - notes: Additional notes
  - created_at: Timestamp when attendance record was created
  - updated_at: Timestamp when attendance record was last updated
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.AttendanceViewSet, basename='attendance')
router.register(r'holidays', views.HolidayViewSet)
# Remove the SessionViewSet and AssessmentViewSet registrations
urlpatterns = [
    path('', include(router.urls)),
]