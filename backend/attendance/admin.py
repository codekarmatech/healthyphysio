"""
Purpose: Admin configuration for attendance models
Connected to: Django admin interface
"""

from django.contrib import admin
from django.urls import path
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.contrib import messages
from django.utils.safestring import mark_safe
from .models import Holiday, Attendance, Leave
from .admin_requests import AttendanceChangeRequest

@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ('name', 'date')
    search_fields = ('name',)

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('therapist', 'date', 'status', 'changed_from', 'submitted_at', 'approved_by', 'approved_at')
    list_filter = ('status', 'date', 'approved_by')
    search_fields = (
        'therapist__user__username', 
        'therapist__user__first_name',
        'therapist__user__last_name',
    )
    readonly_fields = ('changed_from', 'submitted_at')
    
    fieldsets = (
        ('Attendance Information', {
            'fields': ('therapist', 'date', 'status', 'changed_from', 'is_paid')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Approval Information', {
            'fields': ('approved_by', 'approved_at')
        }),
        ('Submission Information', {
            'fields': ('submitted_at',),
            'classes': ('collapse',)
        }),
    )
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        # Restrict approved_by field to only show admin users
        if db_field.name == "approved_by":
            kwargs["queryset"] = db_field.related_model.objects.filter(role='admin')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(Leave)
class LeaveAdmin(admin.ModelAdmin):
    list_display = ('therapist', 'start_date', 'end_date', 'leave_type', 'status', 'submitted_at')
    list_filter = ('status', 'leave_type', 'start_date')
    search_fields = (
        'therapist__user__username', 
        'therapist__user__first_name',
        'therapist__user__last_name',
    )
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        # Restrict approved_by field to only show admin users
        if db_field.name == "approved_by":
            kwargs["queryset"] = db_field.related_model.objects.filter(role='admin')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(AttendanceChangeRequest)
