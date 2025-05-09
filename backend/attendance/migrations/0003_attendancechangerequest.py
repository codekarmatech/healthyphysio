# Generated by Django 4.2.10 on 2025-05-03 20:20

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('attendance', '0002_attendance_is_paid_attendance_notes_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='AttendanceChangeRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('request_type', models.CharField(choices=[('change_status', 'Change Status'), ('delete', 'Delete Attendance')], max_length=20)),
                ('current_status', models.CharField(max_length=20)),
                ('requested_status', models.CharField(blank=True, max_length=20, null=True)),
                ('reason', models.TextField()),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('attendance', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='change_requests', to='attendance.attendance')),
                ('resolved_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='resolved_attendance_requests', to=settings.AUTH_USER_MODEL)),
                ('therapist', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attendance_change_requests', to='users.therapist')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
