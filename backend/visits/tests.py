"""
Purpose: Tests for the visits app
Connected to: Visit tracking and therapist reports
"""

from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from users.models import Therapist, Patient
from scheduling.models import Appointment, Session
from .models import Visit, LocationUpdate, ProximityAlert, TherapistReport
import datetime

User = get_user_model()

class VisitModelTestCase(TestCase):
    """Test the Visit model"""

    def setUp(self):
        # Create users
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='password123',
            role='admin'
        )

        self.therapist_user = User.objects.create_user(
            username='therapist',
            email='therapist@example.com',
            password='password123',
            role='therapist'
        )

        self.patient_user = User.objects.create_user(
            username='patient',
            email='patient@example.com',
            password='password123',
            role='patient'
        )

        # Create therapist and patient profiles
        self.therapist = Therapist.objects.create(
            user=self.therapist_user,
            specialization='Physical Therapy',
            years_of_experience=5
        )

        self.patient = Patient.objects.create(
            user=self.patient_user,
            date_of_birth=timezone.now().date() - datetime.timedelta(days=365*30),
            emergency_contact_name='Emergency Contact',
            emergency_contact_phone='1234567890'
        )

        # Create an appointment
        self.appointment = Appointment.objects.create(
            patient=self.patient,
            therapist=self.therapist,
            datetime=timezone.now() + datetime.timedelta(days=1),
            duration_minutes=60,
            status='scheduled',
            type='initial-assessment'
        )

        # Create a visit
        self.visit = Visit.objects.create(
            appointment=self.appointment,
            therapist=self.therapist,
            patient=self.patient,
            scheduled_start=self.appointment.datetime,
            scheduled_end=self.appointment.datetime + datetime.timedelta(minutes=60)
        )

    def test_visit_creation(self):
        """Test that a visit can be created"""
        self.assertEqual(self.visit.status, Visit.Status.SCHEDULED)
        self.assertEqual(self.visit.therapist, self.therapist)
        self.assertEqual(self.visit.patient, self.patient)
        self.assertEqual(self.visit.appointment, self.appointment)

    def test_visit_workflow(self):
        """Test the visit workflow"""
        # Start visit
        self.assertTrue(self.visit.start_visit())
        self.assertEqual(self.visit.status, Visit.Status.ARRIVED)
        self.assertIsNotNone(self.visit.actual_start)

        # Start session
        self.assertTrue(self.visit.start_session())
        self.assertEqual(self.visit.status, Visit.Status.IN_SESSION)

        # Complete visit
        self.assertTrue(self.visit.complete_visit())
        self.assertEqual(self.visit.status, Visit.Status.COMPLETED)
        self.assertIsNotNone(self.visit.actual_end)

    def test_visit_cancellation(self):
        """Test that a visit can be cancelled"""
        self.assertTrue(self.visit.cancel_visit())
        self.assertEqual(self.visit.status, Visit.Status.CANCELLED)


class LocationUpdateModelTestCase(TestCase):
    """Test the LocationUpdate model"""

    def setUp(self):
        # Create a user
        self.user = User.objects.create_user(
            username='user',
            email='user@example.com',
            password='password123',
            role='therapist'
        )

    def test_location_update_creation(self):
        """Test that a location update can be created"""
        location = LocationUpdate.objects.create(
            user=self.user,
            latitude=37.7749,
            longitude=-122.4194,
            accuracy=10.0
        )

        self.assertEqual(location.user, self.user)
        self.assertEqual(float(location.latitude), 37.7749)
        self.assertEqual(float(location.longitude), -122.4194)
        self.assertEqual(location.accuracy, 10.0)
        self.assertIsNotNone(location.timestamp)


