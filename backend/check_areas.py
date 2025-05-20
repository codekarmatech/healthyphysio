import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Import models
from areas.models import Area, PatientArea, TherapistServiceArea, DoctorArea
from users.models import Patient, Therapist, Doctor

# Check areas
areas = Area.objects.all()
print(f'Total areas: {areas.count()}')
for area in areas:
    print(f'Area ID: {area.id}, Name: {area.name}, City: {area.city}')

# Check patients
patients = Patient.objects.all()
print(f'\nTotal patients: {patients.count()}')
for patient in patients:
    print(f'Patient ID: {patient.id}, Username: {patient.user.username}, Area: {patient.area}')

# Check patient areas
patient_areas = PatientArea.objects.all()
print(f'\nTotal patient areas: {patient_areas.count()}')
for pa in patient_areas:
    print(f'Patient: {pa.patient.user.username}, Area: {pa.area.name}')

# Check therapists
therapists = Therapist.objects.all()
print(f'\nTotal therapists: {therapists.count()}')
for therapist in therapists:
    print(f'Therapist ID: {therapist.id}, Username: {therapist.user.username}')

# Check therapist service areas
therapist_areas = TherapistServiceArea.objects.all()
print(f'\nTotal therapist service areas: {therapist_areas.count()}')
for ta in therapist_areas:
    print(f'Therapist: {ta.therapist.user.username}, Area: {ta.area.name}, Priority: {ta.priority}')

# Check doctors
doctors = Doctor.objects.all()
print(f'\nTotal doctors: {doctors.count()}')
for doctor in doctors:
    print(f'Doctor ID: {doctor.id}, Username: {doctor.user.username}')

# Check doctor areas
doctor_areas = DoctorArea.objects.all()
print(f'\nTotal doctor areas: {doctor_areas.count()}')
for da in doctor_areas:
    print(f'Doctor: {da.doctor.user.username}, Area: {da.area.name}')
