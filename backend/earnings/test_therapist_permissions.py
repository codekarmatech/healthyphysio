"""
Test script to verify therapist earnings permission fixes
Run this to test the permission logic for therapist earnings access
"""

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
import json

from users.models import User, Therapist
from earnings.models import EarningRecord

User = get_user_model()


class TherapistEarningsPermissionTest(TestCase):
    """Test therapist earnings permission logic"""
    
    def setUp(self):
        """Set up test data"""
        # Create test users
        self.therapist1_user = User.objects.create_user(
            username='therapist1',
            email='therapist1@test.com',
            password='testpass123',
            role=User.Role.THERAPIST
        )
        
        self.therapist2_user = User.objects.create_user(
            username='therapist2',
            email='therapist2@test.com',
            password='testpass123',
            role=User.Role.THERAPIST
        )
        
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            role=User.Role.ADMIN
        )
        
        # Create therapist profiles
        self.therapist1 = Therapist.objects.create(
            user=self.therapist1_user,
            license_number='LIC001',
            specialization='Physiotherapy'
        )
        
        self.therapist2 = Therapist.objects.create(
            user=self.therapist2_user,
            license_number='LIC002',
            specialization='Physiotherapy'
        )
        
        # Create API client
        self.client = APIClient()
    
    def test_therapist_can_access_own_earnings(self):
        """Test that therapist can access their own earnings"""
        # Login as therapist1
        self.client.force_authenticate(user=self.therapist1_user)
        
        # Try to access own earnings
        url = f'/api/earnings/therapist/{self.therapist1.id}/monthly/'
        response = self.client.get(url, {'year': 2025, 'month': 5})
        
        print(f"Therapist1 accessing own data (ID {self.therapist1.id}): {response.status_code}")
        if response.status_code != 200:
            print(f"Error: {response.data}")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_therapist_cannot_access_other_earnings(self):
        """Test that therapist cannot access another therapist's earnings"""
        # Login as therapist1
        self.client.force_authenticate(user=self.therapist1_user)
        
        # Try to access therapist2's earnings
        url = f'/api/earnings/therapist/{self.therapist2.id}/monthly/'
        response = self.client.get(url, {'year': 2025, 'month': 5})
        
        print(f"Therapist1 (ID {self.therapist1.id}) accessing therapist2 data (ID {self.therapist2.id}): {response.status_code}")
        if response.status_code == 403:
            print(f"Correctly blocked: {response.data}")
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('You can only view your own earnings data', str(response.data))
    
    def test_admin_can_access_any_earnings(self):
        """Test that admin can access any therapist's earnings"""
        # Login as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Try to access therapist1's earnings
        url = f'/api/earnings/therapist/{self.therapist1.id}/monthly/'
        response = self.client.get(url, {'year': 2025, 'month': 5})
        
        print(f"Admin accessing therapist1 data (ID {self.therapist1.id}): {response.status_code}")
        if response.status_code != 200:
            print(f"Error: {response.data}")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Try to access therapist2's earnings
        url = f'/api/earnings/therapist/{self.therapist2.id}/monthly/'
        response = self.client.get(url, {'year': 2025, 'month': 5})
        
        print(f"Admin accessing therapist2 data (ID {self.therapist2.id}): {response.status_code}")
        if response.status_code != 200:
            print(f"Error: {response.data}")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_user_id_vs_therapist_id_mapping(self):
        """Test the relationship between user ID and therapist profile ID"""
        print(f"\n=== User ID vs Therapist Profile ID Mapping ===")
        print(f"Therapist1 User ID: {self.therapist1_user.id}")
        print(f"Therapist1 Profile ID: {self.therapist1.id}")
        print(f"Therapist2 User ID: {self.therapist2_user.id}")
        print(f"Therapist2 Profile ID: {self.therapist2.id}")
        
        # Verify the relationship
        self.assertEqual(self.therapist1.user.id, self.therapist1_user.id)
        self.assertEqual(self.therapist2.user.id, self.therapist2_user.id)
        
        # The therapist profile ID should be different from user ID
        # (unless they happen to be the same by coincidence)
        print(f"User ID == Therapist Profile ID for therapist1: {self.therapist1_user.id == self.therapist1.id}")
        print(f"User ID == Therapist Profile ID for therapist2: {self.therapist2_user.id == self.therapist2.id}")


def run_permission_test():
    """Run the permission test manually"""
    import django
    import os
    
    # Set up Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    django.setup()
    
    # Run the test
    import unittest
    
    # Create test suite
    suite = unittest.TestLoader().loadTestsFromTestCase(TherapistEarningsPermissionTest)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_permission_test()
    if success:
        print("\n✅ All permission tests passed!")
    else:
        print("\n❌ Some permission tests failed!")
