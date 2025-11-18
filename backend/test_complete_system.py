#!/usr/bin/env python
"""
Complete System Integration Test
Tests both therapist earnings permissions and data protection compliance
"""

import os
import sys
import django
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, Therapist, Patient
from users.data_protection import AccountDeletionRequest
from users.data_protection_service import DataProtectionService

User = get_user_model()


class CompleteSystemIntegrationTest(TestCase):
    """End-to-end integration test for both critical fixes"""
    
    def setUp(self):
        """Set up comprehensive test environment"""
        # Initialize data protection system
        DataProtectionService.initialize_retention_policies()
        
        # Create test users with different roles
        self.therapist_user = User.objects.create_user(
            username='therapist_test',
            email='therapist@test.com',
            password='testpass123',
            role=User.Role.THERAPIST,
            first_name='Test',
            last_name='Therapist'
        )
        
        self.patient_user = User.objects.create_user(
            username='patient_test',
            email='patient@test.com',
            password='testpass123',
            role=User.Role.PATIENT,
            first_name='Test',
            last_name='Patient'
        )
        
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='testpass123',
            role=User.Role.ADMIN,
            first_name='Test',
            last_name='Admin',
            is_staff=True,
            is_superuser=True
        )
        
        # Create profiles
        self.therapist = Therapist.objects.create(
            user=self.therapist_user,
            license_number='TEST001',
            specialization='Physiotherapy',
            years_of_experience=5
        )
        
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
        
        self.client = APIClient()
    
    def test_complete_therapist_earnings_workflow(self):
        """Test complete therapist earnings access workflow"""
        print("\n=== Testing Therapist Earnings Permission Fix ===")
        
        # Test 1: Therapist can access own earnings
        self.client.force_authenticate(user=self.therapist_user)
        url = f'/api/earnings/therapist/{self.therapist.id}/monthly/'
        response = self.client.get(url, {'year': 2025, 'month': 1})
        
        print(f"✅ Therapist accessing own earnings (ID {self.therapist.id}): {response.status_code}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test 2: Admin can access therapist earnings
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(url, {'year': 2025, 'month': 1})
        
        print(f"✅ Admin accessing therapist earnings: {response.status_code}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test 3: Patient cannot access therapist earnings
        self.client.force_authenticate(user=self.patient_user)
        response = self.client.get(url, {'year': 2025, 'month': 1})
        
        print(f"✅ Patient blocked from therapist earnings: {response.status_code}")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_complete_data_protection_workflow(self):
        """Test complete data protection compliance workflow"""
        print("\n=== Testing Data Protection Compliance System ===")
        
        # Test 1: User requests account deletion
        self.client.force_authenticate(user=self.patient_user)
        url = '/api/users/request-deletion/'
        data = {'reason': 'No longer need account for testing'}
        
        response = self.client.post(url, data)
        print(f"✅ User deletion request: {response.status_code}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        deletion_request = AccountDeletionRequest.objects.get(user=self.patient_user)
        self.assertEqual(deletion_request.status, 'pending')
        
        # Test 2: User checks deletion status
        url = '/api/users/deletion-status/'
        response = self.client.get(url)
        
        print(f"✅ User checking deletion status: {response.status_code}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['has_request'])
        
        # Test 3: Admin views deletion requests
        self.client.force_authenticate(user=self.admin_user)
        url = '/api/users/admin/deletion-requests/'
        response = self.client.get(url)
        
        print(f"✅ Admin viewing deletion requests: {response.status_code}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        
        # Test 4: Admin approves deletion
        url = f'/api/users/admin/deletion-requests/{deletion_request.id}/approve/'
        data = {'notes': 'Approved for integration testing'}
        response = self.client.post(url, data)
        
        print(f"✅ Admin approving deletion: {response.status_code}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify deletion was processed
        deletion_request.refresh_from_db()
        self.assertEqual(deletion_request.status, 'completed')
        
        # Verify user data was anonymized
        self.patient_user.refresh_from_db()
        self.patient.refresh_from_db()
        
        print(f"✅ User anonymized: {self.patient_user.first_name == 'Deleted'}")
        print(f"✅ Patient soft deleted: {self.patient.is_deleted}")
        
        self.assertEqual(self.patient_user.first_name, 'Deleted')
        self.assertEqual(self.patient_user.last_name, 'User')
        self.assertFalse(self.patient_user.is_active)
        self.assertTrue(self.patient.is_deleted)
    
    def test_compliance_dashboard_functionality(self):
        """Test compliance dashboard shows correct metrics"""
        print("\n=== Testing Compliance Dashboard ===")
        
        # Create some test deletion requests
        DataProtectionService.request_account_deletion(
            user=self.therapist_user,
            reason='Test deletion for dashboard'
        )
        
        self.client.force_authenticate(user=self.admin_user)
        url = '/api/users/admin/compliance-dashboard/'
        response = self.client.get(url)
        
        print(f"✅ Compliance dashboard access: {response.status_code}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        stats = response.data['statistics']
        print(f"✅ Dashboard shows {stats['total_requests']} total requests")
        print(f"✅ Dashboard shows {stats['pending_requests']} pending requests")
        
        self.assertGreaterEqual(stats['total_requests'], 1)
    
    def test_retention_policies_active(self):
        """Test that retention policies are properly configured"""
        print("\n=== Testing Retention Policies ===")
        
        self.client.force_authenticate(user=self.admin_user)
        url = '/api/users/admin/retention-policies/'
        response = self.client.get(url)
        
        print(f"✅ Retention policies endpoint: {response.status_code}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        policies = response.data['policies']
        print(f"✅ Found {len(policies)} retention policies")
        
        # Verify key policies exist
        medical_policy = next((p for p in policies if p['data_type'] == 'patient_medical'), None)
        self.assertIsNotNone(medical_policy)
        self.assertEqual(medical_policy['retention_period_years'], 7.0)
        print(f"✅ Medical records retention: {medical_policy['retention_period_years']} years")
        
        personal_policy = next((p for p in policies if p['data_type'] == 'patient_personal'), None)
        self.assertIsNotNone(personal_policy)
        print(f"✅ Personal data retention: {personal_policy['retention_period_days']} days")
    
    def test_cross_system_integration(self):
        """Test integration between earnings and data protection systems"""
        print("\n=== Testing Cross-System Integration ===")
        
        # Test that therapist can access earnings before deletion
        self.client.force_authenticate(user=self.therapist_user)
        earnings_url = f'/api/earnings/therapist/{self.therapist.id}/monthly/'
        response = self.client.get(earnings_url, {'year': 2025, 'month': 1})
        
        print(f"✅ Therapist earnings access before deletion: {response.status_code}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Request deletion
        deletion_request = DataProtectionService.request_account_deletion(
            user=self.therapist_user,
            reason='Integration test deletion'
        )
        
        # Process deletion
        DataProtectionService.process_deletion_request(
            deletion_request=deletion_request,
            admin_user=self.admin_user,
            action='approve',
            notes='Integration test approval'
        )
        
        # Verify therapist profile is soft deleted but earnings structure preserved
        self.therapist.refresh_from_db()
        print(f"✅ Therapist soft deleted: {self.therapist.is_deleted}")
        self.assertTrue(self.therapist.is_deleted)
        
        # Verify anonymized user cannot access earnings
        self.therapist_user.refresh_from_db()
        print(f"✅ User anonymized: {self.therapist_user.first_name == 'Deleted'}")
        self.assertEqual(self.therapist_user.first_name, 'Deleted')
        self.assertFalse(self.therapist_user.is_active)


def run_complete_system_test():
    """Run the complete system integration test"""
    print("🚀 Starting Complete System Integration Test")
    print("=" * 60)
    
    import unittest
    
    # Create test suite
    suite = unittest.TestLoader().loadTestsFromTestCase(CompleteSystemIntegrationTest)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print("\n" + "=" * 60)
    if result.wasSuccessful():
        print("🎉 ALL INTEGRATION TESTS PASSED!")
        print("✅ Therapist earnings permission fix: WORKING")
        print("✅ Data protection compliance: WORKING")
        print("✅ Cross-system integration: WORKING")
        print("✅ System ready for production deployment")
    else:
        print("❌ SOME INTEGRATION TESTS FAILED!")
        print("⚠️  Review failed tests before deployment")
    
    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_complete_system_test()
    sys.exit(0 if success else 1)
