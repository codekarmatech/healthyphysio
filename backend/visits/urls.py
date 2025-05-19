"""
Purpose: URL routing for visit tracking and therapist reports
Connected to: Visit views, location tracking, and report management
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'visits', views.VisitViewSet)
router.register(r'locations', views.LocationUpdateViewSet)
router.register(r'alerts', views.ProximityAlertViewSet)
router.register(r'reports', views.TherapistReportViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
