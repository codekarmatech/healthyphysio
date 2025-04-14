"""
Purpose: Purge audit logs older than retention period
Connected Endpoints: Management command
Validation: HIPAA-compliant data retention
"""

import os
import json
import hashlib
import tempfile
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings
from django.core.files import File
from audit_logs.models import AuditLog, AuditLogArchive

class Command(BaseCommand):
    help = 'Archives and purges audit logs older than the retention period'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=2555,  # Default to 7 years (HIPAA requirement)
            help='Number of days to keep audit logs'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Perform a dry run without actually purging logs'
        )

    def handle(self, *args, **options):
        retention_days = options['days']
        dry_run = options['dry_run']
        
        # Calculate cutoff date
        cutoff_date = timezone.now() - timedelta(days=retention_days)
        
        # Get logs to be purged
        logs_to_purge = AuditLog.objects.filter(timestamp__lt=cutoff_date)
        log_count = logs_to_purge.count()
        
        if log_count == 0:
            self.stdout.write(self.style.SUCCESS('No logs to purge'))
            return
        
        self.stdout.write(f'Found {log_count} logs older than {cutoff_date.date()} to purge')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No logs will be purged'))
            return
        
        # Create a temporary file to store the logs
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as temp_file:
            # Get the date range
            oldest_log = logs_to_purge.order_by('timestamp').first()
            newest_log = logs_to_purge.order_by('-timestamp').first()
            
            start_date = oldest_log.timestamp.date()
            end_date = newest_log.timestamp.date()
            
            # Serialize logs to JSON
            logs_data = []
            for log in logs_to_purge.iterator():
                log_data = {
                    'id': log.id,
                    'user_id': log.user_id,
                    'action': log.action,
                    'model_name': log.model_name,
                    'object_id': log.object_id,
                    'object_repr': log.object_repr,
                    'previous_state': log.previous_state,
                    'new_state': log.new_state,
                    'ip_address': log.ip_address,
                    'user_agent': log.user_agent,
                    'timestamp': log.timestamp.isoformat(),
                    'integrity_hash': log.integrity_hash
                }
                logs_data.append(log_data)
            
            # Write to file
            json.dump(logs_data, temp_file, indent=2)
            temp_file_path = temp_file.name
        
        # Calculate hash of the archive file
        with open(temp_file_path, 'rb') as f:
            archive_hash = hashlib.sha256(f.read()).hexdigest()
        
        # Create archive record
        archive = AuditLogArchive(
            start_date=start_date,
            end_date=end_date,
            log_count=log_count,
            integrity_hash=archive_hash
        )
        
        # Save the archive file
        with open(temp_file_path, 'rb') as f:
            archive_filename = f'audit_logs_{start_date}_{end_date}.json'
            archive.archive_file.save(archive_filename, File(f))
        
        # Delete the temporary file
        os.unlink(temp_file_path)
        
        # Delete the purged logs
        logs_to_purge.delete()
        
        self.stdout.write(self.style.SUCCESS(
            f'Successfully archived and purged {log_count} logs from {start_date} to {end_date}'
        ))