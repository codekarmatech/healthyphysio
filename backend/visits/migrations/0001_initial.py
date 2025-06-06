# Generated by Django 4.2.10 on 2025-05-15 16:39

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('scheduling', '0003_alter_appointment_status'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('users', '0002_profilechangerequest'),
    ]

    operations = [
        migrations.CreateModel(
            name='LocationUpdate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('latitude', models.DecimalField(decimal_places=6, max_digits=9)),
                ('longitude', models.DecimalField(decimal_places=6, max_digits=9)),
                ('accuracy', models.FloatField(help_text='Accuracy in meters')),
                ('timestamp', models.DateTimeField(default=django.utils.timezone.now)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='location_updates', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        migrations.CreateModel(
            name='Visit',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('scheduled', 'Scheduled'), ('en_route', 'En Route'), ('arrived', 'Arrived'), ('in_session', 'In Session'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], default='scheduled', max_length=20)),
                ('scheduled_start', models.DateTimeField()),
                ('scheduled_end', models.DateTimeField()),
                ('actual_start', models.DateTimeField(blank=True, null=True)),
                ('actual_end', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('appointment', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='visit', to='scheduling.appointment')),
                ('patient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='visits', to='users.patient')),
                ('therapist', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='visits', to='users.therapist')),
            ],
            options={
                'ordering': ['-scheduled_start'],
            },
        ),
        migrations.CreateModel(
            name='TherapistReport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('report_date', models.DateField(default=django.utils.timezone.now)),
                ('content', models.TextField()),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('submitted', 'Submitted'), ('reviewed', 'Reviewed'), ('flagged', 'Flagged')], default='draft', max_length=10)),
                ('history', models.JSONField(default=list)),
                ('submitted_at', models.DateTimeField(blank=True, null=True)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('review_notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('patient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='therapist_reports', to='users.patient')),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_reports', to=settings.AUTH_USER_MODEL)),
                ('session', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='reports', to='scheduling.session')),
                ('therapist', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reports', to='users.therapist')),
                ('visit', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='reports', to='visits.visit')),
            ],
            options={
                'ordering': ['-report_date'],
            },
        ),
        migrations.CreateModel(
            name='ProximityAlert',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('distance', models.FloatField(help_text='Distance in meters')),
                ('severity', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')], default='medium', max_length=10)),
                ('status', models.CharField(choices=[('active', 'Active'), ('acknowledged', 'Acknowledged'), ('resolved', 'Resolved'), ('false_alarm', 'False Alarm')], default='active', max_length=15)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('acknowledged_at', models.DateTimeField(blank=True, null=True)),
                ('resolution_notes', models.TextField(blank=True)),
                ('acknowledged_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='acknowledged_alerts', to=settings.AUTH_USER_MODEL)),
                ('patient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='proximity_alerts', to='users.patient')),
                ('patient_location', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='patient_alerts', to='visits.locationupdate')),
                ('therapist', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='proximity_alerts', to='users.therapist')),
                ('therapist_location', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='therapist_alerts', to='visits.locationupdate')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddField(
            model_name='locationupdate',
            name='visit',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='location_updates', to='visits.visit'),
        ),
        migrations.AddIndex(
            model_name='visit',
            index=models.Index(fields=['therapist', 'scheduled_start'], name='visits_visi_therapi_894152_idx'),
        ),
        migrations.AddIndex(
            model_name='visit',
            index=models.Index(fields=['patient', 'scheduled_start'], name='visits_visi_patient_d7ba9a_idx'),
        ),
        migrations.AddIndex(
            model_name='visit',
            index=models.Index(fields=['status'], name='visits_visi_status_ae8d13_idx'),
        ),
        migrations.AddIndex(
            model_name='therapistreport',
            index=models.Index(fields=['therapist', 'report_date'], name='visits_ther_therapi_137371_idx'),
        ),
        migrations.AddIndex(
            model_name='therapistreport',
            index=models.Index(fields=['patient', 'report_date'], name='visits_ther_patient_f9738d_idx'),
        ),
        migrations.AddIndex(
            model_name='therapistreport',
            index=models.Index(fields=['status'], name='visits_ther_status_bff493_idx'),
        ),
        migrations.AddIndex(
            model_name='proximityalert',
            index=models.Index(fields=['therapist', 'created_at'], name='visits_prox_therapi_e6a7d8_idx'),
        ),
        migrations.AddIndex(
            model_name='proximityalert',
            index=models.Index(fields=['patient', 'created_at'], name='visits_prox_patient_2c7822_idx'),
        ),
        migrations.AddIndex(
            model_name='proximityalert',
            index=models.Index(fields=['status'], name='visits_prox_status_0e17a9_idx'),
        ),
        migrations.AddIndex(
            model_name='proximityalert',
            index=models.Index(fields=['severity'], name='visits_prox_severit_1bed8e_idx'),
        ),
        migrations.AddIndex(
            model_name='locationupdate',
            index=models.Index(fields=['user', 'timestamp'], name='visits_loca_user_id_5be7b2_idx'),
        ),
        migrations.AddIndex(
            model_name='locationupdate',
            index=models.Index(fields=['visit', 'timestamp'], name='visits_loca_visit_i_f9d49f_idx'),
        ),
    ]
