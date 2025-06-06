# Generated by Django 4.2.10 on 2025-05-19 19:33

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_patient_emergency_contact_name_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('earnings', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='earningrecord',
            name='admin_amount',
            field=models.DecimalField(decimal_places=2, default=0, help_text='Amount for admin', max_digits=10),
        ),
        migrations.AddField(
            model_name='earningrecord',
            name='doctor_amount',
            field=models.DecimalField(decimal_places=2, default=0, help_text='Amount for doctor', max_digits=10),
        ),
        migrations.CreateModel(
            name='SessionFeeConfig',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('base_fee', models.DecimalField(decimal_places=2, help_text='Base fee for sessions in INR', max_digits=10)),
                ('custom_fee', models.DecimalField(blank=True, decimal_places=2, help_text='Custom fee override for this patient', max_digits=10, null=True)),
                ('notes', models.TextField(blank=True, help_text='Notes about fee configuration')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_fee_configs', to=settings.AUTH_USER_MODEL)),
                ('patient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='fee_configs', to='users.patient')),
            ],
            options={
                'ordering': ['-updated_at'],
            },
        ),
        migrations.CreateModel(
            name='RevenueDistributionConfig',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='Name of this distribution configuration', max_length=100)),
                ('is_default', models.BooleanField(default=False, help_text='Whether this is the default configuration')),
                ('distribution_type', models.CharField(choices=[('percentage', 'Percentage'), ('fixed', 'Fixed Amount')], default='percentage', help_text='Type of distribution (percentage or fixed amount)', max_length=10)),
                ('admin_value', models.DecimalField(decimal_places=2, help_text='Percentage or fixed amount for admin', max_digits=10)),
                ('therapist_value', models.DecimalField(decimal_places=2, help_text='Percentage or fixed amount for therapist', max_digits=10)),
                ('doctor_value', models.DecimalField(decimal_places=2, help_text='Percentage or fixed amount for referring doctor', max_digits=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_distributions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-is_default', 'name'],
            },
        ),
        migrations.CreateModel(
            name='FeeChangeLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('previous_fee', models.DecimalField(decimal_places=2, max_digits=10)),
                ('new_fee', models.DecimalField(decimal_places=2, max_digits=10)),
                ('reason', models.TextField(blank=True, help_text='Reason for the fee change')),
                ('changed_at', models.DateTimeField(auto_now_add=True)),
                ('changed_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='fee_changes', to=settings.AUTH_USER_MODEL)),
                ('fee_config', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='change_logs', to='earnings.sessionfeeconfig')),
            ],
            options={
                'ordering': ['-changed_at'],
            },
        ),
    ]
