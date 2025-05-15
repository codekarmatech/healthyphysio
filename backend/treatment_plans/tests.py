from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from users.models import Patient, Therapist
from users.models import User
from .models import (
    TreatmentPlan, TreatmentPlanVersion, TreatmentPlanChangeRequest,
    DailyTreatment, Intervention, TreatmentSession
)
import json
from datetime import date, timedelta

class TreatmentPlanModelTests(TestCase):
    def setUp(self):
        # Create users
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='password123',
            role='admin',
            is_admin=True
        )

        self.therapist_user = User.objects.create_user(
            username='therapist',
            email='therapist@example.com',
            password='password123',
            role='therapist',
            is_therapist=True
        )

        self.patient_user = User.objects.create_user(
            username='patient',
            email='patient@example.com',
            password='password123',
            role='patient',
            is_patient=True
        )

        # Create patient and therapist profiles
        self.patient = Patient.objects.create(user=self.patient_user)
        self.therapist = Therapist.objects.create(user=self.therapist_user)

        # Create a treatment plan
        self.treatment_plan = TreatmentPlan.objects.create(
            patient=self.patient,
            created_by=self.admin_user,
            title='Test Treatment Plan',
            description='This is a test treatment plan',
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            status=TreatmentPlan.Status.DRAFT
        )

    def test_treatment_plan_creation(self):
        """Test that a treatment plan can be created"""
        self.assertEqual(self.treatment_plan.title, 'Test Treatment Plan')
        self.assertEqual(self.treatment_plan.status, TreatmentPlan.Status.DRAFT)
        self.assertEqual(self.treatment_plan.patient, self.patient)
        self.assertEqual(self.treatment_plan.created_by, self.admin_user)

    def test_treatment_plan_submit_for_approval(self):
        """Test that a treatment plan can be submitted for approval"""
        self.treatment_plan.submit_for_approval()
        self.assertEqual(self.treatment_plan.status, TreatmentPlan.Status.PENDING_APPROVAL)

    def test_treatment_plan_approve(self):
        """Test that a treatment plan can be approved"""
        # Get current time for comparison
        before_approval = timezone.now()

        self.treatment_plan.submit_for_approval()
        self.treatment_plan.approve(self.admin_user)

        self.assertEqual(self.treatment_plan.status, TreatmentPlan.Status.APPROVED)
        self.assertEqual(self.treatment_plan.approved_by, self.admin_user)
        self.assertIsNotNone(self.treatment_plan.approved_at)

        # Verify that approved_at timestamp is after our before_approval time
        self.assertGreaterEqual(self.treatment_plan.approved_at, before_approval)

    def test_treatment_plan_complete(self):
        """Test that a treatment plan can be marked as completed"""
        self.treatment_plan.submit_for_approval()
        self.treatment_plan.approve(self.admin_user)
        self.treatment_plan.complete()
        self.assertEqual(self.treatment_plan.status, TreatmentPlan.Status.COMPLETED)

    def test_treatment_plan_archive(self):
        """Test that a treatment plan can be archived"""
        self.treatment_plan.archive()
        self.assertEqual(self.treatment_plan.status, TreatmentPlan.Status.ARCHIVED)

class TreatmentPlanVersionModelTests(TestCase):
    def setUp(self):
        # Create users
        self.admin_user = User.objects.create_user(
            username='admin_version',
            email='admin_version@example.com',
            password='password123',
            role='admin',
            is_admin=True
        )

        self.patient_user = User.objects.create_user(
            username='patient_version',
            email='patient_version@example.com',
            password='password123',
            role='patient',
            is_patient=True
        )

        # Create patient profile
        self.patient = Patient.objects.create(user=self.patient_user)

        # Create a treatment plan
        self.treatment_plan = TreatmentPlan.objects.create(
            patient=self.patient,
            created_by=self.admin_user,
            title='Version Test Plan',
            description='This is a test treatment plan for versioning',
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            status=TreatmentPlan.Status.DRAFT
        )

        # Create a treatment plan version
        self.plan_data = {
            'title': 'Version Test Plan',
            'description': 'This is a test treatment plan for versioning',
            'start_date': date.today().isoformat(),
            'end_date': (date.today() + timedelta(days=30)).isoformat(),
            'status': 'draft'
        }

        self.plan_version = TreatmentPlanVersion.objects.create(
            treatment_plan=self.treatment_plan,
            data=self.plan_data,
            created_by=self.admin_user
        )

    def test_treatment_plan_version_creation(self):
        """Test that a treatment plan version can be created"""
        self.assertEqual(self.plan_version.treatment_plan, self.treatment_plan)
        self.assertEqual(self.plan_version.created_by, self.admin_user)
        self.assertEqual(self.plan_version.data, self.plan_data)
        self.assertIsNotNone(self.plan_version.created_at)

