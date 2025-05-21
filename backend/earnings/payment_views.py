"""
Purpose: Handle payment status management for earnings records
Connected to: Earnings app, financial management
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q

from .models import EarningRecord
from .serializers import EarningRecordSerializer
from users.permissions import IsAdminUser


class PaymentManagementViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing payment statuses of earnings records
    """
    queryset = EarningRecord.objects.all()
    serializer_class = EarningRecordSerializer
    
    def get_permissions(self):
        """
        Only admin can manage payment statuses
        """
        permission_classes = [permissions.IsAuthenticated, IsAdminUser]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter queryset based on query parameters
        """
        queryset = EarningRecord.objects.all().select_related(
            'therapist__user', 'patient__user', 'appointment'
        ).order_by('-date')
        
        # Filter by patient name
        patient = self.request.query_params.get('patient')
        if patient:
            queryset = queryset.filter(
                Q(patient__user__first_name__icontains=patient) | 
                Q(patient__user__last_name__icontains=patient)
            )
        
        # Filter by therapist name
        therapist = self.request.query_params.get('therapist')
        if therapist:
            queryset = queryset.filter(
                Q(therapist__user__first_name__icontains=therapist) | 
                Q(therapist__user__last_name__icontains=therapist)
            )
        
        # Filter by payment status
        status_param = self.request.query_params.get('status')
        if status_param and status_param != 'all':
            queryset = queryset.filter(payment_status=status_param)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        
        end_date = self.request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        return queryset
    
    @action(detail=True, methods=['patch'])
    def update_payment_status(self, request, pk=None):
        """
        Update payment status for a single earnings record
        """
        record = self.get_object()
        
        # Get new status from request data
        new_status = request.data.get('payment_status')
        if not new_status:
            return Response(
                {"error": "Payment status is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate status
        valid_statuses = [choice[0] for choice in EarningRecord.PaymentStatus.choices]
        if new_status not in valid_statuses:
            return Response(
                {"error": f"Invalid payment status. Must be one of: {', '.join(valid_statuses)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update payment status
        record.payment_status = new_status
        
        # Update payment date if status is 'paid'
        if new_status == EarningRecord.PaymentStatus.PAID:
            record.payment_date = timezone.now().date()
        elif new_status == EarningRecord.PaymentStatus.UNPAID:
            record.payment_date = None
        
        # Add note about the status change
        note = f"Payment status changed to {new_status} by {request.user.username}"
        if record.notes:
            record.notes = f"{record.notes}\n{note}"
        else:
            record.notes = note
        
        record.save()
        
        # Return updated record
        serializer = self.get_serializer(record)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk_update_payment_status(self, request):
        """
        Update payment status for multiple earnings records
        """
        # Get record IDs and new status from request data
        record_ids = request.data.get('record_ids', [])
        new_status = request.data.get('payment_status')
        
        if not record_ids:
            return Response(
                {"error": "Record IDs are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not new_status:
            return Response(
                {"error": "Payment status is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate status
        valid_statuses = [choice[0] for choice in EarningRecord.PaymentStatus.choices]
        if new_status not in valid_statuses:
            return Response(
                {"error": f"Invalid payment status. Must be one of: {', '.join(valid_statuses)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get records to update
        records = EarningRecord.objects.filter(id__in=record_ids)
        
        if not records.exists():
            return Response(
                {"error": "No records found with the provided IDs"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update payment status for all records
        payment_date = timezone.now().date() if new_status == EarningRecord.PaymentStatus.PAID else None
        note = f"Payment status changed to {new_status} by {request.user.username} (bulk update)"
        
        updated_count = 0
        for record in records:
            record.payment_status = new_status
            
            if new_status == EarningRecord.PaymentStatus.PAID:
                record.payment_date = payment_date
            elif new_status == EarningRecord.PaymentStatus.UNPAID:
                record.payment_date = None
            
            # Add note about the status change
            if record.notes:
                record.notes = f"{record.notes}\n{note}"
            else:
                record.notes = note
            
            record.save()
            updated_count += 1
        
        return Response({
            "message": f"Successfully updated {updated_count} records",
            "updated_count": updated_count,
            "payment_status": new_status
        })
