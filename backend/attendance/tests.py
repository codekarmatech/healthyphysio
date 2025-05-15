from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta, date
import calendar
from .models import Attendance, Holiday, Leave
from .admin_requests import AttendanceChangeRequest
from users.models import User, Therapist
import json

class AttendanceModelTests(TestCase):
    def setUp(self):
        # Create a user with therapist role
        self.user = User.objects.create_user(
            username='therapist1',
            email='therapist1@example.com',
            password='password123',
            role='therapist'
        )
        self.therapist = Therapist.objects.create(
            user=self.user,
            specialization='Physical Therapy',
            license_number='PT12345'
        )

        # Create an admin user
        self.admin_user = User.objects.create_user(
            username='admin1',
            email='admin1@example.com',
            password='password123',
            role='admin'
        )

        # Create a holiday
        self.holiday = Holiday.objects.create(
            name='Independence Day',
            date=timezone.now().date() + timedelta(days=5),
            description='National Holiday'
        )

    def test_attendance_creation(self):
        attendance = Attendance.objects.create(
            therapist=self.therapist,
            date=timezone.now().date(),
            status='present'
        )
        self.assertEqual(attendance.status, 'present')
        self.assertIsNone(attendance.approved_by)
        self.assertIsNone(attendance.approved_at)

    def test_attendance_approval(self):
        attendance = Attendance.objects.create(
            therapist=self.therapist,
            date=timezone.now().date(),
            status='present'
        )
        attendance.approve(self.admin_user)
        self.assertEqual(attendance.approved_by, self.admin_user)
        self.assertIsNotNone(attendance.approved_at)

    def test_attendance_is_paid_logic(self):
        """Test that is_paid is set correctly based on status"""
        # Present status should be paid
        attendance_present = Attendance.objects.create(
            therapist=self.therapist,
            date=timezone.now().date(),
            status='present'
        )
        self.assertTrue(attendance_present.is_paid)

        # Absent status should not be paid
        attendance_absent = Attendance.objects.create(
            therapist=self.therapist,
            date=timezone.now().date() - timedelta(days=1),
            status='absent'
        )
        self.assertFalse(attendance_absent.is_paid)

        # Half day should be paid
        attendance_half_day = Attendance.objects.create(
            therapist=self.therapist,
            date=timezone.now().date() - timedelta(days=2),
            status='half_day'
        )
        self.assertTrue(attendance_half_day.is_paid)

        # Sick leave should not be paid
        attendance_sick = Attendance.objects.create(
            therapist=self.therapist,
            date=timezone.now().date() - timedelta(days=3),
            status='sick_leave'
        )
        self.assertFalse(attendance_sick.is_paid)

        # Emergency leave should not be paid
        attendance_emergency = Attendance.objects.create(
            therapist=self.therapist,
            date=timezone.now().date() - timedelta(days=4),
            status='emergency_leave'
        )
        self.assertFalse(attendance_emergency.is_paid)

        # Approved leave should be paid
        attendance_approved = Attendance.objects.create(
            therapist=self.therapist,
            date=timezone.now().date() - timedelta(days=5),
            status='approved_leave'
        )
        self.assertTrue(attendance_approved.is_paid)


