"""
Purpose: URL routing for earnings API
Connected to: Earnings views and main URL configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import debug_views
from . import simple_views
from . import financial_views
from . import attendance_analytics_views
from . import payment_views

# Create a router for the viewsets
router = DefaultRouter()
router.register(r'records', views.EarningsViewSet, basename='earnings-records')
router.register(r'fee-configs', views.SessionFeeConfigViewSet, basename='fee-configs')
router.register(r'fee-changes', views.FeeChangeLogViewSet, basename='fee-changes')
router.register(r'distribution-configs', views.RevenueDistributionConfigViewSet, basename='distribution-configs')
router.register(r'financial-dashboard', views.FinancialDashboardViewSet, basename='financial-dashboard')

# Payment management endpoints
router.register(r'payment-management', payment_views.PaymentManagementViewSet, basename='payment-management')

# Financial management endpoints
router.register(r'patients/financial-list', financial_views.PatientFinancialViewSet, basename='patient-financial')
router.register(r'therapists/financial-list', financial_views.TherapistFinancialViewSet, basename='therapist-financial')
router.register(r'appointments/financial-list', financial_views.AppointmentFinancialViewSet, basename='appointment-financial')

# Attendance analytics endpoints
router.register(r'attendance-impact', attendance_analytics_views.AttendanceImpactViewSet, basename='attendance-impact')
router.register(r'therapist-consistency', attendance_analytics_views.TherapistConsistencyViewSet, basename='therapist-consistency')
router.register(r'patient-behavior', attendance_analytics_views.PatientBehaviorViewSet, basename='patient-behavior')

urlpatterns = [
    # Debug URL for troubleshooting
    path('debug/', debug_views.debug_urls, name='debug-urls'),

    # Role-specific earnings endpoints - using the simplified view
    path('therapist/<int:therapist_id>/monthly/', simple_views.simple_therapist_monthly_earnings, name='therapist-monthly-earnings'),

    # Therapist payment history endpoint
    path('therapist/<int:therapist_id>/payment-history/', payment_views.therapist_payment_history, name='therapist-payment-history'),

    # Patient payment history endpoint
    path('patient/payment-history/', payment_views.patient_payment_history, name='patient-payment-history'),

    # Legacy URL pattern used by TherapistDashboard.jsx
    path('monthly/<int:therapist_id>/', simple_views.simple_therapist_monthly_earnings, name='legacy-monthly-earnings'),

    # Apply distribution endpoint
    path('apply-distribution/', financial_views.apply_distribution, name='apply-distribution'),

    # Include the router URLs
    path('', include(router.urls)),
]