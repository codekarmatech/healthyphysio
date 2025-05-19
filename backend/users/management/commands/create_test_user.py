"""
Purpose: Create test users with timezone-aware date_joined fields
Usage: python manage.py create_test_user --role admin|therapist|patient|doctor
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import User, Therapist, Patient, Doctor
import random
from datetime import timedelta

class Command(BaseCommand):
    help = 'Create test users with timezone-aware date_joined fields'

    def add_arguments(self, parser):
        parser.add_argument('--role', type=str, default='admin', help='User role (admin, therapist, patient, doctor)')
        parser.add_argument('--count', type=int, default=1, help='Number of users to create')
        parser.add_argument('--approved', action='store_true', help='Set therapist as approved')

    def handle(self, *args, **options):
        role = options.get('role', 'admin')
        count = options.get('count', 1)
        approved = options.get('approved', False)
        
        # Validate role
        valid_roles = ['admin', 'therapist', 'patient', 'doctor']
        if role not in valid_roles:
            self.stdout.write(self.style.ERROR(f'Invalid role: {role}. Must be one of {valid_roles}'))
            return
        
        # Create users
        users_created = 0
        for i in range(count):
            # Generate a unique username
            username = f"{role}_{i+1}"
            
            # Check if user already exists
            if User.objects.filter(username=username).exists():
                self.stdout.write(self.style.WARNING(f'User {username} already exists, skipping'))
                continue
            
            # Create user with timezone-aware date_joined
            user = User.objects.create_user(
                username=username,
                email=f"{username}@example.com",
                password="password123",
                role=role,
                first_name=f"Test {role.capitalize()}",
                last_name=f"{i+1}"
            )
            
            # Set a timezone-aware date_joined (this is the key fix for the warning)
            user.date_joined = timezone.now() - timedelta(days=random.randint(1, 30))
            user.save()
            
            # Create profile based on role
            if role == 'therapist':
                therapist = Therapist.objects.create(
                    user=user,
                    specialization='Physical Therapy',
                    license_number=f'PT{random.randint(10000, 99999)}',
                    years_of_experience=random.randint(1, 15)
                )
                
                if approved:
                    therapist.is_approved = True
                    therapist.approval_date = timezone.now()
                    therapist.treatment_plans_approved = True
                    therapist.treatment_plans_approval_date = timezone.now()
                    therapist.reports_approved = True
                    therapist.reports_approval_date = timezone.now()
                    therapist.save()
                    
                self.stdout.write(self.style.SUCCESS(f'Created therapist: {user.username} (Approved: {approved})'))
                
            elif role == 'patient':
                Patient.objects.create(
                    user=user,
                    date_of_birth=timezone.now().date() - timedelta(days=365 * random.randint(20, 70)),
                    gender=random.choice(['Male', 'Female', 'Other']),
                    address='123 Test Street'
                )
                self.stdout.write(self.style.SUCCESS(f'Created patient: {user.username}'))
                
            elif role == 'doctor':
                Doctor.objects.create(
                    user=user,
                    license_number=f'DR{random.randint(10000, 99999)}',
                    specialization=random.choice(['Orthopedics', 'Neurology', 'Cardiology', 'General Practice']),
                    years_of_experience=random.randint(3, 20)
                )
                self.stdout.write(self.style.SUCCESS(f'Created doctor: {user.username}'))
                
            else:  # admin
                self.stdout.write(self.style.SUCCESS(f'Created admin: {user.username}'))
            
            users_created += 1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {users_created} {role} users'))
