from rest_framework import viewsets, permissions, status, filters, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q

from .models import (
    TreatmentPlan, TreatmentPlanVersion, TreatmentPlanChangeRequest,
    DailyTreatment, Intervention, TreatmentSession
)
from .serializers import (
    TreatmentPlanSerializer, TreatmentPlanVersionSerializer, TreatmentPlanChangeRequestSerializer,
    DailyTreatmentSerializer, InterventionSerializer, TreatmentSessionSerializer
)
from .permissions import IsAdminOrReadOnly, IsTherapistOrAdmin, IsOwnerOrAdmin

class TreatmentPlanViewSet(viewsets.ModelViewSet):
    """
    API endpoint for treatment plans.

    Admins can create, view, update, and delete all treatment plans.
    Therapists can view treatment plans for their patients.
    Patients can view their own approved treatment plans.
    """
    queryset = TreatmentPlan.objects.all()
    serializer_class = TreatmentPlanSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'patient__user__username', 'patient__user__first_name', 'patient__user__last_name']
    ordering_fields = ['created_at', 'start_date', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return TreatmentPlan.objects.all()
        elif user.is_therapist:
            # Therapists can see plans for their patients
            return TreatmentPlan.objects.filter(
                Q(patient__appointments__therapist__user=user) &
                (Q(status='approved') | Q(status='completed'))
            ).distinct()
        elif user.is_patient:
            # Patients can only see their approved plans
            return TreatmentPlan.objects.filter(
                patient__user=user,
                status__in=['approved', 'completed']
            )
        return TreatmentPlan.objects.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def submit_for_approval(self, request, pk=None):
        """Submit a treatment plan for approval"""
        treatment_plan = self.get_object()

        # Only the creator or an admin can submit for approval
        if request.user != treatment_plan.created_by and not request.user.is_admin:
            return Response(
                {"detail": "You don't have permission to submit this plan for approval."},
                status=status.HTTP_403_FORBIDDEN
            )

        if treatment_plan.submit_for_approval():
            return Response({"status": "submitted for approval"})
        else:
            return Response(
                {"detail": "Plan could not be submitted for approval."},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a treatment plan (admin only)"""
        treatment_plan = self.get_object()

        # Only admins can approve plans
        if not request.user.is_admin:
            return Response(
                {"detail": "Only administrators can approve treatment plans."},
                status=status.HTTP_403_FORBIDDEN
            )

        if treatment_plan.approve(request.user):
            return Response({"status": "approved"})
        else:
            return Response(
                {"detail": "Plan could not be approved."},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark a treatment plan as completed"""
        treatment_plan = self.get_object()

        # Only admins or the assigned therapist can complete plans
        if not request.user.is_admin and not (
            request.user.is_therapist and
            treatment_plan.patient.appointments.filter(therapist__user=request.user).exists()
        ):
            return Response(
                {"detail": "You don't have permission to complete this plan."},
                status=status.HTTP_403_FORBIDDEN
            )

        if treatment_plan.complete():
            return Response({"status": "completed"})
        else:
            return Response(
                {"detail": "Plan could not be marked as completed."},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def request_change(self, request, pk=None):
        """Request a change to a treatment plan (therapists only)"""
        treatment_plan = self.get_object()
        user = request.user

        # Only therapists can request changes
        if not user.is_therapist:
            return Response(
                {"detail": "Only therapists can request changes."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Therapist must be assigned to the patient
        if not treatment_plan.patient.appointments.filter(therapist__user=user).exists():
            return Response(
                {"detail": "You can only request changes for your patients."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Create change request
        serializer = TreatmentPlanChangeRequestSerializer(data={
            "treatment_plan": treatment_plan.id,
            "requested_by": user.id,
            "current_data": request.data.get("current_data", {}),
            "requested_data": request.data.get("requested_data", {}),
            "reason": request.data.get("reason", ""),
            "urgency": request.data.get("urgency", "medium")
        })

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TreatmentPlanChangeRequestViewSet(viewsets.ModelViewSet):
    """
    API endpoint for treatment plan change requests.

    Admins can view all change requests and approve/reject them.
    Therapists can view their own change requests.
    """
    queryset = TreatmentPlanChangeRequest.objects.all()
    serializer_class = TreatmentPlanChangeRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['treatment_plan__title', 'reason', 'requested_by__username']
    ordering_fields = ['created_at', 'status', 'urgency']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return TreatmentPlanChangeRequest.objects.all()
        elif user.is_therapist:
            return TreatmentPlanChangeRequest.objects.filter(requested_by=user)
        return TreatmentPlanChangeRequest.objects.none()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a change request (admin only)"""
        change_request = self.get_object()

        # Only admins can approve change requests
        if not request.user.is_admin:
            return Response(
                {"detail": "Only administrators can approve change requests."},
                status=status.HTTP_403_FORBIDDEN
            )

        if change_request.approve(request.user):
            return Response({"status": "approved"})
        else:
            return Response(
                {"detail": "Change request could not be approved."},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a change request (admin only)"""
        change_request = self.get_object()

        # Only admins can reject change requests
        if not request.user.is_admin:
            return Response(
                {"detail": "Only administrators can reject change requests."},
                status=status.HTTP_403_FORBIDDEN
            )

        reason = request.data.get("reason", "")
        if not reason:
            return Response(
                {"detail": "A reason for rejection is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if change_request.reject(request.user, reason):
            return Response({"status": "rejected"})
        else:
            return Response(
                {"detail": "Change request could not be rejected."},
                status=status.HTTP_400_BAD_REQUEST
            )

class InterventionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for interventions.

    Admins can create, view, update, and delete interventions.
    Others can only view interventions.
    """
    queryset = Intervention.objects.all()
    serializer_class = InterventionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'category']
    ordering_fields = ['name', 'category', 'created_at']
    ordering = ['category', 'name']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_queryset(self):
        # By default, only show active interventions
        queryset = Intervention.objects.filter(is_active=True)

        # Admins can see all interventions if requested
        if self.request.user.is_admin and self.request.query_params.get('show_all') == 'true':
            queryset = Intervention.objects.all()

        # Filter by category if provided
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        return queryset

class DailyTreatmentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for daily treatments within a treatment plan.

    Admins can create, view, update, and delete daily treatments.
    Therapists can view daily treatments for their patients.
    Patients can view their own approved daily treatments.
    """
    queryset = DailyTreatment.objects.all()
    serializer_class = DailyTreatmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'treatment_plan__title']
    ordering_fields = ['day_number', 'treatment_plan__title']
    ordering = ['treatment_plan', 'day_number']

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return DailyTreatment.objects.all()
        elif user.is_therapist:
            # Therapists can see daily treatments for their patients' approved plans
            return DailyTreatment.objects.filter(
                treatment_plan__patient__appointments__therapist__user=user,
                treatment_plan__status__in=['approved', 'completed']
            ).distinct()
        elif user.is_patient:
            # Patients can only see daily treatments from their approved plans
            return DailyTreatment.objects.filter(
                treatment_plan__patient__user=user,
                treatment_plan__status__in=['approved', 'completed']
            )
        return DailyTreatment.objects.none()

    def perform_create(self, serializer):
        # Ensure the treatment plan exists and user has permission
        treatment_plan_id = self.request.data.get('treatment_plan')
        if treatment_plan_id:
            try:
                treatment_plan = TreatmentPlan.objects.get(id=treatment_plan_id)
                # Only admins or the creator of the plan can add daily treatments
                if self.request.user.is_admin or self.request.user == treatment_plan.created_by:
                    serializer.save()
                else:
                    raise permissions.PermissionDenied("You don't have permission to add daily treatments to this plan.")
            except TreatmentPlan.DoesNotExist:
                raise serializers.ValidationError("Treatment plan does not exist.")
        else:
            raise serializers.ValidationError("Treatment plan is required.")

class TreatmentSessionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for treatment sessions.

    Admins can view all sessions.
    Therapists can view, create, and update sessions for their patients.
    Patients can view their own sessions.
    """
    queryset = TreatmentSession.objects.all()
    serializer_class = TreatmentSessionSerializer
    permission_classes = [permissions.IsAuthenticated, IsTherapistOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['treatment_plan__title', 'therapist__user__username', 'patient__user__username']
    ordering_fields = ['scheduled_date', 'status']
    ordering = ['-scheduled_date']

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return TreatmentSession.objects.all()
        elif user.is_therapist:
            # Therapists can see sessions where they are the assigned therapist
            return TreatmentSession.objects.filter(therapist__user=user)
        elif user.is_patient:
            # Patients can see their own sessions
            return TreatmentSession.objects.filter(patient__user=user)
        return TreatmentSession.objects.none()

    def perform_create(self, serializer):
        # If the user is a therapist, set them as the therapist for the session
        if self.request.user.is_therapist:
            therapist = self.request.user.therapist
            serializer.save(therapist=therapist)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark a session as completed with the provided data"""
        session = self.get_object()

        # Only the assigned therapist or an admin can complete a session
        if not request.user.is_admin and (
            not request.user.is_therapist or
            request.user.therapist != session.therapist
        ):
            return Response(
                {"detail": "You don't have permission to complete this session."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get the data from the request
        data = request.data

        # Validate required fields
        required_fields = ['interventions_performed', 'pain_level_before', 'pain_level_after']
        for field in required_fields:
            if field not in data or not data[field]:
                return Response(
                    {"detail": f"Field '{field}' is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Complete the session
        if session.complete(data):
            return Response({"status": "completed"})
        else:
            return Response(
                {"detail": "Session could not be marked as completed."},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def mark_missed(self, request, pk=None):
        """Mark a session as missed"""
        session = self.get_object()

        # Only the assigned therapist or an admin can mark a session as missed
        if not request.user.is_admin and (
            not request.user.is_therapist or
            request.user.therapist != session.therapist
        ):
            return Response(
                {"detail": "You don't have permission to mark this session as missed."},
                status=status.HTTP_403_FORBIDDEN
            )

        if session.mark_missed():
            return Response({"status": "marked as missed"})
        else:
            return Response(
                {"detail": "Session could not be marked as missed."},
                status=status.HTTP_400_BAD_REQUEST
            )
