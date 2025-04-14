"""
Purpose: API views for user management
Connected to: User authentication and profile management
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, Patient, Therapist, Doctor
from .serializers import UserSerializer, PatientSerializer, TherapistSerializer, DoctorSerializer
from .permissions import IsAdminUser, IsTherapist, IsDoctor, IsPatient

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
            therapist = Therapist.objects.get(user=user)
            return Patient.objects.filter(appointments__therapist=therapist).distinct()
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
            patient = Patient.objects.get(user=user)
            return Therapist.objects.filter(appointments__patient=patient).distinct()
        return Therapist.objects.none()

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
