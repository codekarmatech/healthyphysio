"""
Purpose: URL routing for attendance-related endpoints
Connected to: Attendance views, holidays, and leave applications
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'holidays', views.HolidayViewSet)
router.register(r'leave', views.LeaveViewSet, basename='leave')
router.register(r'change-requests', views.AttendanceChangeRequestViewSet, basename='attendance-change-request')
router.register(r'availability', views.AvailabilityViewSet, basename='availability')
router.register(r'session-time', views.SessionTimeLogViewSet, basename='session-time-log')
router.register(r'patient-concerns', views.PatientConcernViewSet, basename='patient-concern')
router.register(r'', views.AttendanceViewSet, basename='attendance')

urlpatterns = [
    path('availability/', views.get_availability, name='get_availability'),
    path('', include(router.urls)),
    # Add specific endpoints for leave applications
    path('leave/apply/', views.LeaveViewSet.as_view({'post': 'create'}), name='leave-apply'),
    path('leave/<int:pk>/approve/', views.LeaveViewSet.as_view({'put': 'approve'}), name='leave-approve'),
    path('leave/<int:pk>/reject/', views.LeaveViewSet.as_view({'put': 'reject'}), name='leave-reject'),
    path('leave/<int:pk>/cancel/', views.LeaveViewSet.as_view({'put': 'cancel'}), name='leave-cancel'),
    path('leave/therapist/<int:therapist_id>/', views.LeaveViewSet.as_view({'get': 'therapist_leaves'}), name='therapist-leaves'),

    # Add specific endpoints for attendance change requests
    path('change-requests/<int:pk>/approve/', views.AttendanceChangeRequestViewSet.as_view({'put': 'approve'}), name='change-request-approve'),
    path('change-requests/<int:pk>/reject/', views.AttendanceChangeRequestViewSet.as_view({'put': 'reject'}), name='change-request-reject'),

    # Add endpoint for requesting changes to attendance
    path('<int:pk>/request-change/', views.AttendanceViewSet.as_view({'post': 'request_change'}), name='attendance-request-change'),

    # Add explicit endpoint for monthly summary (with and without trailing slash)
    path('monthly-summary', views.AttendanceViewSet.as_view({'get': 'monthly_summary'}), name='attendance-monthly-summary-no-slash'),
    path('monthly-summary/', views.AttendanceViewSet.as_view({'get': 'monthly_summary'}), name='attendance-monthly-summary'),

    # Add explicit endpoint for change requests by status
    path('change-requests/status/<str:status>/', views.AttendanceChangeRequestViewSet.as_view({'get': 'list'}), name='change-requests-by-status'),

    # Add explicit endpoint for availability monthly summary
    path('availability/monthly-summary', views.AvailabilityViewSet.as_view({'get': 'monthly_summary'}), name='availability-monthly-summary-no-slash'),
    path('availability/monthly-summary/', views.AvailabilityViewSet.as_view({'get': 'monthly_summary'}), name='availability-monthly-summary'),
]