"""
Purpose: Admin configuration for scheduling models
Connected to: Django admin interface
"""

from django.contrib import admin
from .models import Appointment, RescheduleRequest

class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('session_code', 'patient', 'therapist', 'datetime', 'status', 'reschedule_count')
    list_filter = ('status', 'datetime')
    search_fields = ('session_code', 'patient__user__username', 'therapist__user__username')
    readonly_fields = ('session_code',)

class RescheduleRequestAdmin(admin.ModelAdmin):
    list_display = ('appointment', 'requested_by', 'requested_datetime', 'status')
    list_filter = ('status', 'requested_datetime')
    search_fields = ('appointment__session_code', 'requested_by__username')

admin.site.register(Appointment, AppointmentAdmin)
admin.site.register(RescheduleRequest, RescheduleRequestAdmin)
