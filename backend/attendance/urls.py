"""
Purpose: URL routing for attendance-related endpoints
Connected to: Session views
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'sessions', views.SessionViewSet)
router.register(r'assessments', views.AssessmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('approve-checkin/<str:session_code>/', views.approve_checkin, name='approve_checkin'),
]