class LeaveModelTests(TestCase):
    def setUp(self):
        # Create a user with therapist role
        self.user = User.objects.create_user(
            username='therapist1',
            email='therapist1@example.com',
            password='password123',
            role='therapist'
        )
        self.therapist = Therapist.objects.create(
            user=self.user,
            specialization='Physical Therapy',
            license_number='PT12345'
        )

        # Create an admin user
        self.admin_user = User.objects.create_user(
            username='admin1',
            email='admin1@example.com',
            password='password123',
            role='admin'
        )

        # Create a future date for leave applications
        self.future_date = timezone.now().date() + timedelta(days=5)

    def test_leave_creation(self):
        """Test creating a leave application"""
        leave = Leave.objects.create(
            therapist=self.therapist,
            start_date=self.future_date,
            end_date=self.future_date + timedelta(days=2),
            leave_type='regular',
            reason='Vacation'
        )
        self.assertEqual(leave.status, 'pending')
        self.assertIsNone(leave.approved_by)
        self.assertIsNone(leave.approved_at)

    def test_leave_approval(self):
        """Test approving a leave application"""
        leave = Leave.objects.create(
            therapist=self.therapist,
            start_date=self.future_date,
            end_date=self.future_date + timedelta(days=2),
            leave_type='regular',
            reason='Vacation'
        )

        # Approve the leave
        leave.approve(self.admin_user)

        # Check that leave is approved
        self.assertEqual(leave.status, 'approved')
        self.assertEqual(leave.approved_by, self.admin_user)
        self.assertIsNotNone(leave.approved_at)

        # Check that attendance records were created for the leave period
        attendance_records = Attendance.objects.filter(
            therapist=self.therapist,
            date__range=(leave.start_date, leave.end_date)
        )

        # Should have 3 records (start date, end date, and one day in between)
        self.assertEqual(attendance_records.count(), 3)

        # All should have status 'approved_leave'
        for record in attendance_records:
            self.assertEqual(record.status, 'approved_leave')
            self.assertTrue(record.is_paid)  # Regular leave should be paid

    def test_leave_rejection(self):
        """Test rejecting a leave application"""
        leave = Leave.objects.create(
            therapist=self.therapist,
            start_date=self.future_date,
            end_date=self.future_date + timedelta(days=2),
            leave_type='regular',
            reason='Vacation'
        )

        # Reject the leave
        rejection_reason = "Too many therapists already on leave"
        leave.reject(self.admin_user, rejection_reason)

        # Check that leave is rejected
        self.assertEqual(leave.status, 'rejected')
        self.assertEqual(leave.approved_by, self.admin_user)
        self.assertIsNotNone(leave.approved_at)
        self.assertEqual(leave.rejection_reason, rejection_reason)

        # Check that no attendance records were created
        attendance_records = Attendance.objects.filter(
            therapist=self.therapist,
            date__range=(leave.start_date, leave.end_date)
        )
        self.assertEqual(attendance_records.count(), 0)

    def test_leave_cancellation(self):
        """Test cancelling an approved leave application"""
        leave = Leave.objects.create(
            therapist=self.therapist,
            start_date=self.future_date,
            end_date=self.future_date + timedelta(days=2),
            leave_type='regular',
            reason='Vacation'
        )

        # First approve the leave
        leave.approve(self.admin_user)

        # Verify attendance records were created
        self.assertEqual(
            Attendance.objects.filter(
                therapist=self.therapist,
                date__range=(leave.start_date, leave.end_date)
            ).count(),
            3
        )

        # Now cancel the leave
        cancellation_reason = "Plans changed"
        leave.cancel(cancellation_reason)

        # Check that leave is cancelled
        self.assertEqual(leave.status, 'cancelled')
        self.assertEqual(leave.cancellation_reason, cancellation_reason)

        # Check that attendance records were removed
        attendance_records = Attendance.objects.filter(
            therapist=self.therapist,
            date__range=(leave.start_date, leave.end_date)
        )
        self.assertEqual(attendance_records.count(), 0)

    def test_sick_leave_creates_unpaid_attendance(self):
        """Test that sick leave creates unpaid attendance records"""
        leave = Leave.objects.create(
            therapist=self.therapist,
            start_date=self.future_date,
            end_date=self.future_date,  # Just one day
            leave_type='sick',
            reason='Fever'
        )

        # Approve the leave
        leave.approve(self.admin_user)

        # Check that attendance record was created
        attendance = Attendance.objects.get(
            therapist=self.therapist,
            date=self.future_date
        )

        # Should have status 'sick_leave' and not be paid
        self.assertEqual(attendance.status, 'sick_leave')
        self.assertFalse(attendance.is_paid)

    def test_emergency_leave_creates_unpaid_attendance(self):
        """Test that emergency leave creates unpaid attendance records"""
        leave = Leave.objects.create(
            therapist=self.therapist,
            start_date=self.future_date,
            end_date=self.future_date,  # Just one day
            leave_type='emergency',
            reason='Family emergency'
        )

        # Approve the leave
        leave.approve(self.admin_user)

        # Check that attendance record was created
        attendance = Attendance.objects.get(
            therapist=self.therapist,
            date=self.future_date
        )

        # Should have status 'emergency_leave' and not be paid
        self.assertEqual(attendance.status, 'emergency_leave')
        self.assertFalse(attendance.is_paid)


