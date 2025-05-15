from django.contrib import admin
from .models import Visit, LocationUpdate, ProximityAlert, TherapistReport

class LocationUpdateInline(admin.TabularInline):
    model = LocationUpdate
    extra = 0
    readonly_fields = ('user', 'latitude', 'longitude', 'accuracy', 'timestamp')
    can_delete = False
    max_num = 10
    ordering = ('-timestamp',)

class TherapistReportInline(admin.TabularInline):
    model = TherapistReport
    extra = 0
    readonly_fields = ('therapist', 'patient', 'report_date', 'status', 'submitted_at')
    can_delete = False
    max_num = 5
    ordering = ('-report_date',)

@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ('id', 'therapist', 'patient', 'status', 'scheduled_start', 'actual_start', 'actual_end')
    list_filter = ('status', 'scheduled_start', 'therapist', 'patient')
    search_fields = ('therapist__user__username', 'patient__user__username', 'appointment__session_code')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'scheduled_start'
    inlines = [LocationUpdateInline, TherapistReportInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('appointment', 'therapist', 'patient', 'status')
        }),
        ('Schedule', {
            'fields': ('scheduled_start', 'scheduled_end', 'actual_start', 'actual_end')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(LocationUpdate)
class LocationUpdateAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'visit', 'latitude', 'longitude', 'accuracy', 'timestamp')
    list_filter = ('timestamp', 'user')
    search_fields = ('user__username', 'visit__therapist__user__username', 'visit__patient__user__username')
    readonly_fields = ('timestamp',)
    date_hierarchy = 'timestamp'
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'visit')
        }),
        ('Location Data', {
            'fields': ('latitude', 'longitude', 'accuracy', 'timestamp')
        }),
    )

@admin.register(ProximityAlert)
class ProximityAlertAdmin(admin.ModelAdmin):
    list_display = ('id', 'therapist', 'patient', 'distance', 'severity', 'status', 'created_at')
    list_filter = ('status', 'severity', 'created_at')
    search_fields = ('therapist__user__username', 'patient__user__username')
    readonly_fields = ('created_at', 'acknowledged_at')
    date_hierarchy = 'created_at'
    fieldsets = (
        ('People Involved', {
            'fields': ('therapist', 'patient')
        }),
        ('Location Information', {
            'fields': ('therapist_location', 'patient_location', 'distance')
        }),
        ('Alert Details', {
            'fields': ('severity', 'status', 'created_at', 'acknowledged_at', 'acknowledged_by', 'resolution_notes')
        }),
    )
    actions = ['acknowledge_alerts', 'resolve_alerts', 'mark_as_false_alarm']

    def acknowledge_alerts(self, request, queryset):
        for alert in queryset.filter(status=ProximityAlert.Status.ACTIVE):
            alert.acknowledge(request.user)
        self.message_user(request, f"{queryset.count()} alerts acknowledged.")
    acknowledge_alerts.short_description = "Acknowledge selected alerts"

    def resolve_alerts(self, request, queryset):
        for alert in queryset.filter(status=ProximityAlert.Status.ACKNOWLEDGED):
            alert.resolve("Resolved by admin")
        self.message_user(request, f"{queryset.count()} alerts resolved.")
    resolve_alerts.short_description = "Resolve selected alerts"

    def mark_as_false_alarm(self, request, queryset):
        for alert in queryset:
            alert.mark_false_alarm("Marked as false alarm by admin")
        self.message_user(request, f"{queryset.count()} alerts marked as false alarm.")
    mark_as_false_alarm.short_description = "Mark selected alerts as false alarm"

@admin.register(TherapistReport)
class TherapistReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'therapist', 'patient', 'report_date', 'status', 'submitted_at', 'reviewed_at')
    list_filter = ('status', 'report_date', 'submitted_at')
    search_fields = ('therapist__user__username', 'patient__user__username', 'content')
    readonly_fields = ('history', 'created_at', 'updated_at', 'submitted_at', 'reviewed_at')
    date_hierarchy = 'report_date'
    fieldsets = (
        ('Report Information', {
            'fields': ('therapist', 'patient', 'visit', 'session', 'report_date', 'content')
        }),
        ('Status', {
            'fields': ('status', 'submitted_at', 'reviewed_at', 'reviewed_by', 'review_notes')
        }),
        ('History', {
            'fields': ('history',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    actions = ['review_reports', 'flag_reports']

    def review_reports(self, request, queryset):
        for report in queryset.filter(status=TherapistReport.Status.SUBMITTED):
            report.review(request.user, "Reviewed by admin")
        self.message_user(request, f"{queryset.count()} reports reviewed.")
    review_reports.short_description = "Mark selected reports as reviewed"

    def flag_reports(self, request, queryset):
        for report in queryset:
            report.flag(request.user, "Flagged for review by admin")
        self.message_user(request, f"{queryset.count()} reports flagged for review.")
    flag_reports.short_description = "Flag selected reports for review"
