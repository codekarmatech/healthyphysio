"""
Purpose: Create encrypted database backups
Connected Endpoints: Management command
Validation: Encryption verification
"""

import os
import subprocess
import tempfile
import boto3
from datetime import datetime
from django.core.management.base import BaseCommand
from django.conf import settings
from cryptography.fernet import Fernet
import base64

class Command(BaseCommand):
    help = 'Creates an encrypted database backup and uploads to S3'

    def add_arguments(self, parser):
        parser.add_argument(
            '--local-only',
            action='store_true',
            help='Store backup locally only, do not upload to S3'
        )

    def handle(self, *args, **options):
        local_only = options['local_only']
        
        # Create timestamp for filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Create backup directory if it doesn't exist
        backup_dir = os.path.join(settings.BASE_DIR, 'backups')
        os.makedirs(backup_dir, exist_ok=True)
        
        # Database connection settings from Django settings
        db_settings = settings.DATABASES['default']
        db_name = db_settings['NAME']
        db_user = db_settings['USER']
        db_password = db_settings['PASSWORD']
        db_host = db_settings['HOST']
        db_port = db_settings['PORT']
        
        # Create temporary file for the dump
        with tempfile.NamedTemporaryFile(suffix='.sql', delete=False) as temp_file:
            temp_path = temp_file.name
        
        # Create database dump
        self.stdout.write('Creating database dump...')
        
        if db_settings['ENGINE'] == 'django.db.backends.postgresql':
            # PostgreSQL dump
            env = os.environ.copy()
            if db_password:
                env['PGPASSWORD'] = db_password
            
            cmd = [
                'pg_dump',
                '--dbname', db_name,
                '--username', db_user,
                '--host', db_host or 'localhost',
                '--port', db_port or '5432',
                '--format', 'c',  # Custom format (compressed)
                '--file', temp_path
            ]
            
            try:
                subprocess.run(cmd, env=env, check=True)
                self.stdout.write(self.style.SUCCESS('Database dump created successfully'))
            except subprocess.CalledProcessError as e:
                self.stdout.write(self.style.ERROR(f'Error creating database dump: {e}'))
                os.unlink(temp_path)
                return
        
        elif db_settings['ENGINE'] == 'django.db.backends.sqlite3':
            # SQLite dump - just copy the file
            try:
                with open(db_name, 'rb') as src, open(temp_path, 'wb') as dst:
                    dst.write(src.read())
                self.stdout.write(self.style.SUCCESS('Database dump created successfully'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating database dump: {e}'))
                os.unlink(temp_path)
                return
        
        else:
            self.stdout.write(self.style.ERROR(f'Unsupported database engine: {db_settings["ENGINE"]}'))
            os.unlink(temp_path)
            return
        
        # Encrypt the dump
        self.stdout.write('Encrypting database dump...')
        try:
            # Initialize encryption
            key = settings.FIELD_ENCRYPTION_KEY.encode()
            fernet = Fernet(base64.urlsafe_b64encode(key))
            
            # Read the dump file
            with open(temp_path, 'rb') as f:
                data = f.read()
            
            # Encrypt the data
            encrypted_data = fernet.encrypt(data)
            
            # Create the encrypted backup file
            backup_filename = f'backup_{timestamp}.sql.enc'
            backup_path = os.path.join(backup_dir, backup_filename)
            
            with open(backup_path, 'wb') as f:
                f.write(encrypted_data)
            
            self.stdout.write(self.style.SUCCESS(f'Encrypted backup saved to {backup_path}'))
            
            # Upload to S3 if requested
            if not local_only and hasattr(settings, 'AWS_STORAGE_BUCKET_NAME'):
                self.stdout.write('Uploading to S3...')
                try:
                    s3_client = boto3.client(
                        's3',
                        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                        region_name=settings.AWS_S3_REGION_NAME
                    )
                    
                    s3_path = f'backups/{backup_filename}'
                    s3_client.upload_file(
                        backup_path,
                        settings.AWS_STORAGE_BUCKET_NAME,
                        s3_path
                    )
                    
                    self.stdout.write(self.style.SUCCESS(
                        f'Backup uploaded to S3: {settings.AWS_STORAGE_BUCKET_NAME}/{s3_path}'
                    ))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error uploading to S3: {e}'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error encrypting database dump: {e}'))
        
        # Clean up
        os.unlink(temp_path)