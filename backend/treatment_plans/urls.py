from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'treatment-plans', views.TreatmentPlanViewSet)
router.register(r'change-requests', views.TreatmentPlanChangeRequestViewSet)
router.register(r'interventions', views.InterventionViewSet)
router.register(r'daily-treatments', views.DailyTreatmentViewSet)
router.register(r'sessions', views.TreatmentSessionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
