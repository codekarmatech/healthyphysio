# Update the URL pattern in the main urls.py file
# From:
# path('api/', include('audit_logs.urls'))
# To:
# path('api/audit-logs/', include('audit_logs.urls'))
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.AuditLogViewSet)  # Changed from 'audit-logs' to '' to avoid double prefix

urlpatterns = [
    path('', include(router.urls)),
]