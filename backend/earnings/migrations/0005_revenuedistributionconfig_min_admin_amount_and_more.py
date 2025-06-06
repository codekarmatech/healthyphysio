# Generated by Django 4.2.10 on 2025-05-21 02:50

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('earnings', '0004_populate_therapist_amount'),
    ]

    operations = [
        migrations.AddField(
            model_name='revenuedistributionconfig',
            name='min_admin_amount',
            field=models.DecimalField(decimal_places=2, default=400.0, help_text='Minimum admin amount threshold for warning', max_digits=10),
        ),
        migrations.AddField(
            model_name='revenuedistributionconfig',
            name='platform_fee_percentage',
            field=models.DecimalField(decimal_places=2, default=3.0, help_text='Platform fee percentage to be deducted from total amount', max_digits=5),
        ),
    ]
