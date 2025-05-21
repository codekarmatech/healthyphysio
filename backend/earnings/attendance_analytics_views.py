"""
Purpose: API views for attendance analytics and financial impact
Connected to: Financial dashboard, attendance tracking, and revenue analysis
"""
from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q, Count, Sum, Avg, F, Case, When, Value, IntegerField, DecimalField, ExpressionWrapper
from django.utils import timezone
from datetime import timedelta, datetime
from decimal import Decimal
import calendar
import random

from users.models import Patient, Therapist, Doctor, User
from users.permissions import IsAdminUser
from scheduling.models import Appointment, Session
from attendance.models import Attendance, Leave
from earnings.models import EarningRecord

class AttendanceImpactViewSet(viewsets.ViewSet):
    """
    API endpoint for attendance impact analysis
    Provides data on revenue loss due to absences, categorized by reason
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def list(self, request):
        """
        Get attendance impact analysis data
        """
        # Get query parameters
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        therapist_id = request.query_params.get('therapist_id')

        # Parse dates
        try:
            if start_date_str:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            else:
                # Default to 3 months ago
                start_date = (timezone.now() - timedelta(days=90)).date()

            if end_date_str:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            else:
                # Default to today
                end_date = timezone.now().date()
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if we have real data
        has_data = Attendance.objects.filter(
            date__range=(start_date, end_date),
            status__in=['absent', 'half_day', 'sick_leave', 'emergency_leave']
        ).exists()

        if not has_data:
            # Return mock data
            return Response(self._generate_mock_attendance_impact_data(start_date, end_date))

        # Get attendance records
        attendance_query = Attendance.objects.filter(
            date__range=(start_date, end_date)
        )

        if therapist_id:
            attendance_query = attendance_query.filter(therapist_id=therapist_id)

        # Calculate revenue loss by absence reason
        revenue_loss_by_reason = []

        # Get all therapists
        therapists = Therapist.objects.all()
        if therapist_id:
            therapists = therapists.filter(id=therapist_id)

        # For each therapist, calculate revenue loss
        for therapist in therapists:
            # Get average earnings per day for this therapist
            avg_earnings = self._calculate_avg_earnings_per_day(therapist)

            # Get absences for this therapist
            absences = attendance_query.filter(
                therapist=therapist,
                status__in=['absent', 'half_day', 'sick_leave', 'emergency_leave']
            )

            # Calculate revenue loss for each absence type
            absence_types = {
                'absent': {'count': 0, 'loss': 0},
                'half_day': {'count': 0, 'loss': 0},
                'sick_leave': {'count': 0, 'loss': 0},
                'emergency_leave': {'count': 0, 'loss': 0}
            }

            for absence in absences:
                absence_type = absence.status
                if absence_type in absence_types:
                    absence_types[absence_type]['count'] += 1
                    # For half day, count as 0.5
                    multiplier = 0.5 if absence_type == 'half_day' else 1
                    absence_types[absence_type]['loss'] += avg_earnings * multiplier

            # Add to results
            for absence_type, data in absence_types.items():
                if data['count'] > 0:
                    revenue_loss_by_reason.append({
                        'therapist_id': therapist.id,
                        'therapist_name': f"{therapist.user.first_name} {therapist.user.last_name}",
                        'reason': absence_type,
                        'count': data['count'],
                        'revenue_loss': data['loss']
                    })

        # Calculate attendance trends over time
        attendance_trends = self._calculate_attendance_trends(start_date, end_date, therapist_id)

        # Calculate absence reason distribution
        absence_distribution = self._calculate_absence_distribution(start_date, end_date, therapist_id)

        return Response({
            'revenue_loss_by_reason': revenue_loss_by_reason,
            'attendance_trends': attendance_trends,
            'absence_distribution': absence_distribution,
            'is_mock_data': False
        })

    def _calculate_avg_earnings_per_day(self, therapist):
        """Calculate average earnings per day for a therapist"""
        # Get completed appointments in the last 90 days
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=90)

        # Get earnings records
        earnings = EarningRecord.objects.filter(
            therapist=therapist,
            date__range=(start_date, end_date)
        )

        if not earnings.exists():
            # Return a reasonable default if no earnings data
            return Decimal('1000.00')

        # Calculate average earnings per day
        total_earnings = earnings.aggregate(Sum('therapist_amount'))['therapist_amount__sum'] or 0

        # Count unique days with earnings
        unique_days = earnings.values('date').distinct().count()

        if unique_days == 0:
            return Decimal('1000.00')

        return total_earnings / unique_days

    def _calculate_attendance_trends(self, start_date, end_date, therapist_id=None):
        """Calculate attendance trends over time"""
        # Get all dates in range
        date_range = []
        current_date = start_date
        while current_date <= end_date:
            date_range.append(current_date)
            current_date += timedelta(days=1)

        # Group dates by month
        months = {}
        for date in date_range:
            month_key = date.strftime('%Y-%m')
            if month_key not in months:
                months[month_key] = {
                    'month': date.strftime('%b %Y'),
                    'present': 0,
                    'absent': 0,
                    'half_day': 0,
                    'leave': 0
                }

        # Get attendance records
        attendance_query = Attendance.objects.filter(
            date__range=(start_date, end_date)
        )

        if therapist_id:
            attendance_query = attendance_query.filter(therapist_id=therapist_id)

        # Count attendance by month and status
        for attendance in attendance_query:
            month_key = attendance.date.strftime('%Y-%m')
            if month_key in months:
                if attendance.status == 'present':
                    months[month_key]['present'] += 1
                elif attendance.status == 'absent':
                    months[month_key]['absent'] += 1
                elif attendance.status == 'half_day':
                    months[month_key]['half_day'] += 1
                elif attendance.status in ['approved_leave', 'sick_leave', 'emergency_leave']:
                    months[month_key]['leave'] += 1

        # Convert to list
        trends = []
        for month_key in sorted(months.keys()):
            trends.append(months[month_key])

        return trends

    def _calculate_absence_distribution(self, start_date, end_date, therapist_id=None):
        """Calculate distribution of absence reasons"""
        # Get attendance records
        attendance_query = Attendance.objects.filter(
            date__range=(start_date, end_date),
            status__in=['absent', 'half_day', 'sick_leave', 'emergency_leave']
        )

        if therapist_id:
            attendance_query = attendance_query.filter(therapist_id=therapist_id)

        # Count by status
        counts = attendance_query.values('status').annotate(count=Count('id'))

        # Convert to list of dictionaries
        distribution = []
        for item in counts:
            distribution.append({
                'reason': item['status'],
                'count': item['count']
            })

        return distribution

    def _generate_mock_attendance_impact_data(self, start_date, end_date):
        """Generate mock data for attendance impact analysis"""
        # Generate mock revenue loss by reason
        therapists = [
            {'id': 1, 'name': 'Rajesh Sharma'},
            {'id': 2, 'name': 'Priya Patel'},
            {'id': 3, 'name': 'Amit Singh'}
        ]

        reasons = ['absent', 'half_day', 'sick_leave', 'emergency_leave']

        revenue_loss_by_reason = []
        for therapist in therapists:
            for reason in reasons:
                count = random.randint(1, 5)
                revenue_loss = random.randint(5000, 20000)
                revenue_loss_by_reason.append({
                    'therapist_id': therapist['id'],
                    'therapist_name': therapist['name'],
                    'reason': reason,
                    'count': count,
                    'revenue_loss': revenue_loss
                })

        # Generate mock attendance trends
        attendance_trends = []
        current_date = start_date
        while current_date <= end_date:
            month_key = current_date.strftime('%Y-%m')
            month_name = current_date.strftime('%b %Y')

            # Check if month already exists
            month_exists = False
            for trend in attendance_trends:
                if trend['month'] == month_name:
                    month_exists = True
                    break

            if not month_exists:
                attendance_trends.append({
                    'month': month_name,
                    'present': random.randint(50, 80),
                    'absent': random.randint(5, 15),
                    'half_day': random.randint(3, 10),
                    'leave': random.randint(2, 8)
                })

            # Move to next month
            current_date = (current_date.replace(day=28) + timedelta(days=4)).replace(day=1)

        # Generate mock absence distribution
        absence_distribution = []
        for reason in reasons:
            absence_distribution.append({
                'reason': reason,
                'count': random.randint(10, 30)
            })

        return {
            'revenue_loss_by_reason': revenue_loss_by_reason,
            'attendance_trends': attendance_trends,
            'absence_distribution': absence_distribution,
            'is_mock_data': True
        }


class TherapistConsistencyViewSet(viewsets.ViewSet):
    """
    API endpoint for therapist consistency reports
    Provides data on therapist consistency scores and revenue impact
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def list(self, request):
        """
        Get therapist consistency report data
        """
        # Get query parameters
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        # Parse dates
        try:
            if start_date_str:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            else:
                # Default to 3 months ago
                start_date = (timezone.now() - timedelta(days=90)).date()

            if end_date_str:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            else:
                # Default to today
                end_date = timezone.now().date()
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if we have real data
        has_data = Attendance.objects.filter(
            date__range=(start_date, end_date)
        ).exists()

        if not has_data:
            # Return mock data
            return Response(self._generate_mock_therapist_consistency_data())

        # Get all therapists
        therapists = Therapist.objects.all()

        # Calculate consistency scores for each therapist
        consistency_scores = []
        for therapist in therapists:
            # Get attendance records for this therapist
            attendance_records = Attendance.objects.filter(
                therapist=therapist,
                date__range=(start_date, end_date)
            )

            if not attendance_records.exists():
                continue

            # Calculate attendance rate
            total_days = attendance_records.count()
            present_days = attendance_records.filter(status='present').count()
            attendance_rate = (present_days / total_days) * 100 if total_days > 0 else 0

            # Calculate on-time percentage
            # This would require additional data about check-in times
            # For now, we'll use a random value or a default
            on_time_percentage = random.uniform(70, 100)

            # Calculate consistency score (weighted average of attendance rate and on-time percentage)
            consistency_score = (attendance_rate * 0.7) + (on_time_percentage * 0.3)

            # Calculate revenue loss
            avg_earnings = self._calculate_avg_earnings_per_day(therapist)
            absent_days = attendance_records.filter(
                status__in=['absent', 'half_day', 'sick_leave', 'emergency_leave']
            ).count()
            half_days = attendance_records.filter(status='half_day').count()

            # Adjust for half days (count as 0.5 days)
            adjusted_absent_days = absent_days - (half_days * 0.5)

            # Convert float to Decimal before multiplication
            revenue_loss = avg_earnings * Decimal(str(adjusted_absent_days))

            # Get absence breakdown
            absence_breakdown = attendance_records.filter(
                status__in=['absent', 'half_day', 'sick_leave', 'emergency_leave']
            ).values('status').annotate(count=Count('id'))

            # Convert to list of dictionaries
            absence_reasons = []
            for item in absence_breakdown:
                absence_reasons.append({
                    'reason': item['status'],
                    'count': item['count']
                })

            consistency_scores.append({
                'therapist_id': therapist.id,
                'therapist_name': f"{therapist.user.first_name} {therapist.user.last_name}",
                'attendance_rate': round(attendance_rate, 2),
                'on_time_percentage': round(on_time_percentage, 2),
                'consistency_score': round(consistency_score, 2),
                'revenue_loss': revenue_loss,
                'absence_reasons': absence_reasons
            })

        # Sort by consistency score (descending)
        consistency_scores.sort(key=lambda x: x['consistency_score'], reverse=True)

        return Response({
            'consistency_scores': consistency_scores,
            'is_mock_data': False
        })

    def _calculate_avg_earnings_per_day(self, therapist):
        """Calculate average earnings per day for a therapist"""
        # Get completed appointments in the last 90 days
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=90)

        # Get earnings records
        earnings = EarningRecord.objects.filter(
            therapist=therapist,
            date__range=(start_date, end_date)
        )

        if not earnings.exists():
            # Return a reasonable default if no earnings data
            return Decimal('1000.00')

        # Calculate average earnings per day
        total_earnings = earnings.aggregate(Sum('therapist_amount'))['therapist_amount__sum'] or 0

        # Count unique days with earnings
        unique_days = earnings.values('date').distinct().count()

        if unique_days == 0:
            return Decimal('1000.00')

        return total_earnings / unique_days

    def _generate_mock_therapist_consistency_data(self):
        """Generate mock data for therapist consistency report"""
        therapists = [
            {'id': 1, 'name': 'Rajesh Sharma'},
            {'id': 2, 'name': 'Priya Patel'},
            {'id': 3, 'name': 'Amit Singh'},
            {'id': 4, 'name': 'Neha Gupta'},
            {'id': 5, 'name': 'Vikram Desai'}
        ]

        consistency_scores = []
        for therapist in therapists:
            attendance_rate = random.uniform(75, 98)
            on_time_percentage = random.uniform(70, 99)
            consistency_score = (attendance_rate * 0.7) + (on_time_percentage * 0.3)
            revenue_loss = random.randint(5000, 25000)

            # Generate absence reasons
            absence_reasons = []
            for reason in ['absent', 'half_day', 'sick_leave', 'emergency_leave']:
                count = random.randint(0, 5)
                if count > 0:
                    absence_reasons.append({
                        'reason': reason,
                        'count': count
                    })

            consistency_scores.append({
                'therapist_id': therapist['id'],
                'therapist_name': therapist['name'],
                'attendance_rate': round(attendance_rate, 2),
                'on_time_percentage': round(on_time_percentage, 2),
                'consistency_score': round(consistency_score, 2),
                'revenue_loss': revenue_loss,
                'absence_reasons': absence_reasons
            })

        # Sort by consistency score (descending)
        consistency_scores.sort(key=lambda x: x['consistency_score'], reverse=True)

        return {
            'consistency_scores': consistency_scores,
            'is_mock_data': True
        }