class TreatmentPlanChangeRequestModelTests(TestCase):
    def setUp(self):
        # Create users
        self.admin_user = User.objects.create_user(
            username='admin_change',
            email='admin_change@example.com',
            password='password123',
            role='admin',
            is_admin=True
        )

        self.therapist_user = User.objects.create_user(
            username='therapist_change',
            email='therapist_change@example.com',
            password='password123',
            role='therapist',
            is_therapist=True
        )

        self.patient_user = User.objects.create_user(
            username='patient_change',
            email='patient_change@example.com',
            password='password123',
            role='patient',
            is_patient=True
        )

        # Create patient and therapist profiles
        self.patient = Patient.objects.create(user=self.patient_user)
        self.therapist = Therapist.objects.create(user=self.therapist_user)

        # Create a treatment plan
        self.treatment_plan = TreatmentPlan.objects.create(
            patient=self.patient,
            created_by=self.admin_user,
            title='Change Request Test Plan',
            description='This is a test treatment plan for change requests',
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            status=TreatmentPlan.Status.APPROVED,
            approved_by=self.admin_user,
            approved_at=timezone.now()
        )

        # Create a change request
        self.current_data = {
            'title': 'Change Request Test Plan',
            'description': 'This is a test treatment plan for change requests',
            'end_date': (date.today() + timedelta(days=30)).isoformat()
        }

        self.requested_data = {
            'title': 'Change Request Test Plan',
            'description': 'This is an updated description for the test plan',
            'end_date': (date.today() + timedelta(days=60)).isoformat()
        }

        self.change_request = TreatmentPlanChangeRequest.objects.create(
            treatment_plan=self.treatment_plan,
            requested_by=self.therapist_user,
            current_data=self.current_data,
            requested_data=self.requested_data,
            reason='Patient needs extended treatment period',
            urgency='medium'
        )

    def test_change_request_creation(self):
        """Test that a change request can be created"""
        self.assertEqual(self.change_request.treatment_plan, self.treatment_plan)
        self.assertEqual(self.change_request.requested_by, self.therapist_user)
        self.assertEqual(self.change_request.current_data, self.current_data)
        self.assertEqual(self.change_request.requested_data, self.requested_data)
        self.assertEqual(self.change_request.reason, 'Patient needs extended treatment period')
        self.assertEqual(self.change_request.urgency, 'medium')
        self.assertEqual(self.change_request.status, TreatmentPlanChangeRequest.Status.PENDING)

    def test_change_request_approve(self):
        """Test that a change request can be approved"""
        # Approve the change request
        self.change_request.approve(self.admin_user)

        # Check that the change request is approved
        self.assertEqual(self.change_request.status, TreatmentPlanChangeRequest.Status.APPROVED)
        self.assertEqual(self.change_request.resolved_by, self.admin_user)
        self.assertIsNotNone(self.change_request.resolved_at)

        # Check that a version was created
        self.assertTrue(TreatmentPlanVersion.objects.filter(
            treatment_plan=self.treatment_plan,
            data=self.current_data
        ).exists())

    def test_change_request_reject(self):
        """Test that a change request can be rejected"""
        # Reject the change request
        rejection_reason = 'Current treatment plan is sufficient'
        self.change_request.reject(self.admin_user, rejection_reason)

        # Check that the change request is rejected
        self.assertEqual(self.change_request.status, TreatmentPlanChangeRequest.Status.REJECTED)
        self.assertEqual(self.change_request.resolved_by, self.admin_user)
        self.assertEqual(self.change_request.rejection_reason, rejection_reason)
        self.assertIsNotNone(self.change_request.resolved_at)

