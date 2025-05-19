"""
Purpose: Management command to migrate area information from user profiles to Area model
Usage: python manage.py migrate_user_areas
"""

import logging
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from users.models import User, Therapist, Patient, Doctor
from areas.models import Area, TherapistServiceArea, PatientArea, DoctorArea, AreaRelationship

# Set up logging
logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Migrate area information from user profiles to Area model'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Perform a dry run without making changes to the database'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force migration even if areas already exist'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']

        # Check if areas already exist
        area_count = Area.objects.count()
        if area_count > 0 and not force:
            self.stdout.write(
                self.style.WARNING(f'There are already {area_count} areas in the database. Use --force to override.')
            )
            return

        # Start transaction
        with transaction.atomic():
            if dry_run:
                self.stdout.write(self.style.NOTICE('Performing dry run - no changes will be made'))

            # Process therapists
            self.process_therapists(dry_run)

            # Process patients
            self.process_patients(dry_run)

            # Process doctors
            self.process_doctors(dry_run)

            # Create relationships
            self.create_relationships(dry_run)

            if dry_run:
                # Rollback transaction in dry run mode
                transaction.set_rollback(True)
                self.stdout.write(self.style.SUCCESS('Dry run completed successfully'))
            else:
                self.stdout.write(self.style.SUCCESS('Area migration completed successfully'))

    def process_therapists(self, dry_run):
        """Process therapists and create areas and relationships"""
        therapists = Therapist.objects.all()
        self.stdout.write(f'Processing {therapists.count()} therapists')

        for therapist in therapists:
            # Extract area information from preferred_areas field
            if not therapist.preferred_areas:
                continue

            # Parse preferred areas (comma-separated list)
            area_names = [a.strip() for a in therapist.preferred_areas.split(',') if a.strip()]

            # Extract address information
            address_parts = self.parse_address(therapist.residential_address)

            for i, area_name in enumerate(area_names):
                # Create or get area
                area, created = self.get_or_create_area(
                    name=area_name,
                    city=address_parts.get('city', ''),
                    state=address_parts.get('state', ''),
                    zip_code=address_parts.get('zip_code', ''),
                    dry_run=dry_run
                )

                if not dry_run:
                    # Create therapist-area relationship
                    TherapistServiceArea.objects.get_or_create(
                        therapist=therapist,
                        area=area,
                        defaults={
                            'priority': i + 1  # Priority based on order (1-based)
                        }
                    )

                action = 'Would create' if dry_run else 'Created'
                status = 'new' if created else 'existing'
                self.stdout.write(f'{action} relationship between therapist {therapist.user.username} and {status} area {area.name}')

    def process_patients(self, dry_run):
        """Process patients and create areas and relationships"""
        patients = Patient.objects.all()
        self.stdout.write(f'Processing {patients.count()} patients')

        for patient in patients:
            # Skip if no address information
            if not patient.address and not patient.city:
                continue

            # Extract area name from address if possible
            area_name = 'Unknown'
            if patient.address:
                # Try to extract area name from address
                address_parts = patient.address.split(',')
                if len(address_parts) > 0 and address_parts[0].strip():
                    area_name = address_parts[0].strip()

            # If we couldn't extract a meaningful area name, use a default
            if area_name == 'Unknown' and patient.city:
                # Use a default area name based on the city
                area_name = f"Residential Area in {patient.city}"

            # Create or get area
            area, created = self.get_or_create_area(
                name=area_name,
                city=patient.city or '',
                state=patient.state or '',
                zip_code=patient.zip_code or '',
                description=f"Patient residential area: {patient.address}",
                dry_run=dry_run
            )

            if not dry_run:
                # Create patient-area relationship
                PatientArea.objects.get_or_create(
                    patient=patient,
                    area=area
                )

            action = 'Would create' if dry_run else 'Created'
            status = 'new' if created else 'existing'
            self.stdout.write(f'{action} relationship between patient {patient.user.username} and {status} area {area.name}')

    def process_doctors(self, dry_run):
        """Process doctors and create areas and relationships"""
        doctors = Doctor.objects.all()
        self.stdout.write(f'Processing {doctors.count()} doctors')

        for doctor in doctors:
            # Skip if no area information
            if not doctor.area:
                continue

            # Create or get area
            area, created = self.get_or_create_area(
                name=doctor.area,
                city='',  # We don't have this information
                state='',  # We don't have this information
                zip_code='',  # We don't have this information
                description=f"Doctor practice area: {doctor.hospital_affiliation}",
                dry_run=dry_run
            )

            if not dry_run:
                # Create doctor-area relationship
                DoctorArea.objects.get_or_create(
                    doctor=doctor,
                    area=area
                )

            action = 'Would create' if dry_run else 'Created'
            status = 'new' if created else 'existing'
            self.stdout.write(f'{action} relationship between doctor {doctor.user.username} and {status} area {area.name}')

    def create_relationships(self, dry_run):
        """Create relationships between users in the same area"""
        if dry_run:
            self.stdout.write('Would create relationships between users in the same areas')
            return

        # Get all areas with multiple user types
        areas = Area.objects.annotate(
            therapist_count=Count('therapists'),
            patient_count=Count('patients'),
            doctor_count=Count('doctors')
        ).filter(
            # At least two different user types
            (Q(therapist_count__gt=0) & Q(patient_count__gt=0)) |
            (Q(therapist_count__gt=0) & Q(doctor_count__gt=0)) |
            (Q(patient_count__gt=0) & Q(doctor_count__gt=0))
        )

        self.stdout.write(f'Creating relationships in {areas.count()} areas with multiple user types')

        for area in areas:
            # Create therapist-patient relationships
            if area.therapists.count() > 0 and area.patients.count() > 0:
                for therapist_area in area.therapists.all():
                    for patient_area in area.patients.all():
                        AreaRelationship.objects.get_or_create(
                            area=area,
                            relationship_type=AreaRelationship.RelationshipType.THERAPIST_PATIENT,
                            therapist=therapist_area.therapist,
                            patient=patient_area.patient
                        )

            # Create doctor-patient relationships
            if area.doctors.count() > 0 and area.patients.count() > 0:
                for doctor_area in area.doctors.all():
                    for patient_area in area.patients.all():
                        AreaRelationship.objects.get_or_create(
                            area=area,
                            relationship_type=AreaRelationship.RelationshipType.DOCTOR_PATIENT,
                            doctor=doctor_area.doctor,
                            patient=patient_area.patient
                        )

            # Create doctor-therapist relationships
            if area.doctors.count() > 0 and area.therapists.count() > 0:
                for doctor_area in area.doctors.all():
                    for therapist_area in area.therapists.all():
                        AreaRelationship.objects.get_or_create(
                            area=area,
                            relationship_type=AreaRelationship.RelationshipType.DOCTOR_THERAPIST,
                            doctor=doctor_area.doctor,
                            therapist=therapist_area.therapist
                        )

    def get_or_create_area(self, name, city='', state='', zip_code='', description='', dry_run=False):
        """Get or create an area with the given parameters"""
        if dry_run:
            # In dry run mode, just return a dummy area
            area = Area(
                name=name,
                city=city,
                state=state,
                zip_code=zip_code,
                description=description
            )
            # Simulate whether it would be created or not
            created = not Area.objects.filter(name=name, city=city, state=state).exists()
            return area, created

        # Create or get the area
        area, created = Area.objects.get_or_create(
            name=name,
            city=city,
            state=state,
            defaults={
                'zip_code': zip_code,
                'description': description
            }
        )

        return area, created

    def parse_address(self, address):
        """Parse address string into components"""
        if not address:
            return {}

        # Very basic parsing - in a real implementation, you might want to use
        # a more sophisticated address parsing library
        parts = {}

        # Try to extract city, state, zip from the last part of the address
        address_parts = address.split(',')

        if len(address_parts) >= 2:
            # Last part might contain state and zip
            last_part = address_parts[-1].strip()
            state_zip = last_part.split()

            if len(state_zip) >= 2:
                parts['state'] = state_zip[0]
                parts['zip_code'] = state_zip[-1]

            # Second to last part might be the city
            if len(address_parts) >= 2:
                parts['city'] = address_parts[-2].strip()

        return parts
