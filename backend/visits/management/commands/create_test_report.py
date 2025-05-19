"""
Purpose: Create a test therapist report for development and testing
"""

from django.core.management.base import BaseCommand
from visits.utils import create_test_report

class Command(BaseCommand):
    help = 'Create a test therapist report for development and testing'

    def add_arguments(self, parser):
        parser.add_argument('--therapist_id', type=int, help='Therapist ID')
        parser.add_argument('--patient_id', type=int, help='Patient ID')
        parser.add_argument('--visit_id', type=int, help='Visit ID')
        parser.add_argument('--session_id', type=int, help='Session ID')
        parser.add_argument('--status', type=str, default='draft', help='Report status (draft, submitted, reviewed, flagged)')

    def handle(self, *args, **options):
        # Use the utility function to create the test report
        report = create_test_report(
            therapist=options.get('therapist_id'),
            patient=options.get('patient_id'),
            visit=options.get('visit_id'),
            session=options.get('session_id'),
            status=options.get('status', 'draft'),
            stdout=self.stdout
        )

        if not report:
            self.stdout.write(self.style.ERROR('Failed to create test report'))
