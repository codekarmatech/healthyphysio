#!/usr/bin/env python3
"""
Django Management Command for Testing Treatment Cycles
Run with: python manage.py shell < test_cycles_management.py
"""

from datetime import datetime, timedelta, date
from users.models import User, Patient, Therapist
from scheduling.models import Appointment, Session
from treatment_plans.models import TreatmentPlan, DailyTreatment

def test_flexible_cycle_durations():
    """Test flexible cycle duration support"""
    print("🧪 Testing flexible cycle durations...")

    # Clean up any existing test data
    User.objects.filter(username__startswith='test_').delete()

    # Create test users
    admin_user = User.objects.create_user(
        username='test_admin',
        email='admin@test.com',
        password='testpass123',
        role='admin',
        first_name='Test',
        last_name='Admin'
    )

    therapist_user = User.objects.create_user(
        username='test_therapist',
        email='therapist@test.com',
        password='testpass123',
        role='therapist',
        first_name='Test',
        last_name='Therapist'
    )

    patient_user = User.objects.create_user(
        username='test_patient',
        email='patient@test.com',
        password='testpass123',
        role='patient',
        first_name='Test',
        last_name='Patient'
    )

    # Get an existing area
    from areas.models import Area
    test_area = Area.objects.first()

    # Create profiles with all required fields
    therapist_profile = Therapist.objects.create(
        user=therapist_user,
        license_number='TEST001',
        specialization='Physical Therapy'
    )

    patient_profile = Patient.objects.create(
        user=patient_user,
        date_of_birth=date(1990, 1, 1),
        gender='Male',
        age=34,
        address='Test Address 123',
        city='Ahmedabad',
        state='Gujarat',
        zip_code='380001',
        treatment_location='Home',
        disease='Back Pain',
        emergency_contact_name='Emergency Contact',
        emergency_contact_phone='1234567890',
        emergency_contact_relationship='Spouse',
        area=test_area
    )

    # Test different cycle durations
    test_durations = [7, 10, 14, 21, 30]

    for duration in test_durations:
        print(f"  Testing {duration}-day cycle...")

        # Create treatment plan
        start_date = date.today()
        end_date = start_date + timedelta(days=duration-1)

        treatment_plan = TreatmentPlan.objects.create(
            patient=patient_profile,
            created_by=admin_user,
            title=f'{duration}-Day Test Plan',
            description=f'Test plan for {duration} days',
            start_date=start_date,
            end_date=end_date,
            status='approved'
        )

        # Create daily treatments
        daily_treatments = []
        for day in range(1, duration + 1):
            dt = DailyTreatment.objects.create(
                treatment_plan=treatment_plan,
                day_number=day,
                title=f'Day {day} Treatment',
                description=f'Treatment for day {day}'
            )
            daily_treatments.append(dt)

        # Create appointments
        appointments = []
        for i, daily_treatment in enumerate(daily_treatments):
            appointment_date = start_date + timedelta(days=i)
            appointment = Appointment.objects.create(
                patient=patient_profile,
                therapist=therapist_profile,
                datetime=datetime.combine(appointment_date, datetime.min.time().replace(hour=10)),
                duration_minutes=60,
                status='pending',
                type='treatment',
                treatment_plan=treatment_plan,
                daily_treatment=daily_treatment,
                issue=f'Day {daily_treatment.day_number} treatment'
            )
            appointments.append(appointment)

        # Test cycle info calculation
        first_appointment = appointments[0]
        cycle_info = first_appointment.treatment_cycle_info

        print(f"    Cycle info: {cycle_info}")

        # Verify calculations
        assert cycle_info['total_days'] == duration, f"Expected {duration} days, got {cycle_info['total_days']}"
        assert cycle_info['cycle_duration_days'] == duration, f"Cycle duration mismatch"
        assert cycle_info['current_day'] == 1, "First appointment should be day 1"
        assert cycle_info['total_appointments'] == duration, f"Should have {duration} appointments"

        print(f"    ✅ {duration}-day cycle verified successfully")

    print("✅ Flexible cycle duration test PASSED")
    return True