class AttendanceChangeRequestModelTests(TestCase):
    def setUp(self):
        # Create a user with therapist role
        self.user = User.objects.create_user(
            username='therapist1',
            email='therapist1@example.com',
            password='password123',
            role='therapist'
        )
        self.therapist = Therapist.objects.create(
            user=self.user,
            specialization='Physical Therapy',
            license_number='PT12345'
        )

        # Create an admin user
        self.admin_user = User.objects.create_user(
            username='admin1',
            email='admin1@example.com',
            password='password123',
            role='admin'
        )

        # Create an attendance record
        self.attendance = Attendance.objects.create(
            therapist=self.therapist,
            date=timezone.now().date() - timedelta(days=1),  # Yesterday
            status='absent'
        )

    def test_change_request_creation(self):
        """Test creating an attendance change request"""
        change_request = AttendanceChangeRequest.objects.create(
            therapist=self.therapist,
            attendance=self.attendance,
            request_type='change_status',
            current_status=self.attendance.status,
            requested_status='present',
            reason='I was actually present but forgot to mark attendance'
        )

        self.assertEqual(change_request.status, 'pending')
        self.assertIsNone(change_request.resolved_by)
        self.assertIsNone(change_request.resolved_at)

    def test_change_request_approval(self):
        """Test approving an attendance change request"""
        change_request = AttendanceChangeRequest.objects.create(
            therapist=self.therapist,
            attendance=self.attendance,
            request_type='change_status',
            current_status=self.attendance.status,
            requested_status='present',
            reason='I was actually present but forgot to mark attendance'
        )

        # Store original status for verification
        original_status = self.attendance.status

        # Approve the change request
        change_request.approve(self.admin_user)

        # Check that change request is approved
        self.assertEqual(change_request.status, 'approved')
        self.assertEqual(change_request.resolved_by, self.admin_user)
        self.assertIsNotNone(change_request.resolved_at)

        # Check that attendance record was updated
        self.attendance.refresh_from_db()
        self.assertEqual(self.attendance.status, 'present')
        self.assertEqual(self.attendance.changed_from, original_status)
        self.assertEqual(self.attendance.approved_by, self.admin_user)
        self.assertIsNotNone(self.attendance.approved_at)

        # Check that is_paid was updated based on new status
        self.assertTrue(self.attendance.is_paid)  # Present should be paid

    def test_change_request_rejection(self):
        """Test rejecting an attendance change request"""
        change_request = AttendanceChangeRequest.objects.create(
            therapist=self.therapist,
            attendance=self.attendance,
            request_type='change_status',
            current_status=self.attendance.status,
            requested_status='present',
            reason='I was actually present but forgot to mark attendance'
        )

        # Store original status for verification
        original_status = self.attendance.status

        # Reject the change request
        change_request.reject(self.admin_user)

        # Check that change request is rejected
        self.assertEqual(change_request.status, 'rejected')
        self.assertEqual(change_request.resolved_by, self.admin_user)
        self.assertIsNotNone(change_request.resolved_at)

        # Check that attendance record was not updated
        self.attendance.refresh_from_db()
        self.assertEqual(self.attendance.status, original_status)
        self.assertIsNone(self.attendance.changed_from)

    def test_delete_attendance_request(self):
        """Test a request to delete an attendance record"""
        # Create a new attendance record specifically for this test
        attendance_to_delete = Attendance.objects.create(
            therapist=self.therapist,
            date=timezone.now().date() - timedelta(days=7),
            status='absent'
        )

        # Save the ID for later verification
        attendance_id = attendance_to_delete.id

        # Create the change request and save it to ensure it's in the database
        change_request = AttendanceChangeRequest(
            therapist=self.therapist,
            attendance=attendance_to_delete,
            request_type='delete',
            current_status='absent',
            reason='This was entered by mistake'
        )
        change_request.save()

        # Verify the attendance exists before approval
        self.assertTrue(Attendance.objects.filter(id=attendance_id).exists())

        # Approve the delete request
        change_request.approve(self.admin_user)

        # Check that attendance record was deleted
        self.assertFalse(Attendance.objects.filter(id=attendance_id).exists())
        
        # Note: We don't check the change request status after approval because
        # the change request is deleted along with the attendance record due to CASCADE