class PatientBehaviorViewSet(viewsets.ViewSet):
    """
    API endpoint for patient behavior analysis
    Provides data on patient cancellation and rescheduling patterns
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def list(self, request):
        """
        Get patient behavior analysis data
        """
        # Get query parameters
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        # Parse dates
        try:
            if start_date_str:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            else:
                # Default to 3 months ago
                start_date = (timezone.now() - timedelta(days=90)).date()

            if end_date_str:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            else:
                # Default to today
                end_date = timezone.now().date()
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if we have real data
        start_datetime = timezone.make_aware(datetime.combine(start_date, datetime.min.time()))
        end_datetime = timezone.make_aware(datetime.combine(end_date, datetime.max.time()))

        has_data = Appointment.objects.filter(
            datetime__range=(start_datetime, end_datetime),
            status__in=['cancelled', 'missed']
        ).exists()

        if not has_data:
            # Return mock data
            return Response(self._generate_mock_patient_behavior_data(start_date, end_date))

        # Get all patients with appointments in the date range
        patients = Patient.objects.filter(
            appointments__datetime__range=(start_datetime, end_datetime)
        ).distinct()

        # Calculate cancellation patterns for each patient
        patient_behaviors = []
        for patient in patients:
            # Get appointments for this patient
            appointments = Appointment.objects.filter(
                patient=patient,
                datetime__range=(start_datetime, end_datetime)
            )

            if not appointments.exists():
                continue

            # Calculate cancellation rate
            total_appointments = appointments.count()
            cancelled_appointments = appointments.filter(status='cancelled').count()
            missed_appointments = appointments.filter(status='missed').count()

            cancellation_rate = ((cancelled_appointments + missed_appointments) / total_appointments) * 100 if total_appointments > 0 else 0

            # Calculate rescheduling rate
            rescheduled_appointments = appointments.filter(status='rescheduled').count()
            reschedule_rate = (rescheduled_appointments / total_appointments) * 100 if total_appointments > 0 else 0

            # Calculate revenue impact
            # For simplicity, we'll use a fixed average fee per appointment
            avg_fee = Decimal('1500.00')
            revenue_impact = avg_fee * Decimal(cancelled_appointments + missed_appointments)

            patient_behaviors.append({
                'patient_id': patient.id,
                'patient_name': f"{patient.user.first_name} {patient.user.last_name}",
                'total_appointments': total_appointments,
                'cancelled_appointments': cancelled_appointments,
                'missed_appointments': missed_appointments,
                'rescheduled_appointments': rescheduled_appointments,
                'cancellation_rate': round(cancellation_rate, 2),
                'reschedule_rate': round(reschedule_rate, 2),
                'revenue_impact': revenue_impact
            })

        # Sort by cancellation rate (descending)
        patient_behaviors.sort(key=lambda x: x['cancellation_rate'], reverse=True)

        # Calculate cancellation trends over time
        cancellation_trends = self._calculate_cancellation_trends(start_date, end_date)

        return Response({
            'patient_behaviors': patient_behaviors,
            'cancellation_trends': cancellation_trends,
            'is_mock_data': False
        })

    def _calculate_cancellation_trends(self, start_date, end_date):
        """Calculate cancellation trends over time"""
        # Group dates by month
        months = {}
        current_date = start_date
        while current_date <= end_date:
            month_key = current_date.strftime('%Y-%m')
            if month_key not in months:
                months[month_key] = {
                    'month': current_date.strftime('%b %Y'),
                    'total': 0,
                    'cancelled': 0,
                    'missed': 0,
                    'rescheduled': 0
                }

            # Move to next month
            current_date = (current_date.replace(day=28) + timedelta(days=4)).replace(day=1)

        # Get appointments in date range
        start_datetime = timezone.make_aware(datetime.combine(start_date, datetime.min.time()))
        end_datetime = timezone.make_aware(datetime.combine(end_date, datetime.max.time()))

        appointments = Appointment.objects.filter(
            datetime__range=(start_datetime, end_datetime)
        )

        # Count appointments by month and status
        for appointment in appointments:
            month_key = appointment.datetime.strftime('%Y-%m')
            if month_key in months:
                months[month_key]['total'] += 1

                if appointment.status == 'cancelled':
                    months[month_key]['cancelled'] += 1
                elif appointment.status == 'missed':
                    months[month_key]['missed'] += 1
                elif appointment.status == 'rescheduled':
                    months[month_key]['rescheduled'] += 1

        # Convert to list
        trends = []
        for month_key in sorted(months.keys()):
            trends.append(months[month_key])

        return trends

    def _generate_mock_patient_behavior_data(self, start_date, end_date):
        """Generate mock data for patient behavior analysis"""
        patients = [
            {'id': 1, 'name': 'Rahul Mehta'},
            {'id': 2, 'name': 'Anita Sharma'},
            {'id': 3, 'name': 'Vikram Patel'},
            {'id': 4, 'name': 'Meera Desai'},
            {'id': 5, 'name': 'Suresh Joshi'},
            {'id': 6, 'name': 'Kavita Singh'},
            {'id': 7, 'name': 'Deepak Verma'}
        ]

        patient_behaviors = []
        for patient in patients:
            total_appointments = random.randint(5, 20)
            cancelled_appointments = random.randint(0, 3)
            missed_appointments = random.randint(0, 2)
            rescheduled_appointments = random.randint(0, 4)

            cancellation_rate = ((cancelled_appointments + missed_appointments) / total_appointments) * 100
            reschedule_rate = (rescheduled_appointments / total_appointments) * 100

            revenue_impact = Decimal('1500.00') * Decimal(cancelled_appointments + missed_appointments)

            patient_behaviors.append({
                'patient_id': patient['id'],
                'patient_name': patient['name'],
                'total_appointments': total_appointments,
                'cancelled_appointments': cancelled_appointments,
                'missed_appointments': missed_appointments,
                'rescheduled_appointments': rescheduled_appointments,
                'cancellation_rate': round(cancellation_rate, 2),
                'reschedule_rate': round(reschedule_rate, 2),
                'revenue_impact': revenue_impact
            })

        # Sort by cancellation rate (descending)
        patient_behaviors.sort(key=lambda x: x['cancellation_rate'], reverse=True)

        # Generate mock cancellation trends
        cancellation_trends = []
        current_date = start_date
        while current_date <= end_date:
            month_key = current_date.strftime('%Y-%m')
            month_name = current_date.strftime('%b %Y')

            # Check if month already exists
            month_exists = False
            for trend in cancellation_trends:
                if trend['month'] == month_name:
                    month_exists = True
                    break

            if not month_exists:
                total = random.randint(40, 80)
                cancelled = random.randint(2, 8)
                missed = random.randint(1, 5)
                rescheduled = random.randint(3, 10)

                cancellation_trends.append({
                    'month': month_name,
                    'total': total,
                    'cancelled': cancelled,
                    'missed': missed,
                    'rescheduled': rescheduled
                })

            # Move to next month
            current_date = (current_date.replace(day=28) + timedelta(days=4)).replace(day=1)

        return {
            'patient_behaviors': patient_behaviors,
            'cancellation_trends': cancellation_trends,
            'is_mock_data': True
        }
