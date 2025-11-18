"""
Management command to audit and fix user role assignments
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import User, Therapist, Patient, Doctor


class Command(BaseCommand):
    help = 'Audit user role assignments and fix any issues'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fix',
            action='store_true',
            help='Fix users without proper roles (default: just audit)',
        )
        parser.add_argument(
            '--default-role',
            type=str,
            default='patient',
            choices=['admin', 'therapist', 'patient', 'doctor'],
            help='Default role to assign to users without roles',
        )

    def handle(self, *args, **options):
        fix_issues = options['fix']
        default_role = options['default_role']
        
        self.stdout.write(self.style.SUCCESS('=== User Role Audit ==='))
        
        # Check for users without roles or with invalid roles
        users_without_roles = User.objects.filter(role__isnull=True)
        users_with_empty_roles = User.objects.filter(role='')
        users_with_invalid_roles = User.objects.exclude(
            role__in=[choice[0] for choice in User.Role.choices]
        )
        
        total_issues = (
            users_without_roles.count() + 
            users_with_empty_roles.count() + 
            users_with_invalid_roles.count()
        )
        
        if total_issues == 0:
            self.stdout.write(self.style.SUCCESS('✓ All users have valid roles assigned'))
            return
        
        self.stdout.write(self.style.WARNING(f'Found {total_issues} users with role issues:'))
        
        # Report issues
        if users_without_roles.exists():
            self.stdout.write(f'  - {users_without_roles.count()} users with NULL roles')
            for user in users_without_roles:
                self.stdout.write(f'    User {user.id}: {user.username} (role: NULL)')
        
        if users_with_empty_roles.exists():
            self.stdout.write(f'  - {users_with_empty_roles.count()} users with empty roles')
            for user in users_with_empty_roles:
                self.stdout.write(f'    User {user.id}: {user.username} (role: "")')
        
        if users_with_invalid_roles.exists():
            self.stdout.write(f'  - {users_with_invalid_roles.count()} users with invalid roles')
            for user in users_with_invalid_roles:
                self.stdout.write(f'    User {user.id}: {user.username} (role: "{user.role}")')
        
        # Check for role-profile mismatches
        self.stdout.write('\n=== Role-Profile Consistency Check ===')
        
        # Check therapists
        therapist_users = User.objects.filter(role='therapist')
        therapists_without_profile = []
        for user in therapist_users:
            try:
                user.therapist_profile
            except Therapist.DoesNotExist:
                therapists_without_profile.append(user)
        
        # Check patients
        patient_users = User.objects.filter(role='patient')
        patients_without_profile = []
        for user in patient_users:
            try:
                user.patient_profile
            except Patient.DoesNotExist:
                patients_without_profile.append(user)
        
        # Check doctors
        doctor_users = User.objects.filter(role='doctor')
        doctors_without_profile = []
        for user in doctor_users:
            try:
                user.doctor_profile
            except Doctor.DoesNotExist:
                doctors_without_profile.append(user)
        
        # Report profile mismatches
        if therapists_without_profile:
            self.stdout.write(f'⚠ {len(therapists_without_profile)} therapist users without therapist profiles')
        if patients_without_profile:
            self.stdout.write(f'⚠ {len(patients_without_profile)} patient users without patient profiles')
        if doctors_without_profile:
            self.stdout.write(f'⚠ {len(doctors_without_profile)} doctor users without doctor profiles')
        
        # Fix issues if requested
        if fix_issues:
            self.stdout.write(f'\n=== Fixing Issues (default role: {default_role}) ===')
            
            with transaction.atomic():
                fixed_count = 0
                
                # Fix users without roles
                for user in users_without_roles:
                    user.role = default_role
                    user.save()
                    self.stdout.write(f'✓ Fixed User {user.id}: {user.username} -> role: {default_role}')
                    fixed_count += 1
                
                # Fix users with empty roles
                for user in users_with_empty_roles:
                    user.role = default_role
                    user.save()
                    self.stdout.write(f'✓ Fixed User {user.id}: {user.username} -> role: {default_role}')
                    fixed_count += 1
                
                # Fix users with invalid roles
                for user in users_with_invalid_roles:
                    old_role = user.role
                    user.role = default_role
                    user.save()
                    self.stdout.write(f'✓ Fixed User {user.id}: {user.username} -> role: {old_role} -> {default_role}')
                    fixed_count += 1
                
                self.stdout.write(self.style.SUCCESS(f'\n✓ Fixed {fixed_count} users'))
        else:
            self.stdout.write(f'\nTo fix these issues, run: python manage.py audit_user_roles --fix')
            self.stdout.write(f'To use a different default role: python manage.py audit_user_roles --fix --default-role=therapist')
        
        # Final summary
        self.stdout.write(f'\n=== Summary ===')
        self.stdout.write(f'Total users: {User.objects.count()}')
        self.stdout.write(f'Admin users: {User.objects.filter(role="admin").count()}')
        self.stdout.write(f'Therapist users: {User.objects.filter(role="therapist").count()}')
        self.stdout.write(f'Patient users: {User.objects.filter(role="patient").count()}')
        self.stdout.write(f'Doctor users: {User.objects.filter(role="doctor").count()}')
