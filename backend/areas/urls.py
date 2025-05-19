"""
Purpose: URL routing for area management
Connected to: Area views
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'areas', views.AreaViewSet)
router.register(r'therapist-areas', views.TherapistServiceAreaViewSet)
router.register(r'patient-areas', views.PatientAreaViewSet)
router.register(r'doctor-areas', views.DoctorAreaViewSet)
router.register(r'dashboard', views.AreaDashboardViewSet, basename='area-dashboard')

urlpatterns = [
    path('', include(router.urls)),
]
