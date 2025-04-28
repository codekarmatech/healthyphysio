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
    TherapistDashboardSummaryViewSet, AdminDashboardSummaryViewSet
)

router = DefaultRouter()
# these will all be under /api/users/
router.register(r'users', UserViewSet, basename='user')
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'therapists', TherapistViewSet, basename='therapist')
router.register(r'doctors', DoctorViewSet, basename='doctor')

urlpatterns = [
    # —— AUTHENTICATION —— all routes here will be prefixed with /api/auth/…
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),    # if you still need your custom view
    path('register/', views.register_user, name='register_user'),
    path('me/', views.UserViewSet.as_view({'get': 'me'}), name='user-me'),
    

    # —— USER PROFILES —— everything here will be prefixed with /api/users/…
    path('', include(router.urls)),
    
    # Therapist approval endpoints
    path('therapist-status/', views.TherapistStatusView.as_view(), name='therapist-status'),
    path('therapists/<int:pk>/status/', views.TherapistStatusDetailView.as_view(), name='therapist-status-detail'),
    path('therapists/<int:therapist_id>/status/', views.TherapistStatusDetailView.as_view(), name='therapist-status-detail-alt'),
    path('pending-therapists/', views.PendingTherapistsView.as_view(), name='pending-therapists'),
    path('approve-therapist/<int:pk>/', views.ApproveTherapistView.as_view(), name='approve-therapist'),
    
    # Dashboard summary endpoints
    path('therapist/dashboard/summary/', TherapistDashboardSummaryViewSet.as_view({'get': 'list'}), name='therapist-dashboard-summary'),
    path('patient/dashboard/summary/', PatientDashboardSummaryViewSet.as_view({'get': 'list'}), name='patient-dashboard-summary'),
    path('doctor/dashboard/summary/', DoctorDashboardSummaryViewSet.as_view({'get': 'list'}), name='doctor-dashboard-summary'),
    path('admin/dashboard/summary/', AdminDashboardSummaryViewSet.as_view({'get': 'list'}), name='admin-dashboard-summary'),
]
