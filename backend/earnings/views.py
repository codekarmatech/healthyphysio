"""
Purpose: API views for earnings management
Connected to: Earnings URLs and frontend components
"""

from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Count, Q, F, ExpressionWrapper, DecimalField
from django.db.models.functions import TruncDate
from datetime import datetime, timedelta
import calendar
from decimal import Decimal

from .models import EarningRecord, SessionFeeConfig, FeeChangeLog, RevenueDistributionConfig
from .serializers import (
    EarningRecordSerializer, EarningsSummarySerializer, MonthlyEarningsResponseSerializer,
    SessionFeeConfigSerializer, FeeChangeLogSerializer, RevenueDistributionConfigSerializer,
    RevenueCalculatorSerializer, FinancialSummarySerializer
)
from users.models import User, Therapist, Patient, Doctor
from users.permissions import IsAdminUser, IsTherapistUser, IsDoctorUser
from scheduling.models import Appointment

class EarningsViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing earnings records
    """
    queryset = EarningRecord.objects.all()
    serializer_class = EarningRecordSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['therapist__user__username', 'patient__user__username', 'session_type']
    ordering_fields = ['date', 'amount', 'status']

    def get_permissions(self):
        """
        Only admin can create, update or delete earnings records
        Therapists can view their own earnings
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Filter earnings based on user role:
        - Admin: all earnings
        - Therapist: only their earnings
        """
        queryset = super().get_queryset()
        user = self.request.user

        try:
            if user.is_admin:
                return queryset
            elif user.is_therapist:
                try:
                    therapist = Therapist.objects.get(user=user)
                    return queryset.filter(therapist=therapist)
                except Therapist.DoesNotExist:
                    # User is marked as therapist but doesn't have a therapist profile
                    print(f"WARNING: User {user.id} is marked as therapist but has no therapist profile")
                    return queryset.none()
            return queryset.none()
        except Exception as e:
            import traceback
            print(f"ERROR in get_queryset: {str(e)}")
            print(traceback.format_exc())
            return queryset.none()

    @action(detail=False, methods=['get'], url_path='monthly/(?P<therapist_id>[^/.]+)')
    def monthly_earnings(self, request, therapist_id=None):
        """Get monthly earnings for a therapist (legacy endpoint)"""
        # Redirect to the new endpoint
        return self.therapist_monthly_earnings(request, therapist_id)

    @action(detail=False, methods=['get'], url_path='therapist/(?P<therapist_id>[^/.]+)/monthly/')
    def therapist_monthly_earnings(self, request, therapist_id=None):
        """Get monthly earnings for a therapist (new role-based endpoint)"""
        print("DEBUG: therapist_monthly_earnings action called with therapist_id:", therapist_id)
        try:
            # Get query parameters
            year = int(request.query_params.get('year', timezone.now().year))
            month = int(request.query_params.get('month', timezone.now().month))

            # Validate therapist access
            user = request.user

            # For now, allow all authenticated users to view earnings
            # This is a temporary solution until we implement proper role-based permissions
            # In a production environment, you would want to restrict this

            # Print debug information
            print(f"DEBUG: User {user.id} ({user.username}) requesting earnings for therapist {therapist_id}")
            print(f"DEBUG: User roles - is_admin: {user.is_admin}, is_therapist: {user.is_therapist}")

            # Temporarily bypass permission check
            # TODO: Implement proper role-based permissions
            has_permission = True

            # Get therapist
            therapist = Therapist.objects.get(id=therapist_id)

            # Get start and end dates for the month
            start_date = datetime(year, month, 1).date()
            last_day = calendar.monthrange(year, month)[1]
            end_date = datetime(year, month, last_day).date()

            # Get earnings records for the month
            earnings_records = EarningRecord.objects.filter(
                therapist=therapist,
                date__gte=start_date,
                date__lte=end_date
            ).order_by('-date')

            # If no records exist, check if therapist has any appointments
            if not earnings_records.exists():
                # Check if therapist has any appointments
                has_appointments = Appointment.objects.filter(
                    therapist=therapist
                ).exists()

                # If no appointments, return mock data for new therapists
                if not has_appointments:
                    return self._generate_mock_data(therapist_id, year, month)

            # Calculate summary statistics
            completed_sessions = earnings_records.filter(status=Appointment.Status.COMPLETED).count()
            cancelled_sessions = earnings_records.filter(status=Appointment.Status.CANCELLED).count()
            missed_sessions = earnings_records.filter(status=Appointment.Status.MISSED).count()
            attended_sessions = completed_sessions

            total_earned = earnings_records.aggregate(
                total=Sum('amount', default=Decimal('0.00'))
            )['total']

            total_potential = earnings_records.aggregate(
                total=Sum('full_amount', default=Decimal('0.00'))
            )['total']

            # Calculate attendance rate
            total_sessions = attended_sessions + missed_sessions
            attendance_rate = (attended_sessions / total_sessions * 100) if total_sessions > 0 else 0

            # Calculate average per session
            average_per_session = (total_earned / attended_sessions) if attended_sessions > 0 else Decimal('0.00')

            # Get daily earnings
            daily_earnings = earnings_records.values('date').annotate(
                amount=Sum('amount'),
                sessions=Count('id')
            ).order_by('date')

            # Prepare response data
            response_data = {
                'earnings': EarningRecordSerializer(earnings_records, many=True).data,
                'summary': {
                    'totalEarned': total_earned,
                    'totalPotential': total_potential,
                    'completedSessions': completed_sessions,
                    'cancelledSessions': cancelled_sessions,
                    'missedSessions': missed_sessions,
                    'attendedSessions': attended_sessions,
                    'attendanceRate': attendance_rate,
                    'averagePerSession': average_per_session
                },
                'dailyEarnings': [
                    {
                        'date': day['date'],
                        'amount': day['amount'],
                        'sessions': day['sessions']
                    } for day in daily_earnings
                ],
                'year': year,
                'month': month
            }

            return Response(response_data)

        except Therapist.DoesNotExist:
            return Response(
                {"detail": "Therapist not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import traceback
            print(f"ERROR in monthly_earnings: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {"detail": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _generate_mock_data(self, therapist_id, year, month):
        """Generate mock data for new therapists with no earnings records"""
        try:
            # Parse inputs
            therapist_id_num = int(therapist_id)
            year = int(year)
            month = int(month)
            daysInMonth = calendar.monthrange(year, month)[1]

            # Session types with realistic names
            session_types = [
                'Initial Assessment', 'Follow-up Consultation', 'Physical Therapy',
                'Rehabilitation Session', 'Pain Management', 'Post-Surgery Recovery'
            ]

            # Generate daily earnings
            earnings = []
            daily_earnings = []

            total_earned = Decimal('0.00')
            total_potential = Decimal('0.00')
            attended_sessions = 0
            missed_sessions = 0
            completed_sessions = 0
            cancelled_sessions = 0

            # Generate 10-15 sample earnings records
            sample_count = 10 + (therapist_id_num % 6)

            for i in range(sample_count):
                # Generate a random day in the month (past days only)
                current_day = min(timezone.now().day if year == timezone.now().year and month == timezone.now().month else daysInMonth, daysInMonth)
                day = 1 + (i % current_day)

                date = datetime(year, month, day).date()

                # Generate a random session fee between $60 and $120
                session_fee = Decimal(60 + (therapist_id_num % 6) * 10)

                # Determine session status (mostly completed for sample data)
                if i < int(sample_count * 0.8):  # 80% completed
                    status = Appointment.Status.COMPLETED
                    payment_status = EarningRecord.PaymentStatus.PAID
                    amount = session_fee
                    total_earned += amount
                    completed_sessions += 1
                    attended_sessions += 1
                elif i < int(sample_count * 0.9):  # 10% cancelled with fee
                    status = Appointment.Status.CANCELLED
                    payment_status = EarningRecord.PaymentStatus.PARTIAL
                    amount = session_fee * Decimal('0.5')  # 50% cancellation fee
                    total_earned += amount
                    cancelled_sessions += 1
                else:  # 10% missed
                    status = Appointment.Status.MISSED
                    payment_status = EarningRecord.PaymentStatus.NOT_APPLICABLE
                    amount = Decimal('0.00')
                    missed_sessions += 1

                total_potential += session_fee

                # Get random session type
                session_type = session_types[i % len(session_types)]

                # Create earnings record
                earnings.append({
                    'id': f"mock-{date}-{i}",
                    'date': date.isoformat(),
                    'session_type': session_type,
                    'amount': str(amount),
                    'full_amount': str(session_fee),
                    'status': status,
                    'payment_status': payment_status,
                    'payment_date': date.isoformat() if status == Appointment.Status.COMPLETED else None,
                    'notes': 'Sample data for new therapist' if i == 0 else ''
                })

                # Aggregate daily earnings
                day_found = False
                for day_data in daily_earnings:
                    if day_data['date'] == date.isoformat():
                        day_data['amount'] += amount
                        day_data['sessions'] += 1
                        day_found = True
                        break

                if not day_found:
                    daily_earnings.append({
                        'date': date.isoformat(),
                        'amount': amount,
                        'sessions': 1
                    })

            # Calculate attendance rate
            total_sessions = attended_sessions + missed_sessions
            attendance_rate = (attended_sessions / total_sessions * 100) if total_sessions > 0 else 0

            # Calculate average per session
            average_per_session = (total_earned / attended_sessions) if attended_sessions > 0 else Decimal('0.00')

            # Prepare response data
            response_data = {
                'earnings': earnings,
                'summary': {
                    'totalEarned': total_earned,
                    'totalPotential': total_potential,
                    'completedSessions': completed_sessions,
                    'cancelledSessions': cancelled_sessions,
                    'missedSessions': missed_sessions,
                    'attendedSessions': attended_sessions,
                    'attendanceRate': attendance_rate,
                    'averagePerSession': average_per_session
                },
                'dailyEarnings': daily_earnings,
                'year': year,
                'month': month,
                'isMockData': True  # Flag to indicate this is mock data
            }

            return Response(response_data)

        except Exception as e:
            import traceback
            print(f"ERROR in _generate_mock_data: {str(e)}")
            print(traceback.format_exc())

            # Return a simplified response with minimal data
            return Response({
                'earnings': [],
                'summary': {
                    'totalEarned': 0,
                    'totalPotential': 0,
                    'completedSessions': 0,
                    'cancelledSessions': 0,
                    'missedSessions': 0,
                    'attendedSessions': 0,
                    'attendanceRate': 0,
                    'averagePerSession': 0
                },
                'dailyEarnings': [],
                'year': year,
                'month': month,
                'isMockData': True,
                'error': str(e)
            })


# New role-specific API endpoints

# Remove the standalone function and add it as an action to the viewset
# We'll keep the debug logs for now

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def therapist_monthly_earnings(request, therapist_id):
    """
    Get monthly earnings for a therapist
    This is a more RESTful endpoint that follows the pattern:
    /api/earnings/therapist/{therapist_id}/monthly/
    """
    print("DEBUG: therapist_monthly_earnings function called directly")
    try:
        # Get query parameters
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', timezone.now().month))

        # Print debug information
        print(f"DEBUG: User {request.user.id} ({request.user.username}) requesting earnings for therapist {therapist_id}")
        print(f"DEBUG: Year: {year}, Month: {month}")

        # Get therapist
        try:
            therapist = Therapist.objects.get(id=therapist_id)
        except Therapist.DoesNotExist:
            return Response(
                {"detail": "Therapist not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get earnings records for the specified month
        start_date = datetime(year, month, 1).date()
        last_day = calendar.monthrange(year, month)[1]
        end_date = datetime(year, month, last_day).date()

        earnings_records = EarningRecord.objects.filter(
            therapist=therapist,
            date__gte=start_date,
            date__lte=end_date
        )

        # If no records exist, check if therapist has any appointments
        if not earnings_records.exists():
            # Check if therapist has any appointments
            has_appointments = Appointment.objects.filter(
                therapist=therapist
            ).exists()

            # If no appointments, return mock data for new therapists
            if not has_appointments:
                # Use the existing mock data generation method
                viewset = EarningsViewSet()
                return viewset._generate_mock_data(therapist_id, year, month)

        # Calculate summary statistics
        completed_sessions = earnings_records.filter(status=Appointment.Status.COMPLETED).count()
        cancelled_sessions = earnings_records.filter(status=Appointment.Status.CANCELLED).count()
        missed_sessions = earnings_records.filter(status=Appointment.Status.MISSED).count()
        attended_sessions = completed_sessions

        total_earned = earnings_records.aggregate(
            total=Sum('amount', default=Decimal('0.00'))
        )['total']

        total_potential = earnings_records.aggregate(
            total=Sum('full_amount', default=Decimal('0.00'))
        )['total']

        # Calculate attendance rate
        total_sessions = attended_sessions + missed_sessions
        attendance_rate = round((attended_sessions / total_sessions * 100), 2) if total_sessions > 0 else 0

        # Calculate average per session
        average_per_session = round((total_earned / attended_sessions), 2) if attended_sessions > 0 else Decimal('0.00')

        # Get daily earnings
        daily_earnings_data = earnings_records.values('date').annotate(
            amount=Sum('amount'),
            sessions=Count('id')
        ).order_by('date')

        # Prepare response data
        serializer = EarningRecordSerializer(earnings_records, many=True)

        response_data = {
            'earnings': serializer.data,
            'summary': {
                'totalEarned': total_earned,
                'totalPotential': total_potential,
                'completedSessions': completed_sessions,
                'cancelledSessions': cancelled_sessions,
                'missedSessions': missed_sessions,
                'attendedSessions': attended_sessions,
                'attendanceRate': attendance_rate,
                'averagePerSession': average_per_session
            },
            'dailyEarnings': daily_earnings_data,
            'year': year,
            'month': month
        }

        return Response(response_data)

    except Exception as e:
        import traceback
        print(f"ERROR in therapist_monthly_earnings: {str(e)}")
        print(traceback.format_exc())
        return Response(
            {"detail": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def doctor_monthly_earnings(request, doctor_id):
    """
    Get monthly earnings for a doctor
    This is a placeholder for future implementation
    """
    return Response(
        {"detail": "Doctor earnings API not yet implemented."},
        status=status.HTTP_501_NOT_IMPLEMENTED
    )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_earnings_summary(request):
    """
    Get earnings summary for admin dashboard
    This is a placeholder for future implementation
    """
    return Response(
        {"detail": "Admin earnings summary API not yet implemented."},
        status=status.HTTP_501_NOT_IMPLEMENTED
    )


class SessionFeeConfigViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing session fee configurations
    """
    queryset = SessionFeeConfig.objects.all()
    serializer_class = SessionFeeConfigSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['patient__user__first_name', 'patient__user__last_name']
    ordering_fields = ['base_fee', 'created_at', 'updated_at']

    def get_permissions(self):
        """
        Only admin can manage fee configurations
        """
        permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        """
        Set created_by to current user
        """
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def update_fee(self, request, pk=None):
        """
        Update fee and create change log
        """
        fee_config = self.get_object()
        new_fee = request.data.get('new_fee')
        reason = request.data.get('reason', '')

        if not new_fee:
            return Response(
                {"error": "New fee is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            new_fee = Decimal(new_fee)
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid fee value"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create change log
        previous_fee = fee_config.current_fee
        FeeChangeLog.objects.create(
            fee_config=fee_config,
            previous_fee=previous_fee,
            new_fee=new_fee,
            reason=reason,
            changed_by=request.user
        )

        # Update fee
        fee_config.custom_fee = new_fee
        fee_config.save()

        return Response(SessionFeeConfigSerializer(fee_config).data)


class FeeChangeLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing fee change logs (read-only)
    """
    queryset = FeeChangeLog.objects.all()
    serializer_class = FeeChangeLogSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['fee_config__patient__user__first_name', 'fee_config__patient__user__last_name']
    ordering_fields = ['changed_at']

    def get_permissions(self):
        """
        Only admin can view fee change logs
        """
        permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Filter by patient if provided
        """
        queryset = super().get_queryset()
        patient_id = self.request.query_params.get('patient_id')

        if patient_id:
            queryset = queryset.filter(fee_config__patient__id=patient_id)

        return queryset


class RevenueDistributionConfigViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing revenue distribution configurations
    """
    queryset = RevenueDistributionConfig.objects.all()
    serializer_class = RevenueDistributionConfigSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']

    def get_permissions(self):
        """
        Only admin can manage revenue distribution configurations
        """
        permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        """
        Set created_by to current user
        """
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['post'])
    def calculate(self, request):
        """
        Calculate revenue distribution for a given fee
        """
        serializer = RevenueCalculatorSerializer(data=request.data)
        if serializer.is_valid():
            total_fee = serializer.validated_data['total_fee']
            distribution_config = serializer.validated_data['distribution_config']

            # Calculate distribution
            distribution = distribution_config.calculate_distribution(total_fee)

            return Response({
                'distribution': distribution,
                'config': RevenueDistributionConfigSerializer(distribution_config).data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FinancialDashboardViewSet(viewsets.ViewSet):
    """
    API endpoint for financial dashboard data
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def list(self, request):
        """
        Get summary data for financial dashboard
        """
        # Get query parameters
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        # Default to current month if not provided
        today = timezone.now().date()
        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            except ValueError:
                start_date = datetime(today.year, today.month, 1).date()
        else:
            start_date = datetime(today.year, today.month, 1).date()

        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            except ValueError:
                last_day = calendar.monthrange(today.year, today.month)[1]
                end_date = datetime(today.year, today.month, last_day).date()
        else:
            last_day = calendar.monthrange(today.year, today.month)[1]
            end_date = datetime(today.year, today.month, last_day).date()

        # Get earnings records for the period
        earnings_records = EarningRecord.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        )

        # Calculate summary statistics
        total_revenue = earnings_records.aggregate(
            total=Sum('amount', default=Decimal('0.00'))
        )['total']

        # Get revenue by role from explicit fields
        admin_revenue = earnings_records.aggregate(
            total=Sum('admin_amount', default=Decimal('0.00'))
        )['total']

        therapist_revenue = earnings_records.aggregate(
            total=Sum('therapist_amount', default=Decimal('0.00'))
        )['total']

        doctor_revenue = earnings_records.aggregate(
            total=Sum('doctor_amount', default=Decimal('0.00'))
        )['total']

        # Verify total matches sum of parts (handle legacy records)
        calculated_total = admin_revenue + therapist_revenue + doctor_revenue
        if calculated_total != total_revenue:
            # For legacy records, adjust therapist amount (most common case)
            therapist_revenue = total_revenue - admin_revenue - doctor_revenue

        paid_amount = earnings_records.filter(
            payment_status=EarningRecord.PaymentStatus.PAID
        ).aggregate(
            total=Sum('amount', default=Decimal('0.00'))
        )['total']

        pending_amount = total_revenue - paid_amount

        total_sessions = earnings_records.count()

        # Calculate collection rate
        collection_rate = (paid_amount / total_revenue * 100) if total_revenue > 0 else Decimal('0.00')

        # Calculate average fee
        average_fee = (total_revenue / total_sessions) if total_sessions > 0 else Decimal('0.00')

        # Get therapist breakdown
        therapist_breakdown = earnings_records.values(
            'therapist__id', 'therapist__user__first_name', 'therapist__user__last_name'
        ).annotate(
            total=Sum('amount'),
            sessions=Count('id')
        ).order_by('-total')

        # Prepare response data
        response_data = {
            'total_revenue': total_revenue,
            'admin_revenue': admin_revenue,
            'therapist_revenue': therapist_revenue,
            'doctor_revenue': doctor_revenue,
            'pending_amount': pending_amount,
            'paid_amount': paid_amount,
            'collection_rate': round(collection_rate, 2),
            'total_sessions': total_sessions,
            'average_fee': round(average_fee, 2),
            'period_start': start_date,
            'period_end': end_date,
            'therapist_breakdown': therapist_breakdown
        }

        return Response(response_data)
