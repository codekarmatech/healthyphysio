"""
Purpose: API views for user management
Connected to: User authentication and profile management
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.db import transaction
from .models import User, Patient, Therapist, Doctor
from .serializers import UserSerializer, PatientSerializer, TherapistSerializer, DoctorSerializer
from .permissions import IsAdminUser, IsTherapistUser, IsDoctorUser, IsPatientUser

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Patient.objects.all()
        elif user.is_therapist:
            # Therapists can only see their assigned patients
            try:
                therapist = Therapist.objects.get(user=user)
                return Patient.objects.filter(appointments__therapist=therapist).distinct()
            except Therapist.DoesNotExist:
                return Patient.objects.none()
        elif user.is_patient:
            # Patients can only see their own profile
            return Patient.objects.filter(user=user)
        return Patient.objects.none()

class TherapistViewSet(viewsets.ModelViewSet):
    queryset = Therapist.objects.all()
    serializer_class = TherapistSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Therapist.objects.all()
        elif user.is_therapist:
            # Therapists can only see their own profile
            return Therapist.objects.filter(user=user)
        elif user.is_patient:
            # Patients can see therapists assigned to them
            try:
                patient = Patient.objects.get(user=user)
                return Therapist.objects.filter(appointments__patient=patient).distinct()
            except Patient.DoesNotExist:
                return Therapist.objects.none()
        return Therapist.objects.none()

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    # Fix permission classes to use the correct class name
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['role'] = user.role
        token['name'] = user.get_full_name() or user.username
        
        return token

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    Register a new user with their role-specific profile
    """
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        with transaction.atomic():
            user = serializer.save()
            
            # Create role-specific profile
            if user.role == User.Role.PATIENT:
                Patient.objects.create(user=user)
            elif user.role == User.Role.THERAPIST:
                Therapist.objects.create(
                    user=user,
                    license_number=request.data.get('license_number', ''),
                    specialization=request.data.get('specialization', '')
                )
            elif user.role == User.Role.DOCTOR:
                Doctor.objects.create(
                    user=user,
                    license_number=request.data.get('license_number', ''),
                    specialization=request.data.get('specialization', '')
                )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
