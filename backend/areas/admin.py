"""
Purpose: Admin configuration for area models
Connected to: Django admin interface
"""

from django.contrib import admin
from .models import Area, TherapistServiceArea, PatientArea, DoctorArea, AreaRelationship

class TherapistServiceAreaInline(admin.TabularInline):
    model = TherapistServiceArea
    extra = 1
    autocomplete_fields = ['therapist']

class PatientAreaInline(admin.TabularInline):
    model = PatientArea
    extra = 1
    autocomplete_fields = ['patient']

class DoctorAreaInline(admin.TabularInline):
    model = DoctorArea
    extra = 1
    autocomplete_fields = ['doctor']

class AreaRelationshipInline(admin.TabularInline):
    model = AreaRelationship
    extra = 1
    autocomplete_fields = ['therapist', 'patient', 'doctor']

@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'state', 'zip_code', 'therapist_count', 'patient_count', 'doctor_count')
    list_filter = ('state', 'city')
    search_fields = ('name', 'city', 'state', 'zip_code')
    inlines = [TherapistServiceAreaInline, PatientAreaInline, DoctorAreaInline, AreaRelationshipInline]

    def therapist_count(self, obj):
        return obj.therapists.count()

    def patient_count(self, obj):
        return obj.patients.count()

    def doctor_count(self, obj):
        return obj.doctors.count()

    therapist_count.short_description = 'Therapists'
    patient_count.short_description = 'Patients'
    doctor_count.short_description = 'Doctors'

@admin.register(TherapistServiceArea)
class TherapistServiceAreaAdmin(admin.ModelAdmin):
    list_display = ('therapist', 'area', 'priority')
    list_filter = ('priority', 'area')
    search_fields = ('therapist__user__first_name', 'therapist__user__last_name', 'area__name')
    autocomplete_fields = ['therapist', 'area']

@admin.register(PatientArea)
class PatientAreaAdmin(admin.ModelAdmin):
    list_display = ('patient', 'area')
    list_filter = ('area',)
    search_fields = ('patient__user__first_name', 'patient__user__last_name', 'area__name')
    autocomplete_fields = ['patient', 'area']

@admin.register(DoctorArea)
class DoctorAreaAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'area')
    list_filter = ('area',)
    search_fields = ('doctor__user__first_name', 'doctor__user__last_name', 'area__name')
    autocomplete_fields = ['doctor', 'area']

@admin.register(AreaRelationship)
class AreaRelationshipAdmin(admin.ModelAdmin):
    list_display = ('area', 'relationship_type', 'get_relationship_description')
    list_filter = ('area', 'relationship_type')
    search_fields = ('area__name', 'therapist__user__first_name', 'patient__user__first_name', 'doctor__user__first_name')
    autocomplete_fields = ['area', 'therapist', 'patient', 'doctor']

    def get_relationship_description(self, obj):
        if obj.relationship_type == 'therapist_patient':
            return f"{obj.therapist.user.get_full_name()} - {obj.patient.user.get_full_name()}"
        elif obj.relationship_type == 'doctor_patient':
            return f"{obj.doctor.user.get_full_name()} - {obj.patient.user.get_full_name()}"
        else:
            return f"{obj.doctor.user.get_full_name()} - {obj.therapist.user.get_full_name()}"

    get_relationship_description.short_description = 'Relationship'
