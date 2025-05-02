"""
Purpose: API views for equipment management
Connected to: Equipment URLs and frontend components
"""

from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from django.shortcuts import render
from .models import Category, Equipment, EquipmentAllocation, AllocationRequest
from .serializers import CategorySerializer, EquipmentSerializer, EquipmentAllocationSerializer, AllocationRequestSerializer
from users.models import User, Therapist, Patient
from users.permissions import IsAdminUser as IsAdmin, IsTherapistUser as IsTherapist, IsPatientUser as IsPatient

class CategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing equipment categories
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    
    def get_permissions(self):
        """
        Only admin can create, update or delete categories
        Therapists and patients can view categories
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

class EquipmentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing equipment
    """
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'serial_number', 'tracking_id']
    ordering_fields = ['name', 'price', 'purchase_date', 'is_available', 'category__name']
    
    def get_permissions(self):
        """
        Only admin can create, update or delete equipment
        Therapists and patients can view equipment
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter equipment by category if provided"""
        queryset = super().get_queryset()
        category_id = self.request.query_params.get('category', None)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get only available equipment"""
        queryset = self.get_queryset().filter(is_available=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def check_serial_number_exists(self, request):
        """Check if a serial number already exists"""
        serial_number = request.query_params.get('serial_number', None)
        exclude_id = request.query_params.get('exclude_id', None)
        
        if not serial_number:
            return Response(
                {"detail": "Serial number parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        query = Q(serial_number=serial_number, has_serial_number=True)
        if exclude_id:
            query &= ~Q(id=exclude_id)
            
        exists = Equipment.objects.filter(query).exists()
        return Response({"exists": exists})

class EquipmentAllocationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing equipment allocations
    """
    queryset = EquipmentAllocation.objects.all()
    serializer_class = EquipmentAllocationSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['equipment__name', 'therapist__user__username', 'patient__user__username']
    ordering_fields = ['allocation_date', 'expected_return_date', 'status']
    
    def get_permissions(self):
        """
        Only admin can create, update or delete allocations
        Therapists can view their own allocations
        Patients can view their own allocations
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter allocations based on user role:
        - Admin: all allocations
        - Therapist: only their allocations
        - Patient: only their allocations
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        # Update status for any overdue allocations
        for allocation in queryset:
            if allocation.is_overdue() and allocation.status != allocation.Status.OVERDUE:
                allocation.status = allocation.Status.OVERDUE
                allocation.save(update_fields=['status'])
        
        if user.is_admin:
            return queryset
        elif user.is_therapist:
            therapist = Therapist.objects.get(user=user)
            return queryset.filter(therapist=therapist)
        elif user.is_patient:
            patient = Patient.objects.get(user=user)
            return queryset.filter(patient=patient)
        return queryset.none()
    
    @action(detail=True, methods=['post'])
    def return_equipment(self, request, pk=None):
        """Mark equipment as returned"""
        allocation = self.get_object()
        
        # Only admin or the therapist who has the equipment can return it
        user = request.user
        if not (user.is_admin or (user.is_therapist and allocation.therapist.user == user)):
            return Response(
                {"detail": "You don't have permission to return this equipment."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update allocation status and return date
        allocation.status = EquipmentAllocation.Status.RETURNED
        allocation.actual_return_date = timezone.now().date()
        allocation.save()
        
        # Update equipment availability
        equipment = allocation.equipment
        equipment.is_available = True
        equipment.save()
        
        serializer = self.get_serializer(allocation)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def extend_return_date(self, request, pk=None):
        """Extend the expected return date for an allocation"""
        allocation = self.get_object()
        
        # Only admin can extend return dates
        if not request.user.is_admin:
            return Response(
                {"detail": "Only administrators can extend return dates."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get new return date and reason from request
        new_return_date = request.data.get('new_return_date')
        reason = request.data.get('reason', '')
        
        if not new_return_date:
            return Response(
                {"detail": "New return date is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update allocation
        allocation.expected_return_date = new_return_date
        allocation.extension_reason = reason
        
        # If it was overdue, reset to approved status
        if allocation.status == EquipmentAllocation.Status.OVERDUE:
            allocation.status = EquipmentAllocation.Status.APPROVED
            
        allocation.save()
        
        serializer = self.get_serializer(allocation)
        return Response(serializer.data)

class AllocationRequestViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing equipment allocation requests
    """
    queryset = AllocationRequest.objects.all()
    serializer_class = AllocationRequestSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['equipment__name', 'therapist__user__username', 'patient__user__username']
    ordering_fields = ['requested_date', 'requested_until', 'status']
    
    def get_permissions(self):
        """
        Therapists can create requests and view their own requests
        Admin can view, approve, or reject all requests
        """
        if self.action == 'create':
            permission_classes = [IsTherapist]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter requests based on user role:
        - Admin: all requests
        - Therapist: only their requests
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.is_admin:
            return queryset
        elif user.is_therapist:
            therapist = Therapist.objects.get(user=user)
            return queryset.filter(therapist=therapist)
        return queryset.none()
    
    def perform_create(self, serializer):
        """Set therapist automatically based on the authenticated user"""
        user = self.request.user
        therapist = Therapist.objects.get(user=user)
        serializer.save(therapist=therapist)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve an allocation request"""
        allocation_request = self.get_object()
        
        # Only admin can approve requests
        if not request.user.is_admin:
            return Response(
                {"detail": "Only administrators can approve requests."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if equipment is available
        equipment = allocation_request.equipment
        if not equipment.is_available:
            return Response(
                {"detail": "This equipment is no longer available."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create an equipment allocation
        allocation = EquipmentAllocation.objects.create(
            equipment=equipment,
            therapist=allocation_request.therapist,
            patient=allocation_request.patient,
            allocated_by=request.user,
            allocation_date=timezone.now(),
            expected_return_date=allocation_request.requested_until,
            status=EquipmentAllocation.Status.APPROVED,
            location=allocation_request.location,
            notes=f"Created from request: {allocation_request.reason}"
        )
        
        # Update the request status
        allocation_request.status = AllocationRequest.Status.APPROVED
        allocation_request.admin_notes = request.data.get('admin_notes', '')
        allocation_request.save()
        
        # Update equipment availability
        equipment.is_available = False
        equipment.save()
        
        # Return both the updated request and the new allocation
        request_serializer = self.get_serializer(allocation_request)
        allocation_serializer = EquipmentAllocationSerializer(allocation)
        
        return Response({
            'request': request_serializer.data,
            'allocation': allocation_serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject an allocation request"""
        allocation_request = self.get_object()
        
        # Only admin can reject requests
        if not request.user.is_admin:
            return Response(
                {"detail": "Only administrators can reject requests."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update the request status
        allocation_request.status = AllocationRequest.Status.REJECTED
        allocation_request.admin_notes = request.data.get('admin_notes', '')
        allocation_request.save()
        
        serializer = self.get_serializer(allocation_request)
        return Response(serializer.data)

# Create your views here.