class TherapistReportModelTestCase(TestCase):
    """Test the TherapistReport model"""

    def setUp(self):
        # Create users
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='password123',
            role='admin'
        )

        self.therapist_user = User.objects.create_user(
            username='therapist',
            email='therapist@example.com',
            password='password123',
            role='therapist'
        )

        self.patient_user = User.objects.create_user(
            username='patient',
            email='patient@example.com',
            password='password123',
            role='patient'
        )

        # Create therapist and patient profiles
        self.therapist = Therapist.objects.create(
            user=self.therapist_user,
            specialization='Physical Therapy',
            years_of_experience=5
        )

        self.patient = Patient.objects.create(
            user=self.patient_user,
            date_of_birth=timezone.now().date() - datetime.timedelta(days=365*30),
            emergency_contact_name='Emergency Contact',
            emergency_contact_phone='1234567890'
        )

        # Create a report
        self.report = TherapistReport.objects.create(
            therapist=self.therapist,
            patient=self.patient,
            report_date=timezone.now().date(),
            content='Initial report content'
        )

    def test_report_creation(self):
        """Test that a report can be created"""
        self.assertEqual(self.report.status, TherapistReport.Status.DRAFT)
        self.assertEqual(self.report.therapist, self.therapist)
        self.assertEqual(self.report.patient, self.patient)
        self.assertEqual(self.report.content, 'Initial report content')

    def test_report_workflow(self):
        """Test the report workflow"""
        # Append content
        self.assertTrue(self.report.append_content('Updated content'))
        self.assertEqual(self.report.content, 'Updated content')
        self.assertEqual(len(self.report.history), 1)
        self.assertEqual(self.report.history[0]['content'], 'Initial report content')

        # Submit report
        self.assertTrue(self.report.submit())
        self.assertEqual(self.report.status, TherapistReport.Status.SUBMITTED)
        self.assertIsNotNone(self.report.submitted_at)

        # Review report
        self.assertTrue(self.report.review(self.admin_user, 'Looks good'))
        self.assertEqual(self.report.status, TherapistReport.Status.REVIEWED)
        self.assertIsNotNone(self.report.reviewed_at)
        self.assertEqual(self.report.reviewed_by, self.admin_user)
        self.assertEqual(self.report.review_notes, 'Looks good')

        # Flag report
        self.assertTrue(self.report.flag(self.admin_user, 'Needs further review'))
        self.assertEqual(self.report.status, TherapistReport.Status.FLAGGED)
        self.assertEqual(self.report.review_notes, 'Needs further review')


class VisitAPITestCase(APITestCase):
    """Test the Visit API endpoints"""

    def setUp(self):
        # Create users
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='password123',
            role='admin',
            is_staff=True
        )

        self.therapist_user = User.objects.create_user(
            username='therapist',
            email='therapist@example.com',
            password='password123',
            role='therapist'
        )

        self.patient_user = User.objects.create_user(
            username='patient',
            email='patient@example.com',
            password='password123',
            role='patient'
        )

        # Create therapist and patient profiles
        self.therapist = Therapist.objects.create(
            user=self.therapist_user,
            specialization='Physical Therapy',
            years_of_experience=5
        )

        self.patient = Patient.objects.create(
            user=self.patient_user,
            date_of_birth=timezone.now().date() - datetime.timedelta(days=365*30),
            emergency_contact_name='Emergency Contact',
            emergency_contact_phone='1234567890'
        )

        # Create an appointment
        self.appointment = Appointment.objects.create(
            patient=self.patient,
            therapist=self.therapist,
            datetime=timezone.now() + datetime.timedelta(days=1),
            duration_minutes=60,
            status='scheduled',
            type='initial-assessment'
        )

    def test_create_visit(self):
        """Test creating a visit via the API"""
        self.client.force_authenticate(user=self.admin_user)

        data = {
            'appointment': self.appointment.id,
            'therapist': self.therapist.id,
            'patient': self.patient.id,
            'scheduled_start': (timezone.now() + datetime.timedelta(days=1)).isoformat(),
            'scheduled_end': (timezone.now() + datetime.timedelta(days=1, hours=1)).isoformat()
        }

        response = self.client.post('/api/visits/visits/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Visit.objects.count(), 1)

        visit = Visit.objects.first()
        self.assertEqual(visit.appointment, self.appointment)
        self.assertEqual(visit.therapist, self.therapist)
        self.assertEqual(visit.patient, self.patient)
        self.assertEqual(visit.status, Visit.Status.SCHEDULED)
