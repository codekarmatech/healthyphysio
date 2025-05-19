"""
Purpose: Tests for the scheduling app
"""

from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from users.models import Therapist, Patient
from scheduling.models import Appointment, Session
import datetime
import json

User = get_user_model()

class SessionReportModelTestCase(TestCase):
    """Test the Session model report functionality"""

    def setUp(self):
        """Set up test data"""
        # Create users
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='password123',
            role='admin',
            first_name='Admin',
            last_name='User'
        )

        self.therapist_user = User.objects.create_user(
            username='therapist',
            email='therapist@example.com',
            password='password123',
            role='therapist',
            first_name='Test',
            last_name='Therapist'
        )

        self.patient_user = User.objects.create_user(
            username='patient',
            email='patient@example.com',
            password='password123',
            role='patient',
            first_name='Test',
            last_name='Patient'
        )

        # Create profiles
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
            datetime=timezone.now() - datetime.timedelta(hours=2),
            duration_minutes=60,
            status='CONFIRMED',
            type='follow-up',
            session_code='PT-20230101-TST-ABCD'
        )

        # Create a session
        self.session = Session.objects.create(
            appointment=self.appointment,
            status=Session.Status.APPROVED_CHECKIN
        )

        # Complete the session
        self.session.complete_session(rating=4, patient_notes='Good session', patient_feedback='Very helpful')
        self.session.refresh_from_db()

    def test_session_completion_sets_report_status(self):
        """Test that completing a session sets the report status to pending"""
        self.assertEqual(self.session.status, Session.Status.COMPLETED)
        self.assertEqual(self.session.report_status, Session.ReportStatus.PENDING)
        self.assertIsNotNone(self.session.check_out)
        self.assertEqual(self.session.patient_notes, 'Good session')
        self.assertEqual(self.session.patient_feedback, 'Very helpful')

    def test_update_report(self):
        """Test updating a report"""
        report_data = {
            'therapist_notes': 'Therapist notes',
            'treatment_provided': 'Treatment details',
            'patient_progress': 'Good progress',
            'pain_level_before': 7,
            'pain_level_after': 4,
            'mobility_assessment': 'Improved mobility',
            'recommendations': 'Continue exercises',
            'next_session_goals': 'Work on strength'
        }

        # Update the report
        result = self.session.update_report(report_data, self.therapist_user)
        self.session.refresh_from_db()

        # Check result and data
        self.assertTrue(result)
        self.assertEqual(self.session.therapist_notes, 'Therapist notes')
        self.assertEqual(self.session.treatment_provided, 'Treatment details')
        self.assertEqual(self.session.patient_progress, 'Good progress')
        self.assertEqual(self.session.pain_level_before, 7)
        self.assertEqual(self.session.pain_level_after, 4)
        self.assertEqual(self.session.mobility_assessment, 'Improved mobility')
        self.assertEqual(self.session.recommendations, 'Continue exercises')
        self.assertEqual(self.session.next_session_goals, 'Work on strength')

        # Report status should still be pending
        self.assertEqual(self.session.report_status, Session.ReportStatus.PENDING)

        # History should be empty since this is the first update
        self.assertEqual(self.session.report_history, [])

    def test_update_report_history(self):
        """Test that updating a report multiple times creates history entries"""
        # First update
        first_data = {
            'therapist_notes': 'First notes',
            'treatment_provided': 'First treatment',
            'patient_progress': 'Initial progress'
        }
        self.session.update_report(first_data, self.therapist_user)

        # Second update
        second_data = {
            'therapist_notes': 'Updated notes',
            'treatment_provided': 'Updated treatment',
            'patient_progress': 'Updated progress'
        }
        self.session.update_report(second_data, self.therapist_user)
        self.session.refresh_from_db()

        # Check history
        self.assertEqual(len(self.session.report_history), 1)
        history_entry = self.session.report_history[0]
        self.assertEqual(history_entry['therapist_notes'], 'First notes')
        self.assertEqual(history_entry['treatment_provided'], 'First treatment')
        self.assertEqual(history_entry['patient_progress'], 'Initial progress')
        self.assertEqual(history_entry['user'], self.therapist_user.username)

    def test_submit_report(self):
        """Test submitting a report"""
        # First add required data
        report_data = {
            'therapist_notes': 'Therapist notes',
            'treatment_provided': 'Treatment details',
            'patient_progress': 'Good progress'
        }
        self.session.update_report(report_data, self.therapist_user)

        # Submit the report
        result = self.session.submit_report(self.therapist_user)
        self.session.refresh_from_db()

        # Check result and status
        self.assertTrue(result)
        self.assertEqual(self.session.report_status, Session.ReportStatus.SUBMITTED)
        self.assertIsNotNone(self.session.report_submitted_at)

    def test_submit_report_requires_fields(self):
        """Test that submitting a report requires certain fields"""
        # Try to submit without required fields
        result = self.session.submit_report(self.therapist_user)

        # Should fail
        self.assertFalse(result)
        self.assertEqual(self.session.report_status, Session.ReportStatus.PENDING)
        self.assertIsNone(self.session.report_submitted_at)

    def test_review_report(self):
        """Test reviewing a report"""
        # Add required data and submit
        report_data = {
            'therapist_notes': 'Therapist notes',
            'treatment_provided': 'Treatment details',
            'patient_progress': 'Good progress'
        }
        self.session.update_report(report_data, self.therapist_user)
        self.session.submit_report(self.therapist_user)

        # Review the report
        result = self.session.review_report(self.admin_user, flag=False, notes='Looks good')
        self.session.refresh_from_db()

        # Check result and status
        self.assertTrue(result)
        self.assertEqual(self.session.report_status, Session.ReportStatus.REVIEWED)
        self.assertIsNotNone(self.session.report_reviewed_at)
        self.assertEqual(self.session.report_reviewed_by, self.admin_user)

        # Check history
        self.assertEqual(len(self.session.report_history), 1)
        history_entry = self.session.report_history[0]
        self.assertEqual(history_entry['action'], 'reviewed')
        self.assertEqual(history_entry['notes'], 'Looks good')
        self.assertEqual(history_entry['user'], self.admin_user.username)

    def test_flag_report(self):
        """Test flagging a report"""
        # Add required data and submit
        report_data = {
            'therapist_notes': 'Therapist notes',
            'treatment_provided': 'Treatment details',
            'patient_progress': 'Good progress'
        }
        self.session.update_report(report_data, self.therapist_user)
        self.session.submit_report(self.therapist_user)

        # Flag the report
        result = self.session.review_report(self.admin_user, flag=True, notes='Needs more detail')
        self.session.refresh_from_db()

        # Check result and status
        self.assertTrue(result)
        self.assertEqual(self.session.report_status, Session.ReportStatus.FLAGGED)
        self.assertIsNotNone(self.session.report_reviewed_at)
        self.assertEqual(self.session.report_reviewed_by, self.admin_user)

        # Check history
        self.assertEqual(len(self.session.report_history), 1)
        history_entry = self.session.report_history[0]
        self.assertEqual(history_entry['action'], 'flagged')
        self.assertEqual(history_entry['notes'], 'Needs more detail')

    def test_is_report_required(self):
        """Test the is_report_required method"""
        self.assertTrue(self.session.is_report_required())

        # If report is submitted, it's not required
        self.session.report_status = Session.ReportStatus.SUBMITTED
        self.session.save()
        self.assertFalse(self.session.is_report_required())

        # If session is not completed, report is not required
        self.session.report_status = Session.ReportStatus.PENDING
        self.session.status = Session.Status.PENDING
        self.session.save()
        self.assertFalse(self.session.is_report_required())

    def test_is_report_submitted(self):
        """Test the is_report_submitted method"""
        self.assertFalse(self.session.is_report_submitted())

        # If report is submitted, it should return true
        self.session.report_status = Session.ReportStatus.SUBMITTED
        self.session.save()
        self.assertTrue(self.session.is_report_submitted())

        # If report is reviewed, it should return true
        self.session.report_status = Session.ReportStatus.REVIEWED
        self.session.save()
        self.assertTrue(self.session.is_report_submitted())

        # If report is flagged, it should return true
        self.session.report_status = Session.ReportStatus.FLAGGED
        self.session.save()
        self.assertTrue(self.session.is_report_submitted())


