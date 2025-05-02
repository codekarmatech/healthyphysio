"""
Purpose: Admin configuration for equipment models
Connected to: Django admin interface
"""

from django.contrib import admin
from django.utils import timezone
from .models import Category, Equipment, EquipmentAllocation, AllocationRequest

class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at')
    search_fields = ('name', 'description')

class EquipmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'serial_number', 'tracking_id', 'price', 'is_available', 'condition', 'purchase_date')
    list_filter = ('is_available', 'category', 'condition', 'purchase_date', 'has_serial_number')
    search_fields = ('name', 'serial_number', 'tracking_id', 'description')

class EquipmentAllocationAdmin(admin.ModelAdmin):
    list_display = ('equipment', 'therapist', 'patient', 'allocation_date', 'expected_return_date', 'status', 'location')
    list_filter = ('status', 'location', 'allocation_date')
    search_fields = ('equipment__name', 'therapist__user__username', 'patient__user__username')
    date_hierarchy = 'allocation_date'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Update status for any overdue allocations
        for allocation in qs:
            if allocation.is_overdue() and allocation.status != allocation.Status.OVERDUE:
                allocation.status = allocation.Status.OVERDUE
                allocation.save(update_fields=['status'])
        return qs

class AllocationRequestAdmin(admin.ModelAdmin):
    list_display = ('equipment', 'therapist', 'patient', 'requested_date', 'requested_until', 'status', 'location')
    list_filter = ('status', 'location', 'requested_date')
    search_fields = ('equipment__name', 'therapist__user__username', 'patient__user__username')
    date_hierarchy = 'requested_date'
    
    actions = ['approve_requests', 'reject_requests']
    
    def approve_requests(self, request, queryset):
        for allocation_request in queryset.filter(status=AllocationRequest.Status.PENDING):
            # Create an equipment allocation
            EquipmentAllocation.objects.create(
                equipment=allocation_request.equipment,
                therapist=allocation_request.therapist,
                patient=allocation_request.patient,
                allocated_by=request.user,
                allocation_date=allocation_request.requested_date,
                expected_return_date=allocation_request.requested_until,
                status=EquipmentAllocation.Status.APPROVED,
                location=allocation_request.location,
                notes=f"Automatically created from request: {allocation_request.reason}"
            )
            
            # Update the request status
            allocation_request.status = AllocationRequest.Status.APPROVED
            allocation_request.admin_notes = f"Approved by {request.user.username} on {timezone.now()}"
            allocation_request.save()
            
            # Update equipment availability
            equipment = allocation_request.equipment
            equipment.is_available = False
            equipment.save()
            
    approve_requests.short_description = "Approve selected allocation requests"
    
    def reject_requests(self, request, queryset):
        queryset.filter(status=AllocationRequest.Status.PENDING).update(
            status=AllocationRequest.Status.REJECTED,
            admin_notes=f"Rejected by {request.user.username} on {timezone.now()}"
        )
    reject_requests.short_description = "Reject selected allocation requests"

admin.site.register(Category, CategoryAdmin)
admin.site.register(Equipment, EquipmentAdmin)
admin.site.register(EquipmentAllocation, EquipmentAllocationAdmin)
admin.site.register(AllocationRequest, AllocationRequestAdmin)

# Register your models here.
