from django.db import migrations

def populate_therapist_amount(apps, schema_editor):
    """
    Populate the therapist_amount field for existing records
    For each record, set therapist_amount = amount - admin_amount - doctor_amount
    """
    EarningRecord = apps.get_model('earnings', 'EarningRecord')
    
    # Get all records
    for record in EarningRecord.objects.all():
        # Calculate therapist amount
        record.therapist_amount = record.amount - record.admin_amount - record.doctor_amount
        record.save()

class Migration(migrations.Migration):

    dependencies = [
        ('earnings', '0003_earningrecord_therapist_amount'),
    ]

    operations = [
        migrations.RunPython(populate_therapist_amount, migrations.RunPython.noop),
    ]
