# Generated by Django 5.2 on 2025-04-17 17:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='doctor',
            name='hospital_affiliation',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='therapist',
            name='years_of_experience',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
