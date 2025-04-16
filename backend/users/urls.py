"""
Purpose: URL routing for user-related endpoints
Connected to: User views and authentication
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'patients', views.PatientViewSet)
router.register(r'therapists', views.TherapistViewSet)
router.register(r'doctors', views.DoctorViewSet)


urlpatterns = [
    path('', include(router.urls)),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/patient/step1/', views.PatientSignupStep1View.as_view(), name='patient-register-step1'),
    path('auth/register/patient/step2/', views.PatientSignupStep2View.as_view(), name='patient-register-step2'),
    path('auth/register/patient/step3/', views.PatientSignupStep3View.as_view(), name='patient-register-step3'),
]
