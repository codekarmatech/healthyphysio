"""
Data Protection API Views for HealthyPhysio Platform
Implements DPDP Act 2023 compliance endpoints
"""

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
import logging

from .models import User
from .data_protection import AccountDeletionRequest, DataRetentionPolicy, ComplianceReport
from .data_protection_service import DataProtectionService
from .serializers import UserSerializer

logger = logging.getLogger(__name__)


class IsAdminOrOwner(permissions.BasePermission):
    """
    Custom permission to allow users to access their own deletion requests
    and admins to access all deletion requests
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admin can access all objects
        if request.user.is_admin:
            return True
        # Users can only access their own deletion requests
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def request_account_deletion(request):
    """
    API endpoint for users to request account deletion
    Implements DPDP Act 2023 right to erasure
    """
    try:
        reason = request.data.get('reason', '')
        if not reason:
            return Response(
                {'error': 'Reason for deletion is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create deletion request
        deletion_request = DataProtectionService.request_account_deletion(
            user=request.user,
            reason=reason
        )
        
        return Response({
            'message': 'Account deletion request submitted successfully',
            'request_id': deletion_request.id,
            'status': deletion_request.status,
            'compliance_deadline': deletion_request.compliance_deadline,
            'note': 'Your request will be reviewed by our admin team within 30 days as per DPDP Act 2023'
        }, status=status.HTTP_201_CREATED)
        
    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error creating deletion request for user {request.user.username}: {str(e)}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_deletion_request_status(request):
    """
    Get status of user's deletion request
    """
    deletion_request = AccountDeletionRequest.objects.filter(
        user=request.user
    ).order_by('-requested_at').first()
    
    if not deletion_request:
        return Response({
            'has_request': False,
            'message': 'No deletion request found'
        })
    
    return Response({
        'has_request': True,
        'request_id': deletion_request.id,
        'status': deletion_request.status,
        'requested_at': deletion_request.requested_at,
        'compliance_deadline': deletion_request.compliance_deadline,
        'is_overdue': deletion_request.is_overdue(),
        'admin_notes': deletion_request.admin_notes if deletion_request.status != 'pending' else None
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_deletion_request(request):
    """
    Allow users to cancel their pending deletion request
    """
    deletion_request = AccountDeletionRequest.objects.filter(
        user=request.user,
        status='pending'
    ).first()
    
    if not deletion_request:
        return Response(
            {'error': 'No pending deletion request found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    deletion_request.status = 'rejected'
    deletion_request.admin_notes = 'Cancelled by user'
    deletion_request.reviewed_at = timezone.now()
    deletion_request.save()
    
    return Response({
        'message': 'Deletion request cancelled successfully'
    })


class AccountDeletionRequestViewSet(ModelViewSet):
    """
    Admin viewset for managing account deletion requests
    """
    queryset = AccountDeletionRequest.objects.all()
    permission_classes = [IsAdminOrOwner]
    
    def get_queryset(self):
        """Filter queryset based on user permissions"""
        if self.request.user.is_admin:
            return AccountDeletionRequest.objects.all()
        else:
            return AccountDeletionRequest.objects.filter(user=self.request.user)
    
    def list(self, request):
        """List deletion requests with filtering options"""
        queryset = self.get_queryset()
        
        # Filter by status
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by overdue
        overdue_filter = request.query_params.get('overdue')
        if overdue_filter == 'true':
            queryset = queryset.filter(
                compliance_deadline__lt=timezone.now(),
                status__in=['pending', 'approved']
            )
        
        # Filter by user role (admin only)
        if request.user.is_admin:
            role_filter = request.query_params.get('user_role')
            if role_filter:
                queryset = queryset.filter(user__role=role_filter)
        
        requests_data = []
        for req in queryset.order_by('-requested_at'):
            requests_data.append({
                'id': req.id,
                'user': {
                    'id': req.user.id,
                    'username': req.user.username,
                    'role': req.user.role,
                    'email': req.user.email
                },
                'reason': req.reason,
                'status': req.status,
                'requested_at': req.requested_at,
                'compliance_deadline': req.compliance_deadline,
                'is_overdue': req.is_overdue(),
                'reviewed_by': req.reviewed_by.username if req.reviewed_by else None,
                'reviewed_at': req.reviewed_at,
                'admin_notes': req.admin_notes,
                'legal_hold': req.legal_hold,
                'retention_override': req.retention_override
            })
        
        return Response({
            'count': len(requests_data),
            'results': requests_data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        """Approve a deletion request"""
        deletion_request = self.get_object()
        
        if deletion_request.status != 'pending':
            return Response(
                {'error': f'Request is already {deletion_request.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        notes = request.data.get('notes', '')
        
        try:
            DataProtectionService.process_deletion_request(
                deletion_request=deletion_request,
                admin_user=request.user,
                action='approve',
                notes=notes
            )
            
            return Response({
                'message': 'Deletion request approved successfully',
                'status': deletion_request.status
            })
            
        except Exception as e:
            logger.error(f"Error approving deletion request {pk}: {str(e)}")
            return Response(
                {'error': 'Failed to approve deletion request'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        """Reject a deletion request"""
        deletion_request = self.get_object()
        
        if deletion_request.status != 'pending':
            return Response(
                {'error': f'Request is already {deletion_request.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reason = request.data.get('reason', '')
        if not reason:
            return Response(
                {'error': 'Rejection reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            DataProtectionService.process_deletion_request(
                deletion_request=deletion_request,
                admin_user=request.user,
                action='reject',
                notes=reason
            )
            
            return Response({
                'message': 'Deletion request rejected successfully',
                'status': deletion_request.status
            })
            
        except Exception as e:
            logger.error(f"Error rejecting deletion request {pk}: {str(e)}")
            return Response(
                {'error': 'Failed to reject deletion request'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def place_legal_hold(self, request, pk=None):
        """Place legal hold on deletion request"""
        deletion_request = self.get_object()
        
        reason = request.data.get('reason', '')
        if not reason:
            return Response(
                {'error': 'Legal hold reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        deletion_request.place_legal_hold(reason)
        
        return Response({
            'message': 'Legal hold placed successfully',
            'status': deletion_request.status
        })


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def compliance_dashboard(request):
    """
    Admin dashboard for data protection compliance
    """
    # Get current statistics
    total_requests = AccountDeletionRequest.objects.count()
    pending_requests = AccountDeletionRequest.objects.filter(status='pending').count()
    overdue_requests = AccountDeletionRequest.objects.filter(
        compliance_deadline__lt=timezone.now(),
        status__in=['pending', 'approved']
    ).count()
    legal_holds = AccountDeletionRequest.objects.filter(legal_hold=True).count()
    
    # Get recent requests
    recent_requests = AccountDeletionRequest.objects.order_by('-requested_at')[:10]
    recent_data = []
    for req in recent_requests:
        recent_data.append({
            'id': req.id,
            'user': req.user.username,
            'role': req.user.role,
            'status': req.status,
            'requested_at': req.requested_at,
            'is_overdue': req.is_overdue()
        })
    
    return Response({
        'statistics': {
            'total_requests': total_requests,
            'pending_requests': pending_requests,
            'overdue_requests': overdue_requests,
            'legal_holds': legal_holds
        },
        'recent_requests': recent_data,
        'compliance_info': {
            'dpdp_act_2023': 'Requests must be processed within 30 days',
            'healthcare_retention': 'Medical records retained for 7 years minimum',
            'audit_requirements': 'All deletion activities are logged for compliance'
        }
    })


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def data_retention_policies(request):
    """
    Get current data retention policies
    """
    policies = DataRetentionPolicy.objects.all()
    policies_data = []
    
    for policy in policies:
        policies_data.append({
            'data_type': policy.data_type,
            'data_type_display': policy.get_data_type_display(),
            'retention_period_days': policy.retention_period_days,
            'retention_period_years': round(policy.retention_period_days / 365, 1),
            'legal_basis': policy.legal_basis,
            'can_override_deletion': policy.can_override_deletion
        })
    
    return Response({
        'policies': policies_data,
        'note': 'These policies are based on Indian healthcare regulations and DPDP Act 2023'
    })