class DailyTreatmentModelTests(TestCase):
    def setUp(self):
        # Create users
        self.admin_user = User.objects.create_user(
            username='admin_daily',
            email='admin_daily@example.com',
            password='password123',
            role='admin',
            is_admin=True
        )

        self.patient_user = User.objects.create_user(
            username='patient_daily',
            email='patient_daily@example.com',
            password='password123',
            role='patient',
            is_patient=True
        )

        # Create patient profile
        self.patient = Patient.objects.create(user=self.patient_user)

        # Create a treatment plan
        self.treatment_plan = TreatmentPlan.objects.create(
            patient=self.patient,
            created_by=self.admin_user,
            title='Daily Treatment Test Plan',
            description='This is a test treatment plan for daily treatments',
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            status=TreatmentPlan.Status.APPROVED,
            approved_by=self.admin_user,
            approved_at=timezone.now()
        )

        # Create interventions
        self.intervention1 = Intervention.objects.create(
            name='Stretching Exercise',
            description='Basic stretching exercises',
            category='Exercise',
            created_by=self.admin_user
        )

        self.intervention2 = Intervention.objects.create(
            name='Heat Therapy',
            description='Application of heat packs',
            category='Therapy',
            created_by=self.admin_user
        )

        # Create a daily treatment
        self.interventions_data = [
            {
                'id': str(self.intervention1.id),
                'duration': 15,
                'notes': 'Focus on lower back'
            },
            {
                'id': str(self.intervention2.id),
                'duration': 10,
                'notes': 'Apply to affected area'
            }
        ]

        self.daily_treatment = DailyTreatment.objects.create(
            treatment_plan=self.treatment_plan,
            day_number=1,
            title='Day 1 Treatment',
            description='First day of treatment plan',
            interventions=self.interventions_data,
            notes='Patient should drink plenty of water after treatment'
        )

    def test_daily_treatment_creation(self):
        """Test that a daily treatment can be created"""
        self.assertEqual(self.daily_treatment.treatment_plan, self.treatment_plan)
        self.assertEqual(self.daily_treatment.day_number, 1)
        self.assertEqual(self.daily_treatment.title, 'Day 1 Treatment')
        self.assertEqual(self.daily_treatment.description, 'First day of treatment plan')
        self.assertEqual(self.daily_treatment.interventions, self.interventions_data)
        self.assertEqual(self.daily_treatment.notes, 'Patient should drink plenty of water after treatment')

    def test_daily_treatment_string_representation(self):
        """Test the string representation of a daily treatment"""
        expected_string = f"Day 1 - Day 1 Treatment ({self.treatment_plan.title})"
        self.assertEqual(str(self.daily_treatment), expected_string)

