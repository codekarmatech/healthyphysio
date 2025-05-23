"""
Purpose: Handle payment status management for earnings records
Connected to: Earnings app, financial management
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from django.db import transaction
from django.shortcuts import get_object_or_404

from .models import EarningRecord, PaymentBatch, PaymentSchedule
from .serializers import EarningRecordSerializer, PaymentBatchSerializer, PaymentScheduleSerializer
from users.models import Therapist
from users.permissions import IsAdminUser, IsTherapistUser
from notifications.models import Notification


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

    @action(detail=False, methods=['post'])
    def process_payments(self, request):
        """
        Process payments for multiple earning records

        Required data:
        - earning_ids: List of earning record IDs to mark as paid
        - payment_method: Payment method (bank_transfer, cash, cheque, upi, other)
        - payment_reference: Reference number for the payment
        - payment_date: Payment date (defaults to today)
        - notes: Additional notes about the payment
        """
        earning_ids = request.data.get('earning_ids', [])
        payment_method = request.data.get('payment_method')
        payment_reference = request.data.get('payment_reference', '')
        payment_date_str = request.data.get('payment_date')
        notes = request.data.get('notes', '')

        if not earning_ids:
            return Response(
                {"error": "No earning records specified"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not payment_method:
            return Response(
                {"error": "Payment method is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parse payment date
        try:
            if payment_date_str:
                payment_date = timezone.datetime.strptime(payment_date_str, '%Y-%m-%d').date()
            else:
                payment_date = timezone.now().date()
        except ValueError:
            return Response(
                {"error": "Invalid payment date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create a payment batch
        with transaction.atomic():
            # Get the earnings records
            earnings = EarningRecord.objects.filter(id__in=earning_ids)

            if not earnings.exists():
                return Response(
                    {"error": "No valid earning records found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Create a payment batch
            batch = PaymentBatch.objects.create(
                name=f"Payment Batch {timezone.now().strftime('%Y-%m-%d %H:%M')}",
                status=PaymentBatch.BatchStatus.PROCESSING,
                payment_date=payment_date,
                payment_method=payment_method,
                notes=notes,
                created_by=request.user
            )

            # Process each earning record
            processed_earnings = []
            for earning in earnings:
                # Skip already paid earnings
                if earning.payment_status == EarningRecord.PaymentStatus.PAID:
                    continue

                # Mark as paid
                earning.payment_status = EarningRecord.PaymentStatus.PAID
                earning.payment_method = payment_method
                earning.payment_reference = payment_reference
                earning.payment_date = payment_date
                earning.payment_processed_by = request.user

                # Add note about the payment
                note = f"Payment processed via {payment_method} on {payment_date} by {request.user.username}"
                if notes:
                    note += f" - {notes}"

                if earning.notes:
                    earning.notes = f"{earning.notes}\n{note}"
                else:
                    earning.notes = note

                earning.save()

                # Add to processed list
                processed_earnings.append(earning)

                # Create notification for therapist
                Notification.objects.create(
                    user=earning.therapist.user,
                    title="Payment Processed",
                    message=f"Your payment of ₹{earning.therapist_amount} for {earning.date} has been processed.",
                    notification_type=Notification.NotificationType.PAYMENT_PROCESSED,
                    related_object_id=earning.id,
                    related_object_type="EarningRecord"
                )

            # Update batch status
            batch.status = PaymentBatch.BatchStatus.COMPLETED
            batch.processed_at = timezone.now()
            batch.save()

            # Return the processed earnings
            serializer = self.get_serializer(processed_earnings, many=True)
            return Response({
                "message": f"Successfully processed {len(processed_earnings)} payment(s)",
                "batch_id": batch.id,
                "processed_earnings": serializer.data
            })

    @action(detail=False, methods=['post'])
    def schedule_payments(self, request):
        """
        Schedule payments for future processing

        Required data:
        - earning_ids: List of earning record IDs to schedule
        - payment_date: Scheduled payment date
        - notes: Additional notes about the scheduled payment
        """
        earning_ids = request.data.get('earning_ids', [])
        payment_date_str = request.data.get('payment_date')
        notes = request.data.get('notes', '')

        if not earning_ids:
            return Response(
                {"error": "No earning records specified"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not payment_date_str:
            return Response(
                {"error": "Payment date is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parse payment date
        try:
            payment_date = timezone.datetime.strptime(payment_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {"error": "Invalid payment date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create a payment batch
        with transaction.atomic():
            # Get the earnings records
            earnings = EarningRecord.objects.filter(id__in=earning_ids)

            if not earnings.exists():
                return Response(
                    {"error": "No valid earning records found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Create a payment batch
            batch = PaymentBatch.objects.create(
                name=f"Scheduled Payment {payment_date.strftime('%Y-%m-%d')}",
                status=PaymentBatch.BatchStatus.SCHEDULED,
                payment_date=payment_date,
                notes=notes,
                created_by=request.user
            )

            # Schedule each earning record
            scheduled_earnings = []
            for earning in earnings:
                # Skip already paid earnings
                if earning.payment_status == EarningRecord.PaymentStatus.PAID:
                    continue

                # Schedule payment
                earning.payment_status = EarningRecord.PaymentStatus.SCHEDULED
                earning.payment_scheduled_date = payment_date

                # Add note about the scheduled payment
                note = f"Payment scheduled for {payment_date} by {request.user.username}"
                if notes:
                    note += f" - {notes}"

                if earning.notes:
                    earning.notes = f"{earning.notes}\n{note}"
                else:
                    earning.notes = note

                earning.save()

                # Add to scheduled list
                scheduled_earnings.append(earning)

                # Create notification for therapist
                Notification.objects.create(
                    user=earning.therapist.user,
                    title="Payment Scheduled",
                    message=f"Your payment of ₹{earning.therapist_amount} has been scheduled for {payment_date.strftime('%d %b, %Y')}.",
                    notification_type=Notification.NotificationType.PAYMENT,
                    related_object_id=earning.id,
                    related_object_type="EarningRecord"
                )

            # Return the scheduled earnings
            serializer = self.get_serializer(scheduled_earnings, many=True)
            return Response({
                "message": f"Successfully scheduled {len(scheduled_earnings)} payment(s) for {payment_date.strftime('%d %b, %Y')}",
                "batch_id": batch.id,
                "scheduled_earnings": serializer.data
            })

    @action(detail=False, methods=['get'])
    def payment_history(self, request, therapist_id=None):
        """
        Get payment history for a therapist

        Optional query parameters:
        - start_date: Filter by start date (YYYY-MM-DD)
        - end_date: Filter by end date (YYYY-MM-DD)
        """
        # Check permissions
        if not (IsAdminUser().has_permission(request, self) or
                (IsTherapistUser().has_permission(request, self) and
                 str(request.user.therapist.id) == str(therapist_id))):
            return Response(
                {"error": "You don't have permission to view this payment history"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get the therapist
        therapist = get_object_or_404(Therapist, id=therapist_id)

        # Get query parameters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        # Build query
        query = Q(therapist=therapist)

        if start_date:
            try:
                start_date = timezone.datetime.strptime(start_date, '%Y-%m-%d').date()
                query &= Q(payment_date__gte=start_date)
            except ValueError:
                return Response(
                    {"error": "Invalid start date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        if end_date:
            try:
                end_date = timezone.datetime.strptime(end_date, '%Y-%m-%d').date()
                query &= Q(payment_date__lte=end_date)
            except ValueError:
                return Response(
                    {"error": "Invalid end date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Get paid earnings
        earnings = EarningRecord.objects.filter(
            query,
            payment_status=EarningRecord.PaymentStatus.PAID
        ).order_by('-payment_date')

        # Serialize the data
        serializer = self.get_serializer(earnings, many=True)

        # Return the payment history
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def therapist_payment_history(request, therapist_id):
    """
    Get payment history for a specific therapist (role-based access)

    This endpoint allows:
    - Therapists to view their own payment history
    - Admins to view any therapist's payment history

    Query parameters:
    - start_date: Filter by start date (YYYY-MM-DD)
    - end_date: Filter by end date (YYYY-MM-DD)
    - year: Filter by year
    - month: Filter by month
    """
    from django.db.models import Q
    from datetime import datetime, date
    import calendar

    # Role-based access control
    user = request.user
    if user.is_therapist:
        try:
            therapist = Therapist.objects.get(user=user)
            if str(therapist.id) != str(therapist_id):
                return Response(
                    {"error": "You can only view your own payment history"},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Therapist.DoesNotExist:
            return Response(
                {"error": "Therapist profile not found"},
                status=status.HTTP_400_BAD_REQUEST
            )
    elif not user.is_admin:
        return Response(
            {"error": "You don't have permission to view this payment history"},
            status=status.HTTP_403_FORBIDDEN
        )

    # Get the therapist object
    try:
        therapist = get_object_or_404(Therapist, id=therapist_id)
    except Exception as e:
        return Response(
            {"error": f"Therapist not found: {str(e)}"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Build query filters
    query = Q(therapist=therapist)

    # Date filtering
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    year = request.query_params.get('year')
    month = request.query_params.get('month')

    if year and month:
        # Filter by specific month and year
        try:
            year = int(year)
            month = int(month)
            start_date = date(year, month, 1)
            end_date = date(year, month, calendar.monthrange(year, month)[1])
            query &= Q(payment_date__gte=start_date, payment_date__lte=end_date)
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid year or month format"},
                status=status.HTTP_400_BAD_REQUEST
            )
    elif start_date or end_date:
        # Filter by date range
        try:
            if start_date:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                query &= Q(payment_date__gte=start_date)
            if end_date:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                query &= Q(payment_date__lte=end_date)
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )

    # Get paid earnings only
    earnings = EarningRecord.objects.filter(
        query,
        payment_status=EarningRecord.PaymentStatus.PAID
    ).select_related('patient__user', 'appointment', 'visit').order_by('-payment_date')

    # Serialize the payment history data
    payment_history = []
    for record in earnings:
        payment_history.append({
            'id': record.id,
            'date': record.payment_date.isoformat() if record.payment_date else None,
            'amount': float(record.therapist_amount),  # Use therapist_amount for therapists
            'full_amount': float(record.full_amount),
            'patient_name': record.patient.user.get_full_name(),
            'session_type': record.session_type,
            'payment_method': record.payment_method,
            'payment_reference': record.payment_reference,
            'payment_processed_by': record.payment_processed_by.get_full_name() if record.payment_processed_by else None,
            'session_date': record.date.isoformat(),
            'notes': record.notes,
            'is_verified': record.is_verified,
            # Visit information for therapists (without geo-tracking details)
            'visit_info': {
                'manual_location_verified': record.visit.manual_location_verified if record.visit else False,
                'actual_start': record.visit.actual_start.isoformat() if record.visit and record.visit.actual_start else None,
                'actual_end': record.visit.actual_end.isoformat() if record.visit and record.visit.actual_end else None,
                'status': record.visit.status if record.visit else None
            } if record.visit else None
        })

    # Calculate summary statistics
    total_paid = sum(float(record.therapist_amount) for record in earnings)
    payment_count = len(payment_history)

    response_data = {
        'payments': payment_history,
        'summary': {
            'total_paid': total_paid,
            'payment_count': payment_count,
            'therapist_name': therapist.user.get_full_name()
        },
        'filters_applied': {
            'start_date': start_date.isoformat() if isinstance(start_date, date) else start_date,
            'end_date': end_date.isoformat() if isinstance(end_date, date) else end_date,
            'year': year,
            'month': month
        }
    }

    return Response(response_data)
