"""
Purpose: Utility functions for the visits app
"""

from django.utils import timezone
from users.models import Therapist, Patient
from visits.models import TherapistReport, Visit
from scheduling.models import Session
import random


def create_test_report(
    therapist=None, 
    patient=None, 
    visit=None, 
    session=None, 
    status='draft', 
    content=None,
    stdout=None
):
    """
    Create a test therapist report for development and testing
    
    Args:
        therapist: Therapist instance or ID
        patient: Patient instance or ID
        visit: Visit instance or ID
        session: Session instance or ID
        status: Report status (draft, submitted, reviewed, flagged)
        content: Custom content for the report (dict or string)
        stdout: Optional output stream for logging (e.g., self.stdout in management commands)
    
    Returns:
        TherapistReport: The created report instance
    """
    # Helper function for logging
    def log(message, style=None):
        if stdout:
            if style and hasattr(stdout, 'style') and hasattr(stdout.style, style):
                style_func = getattr(stdout.style, style)
                stdout.write(style_func(message))
            else:
                stdout.write(message)
    
    # Get or resolve therapist
    if isinstance(therapist, int):
        try:
            therapist = Therapist.objects.get(id=therapist)
            log(f'Using existing therapist: {therapist}', 'SUCCESS')
        except Therapist.DoesNotExist:
            log(f'Therapist with ID {therapist} not found', 'ERROR')
            return None
    elif therapist is None:
        # Get the first therapist
        therapists = Therapist.objects.all()
        if not therapists.exists():
            log('No therapists found in the database', 'ERROR')
            return None
        therapist = therapists.first()
        log(f'Using first therapist: {therapist}', 'SUCCESS')
    
    # Get or resolve patient
    if isinstance(patient, int):
        try:
            patient = Patient.objects.get(id=patient)
            log(f'Using existing patient: {patient}', 'SUCCESS')
        except Patient.DoesNotExist:
            log(f'Patient with ID {patient} not found', 'ERROR')
            return None
    elif patient is None:
        # Get the first patient
        patients = Patient.objects.all()
        if not patients.exists():
            log('No patients found in the database', 'ERROR')
            return None
        patient = patients.first()
        log(f'Using first patient: {patient}', 'SUCCESS')
    
    # Get visit if provided
    if isinstance(visit, int):
        try:
            visit = Visit.objects.get(id=visit)
            log(f'Using existing visit: {visit}', 'SUCCESS')
        except Visit.DoesNotExist:
            log(f'Visit with ID {visit} not found, continuing without visit', 'WARNING')
            visit = None
    
    # Get session if provided
    if isinstance(session, int):
        try:
            session = Session.objects.get(id=session)
            log(f'Using existing session: {session}', 'SUCCESS')
        except Session.DoesNotExist:
            log(f'Session with ID {session} not found, continuing without session', 'WARNING')
            session = None
    
    # Validate status
    valid_statuses = ['draft', 'submitted', 'reviewed', 'flagged']
    if status.lower() not in valid_statuses:
        log(f'Invalid status: {status}. Must be one of {valid_statuses}', 'ERROR')
        return None
    
    # Create sample content if not provided
    if content is None:
        content = {
            'therapist_notes': 'This is a test report with sample notes.',
            'treatment_provided': 'Sample treatment provided during the session.',
            'patient_progress': 'Patient is making good progress.',
            'pain_level_before': random.randint(3, 8),
            'pain_level_after': random.randint(1, 5),
            'mobility_assessment': 'Mobility has improved since the last session.',
            'recommendations': 'Continue with home exercises as prescribed.',
            'next_session_goals': 'Focus on improving range of motion in the affected area.'
        }
    
    # Convert content to string if it's a dict
    if isinstance(content, dict):
        content = str(content)
    
    # Create the report
    report = TherapistReport.objects.create(
        therapist=therapist,
        patient=patient,
        visit=visit,
        session=session,
        report_date=timezone.now().date(),
        content=content,
        status=status.lower()
    )
    
    # Update fields based on status
    if status.lower() == 'submitted':
        report.submitted_at = timezone.now()
        report.save()
    elif status.lower() in ['reviewed', 'flagged']:
        report.submitted_at = timezone.now() - timezone.timedelta(hours=24)
        report.reviewed_at = timezone.now()
        report.save()
    
    log(f'Successfully created test report with ID {report.id}', 'SUCCESS')
    return report
