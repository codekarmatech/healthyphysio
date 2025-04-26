"""
Purpose: Admin configuration for attendance models
Connected to: Django admin interface
"""

from django.contrib import admin
from .models import Holiday, Attendance

@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ('name', 'date')
    search_fields = ('name',)

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('therapist', 'date', 'status', 'submitted_at', 'approved_by', 'approved_at')
    list_filter = ('status', 'date', 'approved_by')
    search_fields = (
        'therapist__user__username', 
        'therapist__user__first_name',
        'therapist__user__last_name',
    )
