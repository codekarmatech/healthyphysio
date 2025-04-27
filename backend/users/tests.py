from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import User, Patient, Therapist, Doctor
from scheduling.models import Appointment
from django.utils import timezone
from datetime import timedelta

class DashboardSummaryTests(APITestCase):
    def setUp(self):
        # Create users with different roles
        self.admin_user = User.objects.create_user(
            username='admin', email='admin@example.com', 
            password='password123', role='admin'
        )
        
        self.patient_user = User.objects.create_user(
            username='patient', email='patient@example.com', 
            password='password123', role='patient'
        )
        self.patient = Patient.objects.create(user=self.patient_user)
        
        self.therapist_user = User.objects.create_user(
            username='therapist', email='therapist@example.com', 
            password='password123', role='therapist'
        )
        self.therapist = Therapist.objects.create(user=self.therapist_user)
        
        self.doctor_user = User.objects.create_user(
            username='doctor', email='doctor@example.com', 
            password='password123', role='doctor'
        )
        self.doctor = Doctor.objects.create(user=self.doctor_user)
        
        # Create some appointments
        now = timezone.now()
        
        # Future appointment
        self.future_appointment = Appointment.objects.create(
            patient=self.patient,
            therapist=self.therapist,
            datetime=now + timedelta(days=2),
            status='scheduled'
        )
        
        # Completed appointment
        self.completed_appointment = Appointment.objects.create(
            patient=self.patient,
            therapist=self.therapist,
            datetime=now - timedelta(days=2),
            status='completed'
        )
        
        # Missed appointment
        self.missed_appointment = Appointment.objects.create(
            patient=self.patient,
            therapist=self.therapist,
            datetime=now - timedelta(days=3),
            status='missed'
        )

    def test_patient_dashboard_summary(self):
        self.client.force_authenticate(user=self.patient_user)
        url = reverse('patient-dashboard-summary')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('upcoming_appointments', response.data)
        self.assertIn('recent_sessions', response.data)
        self.assertIn('stats', response.data)
        
        # Verify upcoming appointments
        self.assertEqual(len(response.data['upcoming_appointments']), 1)
        
        # Verify stats
        self.assertEqual(response.data['stats']['total_sessions'], 1)
        self.assertEqual(response.data['stats']['missed_appointments'], 1)
    
    def test_doctor_dashboard_summary(self):
        self.client.force_authenticate(user=self.doctor_user)
        url = reverse('doctor-dashboard-summary')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('stats', response.data)
        self.assertIn('recent_referrals', response.data)
    
    def test_admin_dashboard_summary(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('admin-dashboard-summary')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user_stats', response.data)
        self.assertIn('appointment_stats', response.data)
        
        # Verify user stats
        self.assertEqual(response.data['user_stats']['total_patients'], 1)
        self.assertEqual(response.data['user_stats']['total_therapists'], 1)
        self.assertEqual(response.data['user_stats']['total_doctors'], 1)
        
        # Verify appointment stats
        self.assertEqual(response.data['appointment_stats']['total_appointments'], 3)
        self.assertEqual(response.data['appointment_stats']['completed_appointments'], 1)
        self.assertEqual(response.data['appointment_stats']['missed_appointments'], 1)
    
    def test_permission_checks(self):
        # Patient trying to access admin dashboard
        self.client.force_authenticate(user=self.patient_user)
        url = reverse('admin-dashboard-summary')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Doctor trying to access patient dashboard
        self.client.force_authenticate(user=self.doctor_user)
        url = reverse('patient-dashboard-summary')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Unauthenticated user
        self.client.logout()
        url = reverse('patient-dashboard-summary')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)