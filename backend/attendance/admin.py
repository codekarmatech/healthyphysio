"""
Purpose: Admin configuration for attendance models
Connected to: Django admin interface
"""

from django.contrib import admin
from .models import Session, Assessment, AssessmentVersion

class SessionAdmin(admin.ModelAdmin):
    list_display = ('appointment', 'status', 'check_in', 'check_out', 'rating')
    list_filter = ('status', 'check_in', 'check_out')
    search_fields = ('appointment__session_code', 'appointment__patient__user__username')

class AssessmentAdmin(admin.ModelAdmin):
    list_display = ('session', 'shared_with_patient', 'created_at', 'updated_at')
    list_filter = ('shared_with_patient', 'created_at')
    search_fields = ('session__appointment__session_code',)

class AssessmentVersionAdmin(admin.ModelAdmin):
    list_display = ('assessment', 'edited_by', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('assessment__session__appointment__session_code',)

admin.site.register(Session, SessionAdmin)
admin.site.register(Assessment, AssessmentAdmin)
admin.site.register(AssessmentVersion, AssessmentVersionAdmin)
