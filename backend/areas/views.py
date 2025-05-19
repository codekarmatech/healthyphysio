"""
Purpose: API views for area management
Connected to: Area models and serializers
"""

from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Q, F
from django.shortcuts import get_object_or_404

from .models import Area, TherapistServiceArea, PatientArea, DoctorArea, AreaRelationship
from .serializers import (
    AreaSerializer, TherapistServiceAreaSerializer, PatientAreaSerializer,
    DoctorAreaSerializer, AreaRelationshipSerializer, AreaAnalyticsSerializer,
    AreaDetailSerializer
)
from users.models import User, Therapist, Patient, Doctor
from users.permissions import IsAdminUser


class AreaViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing areas
    """
    queryset = Area.objects.all()
    serializer_class = AreaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'city', 'state', 'zip_code']
    ordering_fields = ['name', 'city', 'state']

    def get_permissions(self):
        """
        Only admin can create, update or delete areas
        All users (including unauthenticated) can view areas for registration purposes
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        elif self.action == 'list':
            # Allow public access to the list of areas for registration
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        """
        Return appropriate serializer class based on action
        """
        if self.action == 'analytics':
            return AreaAnalyticsSerializer
        elif self.action == 'retrieve':
            return AreaDetailSerializer
        return super().get_serializer_class()

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """
        Get analytics data for all areas
        """
        areas = Area.objects.all()

        # Apply filters if provided
        state = request.query_params.get('state')
        city = request.query_params.get('city')

        if state:
            areas = areas.filter(state__iexact=state)
        if city:
            areas = areas.filter(city__iexact=city)

        serializer = AreaAnalyticsSerializer(areas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def therapists(self, request, pk=None):
        """
        Get all therapists in an area
        """
        area = self.get_object()
        therapist_areas = TherapistServiceArea.objects.filter(area=area)
        serializer = TherapistServiceAreaSerializer(therapist_areas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def patients(self, request, pk=None):
        """
        Get all patients in an area
        """
        area = self.get_object()
        patient_areas = PatientArea.objects.filter(area=area)
        serializer = PatientAreaSerializer(patient_areas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def doctors(self, request, pk=None):
        """
        Get all doctors in an area
        """
        area = self.get_object()
        doctor_areas = DoctorArea.objects.filter(area=area)
        serializer = DoctorAreaSerializer(doctor_areas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def relationships(self, request, pk=None):
        """
        Get all relationships in an area
        """
        area = self.get_object()
        relationships = AreaRelationship.objects.filter(area=area)

        # Filter by relationship type if provided
        relationship_type = request.query_params.get('type')
        if relationship_type:
            relationships = relationships.filter(relationship_type=relationship_type)

        serializer = AreaRelationshipSerializer(relationships, many=True)
        return Response(serializer.data)


class TherapistServiceAreaViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing therapist service areas
    """
    queryset = TherapistServiceArea.objects.all()
    serializer_class = TherapistServiceAreaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['therapist__user__first_name', 'therapist__user__last_name', 'area__name']
    ordering_fields = ['priority', 'created_at']

    def get_permissions(self):
        """
        Only admin can create, update or delete service areas
        Therapists can view their own service areas
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Filter queryset based on user role
        """
        user = self.request.user
        queryset = super().get_queryset()

        # Admin can see all
        if user.is_admin:
            return queryset

        # Therapist can see their own
        if user.is_therapist:
            return queryset.filter(therapist__user=user)

        # Others can't see any
        return queryset.none()


class PatientAreaViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing patient areas
    """
    queryset = PatientArea.objects.all()
    serializer_class = PatientAreaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['patient__user__first_name', 'patient__user__last_name', 'area__name']
    ordering_fields = ['created_at']

    def get_permissions(self):
        """
        Only admin can create, update or delete patient areas
        Patients can view their own areas
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Filter queryset based on user role
        """
        user = self.request.user
        queryset = super().get_queryset()

        # Admin can see all
        if user.is_admin:
            return queryset

        # Patient can see their own
        if user.is_patient:
            return queryset.filter(patient__user=user)

        # Others can't see any
        return queryset.none()


class DoctorAreaViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing doctor areas
    """
    queryset = DoctorArea.objects.all()
    serializer_class = DoctorAreaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['doctor__user__first_name', 'doctor__user__last_name', 'area__name']
    ordering_fields = ['created_at']

    def get_permissions(self):
        """
        Only admin can create, update or delete doctor areas
        Doctors can view their own areas
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Filter queryset based on user role
        """
        user = self.request.user
        queryset = super().get_queryset()

        # Admin can see all
        if user.is_admin:
            return queryset

        # Doctor can see their own
        if user.is_doctor:
            return queryset.filter(doctor__user=user)

        # Others can't see any
        return queryset.none()


class AreaDashboardViewSet(viewsets.ViewSet):
    """
    API endpoint for area dashboard data
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def list(self, request):
        """
        Get summary data for area dashboard
        """
        # Get counts
        total_areas = Area.objects.count()

        # Count areas that have at least one therapist
        areas_with_therapists = Area.objects.filter(therapists__isnull=False).distinct().count()

        # Count areas that have at least one patient (using both direct and relationship)
        areas_with_patients_rel = Area.objects.filter(patients__isnull=False).distinct()
        areas_with_patients_direct = Area.objects.filter(direct_patients__isnull=False).distinct()
        areas_with_patients = (areas_with_patients_rel | areas_with_patients_direct).distinct().count()

        # Count areas that have at least one doctor
        areas_with_doctors = Area.objects.filter(doctors__isnull=False).distinct().count()

        # Count distinct therapists, patients, and doctors
        distinct_therapists = Therapist.objects.filter(service_areas__isnull=False).distinct().count()

        # Count patients using both direct reference and relationship for completeness
        patients_with_direct_area = Patient.objects.filter(area__isnull=False).distinct()
        patients_with_relationship = Patient.objects.filter(residential_area__isnull=False).distinct()
        # Combine both querysets and get distinct count
        distinct_patients = (patients_with_direct_area | patients_with_relationship).distinct().count()

        distinct_doctors = Doctor.objects.filter(clinic_areas__isnull=False).distinct().count()

        # Get therapist counts and their areas
        therapist_count = Therapist.objects.count()
        therapist_area_count = TherapistServiceArea.objects.count()
        avg_areas_per_therapist = therapist_area_count / therapist_count if therapist_count > 0 else 0

        # Get top areas by user count - count distinct users in each area
        # First, clean up area names to ensure uniqueness
        # We'll normalize area names by splitting comma-separated values and creating a mapping
        all_areas = Area.objects.all()
        area_name_mapping = {}

        for area in all_areas:
            # Skip areas where name is the same as city (like "AMD")
            # These are not actual areas but cities incorrectly stored as areas
            if area.name.lower() == area.city.lower() and area.city:
                # Mark city entries to be filtered out later
                area_name_mapping[area.id] = f"__CITY__{area.city}"
                continue

            # Split area name if it contains commas (e.g., "ghatlodia, vastrapur, ranip")
            if ',' in area.name:
                # Create a canonical version of the area name
                canonical_name = area.name.split(',')[0].strip()
                area_name_mapping[area.id] = canonical_name
            else:
                area_name_mapping[area.id] = area.name.strip()

        # Get top areas by user count with distinct counting
        # Include both direct patient references and patient area relationships
        from django.db.models import Q, Value, IntegerField
        from django.db.models.functions import Coalesce

        top_areas = Area.objects.annotate(
            therapist_count=Count('therapists__therapist', distinct=True),
            # Count patients from both direct references and relationships
            patient_count_direct=Count('direct_patients', distinct=True),
            patient_count_rel=Count('patients__patient', distinct=True),
            # Combine both counts (avoiding duplicates)
            patient_count=Coalesce(
                Count(
                    'id',
                    filter=Q(direct_patients__isnull=False) | Q(patients__isnull=False),
                    distinct=True
                ),
                Value(0),
                output_field=IntegerField()
            ),
            doctor_count=Count('doctors__doctor', distinct=True)
        ).annotate(
            # Calculate total users based on the combined counts
            total_users=F('therapist_count') + F('patient_count') + F('doctor_count')
        )

        # Group areas with similar names
        grouped_areas = {}
        for area in top_areas:
            canonical_name = area_name_mapping.get(area.id, area.name)

            if canonical_name not in grouped_areas:
                # Create a display name that clearly identifies cities
                display_name = canonical_name
                if canonical_name.lower() == area.city.lower() and area.city:
                    display_name = f"{canonical_name} (City)"

                grouped_areas[canonical_name] = {
                    'id': area.id,
                    'name': canonical_name,
                    'display_name': display_name,
                    'city': area.city,
                    'state': area.state,
                    'therapist_count': area.therapist_count,
                    'patient_count': area.patient_count,
                    'doctor_count': area.doctor_count,
                    'total_users': area.total_users
                }
            else:
                # Merge counts for areas with the same canonical name
                grouped_areas[canonical_name]['therapist_count'] += area.therapist_count
                grouped_areas[canonical_name]['patient_count'] += area.patient_count
                grouped_areas[canonical_name]['doctor_count'] += area.doctor_count
                grouped_areas[canonical_name]['total_users'] += area.total_users

        # Convert the grouped areas dictionary to a list
        top_areas_list = list(grouped_areas.values())

        # Sort by total users
        top_areas_list.sort(key=lambda x: x['total_users'], reverse=True)

        # Take the top 10 areas
        top_areas_list = top_areas_list[:10]

        # Get areas with most therapist-patient relationships
        areas_with_relationships = Area.objects.annotate(
            relationship_count=Count('relationships')
        ).order_by('-relationship_count')[:5]

        # Get therapists with multiple areas
        therapists_with_areas = Therapist.objects.annotate(
            area_count=Count('service_areas')
        ).filter(area_count__gt=0).order_by('-area_count')[:5]

        therapists_data = []
        for therapist in therapists_with_areas:
            areas = []
            for area in therapist.service_areas.all().select_related('area'):
                # Create a display name that properly identifies city vs area
                display_name = area.area.name

                # Add a city indicator if the name is the same as the city
                if area.area.name.lower() == area.area.city.lower() and area.area.city:
                    display_name = f"{area.area.name} (City)"

                areas.append({
                    'id': area.area.id,
                    'name': area.area.name,
                    'display_name': display_name,
                    'priority': area.priority
                })
            therapists_data.append({
                'id': therapist.id,
                'name': f"{therapist.user.first_name} {therapist.user.last_name}",
                'area_count': therapist.area_count,
                'areas': areas
            })

        # Prepare response
        response_data = {
            'counts': {
                'total_areas': total_areas,
                'areas_with_therapists': areas_with_therapists,
                'areas_with_patients': areas_with_patients,
                'areas_with_doctors': areas_with_doctors,
                'therapist_count': distinct_therapists,  # Use distinct count instead of total
                'patient_count': distinct_patients,
                'doctor_count': distinct_doctors,
                'avg_areas_per_therapist': round(avg_areas_per_therapist, 1)
            },
            'top_areas': top_areas_list,  # Include all areas
            'areas_with_relationships': AreaAnalyticsSerializer(areas_with_relationships, many=True).data,
            'therapists_with_areas': therapists_data
        }

        return Response(response_data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Search for areas and users within areas
        """
        query = request.query_params.get('q', '')
        role_filter = request.query_params.get('role', '')

        if not query:
            return Response({'error': 'Search query is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Search for areas
        areas = Area.objects.filter(
            Q(name__icontains=query) |
            Q(city__icontains=query) |
            Q(state__icontains=query) |
            Q(zip_code__icontains=query)
        )

        # Filter by role if provided
        if role_filter == 'therapist':
            areas = areas.filter(therapists__isnull=False).distinct()
        elif role_filter == 'patient':
            areas = areas.filter(patients__isnull=False).distinct()
        elif role_filter == 'doctor':
            areas = areas.filter(doctors__isnull=False).distinct()

        # We don't need to filter out areas where name is the same as city
        # Instead, we'll use the display_name field to properly identify them
        serializer = AreaAnalyticsSerializer(areas, many=True)
        return Response(serializer.data)
