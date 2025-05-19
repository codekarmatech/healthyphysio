from django.contrib import admin
from .models import (
    TreatmentPlan, TreatmentPlanVersion, TreatmentPlanChangeRequest,
    DailyTreatment, Intervention, TreatmentSession
)

class DailyTreatmentInline(admin.TabularInline):
    model = DailyTreatment
    extra = 1

@admin.register(TreatmentPlan)
class TreatmentPlanAdmin(admin.ModelAdmin):
    list_display = ('title', 'patient', 'created_by', 'status', 'start_date', 'created_at')
    list_filter = ('status', 'start_date', 'created_at')
    search_fields = ('title', 'patient__user__username', 'created_by__username')
    date_hierarchy = 'created_at'
    inlines = [DailyTreatmentInline]
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('title', 'description', 'patient', 'created_by')
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date')
        }),
        ('Status', {
            'fields': ('status', 'approved_by', 'approved_at')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(TreatmentPlanChangeRequest)
class TreatmentPlanChangeRequestAdmin(admin.ModelAdmin):
    list_display = ('treatment_plan', 'requested_by', 'status', 'urgency', 'created_at')
    list_filter = ('status', 'urgency', 'created_at')
    search_fields = ('treatment_plan__title', 'requested_by__username')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'resolved_at')

@admin.register(Intervention)
class InterventionAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'description', 'category')

@admin.register(DailyTreatment)
class DailyTreatmentAdmin(admin.ModelAdmin):
    list_display = ('treatment_plan', 'day_number', 'title')
    list_filter = ('treatment_plan',)
    search_fields = ('title', 'description', 'treatment_plan__title')

@admin.register(TreatmentSession)
class TreatmentSessionAdmin(admin.ModelAdmin):
    list_display = ('treatment_plan', 'therapist', 'patient', 'scheduled_date', 'status')
    list_filter = ('status', 'scheduled_date')
    search_fields = ('treatment_plan__title', 'therapist__user__username', 'patient__user__username')
    date_hierarchy = 'scheduled_date'
    readonly_fields = ('completed_at',)

# Register TreatmentPlanVersion
admin.site.register(TreatmentPlanVersion)
