"""
Test cases for Data Protection and DPDP Act 2023 compliance
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta

from .models import User, Therapist, Patient
from .data_protection import (
    AccountDeletionRequest,
    DataRetentionPolicy
)
from .data_protection_service import DataProtectionService

User = get_user_model()


class DataProtectionComplianceTest(TestCase):
    """Test data protection compliance features"""

    def setUp(self):
        """Set up test data"""
        # Initialize retention policies
        DataProtectionService.initialize_retention_policies()

        # Create test users
        self.patient_user = User.objects.create_user(
            username='patient1',
            email='patient1@test.com',
            password='testpass123',
            role=User.Role.PATIENT
        )

        self.therapist_user = User.objects.create_user(
            username='therapist1',
            email='therapist1@test.com',
            password='testpass123',
            role=User.Role.THERAPIST
        )

        self.admin_user = User.objects.create_user(
            username='admin1',
            email='admin1@test.com',
            password='testpass123',
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True
        )

        # Create profiles
        self.patient = Patient.objects.create(
            user=self.patient_user,
            gender='Male',
            age=30,
            address='Test Address',
            city='Ahmedabad',
            state='Gujarat',
            zip_code='380001',
            disease='Back Pain',
            emergency_contact_name='Emergency Contact',
            emergency_contact_phone='9999999999',
            emergency_contact_relationship='Spouse',
            treatment_location='Home'
        )

        self.therapist = Therapist.objects.create(
            user=self.therapist_user,
            license_number='LIC001',
            specialization='Physiotherapy'
        )

        # Create API client
        self.client = APIClient()

    def test_retention_policies_initialized(self):
        """Test that retention policies are properly initialized"""
        policies = DataRetentionPolicy.objects.all()
        self.assertEqual(policies.count(), 5)

        # Check specific policies
        medical_policy = DataRetentionPolicy.objects.get(data_type='patient_medical')
        self.assertEqual(medical_policy.retention_period_days, 2555)  # 7 years
        self.assertTrue(medical_policy.can_override_deletion)

        personal_policy = DataRetentionPolicy.objects.get(data_type='patient_personal')
        self.assertEqual(personal_policy.retention_period_days, 90)  # 3 months
        self.assertFalse(personal_policy.can_override_deletion)

    def test_user_can_request_deletion(self):
        """Test that users can request account deletion"""
        self.client.force_authenticate(user=self.patient_user)

        url = '/api/users/request-deletion/'
        data = {'reason': 'I no longer need this account'}

        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Check that deletion request was created
        deletion_request = AccountDeletionRequest.objects.get(user=self.patient_user)
        self.assertEqual(deletion_request.reason, 'I no longer need this account')
        self.assertEqual(deletion_request.status, 'pending')
        self.assertIsNotNone(deletion_request.compliance_deadline)

    def test_user_cannot_request_multiple_deletions(self):
        """Test that users cannot create multiple pending deletion requests"""
        # Create first deletion request
        DataProtectionService.request_account_deletion(
            user=self.patient_user,
            reason='First request'
        )

        self.client.force_authenticate(user=self.patient_user)
        url = '/api/users/request-deletion/'
        data = {'reason': 'Second request'}

        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already has a pending deletion request', str(response.data))

    def test_user_can_check_deletion_status(self):
        """Test that users can check their deletion request status"""
        # Create deletion request
        deletion_request = DataProtectionService.request_account_deletion(
            user=self.patient_user,
            reason='Test deletion'
        )

        self.client.force_authenticate(user=self.patient_user)
        url = '/api/users/deletion-status/'

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertTrue(data['has_request'])
        self.assertEqual(data['status'], 'pending')
        self.assertEqual(data['request_id'], deletion_request.id)

    def test_user_can_cancel_deletion_request(self):
        """Test that users can cancel their pending deletion request"""
        # Create deletion request
        DataProtectionService.request_account_deletion(
            user=self.patient_user,
            reason='Test deletion'
        )

        self.client.force_authenticate(user=self.patient_user)
        url = '/api/users/cancel-deletion/'

        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check that request was cancelled
        deletion_request = AccountDeletionRequest.objects.get(user=self.patient_user)
        self.assertEqual(deletion_request.status, 'rejected')
        self.assertEqual(deletion_request.admin_notes, 'Cancelled by user')

    def test_admin_can_view_deletion_requests(self):
        """Test that admins can view all deletion requests"""
        # Create deletion requests
        DataProtectionService.request_account_deletion(
            user=self.patient_user,
            reason='Patient deletion'
        )
        DataProtectionService.request_account_deletion(
            user=self.therapist_user,
            reason='Therapist deletion'
        )

        self.client.force_authenticate(user=self.admin_user)
        url = '/api/users/admin/deletion-requests/'

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertEqual(data['count'], 2)
        self.assertEqual(len(data['results']), 2)

    def test_admin_can_approve_deletion_request(self):
        """Test that admins can approve deletion requests"""
        # Create deletion request
        deletion_request = DataProtectionService.request_account_deletion(
            user=self.patient_user,
            reason='Test deletion'
        )

        self.client.force_authenticate(user=self.admin_user)
        url = f'/api/users/admin/deletion-requests/{deletion_request.id}/approve/'
        data = {'notes': 'Approved for testing'}

        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check that request was approved and processed
        deletion_request.refresh_from_db()
        self.assertEqual(deletion_request.status, 'completed')
        self.assertEqual(deletion_request.admin_notes, 'Approved for testing')

    def test_admin_can_reject_deletion_request(self):
        """Test that admins can reject deletion requests"""
        # Create deletion request
        deletion_request = DataProtectionService.request_account_deletion(
            user=self.patient_user,
            reason='Test deletion'
        )

        self.client.force_authenticate(user=self.admin_user)
        url = f'/api/users/admin/deletion-requests/{deletion_request.id}/reject/'
        data = {'reason': 'Insufficient justification'}

        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check that request was rejected
        deletion_request.refresh_from_db()
        self.assertEqual(deletion_request.status, 'rejected')
        self.assertEqual(deletion_request.admin_notes, 'Insufficient justification')

    def test_soft_deletion_anonymizes_data(self):
        """Test that soft deletion properly anonymizes user data"""
        # Create deletion request and approve it
        deletion_request = DataProtectionService.request_account_deletion(
            user=self.patient_user,
            reason='Test deletion'
        )

        # Store original data
        original_username = self.patient_user.username
        original_email = self.patient_user.email
        original_address = self.patient.address

        # Process deletion
        DataProtectionService.process_deletion_request(
            deletion_request=deletion_request,
            admin_user=self.admin_user,
            action='approve',
            notes='Test approval'
        )

        # Check that user data was anonymized
        self.patient_user.refresh_from_db()
        self.patient.refresh_from_db()

        self.assertNotEqual(self.patient_user.username, original_username)
        self.assertNotEqual(self.patient_user.email, original_email)
        self.assertNotEqual(self.patient.address, original_address)
        self.assertEqual(self.patient_user.first_name, 'Deleted')
        self.assertEqual(self.patient_user.last_name, 'User')
        self.assertFalse(self.patient_user.is_active)

        # Check that patient was soft deleted
        self.assertTrue(self.patient.is_deleted)
        self.assertIsNotNone(self.patient.deleted_at)

    def test_compliance_dashboard_shows_metrics(self):
        """Test that compliance dashboard shows correct metrics"""
        # Create some deletion requests
        DataProtectionService.request_account_deletion(
            user=self.patient_user,
            reason='Patient deletion'
        )

        overdue_request = DataProtectionService.request_account_deletion(
            user=self.therapist_user,
            reason='Therapist deletion'
        )

        # Make one request overdue
        overdue_request.compliance_deadline = timezone.now() - timedelta(days=1)
        overdue_request.save()

        self.client.force_authenticate(user=self.admin_user)
        url = '/api/users/admin/compliance-dashboard/'

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        stats = data['statistics']
        self.assertEqual(stats['total_requests'], 2)
        self.assertEqual(stats['pending_requests'], 2)
        self.assertEqual(stats['overdue_requests'], 1)
        self.assertEqual(stats['legal_holds'], 0)

    def test_retention_policies_endpoint(self):
        """Test that retention policies endpoint returns correct data"""
        self.client.force_authenticate(user=self.admin_user)
        url = '/api/users/admin/retention-policies/'

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertEqual(len(data['policies']), 5)

        # Check medical records policy
        medical_policy = next(p for p in data['policies'] if p['data_type'] == 'patient_medical')
        self.assertEqual(medical_policy['retention_period_years'], 7.0)
        self.assertTrue(medical_policy['can_override_deletion'])


def run_data_protection_tests():
    """Run data protection tests manually"""
    import django
    import os

    # Set up Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    django.setup()

    # Run the test
    import unittest

    # Create test suite
    suite = unittest.TestLoader().loadTestsFromTestCase(DataProtectionComplianceTest)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_data_protection_tests()
    if success:
        print("\n✅ All data protection tests passed!")
    else:
        print("\n❌ Some data protection tests failed!")
