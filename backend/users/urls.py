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

router = DefaultRouter()
# these will all be under /api/users/
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'patients', views.PatientViewSet, basename='patient')
router.register(r'therapists', views.TherapistViewSet, basename='therapist')
router.register(r'doctors', views.DoctorViewSet, basename='doctor')

urlpatterns = [
    # —— AUTHENTICATION —— all routes here will be prefixed with /api/auth/…
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),    # if you still need your custom view
    path('register/', views.register_user, name='register_user'),
    path('me/', views.UserViewSet.as_view({'get': 'me'}), name='user-me'),

    # —— USER PROFILES —— everything here will be prefixed with /api/users/…
    path('', include(router.urls)),

]
