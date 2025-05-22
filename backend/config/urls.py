"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

"""
Purpose: Main URL routing for the project
Connected to: All app URLs
"""

"""
URL Configuration for PhysioWay
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import CustomTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/users/', include('users.urls')),
    # Add a direct route for therapists to match the frontend URL pattern
    path('api/therapists/', include('users.urls')),
    path('api/auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/scheduling/', include('scheduling.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/audit-logs/', include('audit_logs.urls')),
    path('api/assessments/', include('assessments.urls')),
    path('api/areas/', include('areas.urls')),
    path('api/equipment/', include('equipment.urls')),
    # Earnings API endpoints
    path('api/earnings/', include('earnings.urls')),
    # Visit tracking and therapist reports
    path('api/visits/', include('visits.urls')),
    # Treatment plans
    path('api/treatment-plans/', include('treatment_plans.urls')),
    # Area management
    path('api/areas/', include('areas.urls')),
    # Notifications
    path('api/notifications/', include('notifications.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
