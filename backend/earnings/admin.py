from django.contrib import admin
from .models import EarningRecord, SessionFeeConfig, FeeChangeLog, RevenueDistributionConfig

class FeeChangeLogInline(admin.TabularInline):
    model = FeeChangeLog
    extra = 0
    readonly_fields = ('previous_fee', 'new_fee', 'changed_by', 'changed_at')
    can_delete = False

@admin.register(EarningRecord)
class EarningRecordAdmin(admin.ModelAdmin):
    list_display = ('therapist', 'patient', 'date', 'session_type', 'amount', 'admin_amount', 'therapist_amount', 'doctor_amount', 'status', 'payment_status')
    list_filter = ('status', 'payment_status', 'date')
    search_fields = ('therapist__user__username', 'patient__user__username', 'session_type')
    date_hierarchy = 'date'
    fieldsets = (
        (None, {
            'fields': ('therapist', 'patient', 'date', 'session_type')
        }),
        ('Financial Information', {
            'fields': ('amount', 'full_amount', 'admin_amount', 'therapist_amount', 'doctor_amount')
        }),
        ('Status', {
            'fields': ('status', 'payment_status', 'payment_date')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
    )

@admin.register(SessionFeeConfig)
class SessionFeeConfigAdmin(admin.ModelAdmin):
    list_display = ('patient', 'base_fee', 'custom_fee', 'current_fee', 'created_by', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('patient__user__first_name', 'patient__user__last_name')
    readonly_fields = ('created_by', 'created_at', 'updated_at')
    inlines = [FeeChangeLogInline]
    fieldsets = (
        (None, {
            'fields': ('patient', 'base_fee', 'custom_fee')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )

@admin.register(FeeChangeLog)
class FeeChangeLogAdmin(admin.ModelAdmin):
    list_display = ('fee_config', 'previous_fee', 'new_fee', 'changed_by', 'changed_at')
    list_filter = ('changed_at',)
    search_fields = ('fee_config__patient__user__first_name', 'fee_config__patient__user__last_name')
    readonly_fields = ('fee_config', 'previous_fee', 'new_fee', 'changed_by', 'changed_at')
    fieldsets = (
        (None, {
            'fields': ('fee_config', 'previous_fee', 'new_fee')
        }),
        ('Reason', {
            'fields': ('reason',)
        }),
        ('Metadata', {
            'fields': ('changed_by', 'changed_at')
        }),
    )

@admin.register(RevenueDistributionConfig)
class RevenueDistributionConfigAdmin(admin.ModelAdmin):
    list_display = ('name', 'distribution_type', 'admin_value', 'therapist_value', 'doctor_value', 'is_default', 'created_by')
    list_filter = ('distribution_type', 'is_default', 'created_at')
    search_fields = ('name',)
    readonly_fields = ('created_by', 'created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('name', 'is_default', 'distribution_type')
        }),
        ('Distribution Values', {
            'fields': ('admin_value', 'therapist_value', 'doctor_value')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )
