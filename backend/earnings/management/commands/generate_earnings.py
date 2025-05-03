"""
Purpose: Management command to generate sample earnings data
Usage: python manage.py generate_earnings --therapist_id=1 --month=5 --year=2023 --count=10
"""

import random
from datetime import datetime, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
import calendar

from users.models import Therapist, Patient
from scheduling.models import Appointment
from earnings.models import EarningRecord

class Command(BaseCommand):
    help = 'Generate sample earnings data for testing'

    def add_arguments(self, parser):
        parser.add_argument('--therapist_id', type=int, help='Therapist ID to generate earnings for')
        parser.add_argument('--month', type=int, help='Month (1-12) to generate earnings for')
        parser.add_argument('--year', type=int, help='Year to generate earnings for')
        parser.add_argument('--count', type=int, default=10, help='Number of earnings records to generate')

    def handle(self, *args, **options):
        therapist_id = options.get('therapist_id')
        month = options.get('month') or timezone.now().month
        year = options.get('year') or timezone.now().year
        count = options.get('count') or 10

        # Validate month
        if month < 1 or month > 12:
            self.stdout.write(self.style.ERROR(f'Invalid month: {month}. Must be between 1 and 12.'))
            return

        # Get therapist
        try:
            if therapist_id:
                therapist = Therapist.objects.get(id=therapist_id)
            else:
                # Get a random therapist
                therapist = Therapist.objects.order_by('?').first()
                
            if not therapist:
                self.stdout.write(self.style.ERROR('No therapists found in the database.'))
                return
                
        except Therapist.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Therapist with ID {therapist_id} not found.'))
            return

        # Get patients for this therapist
        patients = Patient.objects.filter(therapist=therapist)
        if not patients.exists():
            self.stdout.write(self.style.ERROR(f'No patients found for therapist {therapist}.'))
            return

        # Get start and end dates for the month
        start_date = datetime(year, month, 1).date()
        last_day = calendar.monthrange(year, month)[1]
        end_date = datetime(year, month, last_day).date()

        # Delete existing earnings for this therapist in this month
        existing_earnings = EarningRecord.objects.filter(
            therapist=therapist,
            date__gte=start_date,
            date__lte=end_date
        )
        
        if existing_earnings.exists():
            count_deleted = existing_earnings.count()
            existing_earnings.delete()
            self.stdout.write(self.style.WARNING(f'Deleted {count_deleted} existing earnings records for {therapist} in {month}/{year}.'))

        # Session types
        session_types = [
            'Initial Assessment', 'Follow-up Consultation', 'Physical Therapy', 
            'Rehabilitation Session', 'Pain Management', 'Post-Surgery Recovery',
            'Sports Injury Treatment', 'Mobility Assessment', 'Strength Training'
        ]

        # Generate earnings records
        earnings_created = 0
        
        for i in range(count):
            # Generate a random day in the month
            day = random.randint(1, last_day)
            date = datetime(year, month, day).date()
            
            # Skip future dates
            if date > timezone.now().date():
                continue
                
            # Get a random patient
            patient = random.choice(patients)
            
            # Generate a random session fee between $60 and $120
            session_fee = Decimal(random.randint(60, 120))
            
            # Determine session status with probabilities
            rand = random.random()
            
            if rand < 0.75:  # 75% completed
                status = Appointment.Status.COMPLETED
                payment_status = EarningRecord.PaymentStatus.PAID
                amount = session_fee
            elif rand < 0.85:  # 10% cancelled with fee
                status = Appointment.Status.CANCELLED
                payment_status = EarningRecord.PaymentStatus.PARTIAL
                amount = session_fee * Decimal('0.5')  # 50% cancellation fee
            else:  # 15% missed or cancelled without fee
                status = Appointment.Status.MISSED if random.random() > 0.5 else Appointment.Status.CANCELLED
                payment_status = EarningRecord.PaymentStatus.NOT_APPLICABLE
                amount = Decimal('0')
            
            # Get random session type
            session_type = random.choice(session_types)
            
            # Create earnings record
            EarningRecord.objects.create(
                therapist=therapist,
                patient=patient,
                date=date,
                session_type=session_type,
                amount=amount,
                full_amount=session_fee,
                status=status,
                payment_status=payment_status,
                payment_date=date if payment_status == EarningRecord.PaymentStatus.PAID else None,
                notes=f"Sample data generated for testing"
            )
            
            earnings_created += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully created {earnings_created} earnings records for {therapist} in {month}/{year}.'))