class AttendanceChangeRequestAdmin(admin.ModelAdmin):
    list_display = ('therapist', 'attendance', 'request_type', 'current_status', 
                   'requested_status', 'status', 'created_at', 'admin_actions')
    list_filter = ('status', 'request_type', 'created_at')
    search_fields = (
        'therapist__user__username', 
        'therapist__user__first_name',
        'therapist__user__last_name',
        'reason',
    )
    readonly_fields = ('therapist', 'attendance', 'request_type', 'current_status', 
                      'requested_status', 'reason', 'created_at', 'resolved_at', 'resolved_by',
                      'approval_actions', 'status')
    actions = ['approve_requests', 'reject_requests']
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        # Restrict resolved_by field to only show admin users
        if db_field.name == "resolved_by":
            kwargs["queryset"] = db_field.related_model.objects.filter(role='admin')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    fieldsets = (
        ('Request Information', {
            'fields': ('therapist', 'attendance', 'request_type', 'reason')
        }),
        ('Status Change', {
            'fields': ('current_status', 'requested_status')
        }),
        ('Actions', {
            'fields': ('approval_actions',)
        }),
        ('Resolution', {
            'fields': ('status', 'resolved_by', 'resolved_at')
        }),
    )
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:request_id>/approve/',
                self.admin_site.admin_view(self.approve_request_view),
                name='attendance_changerequest_approve',
            ),
            path(
                '<int:request_id>/reject/',
                self.admin_site.admin_view(self.reject_request_view),
                name='attendance_changerequest_reject',
            ),
        ]
        return custom_urls + urls
    
    def approval_actions(self, obj):
        """Display approval/rejection buttons in the detail view"""
        if obj.status == 'pending':
            approve_url = reverse('admin:attendance_changerequest_approve', args=[obj.pk])
            reject_url = reverse('admin:attendance_changerequest_reject', args=[obj.pk])
            
            # Add a parameter to redirect back to the detail page
            approve_url += '?return_to_detail=1'
            reject_url += '?return_to_detail=1'
            
            return mark_safe(f"""
            <a href="{approve_url}" class="button" style="background-color: #28a745; color: white; padding: 5px 10px; text-decoration: none; border-radius: 4px; margin-right: 10px;">Approve</a>
            <a href="{reject_url}" class="button" style="background-color: #dc3545; color: white; padding: 5px 10px; text-decoration: none; border-radius: 4px;">Reject</a>
            """)
        elif obj.status == 'approved':
            return f'Approved by {obj.resolved_by.username} at {obj.resolved_at}'
        elif obj.status == 'rejected':
            return f'Rejected by {obj.resolved_by.username} at {obj.resolved_at}'
        return '-'
    approval_actions.short_description = 'Approval Actions'
    
    def approve_request_view(self, request, request_id):
        """View to handle approval of a single request"""
        change_request = self.get_object(request, request_id)
        if change_request and change_request.status == 'pending':
            change_request.approve(request.user)
            messages.success(request, f'Attendance change request approved successfully.')
        else:
            messages.error(request, f'Could not approve request. It may have already been processed.')
        
        # Check if we should return to the detail page
        if 'return_to_detail' in request.GET:
            return HttpResponseRedirect(reverse('admin:attendance_attendancechangerequest_change', args=[request_id]))
            
        # Check if we came from the change form with filters
        if '_changelist_filters' in request.GET:
            # Redirect back to the changelist with filters preserved
            return HttpResponseRedirect(reverse('admin:attendance_attendancechangerequest_changelist') + 
                                       '?' + request.GET.get('_changelist_filters', ''))
        
        # Default: redirect back to the changelist
        return HttpResponseRedirect(reverse('admin:attendance_attendancechangerequest_changelist'))
    
    def reject_request_view(self, request, request_id):
        """View to handle rejection of a single request"""
        change_request = self.get_object(request, request_id)
        if change_request and change_request.status == 'pending':
            change_request.reject(request.user)
            messages.success(request, f'Attendance change request rejected successfully.')
        else:
            messages.error(request, f'Could not reject request. It may have already been processed.')
        
        # Check if we should return to the detail page
        if 'return_to_detail' in request.GET:
            return HttpResponseRedirect(reverse('admin:attendance_attendancechangerequest_change', args=[request_id]))
            
        # Check if we came from the change form with filters
        if '_changelist_filters' in request.GET:
            # Redirect back to the changelist with filters preserved
            return HttpResponseRedirect(reverse('admin:attendance_attendancechangerequest_changelist') + 
                                       '?' + request.GET.get('_changelist_filters', ''))
        
        # Default: redirect back to the changelist
        return HttpResponseRedirect(reverse('admin:attendance_attendancechangerequest_changelist'))
    
    def admin_actions(self, obj):
        """Custom column to show action buttons for pending requests in the list view"""
        if obj.status == 'pending':
            approve_url = reverse('admin:attendance_changerequest_approve', args=[obj.pk])
            reject_url = reverse('admin:attendance_changerequest_reject', args=[obj.pk])
            return mark_safe(f"""
            <a href="{approve_url}" class="button" style="background-color: #28a745; color: white; padding: 5px 10px; text-decoration: none; border-radius: 4px; margin-right: 10px;">Approve</a>
            <a href="{reject_url}" class="button" style="background-color: #dc3545; color: white; padding: 5px 10px; text-decoration: none; border-radius: 4px;">Reject</a>
            """)
        elif obj.status == 'approved':
            return f'Approved by {obj.resolved_by.username} at {obj.resolved_at}'
        elif obj.status == 'rejected':
            return f'Rejected by {obj.resolved_by.username} at {obj.resolved_at}'
        return '-'
    admin_actions.short_description = 'Actions'
    
    def approve_requests(self, request, queryset):
        """Admin action to approve multiple attendance change requests at once"""
        count = 0
        for change_request in queryset.filter(status='pending'):
            change_request.approve(request.user)
            count += 1
        
        self.message_user(
            request, 
            f"{count} attendance change request(s) approved successfully."
        )
    approve_requests.short_description = "Approve selected attendance change requests"
    
    def reject_requests(self, request, queryset):
        """Admin action to reject multiple attendance change requests at once"""
        count = 0
        for change_request in queryset.filter(status='pending'):
            change_request.reject(request.user)
            count += 1
        
        self.message_user(
            request, 
            f"{count} attendance change request(s) rejected successfully."
        )
    reject_requests.short_description = "Reject selected attendance change requests"
    
    def has_add_permission(self, request):
        """Only therapists can create change requests through the API"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Allow viewing the change form but not editing"""
        return True
    
    def save_model(self, request, obj, form, change):
        """Custom save to handle approval/rejection"""
        if not change:  # This is a new object
            super().save_model(request, obj, form, change)
        else:
            # For existing objects, we don't allow direct edits
            # Use the approve/reject actions instead
            pass
            
    def changeform_view(self, request, object_id=None, form_url='', extra_context=None):
        """Make all fields read-only in the change form"""
        extra_context = extra_context or {}
        extra_context['show_save'] = False
        extra_context['show_save_and_continue'] = False
        return super().changeform_view(request, object_id, form_url, extra_context)
