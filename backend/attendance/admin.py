"""
Purpose: Admin configuration for attendance models
Connected to: Django admin interface
"""

from django.contrib import admin
from .models import Holiday, Attendance, Leave
from .admin_requests import AttendanceChangeRequest

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

@admin.register(Leave)
class LeaveAdmin(admin.ModelAdmin):
    list_display = ('therapist', 'start_date', 'end_date', 'leave_type', 'status', 'submitted_at')
    list_filter = ('status', 'leave_type', 'start_date')
    search_fields = (
        'therapist__user__username', 
        'therapist__user__first_name',
        'therapist__user__last_name',
    )

@admin.register(AttendanceChangeRequest)
class AttendanceChangeRequestAdmin(admin.ModelAdmin):
    list_display = ('therapist', 'attendance', 'request_type', 'current_status', 
                   'requested_status', 'status', 'created_at')
    list_filter = ('status', 'request_type', 'created_at')
    search_fields = (
        'therapist__user__username', 
        'therapist__user__first_name',
        'therapist__user__last_name',
        'reason',
    )
