"""
Site Settings URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SiteSettingsViewSet, ServiceViewSet

router = DefaultRouter()
router.register(r'', SiteSettingsViewSet, basename='site-settings')

services_router = DefaultRouter()
services_router.register(r'', ServiceViewSet, basename='services')

urlpatterns = [
    path('', include(router.urls)),
]

services_urlpatterns = [
    path('', include(services_router.urls)),
]