class TreatmentSessionModelTests(TestCase):
    def setUp(self):
        # Create users
        self.admin_user = User.objects.create_user(
            username='admin_session',
            email='admin_session@example.com',
            password='password123',
            role='admin',
            is_admin=True
        )

        self.therapist_user = User.objects.create_user(
            username='therapist_session',
            email='therapist_session@example.com',
            password='password123',
            role='therapist',
            is_therapist=True
        )

        self.patient_user = User.objects.create_user(
            username='patient_session',
            email='patient_session@example.com',
            password='password123',
            role='patient',
            is_patient=True
        )

        # Create patient and therapist profiles
        self.patient = Patient.objects.create(user=self.patient_user)
        self.therapist = Therapist.objects.create(user=self.therapist_user)

        # Create a treatment plan
        self.treatment_plan = TreatmentPlan.objects.create(
            patient=self.patient,
            created_by=self.admin_user,
            title='Session Test Plan',
            description='This is a test treatment plan for sessions',
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            status=TreatmentPlan.Status.APPROVED,
            approved_by=self.admin_user,
            approved_at=timezone.now()
        )

        # Create interventions
        self.intervention1 = Intervention.objects.create(
            name='Massage Therapy',
            description='Deep tissue massage',
            category='Manual Therapy',
            created_by=self.admin_user
        )

        self.intervention2 = Intervention.objects.create(
            name='Ultrasound Therapy',
            description='Ultrasound treatment',
            category='Electrotherapy',
            created_by=self.admin_user
        )

        # Create a daily treatment
        self.interventions_data = [
            {
                'id': str(self.intervention1.id),
                'duration': 20,
                'notes': 'Focus on shoulder area'
            },
            {
                'id': str(self.intervention2.id),
                'duration': 10,
                'notes': 'Apply to affected area'
            }
        ]

        self.daily_treatment = DailyTreatment.objects.create(
            treatment_plan=self.treatment_plan,
            day_number=1,
            title='Day 1 Session',
            description='First day of treatment plan',
            interventions=self.interventions_data,
            notes='Patient should rest after treatment'
        )

        # Create a treatment session
        self.session = TreatmentSession.objects.create(
            treatment_plan=self.treatment_plan,
            daily_treatment=self.daily_treatment,
            therapist=self.therapist,
            patient=self.patient,
            scheduled_date=date.today(),
            status=TreatmentSession.Status.PENDING
        )

    def test_treatment_session_creation(self):
        """Test that a treatment session can be created"""
        self.assertEqual(self.session.treatment_plan, self.treatment_plan)
        self.assertEqual(self.session.daily_treatment, self.daily_treatment)
        self.assertEqual(self.session.therapist, self.therapist)
        self.assertEqual(self.session.patient, self.patient)
        self.assertEqual(self.session.scheduled_date, date.today())
        self.assertEqual(self.session.status, TreatmentSession.Status.PENDING)

    def test_treatment_session_complete(self):
        """Test that a treatment session can be completed"""
        # Prepare session data
        session_data = {
            'interventions_performed': [
                {
                    'id': str(self.intervention1.id),
                    'duration': 25,  # Actual duration was longer than planned
                    'notes': 'Patient responded well to massage'
                },
                {
                    'id': str(self.intervention2.id),
                    'duration': 8,  # Actual duration was shorter than planned
                    'notes': 'Patient felt some discomfort'
                }
            ],
            'pain_level_before': 7,
            'pain_level_after': 4,
            'notes': 'Patient showed improvement after the session'
        }

        # Complete the session
        self.session.complete(session_data)

        # Check that the session is completed
        self.assertEqual(self.session.status, TreatmentSession.Status.COMPLETED)
        self.assertIsNotNone(self.session.completed_at)
        self.assertEqual(self.session.interventions_performed, session_data['interventions_performed'])
        self.assertEqual(self.session.pain_level_before, 7)
        self.assertEqual(self.session.pain_level_after, 4)
        self.assertEqual(self.session.notes, 'Patient showed improvement after the session')

    def test_treatment_session_mark_missed(self):
        """Test that a treatment session can be marked as missed"""
        # Mark the session as missed
        self.session.mark_missed()

        # Check that the session is marked as missed
        self.assertEqual(self.session.status, TreatmentSession.Status.MISSED)

    def test_treatment_session_string_representation(self):
        """Test the string representation of a treatment session"""
        expected_string = f"Session for {self.patient.user.get_full_name()} on {date.today()}"
        self.assertEqual(str(self.session), expected_string)

class InterventionModelTests(TestCase):
    def setUp(self):
        # Create admin user
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='password123',
            role='admin',
            is_admin=True
        )

        # Create an intervention
        self.intervention = Intervention.objects.create(
            name='Test Intervention',
            description='This is a test intervention',
            category='Test Category',
            created_by=self.admin_user
        )

    def test_intervention_creation(self):
        """Test that an intervention can be created"""
        self.assertEqual(self.intervention.name, 'Test Intervention')
        self.assertEqual(self.intervention.category, 'Test Category')
        self.assertEqual(self.intervention.created_by, self.admin_user)
        self.assertTrue(self.intervention.is_active)

    def test_intervention_string_representation(self):
        """Test the string representation of an intervention"""
        self.assertEqual(str(self.intervention), 'Test Intervention')

