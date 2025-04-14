"""
Purpose: Admin configuration for user models
Connected to: Django admin interface
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Patient, Therapist, Doctor

class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role Information', {'fields': ('role', 'phone')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Role Information', {'fields': ('role', 'phone')}),
    )

class PatientAdmin(admin.ModelAdmin):
    list_display = ('user', 'date_of_birth')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name')

class TherapistAdmin(admin.ModelAdmin):
    list_display = ('user', 'license_number', 'specialization')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name', 'license_number')

class DoctorAdmin(admin.ModelAdmin):
    list_display = ('user', 'license_number', 'specialization')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name', 'license_number')

admin.site.register(User, UserAdmin)
admin.site.register(Patient, PatientAdmin)
admin.site.register(Therapist, TherapistAdmin)
admin.site.register(Doctor, DoctorAdmin)
