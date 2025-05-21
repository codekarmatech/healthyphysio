"""
Purpose: API views for notifications
Connected Endpoints: GET/POST /api/notifications/
Validation: Permission checks, data validation
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import Notification
from .serializers import NotificationSerializer
from users.permissions import IsAdminUser

class NotificationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Filter notifications based on user role and query parameters
        """
        user = self.request.user

        # Base queryset - only show notifications for the current user
        queryset = Notification.objects.filter(recipient=user)

        # Apply filters
        notification_type = self.request.query_params.get('type')
        is_read = self.request.query_params.get('is_read')

        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)

        if is_read is not None:
            is_read_bool = is_read.lower() == 'true'
            queryset = queryset.filter(is_read=is_read_bool)

        return queryset

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a notification as read"""
        notification = self.get_object()
        success = notification.mark_as_read()

        if success:
            return Response({"message": "Notification marked as read"})
        else:
            return Response(
                {"error": "Failed to mark notification as read"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def mark_as_unread(self, request, pk=None):
        """Mark a notification as unread"""
        notification = self.get_object()
        success = notification.mark_as_unread()

        if success:
            return Response({"message": "Notification marked as unread"})
        else:
            return Response(
                {"error": "Failed to mark notification as unread"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all notifications as read"""
        queryset = self.get_queryset().filter(is_read=False)
        count = queryset.count()

        queryset.update(is_read=True, updated_at=timezone.now())

        return Response({
            "message": f"{count} notifications marked as read",
            "count": count
        })

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"count": count})

class AdminNotificationViewSet(NotificationViewSet):
    """
    API endpoint for admin to manage all notifications
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        """
        Admins can view all notifications or filter by recipient
        """
        queryset = Notification.objects.all()

        # Apply filters
        recipient_id = self.request.query_params.get('recipient')
        notification_type = self.request.query_params.get('type')
        is_read = self.request.query_params.get('is_read')

        if recipient_id:
            queryset = queryset.filter(recipient_id=recipient_id)

        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)

        if is_read is not None:
            is_read_bool = is_read.lower() == 'true'
            queryset = queryset.filter(is_read=is_read_bool)

        return queryset
