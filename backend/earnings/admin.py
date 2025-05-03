from django.contrib import admin
from .models import EarningRecord

@admin.register(EarningRecord)
class EarningRecordAdmin(admin.ModelAdmin):
    list_display = ('therapist', 'patient', 'date', 'session_type', 'amount', 'status', 'payment_status')
    list_filter = ('status', 'payment_status', 'date')
    search_fields = ('therapist__user__username', 'patient__user__username', 'session_type')
    date_hierarchy = 'date'
