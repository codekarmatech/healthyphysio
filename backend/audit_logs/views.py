"""
Purpose: API views for audit logs and system health monitoring
Connected Endpoints: GET /api/audit-logs/
Validation: Permission checks, integrity verification

Following OWASP Logging Cheat Sheet best practices:
- Captures when, where, who, and what for each event
- Supports filtering by date range, action, model, and user
- Provides integrity verification
- Includes detailed statistics for monitoring
- System health monitoring (CPU, Memory, Disk, Database)
- Security monitoring (failed logins, suspicious activity)
- Error tracking and performance metrics
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Avg, F
from django.db.models.functions import TruncHour, TruncDay
from django.utils.dateparse import parse_date
from django.utils import timezone
from django.db import connection
from datetime import timedelta
import os
import psutil
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
    
    def _get_time_range_filter(self, time_range):
        """Get the date filter based on time range"""
        now = timezone.now()
        if time_range == 'day':
            return now - timedelta(days=1)
        elif time_range == 'week':
            return now - timedelta(days=7)
        elif time_range == 'month':
            return now - timedelta(days=30)
        return now - timedelta(days=7)  # Default to week
    
    def get_queryset(self):
        queryset = AuditLog.objects.all()
        
        # Apply filters
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        action_filter = self.request.query_params.get('action')
        model = self.request.query_params.get('model')
        user = self.request.query_params.get('user')
        time_range = self.request.query_params.get('time_range')
        
        # Apply time range filter if provided
        if time_range:
            start_datetime = self._get_time_range_filter(time_range)
            queryset = queryset.filter(timestamp__gte=start_datetime)
        
        if start_date:
            date = parse_date(start_date)
            if date:
                queryset = queryset.filter(timestamp__date__gte=date)
        
        if end_date:
            date = parse_date(end_date)
            if date:
                queryset = queryset.filter(timestamp__date__lte=date)
        
        if action_filter:
            queryset = queryset.filter(action=action_filter)
        
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
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get audit log statistics for dashboard
        Returns total counts and action breakdown
        """
        time_range = request.query_params.get('time_range', 'week')
        start_datetime = self._get_time_range_filter(time_range)
        
        queryset = AuditLog.objects.filter(timestamp__gte=start_datetime)
        
        # Get action counts
        action_counts = queryset.values('action').annotate(count=Count('id'))
        action_dict = {item['action']: item['count'] for item in action_counts}
        
        total_logs = queryset.count()
        
        return Response({
            'total_logs': total_logs,
            'create_actions': action_dict.get('CREATE', 0),
            'update_actions': action_dict.get('UPDATE', 0),
            'delete_actions': action_dict.get('DELETE', 0),
            'login_actions': action_dict.get('LOGIN', 0),
            'logout_actions': action_dict.get('LOGOUT', 0),
            'access_actions': action_dict.get('ACCESS', 0),
            'time_range': time_range,
            'start_datetime': start_datetime.isoformat(),
            'end_datetime': timezone.now().isoformat()
        })
    
    @action(detail=False, methods=['get'], url_path='action-distribution')
    def action_distribution(self, request):
        """
        Get action distribution for charts
        """
        time_range = request.query_params.get('time_range', 'week')
        start_datetime = self._get_time_range_filter(time_range)
        
        queryset = AuditLog.objects.filter(timestamp__gte=start_datetime)
        
        # Get action counts
        action_counts = queryset.values('action').annotate(count=Count('id')).order_by('-count')
        
        # Format for chart display
        distribution = [
            {'name': item['action'].capitalize(), 'count': item['count']}
            for item in action_counts
        ]
        
        return Response(distribution)
    
    @action(detail=False, methods=['get'], url_path='model-distribution')
    def model_distribution(self, request):
        """
        Get model distribution for charts (top 10 models)
        """
        time_range = request.query_params.get('time_range', 'week')
        start_datetime = self._get_time_range_filter(time_range)
        
        queryset = AuditLog.objects.filter(timestamp__gte=start_datetime)
        
        # Get model counts (top 10)
        model_counts = queryset.values('model_name').annotate(count=Count('id')).order_by('-count')[:10]
        
        # Format for chart display
        distribution = [
            {'name': item['model_name'], 'count': item['count']}
            for item in model_counts
        ]
        
        return Response(distribution)
    
    @action(detail=False, methods=['get'], url_path='system-health')
    def system_health(self, request):
        """
        Get system health metrics (CPU, Memory, Disk)
        """
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # Memory metrics
            memory = psutil.virtual_memory()
            memory_total = memory.total / (1024 ** 3)  # GB
            memory_used = memory.used / (1024 ** 3)  # GB
            memory_percent = memory.percent
            
            # Disk metrics
            disk = psutil.disk_usage('/')
            disk_total = disk.total / (1024 ** 3)  # GB
            disk_used = disk.used / (1024 ** 3)  # GB
            disk_percent = disk.percent
            
            # Process count
            process_count = len(psutil.pids())
            
            return Response({
                'cpu': {
                    'percent': cpu_percent,
                    'cores': cpu_count,
                    'status': 'critical' if cpu_percent > 90 else 'warning' if cpu_percent > 70 else 'healthy'
                },
                'memory': {
                    'total_gb': round(memory_total, 2),
                    'used_gb': round(memory_used, 2),
                    'percent': memory_percent,
                    'status': 'critical' if memory_percent > 90 else 'warning' if memory_percent > 70 else 'healthy'
                },
                'disk': {
                    'total_gb': round(disk_total, 2),
                    'used_gb': round(disk_used, 2),
                    'percent': disk_percent,
                    'status': 'critical' if disk_percent > 90 else 'warning' if disk_percent > 80 else 'healthy'
                },
                'processes': process_count,
                'timestamp': timezone.now().isoformat()
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    @action(detail=False, methods=['get'], url_path='database-health')
    def database_health(self, request):
        """
        Get database health metrics
        """
        try:
            # Get database size and table stats
            with connection.cursor() as cursor:
                # Get database name
                db_name = connection.settings_dict['NAME']
                
                # Count total records in key tables
                table_stats = {}
                tables = ['audit_logs_auditlog', 'users_user', 'appointments_appointment', 'patients_patient']
                
                for table in tables:
                    try:
                        cursor.execute(f"SELECT COUNT(*) FROM {table}")
                        count = cursor.fetchone()[0]
                        table_stats[table.replace('_', ' ').title()] = count
                    except Exception:
                        table_stats[table] = 0
                
                # Get total audit log size
                audit_log_count = AuditLog.objects.count()
                
                # Check for slow queries (logs with many updates in short time)
                one_minute_ago = timezone.now() - timedelta(minutes=1)
                recent_queries = AuditLog.objects.filter(timestamp__gte=one_minute_ago).count()
                
            return Response({
                'database_name': db_name,
                'table_stats': table_stats,
                'audit_log_count': audit_log_count,
                'queries_per_minute': recent_queries,
                'status': 'warning' if recent_queries > 100 else 'healthy',
                'timestamp': timezone.now().isoformat()
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    @action(detail=False, methods=['get'], url_path='security-alerts')
    def security_alerts(self, request):
        """
        Get security-related alerts (failed logins, suspicious activity)
        """
        time_range = request.query_params.get('time_range', 'day')
        start_datetime = self._get_time_range_filter(time_range)
        
        # Get failed login attempts
        failed_logins = AuditLog.objects.filter(
            timestamp__gte=start_datetime,
            action='LOGIN'
        ).filter(
            Q(new_state__icontains='failed') | Q(object_repr__icontains='failed')
        ).count()
        
        # Get suspicious patterns (multiple actions from same IP in short time)
        ip_activity = AuditLog.objects.filter(
            timestamp__gte=start_datetime,
            ip_address__isnull=False
        ).values('ip_address').annotate(
            count=Count('id')
        ).filter(count__gt=50).order_by('-count')[:10]
        
        # Get delete operations (potential data loss)
        delete_operations = AuditLog.objects.filter(
            timestamp__gte=start_datetime,
            action='DELETE'
        ).count()
        
        # Get admin actions
        admin_actions = AuditLog.objects.filter(
            timestamp__gte=start_datetime,
            user__is_superuser=True
        ).count()
        
        # Calculate alert level
        alert_level = 'low'
        if failed_logins > 10 or delete_operations > 20:
            alert_level = 'medium'
        if failed_logins > 50 or len(ip_activity) > 5:
            alert_level = 'high'
        
        return Response({
            'failed_logins': failed_logins,
            'suspicious_ips': list(ip_activity),
            'delete_operations': delete_operations,
            'admin_actions': admin_actions,
            'alert_level': alert_level,
            'time_range': time_range,
            'timestamp': timezone.now().isoformat()
        })
    
    @action(detail=False, methods=['get'], url_path='error-tracking')
    def error_tracking(self, request):
        """
        Track errors and issues from audit logs
        """
        time_range = request.query_params.get('time_range', 'day')
        start_datetime = self._get_time_range_filter(time_range)
        
        # Get errors by model
        errors_by_model = AuditLog.objects.filter(
            timestamp__gte=start_datetime,
            action='DELETE'
        ).values('model_name').annotate(count=Count('id')).order_by('-count')[:10]
        
        # Get activity timeline by hour
        activity_timeline = AuditLog.objects.filter(
            timestamp__gte=start_datetime
        ).annotate(
            hour=TruncHour('timestamp')
        ).values('hour').annotate(count=Count('id')).order_by('hour')
        
        # Format timeline for charts
        timeline_data = [
            {
                'time': item['hour'].isoformat() if item['hour'] else '',
                'count': item['count']
            }
            for item in activity_timeline
        ]
        
        return Response({
            'errors_by_model': list(errors_by_model),
            'activity_timeline': timeline_data,
            'timestamp': timezone.now().isoformat()
        })
    
    @action(detail=False, methods=['get'], url_path='user-activity')
    def user_activity(self, request):
        """
        Get user activity metrics
        """
        time_range = request.query_params.get('time_range', 'day')
        start_datetime = self._get_time_range_filter(time_range)
        
        # Most active users
        active_users = AuditLog.objects.filter(
            timestamp__gte=start_datetime,
            user__isnull=False
        ).values(
            'user__username', 'user__first_name', 'user__last_name'
        ).annotate(
            action_count=Count('id')
        ).order_by('-action_count')[:10]
        
        # Format user data
        users_data = [
            {
                'username': u['user__username'],
                'name': f"{u['user__first_name']} {u['user__last_name']}".strip() or u['user__username'],
                'actions': u['action_count']
            }
            for u in active_users
        ]
        
        # Unique active users count
        unique_users = AuditLog.objects.filter(
            timestamp__gte=start_datetime,
            user__isnull=False
        ).values('user').distinct().count()
        
        return Response({
            'most_active_users': users_data,
            'unique_active_users': unique_users,
            'time_range': time_range,
            'timestamp': timezone.now().isoformat()
        })
    
    @action(detail=False, methods=['get'], url_path='token-management')
    def token_management(self, request):
        """
        Get token management stats (outstanding and blacklisted tokens)
        Based on Django REST Framework SimpleJWT blacklist app
        """
        try:
            from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
            
            # Get total outstanding tokens
            total_outstanding = OutstandingToken.objects.count()
            
            # Get expired outstanding tokens
            expired_outstanding = OutstandingToken.objects.filter(
                expires_at__lt=timezone.now()
            ).count()
            
            # Get active (non-expired) outstanding tokens
            active_tokens = total_outstanding - expired_outstanding
            
            # Get blacklisted tokens count
            blacklisted_count = BlacklistedToken.objects.count()
            
            # Get tokens by user (top 10)
            tokens_by_user = OutstandingToken.objects.filter(
                expires_at__gte=timezone.now()
            ).values(
                'user__username', 'user__first_name', 'user__last_name'
            ).annotate(
                token_count=Count('id')
            ).order_by('-token_count')[:10]
            
            users_with_tokens = [
                {
                    'username': t['user__username'],
                    'name': f"{t['user__first_name']} {t['user__last_name']}".strip() or t['user__username'],
                    'active_tokens': t['token_count']
                }
                for t in tokens_by_user
            ]
            
            # Get recent blacklisted tokens
            recent_blacklisted = BlacklistedToken.objects.select_related(
                'token', 'token__user'
            ).order_by('-blacklisted_at')[:10]
            
            blacklisted_list = [
                {
                    'token_id': bt.token.id,
                    'user': bt.token.user.username if bt.token.user else 'Unknown',
                    'blacklisted_at': bt.blacklisted_at.isoformat() if bt.blacklisted_at else None,
                    'expires_at': bt.token.expires_at.isoformat() if bt.token.expires_at else None
                }
                for bt in recent_blacklisted
            ]
            
            return Response({
                'total_outstanding': total_outstanding,
                'active_tokens': active_tokens,
                'expired_tokens': expired_outstanding,
                'blacklisted_count': blacklisted_count,
                'users_with_tokens': users_with_tokens,
                'recent_blacklisted': blacklisted_list,
                'recommendation': 'Run `python manage.py flushexpiredtokens` to clean up expired tokens' if expired_outstanding > 100 else None,
                'timestamp': timezone.now().isoformat()
            })
        except ImportError:
            return Response({
                'error': 'Token blacklist app not installed',
                'message': 'Add rest_framework_simplejwt.token_blacklist to INSTALLED_APPS',
                'timestamp': timezone.now().isoformat()
            }, status=200)
        except Exception as e:
            return Response({
                'error': str(e),
                'timestamp': timezone.now().isoformat()
            }, status=500)
    
    @action(detail=False, methods=['post'], url_path='flush-expired-tokens')
    def flush_expired_tokens(self, request):
        """
        Flush expired tokens from the database
        This is the programmatic equivalent of `python manage.py flushexpiredtokens`
        """
        try:
            from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
            
            # Get count before deletion
            expired_count = OutstandingToken.objects.filter(
                expires_at__lt=timezone.now()
            ).count()
            
            # Delete expired tokens (this will cascade to blacklisted tokens)
            OutstandingToken.objects.filter(expires_at__lt=timezone.now()).delete()
            
            # Log this action
            AuditLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                action='DELETE',
                model_name='OutstandingToken',
                object_id='bulk',
                object_repr=f'Flushed {expired_count} expired tokens',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'success': True,
                'deleted_count': expired_count,
                'message': f'Successfully deleted {expired_count} expired tokens',
                'timestamp': timezone.now().isoformat()
            })
        except ImportError:
            return Response({
                'error': 'Token blacklist app not installed'
            }, status=400)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=500)
