from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
import calendar
from .models import Attendance, Holiday
from users.models import User, Therapist
import json

class AttendanceModelTests(TestCase):
    def setUp(self):
        # Create a user with therapist role
        self.user = User.objects.create_user(
            username='therapist1',
            email='therapist1@example.com',
            password='password123',
            role='therapist'
        )
        # In both test classes, change the field name from licenseNumber to license_number
        # For AttendanceModelTests.setUp:
        self.therapist = Therapist.objects.create(
            user=self.user,
            specialization='Physical Therapy',
            license_number='PT12345'  # Changed from licenseNumber
        )
        
        # Create an admin user
        self.admin_user = User.objects.create_user(
            username='admin1',
            email='admin1@example.com',
            password='password123',
            role='admin'
        )
        
        # Create a holiday
        self.holiday = Holiday.objects.create(
            name='Independence Day',
            date=timezone.now().date() + timedelta(days=5),
            description='National Holiday'
        )
    
    def test_attendance_creation(self):
        attendance = Attendance.objects.create(
            therapist=self.therapist,
            date=timezone.now().date(),
            status='present'
        )
        self.assertEqual(attendance.status, 'present')
        self.assertIsNone(attendance.approved_by)
        self.assertIsNone(attendance.approved_at)
    
    def test_attendance_approval(self):
        attendance = Attendance.objects.create(
            therapist=self.therapist,
            date=timezone.now().date(),
            status='present'
        )
        attendance.approve(self.admin_user)
        self.assertEqual(attendance.approved_by, self.admin_user)
        self.assertIsNotNone(attendance.approved_at)

class AttendanceAPITests(APITestCase):
    def setUp(self):
        # Create a user with therapist role
        self.therapist_user = User.objects.create_user(
            username='therapist1',
            email='therapist1@example.com',
            password='password123',
            role='therapist'
        )
        # For AttendanceAPITests.setUp:
        self.therapist = Therapist.objects.create(
            user=self.therapist_user,
            specialization='Physical Therapy',
            license_number='PT12345'  # Changed from licenseNumber
        )
        
        # Create another therapist
        self.therapist_user2 = User.objects.create_user(
            username='therapist2',
            email='therapist2@example.com',
            password='password123',
            role='therapist'
        )
        self.therapist2 = Therapist.objects.create(
            user=self.therapist_user2,
            specialization='Occupational Therapy',
            license_number='OT12345'  # Changed from licenseNumber
        )
        
        # Create an admin user
        self.admin_user = User.objects.create_user(
            username='admin1',
            email='admin1@example.com',
            password='password123',
            role='admin'
        )
        
        # Create a holiday
        self.holiday = Holiday.objects.create(
            name='Independence Day',
            date=timezone.now().date() + timedelta(days=5),
            description='National Holiday'
        )
        
        # Create attendance records
        self.attendance = Attendance.objects.create(
            therapist=self.therapist,
            date=timezone.now().date(),
            status='present'
        )
        
        # Create client
        self.client = APIClient()
    
    def test_therapist_can_submit_attendance(self):
        self.client.force_authenticate(user=self.therapist_user)
        
        # First, delete ALL existing attendance records for this therapist on today's date
        today = timezone.now().date()
        Attendance.objects.filter(therapist=self.therapist, date=today).delete()
        
        # Now try to submit a new attendance
        response = self.client.post(reverse('attendance-list'), {
            'status': 'present',
            'date': today.isoformat()  # Explicitly provide today's date in ISO format
        })
        
        print(f"Response data: {response.data}")  # Add this for debugging
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_therapist_cannot_submit_for_past_date(self):
        self.client.force_authenticate(user=self.therapist_user)
        yesterday = timezone.now().date() - timedelta(days=1)
        response = self.client.post(reverse('attendance-list'), {
            'therapist': self.therapist.id,
            'date': yesterday,
            'status': 'present'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_therapist_cannot_submit_for_future_date(self):
        self.client.force_authenticate(user=self.therapist_user)
        tomorrow = timezone.now().date() + timedelta(days=1)
        response = self.client.post(reverse('attendance-list'), {
            'therapist': self.therapist.id,
            'date': tomorrow,
            'status': 'present'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_therapist_cannot_submit_twice_for_same_day(self):
        # Create an attendance for today
        Attendance.objects.create(
            therapist=self.therapist2,
            date=timezone.now().date(),
            status='present'
        )
        
        self.client.force_authenticate(user=self.therapist_user2)
        response = self.client.post(reverse('attendance-list'), {
            'therapist': self.therapist2.id,
            'status': 'half_day'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_admin_can_approve_attendance(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.put(
            reverse('attendance-approve', kwargs={'pk': self.attendance.id})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify attendance is approved
        self.attendance.refresh_from_db()
        self.assertEqual(self.attendance.approved_by, self.admin_user)
        self.assertIsNotNone(self.attendance.approved_at)
    
    def test_therapist_cannot_approve_attendance(self):
        self.client.force_authenticate(user=self.therapist_user)
        response = self.client.put(
            reverse('attendance-approve', kwargs={'pk': self.attendance.id})
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_monthly_summary(self):
        # Approve the attendance
        self.attendance.approve(self.admin_user)
        
        # Create more attendances for testing
        yesterday = timezone.now().date() - timedelta(days=1)
        Attendance.objects.create(
            therapist=self.therapist,
            date=yesterday,
            status='half_day'
        )
        
        self.client.force_authenticate(user=self.therapist_user)
        today = timezone.now().date()
        response = self.client.get(
            reverse('attendance-monthly-summary') + 
            f'?year={today.year}&month={today.month}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertIn('present', data)
        self.assertIn('absent', data)
        self.assertIn('half_day', data)
        self.assertIn('approved_leaves', data)
        self.assertIn('holidays', data)
        self.assertIn('days', data)
        
        # Verify present count (only approved attendances count)
        self.assertEqual(data['present'], 1)
        
        # Verify days data
        self.assertEqual(len(data['days']), calendar.monthrange(today.year, today.month)[1])
