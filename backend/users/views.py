"""
Purpose: API views for user management
Connected to: User authentication and profile management
"""
from rest_framework import status, serializers  # Add serializers import here
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import PatientSignupStep1Serializer, PatientSignupStep2Serializer, PatientSignupStep3Serializer
from .models import User, Patient  # Assuming you have User and Patient models
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.contrib.auth import get_user_model  # Add this import for get_user_model
from .models import Therapist, Doctor, ProfileChangeRequest
from .serializers import UserSerializer, PatientSerializer, TherapistSerializer, DoctorSerializer, ProfileChangeRequestSerializer
from .permissions import IsAdminUser, IsTherapistUser, IsDoctorUser, IsPatientUser
import traceback
# Add these imports for timezone and timedelta
from django.utils import timezone
from datetime import timedelta
import json
from scheduling.models import Appointment

# Import for CustomTokenObtainPairSerializer
from .serializers import CustomTokenObtainPairSerializer

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

    @action(detail=True, methods=['get'], url_path='status')
    def status(self, request, pk=None):
        """
        Get the approval status of a specific therapist
        """
        try:
            print(f"TherapistViewSet.status called for therapist ID: {pk}")

            # Try to get the therapist directly instead of using get_object
            # This gives us more control over error handling
            try:
                therapist = Therapist.objects.get(id=pk)
                print(f"Found therapist with ID {pk}: {therapist.user.username}")
            except Therapist.DoesNotExist:
                print(f"No therapist found with ID {pk}")
                # Return a 404 with a clear error message
                return Response(
                    {"error": f"Therapist with ID {pk} not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Use the same helper method as TherapistStatusView for consistency
            return TherapistStatusView()._get_therapist_status_response(therapist)
        except Exception as e:
            print(f"Error in TherapistViewSet.status: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], url_path='profile')
    def get_profile(self, request):
        """
        Get the therapist profile for the current user
        """
        try:
            therapist = Therapist.objects.get(user=request.user)
            serializer = self.get_serializer(therapist)
            return Response(serializer.data)
        except Therapist.DoesNotExist:
            return Response(
                {"error": "Therapist profile not found for current user"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['put', 'patch'], url_path='profile')
    def update_profile(self, request):
        """
        Update the therapist profile for the current user
        Creates a change request that requires admin approval
        """
        try:
            therapist = Therapist.objects.get(user=request.user)
            serializer = self.get_serializer(therapist, data=request.data, partial=True)

            if serializer.is_valid():
                # The update method in the serializer will create a change request
                serializer.save()
                return Response({
                    "message": "Profile update request submitted for approval",
                    "profile": serializer.data
                })
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Therapist.DoesNotExist:
            return Response(
                {"error": "Therapist profile not found for current user"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'], url_path='change-requests')
    def get_change_requests(self, request):
        """
        Get all profile change requests for the current user
        """
        try:
            therapist = Therapist.objects.get(user=request.user)
            change_requests = ProfileChangeRequest.objects.filter(therapist=therapist)
            serializer = ProfileChangeRequestSerializer(change_requests, many=True)
            return Response(serializer.data)
        except Therapist.DoesNotExist:
            return Response(
                {"error": "Therapist profile not found for current user"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'], url_path='request-deletion')
    def request_deletion(self, request):
        """
        Create a profile deletion request that requires admin approval
        """
        try:
            therapist = Therapist.objects.get(user=request.user)
            reason = request.data.get('reason', '')

            if not reason:
                return Response(
                    {"error": "Reason for deletion is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create a special change request for deletion
            change_request = ProfileChangeRequest.objects.create(
                therapist=therapist,
                requested_by=request.user,
                current_data=json.dumps({
                    'license_number': therapist.license_number,
                    'specialization': therapist.specialization,
                    'years_of_experience': therapist.years_of_experience,
                    'experience': therapist.experience,
                    'residential_address': therapist.residential_address,
                    'preferred_areas': therapist.preferred_areas,
                }),
                requested_data=json.dumps({'delete_profile': True}),
                reason=reason,
                status='pending'
            )

            serializer = ProfileChangeRequestSerializer(change_request)
            return Response({
                "message": "Profile deletion request submitted for approval",
                "change_request": serializer.data
            })
        except Therapist.DoesNotExist:
            return Response(
                {"error": "Therapist profile not found for current user"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'], url_path='therapist-profile')
    def get_therapist_profile(self, request, pk=None):
        """
        Get the therapist profile for a specific user ID
        """
        try:
            user = User.objects.get(id=pk)
            if user.role != 'therapist':
                return Response(
                    {"error": "User is not a therapist"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            therapist = Therapist.objects.get(user=user)
            serializer = self.get_serializer(therapist)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Therapist.DoesNotExist:
            return Response(
                {"error": "Therapist profile not found for this user"},
                status=status.HTTP_404_NOT_FOUND
            )

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    # Fix permission classes to use the correct class name
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]


class ProfileChangeRequestViewSet(viewsets.ModelViewSet):
    queryset = ProfileChangeRequest.objects.all()
    serializer_class = ProfileChangeRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return ProfileChangeRequest.objects.all()
        elif user.is_therapist:
            # Therapists can only see their own change requests
            try:
                therapist = Therapist.objects.get(user=user)
                return ProfileChangeRequest.objects.filter(therapist=therapist)
            except Therapist.DoesNotExist:
                return ProfileChangeRequest.objects.none()
        return ProfileChangeRequest.objects.none()

    @action(detail=True, methods=['post'], url_path='approve')
    def approve_request(self, request, pk=None):
        """
        Approve a profile change request (admin only)
        """
        if not request.user.is_admin:
            return Response(
                {"error": "Only administrators can approve change requests"},
                status=status.HTTP_403_FORBIDDEN
            )

        change_request = self.get_object()

        if change_request.status != 'pending':
            return Response(
                {"error": f"Change request is already {change_request.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Approve the change request
        change_request.approve(request.user)

        serializer = self.get_serializer(change_request)
        return Response({
            "message": "Change request approved successfully",
            "change_request": serializer.data
        })

    @action(detail=True, methods=['post'], url_path='reject')
    def reject_request(self, request, pk=None):
        """
        Reject a profile change request (admin only)
        """
        if not request.user.is_admin:
            return Response(
                {"error": "Only administrators can reject change requests"},
                status=status.HTTP_403_FORBIDDEN
            )

        change_request = self.get_object()

        if change_request.status != 'pending':
            return Response(
                {"error": f"Change request is already {change_request.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get the rejection reason from the request data
        reason = request.data.get('reason', '')

        if not reason:
            return Response(
                {"error": "Rejection reason is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Reject the change request
        change_request.reject(request.user, reason)

        serializer = self.get_serializer(change_request)
        return Response({
            "message": "Change request rejected successfully",
            "change_request": serializer.data
        })


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
                {'username': ['Must include either username, email or phone number']}
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
    """
    Custom token view that extends the standard JWT token view to:
    1. Support authentication with username, email, or phone
    2. Return user data along with the token
    3. Handle errors gracefully
    4. Properly log authentication attempts

    This implementation follows security best practices and avoids the RawPostDataException
    by not accessing request.body multiple times.
    """
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        try:
            # Call the parent class method to get the token
            response = super().post(request, *args, **kwargs)

            # If we get here, authentication was successful
            # Find the authenticated user to include in the response
            User = get_user_model()
            user = None

            # Try to identify the user from the provided credentials
            username = request.data.get('username')
            email = request.data.get('email')
            phone = request.data.get('phone')

            # Try each identifier in order
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

            # Add user data to the response if user was found
            if user:
                response.data['user'] = UserSerializer(user).data

            return response

        except Exception as e:
            # Log the error
            import logging
            logger = logging.getLogger('auth')
            logger.error(f"Authentication error: {str(e)}")

            # Re-raise the exception to let DRF handle the response
            raise

@api_view(['POST'])
@permission_classes([AllowAny])
def test_login(request):
    """
    Test login endpoint for debugging authentication issues
    """
    try:
        # Extract credentials from request
        username = request.data.get('username')
        email = request.data.get('email')
        phone = request.data.get('phone')
        password = request.data.get('password')

        # Log the request (without password)
        print(f"Test login attempt with: username={username}, email={email}, phone={phone}")

        # Validate required fields
        if not password:
            return Response({'password': ['Password is required']}, status=status.HTTP_400_BAD_REQUEST)

        if not any([username, email, phone]):
            return Response({'username': ['Must include either username, email or phone number']}, status=status.HTTP_400_BAD_REQUEST)

        # Try to find the user
        user = None
        User = get_user_model()

        # Try each identifier in order
        if username:
            try:
                user = User.objects.get(username=username)
                print(f"Found user by username: {username}")
            except User.DoesNotExist:
                print(f"No user found with username: {username}")
                pass

        if not user and email:
            try:
                user = User.objects.get(email=email)
                print(f"Found user by email: {email}")
            except User.DoesNotExist:
                print(f"No user found with email: {email}")
                pass

        if not user and phone:
            try:
                user = User.objects.get(phone=phone)
                print(f"Found user by phone: {phone}")
            except User.DoesNotExist:
                print(f"No user found with phone: {phone}")
                pass

        # Validate user and password
        if not user:
            print(f"Authentication failed: No user found with provided credentials")
            return Response({'username': ['No active account found with the given credentials']}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            print(f"Authentication failed: Invalid password for user {user.username}")
            return Response({'username': ['No active account found with the given credentials']}, status=status.HTTP_401_UNAUTHORIZED)

        # Authentication successful
        print(f"Authentication successful for user: {user.username}")

        # Return user data
        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'firstName': user.first_name,
                'lastName': user.last_name,
                'role': getattr(user, 'role', 'user'),
            }
        })
    except Exception as e:
        print(f"Test login error: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout a user by blacklisting their refresh token
    """
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Get the token from the request
        token = RefreshToken(refresh_token)

        # Add the token to the blacklist
        token.blacklist()

        return Response({"success": "User logged out successfully"}, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Logout error: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
    """
    API view to get the approval status of the current therapist or a specific therapist (for admins)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        GET method to retrieve therapist approval status
        - For therapists: returns their own status
        - For admins: returns status of the therapist specified by therapist_id query parameter
        """
        try:
            # If the user is a therapist, return their own status
            if hasattr(request.user, 'therapist_profile'):
                therapist = request.user.therapist_profile
                return self._get_therapist_status_response(therapist)

            # If the user is an admin and a therapist_id is provided, return that therapist's status
            elif request.user.is_staff and request.query_params.get('therapist_id'):
                therapist_id = request.query_params.get('therapist_id')
                try:
                    therapist = Therapist.objects.get(id=therapist_id)
                    return self._get_therapist_status_response(therapist)
                except Therapist.DoesNotExist:
                    return Response(
                        {"error": f"Therapist with ID {therapist_id} not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                return Response(
                    {"error": "User is not a therapist or therapist_id not provided"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            print(f"Error in TherapistStatusView: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _get_therapist_status_response(self, therapist):
        """
        Helper method to create a consistent response for therapist status
        """
        try:
            # Debug logging
            print(f"Creating status response for therapist ID: {therapist.id}")

            # Create a simple response with standard fields
            response_data = {
                # General approval
                'is_approved': therapist.is_approved,
                'approval_date': therapist.approval_date,
                # Compatibility fields
                'account_approved': therapist.is_approved,
                'account_approval_date': therapist.approval_date
            }

            # Add feature-specific fields with defaults
            feature_fields = [
                ('treatment_plans_approved', False),
                ('treatment_plans_approval_date', None),
                ('reports_approved', False),
                ('reports_approval_date', None),
                ('attendance_approved', False),
                ('attendance_approval_date', None)
            ]

            # Add visits_approved field for frontend compatibility
            # This is not a real field in the model, but the frontend expects it
            response_data['visits_approved'] = therapist.is_approved

            for field_name, default_value in feature_fields:
                if hasattr(therapist, field_name):
                    field_value = getattr(therapist, field_name)
                    response_data[field_name] = field_value
                else:
                    response_data[field_name] = default_value

            print(f"Returning therapist status: {response_data}")
            return Response(response_data)
        except Exception as e:
            print(f"Error creating therapist status response: {str(e)}")
            print(traceback.format_exc())

            # Fallback to a simpler response if there's an error
            try:
                is_approved = getattr(therapist, 'is_approved', False)
                return Response({
                    'is_approved': is_approved,
                    'account_approved': is_approved,
                    'treatment_plans_approved': is_approved,
                    'reports_approved': is_approved,
                    'attendance_approved': is_approved,
                    'visits_approved': is_approved  # For frontend compatibility
                })
            except Exception as inner_e:
                print(f"Error in fallback response: {str(inner_e)}")
                # Ultimate fallback - all permissions denied
                return Response({
                    'is_approved': False,
                    'account_approved': False,
                    'treatment_plans_approved': False,
                    'reports_approved': False,
                    'attendance_approved': False,
                    'visits_approved': False  # For frontend compatibility
                }, status=status.HTTP_200_OK)  # Return 200 instead of 500 for better frontend handling

class TherapistStatusDetailView(APIView):
    """
    API view to get the status of a specific therapist by ID
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk=None, therapist_id=None, **kwargs):
        """
        GET method to retrieve a specific therapist's approval status by ID
        Accepts therapist ID from URL path parameter (pk or therapist_id)
        """
        try:
            # Debug print
            print(f"TherapistStatusDetailView called with pk={pk}, therapist_id={therapist_id}, kwargs={kwargs}, path={request.path}")

            # Get the therapist ID from either pk or therapist_id parameter
            if pk is not None:
                final_therapist_id = pk
                print(f"Using pk parameter: {final_therapist_id}")
            elif therapist_id is not None:
                final_therapist_id = therapist_id
                print(f"Using therapist_id parameter: {final_therapist_id}")
            # Check kwargs (for path parameters defined in urls.py)
            elif 'therapist_id' in kwargs:
                final_therapist_id = kwargs.get('therapist_id')
                print(f"Using kwargs therapist_id: {final_therapist_id}")
            else:
                # Extract from path if it matches a pattern like /therapists/123/status/
                import re
                match = re.search(r'/therapists/(\d+)(?:/status/?)?', request.path)
                if match:
                    final_therapist_id = match.group(1)
                    print(f"Extracted therapist_id from URL path: {final_therapist_id}")
                else:
                    final_therapist_id = None
                    print("Could not extract therapist_id from URL path")

            if not final_therapist_id:
                return Response(
                    {"error": "Therapist ID is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if the user is authorized to view this therapist's status
            user = request.user

            # Admin can view any therapist's status
            if not user.is_staff:
                # Therapists can only view their own status
                if hasattr(user, 'therapist_profile'):
                    therapist = user.therapist_profile
                    if str(therapist.id) != str(final_therapist_id):
                        return Response(
                            {"error": "You are not authorized to view this therapist's status"},
                            status=status.HTTP_403_FORBIDDEN
                        )
                # Other users are not allowed
                else:
                    return Response(
                        {"error": "You are not authorized to view therapist status"},
                        status=status.HTTP_403_FORBIDDEN
                    )

            # Get the therapist
            try:
                therapist = Therapist.objects.get(id=final_therapist_id)
            except Therapist.DoesNotExist:
                return Response(
                    {"error": f"Therapist with ID {final_therapist_id} not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Use the same helper method as TherapistStatusView for consistency
            return TherapistStatusView()._get_therapist_status_response(therapist)

        except Exception as e:
            print(f"Error in TherapistStatusDetailView: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PendingTherapistsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request):
        """GET to list pending therapists"""
        therapists = Therapist.objects.filter(is_approved=False)

        # Get the user data for each therapist
        pending_therapists = []
        for therapist in therapists:
            user_data = {
                'id': therapist.id,
                'first_name': therapist.user.first_name,
                'last_name': therapist.user.last_name,
                'email': therapist.user.email,
                'phone': therapist.user.phone,
                'license_number': therapist.license_number,
                'specialization': therapist.specialization,
                'years_of_experience': therapist.years_of_experience
            }
            pending_therapists.append(user_data)

        return Response(pending_therapists)

class ApproveTherapistView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request):
        """GET to list pending therapists (if needed)"""
        therapists = Therapist.objects.filter(is_approved=False)
        serializer = TherapistSerializer(therapists, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        """POST to approve or un-approve a specific therapist"""
        try:
            therapist = Therapist.objects.get(id=pk)

            # Get the approval status from request data
            # Default to True if not specified (backward compatibility)
            is_approved = request.data.get('is_approved', True)

            # Get feature-specific approvals if provided
            treatment_plans_approved = request.data.get('treatment_plans_approved', therapist.treatment_plans_approved)
            reports_approved = request.data.get('reports_approved', therapist.reports_approved)
            attendance_approved = request.data.get('attendance_approved', therapist.attendance_approved)

            # Update therapist approval status
            therapist.is_approved = is_approved

            # Only update approval date if approving
            if is_approved:
                therapist.approval_date = timezone.now()
            else:
                # If un-approving, set approval_date to None
                therapist.approval_date = None

            # Update feature-specific approvals
            if treatment_plans_approved != therapist.treatment_plans_approved:
                therapist.treatment_plans_approved = treatment_plans_approved
                if treatment_plans_approved:
                    therapist.treatment_plans_approval_date = timezone.now()
                else:
                    therapist.treatment_plans_approval_date = None

            if reports_approved != therapist.reports_approved:
                therapist.reports_approved = reports_approved
                if reports_approved:
                    therapist.reports_approval_date = timezone.now()
                else:
                    therapist.reports_approval_date = None

            if attendance_approved != therapist.attendance_approved:
                therapist.attendance_approved = attendance_approved
                if attendance_approved:
                    therapist.attendance_approval_date = timezone.now()
                else:
                    therapist.attendance_approval_date = None

            therapist.save()

            # Return the updated therapist data
            serializer = TherapistSerializer(therapist)
            return Response({
                "status": "Therapist approval status updated successfully",
                "therapist": serializer.data
            })
        except Therapist.DoesNotExist:
            return Response(
                {"error": "Therapist not found"},
                status=status.HTTP_404_NOT_FOUND
            )

class TherapistDashboardSummaryViewSet(viewsets.ViewSet):
    """
    API endpoint for consolidated therapist dashboard data.
    This endpoint combines multiple API calls into a single request to improve performance.
    It can be used by both therapists to view their own dashboard and by admins to view a specific therapist's dashboard.
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        # Get the therapist - either the current user or a specified therapist (for admins)
        therapist_id = request.query_params.get('therapist_id')
        user = request.user

        try:
            # If therapist_id is provided and user is admin, get that therapist
            if therapist_id and user.is_admin:
                therapist = Therapist.objects.get(id=therapist_id)
                print(f"Admin viewing dashboard for therapist ID: {therapist_id}")
            # Otherwise, get the current user's therapist profile
            elif user.is_therapist:
                therapist = Therapist.objects.get(user=user)
                print(f"Therapist viewing own dashboard, ID: {therapist.id}")
            else:
                return Response(
                    {"error": "You must be a therapist or an admin viewing a specific therapist"},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Therapist.DoesNotExist:
            return Response(
                {"error": "Therapist profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get current date and time
        now = timezone.now()
        today = now.date()
        current_month = now.month
        current_year = now.year

        # Get upcoming appointments
        upcoming_appointments = Appointment.objects.filter(
            therapist=therapist,
            datetime__gt=now,
            status__in=['scheduled', 'rescheduled']
        )
        upcoming_appointments_count = upcoming_appointments.count()

        # Get today's appointments
        today_appointments = Appointment.objects.filter(
            therapist=therapist,
            datetime__date=today,
            status__in=['scheduled', 'rescheduled']
        )
        today_appointments_count = today_appointments.count()

        # Get total patients assigned to this therapist
        total_patients = Patient.objects.filter(
            appointments__therapist=therapist
        ).distinct().count()

        # Get pending assessments
        from assessments.models import Assessment
        pending_assessments = Assessment.objects.filter(
            created_by=therapist.user,
            pending_admin_approval=True
        )
        pending_assessments_count = pending_assessments.count()

        # Get monthly earnings
        from earnings.models import EarningRecord
        monthly_earnings = 0
        try:
            # Get earnings for the current month
            earnings_records = EarningRecord.objects.filter(
                therapist=therapist,
                date__year=current_year,
                date__month=current_month
            )
            monthly_earnings = sum(record.amount for record in earnings_records)
        except Exception as e:
            print(f"Error fetching earnings data: {str(e)}")

        # Get equipment allocations and requests
        from equipment.models import EquipmentAllocation, AllocationRequest
        equipment_allocations = EquipmentAllocation.objects.filter(
            therapist=therapist,
            status__in=['approved', 'overdue']
        )
        equipment_allocations_count = equipment_allocations.count()

        equipment_requests = AllocationRequest.objects.filter(
            therapist=therapist,
            status='pending'
        )
        equipment_requests_count = equipment_requests.count()

        # Get active visits
        from visits.models import Visit
        active_visits = Visit.objects.filter(
            therapist=therapist,
            status__in=['scheduled', 'en_route', 'arrived', 'in_session']
        )
        active_visits_count = active_visits.count()

        # Get pending reports
        from visits.models import TherapistReport
        pending_reports = TherapistReport.objects.filter(
            therapist=therapist,
            status='draft'
        )
        pending_reports_count = pending_reports.count()

        # Get treatment plan change requests
        from treatment_plans.models import TreatmentPlanChangeRequest
        treatment_plan_change_requests = TreatmentPlanChangeRequest.objects.filter(
            requested_by=therapist.user,
            status='pending'
        )
        pending_treatment_plan_change_requests_count = treatment_plan_change_requests.count()

        # Get recent appointments (limit to 5)
        recent_appointments = Appointment.objects.filter(
            therapist=therapist
        ).order_by('-datetime')[:5]

        # Format recent appointments
        formatted_appointments = []
        for appointment in recent_appointments:
            formatted_appointments.append({
                'id': appointment.id,
                'patient_name': f"{appointment.patient.user.first_name} {appointment.patient.user.last_name}",
                'datetime': appointment.datetime,
                'status': appointment.status.lower(),
                'issue': appointment.issue or 'Consultation',
            })

        # Prepare response data
        response_data = {
            "upcoming_appointments_count": upcoming_appointments_count,
            "today_appointments_count": today_appointments_count,
            "total_patients": total_patients,
            "pending_assessments_count": pending_assessments_count,
            "monthly_earnings": monthly_earnings,
            "equipment_allocations_count": equipment_allocations_count,
            "equipment_requests_count": equipment_requests_count,
            "active_visits_count": active_visits_count,
            "pending_reports_count": pending_reports_count,
            "pending_treatment_plan_change_requests_count": pending_treatment_plan_change_requests_count,
            "recent_appointments": formatted_appointments,
            "treatment_plan_change_requests": [
                {
                    "id": request.id,
                    "treatment_plan_id": request.treatment_plan.id,
                    "treatment_plan_title": request.treatment_plan.title,
                    "reason": request.reason,
                    "urgency": request.urgency,
                    "created_at": request.created_at
                } for request in treatment_plan_change_requests
            ]
        }

        return Response(response_data)

class PatientDashboardSummaryViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsPatientUser]

    def list(self, request):
        # Get the patient profile
        try:
            patient = request.user.patient_profile
        except:
            return Response({"error": "Patient profile not found"}, status=status.HTTP_404_NOT_FOUND)

        # Get current date and time
        now = timezone.now()
        today = now.date()

        # Get upcoming appointments
        upcoming_appointments = Appointment.objects.filter(
            patient=patient,
            datetime__gt=now,
            status='scheduled'
        ).order_by('datetime')[:5]

        # Get recent completed sessions
        completed_sessions = Appointment.objects.filter(
            patient=patient,
            status='completed'
        ).order_by('-datetime')[:5]

        # Get total completed sessions
        total_completed = Appointment.objects.filter(
            patient=patient,
            status='completed'
        ).count()

        # Get missed appointments
        missed_appointments = Appointment.objects.filter(
            patient=patient,
            status='missed'
        ).count()

        # Calculate attendance rate
        total_appointments = total_completed + missed_appointments
        attendance_rate = (total_completed / total_appointments * 100) if total_appointments > 0 else 0

        # Prepare response data
        response_data = {
            "upcoming_appointments": [
                {
                    "id": appointment.id,
                    "session_code": appointment.session_code,
                    "datetime": appointment.datetime,
                    "therapist_name": appointment.therapist.user.get_full_name(),
                    "issue": appointment.issue
                } for appointment in upcoming_appointments
            ],
            "recent_sessions": [
                {
                    "id": appointment.id,
                    "session_code": appointment.session_code,
                    "datetime": appointment.datetime,
                    "therapist_name": appointment.therapist.user.get_full_name(),
                    "issue": appointment.issue
                } for appointment in completed_sessions
            ],
            "stats": {
                "total_sessions": total_completed,
                "missed_appointments": missed_appointments,
                "attendance_rate": round(attendance_rate, 1)
            }
        }

        return Response(response_data)

class DoctorDashboardSummaryViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsDoctorUser]

    def list(self, request):
        # Get the doctor profile
        try:
            doctor = request.user.doctor_profile
        except:
            return Response({"error": "Doctor profile not found"}, status=status.HTTP_404_NOT_FOUND)

        # Get current date and time
        now = timezone.now()
        today = now.date()

        # Since we don't have the exact model structure for doctor referrals,
        # let's create a simplified response with placeholder data
        # You'll need to adjust this based on your actual model relationships

        # Prepare response data with placeholder values
        response_data = {
            "stats": {
                "total_referrals": 0,
                "active_patients": 0,
                "new_referrals_this_month": 0
            },
            "recent_referrals": []
        }

        return Response(response_data)

class AdminDashboardSummaryViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def list(self, request):
        # Get current date and time
        now = timezone.now()
        today = now.date()

        # Get counts for different user types
        total_patients = Patient.objects.count()
        total_therapists = Therapist.objects.count()
        total_doctors = Doctor.objects.count()

        # Get appointment statistics
        total_appointments = Appointment.objects.count()
        completed_appointments = Appointment.objects.filter(status='completed').count()
        missed_appointments = Appointment.objects.filter(status='missed').count()

        # Calculate completion rate
        completion_rate = (completed_appointments / total_appointments * 100) if total_appointments > 0 else 0

        # Get new users this month
        first_day_of_month = today.replace(day=1)
        new_patients_this_month = Patient.objects.filter(
            user__date_joined__gte=first_day_of_month
        ).count()

        # Get appointments for the next 7 days
        next_week = today + timedelta(days=7)
        upcoming_appointments = Appointment.objects.filter(
            datetime__gte=today,
            datetime__lt=next_week,
            status='scheduled'
        ).count()

        # Prepare response data
        response_data = {
            "user_stats": {
                "total_patients": total_patients,
                "total_therapists": total_therapists,
                "total_doctors": total_doctors,
                "new_patients_this_month": new_patients_this_month
            },
            "appointment_stats": {
                "total_appointments": total_appointments,
                "completed_appointments": completed_appointments,
                "missed_appointments": missed_appointments,
                "completion_rate": round(completion_rate, 1),
                "upcoming_appointments": upcoming_appointments
            }
        }

        return Response(response_data)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def update_therapist_approvals(request, therapist_id):
    """
    Update the approval status for a therapist's features.
    Only admins can update approval statuses.
    """
    try:
        print(f"Updating approvals for therapist ID: {therapist_id}")
        print(f"Request data: {request.data}")

        therapist = get_object_or_404(Therapist, id=therapist_id)
        print(f"Found therapist: {therapist.user.username} (ID: {therapist.id})")

        # Get approval data from request
        # Use the field names that exist in the database
        is_approved = request.data.get('account_approved', therapist.is_approved)
        treatment_plans_approved = request.data.get('treatment_plans_approved', therapist.treatment_plans_approved)
        reports_approved = request.data.get('reports_approved', therapist.reports_approved)
        attendance_approved = request.data.get('attendance_approved', therapist.attendance_approved)

        print(f"Approval values from request: account={is_approved}, treatment_plans={treatment_plans_approved}, "
              f"reports={reports_approved}, attendance={attendance_approved}")

        # Update account approval using the field names that exist in the database
        if is_approved != therapist.is_approved:
            print(f"Updating is_approved: {therapist.is_approved} -> {is_approved}")
            therapist.is_approved = is_approved
            if is_approved:
                therapist.approval_date = timezone.now()
            else:
                therapist.approval_date = None

        # Update feature-specific approvals
        if treatment_plans_approved != therapist.treatment_plans_approved:
            print(f"Updating treatment_plans_approved: {therapist.treatment_plans_approved} -> {treatment_plans_approved}")
            therapist.treatment_plans_approved = treatment_plans_approved
            if treatment_plans_approved:
                therapist.treatment_plans_approval_date = timezone.now()
            else:
                therapist.treatment_plans_approval_date = None

        if reports_approved != therapist.reports_approved:
            print(f"Updating reports_approved: {therapist.reports_approved} -> {reports_approved}")
            therapist.reports_approved = reports_approved
            if reports_approved:
                therapist.reports_approval_date = timezone.now()
            else:
                therapist.reports_approval_date = None

        if attendance_approved != therapist.attendance_approved:
            print(f"Updating attendance_approved: {therapist.attendance_approved} -> {attendance_approved}")
            therapist.attendance_approved = attendance_approved
            if attendance_approved:
                therapist.attendance_approval_date = timezone.now()
            else:
                therapist.attendance_approval_date = None

        # Save changes
        therapist.save()
        print(f"Therapist approvals updated successfully")

        # Return updated therapist data
        serializer = TherapistSerializer(therapist)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:

        print(f"Error updating therapist approvals: {str(e)}")
        print(traceback.format_exc())
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )