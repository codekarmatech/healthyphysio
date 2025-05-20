import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Import models
from areas.models import Area, PatientArea, TherapistServiceArea, DoctorArea
from users.models import Patient, Therapist, Doctor

# Delete all existing area relationships first
print("Deleting existing area relationships...")
PatientArea.objects.all().delete()
TherapistServiceArea.objects.all().delete()
DoctorArea.objects.all().delete()

# Delete all existing areas
print("Deleting existing areas...")
Area.objects.all().delete()

# Create new areas for Ahmedabad - matching the frontend's 81 areas
print("Creating new areas...")
areas_data = [
    {'id': 1, 'name': 'Ambawadi', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380015'},
    {'id': 2, 'name': 'Asarwa', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380016'},
    {'id': 3, 'name': 'Ashram Road', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380009'},
    {'id': 4, 'name': 'Aslali', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382427'},
    {'id': 5, 'name': 'Astodia', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380001'},
    {'id': 6, 'name': 'Bapunagar', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380024'},
    {'id': 7, 'name': 'Behrampura', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380022'},
    {'id': 8, 'name': 'Bodakdev', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380054'},
    {'id': 9, 'name': 'Bopal', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380058'},
    {'id': 10, 'name': 'C G Road', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380009'},
    {'id': 11, 'name': 'Calico Mills', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380022'},
    {'id': 12, 'name': 'Chandkheda', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382424'},
    {'id': 13, 'name': 'Chandlodiya', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382481'},
    {'id': 14, 'name': 'Dariapur', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380001'},
    {'id': 15, 'name': 'Drive In Road', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380052'},
    {'id': 16, 'name': 'Ellis Bridge', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380006'},
    {'id': 17, 'name': 'Gandhi Nagar', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382010'},
    {'id': 18, 'name': 'Ghatlodia', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380061'},
    {'id': 19, 'name': 'Ghodasar', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380050'},
    {'id': 20, 'name': 'Girdhar Nagar', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380004'},
    {'id': 21, 'name': 'Gota', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382481'},
    {'id': 22, 'name': 'Gulbai Tekra', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380006'},
    {'id': 23, 'name': 'Gurukul', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380052'},
    {'id': 24, 'name': 'Hathijan', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382445'},
    {'id': 25, 'name': 'Isanpur', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382443'},
    {'id': 26, 'name': 'Jagatpur', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382470'},
    {'id': 27, 'name': 'Janta Nagar', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380013'},
    {'id': 28, 'name': 'Jashodanagar', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382445'},
    {'id': 29, 'name': 'Jivraj Park', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380051'},
    {'id': 30, 'name': 'Jodhpur', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380015'},
    {'id': 31, 'name': 'Judges Bungalow Road', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380054'},
    {'id': 32, 'name': 'Kali', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380001'},
    {'id': 33, 'name': 'Kalupur', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380001'},
    {'id': 34, 'name': 'Kankaria', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380022'},
    {'id': 35, 'name': 'Khadia', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380001'},
    {'id': 36, 'name': 'Khanpur', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380001'},
    {'id': 37, 'name': 'Kochrab', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380006'},
    {'id': 38, 'name': 'Kotarpur', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380026'},
    {'id': 39, 'name': 'Krishnanagar', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382345'},
    {'id': 40, 'name': 'Lambha', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382405'},
    {'id': 41, 'name': 'Law Garden', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380006'},
    {'id': 42, 'name': 'Madhupura', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380004'},
    {'id': 43, 'name': 'Mahalaxmi', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380007'},
    {'id': 44, 'name': 'Manek Chowk', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380001'},
    {'id': 45, 'name': 'Maninagar', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380008'},
    {'id': 46, 'name': 'Maninagar East', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380008'},
    {'id': 47, 'name': 'Memnagar', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380052'},
    {'id': 48, 'name': 'Mithakali', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380006'},
    {'id': 49, 'name': 'Motera', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380005'},
    {'id': 50, 'name': 'Nagoda', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382110'},
    {'id': 51, 'name': 'Naroda', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382330'},
    {'id': 52, 'name': 'Nava Vadaj', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380013'},
    {'id': 53, 'name': 'Navarangpura', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380009'},
    {'id': 54, 'name': 'Nikol', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382350'},
    {'id': 55, 'name': 'Odhav', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382415'},
    {'id': 56, 'name': 'Paldi', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380007'},
    {'id': 57, 'name': 'Polarpur', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380060'},
    {'id': 58, 'name': 'Rajpur Gomtipur', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380021'},
    {'id': 59, 'name': 'Ramol', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382449'},
    {'id': 60, 'name': 'Ramol Hathijan', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382449'},
    {'id': 61, 'name': 'Ranip', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382480'},
    {'id': 62, 'name': 'Sabarmati', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380005'},
    {'id': 63, 'name': 'Saraspur', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380018'},
    {'id': 64, 'name': 'Sardarnagar', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382475'},
    {'id': 65, 'name': 'Saijpur Bogha', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382345'},
    {'id': 66, 'name': 'Sarkhej', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380055'},
    {'id': 67, 'name': 'Shahibaug', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380004'},
    {'id': 68, 'name': 'Shahpur', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380001'},
    {'id': 69, 'name': 'Shardanagar', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380007'},
    {'id': 70, 'name': 'Shastri Nagar', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380013'},
    {'id': 71, 'name': 'Subhash Bridge', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380027'},
    {'id': 72, 'name': 'Sukhrampura', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380001'},
    {'id': 73, 'name': 'Thakkar Bapanagar', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380026'},
    {'id': 74, 'name': 'Thaltej', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380059'},
    {'id': 75, 'name': 'Usmanpura', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380013'},
    {'id': 76, 'name': 'Vastral', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382418'},
    {'id': 77, 'name': 'Vastrapur', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380015'},
    {'id': 78, 'name': 'Vatva', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382440'},
    {'id': 79, 'name': 'Vejalpur', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '380051'},
    {'id': 80, 'name': 'Viratnagar', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382481'},
    {'id': 81, 'name': 'Virat Nagar', 'city': 'Ahmedabad', 'state': 'Gujarat', 'zip_code': '382481'},
]

# Create areas
for area_data in areas_data:
    Area.objects.create(**area_data)

# Verify areas were created
areas = Area.objects.all()
print(f"Created {areas.count()} areas:")
for area in areas:
    print(f"Area ID: {area.id}, Name: {area.name}, City: {area.city}")

# Update existing therapists with new areas
therapists = Therapist.objects.all()
if therapists.exists():
    print("\nUpdating therapist areas...")
    for therapist in therapists:
        # Get 3 areas for the therapist (or fewer if less than 3 areas exist)
        areas_to_assign = min(3, areas.count())
        for i in range(areas_to_assign):
            area = areas[i]
            TherapistServiceArea.objects.create(
                therapist=therapist,
                area=area,
                priority=i+1
            )
            print(f"Assigned area {area.name} to therapist {therapist.user.username} with priority {i+1}")

# Update existing patients with new areas
patients = Patient.objects.all()
if patients.exists():
    print("\nUpdating patient areas...")
    for patient in patients:
        # Assign the first area to each patient
        area = areas.first()
        patient.area = area
        patient.save()

        # Create PatientArea relationship
        PatientArea.objects.create(patient=patient, area=area)
        print(f"Assigned area {area.name} to patient {patient.user.username}")

print("\nArea reset complete!")