class TreatmentPlanAPITests(APITestCase):
    def setUp(self):
        # Create users
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='password123',
            role='admin',
            is_admin=True
        )

        self.therapist_user = User.objects.create_user(
            username='therapist',
            email='therapist@example.com',
            password='password123',
            role='therapist',
            is_therapist=True
        )

        self.patient_user = User.objects.create_user(
            username='patient',
            email='patient@example.com',
            password='password123',
            role='patient',
            is_patient=True
        )

        # Create patient and therapist profiles
        self.patient = Patient.objects.create(user=self.patient_user)
        self.therapist = Therapist.objects.create(user=self.therapist_user)

        # Create a treatment plan
        self.treatment_plan = TreatmentPlan.objects.create(
            patient=self.patient,
            created_by=self.admin_user,
            title='Test Treatment Plan',
            description='This is a test treatment plan',
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            status=TreatmentPlan.Status.DRAFT
        )

        # Create client and authenticate
        self.client = APIClient()

    def test_admin_can_create_treatment_plan(self):
        """Test that an admin can create a treatment plan"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('treatmentplan-list')
        data = {
            'patient': self.patient.id,
            'title': 'New Treatment Plan',
            'description': 'This is a new treatment plan',
            'start_date': date.today().isoformat(),
            'end_date': (date.today() + timedelta(days=30)).isoformat(),
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TreatmentPlan.objects.count(), 2)
        self.assertEqual(TreatmentPlan.objects.get(title='New Treatment Plan').created_by, self.admin_user)

    def test_admin_can_create_treatment_plan_with_json_string(self):
        """Test that an admin can create a treatment plan using a JSON string"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('treatmentplan-list')
        data = {
            'patient': self.patient.id,
            'title': 'JSON Treatment Plan',
            'description': 'This is a treatment plan created with JSON',
            'start_date': date.today().isoformat(),
            'end_date': (date.today() + timedelta(days=30)).isoformat(),
        }

        # Convert data to JSON string
        json_data = json.dumps(data)

        # Send request with JSON string
        response = self.client.post(
            url,
            json_data,
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TreatmentPlan.objects.count(), 2)

        # Parse response content
        response_data = json.loads(response.content)
        self.assertEqual(response_data['title'], 'JSON Treatment Plan')
        self.assertEqual(response_data['description'], 'This is a treatment plan created with JSON')

    def test_therapist_cannot_create_treatment_plan(self):
        """Test that a therapist cannot create a treatment plan"""
        self.client.force_authenticate(user=self.therapist_user)
        url = reverse('treatmentplan-list')
        data = {
            'patient': self.patient.id,
            'title': 'New Treatment Plan',
            'description': 'This is a new treatment plan',
            'start_date': date.today().isoformat(),
            'end_date': (date.today() + timedelta(days=30)).isoformat(),
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(TreatmentPlan.objects.count(), 1)

    def test_admin_can_approve_treatment_plan(self):
        """Test that an admin can approve a treatment plan"""
        self.treatment_plan.submit_for_approval()
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('treatmentplan-approve', args=[self.treatment_plan.id])
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.treatment_plan.refresh_from_db()
        self.assertEqual(self.treatment_plan.status, TreatmentPlan.Status.APPROVED)
        self.assertEqual(self.treatment_plan.approved_by, self.admin_user)

    def test_therapist_cannot_approve_treatment_plan(self):
        """Test that a therapist cannot approve a treatment plan"""
        self.treatment_plan.submit_for_approval()
        self.client.force_authenticate(user=self.therapist_user)
        url = reverse('treatmentplan-approve', args=[self.treatment_plan.id])
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.treatment_plan.refresh_from_db()
        self.assertEqual(self.treatment_plan.status, TreatmentPlan.Status.PENDING_APPROVAL)
        self.assertIsNone(self.treatment_plan.approved_by)
