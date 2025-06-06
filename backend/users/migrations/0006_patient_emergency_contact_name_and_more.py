# Generated by Django 4.2.10 on 2025-05-17 20:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_therapist_is_approved'),
    ]

    operations = [
        migrations.AddField(
            model_name='patient',
            name='emergency_contact_name',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='patient',
            name='emergency_contact_phone',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='patient',
            name='emergency_contact_relationship',
            field=models.CharField(blank=True, max_length=100),
        ),
    ]
