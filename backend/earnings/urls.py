"""
Purpose: URL routing for earnings API
Connected to: Earnings views and main URL configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import debug_views
from . import simple_views

# Create a router for the viewsets
router = DefaultRouter()
router.register(r'records', views.EarningsViewSet, basename='earnings-records')
router.register(r'fee-configs', views.SessionFeeConfigViewSet, basename='fee-configs')
router.register(r'fee-changes', views.FeeChangeLogViewSet, basename='fee-changes')
router.register(r'distribution-configs', views.RevenueDistributionConfigViewSet, basename='distribution-configs')
router.register(r'financial-dashboard', views.FinancialDashboardViewSet, basename='financial-dashboard')

urlpatterns = [
    # Debug URL for troubleshooting
    path('debug/', debug_views.debug_urls, name='debug-urls'),

    # Role-specific earnings endpoints - using the simplified view
    path('therapist/<int:therapist_id>/monthly/', simple_views.simple_therapist_monthly_earnings, name='therapist-monthly-earnings'),

    # Legacy URL pattern used by TherapistDashboard.jsx
    path('monthly/<int:therapist_id>/', simple_views.simple_therapist_monthly_earnings, name='legacy-monthly-earnings'),

    # Include the router URLs
    path('', include(router.urls)),
]