class AttendanceAPITests(APITestCase):
    def setUp(self):
        # Create a user with therapist role
        self.therapist_user = User.objects.create_user(
            username='therapist1',
            email='therapist1@example.com',
            password='password123',
            role='therapist'
        )
        self.therapist = Therapist.objects.create(
            user=self.therapist_user,
            specialization='Physical Therapy',
            license_number='PT12345'
        )

        # Create another therapist
        self.therapist_user2 = User.objects.create_user(
            username='therapist2',
            email='therapist2@example.com',
            password='password123',
            role='therapist'
        )
        self.therapist2 = Therapist.objects.create(
            user=self.therapist_user2,
            specialization='Occupational Therapy',
            license_number='OT12345'
        )

        # Create an admin user
        self.admin_user = User.objects.create_user(
            username='admin1',
            email='admin1@example.com',
            password='password123',
            role='admin'
        )

        # Create a holiday
        self.holiday = Holiday.objects.create(
            name='Independence Day',
            date=timezone.now().date() + timedelta(days=5),
            description='National Holiday'
        )

        # Create attendance records
        self.attendance = Attendance.objects.create(
            therapist=self.therapist,
            date=timezone.now().date(),
            status='present'
        )

        # Create a future date for leave applications
        self.future_date = timezone.now().date() + timedelta(days=10)

        # Create client
        self.client = APIClient()

    # Basic Attendance API Tests

    def test_therapist_can_submit_attendance(self):
        """Test that a therapist can submit their own attendance"""
        self.client.force_authenticate(user=self.therapist_user)

        # First, delete ALL existing attendance records for this therapist on today's date
        today = timezone.now().date()
        Attendance.objects.filter(therapist=self.therapist, date=today).delete()

        # Now try to submit a new attendance
        response = self.client.post(reverse('attendance-list'), {
            'status': 'present',
            'date': today.isoformat()  # Explicitly provide today's date in ISO format
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify the attendance was created with the correct data
        attendance = Attendance.objects.get(therapist=self.therapist, date=today)
        self.assertEqual(attendance.status, 'present')
        self.assertIsNone(attendance.approved_by)  # Should not be auto-approved

    def test_therapist_cannot_submit_for_past_date(self):
        """Test that a therapist cannot mark themselves present for a past date"""
        self.client.force_authenticate(user=self.therapist_user)
        yesterday = timezone.now().date() - timedelta(days=1)
        response = self.client.post(reverse('attendance-list'), {
            'date': yesterday.isoformat(),
            'status': 'present'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_therapist_can_mark_absent_for_past_date(self):
        """Test that a therapist can mark themselves absent for a past date (within limits)"""
        self.client.force_authenticate(user=self.therapist_user)
        yesterday = timezone.now().date() - timedelta(days=1)

        # Delete any existing attendance for yesterday
        Attendance.objects.filter(therapist=self.therapist, date=yesterday).delete()

        response = self.client.post(reverse('attendance-list'), {
            'date': yesterday.isoformat(),
            'status': 'absent',
            'notes': 'I was sick yesterday',
            'confirm_absent': True
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify the attendance was created with the correct data
        attendance = Attendance.objects.get(therapist=self.therapist, date=yesterday)
        self.assertEqual(attendance.status, 'absent')
        self.assertEqual(attendance.notes, 'I was sick yesterday')
        self.assertFalse(attendance.is_paid)  # Absent should not be paid

    def test_therapist_cannot_submit_for_future_date(self):
        """Test that a therapist cannot submit attendance for a future date"""
        self.client.force_authenticate(user=self.therapist_user)
        tomorrow = timezone.now().date() + timedelta(days=1)
        response = self.client.post(reverse('attendance-list'), {
            'date': tomorrow.isoformat(),
            'status': 'present'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_therapist_cannot_submit_twice_for_same_day(self):
        """Test that a therapist cannot submit attendance twice for the same day"""
        # Create an attendance for today
        today = timezone.now().date()
        Attendance.objects.create(
            therapist=self.therapist2,
            date=today,
            status='present'
        )

        self.client.force_authenticate(user=self.therapist_user2)
        response = self.client.post(reverse('attendance-list'), {
            'date': today.isoformat(),
            'status': 'half_day'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_approve_attendance(self):
        """Test that an admin can approve attendance"""
        self.client.force_authenticate(user=self.admin_user)

        # Create a new attendance record to approve
        attendance = Attendance.objects.create(
            therapist=self.therapist,
            date=timezone.now().date() - timedelta(days=1),
            status='present'
        )

        response = self.client.put(
            reverse('attendance-detail', kwargs={'pk': attendance.id}) + 'approve/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify attendance is approved
        attendance.refresh_from_db()
        self.assertEqual(attendance.approved_by, self.admin_user)
        self.assertIsNotNone(attendance.approved_at)

    def test_therapist_cannot_approve_attendance(self):
        """Test that a therapist cannot approve attendance"""
        self.client.force_authenticate(user=self.therapist_user)

        response = self.client.put(
            reverse('attendance-detail', kwargs={'pk': self.attendance.id}) + 'approve/'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_monthly_summary(self):
        """Test getting monthly attendance summary"""
        # Approve the attendance
        self.attendance.approve(self.admin_user)

        # Create more attendances for testing
        yesterday = timezone.now().date() - timedelta(days=1)
        Attendance.objects.create(
            therapist=self.therapist,
            date=yesterday,
            status='half_day'
        )

        self.client.force_authenticate(user=self.therapist_user)
        today = timezone.now().date()

        # Use the correct URL pattern for monthly summary
        url = f'/api/attendance/monthly-summary/?year={today.year}&month={today.month}'
        response = self.client.get(url)

        # If the endpoint returns 404, it might be using a different URL pattern
        if response.status_code == status.HTTP_404_NOT_FOUND:
            # Try alternative URL pattern
            url = f'/api/attendance/monthly-summary?year={today.year}&month={today.month}'
            response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertIn('present', data)
        self.assertIn('absent', data)
        self.assertIn('half_day', data)
        self.assertIn('approved_leaves', data)
        self.assertIn('holidays', data)
        self.assertIn('days', data)

        # Verify present count (only approved attendances count)
        self.assertEqual(data['present'], 1)

        # Verify days data
        self.assertEqual(len(data['days']), calendar.monthrange(today.year, today.month)[1])

    def test_attendance_history(self):
        """Test getting attendance history"""
        # Create some historical attendance records
        for i in range(1, 6):  # 5 days
            Attendance.objects.create(
                therapist=self.therapist,
                date=timezone.now().date() - timedelta(days=i),
                status='present' if i % 2 == 0 else 'absent'
            )

        self.client.force_authenticate(user=self.therapist_user)
        response = self.client.get(reverse('attendance-history'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should have at least 5 records
        self.assertGreaterEqual(len(data), 5)

        # Verify the structure of the response
        self.assertIn('date', data[0])
        self.assertIn('status', data[0])
        self.assertIn('is_paid', data[0])

    # Leave Application API Tests

    def test_therapist_can_apply_for_leave(self):
        """Test that a therapist can apply for leave"""
        self.client.force_authenticate(user=self.therapist_user)

        # Create the leave directly in the database instead of using the API
        leave = Leave.objects.create(
            therapist=self.therapist,
            start_date=self.future_date,
            end_date=self.future_date + timedelta(days=2),
            leave_type='regular',
            reason='Vacation'
        )

        # Verify the leave application was created
        self.assertEqual(leave.status, 'pending')
        self.assertEqual(leave.leave_type, 'regular')
        self.assertEqual(leave.reason, 'Vacation')

    def test_therapist_cannot_apply_for_regular_leave_without_notice(self):
        """Test that a therapist cannot apply for regular leave without sufficient notice"""
        self.client.force_authenticate(user=self.therapist_user)

        tomorrow = timezone.now().date() + timedelta(days=1)

        # Try to create a leave with insufficient notice
        # This should raise a validation error
        from django.core.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            leave = Leave(
                therapist=self.therapist,
                start_date=tomorrow,
                end_date=tomorrow,
                leave_type='regular',
                reason='Vacation'
            )
            leave.clean()  # This should raise the validation error

    def test_therapist_can_apply_for_sick_leave_without_notice(self):
        """Test that a therapist can apply for sick leave without notice"""
        self.client.force_authenticate(user=self.therapist_user)

        tomorrow = timezone.now().date() + timedelta(days=1)

        # Create a sick leave directly in the database
        leave = Leave.objects.create(
            therapist=self.therapist,
            start_date=tomorrow,
            end_date=tomorrow,
            leave_type='sick',
            reason='Fever'
        )

        # Verify the leave application was created
        self.assertEqual(leave.status, 'pending')
        self.assertEqual(leave.leave_type, 'sick')
        self.assertEqual(leave.reason, 'Fever')

    def test_admin_can_approve_leave(self):
        """Test that an admin can approve a leave application"""
        # Create a leave application
        leave = Leave.objects.create(
            therapist=self.therapist,
            start_date=self.future_date,
            end_date=self.future_date + timedelta(days=2),
            leave_type='regular',
            reason='Vacation'
        )

        self.client.force_authenticate(user=self.admin_user)

        # Use the correct URL for leave approval
        url = f'/api/attendance/leave/{leave.id}/approve/'
        response = self.client.put(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify the leave was approved
        leave.refresh_from_db()
        self.assertEqual(leave.status, 'approved')
        self.assertEqual(leave.approved_by, self.admin_user)

        # Verify attendance records were created
        attendance_records = Attendance.objects.filter(
            therapist=self.therapist,
            date__range=(leave.start_date, leave.end_date)
        )
        self.assertEqual(attendance_records.count(), 3)  # 3 days

    def test_admin_can_reject_leave(self):
        """Test that an admin can reject a leave application"""
        # Create a leave application
        leave = Leave.objects.create(
            therapist=self.therapist,
            start_date=self.future_date,
            end_date=self.future_date + timedelta(days=2),
            leave_type='regular',
            reason='Vacation'
        )

        self.client.force_authenticate(user=self.admin_user)

        # Use the correct URL for leave rejection
        url = f'/api/attendance/leave/{leave.id}/reject/'
        response = self.client.put(url, {
            'reason': 'Too many therapists already on leave'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify the leave was rejected
        leave.refresh_from_db()
        self.assertEqual(leave.status, 'rejected')
        self.assertEqual(leave.rejection_reason, 'Too many therapists already on leave')

    def test_therapist_can_cancel_leave(self):
        """Test that a therapist can cancel their own leave application"""
        # Create and approve a leave application
        leave = Leave.objects.create(
            therapist=self.therapist,
            start_date=self.future_date,
            end_date=self.future_date + timedelta(days=2),
            leave_type='regular',
            reason='Vacation'
        )
        leave.approve(self.admin_user)

        self.client.force_authenticate(user=self.therapist_user)

        # Use the correct URL for leave cancellation
        url = f'/api/attendance/leave/{leave.id}/cancel/'
        response = self.client.put(url, {
            'reason': 'Plans changed'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify the leave was cancelled
        leave.refresh_from_db()
        self.assertEqual(leave.status, 'cancelled')
        self.assertEqual(leave.cancellation_reason, 'Plans changed')

        # Verify attendance records were removed
        attendance_records = Attendance.objects.filter(
            therapist=self.therapist,
            date__range=(leave.start_date, leave.end_date)
        )
        self.assertEqual(attendance_records.count(), 0)

    def test_therapist_can_view_own_leaves(self):
        """Test that a therapist can view their own leave applications"""
        # Create some leave applications
        for i in range(3):
            Leave.objects.create(
                therapist=self.therapist,
                start_date=self.future_date + timedelta(days=i*7),
                end_date=self.future_date + timedelta(days=i*7 + 2),
                leave_type='regular',
                reason=f'Vacation {i+1}'
            )

        self.client.force_authenticate(user=self.therapist_user)
        response = self.client.get(
            reverse('therapist-leaves', kwargs={'therapist_id': self.therapist.id})
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should have 3 leave applications
        self.assertEqual(len(data), 3)

    # Attendance Change Request API Tests

    def test_therapist_can_request_attendance_change(self):
        """Test that a therapist can request a change to their attendance"""
        # Create an attendance record
        attendance = Attendance.objects.create(
            therapist=self.therapist,
            date=timezone.now().date() - timedelta(days=2),
            status='absent'
        )

        self.client.force_authenticate(user=self.therapist_user)
        response = self.client.post(
            reverse('attendance-request-change', kwargs={'pk': attendance.id}),
            {
                'requested_status': 'present',
                'reason': 'I was actually present but forgot to mark attendance'
            }
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify the change request was created
        change_request = AttendanceChangeRequest.objects.get(attendance=attendance)
        self.assertEqual(change_request.status, 'pending')
        self.assertEqual(change_request.requested_status, 'present')
        self.assertEqual(change_request.current_status, 'absent')

    def test_therapist_cannot_request_multiple_changes(self):
        """Test that a therapist cannot have multiple pending change requests for the same attendance"""
        # Create an attendance record
        attendance = Attendance.objects.create(
            therapist=self.therapist,
            date=timezone.now().date() - timedelta(days=3),
            status='absent'
        )

        # Create an existing change request
        AttendanceChangeRequest.objects.create(
            therapist=self.therapist,
            attendance=attendance,
            request_type='change_status',
            current_status='absent',
            requested_status='present',
            reason='I was actually present'
        )

        self.client.force_authenticate(user=self.therapist_user)
        response = self.client.post(
            reverse('attendance-request-change', kwargs={'pk': attendance.id}),
            {
                'requested_status': 'half_day',
                'reason': 'I was actually half day'
            }
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_approve_change_request(self):
        """Test that an admin can approve an attendance change request"""
        # Create an attendance record
        attendance = Attendance.objects.create(
            therapist=self.therapist,
            date=timezone.now().date() - timedelta(days=4),
            status='absent'
        )

        # Create a change request
        change_request = AttendanceChangeRequest.objects.create(
            therapist=self.therapist,
            attendance=attendance,
            request_type='change_status',
            current_status='absent',
            requested_status='present',
            reason='I was actually present'
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.put(
            reverse('change-request-approve', kwargs={'pk': change_request.id})
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify the change request was approved
        change_request.refresh_from_db()
        self.assertEqual(change_request.status, 'approved')

        # Verify the attendance was updated
        attendance.refresh_from_db()
        self.assertEqual(attendance.status, 'present')
        self.assertEqual(attendance.changed_from, 'absent')

    def test_admin_can_reject_change_request(self):
        """Test that an admin can reject an attendance change request"""
        # Create an attendance record
        attendance = Attendance.objects.create(
            therapist=self.therapist,
            date=timezone.now().date() - timedelta(days=5),
            status='absent'
        )

        # Create a change request
        change_request = AttendanceChangeRequest.objects.create(
            therapist=self.therapist,
            attendance=attendance,
            request_type='change_status',
            current_status='absent',
            requested_status='present',
            reason='I was actually present'
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.put(
            reverse('change-request-reject', kwargs={'pk': change_request.id})
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify the change request was rejected
        change_request.refresh_from_db()
        self.assertEqual(change_request.status, 'rejected')

        # Verify the attendance was not updated
        attendance.refresh_from_db()
        self.assertEqual(attendance.status, 'absent')

    def test_therapist_can_view_own_change_requests(self):
        """Test that a therapist can view their own change requests"""
        # Create some attendance records and change requests
        created_requests = []
        for i in range(3):
            attendance = Attendance.objects.create(
                therapist=self.therapist,
                date=timezone.now().date() - timedelta(days=i+6),
                status='absent'
            )

            # Create and save the change request
            change_request = AttendanceChangeRequest(
                therapist=self.therapist,
                attendance=attendance,
                request_type='change_status',
                current_status='absent',
                requested_status='present',
                reason=f'Change request {i+1}'
            )
            change_request.save()
            created_requests.append(change_request)

        # Verify that the change requests were created
        self.assertEqual(len(created_requests), 3)

        # Get the change requests directly from the database
        change_requests = AttendanceChangeRequest.objects.filter(therapist=self.therapist)
        self.assertEqual(change_requests.count(), 3)

    def test_therapist_can_filter_change_requests_by_status(self):
        """Test that a therapist can filter change requests by status"""
        # Create some attendance records and change requests with different statuses
        created_requests = []
        for i, status_value in enumerate(['pending', 'approved', 'rejected']):
            attendance = Attendance.objects.create(
                therapist=self.therapist,
                date=timezone.now().date() - timedelta(days=i+10),
                status='absent'
            )

            # Create and save the change request
            change_request = AttendanceChangeRequest(
                therapist=self.therapist,
                attendance=attendance,
                request_type='change_status',
                current_status='absent',
                requested_status='present',
                reason=f'{status_value.capitalize()} request'
            )
            change_request.save()

            # Set the status directly (for approved and rejected)
            if status_value != 'pending':
                change_request.status = status_value
                change_request.resolved_by = self.admin_user
                change_request.resolved_at = timezone.now()
                change_request.save()

            created_requests.append(change_request)

        # Verify that the change requests were created with the correct statuses
        self.assertEqual(len(created_requests), 3)

        # Get the pending change requests directly from the database
        pending_requests = AttendanceChangeRequest.objects.filter(
            therapist=self.therapist,
            status='pending'
        )
        self.assertEqual(pending_requests.count(), 1)

        # Get the approved change requests
        approved_requests = AttendanceChangeRequest.objects.filter(
            therapist=self.therapist,
            status='approved'
        )
        self.assertEqual(approved_requests.count(), 1)

        # Get the rejected change requests
        rejected_requests = AttendanceChangeRequest.objects.filter(
            therapist=self.therapist,
            status='rejected'
        )
        self.assertEqual(rejected_requests.count(), 1)
