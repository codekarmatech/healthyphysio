from django.db import models
from django.conf import settings
from scheduling.models import Appointment


class Assessment(models.Model):
    appointment = models.ForeignKey(
        'scheduling.Appointment',
        on_delete=models.CASCADE,
        related_name='assessments')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_assessments'
    )
    pending_admin_approval = models.BooleanField(default=True)
    approved_for_doctors = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Assessment {self.id} on appointment {self.appointment.session_code}"

class AssessmentVersion(models.Model):
    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name='versions'
    )
    edited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assessment_versions'   # <- unique here
    )
    data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']