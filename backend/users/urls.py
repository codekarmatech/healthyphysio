"""
Purpose: URL routing for user-related endpoints
Connected to: User views and authentication
"""

# backend/users/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from . import views
from .views import (
    UserViewSet, PatientViewSet, TherapistViewSet, DoctorViewSet,
    PatientDashboardSummaryViewSet, DoctorDashboardSummaryViewSet,
    TherapistDashboardSummaryViewSet, AdminDashboardSummaryViewSet,
    TherapistAnalyticsViewSet, ProfileChangeRequestViewSet
)
# Import update_therapist_approvals from views.py directly
# from .views.therapist_approvals import update_therapist_approvals

router = DefaultRouter()
# these will all be under /api/users/
router.register(r'users', UserViewSet, basename='user')
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'therapists', TherapistViewSet, basename='therapist')
router.register(r'doctors', DoctorViewSet, basename='doctor')
router.register(r'profile-change-requests', ProfileChangeRequestViewSet, basename='profile-change-request')

urlpatterns = [
    # —— AUTHENTICATION —— all routes here will be prefixed with /api/auth/…
    path('token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),    # if you still need your custom view
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register_user, name='register_user'),
    path('me/', views.UserViewSet.as_view({'get': 'me'}), name='user-me'),


    # —— USER PROFILES —— everything here will be prefixed with /api/users/…
    path('', include(router.urls)),

    # Therapist approval endpoints
    # Current therapist's status (for therapists) or specified therapist (for admins with query param)
    path('therapist-status/', views.TherapistStatusView.as_view(), name='therapist-status'),

    # Specific therapist by ID - multiple URL patterns for flexibility and backward compatibility
    path('therapist-status/<int:therapist_id>/', views.TherapistStatusDetailView.as_view(), name='therapist-status-detail-by-id'),
    path('therapists/<int:pk>/status/', views.TherapistStatusDetailView.as_view(), name='therapist-status-detail'),
    path('therapists/<int:therapist_id>/status/', views.TherapistStatusDetailView.as_view(), name='therapist-status-detail-alt'),

    # No more hardcoded paths - all therapist status requests should use the dynamic paths above
    path('pending-therapists/', views.PendingTherapistsView.as_view(), name='pending-therapists'),
    path('approve-therapist/<int:pk>/', views.ApproveTherapistView.as_view(), name='approve-therapist'),

    # Feature-specific approvals
    path('therapists/<int:therapist_id>/approvals/', views.update_therapist_approvals, name='therapist-approvals'),

    # Dashboard summary endpoints
    path('therapist/dashboard/summary/', TherapistDashboardSummaryViewSet.as_view({'get': 'list'}), name='therapist-dashboard-summary'),
    # Add an additional URL pattern with hyphen instead of slash for consistency
    path('therapist-dashboard-summary/', TherapistDashboardSummaryViewSet.as_view({'get': 'list'}), name='therapist-dashboard-summary-alt'),
    path('patient/dashboard/summary/', PatientDashboardSummaryViewSet.as_view({'get': 'list'}), name='patient-dashboard-summary'),
    path('doctor/dashboard/summary/', DoctorDashboardSummaryViewSet.as_view({'get': 'list'}), name='doctor-dashboard-summary'),
    path('admin/dashboard/summary/', AdminDashboardSummaryViewSet.as_view({'get': 'list'}), name='admin-dashboard-summary'),

    # Therapist analytics endpoint
    path('therapist-analytics/', TherapistAnalyticsViewSet.as_view({'get': 'list'}), name='therapist-analytics'),
]
