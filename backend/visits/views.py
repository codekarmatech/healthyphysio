"""
Purpose: API views for visit tracking and therapist reports
Connected to: Location tracking, proximity alerts, and report management
"""

from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from django.contrib.auth import get_user_model

from .models import Visit, LocationUpdate, ProximityAlert, TherapistReport
from .serializers import (
    VisitSerializer, LocationUpdateSerializer,
    ProximityAlertSerializer, TherapistReportSerializer
)
from users.permissions import IsAdminUser, IsTherapistUser, IsPatientUser
from users.models import Therapist, Patient
from scheduling.models import Appointment, Session

User = get_user_model()

class VisitViewSet(viewsets.ModelViewSet):
    """API endpoint for managing visits"""
    queryset = Visit.objects.all()
    serializer_class = VisitSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['therapist__user__username', 'patient__user__username', 'status']
    ordering_fields = ['scheduled_start', 'status', 'created_at']

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsAdminUser]
        elif self.action in ['start_visit', 'start_session', 'complete_visit']:
            permission_classes = [permissions.IsAuthenticated, IsAdminUser | IsTherapistUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """Filter queryset based on user role"""
        user = self.request.user
        queryset = Visit.objects.all()

        if user.is_admin:
            return queryset
        elif user.is_therapist:
            try:
                therapist = Therapist.objects.get(user=user)
                return queryset.filter(therapist=therapist)
            except Therapist.DoesNotExist:
                return Visit.objects.none()
        elif user.is_patient:
            try:
                patient = Patient.objects.get(user=user)
                return queryset.filter(patient=patient)
            except Patient.DoesNotExist:
                return Visit.objects.none()
        return Visit.objects.none()

    def perform_create(self, serializer):
        """Set scheduled times from appointment if not provided"""
        appointment = serializer.validated_data.get('appointment')
        if appointment:
            # Default scheduled_start to appointment datetime if not provided
            if 'scheduled_start' not in serializer.validated_data:
                serializer.validated_data['scheduled_start'] = appointment.datetime

            # Default scheduled_end to appointment datetime + duration if not provided
            if 'scheduled_end' not in serializer.validated_data:
                duration = appointment.duration_minutes
                scheduled_start = serializer.validated_data.get('scheduled_start', appointment.datetime)
                serializer.validated_data['scheduled_end'] = scheduled_start + timezone.timedelta(minutes=duration)

            # Default therapist and patient to appointment's if not provided
            if 'therapist' not in serializer.validated_data:
                serializer.validated_data['therapist'] = appointment.therapist

            if 'patient' not in serializer.validated_data:
                serializer.validated_data['patient'] = appointment.patient

        serializer.save()

    @action(detail=True, methods=['post'])
    def start_visit(self, request, pk=None):
        """Start a visit"""
        visit = self.get_object()
        success = visit.start_visit()

        if success:
            return Response({"message": "Visit started successfully"})
        else:
            return Response(
                {"error": "Cannot start this visit"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def start_session(self, request, pk=None):
        """Start a session for this visit"""
        visit = self.get_object()
        success = visit.start_session()

        if success:
            # Also update the associated session if it exists
            try:
                session = Session.objects.get(appointment=visit.appointment)
                session.initiate_check_in()
            except Session.DoesNotExist:
                pass

            return Response({"message": "Session started successfully"})
        else:
            return Response(
                {"error": "Cannot start session for this visit"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def complete_visit(self, request, pk=None):
        """Complete a visit"""
        visit = self.get_object()
        success = visit.complete_visit()

        if success:
            return Response({"message": "Visit completed successfully"})
        else:
            return Response(
                {"error": "Cannot complete this visit"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def cancel_visit(self, request, pk=None):
        """Cancel a visit"""
        visit = self.get_object()
        success = visit.cancel_visit()

        if success:
            return Response({"message": "Visit cancelled successfully"})
        else:
            return Response(
                {"error": "Cannot cancel this visit"},
                status=status.HTTP_400_BAD_REQUEST
            )


class LocationUpdateViewSet(viewsets.ModelViewSet):
    """API endpoint for managing location updates"""
    queryset = LocationUpdate.objects.all()
    serializer_class = LocationUpdateSerializer

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action == 'create':
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """Filter queryset based on user role"""
        user = self.request.user
        queryset = LocationUpdate.objects.all()

        if user.is_admin:
            return queryset
        elif user.is_therapist:
            # Therapists can see their own location updates and their patients'
            try:
                therapist = Therapist.objects.get(user=user)
                patient_ids = Visit.objects.filter(therapist=therapist).values_list('patient_id', flat=True)
                patient_user_ids = Patient.objects.filter(id__in=patient_ids).values_list('user_id', flat=True)
                return queryset.filter(Q(user=user) | Q(user_id__in=patient_user_ids))
            except Therapist.DoesNotExist:
                return LocationUpdate.objects.none()
        else:
            # Other users can only see their own location updates
            return queryset.filter(user=user)

    def perform_create(self, serializer):
        """Set user to current user if not provided"""
        if 'user' not in serializer.validated_data:
            serializer.validated_data['user'] = self.request.user

        # Check if there's an active visit for this user
        user = serializer.validated_data.get('user')
        if user.is_therapist:
            try:
                therapist = Therapist.objects.get(user=user)
                active_visit = Visit.objects.filter(
                    therapist=therapist,
                    status__in=[Visit.Status.EN_ROUTE, Visit.Status.ARRIVED, Visit.Status.IN_SESSION]
                ).first()

                if active_visit and 'visit' not in serializer.validated_data:
                    serializer.validated_data['visit'] = active_visit
            except Therapist.DoesNotExist:
                pass

        serializer.save()

        # Check for proximity alerts after saving location
        self._check_proximity_alerts(serializer.instance)

    def _check_proximity_alerts(self, location_update):
        """Check for proximity alerts after a location update"""
        user = location_update.user

        # Only check for therapist location updates
        if not user.is_therapist:
            return

        try:
            therapist = Therapist.objects.get(user=user)

            # Get all patients
            patients = Patient.objects.all()

            for patient in patients:
                # Skip if there's an active visit between this therapist and patient
                active_visit = Visit.objects.filter(
                    therapist=therapist,
                    patient=patient,
                    status__in=[Visit.Status.EN_ROUTE, Visit.Status.ARRIVED, Visit.Status.IN_SESSION]
                ).exists()

                if active_visit:
                    continue

                # Get patient's latest location
                patient_location = LocationUpdate.objects.filter(
                    user=patient.user
                ).order_by('-timestamp').first()

                if not patient_location:
                    continue

                # Calculate distance (simplified for now - would use geospatial calculation in production)
                # This is a very basic calculation and should be replaced with proper geospatial distance
                lat_diff = abs(float(location_update.latitude) - float(patient_location.latitude))
                lng_diff = abs(float(location_update.longitude) - float(patient_location.longitude))
                approx_distance = (lat_diff + lng_diff) * 111000  # Rough conversion to meters

                # Create alert if distance is less than threshold (e.g., 100 meters)
                if approx_distance < 100:
                    # Check if there's already an active alert
                    existing_alert = ProximityAlert.objects.filter(
                        therapist=therapist,
                        patient=patient,
                        status__in=[ProximityAlert.Status.ACTIVE, ProximityAlert.Status.ACKNOWLEDGED]
                    ).exists()

                    if not existing_alert:
                        ProximityAlert.objects.create(
                            therapist=therapist,
                            patient=patient,
                            therapist_location=location_update,
                            patient_location=patient_location,
                            distance=approx_distance,
                            severity=ProximityAlert.Severity.MEDIUM
                        )
        except Therapist.DoesNotExist:
            pass


class ProximityAlertViewSet(viewsets.ModelViewSet):
    """API endpoint for managing proximity alerts"""
    queryset = ProximityAlert.objects.all()
    serializer_class = ProximityAlertSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['therapist__user__username', 'patient__user__username', 'status', 'severity']
    ordering_fields = ['created_at', 'status', 'severity', 'distance']

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsAdminUser]
        elif self.action in ['acknowledge', 'resolve', 'mark_false_alarm']:
            permission_classes = [permissions.IsAuthenticated, IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """Filter queryset based on user role"""
        user = self.request.user
        queryset = ProximityAlert.objects.all()

        if user.is_admin:
            return queryset
        elif user.is_therapist:
            try:
                therapist = Therapist.objects.get(user=user)
                return queryset.filter(therapist=therapist)
            except Therapist.DoesNotExist:
                return ProximityAlert.objects.none()
        elif user.is_patient:
            try:
                patient = Patient.objects.get(user=user)
                return queryset.filter(patient=patient)
            except Patient.DoesNotExist:
                return ProximityAlert.objects.none()
        return ProximityAlert.objects.none()

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Acknowledge an alert"""
        alert = self.get_object()
        success = alert.acknowledge(request.user)

        if success:
            return Response({"message": "Alert acknowledged successfully"})
        else:
            return Response(
                {"error": "Cannot acknowledge this alert"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Resolve an alert"""
        alert = self.get_object()
        notes = request.data.get('notes', '')
        success = alert.resolve(notes)

        if success:
            return Response({"message": "Alert resolved successfully"})
        else:
            return Response(
                {"error": "Cannot resolve this alert"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def mark_false_alarm(self, request, pk=None):
        """Mark an alert as a false alarm"""
        alert = self.get_object()
        notes = request.data.get('notes', '')
        success = alert.mark_false_alarm(notes)

        if success:
            return Response({"message": "Alert marked as false alarm successfully"})
        else:
            return Response(
                {"error": "Cannot mark this alert as false alarm"},
                status=status.HTTP_400_BAD_REQUEST
            )


class TherapistReportViewSet(viewsets.ModelViewSet):
    """API endpoint for managing therapist reports"""
    queryset = TherapistReport.objects.all()
    serializer_class = TherapistReportSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['therapist__user__username', 'patient__user__username', 'status', 'content']
    ordering_fields = ['report_date', 'status', 'submitted_at', 'reviewed_at']

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['destroy']:
            # Reports cannot be deleted
            permission_classes = [permissions.IsAuthenticated, ~permissions.IsAuthenticated]  # Always deny
        elif self.action in ['create', 'update', 'partial_update', 'append_content', 'submit']:
            # Only therapists can create and update their own reports
            permission_classes = [permissions.IsAuthenticated, IsTherapistUser]
        elif self.action in ['review', 'flag']:
            # Only admins can review and flag reports
            permission_classes = [permissions.IsAuthenticated, IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """Filter queryset based on user role"""
        user = self.request.user
        queryset = TherapistReport.objects.all()

        if user.is_admin:
            return queryset
        elif user.is_therapist:
            try:
                therapist = Therapist.objects.get(user=user)
                return queryset.filter(therapist=therapist)
            except Therapist.DoesNotExist:
                return TherapistReport.objects.none()
        elif user.is_patient:
            try:
                patient = Patient.objects.get(user=user)
                return queryset.filter(patient=patient)
            except Patient.DoesNotExist:
                return TherapistReport.objects.none()
        return TherapistReport.objects.none()

    def perform_create(self, serializer):
        """Set therapist to current user if not provided"""
        if self.request.user.is_therapist:
            try:
                therapist = Therapist.objects.get(user=self.request.user)
                if 'therapist' not in serializer.validated_data:
                    serializer.validated_data['therapist'] = therapist
            except Therapist.DoesNotExist:
                pass

        serializer.save()

    @action(detail=True, methods=['post'])
    def append_content(self, request, pk=None):
        """Append content to a report"""
        report = self.get_object()
        new_content = request.data.get('content', '')

        if not new_content:
            return Response(
                {"error": "Content is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user is the report's therapist
        if self.request.user.is_therapist:
            try:
                therapist = Therapist.objects.get(user=self.request.user)
                if report.therapist != therapist:
                    return Response(
                        {"error": "You can only append to your own reports"},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Therapist.DoesNotExist:
                return Response(
                    {"error": "Therapist profile not found"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            return Response(
                {"error": "Only therapists can append to reports"},
                status=status.HTTP_403_FORBIDDEN
            )

        success = report.append_content(new_content)

        if success:
            return Response({"message": "Content appended successfully"})
        else:
            return Response(
                {"error": "Cannot append content to this report"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def update_report(self, request, pk=None):
        """Update a report with new data"""
        report = self.get_object()

        # Check if user is the report's therapist
        if self.request.user.is_therapist:
            try:
                therapist = Therapist.objects.get(user=self.request.user)
                if report.therapist != therapist:
                    return Response(
                        {"error": "You can only update your own reports"},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Therapist.DoesNotExist:
                return Response(
                    {"error": "Therapist profile not found"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            return Response(
                {"error": "Only therapists can update reports"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Only allow updates if report is in draft status
        if report.status != TherapistReport.Status.DRAFT:
            return Response(
                {"error": "Cannot update a report that has already been submitted"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update the report content
        report_data = request.data

        # Store current content in history before updating
        if not report.history:
            report.history = []

        report.history.append({
            'therapist_notes': report.content,
            'timestamp': timezone.now().isoformat(),
            'user': report.therapist.user.username
        })

        # Update the report content with structured fields
        report.content = report_data.get('therapist_notes', report.content)

        # Save additional fields in the content JSON if provided
        report_content = {
            'therapist_notes': report_data.get('therapist_notes', ''),
            'treatment_provided': report_data.get('treatment_provided', ''),
            'patient_progress': report_data.get('patient_progress', ''),
            'pain_level_before': report_data.get('pain_level_before', ''),
            'pain_level_after': report_data.get('pain_level_after', ''),
            'mobility_assessment': report_data.get('mobility_assessment', ''),
            'recommendations': report_data.get('recommendations', ''),
            'next_session_goals': report_data.get('next_session_goals', '')
        }

        # Update the report content with the JSON data
        report.content = str(report_content)
        report.save()

        return Response({
            "message": "Report updated successfully",
            "report": self.get_serializer(report).data
        })

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit a report"""
        report = self.get_object()

        # Check if user is the report's therapist
        if self.request.user.is_therapist:
            try:
                therapist = Therapist.objects.get(user=self.request.user)
                if report.therapist != therapist:
                    return Response(
                        {"error": "You can only submit your own reports"},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Therapist.DoesNotExist:
                return Response(
                    {"error": "Therapist profile not found"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            return Response(
                {"error": "Only therapists can submit reports"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if the therapist is still at the patient's location
        if report.visit:
            visit = report.visit
            if visit.status != Visit.Status.IN_SESSION and visit.status != Visit.Status.ARRIVED:
                return Response(
                    {"error": "You must submit the report before leaving the patient's location"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        success = report.submit()

        if success:
            # Notify admin about the report submission
            # In a real implementation, this would send an email or push notification
            # For now, we'll just log it
            print(f"ADMIN NOTIFICATION: Report {report.id} submitted by {report.therapist.user.username}")

            return Response({"message": "Report submitted successfully"})
        else:
            return Response(
                {"error": "Cannot submit this report"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """Review a report"""
        report = self.get_object()
        notes = request.data.get('notes', '')

        if not self.request.user.is_admin:
            return Response(
                {"error": "Only administrators can review reports"},
                status=status.HTTP_403_FORBIDDEN
            )

        success = report.review(self.request.user, notes)

        if success:
            return Response({"message": "Report reviewed successfully"})
        else:
            return Response(
                {"error": "Cannot review this report"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def flag(self, request, pk=None):
        """Flag a report for further review"""
        report = self.get_object()
        notes = request.data.get('notes', '')

        if not self.request.user.is_admin:
            return Response(
                {"error": "Only administrators can flag reports"},
                status=status.HTTP_403_FORBIDDEN
            )

        success = report.flag(self.request.user, notes)

        if success:
            return Response({"message": "Report flagged successfully"})
        else:
            return Response(
                {"error": "Cannot flag this report"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending reports for the current therapist"""
        if not request.user.is_therapist:
            return Response(
                {"error": "Only therapists can access pending reports"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            therapist = request.user.therapist_profile
            reports = TherapistReport.objects.filter(
                therapist=therapist,
                status=TherapistReport.Status.DRAFT
            )
            serializer = self.get_serializer(reports, many=True)
            return Response(serializer.data)
        except:
            return Response([])

    @action(detail=False, methods=['get'])
    def submitted(self, request):
        """Get submitted reports for admin review"""
        if not request.user.is_admin:
            return Response(
                {"error": "Only administrators can access submitted reports"},
                status=status.HTTP_403_FORBIDDEN
            )

        reports = TherapistReport.objects.filter(
            status=TherapistReport.Status.SUBMITTED
        )
        serializer = self.get_serializer(reports, many=True)
        return Response(serializer.data)
