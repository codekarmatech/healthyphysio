"""
Financial-related views for earnings app
"""
from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.db.models import Q, Count, Sum, Avg, F
from django.utils import timezone
from decimal import Decimal

from users.models import Patient, Therapist, Doctor, User
from users.serializers import PatientSerializer, TherapistSerializer, DoctorSerializer
from users.permissions import IsAdminUser, IsTherapistUser, IsDoctorUser
from scheduling.models import Appointment
from scheduling.serializers import AppointmentSerializer
from earnings.models import EarningRecord

class PatientFinancialViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for retrieving patients with financial information
    This is a read-only endpoint used by the financial management dashboard
    """
    serializer_class = PatientSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'user__phone']
    ordering_fields = ['user__first_name', 'user__last_name', 'created_at']

    def get_permissions(self):
        """
        Only admin can access financial patient data
        """
        permission_classes = [permissions.IsAuthenticated, IsAdminUser]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Return all patients with additional financial information
        """
        queryset = Patient.objects.all().select_related('user')

        # Annotate with financial information
        queryset = queryset.annotate(
            total_sessions=Count('appointments'),
            completed_sessions=Count('appointments', filter=Q(appointments__status='completed'))
        )

        # Calculate pending payments using EarningRecord
        from earnings.models import EarningRecord
        for patient in queryset:
            # Count appointments with pending payment status in EarningRecord
            pending_count = EarningRecord.objects.filter(
                patient=patient,
                payment_status=EarningRecord.PaymentStatus.UNPAID
            ).count()

            # Add pending payments from partially paid records
            partial_count = EarningRecord.objects.filter(
                patient=patient,
                payment_status=EarningRecord.PaymentStatus.PARTIAL
            ).count()

            patient.pending_payments = pending_count + partial_count

        # Calculate attendance rate
        for patient in queryset:
            if patient.total_sessions > 0:
                patient.attendance_rate = (patient.completed_sessions / patient.total_sessions) * 100
            else:
                patient.attendance_rate = 0

            # Get the last appointment date
            try:
                last_appointment = Appointment.objects.filter(
                    patient=patient,
                    status='completed'
                ).order_by('-datetime').first()

                if last_appointment:
                    patient.last_appointment = last_appointment.datetime.date().isoformat()
                else:
                    patient.last_appointment = None
            except Exception:
                patient.last_appointment = None

        return queryset

    def list(self, request, *args, **kwargs):
        """
        List patients with financial information
        """
        print(f"PatientFinancialViewSet.list called with query params: {request.query_params}")

        # Get the base queryset
        queryset = self.get_queryset()
        print(f"Base queryset count: {queryset.count()}")

        # Apply filters
        filtered_queryset = self.filter_queryset(queryset)
        print(f"Filtered queryset count: {filtered_queryset.count()}")

        # Print search query if present
        search_query = request.query_params.get('search', '')
        if search_query:
            print(f"Searching for patients with query: '{search_query}'")

        # Check if we have any real data
        if not filtered_queryset.exists():
            print("No patients found in database, returning mock data")
            # No real data exists, return mock data
            mock_data = self.generate_mock_patients()
            page = self.paginate_queryset(mock_data)
            if page is not None:
                return self.get_paginated_response(page)
            return Response({
                "results": mock_data,
                "count": len(mock_data),
                "is_mock_data": True
            })

        # Real data exists, proceed with normal processing
        print(f"Found {filtered_queryset.count()} patients in database")
        page = self.paginate_queryset(filtered_queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(filtered_queryset, many=True)
        return Response(serializer.data)

    def generate_mock_patients(self):
        """
        Generate mock patient data for demonstration purposes
        """
        # This is similar to the mock data in the frontend service
        mock_patients = [
            {
                "id": 1,
                "user": {
                    "id": 101,
                    "first_name": "Rahul",
                    "last_name": "Mehta",
                    "email": "rahul.mehta@example.com",
                    "phone": "+91 9876543201"
                },
                "age": 45,
                "gender": "Male",
                "address": "Satellite, Ahmedabad",
                "medical_history": "Chronic back pain",
                "pending_payments": 2,
                "total_sessions": 8,
                "completed_sessions": 7,
                "attendance_rate": 87.5,
                "last_appointment": "2023-06-15",
                "area": "Satellite",
                "area_name": "Satellite"
            },
            {
                "id": 2,
                "user": {
                    "id": 102,
                    "first_name": "Anita",
                    "last_name": "Sharma",
                    "email": "anita.sharma@example.com",
                    "phone": "+91 9876543202"
                },
                "age": 38,
                "gender": "Female",
                "address": "Navrangpura, Ahmedabad",
                "medical_history": "Shoulder injury",
                "pending_payments": 0,
                "total_sessions": 5,
                "completed_sessions": 5,
                "attendance_rate": 100,
                "last_appointment": "2023-06-18",
                "area": "Navrangpura",
                "area_name": "Navrangpura"
            },
            {
                "id": 3,
                "user": {
                    "id": 103,
                    "first_name": "Vikram",
                    "last_name": "Patel",
                    "email": "vikram.patel@example.com",
                    "phone": "+91 9876543203"
                },
                "age": 52,
                "gender": "Male",
                "address": "Bodakdev, Ahmedabad",
                "medical_history": "Post-surgery rehabilitation",
                "pending_payments": 1,
                "total_sessions": 12,
                "completed_sessions": 10,
                "attendance_rate": 83.3,
                "last_appointment": "2023-06-20",
                "area": "Bodakdev",
                "area_name": "Bodakdev"
            },
            {
                "id": 4,
                "user": {
                    "id": 104,
                    "first_name": "Meera",
                    "last_name": "Desai",
                    "email": "meera.desai@example.com",
                    "phone": "+91 9876543204"
                },
                "age": 29,
                "gender": "Female",
                "address": "Vastrapur, Ahmedabad",
                "medical_history": "Sports injury",
                "pending_payments": 0,
                "total_sessions": 3,
                "completed_sessions": 3,
                "attendance_rate": 100,
                "last_appointment": "2023-06-12",
                "area": "Vastrapur",
                "area_name": "Vastrapur"
            },
            {
                "id": 5,
                "user": {
                    "id": 105,
                    "first_name": "Suresh",
                    "last_name": "Joshi",
                    "email": "suresh.joshi@example.com",
                    "phone": "+91 9876543205"
                },
                "age": 65,
                "gender": "Male",
                "address": "Ambawadi, Ahmedabad",
                "medical_history": "Arthritis",
                "pending_payments": 0,
                "total_sessions": 15,
                "completed_sessions": 14,
                "attendance_rate": 93.3,
                "last_appointment": "2023-06-19",
                "area": "Ambawadi",
                "area_name": "Ambawadi"
            }
        ]
        return mock_patients

class TherapistFinancialViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for retrieving therapists with financial information
    This is a read-only endpoint used by the financial management dashboard
    """
    serializer_class = TherapistSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'user__phone']
    ordering_fields = ['user__first_name', 'user__last_name', 'created_at']

    def get_permissions(self):
        """
        Only admin can access financial therapist data
        """
        permission_classes = [permissions.IsAuthenticated, IsAdminUser]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Return all therapists with additional financial information
        """
        queryset = Therapist.objects.all().select_related('user')

        # Annotate with financial information
        queryset = queryset.annotate(
            total_sessions=Count('appointments'),
            completed_sessions=Count('appointments', filter=Q(appointments__status='completed'))
        )

        # Add total earnings from EarningRecord
        for therapist in queryset:
            # Get total earnings from EarningRecord
            from earnings.models import EarningRecord
            earnings = EarningRecord.objects.filter(therapist=therapist)
            therapist.total_earnings = earnings.aggregate(Sum('amount'))['amount__sum'] or 0

            # Calculate average fee per session
            if therapist.completed_sessions > 0:
                therapist.average_fee = therapist.total_earnings / therapist.completed_sessions
            else:
                therapist.average_fee = 0

        return queryset

    def list(self, request, *args, **kwargs):
        """
        List therapists with financial information
        """
        print(f"TherapistFinancialViewSet.list called with query params: {request.query_params}")

        # Get the base queryset
        queryset = self.get_queryset()
        print(f"Base therapist queryset count: {queryset.count()}")

        # Apply filters
        filtered_queryset = self.filter_queryset(queryset)
        print(f"Filtered therapist queryset count: {filtered_queryset.count()}")

        # Print search query if present
        search_query = request.query_params.get('search', '')
        if search_query:
            print(f"Searching for therapists with query: '{search_query}'")

        # Check if we have any real data
        if not filtered_queryset.exists():
            print("No therapists found in database, returning mock data")
            # No real data exists, return mock data
            mock_data = self.generate_mock_therapists()
            page = self.paginate_queryset(mock_data)
            if page is not None:
                return self.get_paginated_response(page)
            return Response({
                "results": mock_data,
                "count": len(mock_data),
                "is_mock_data": True
            })

        # Real data exists, proceed with normal processing
        print(f"Found {filtered_queryset.count()} therapists in database")
        page = self.paginate_queryset(filtered_queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(filtered_queryset, many=True)
        return Response(serializer.data)

    def generate_mock_therapists(self):
        """
        Generate mock therapist data for demonstration purposes
        """
        mock_therapists = [
            {
                "id": 1,
                "user": {
                    "id": 201,
                    "first_name": "Rajesh",
                    "last_name": "Sharma",
                    "email": "rajesh.sharma@example.com",
                    "phone": "+91 9876543301"
                },
                "specialization": "Physical Therapy",
                "experience_years": 8,
                "bio": "Experienced physical therapist specializing in sports injuries",
                "total_sessions": 28,
                "completed_sessions": 26,
                "total_earnings": 28000,
                "average_fee": 1076.92,
                "areas": ["Satellite", "Bodakdev", "Thaltej"],
                "area_names": ["Satellite", "Bodakdev", "Thaltej"]
            },
            {
                "id": 2,
                "user": {
                    "id": 202,
                    "first_name": "Priya",
                    "last_name": "Patel",
                    "email": "priya.patel@example.com",
                    "phone": "+91 9876543302"
                },
                "specialization": "Rehabilitation",
                "experience_years": 6,
                "bio": "Specialized in post-surgery rehabilitation and recovery",
                "total_sessions": 24,
                "completed_sessions": 22,
                "total_earnings": 24000,
                "average_fee": 1090.91,
                "areas": ["Navrangpura", "Vastrapur", "Ambawadi"],
                "area_names": ["Navrangpura", "Vastrapur", "Ambawadi"]
            },
            {
                "id": 3,
                "user": {
                    "id": 203,
                    "first_name": "Amit",
                    "last_name": "Singh",
                    "email": "amit.singh@example.com",
                    "phone": "+91 9876543303"
                },
                "specialization": "Sports Rehabilitation",
                "experience_years": 5,
                "bio": "Sports medicine specialist with focus on athlete recovery",
                "total_sessions": 20,
                "completed_sessions": 18,
                "total_earnings": 20000,
                "average_fee": 1111.11,
                "areas": ["Satellite", "Vastrapur", "Bopal"],
                "area_names": ["Satellite", "Vastrapur", "Bopal"]
            }
        ]
        return mock_therapists

class AppointmentFinancialViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for retrieving appointments with financial information
    This is a read-only endpoint used by the financial management dashboard
    """
    serializer_class = AppointmentSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['patient__user__first_name', 'patient__user__last_name', 'therapist__user__first_name', 'therapist__user__last_name']
    ordering_fields = ['datetime', 'status', 'payment_status']

    def get_permissions(self):
        """
        Only admin can access financial appointment data
        """
        permission_classes = [permissions.IsAuthenticated, IsAdminUser]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Return appointments filtered by query parameters
        """
        queryset = Appointment.objects.all().select_related(
            'patient__user', 'therapist__user'
        )

        # Filter by patient ID if provided
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        # Filter by therapist ID if provided
        therapist_id = self.request.query_params.get('therapist_id')
        if therapist_id:
            queryset = queryset.filter(therapist_id=therapist_id)

        # Filter by payment status using EarningRecord
        include_paid = self.request.query_params.get('include_paid', 'false').lower() == 'true'
        if not include_paid:
            # Get appointments that have an EarningRecord with payment_status='pending'
            # or appointments that don't have an EarningRecord yet
            from earnings.models import EarningRecord
            paid_appointment_ids = EarningRecord.objects.filter(
                payment_status=EarningRecord.PaymentStatus.PAID
            ).values_list('appointment_id', flat=True)
            queryset = queryset.exclude(id__in=paid_appointment_ids)

        # Filter by status (use as attendance status)
        attendance_status = self.request.query_params.get('attendance_status', 'all')
        if attendance_status != 'all':
            if attendance_status == 'attended':
                queryset = queryset.filter(status=Appointment.Status.COMPLETED)
            elif attendance_status == 'missed':
                queryset = queryset.filter(status=Appointment.Status.MISSED)
            elif attendance_status == 'scheduled':
                queryset = queryset.filter(status=Appointment.Status.SCHEDULED)

        return queryset

    def list(self, request, *args, **kwargs):
        """
        List appointments with financial information
        """
        print(f"AppointmentFinancialViewSet.list called with query params: {request.query_params}")

        # Get the base queryset
        queryset = self.get_queryset()
        print(f"Base appointment queryset count: {queryset.count()}")

        # Apply filters
        filtered_queryset = self.filter_queryset(queryset)
        print(f"Filtered appointment queryset count: {filtered_queryset.count()}")

        # Print patient ID if present
        patient_id = request.query_params.get('patient_id')
        if patient_id:
            print(f"Filtering appointments for patient ID: {patient_id}")

        # Check if we have any real data
        if not filtered_queryset.exists():
            print("No appointments found in database, returning mock data")
            # No real data exists, return mock data
            mock_data = self.generate_mock_appointments(patient_id)
            page = self.paginate_queryset(mock_data)
            if page is not None:
                return self.get_paginated_response(page)
            return Response({
                "results": mock_data,
                "count": len(mock_data),
                "is_mock_data": True
            })

        # Real data exists, proceed with normal processing
        print(f"Found {filtered_queryset.count()} appointments in database")
        page = self.paginate_queryset(filtered_queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(filtered_queryset, many=True)
        return Response(serializer.data)

    def generate_mock_appointments(self, patient_id=None):
        """
        Generate mock appointment data for demonstration purposes
        """
        # This is similar to the mock data in the frontend service
        mock_appointments = [
            {
                "id": 101,
                "patient_id": 1,
                "therapist_id": 1,
                "doctor_id": 2,
                "date": "2023-06-15",
                "start_time": "10:00:00",
                "end_time": "11:00:00",
                "status": "completed",
                "payment_status": "pending",
                "attendance_status": "attended",
                "session_notes": "Initial assessment completed",
                "therapy_type": "Physical Therapy",
                "fee": 1200,
                "therapist_name": "Rajesh Sharma",
                "doctor_name": "Dr. Anjali Gupta"
            },
            {
                "id": 102,
                "patient_id": 1,
                "therapist_id": 1,
                "doctor_id": 2,
                "date": "2023-06-18",
                "start_time": "10:00:00",
                "end_time": "11:00:00",
                "status": "completed",
                "payment_status": "pending",
                "attendance_status": "attended",
                "session_notes": "Follow-up session",
                "therapy_type": "Physical Therapy",
                "fee": 1000,
                "therapist_name": "Rajesh Sharma",
                "doctor_name": "Dr. Anjali Gupta"
            },
            {
                "id": 103,
                "patient_id": 2,
                "therapist_id": 2,
                "doctor_id": 1,
                "date": "2023-06-18",
                "start_time": "14:00:00",
                "end_time": "15:00:00",
                "status": "completed",
                "payment_status": "completed",
                "attendance_status": "attended",
                "session_notes": "Shoulder exercises prescribed",
                "therapy_type": "Rehabilitation",
                "fee": 1500,
                "therapist_name": "Priya Patel",
                "doctor_name": "Dr. Vikram Desai"
            },
            {
                "id": 104,
                "patient_id": 3,
                "therapist_id": 3,
                "doctor_id": 2,
                "date": "2023-06-20",
                "start_time": "11:00:00",
                "end_time": "12:00:00",
                "status": "completed",
                "payment_status": "pending",
                "attendance_status": "attended",
                "session_notes": "Post-surgery progress good",
                "therapy_type": "Rehabilitation",
                "fee": 1800,
                "therapist_name": "Amit Singh",
                "doctor_name": "Dr. Anjali Gupta"
            },
            {
                "id": 105,
                "patient_id": 4,
                "therapist_id": 2,
                "doctor_id": 1,
                "date": "2023-06-12",
                "start_time": "16:00:00",
                "end_time": "17:00:00",
                "status": "completed",
                "payment_status": "completed",
                "attendance_status": "attended",
                "session_notes": "Ankle strengthening exercises",
                "therapy_type": "Sports Rehabilitation",
                "fee": 1200,
                "therapist_name": "Priya Patel",
                "doctor_name": "Dr. Vikram Desai"
            },
            {
                "id": 106,
                "patient_id": 5,
                "therapist_id": 1,
                "doctor_id": 2,
                "date": "2023-06-19",
                "start_time": "09:00:00",
                "end_time": "10:00:00",
                "status": "completed",
                "payment_status": "completed",
                "attendance_status": "attended",
                "session_notes": "Arthritis management session",
                "therapy_type": "Geriatric Therapy",
                "fee": 1000,
                "therapist_name": "Rajesh Sharma",
                "doctor_name": "Dr. Anjali Gupta"
            },
            {
                "id": 107,
                "patient_id": 1,
                "therapist_id": 3,
                "doctor_id": 1,
                "date": "2023-06-22",
                "start_time": "13:00:00",
                "end_time": "14:00:00",
                "status": "scheduled",
                "payment_status": "pending",
                "attendance_status": "scheduled",
                "session_notes": "Upcoming session",
                "therapy_type": "Physical Therapy",
                "fee": 1000,
                "therapist_name": "Amit Singh",
                "doctor_name": "Dr. Vikram Desai"
            },
            {
                "id": 108,
                "patient_id": 3,
                "therapist_id": 2,
                "doctor_id": 2,
                "date": "2023-06-15",
                "start_time": "15:00:00",
                "end_time": "16:00:00",
                "status": "completed",
                "payment_status": "pending",
                "attendance_status": "missed",
                "session_notes": "Patient did not attend",
                "therapy_type": "Rehabilitation",
                "fee": 1800,
                "therapist_name": "Priya Patel",
                "doctor_name": "Dr. Anjali Gupta"
            }
        ]

        # Filter by patient ID if provided
        if patient_id:
            return [a for a in mock_appointments if a["patient_id"] == int(patient_id)]

        return mock_appointments


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def apply_distribution(request):
    """
    Apply financial distribution to an appointment/session
    """
    try:
        # Get request data
        appointment_id = request.data.get('appointment_id')
        patient_id = request.data.get('patient_id')
        therapist_id = request.data.get('therapist_id')
        distribution = request.data.get('distribution')
        payment_status = request.data.get('payment_status', 'completed')
        payment_method = request.data.get('payment_method', 'cash')

        # Validate required fields
        if not appointment_id or not patient_id or not therapist_id or not distribution:
            return Response(
                {"detail": "Appointment ID, Patient ID, Therapist ID, and distribution data are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get objects
        try:
            appointment = Appointment.objects.get(id=appointment_id)
            patient = Patient.objects.get(id=patient_id)
            therapist = Therapist.objects.get(id=therapist_id)
        except (Appointment.DoesNotExist, Patient.DoesNotExist, Therapist.DoesNotExist) as e:
            return Response(
                {"detail": f"Object not found: {str(e)}"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if an EarningRecord already exists for this appointment
        existing_record = EarningRecord.objects.filter(appointment=appointment).first()
        if existing_record:
            # Update existing record
            existing_record.therapist = therapist
            existing_record.patient = patient
            existing_record.amount = Decimal(str(distribution.get('therapist', 0)))
            existing_record.full_amount = Decimal(str(distribution.get('total', 0)))
            existing_record.admin_amount = Decimal(str(distribution.get('admin', 0)))
            existing_record.therapist_amount = Decimal(str(distribution.get('therapist', 0)))
            existing_record.doctor_amount = Decimal(str(distribution.get('doctor', 0)))
            existing_record.payment_status = payment_status

            if payment_status == 'completed':
                existing_record.payment_date = timezone.now().date()

            existing_record.save()

            record = existing_record
        else:
            # Create new EarningRecord
            record = EarningRecord.objects.create(
                therapist=therapist,
                patient=patient,
                appointment=appointment,
                date=appointment.datetime.date(),
                session_type=appointment.type or "Regular Session",
                amount=Decimal(str(distribution.get('therapist', 0))),
                full_amount=Decimal(str(distribution.get('total', 0))),
                status=appointment.status,
                payment_status=payment_status,
                payment_date=timezone.now().date() if payment_status == 'completed' else None,
                admin_amount=Decimal(str(distribution.get('admin', 0))),
                therapist_amount=Decimal(str(distribution.get('therapist', 0))),
                doctor_amount=Decimal(str(distribution.get('doctor', 0))),
                notes=f"Payment method: {payment_method}"
            )

        # Return success response
        return Response({
            "success": True,
            "message": "Distribution applied successfully",
            "record_id": record.id,
            "appointment_id": appointment_id,
            "patient_id": patient_id,
            "therapist_id": therapist_id,
            "distribution": distribution,
            "payment_status": payment_status,
            "payment_method": payment_method
        })

    except Exception as e:
        import traceback
        print(f"ERROR in apply_distribution: {str(e)}")
        print(traceback.format_exc())
        return Response(
            {"detail": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
