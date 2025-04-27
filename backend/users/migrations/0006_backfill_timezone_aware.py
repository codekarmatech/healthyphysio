# Generated manually

from django.db import migrations
from django.utils import timezone

def make_timezone_aware(apps, schema_editor):
    # Users model
    User = apps.get_model('users', 'User')
    for user in User.objects.all():
        if user.date_joined and timezone.is_naive(user.date_joined):
            user.date_joined = timezone.make_aware(user.date_joined, timezone.get_current_timezone())
            user.save(update_fields=['date_joined'])
    
    # Therapist model
    Therapist = apps.get_model('users', 'Therapist')
    for therapist in Therapist.objects.all():
        if therapist.approval_date and timezone.is_naive(therapist.approval_date):
            therapist.approval_date = timezone.make_aware(therapist.approval_date, timezone.get_current_timezone())
            therapist.save(update_fields=['approval_date'])
    
    # Scheduling models
    Appointment = apps.get_model('scheduling', 'Appointment')
    for appointment in Appointment.objects.all():
        fields_to_update = []
        
        if appointment.datetime and timezone.is_naive(appointment.datetime):
            appointment.datetime = timezone.make_aware(appointment.datetime, timezone.get_current_timezone())
            fields_to_update.append('datetime')
        
        if appointment.created_at and timezone.is_naive(appointment.created_at):
            appointment.created_at = timezone.make_aware(appointment.created_at, timezone.get_current_timezone())
            fields_to_update.append('created_at')
        
        if appointment.updated_at and timezone.is_naive(appointment.updated_at):
            appointment.updated_at = timezone.make_aware(appointment.updated_at, timezone.get_current_timezone())
            fields_to_update.append('updated_at')
        
        if fields_to_update:
            appointment.save(update_fields=fields_to_update)
    
    RescheduleRequest = apps.get_model('scheduling', 'RescheduleRequest')
    for request in RescheduleRequest.objects.all():
        fields_to_update = []
        
        if request.requested_datetime and timezone.is_naive(request.requested_datetime):
            request.requested_datetime = timezone.make_aware(request.requested_datetime, timezone.get_current_timezone())
            fields_to_update.append('requested_datetime')
        
        if request.created_at and timezone.is_naive(request.created_at):
            request.created_at = timezone.make_aware(request.created_at, timezone.get_current_timezone())
            fields_to_update.append('created_at')
        
        if request.updated_at and timezone.is_naive(request.updated_at):
            request.updated_at = timezone.make_aware(request.updated_at, timezone.get_current_timezone())
            fields_to_update.append('updated_at')
        
        if fields_to_update:
            request.save(update_fields=fields_to_update)
    
    Session = apps.get_model('scheduling', 'Session')
    for session in Session.objects.all():
        fields_to_update = []
        
        if session.check_in and timezone.is_naive(session.check_in):
            session.check_in = timezone.make_aware(session.check_in, timezone.get_current_timezone())
            fields_to_update.append('check_in')
        
        if session.check_out and timezone.is_naive(session.check_out):
            session.check_out = timezone.make_aware(session.check_out, timezone.get_current_timezone())
            fields_to_update.append('check_out')
        
        if session.created_at and timezone.is_naive(session.created_at):
            session.created_at = timezone.make_aware(session.created_at, timezone.get_current_timezone())
            fields_to_update.append('created_at')
        
        if session.updated_at and timezone.is_naive(session.updated_at):
            session.updated_at = timezone.make_aware(session.updated_at, timezone.get_current_timezone())
            fields_to_update.append('updated_at')
        
        if fields_to_update:
            session.save(update_fields=fields_to_update)
    
    # Attendance model
    Attendance = apps.get_model('attendance', 'Attendance')
    for attendance in Attendance.objects.all():
        fields_to_update = []
        
        if attendance.submitted_at and timezone.is_naive(attendance.submitted_at):
            attendance.submitted_at = timezone.make_aware(attendance.submitted_at, timezone.get_current_timezone())
            fields_to_update.append('submitted_at')
        
        if attendance.approved_at and timezone.is_naive(attendance.approved_at):
            attendance.approved_at = timezone.make_aware(attendance.approved_at, timezone.get_current_timezone())
            fields_to_update.append('approved_at')
        
        if fields_to_update:
            attendance.save(update_fields=fields_to_update)
    
    # Assessments models
    Assessment = apps.get_model('assessments', 'Assessment')
    for assessment in Assessment.objects.all():
        fields_to_update = []
        
        if assessment.created_at and timezone.is_naive(assessment.created_at):
            assessment.created_at = timezone.make_aware(assessment.created_at, timezone.get_current_timezone())
            fields_to_update.append('created_at')
        
        if assessment.updated_at and timezone.is_naive(assessment.updated_at):
            assessment.updated_at = timezone.make_aware(assessment.updated_at, timezone.get_current_timezone())
            fields_to_update.append('updated_at')
        
        if fields_to_update:
            assessment.save(update_fields=fields_to_update)
    
    AssessmentVersion = apps.get_model('assessments', 'AssessmentVersion')
    for version in AssessmentVersion.objects.all():
        if version.created_at and timezone.is_naive(version.created_at):
            version.created_at = timezone.make_aware(version.created_at, timezone.get_current_timezone())
            version.save(update_fields=['created_at'])
    
    # Audit logs
    AuditLog = apps.get_model('audit_logs', 'AuditLog')
    for log in AuditLog.objects.all():
        if log.timestamp and timezone.is_naive(log.timestamp):
            log.timestamp = timezone.make_aware(log.timestamp, timezone.get_current_timezone())
            log.save(update_fields=['timestamp'])


class Migration(migrations.Migration):
    dependencies = [
        ('users', '0005_therapist_approval_date_therapist_is_approved'),
        ('scheduling', '0003_session'),
        ('attendance', '0005_remove_assessmentversion_assessment_and_more'),
        ('assessments', '0001_initial'),
        ('audit_logs', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(make_timezone_aware, migrations.RunPython.noop),
    ]