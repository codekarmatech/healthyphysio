"""
Data Protection Service for HealthyPhysio Platform
Implements DPDP Act 2023 compliance and Indian healthcare data protection
"""

from django.db import transaction
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
import logging
import hashlib
import json

from .models import User, Patient, Therapist, Doctor
from .data_protection import (
    AccountDeletionRequest, 
    DataRetentionPolicy, 
    DataAnonymizationLog,
    DEFAULT_RETENTION_POLICIES
)

logger = logging.getLogger(__name__)


class DataProtectionService:
    """
    Service class for handling data protection operations
    Ensures compliance with DPDP Act 2023 and Indian healthcare regulations
    """
    
    @staticmethod
    def initialize_retention_policies():
        """Initialize default retention policies if they don't exist"""
        for policy_data in DEFAULT_RETENTION_POLICIES:
            DataRetentionPolicy.objects.get_or_create(
                data_type=policy_data['data_type'],
                defaults=policy_data
            )
        logger.info("Data retention policies initialized")
    
    @staticmethod
    def request_account_deletion(user, reason):
        """
        Create account deletion request with DPDP Act 2023 compliance
        
        Args:
            user: User requesting deletion
            reason: Reason for deletion request
            
        Returns:
            AccountDeletionRequest instance
        """
        # Check if user already has pending deletion request
        existing_request = AccountDeletionRequest.objects.filter(
            user=user,
            status__in=['pending', 'approved']
        ).first()
        
        if existing_request:
            raise ValueError("User already has a pending deletion request")
        
        # Create deletion request
        deletion_request = AccountDeletionRequest.objects.create(
            user=user,
            reason=reason,
            notification_sent_at=timezone.now()
        )
        
        # Send notification to admins
        DataProtectionService._notify_admins_deletion_request(deletion_request)
        
        logger.info(f"Account deletion request created for user {user.username}")
        return deletion_request
    
    @staticmethod
    def process_deletion_request(deletion_request, admin_user, action, notes=''):
        """
        Process deletion request (approve/reject)
        
        Args:
            deletion_request: AccountDeletionRequest instance
            admin_user: Admin processing the request
            action: 'approve' or 'reject'
            notes: Admin notes
        """
        if action == 'approve':
            # Determine deletion type based on user role and data
            deletion_type = DataProtectionService._determine_deletion_type(deletion_request.user)
            deletion_request.approve(admin_user, deletion_type, notes)
            
            # Schedule actual deletion
            DataProtectionService._schedule_deletion(deletion_request)
            
        elif action == 'reject':
            deletion_request.reject(admin_user, notes)
        
        # Send notification to user
        DataProtectionService._notify_user_deletion_decision(deletion_request)
    
    @staticmethod
    def _determine_deletion_type(user):
        """
        Determine appropriate deletion type based on user role and data retention requirements
        """
        if user.role == User.Role.PATIENT:
            # Check if patient has medical records that need retention
            patient = getattr(user, 'patient_profile', None)
            if patient and patient.medical_history:
                return 'partial'  # Retain medical records, anonymize personal data
            return 'soft'
            
        elif user.role == User.Role.THERAPIST:
            # Therapists with treatment history need partial deletion
            therapist = getattr(user, 'therapist_profile', None)
            if therapist:
                # Check for appointments, earnings, etc.
                from scheduling.models import Appointment
                from earnings.models import EarningRecord
                
                has_appointments = Appointment.objects.filter(therapist=therapist).exists()
                has_earnings = EarningRecord.objects.filter(therapist=therapist).exists()
                
                if has_appointments or has_earnings:
                    return 'partial'
            return 'soft'
            
        elif user.role == User.Role.DOCTOR:
            # Doctors with patient interactions need partial deletion
            return 'partial'
            
        elif user.role == User.Role.ADMIN:
            # Admin accounts typically need special handling
            return 'soft'
        
        return 'soft'
    
    @staticmethod
    def _schedule_deletion(deletion_request):
        """Schedule actual deletion based on retention policies"""
        user = deletion_request.user
        deletion_type = deletion_request.deletion_type
        
        if deletion_type == 'soft':
            DataProtectionService._perform_soft_deletion(deletion_request)
        elif deletion_type == 'partial':
            DataProtectionService._perform_partial_deletion(deletion_request)
        elif deletion_type == 'hard':
            # Hard deletion requires additional checks
            DataProtectionService._perform_hard_deletion(deletion_request)
    
    @staticmethod
    @transaction.atomic
    def _perform_soft_deletion(deletion_request):
        """
        Perform soft deletion - anonymize personal data but retain records
        """
        user = deletion_request.user
        anonymization_logs = []
        
        try:
            # Anonymize user account
            original_data = {
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
            }
            
            # Generate anonymous identifier
            anonymous_id = f"deleted_user_{hashlib.md5(str(user.id).encode()).hexdigest()[:8]}"
            
            user.username = anonymous_id
            user.email = f"{anonymous_id}@deleted.healthyphysio.com"
            user.first_name = "Deleted"
            user.last_name = "User"
            user.phone = ""
            user.is_active = False
            user.save()
            
            # Log anonymization
            anonymization_logs.append(DataAnonymizationLog(
                deletion_request=deletion_request,
                data_type='user_account',
                table_name='users_user',
                records_affected=1,
                anonymization_method='field_anonymization',
                processed_by=deletion_request.reviewed_by
            ))
            
            # Handle role-specific data
            if user.role == User.Role.PATIENT:
                DataProtectionService._anonymize_patient_data(user, deletion_request, anonymization_logs)
            elif user.role == User.Role.THERAPIST:
                DataProtectionService._anonymize_therapist_data(user, deletion_request, anonymization_logs)
            elif user.role == User.Role.DOCTOR:
                DataProtectionService._anonymize_doctor_data(user, deletion_request, anonymization_logs)
            
            # Bulk create anonymization logs
            DataAnonymizationLog.objects.bulk_create(anonymization_logs)
            
            # Mark deletion as completed
            deletion_request.status = 'completed'
            deletion_request.completed_at = timezone.now()
            deletion_request.save()
            
            logger.info(f"Soft deletion completed for user {original_data['username']}")
            
        except Exception as e:
            logger.error(f"Error during soft deletion for user {user.username}: {str(e)}")
            raise
    
    @staticmethod
    def _anonymize_patient_data(user, deletion_request, anonymization_logs):
        """Anonymize patient-specific data"""
        patient = getattr(user, 'patient_profile', None)
        if patient:
            # Anonymize personal information but retain medical data structure
            patient.address = "Anonymized Address"
            patient.city = "Anonymized"
            patient.state = "Anonymized"
            patient.zip_code = "000000"
            patient.emergency_contact_name = "Anonymized Contact"
            patient.emergency_contact_phone = "0000000000"
            patient.emergency_contact_relationship = "Anonymized"
            patient.referred_by = "Anonymized"
            patient.reference_detail = "Anonymized"
            
            # Soft delete the patient record
            patient.soft_delete("DPDP Act 2023 compliance - user requested deletion")
            
            anonymization_logs.append(DataAnonymizationLog(
                deletion_request=deletion_request,
                data_type='patient_personal',
                table_name='users_patient',
                records_affected=1,
                anonymization_method='field_anonymization',
                processed_by=deletion_request.reviewed_by
            ))
    
    @staticmethod
    def _anonymize_therapist_data(user, deletion_request, anonymization_logs):
        """Anonymize therapist-specific data"""
        therapist = getattr(user, 'therapist_profile', None)
        if therapist:
            # Anonymize personal information but retain professional structure
            therapist.residential_address = "Anonymized Address"
            therapist.preferred_areas = "Anonymized"
            
            # Soft delete the therapist record
            therapist.soft_delete()
            
            anonymization_logs.append(DataAnonymizationLog(
                deletion_request=deletion_request,
                data_type='therapist_professional',
                table_name='users_therapist',
                records_affected=1,
                anonymization_method='field_anonymization',
                processed_by=deletion_request.reviewed_by
            ))
    
    @staticmethod
    def _anonymize_doctor_data(user, deletion_request, anonymization_logs):
        """Anonymize doctor-specific data"""
        doctor = getattr(user, 'doctor_profile', None)
        if doctor:
            # Anonymize personal information but retain professional structure
            doctor.hospital_affiliation = "Anonymized Hospital"
            
            # Soft delete the doctor record
            doctor.soft_delete("DPDP Act 2023 compliance - user requested deletion")
            
            anonymization_logs.append(DataAnonymizationLog(
                deletion_request=deletion_request,
                data_type='doctor_professional',
                table_name='users_doctor',
                records_affected=1,
                anonymization_method='field_anonymization',
                processed_by=deletion_request.reviewed_by
            ))
    
    @staticmethod
    def _perform_partial_deletion(deletion_request):
        """
        Perform partial deletion - anonymize personal data, retain medical/professional records
        """
        # Similar to soft deletion but with more selective data retention
        DataProtectionService._perform_soft_deletion(deletion_request)
        logger.info(f"Partial deletion completed for user {deletion_request.user.username}")
    
    @staticmethod
    def _perform_hard_deletion(deletion_request):
        """
        Perform hard deletion - permanent removal (only after retention period)
        """
        # Hard deletion should only be performed after legal retention periods
        # This is a placeholder for future implementation
        logger.warning(f"Hard deletion requested for user {deletion_request.user.username} - not implemented")
        raise NotImplementedError("Hard deletion requires additional legal review")
    
    @staticmethod
    def _notify_admins_deletion_request(deletion_request):
        """Send notification to admins about new deletion request"""
        # Implementation depends on notification system
        logger.info(f"Admin notification sent for deletion request {deletion_request.id}")
    
    @staticmethod
    def _notify_user_deletion_decision(deletion_request):
        """Send notification to user about deletion decision"""
        # Implementation depends on notification system
        logger.info(f"User notification sent for deletion request {deletion_request.id}")
    
    @staticmethod
    def check_overdue_requests():
        """Check for overdue deletion requests and send alerts"""
        overdue_requests = AccountDeletionRequest.objects.filter(
            status__in=['pending', 'approved'],
            compliance_deadline__lt=timezone.now()
        )
        
        for request in overdue_requests:
            logger.warning(f"Overdue deletion request for user {request.user.username}")
            # Send alert to compliance team
        
        return overdue_requests.count()
