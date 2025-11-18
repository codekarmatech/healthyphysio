"""
Management command to set up data protection compliance system
Initializes retention policies and compliance monitoring
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from users.data_protection_service import DataProtectionService
from users.data_protection import DataRetentionPolicy, DEFAULT_RETENTION_POLICIES


class Command(BaseCommand):
    help = 'Set up data protection compliance system for DPDP Act 2023'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reset existing retention policies',
        )
        parser.add_argument(
            '--check-compliance',
            action='store_true',
            help='Check current compliance status',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Setting up Data Protection Compliance System')
        )
        
        if options['reset']:
            self.reset_policies()
        
        self.initialize_policies()
        
        if options['check_compliance']:
            self.check_compliance()
        
        self.display_summary()

    def reset_policies(self):
        """Reset existing retention policies"""
        self.stdout.write('Resetting existing retention policies...')
        DataRetentionPolicy.objects.all().delete()
        self.stdout.write(
            self.style.WARNING('All existing retention policies deleted')
        )

    def initialize_policies(self):
        """Initialize default retention policies"""
        self.stdout.write('Initializing data retention policies...')
        
        DataProtectionService.initialize_retention_policies()
        
        policies_count = DataRetentionPolicy.objects.count()
        self.stdout.write(
            self.style.SUCCESS(f'✓ {policies_count} retention policies initialized')
        )
        
        # Display policies
        self.stdout.write('\n=== Data Retention Policies ===')
        for policy in DataRetentionPolicy.objects.all():
            years = round(policy.retention_period_days / 365, 1)
            override_text = "Can override deletion" if policy.can_override_deletion else "Cannot override deletion"
            
            self.stdout.write(f'• {policy.get_data_type_display()}:')
            self.stdout.write(f'  - Retention: {policy.retention_period_days} days ({years} years)')
            self.stdout.write(f'  - {override_text}')
            self.stdout.write(f'  - Legal basis: {policy.legal_basis}')
            self.stdout.write('')

    def check_compliance(self):
        """Check current compliance status"""
        self.stdout.write('\n=== Compliance Status Check ===')
        
        from users.data_protection import AccountDeletionRequest
        
        # Check overdue requests
        overdue_count = DataProtectionService.check_overdue_requests()
        if overdue_count > 0:
            self.stdout.write(
                self.style.ERROR(f'⚠️  {overdue_count} overdue deletion requests found')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('✓ No overdue deletion requests')
            )
        
        # Check pending requests
        pending_count = AccountDeletionRequest.objects.filter(status='pending').count()
        if pending_count > 0:
            self.stdout.write(f'📋 {pending_count} pending deletion requests')
        else:
            self.stdout.write('✓ No pending deletion requests')
        
        # Check legal holds
        legal_holds = AccountDeletionRequest.objects.filter(legal_hold=True).count()
        if legal_holds > 0:
            self.stdout.write(f'🔒 {legal_holds} requests on legal hold')
        else:
            self.stdout.write('✓ No requests on legal hold')

    def display_summary(self):
        """Display setup summary and next steps"""
        self.stdout.write('\n' + '='*60)
        self.stdout.write(
            self.style.SUCCESS('Data Protection Compliance System Setup Complete')
        )
        self.stdout.write('='*60)
        
        self.stdout.write('\n📋 DPDP Act 2023 Compliance Features:')
        self.stdout.write('✓ Right to erasure implementation')
        self.stdout.write('✓ Admin approval workflow for deletions')
        self.stdout.write('✓ 30-day compliance deadline tracking')
        self.stdout.write('✓ Data retention policy enforcement')
        self.stdout.write('✓ Audit logging for all deletion activities')
        self.stdout.write('✓ Legal hold mechanism for ongoing cases')
        
        self.stdout.write('\n🏥 Healthcare Data Protection:')
        self.stdout.write('✓ 7-year retention for medical records')
        self.stdout.write('✓ 7-year retention for treatment records')
        self.stdout.write('✓ 7-year retention for financial records')
        self.stdout.write('✓ Soft deletion with data anonymization')
        self.stdout.write('✓ Partial deletion for medical data retention')
        
        self.stdout.write('\n🔧 API Endpoints Available:')
        self.stdout.write('• POST /api/users/request-deletion/ - User deletion request')
        self.stdout.write('• GET /api/users/deletion-status/ - Check deletion status')
        self.stdout.write('• POST /api/users/cancel-deletion/ - Cancel deletion request')
        self.stdout.write('• GET /api/admin/deletion-requests/ - Admin: List requests')
        self.stdout.write('• POST /api/admin/deletion-requests/{id}/approve/ - Admin: Approve')
        self.stdout.write('• POST /api/admin/deletion-requests/{id}/reject/ - Admin: Reject')
        self.stdout.write('• GET /api/admin/compliance-dashboard/ - Admin: Compliance overview')
        
        self.stdout.write('\n⚠️  Important Notes:')
        self.stdout.write('• Medical records are retained for 7 years as per Indian regulations')
        self.stdout.write('• Personal data is anonymized during soft deletion')
        self.stdout.write('• Admin approval is required for all deletion requests')
        self.stdout.write('• Compliance deadline is 30 days from request date')
        self.stdout.write('• All deletion activities are logged for audit purposes')
        
        self.stdout.write('\n📚 Legal Compliance:')
        self.stdout.write('• Digital Personal Data Protection Act (DPDP) 2023')
        self.stdout.write('• Information Technology Act 2000')
        self.stdout.write('• Indian Medical Council regulations')
        self.stdout.write('• Physiotherapy professional standards')
        
        self.stdout.write('\n🚀 Next Steps:')
        self.stdout.write('1. Update URL routing to include data protection endpoints')
        self.stdout.write('2. Run database migrations for new models')
        self.stdout.write('3. Set up automated compliance monitoring')
        self.stdout.write('4. Train admin staff on deletion request workflow')
        self.stdout.write('5. Update privacy policy to reflect DPDP Act 2023 compliance')
        
        self.stdout.write('\n' + '='*60)
