"""
Management command for therapist ID management and best practices
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import User, Therapist
from earnings.models import EarningRecord
from scheduling.models import Appointment


class Command(BaseCommand):
    help = 'Manage therapist IDs and establish best practices'

    def add_arguments(self, parser):
        parser.add_argument(
            '--action',
            type=str,
            choices=['audit', 'soft-delete', 'restore', 'cleanup'],
            default='audit',
            help='Action to perform',
        )
        parser.add_argument(
            '--therapist-id',
            type=int,
            help='Therapist ID for soft-delete/restore operations',
        )
        parser.add_argument(
            '--cleanup-days',
            type=int,
            default=365,
            help='Days after which to permanently delete soft-deleted therapists',
        )

    def handle(self, *args, **options):
        action = options['action']
        therapist_id = options.get('therapist_id')
        cleanup_days = options['cleanup_days']
        
        if action == 'audit':
            self.audit_therapist_ids()
        elif action == 'soft-delete':
            if not therapist_id:
                self.stdout.write(self.style.ERROR('--therapist-id is required for soft-delete'))
                return
            self.soft_delete_therapist(therapist_id)
        elif action == 'restore':
            if not therapist_id:
                self.stdout.write(self.style.ERROR('--therapist-id is required for restore'))
                return
            self.restore_therapist(therapist_id)
        elif action == 'cleanup':
            self.cleanup_old_deletions(cleanup_days)

    def audit_therapist_ids(self):
        """Audit therapist ID usage and gaps"""
        self.stdout.write(self.style.SUCCESS('=== Therapist ID Management Audit ==='))
        
        # Get all therapists including deleted ones
        all_therapists = Therapist.objects.all_including_deleted().order_by('id')
        active_therapists = Therapist.objects.all().order_by('id')
        deleted_therapists = Therapist.objects.deleted_only().order_by('id')
        
        self.stdout.write(f'Total therapists (including deleted): {all_therapists.count()}')
        self.stdout.write(f'Active therapists: {active_therapists.count()}')
        self.stdout.write(f'Soft-deleted therapists: {deleted_therapists.count()}')
        
        # Check for ID gaps
        if all_therapists.exists():
            all_ids = list(all_therapists.values_list('id', flat=True))
            min_id, max_id = min(all_ids), max(all_ids)
            expected_ids = set(range(min_id, max_id + 1))
            actual_ids = set(all_ids)
            missing_ids = expected_ids - actual_ids
            
            if missing_ids:
                self.stdout.write(f'⚠ Missing IDs (gaps): {sorted(missing_ids)}')
            else:
                self.stdout.write('✓ No ID gaps found')
        
        # Show active therapists
        self.stdout.write('\n=== Active Therapists ===')
        for therapist in active_therapists:
            earnings_count = EarningRecord.objects.filter(therapist=therapist).count()
            appointments_count = Appointment.objects.filter(therapist=therapist).count()
            self.stdout.write(
                f'ID {therapist.id}: {therapist.user.username} '
                f'(Earnings: {earnings_count}, Appointments: {appointments_count})'
            )
        
        # Show deleted therapists
        if deleted_therapists.exists():
            self.stdout.write('\n=== Soft-Deleted Therapists ===')
            for therapist in deleted_therapists:
                earnings_count = EarningRecord.objects.filter(therapist=therapist).count()
                appointments_count = Appointment.objects.filter(therapist=therapist).count()
                self.stdout.write(
                    f'ID {therapist.id}: {therapist.user.username} '
                    f'(Deleted: {therapist.deleted_at}, '
                    f'Earnings: {earnings_count}, Appointments: {appointments_count})'
                )
        
        # ID reuse policy
        self.stdout.write('\n=== ID Management Policy ===')
        self.stdout.write('✓ Soft deletion preserves referential integrity')
        self.stdout.write('✓ IDs are never reused to maintain data consistency')
        self.stdout.write('✓ New therapists always get the next available ID')
        self.stdout.write('✓ Deleted therapists can be restored with original ID')

    def soft_delete_therapist(self, therapist_id):
        """Soft delete a therapist"""
        try:
            # Use all_including_deleted to find even already deleted therapists
            therapist = Therapist.objects.all_including_deleted().get(id=therapist_id)
            
            if therapist.is_deleted:
                self.stdout.write(self.style.WARNING(f'Therapist {therapist_id} is already soft-deleted'))
                return
            
            # Check for related data
            earnings_count = EarningRecord.objects.filter(therapist=therapist).count()
            appointments_count = Appointment.objects.filter(therapist=therapist).count()
            
            self.stdout.write(f'Therapist {therapist_id} ({therapist.user.username}) has:')
            self.stdout.write(f'  - {earnings_count} earning records')
            self.stdout.write(f'  - {appointments_count} appointments')
            
            confirm = input('Are you sure you want to soft-delete this therapist? (yes/no): ')
            if confirm.lower() != 'yes':
                self.stdout.write('Operation cancelled')
                return
            
            with transaction.atomic():
                therapist.soft_delete()
                # Optionally deactivate the user account
                therapist.user.is_active = False
                therapist.user.save()
                
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Soft-deleted therapist {therapist_id}')
                )
                self.stdout.write('  - Therapist marked as deleted')
                self.stdout.write('  - User account deactivated')
                self.stdout.write('  - All related data preserved')
                
        except Therapist.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Therapist {therapist_id} not found'))

    def restore_therapist(self, therapist_id):
        """Restore a soft-deleted therapist"""
        try:
            therapist = Therapist.objects.deleted_only().get(id=therapist_id)
            
            with transaction.atomic():
                therapist.restore()
                # Reactivate the user account
                therapist.user.is_active = True
                therapist.user.save()
                
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Restored therapist {therapist_id}')
                )
                self.stdout.write('  - Therapist marked as active')
                self.stdout.write('  - User account reactivated')
                self.stdout.write('  - All related data preserved')
                
        except Therapist.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Soft-deleted therapist {therapist_id} not found'))

    def cleanup_old_deletions(self, days):
        """Clean up old soft-deleted therapists"""
        from django.utils import timezone
        from datetime import timedelta
        
        cutoff_date = timezone.now() - timedelta(days=days)
        old_deletions = Therapist.objects.deleted_only().filter(
            deleted_at__lt=cutoff_date
        )
        
        if not old_deletions.exists():
            self.stdout.write(f'No soft-deleted therapists older than {days} days found')
            return
        
        self.stdout.write(f'Found {old_deletions.count()} therapists deleted more than {days} days ago:')
        
        for therapist in old_deletions:
            earnings_count = EarningRecord.objects.filter(therapist=therapist).count()
            appointments_count = Appointment.objects.filter(therapist=therapist).count()
            self.stdout.write(
                f'  ID {therapist.id}: {therapist.user.username} '
                f'(Deleted: {therapist.deleted_at}, '
                f'Earnings: {earnings_count}, Appointments: {appointments_count})'
            )
        
        self.stdout.write(self.style.WARNING(
            'WARNING: Permanent deletion will remove all related data!'
        ))
        confirm = input('Permanently delete these therapists? (yes/no): ')
        
        if confirm.lower() == 'yes':
            with transaction.atomic():
                for therapist in old_deletions:
                    # Delete related data first
                    EarningRecord.objects.filter(therapist=therapist).delete()
                    Appointment.objects.filter(therapist=therapist).delete()
                    
                    # Delete the therapist and user
                    user = therapist.user
                    therapist.delete()
                    user.delete()
                
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Permanently deleted {old_deletions.count()} therapists')
                )
        else:
            self.stdout.write('Operation cancelled')
