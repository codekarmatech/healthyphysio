"""
Purpose: URL routing for equipment API
Connected to: Equipment views and main URL configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet)
router.register(r'equipment', views.EquipmentViewSet)
router.register(r'allocations', views.EquipmentAllocationViewSet)
router.register(r'requests', views.AllocationRequestViewSet)

urlpatterns = [
    path('', include(router.urls)),
]