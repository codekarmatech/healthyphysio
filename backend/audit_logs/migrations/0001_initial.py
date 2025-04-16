# Generated by Django 5.2 on 2025-04-16 10:25

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='AuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(choices=[('CREATE', 'Create'), ('UPDATE', 'Update'), ('DELETE', 'Delete'), ('LOGIN', 'Login'), ('LOGOUT', 'Logout'), ('ACCESS', 'Access')], max_length=10)),
                ('model_name', models.CharField(max_length=100)),
                ('object_id', models.CharField(max_length=50)),
                ('object_repr', models.CharField(max_length=255)),
                ('previous_state', models.JSONField(blank=True, null=True)),
                ('new_state', models.JSONField(blank=True, null=True)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.TextField(blank=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('integrity_hash', models.CharField(max_length=64)),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        migrations.CreateModel(
            name='AuditLogArchive',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('archive_date', models.DateField(auto_now_add=True)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('log_count', models.PositiveIntegerField()),
                ('archive_file', models.FileField(upload_to='audit_archives/')),
                ('integrity_hash', models.CharField(max_length=64)),
            ],
        ),
    ]