class SessionReportAPITestCase(APITestCase):
    """Test the Session report API endpoints"""

    def setUp(self):
        """Set up test data"""
        # Create users
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='password123',
            role='admin',
            first_name='Admin',
            last_name='User'
        )

        self.therapist_user = User.objects.create_user(
            username='therapist',
            email='therapist@example.com',
            password='password123',
            role='therapist',
            first_name='Test',
            last_name='Therapist'
        )

        self.patient_user = User.objects.create_user(
            username='patient',
            email='patient@example.com',
            password='password123',
            role='patient',
            first_name='Test',
            last_name='Patient'
        )

        # Create profiles
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
            datetime=timezone.now() - datetime.timedelta(hours=2),
            duration_minutes=60,
            status='COMPLETED',
            type='follow-up',
            session_code='PT-20230101-TST-ABCD'
        )

        # Create a session
        self.session = Session.objects.create(
            appointment=self.appointment,
            status=Session.Status.COMPLETED,
            report_status=Session.ReportStatus.PENDING
        )

        # Create a second session for testing lists
        self.appointment2 = Appointment.objects.create(
            patient=self.patient,
            therapist=self.therapist,
            datetime=timezone.now() - datetime.timedelta(days=1),
            duration_minutes=60,
            status='COMPLETED',
            type='follow-up',
            session_code='PT-20230102-TST-EFGH'
        )

        self.session2 = Session.objects.create(
            appointment=self.appointment2,
            status=Session.Status.COMPLETED,
            report_status=Session.ReportStatus.SUBMITTED,
            report_submitted_at=timezone.now()
        )

    def test_update_report_api(self):
        """Test updating a report via API"""
        self.client.force_authenticate(user=self.therapist_user)

        url = f'/api/scheduling/sessions/{self.session.id}/update_report/'
        data = {
            'therapist_notes': 'API test notes',
            'treatment_provided': 'API test treatment',
            'patient_progress': 'API test progress',
            'pain_level_before': 8,
            'pain_level_after': 3
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Report updated successfully')

        # Verify the data was saved
        self.session.refresh_from_db()
        self.assertEqual(self.session.therapist_notes, 'API test notes')
        self.assertEqual(self.session.treatment_provided, 'API test treatment')
        self.assertEqual(self.session.patient_progress, 'API test progress')
        self.assertEqual(self.session.pain_level_before, 8)
        self.assertEqual(self.session.pain_level_after, 3)

    def test_update_report_api_unauthorized(self):
        """Test that only the assigned therapist can update a report"""
        # Create another therapist
        other_therapist = User.objects.create_user(
            username='other_therapist',
            email='other@example.com',
            password='password123',
            role='therapist'
        )

        self.client.force_authenticate(user=other_therapist)

        url = f'/api/scheduling/sessions/{self.session.id}/update_report/'
        data = {
            'therapist_notes': 'Unauthorized notes'
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Verify the data was not saved
        self.session.refresh_from_db()
        self.assertNotEqual(self.session.therapist_notes, 'Unauthorized notes')

    def test_submit_report_api(self):
        """Test submitting a report via API"""
        self.client.force_authenticate(user=self.therapist_user)

        # First update the report with required fields
        url = f'/api/scheduling/sessions/{self.session.id}/update_report/'
        data = {
            'therapist_notes': 'Submit test notes',
            'treatment_provided': 'Submit test treatment',
            'patient_progress': 'Submit test progress'
        }
        self.client.post(url, data, format='json')

        # Now submit the report
        url = f'/api/scheduling/sessions/{self.session.id}/submit_report/'
        response = self.client.post(url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Report submitted successfully')
        self.assertEqual(response.data['report_status'], 'submitted')

        # Verify the report was submitted
        self.session.refresh_from_db()
        self.assertEqual(self.session.report_status, Session.ReportStatus.SUBMITTED)
        self.assertIsNotNone(self.session.report_submitted_at)

    def test_submit_report_api_missing_fields(self):
        """Test that submitting a report requires certain fields"""
        self.client.force_authenticate(user=self.therapist_user)

        # Try to submit without required fields
        url = f'/api/scheduling/sessions/{self.session.id}/submit_report/'
        response = self.client.post(url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Verify the report was not submitted
        self.session.refresh_from_db()
        self.assertEqual(self.session.report_status, Session.ReportStatus.PENDING)

    def test_review_report_api(self):
        """Test reviewing a report via API"""
        # First submit the report
        self.session.therapist_notes = 'Review test notes'
        self.session.treatment_provided = 'Review test treatment'
        self.session.patient_progress = 'Review test progress'
        self.session.report_status = Session.ReportStatus.SUBMITTED
        self.session.report_submitted_at = timezone.now()
        self.session.save()

        # Now review as admin
        self.client.force_authenticate(user=self.admin_user)

        url = f'/api/scheduling/sessions/{self.session.id}/review_report/'
        data = {
            'notes': 'Admin review notes',
            'flag': False
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Report reviewed successfully')
        self.assertEqual(response.data['report_status'], 'reviewed')

        # Verify the report was reviewed
        self.session.refresh_from_db()
        self.assertEqual(self.session.report_status, Session.ReportStatus.REVIEWED)
        self.assertIsNotNone(self.session.report_reviewed_at)
        self.assertEqual(self.session.report_reviewed_by, self.admin_user)

    def test_flag_report_api(self):
        """Test flagging a report via API"""
        # First submit the report
        self.session.therapist_notes = 'Flag test notes'
        self.session.treatment_provided = 'Flag test treatment'
        self.session.patient_progress = 'Flag test progress'
        self.session.report_status = Session.ReportStatus.SUBMITTED
        self.session.report_submitted_at = timezone.now()
        self.session.save()

        # Now flag as admin
        self.client.force_authenticate(user=self.admin_user)

        url = f'/api/scheduling/sessions/{self.session.id}/review_report/'
        data = {
            'notes': 'Admin flag notes',
            'flag': True
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Report flagged successfully')
        self.assertEqual(response.data['report_status'], 'flagged')

        # Verify the report was flagged
        self.session.refresh_from_db()
        self.assertEqual(self.session.report_status, Session.ReportStatus.FLAGGED)

    def test_review_report_api_unauthorized(self):
        """Test that only admins can review reports"""
        # First submit the report
        self.session.therapist_notes = 'Unauth test notes'
        self.session.treatment_provided = 'Unauth test treatment'
        self.session.patient_progress = 'Unauth test progress'
        self.session.report_status = Session.ReportStatus.SUBMITTED
        self.session.report_submitted_at = timezone.now()
        self.session.save()

        # Try to review as therapist
        self.client.force_authenticate(user=self.therapist_user)

        url = f'/api/scheduling/sessions/{self.session.id}/review_report/'
        data = {
            'notes': 'Therapist review notes',
            'flag': False
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Verify the report was not reviewed
        self.session.refresh_from_db()
        self.assertEqual(self.session.report_status, Session.ReportStatus.SUBMITTED)
        self.assertIsNone(self.session.report_reviewed_at)
        self.assertIsNone(self.session.report_reviewed_by)

    def test_pending_reports_api(self):
        """Test getting pending reports via API"""
        self.client.force_authenticate(user=self.therapist_user)

        url = '/api/scheduling/sessions/pending_reports/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.session.id)

    def test_submitted_reports_api(self):
        """Test getting submitted reports via API"""
        self.client.force_authenticate(user=self.admin_user)

        url = '/api/scheduling/sessions/submitted_reports/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.session2.id)

    def test_submitted_reports_api_unauthorized(self):
        """Test that only admins can view submitted reports"""
        self.client.force_authenticate(user=self.therapist_user)

        url = '/api/scheduling/sessions/submitted_reports/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