def test_appointment_rescheduling():
    """Test appointment rescheduling impact on treatment cycles"""
    print("\n🧪 Testing appointment rescheduling...")

    # Get existing test data
    admin_user = User.objects.get(username='test_admin')
    therapist_profile = Therapist.objects.get(user__username='test_therapist')
    patient_profile = Patient.objects.get(user__username='test_patient')

    # Create a 5-day treatment plan for rescheduling test
    start_date = date.today() + timedelta(days=30)  # Future date
    end_date = start_date + timedelta(days=4)

    treatment_plan = TreatmentPlan.objects.create(
        patient=patient_profile,
        created_by=admin_user,
        title='5-Day Reschedule Test',
        description='Test plan for rescheduling',
        start_date=start_date,
        end_date=end_date,
        status='approved'
    )

    # Create daily treatments and appointments
    appointments = []
    for day in range(1, 6):
        daily_treatment = DailyTreatment.objects.create(
            treatment_plan=treatment_plan,
            day_number=day,
            title=f'Day {day} Treatment',
            description=f'Treatment for day {day}'
        )

        appointment_date = start_date + timedelta(days=day-1)
        appointment = Appointment.objects.create(
            patient=patient_profile,
            therapist=therapist_profile,
            datetime=datetime.combine(appointment_date, datetime.min.time().replace(hour=14)),
            duration_minutes=60,
            status='pending',
            type='treatment',
            treatment_plan=treatment_plan,
            daily_treatment=daily_treatment,
            issue=f'Day {day} treatment'
        )
        appointments.append(appointment)

    # Test original cycle info
    original_cycle_info = appointments[2].treatment_cycle_info  # Day 3 appointment
    print(f"  Original cycle info for day 3: {original_cycle_info}")

    # Reschedule the 3rd appointment to 2 days later
    third_appointment = appointments[2]
    original_datetime = third_appointment.datetime
    new_datetime = original_datetime + timedelta(days=2)

    print(f"  Rescheduling appointment from {original_datetime} to {new_datetime}")
    third_appointment.datetime = new_datetime
    third_appointment.save()

    # Verify cycle info after rescheduling
    updated_cycle_info = third_appointment.treatment_cycle_info
    print(f"  Updated cycle info for day 3: {updated_cycle_info}")

    # Verify integrity
    assert updated_cycle_info['current_day'] == 3, "Current day should still be 3"
    assert updated_cycle_info['total_days'] == 5, "Total days should remain 5"
    assert third_appointment.daily_treatment.day_number == 3, "Daily treatment link preserved"
    assert third_appointment.treatment_plan == treatment_plan, "Treatment plan link preserved"

    print("  ✅ Appointment rescheduling maintains treatment cycle integrity")
    print("✅ Appointment rescheduling test PASSED")
    return True

def test_progress_calculation():
    """Test treatment cycle progress calculation"""
    print("\n🧪 Testing progress calculation...")

    # Get existing test data
    therapist_profile = Therapist.objects.get(user__username='test_therapist')
    patient_profile = Patient.objects.get(user__username='test_patient')

    # Get a treatment plan with appointments
    treatment_plan = TreatmentPlan.objects.filter(patient=patient_profile).first()
    appointments = list(treatment_plan.appointments.all()[:3])  # Get first 3 appointments

    # Mark first 2 appointments as completed
    for i in range(2):
        appointments[i].status = 'completed'
        appointments[i].save()

    # Test progress calculation
    third_appointment = appointments[2]
    cycle_info = third_appointment.treatment_cycle_info

    print(f"  Cycle info with 2 completed appointments: {cycle_info}")

    # Verify progress calculation
    expected_progress = (2 / cycle_info['total_appointments']) * 100
    actual_progress = cycle_info['progress_percentage']

    print(f"  Expected progress: {expected_progress}%, Actual: {actual_progress}%")

    assert abs(actual_progress - expected_progress) < 0.1, "Progress calculation incorrect"
    assert cycle_info['completed_days'] == 2, "Should have 2 completed appointments"
    assert cycle_info['remaining_appointments'] == cycle_info['total_appointments'] - 2, "Remaining count incorrect"

    print("  ✅ Progress calculation verified")
    print("✅ Progress calculation test PASSED")
    return True

def run_all_tests():
    """Run all treatment cycle tests"""
    print("🚀 Starting Treatment Cycle Testing...")
    print("=" * 50)

    try:
        test_flexible_cycle_durations()
        test_appointment_rescheduling()
        test_progress_calculation()

        print("\n" + "=" * 50)
        print("🎉 ALL TESTS COMPLETED SUCCESSFULLY!")

    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

    return True

# Run the tests
if __name__ == "__main__":
    run_all_tests()
else:
    # When run via shell
    run_all_tests()
