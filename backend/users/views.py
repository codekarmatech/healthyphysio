"""
Purpose: API views for user management
Connected to: User authentication and profile management
""" 
from rest_framework import status, serializers  # Add serializers import here
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import PatientSignupStep1Serializer, PatientSignupStep2Serializer, PatientSignupStep3Serializer
from .models import User, Patient  # Assuming you have User and Patient models
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.db import transaction
from django.contrib.auth import get_user_model  # Add this import for get_user_model
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


# Update the CustomTokenObtainPairSerializer to handle multiple identifier types
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'username'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields[self.username_field].required = False
        self.fields['email'] = serializers.EmailField(required=False)
        self.fields['phone'] = serializers.CharField(required=False)

    def validate(self, attrs):
        # Check if any identifier is provided
        username = attrs.get('username')
        email = attrs.get('email')
        phone = attrs.get('phone')
        password = attrs.get('password')

        if not any([username, email, phone]):
            raise serializers.ValidationError(
                {'error': 'Must include either username, email or phone number'}
            )

        # Try to find the user
        user = None
        User = get_user_model()

        if username:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                pass

        if not user and email:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                pass

        if not user and phone:
            try:
                user = User.objects.get(phone=phone)
            except User.DoesNotExist:
                pass

        if not user or not user.check_password(password):
            raise serializers.ValidationError(
                {'error': 'No active account found with the given credentials'}
            )

        # Use the found user for token generation
        attrs[self.username_field] = user.username
        data = super().validate(attrs)

        # Add user data to response
        data['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'role': getattr(user, 'role', 'user'),  # Use getattr to safely get role
        }

        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['role'] = getattr(user, 'role', 'user')  # Use getattr to safely get role
        token['name'] = user.get_full_name() or user.username
        
        return token

# Assuming you have a TokenObtainPairView subclass
class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        # Call the parent class method to get the token
        response = super().post(request, *args, **kwargs)
        
        # Get the user from the credentials
        username = request.data.get('username')
        try:
            user = User.objects.get(username=username)
            # Add user data to the response
            response.data['user'] = UserSerializer(user).data
        except User.DoesNotExist:
            pass
        
        return response
    serializer_class = CustomTokenObtainPairSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    Register a new user with role-specific profile
    """
    data = request.data
    print(f"Received registration data: {data}")
    
    # Create a transaction to ensure all operations succeed or fail together
    with transaction.atomic():
        try:
            # Extract user data
            user_data = {
                'username': data.get('username'),
                'email': data.get('email'),
                'password': data.get('password'),
                'first_name': data.get('firstName', ''),
                'last_name': data.get('lastName', ''),
                'phone': data.get('phone', ''),
                'role': data.get('role', 'patient'),
            }
            
            # Create the user
            user_serializer = UserSerializer(data=user_data)
            if not user_serializer.is_valid():
                print(f"User serializer errors: {user_serializer.errors}")
                return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            user = user_serializer.save()
            user.set_password(data.get('password'))
            user.save()
            
            # Create role-specific profile
            if user.role == 'patient':
                patient_data = {
                    'date_of_birth': data.get('dateOfBirth'),
                    'gender': data.get('gender', ''),
                    'age': data.get('age', None),
                    'address': data.get('address', ''),
                    'city': data.get('city', ''),
                    'state': data.get('state', ''),
                    'zip_code': data.get('zipCode', ''),
                    'referred_by': data.get('referred_by', ''),
                    'reference_detail': data.get('referenceDetail', ''),
                    'treatment_location': data.get('treatmentLocation', ''),
                    'disease': data.get('disease', ''),
                    'medical_history': data.get('medicalHistory', ''),
                }
                
                # If the patient is being added by a doctor, set the referred_by field
                if request.user.is_authenticated and request.user.role == 'doctor':
                    patient_data['referred_by'] = f"{request.user.first_name} {request.user.last_name}"
                
                # Create the patient directly without using the serializer
                patient = Patient.objects.create(user=user, **patient_data)
                
                # Use serializer for the response instead of raw objects
                return Response({
                    'message': 'Patient registered successfully',
                    'user': UserSerializer(user).data
                }, status=status.HTTP_201_CREATED)
                
            elif user.role == 'therapist':
                # Convert years_of_experience to integer
                try:
                    years_exp_str = data.get('yearsOfExperience', '0') # Default to '0' string
                    years_exp_int = int(years_exp_str) if years_exp_str else 0
                except (ValueError, TypeError):
                    # Handle cases where conversion fails (e.g., non-numeric string)
                    return Response({'error': 'Invalid value provided for years of experience.'}, status=status.HTTP_400_BAD_REQUEST)

                therapist_data = {
                    'license_number': data.get('licenseNumber', ''),
                    'specialization': data.get('specialization', ''),
                    'years_of_experience': years_exp_int, # Use the converted integer
                    'experience': data.get('experience', ''),
                    'residential_address': data.get('residentialAddress', ''),
                    'preferred_areas': data.get('preferredAreas', ''),
                    # Add photo handling if needed
                }
                
                # Create the therapist directly
                therapist = Therapist.objects.create(user=user, **therapist_data)
                
            elif user.role == 'doctor':
                 # Convert years_of_experience to integer for Doctor as well
                try:
                    years_exp_str = data.get('yearsOfExperience', '0') # Default to '0' string
                    years_exp_int = int(years_exp_str) if years_exp_str else 0
                except (ValueError, TypeError):
                    # Handle cases where conversion fails (e.g., non-numeric string)
                    return Response({'error': 'Invalid value provided for years of experience.'}, status=status.HTTP_400_BAD_REQUEST)

                doctor_data = {
                    'license_number': data.get('licenseNumber', '') or data.get('medicalLicenseNumber', ''),
                    'specialization': data.get('specialization', ''),
                    'hospital_affiliation': data.get('hospitalAffiliation', ''),
                    'years_of_experience': years_exp_int, # Use the converted integer
                    'area': data.get('area', ''),
                }
                
                # Create the doctor directly
                doctor = Doctor.objects.create(user=user, **doctor_data)
            
            return Response({
                'message': 'User registered successfully',
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # Improved error handling
            import traceback
            print(f"Registration error: {str(e)}")
            print(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


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

# Add to existing imports at top
from rest_framework import permissions

# Then modify the permission classes like this:
class TherapistStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTherapistUser]
    
    def get(self, request):
        return Response({
            'is_approved': request.user.therapist.is_approved,
            'approval_date': request.user.therapist.approval_date
        })

class PendingTherapistsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

class ApproveTherapistView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        """GET to list pending therapists (if needed)"""
        therapists = Therapist.objects.filter(is_approved=False)
        serializer = TherapistSerializer(therapists, many=True)
        return Response(serializer.data)
    
    def post(self, request, pk):
        """POST to approve a specific therapist"""
        try:
            therapist = Therapist.objects.get(pk=pk)
            therapist.is_approved = True
            therapist.approval_date = timezone.now()
            therapist.save()
            return Response({"status": "Therapist approved"})
        except Therapist.DoesNotExist:
            return Response(
                {"error": "Therapist not found"},
                status=status.HTTP_404_NOT_FOUND
            )
