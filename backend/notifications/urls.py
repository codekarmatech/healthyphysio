"""
Purpose: URL routing for notifications
Connected to: Notification views and API endpoints
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.NotificationViewSet, basename='notification')

admin_router = DefaultRouter()
admin_router.register(r'', views.AdminNotificationViewSet, basename='admin-notification')

urlpatterns = [
    path('', include(router.urls)),
    path('admin/', include(admin_router.urls)),
]
