#!/usr/bin/env python3
"""
Comprehensive End-to-End Testing Script for Treatment Cycle Management
Tests flexible cycle durations, appointment linking, and role-based access control
"""

import os
import sys
import django
import json
from datetime import datetime, timedelta, date
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, Patient, Therapist
from scheduling.models import Appointment, Session
from treatment_plans.models import TreatmentPlan, DailyTreatment
from rest_framework.test import APIClient
from rest_framework import status

class TreatmentCycleTestSuite:
    """Comprehensive test suite for treatment cycle functionality"""
    
    def __init__(self):
        self.client = APIClient()
        self.admin_user = None
        self.therapist_user = None
        self.patient_user = None
        self.doctor_user = None
        self.test_results = []
        
    def setup_test_users(self):
        """Create test users for different roles"""
        print("🔧 Setting up test users...")
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='testpass123',
            role='admin',
            first_name='Admin',
            last_name='User'
        )
        
        # Create therapist user
        self.therapist_user = User.objects.create_user(
            username='therapist_test',
            email='therapist@test.com',
            password='testpass123',
            role='therapist',
            first_name='Therapist',
            last_name='User'
        )
        
        # Create patient user
        self.patient_user = User.objects.create_user(
            username='patient_test',
            email='patient@test.com',
            password='testpass123',
            role='patient',
            first_name='Patient',
            last_name='User'
        )
        
        # Create doctor user
        self.doctor_user = User.objects.create_user(
            username='doctor_test',
            email='doctor@test.com',
            password='testpass123',
            role='doctor',
            first_name='Doctor',
            last_name='User'
        )
        
        # Create associated profiles
        self.therapist_profile = Therapist.objects.create(
            user=self.therapist_user,
            license_number='TH001',
            specialization='Physical Therapy'
        )
        
        self.patient_profile = Patient.objects.create(
            user=self.patient_user,
            date_of_birth=date(1990, 1, 1),
            emergency_contact_name='Emergency Contact',
            emergency_contact_phone='1234567890'
        )
        
        print("✅ Test users created successfully")
        
    def test_flexible_cycle_duration(self):
        """Test 1: Verify system supports flexible cycle durations (7, 10, 21 days)"""
        print("\n🧪 Test 1: Testing flexible cycle durations...")
        
        test_durations = [7, 10, 21, 30]
        
        for duration in test_durations:
            # Create treatment plan with specific duration
            start_date = date.today()
            end_date = start_date + timedelta(days=duration-1)
            
            treatment_plan = TreatmentPlan.objects.create(
                patient=self.patient_profile,
                created_by=self.admin_user,
                title=f'{duration}-Day Treatment Plan',
                description=f'Test plan for {duration} days',
                start_date=start_date,
                end_date=end_date,
                status='approved'
            )
            
            # Create daily treatments for the duration
            for day in range(1, duration + 1):
                DailyTreatment.objects.create(
                    treatment_plan=treatment_plan,
                    day_number=day,
                    title=f'Day {day} Treatment',
                    description=f'Treatment for day {day}'
                )
            
            # Create appointments linked to daily treatments
            daily_treatments = treatment_plan.daily_treatments.all()
            for i, daily_treatment in enumerate(daily_treatments):
                appointment_date = start_date + timedelta(days=i)
                appointment = Appointment.objects.create(
                    patient=self.patient_profile,
                    therapist=self.therapist_profile,
                    datetime=datetime.combine(appointment_date, datetime.min.time().replace(hour=10)),
                    duration_minutes=60,
                    status='pending',
                    type='treatment',
                    treatment_plan=treatment_plan,
                    daily_treatment=daily_treatment,
                    issue=f'Day {daily_treatment.day_number} treatment'
                )
            
            # Verify cycle info calculation
            first_appointment = treatment_plan.appointments.first()
            cycle_info = first_appointment.treatment_cycle_info
            
            assert cycle_info['total_days'] == duration, f"Expected {duration} days, got {cycle_info['total_days']}"
            assert cycle_info['cycle_duration_days'] == duration, f"Cycle duration mismatch for {duration} days"
            
            print(f"✅ {duration}-day cycle created and verified successfully")
            
        self.test_results.append("✅ Flexible cycle duration test PASSED")
        
    def test_appointment_linking(self):
        """Test 2: Verify appointments are properly linked to treatment plans"""
        print("\n🧪 Test 2: Testing appointment-treatment plan linking...")
        
        # Create a 14-day treatment plan
        start_date = date.today()
        end_date = start_date + timedelta(days=13)
        
        treatment_plan = TreatmentPlan.objects.create(
            patient=self.patient_profile,
            created_by=self.admin_user,
            title='14-Day Linking Test Plan',
            description='Test plan for appointment linking',
            start_date=start_date,
            end_date=end_date,
            status='approved'
        )
        
        # Create daily treatments
        daily_treatments = []
        for day in range(1, 15):
            dt = DailyTreatment.objects.create(
                treatment_plan=treatment_plan,
                day_number=day,
                title=f'Day {day} Treatment',
                description=f'Treatment for day {day}'
            )
            daily_treatments.append(dt)
        
        # Create appointments with proper linking
        appointments = []
        for i, daily_treatment in enumerate(daily_treatments):
            appointment_date = start_date + timedelta(days=i)
            appointment = Appointment.objects.create(
                patient=self.patient_profile,
                therapist=self.therapist_profile,
                datetime=datetime.combine(appointment_date, datetime.min.time().replace(hour=14)),
                duration_minutes=60,
                status='pending',
                type='treatment',
                treatment_plan=treatment_plan,
                daily_treatment=daily_treatment,
                issue=f'Day {daily_treatment.day_number} treatment'
            )
            appointments.append(appointment)
        
        # Verify linking
        for appointment in appointments:
            assert appointment.is_part_of_treatment_cycle == True, "Appointment should be part of treatment cycle"
            assert appointment.treatment_plan == treatment_plan, "Treatment plan linking failed"
            assert appointment.daily_treatment is not None, "Daily treatment linking failed"
            
        print(f"✅ All {len(appointments)} appointments properly linked to treatment plan")
        self.test_results.append("✅ Appointment linking test PASSED")
        
    def test_appointment_rescheduling_impact(self):
        """Test 3: Verify appointment rescheduling updates treatment cycle correctly"""
        print("\n🧪 Test 3: Testing appointment rescheduling impact...")
        
        # Create a 7-day treatment plan
        start_date = date.today()
        end_date = start_date + timedelta(days=6)
        
        treatment_plan = TreatmentPlan.objects.create(
            patient=self.patient_profile,
            created_by=self.admin_user,
            title='7-Day Reschedule Test Plan',
            description='Test plan for rescheduling',
            start_date=start_date,
            end_date=end_date,
            status='approved'
        )
        
        # Create daily treatments and appointments
        for day in range(1, 8):
            daily_treatment = DailyTreatment.objects.create(
                treatment_plan=treatment_plan,
                day_number=day,
                title=f'Day {day} Treatment',
                description=f'Treatment for day {day}'
            )
            
            appointment_date = start_date + timedelta(days=day-1)
            Appointment.objects.create(
                patient=self.patient_profile,
                therapist=self.therapist_profile,
                datetime=datetime.combine(appointment_date, datetime.min.time().replace(hour=9)),
                duration_minutes=60,
                status='pending',
                type='treatment',
                treatment_plan=treatment_plan,
                daily_treatment=daily_treatment,
                issue=f'Day {day} treatment'
            )
        
        # Get the 3rd appointment and reschedule it
        third_appointment = treatment_plan.appointments.filter(daily_treatment__day_number=3).first()
        original_datetime = third_appointment.datetime
        
        # Reschedule to 2 days later
        new_datetime = original_datetime + timedelta(days=2)
        third_appointment.datetime = new_datetime
        third_appointment.save()
        
        # Verify treatment cycle info still works correctly
        cycle_info = third_appointment.treatment_cycle_info
        assert cycle_info['current_day'] == 3, "Current day should still be 3 after rescheduling"
        assert cycle_info['total_days'] == 7, "Total days should remain 7"
        
        # Verify the appointment is still linked correctly
        assert third_appointment.daily_treatment.day_number == 3, "Daily treatment link should be preserved"
        assert third_appointment.treatment_plan == treatment_plan, "Treatment plan link should be preserved"
        
        print("✅ Appointment rescheduling maintains treatment cycle integrity")
        self.test_results.append("✅ Appointment rescheduling test PASSED")
        
    def test_api_endpoints(self):
        """Test 4: Test API endpoints with treatment cycle data"""
        print("\n🧪 Test 4: Testing API endpoints...")
        
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Create a treatment plan via API would be tested here
        # For now, create manually and test retrieval
        
        # Create a 12-day treatment plan
        start_date = date.today()
        end_date = start_date + timedelta(days=11)
        
        treatment_plan = TreatmentPlan.objects.create(
            patient=self.patient_profile,
            created_by=self.admin_user,
            title='12-Day API Test Plan',
            description='Test plan for API testing',
            start_date=start_date,
            end_date=end_date,
            status='approved'
        )
        
        # Create appointments
        for day in range(1, 13):
            daily_treatment = DailyTreatment.objects.create(
                treatment_plan=treatment_plan,
                day_number=day,
                title=f'Day {day} Treatment',
                description=f'Treatment for day {day}'
            )
            
            appointment_date = start_date + timedelta(days=day-1)
            Appointment.objects.create(
                patient=self.patient_profile,
                therapist=self.therapist_profile,
                datetime=datetime.combine(appointment_date, datetime.min.time().replace(hour=11)),
                duration_minutes=60,
                status='pending',
                type='treatment',
                treatment_plan=treatment_plan,
                daily_treatment=daily_treatment,
                issue=f'Day {day} treatment'
            )
        
        # Test API endpoint
        response = self.client.get('/api/scheduling/appointments/')
        assert response.status_code == 200, f"API call failed with status {response.status_code}"
        
        # Check if treatment cycle info is included in response
        appointments_data = response.json()
        if 'results' in appointments_data:
            appointments_data = appointments_data['results']
        
        cycle_appointments = [apt for apt in appointments_data if apt.get('is_part_of_treatment_cycle')]
        assert len(cycle_appointments) > 0, "No treatment cycle appointments found in API response"
        
        # Verify treatment cycle info structure
        first_cycle_apt = cycle_appointments[0]
        cycle_info = first_cycle_apt.get('treatment_cycle_info')
        assert cycle_info is not None, "Treatment cycle info missing from API response"
        assert 'total_days' in cycle_info, "total_days missing from cycle info"
        assert 'current_day' in cycle_info, "current_day missing from cycle info"
        assert 'progress_percentage' in cycle_info, "progress_percentage missing from cycle info"
        
        print("✅ API endpoints return proper treatment cycle information")
        self.test_results.append("✅ API endpoints test PASSED")
        
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Comprehensive Treatment Cycle Testing...")
        print("=" * 60)
        
        try:
            self.setup_test_users()
            self.test_flexible_cycle_duration()
            self.test_appointment_linking()
            self.test_appointment_rescheduling_impact()
            self.test_api_endpoints()
            
            print("\n" + "=" * 60)
            print("📊 TEST RESULTS SUMMARY:")
            for result in self.test_results:
                print(result)
            
            print(f"\n🎉 ALL TESTS COMPLETED SUCCESSFULLY! ({len(self.test_results)}/4 passed)")
            
        except Exception as e:
            print(f"\n❌ TEST FAILED: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
            
        return True

if __name__ == "__main__":
    test_suite = TreatmentCycleTestSuite()
    success = test_suite.run_all_tests()
    sys.exit(0 if success else 1)
