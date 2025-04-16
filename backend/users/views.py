"""
Purpose: API views for user management
Connected to: User authentication and profile management
""" 
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import PatientSignupStep1Serializer, PatientSignupStep2Serializer, PatientSignupStep3Serializer
from .models import User, Patient  # Assuming you have User and Patient models
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.db import transaction
from .models import Therapist, Doctor
from .serializers import UserSerializer, PatientSerializer, TherapistSerializer, DoctorSerializer
from .permissions import IsAdminUser, IsTherapistUser, IsDoctorUser, IsPatientUser

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
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


# Create API views for the 3-step patient registration

class PatientSignupStep1View(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = PatientSignupStep1Serializer(data=request.data)
        if serializer.is_valid():
            # Create a basic user record (without patient details yet)
            user = User.objects.create_user(
                first_name=serializer.validated_data['name'],  # Assuming name is first_name + last_name
                last_name="", # TODO: handle last name
                email=serializer.validated_data['email'],
                phone=serializer.validated_data['mobile'],  # Assuming mobile is phone
                password=serializer.validated_data['password'],
                role="patient",
                is_active=False  # Inactive until all steps are completed
            )

            # Return a temporary token or user ID to link subsequent steps
            return Response({'user_id': str(user.id)}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PatientSignupStep2View(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        # Retrieve the user ID from the request (you might use a token in a real app)
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id, is_active=False, role="patient")
        except User.DoesNotExist:
            return Response({'error': 'Invalid or inactive user.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = PatientSignupStep2Serializer(data=request.data)
        if serializer.is_valid():
            # Create or update the Patient record linked to the User
            patient, created = Patient.objects.get_or_create(user=user)
            patient.gender = serializer.validated_data['gender']
            patient.age = serializer.validated_data['age']
            patient.address = serializer.validated_data['address']
            patient.city = serializer.validated_data['city']
            patient.state = serializer.validated_data['state']
            patient.zip_code = serializer.validated_data['zipCode']  # Assuming zipCode is zip_code
            patient.save()

            return Response({'user_id': user_id}, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PatientSignupStep3View(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        # Retrieve the user ID (or token)
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id, is_active=False, role="patient")
            patient = Patient.objects.get(user=user)
        except (User.DoesNotExist, Patient.DoesNotExist):
            return Response({'error': 'Invalid or incomplete user/patient.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = PatientSignupStep3Serializer(data=request.data)
        if serializer.is_valid():
            patient.referred_by = serializer.validated_data['referred_by']
            patient.reference_detail = serializer.validated_data.get('referenceDetail', "")  # Optional field
            patient.treatment_location = serializer.validated_data['treatmentLocation']
            patient.disease = serializer.validated_data['disease']
            patient.save()

            # Activate the user account upon successful completion
            user.is_active = True
            user.save()

            # In a real app, you'd generate a JWT token here and return it
            # For now, we'll just return a success message
            return Response({'message': 'Patient registration complete.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
