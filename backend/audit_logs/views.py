"""
Purpose: API views for audit logs
Connected Endpoints: GET /api/audit-logs/
Validation: Permission checks, integrity verification
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils.dateparse import parse_date
from .models import AuditLog
from .serializers import AuditLogSerializer
from users.permissions import IsAdminUser

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing audit logs
    Only admins can view all logs
    """
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = AuditLog.objects.all()
        
        # Apply filters
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        action = self.request.query_params.get('action')
        model = self.request.query_params.get('model')
        user = self.request.query_params.get('user')
        
        if start_date:
            date = parse_date(start_date)
            if date:
                queryset = queryset.filter(timestamp__date__gte=date)
        
        if end_date:
            date = parse_date(end_date)
            if date:
                queryset = queryset.filter(timestamp__date__lte=date)
        
        if action:
            queryset = queryset.filter(action=action)
        
        if model:
            queryset = queryset.filter(model_name__icontains=model)
        
        if user:
            queryset = queryset.filter(
                Q(user__username__icontains=user) |
                Q(user__first_name__icontains=user) |
                Q(user__last_name__icontains=user)
            )
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def verify(self, request, pk=None):
        """
        Verify the integrity of an audit log entry
        """
        log = self.get_object()
        is_verified = log.verify_integrity()
        
        return Response({
            'id': log.id,
            'verified': is_verified
        })
