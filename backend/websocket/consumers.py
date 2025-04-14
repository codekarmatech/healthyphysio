"""
Purpose: WebSocket consumers for real-time updates
Connected Endpoints: ws://localhost:8000/ws/attendance/
Validation: Authentication, session validation
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from django.contrib.auth import get_user_model
from scheduling.models import Appointment
from attendance.models import Session

User = get_user_model()

class AttendanceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.session_code = self.scope['url_route']['kwargs']['session_code']
        self.room_group_name = f'attendance_{self.session_code}'
        
        # Get user from scope
        self.user = self.scope.get('user')
        
        # Check if user is authenticated
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return
        
        # Check if session exists and user has permission
        session_exists = await self.check_session_permission()
        if not session_exists:
            await self.close()
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        # Accept the connection
        await self.accept()
        
        # Send initial state
        session_data = await self.get_session_data()
        await self.send(text_data=json.dumps({
            'type': 'session_state',
            'data': session_data
        }))
        
        # Log connection
        await self.log_connection()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        # Log disconnection
        await self.log_disconnection(close_code)
    
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get('action')
            
            # Log received action
            await self.log_action(action, data)
            
            if action == 'initiate_check_in':
                success = await self.initiate_check_in()
                await self.send_status_update(success, 'check_in_initiated')
            
            elif action == 'approve_check_in':
                success = await self.approve_check_in()
                await self.send_status_update(success, 'check_in_approved')
            
            elif action == 'complete_session':
                rating = data.get('rating')
                patient_notes = data.get('patient_notes', '')
                success = await self.complete_session(rating, patient_notes)
                await self.send_status_update(success, 'session_completed')
            
            elif action == 'cancel_session':
                reason = data.get('reason', '')
                success = await self.cancel_session(reason)
                await self.send_status_update(success, 'session_cancelled')
            
            else:
                await self.send(text_data=json.dumps({
                    'error': 'Unknown action',
                    'action': action
                }))
        
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'error': 'Invalid JSON'
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'error': str(e)
            }))
    
    @database_sync_to_async
    def check_session_permission(self):
        """Check if session exists and user has permission to access it"""
        try:
            appointment = Appointment.objects.get(session_code=self.session_code)
            
            # Check if user has permission
            if self.user.is_superuser or self.user.role == 'admin':
                return True
            
            if self.user.role == 'therapist':
                return hasattr(self.user, 'therapist_profile') and appointment.therapist.user == self.user
            
            if self.user.role == 'patient':
                return hasattr(self.user, 'patient_profile') and appointment.patient.user == self.user
            
            return False
        
        except Appointment.DoesNotExist:
            return False
    
    @database_sync_to_async
    def get_session_data(self):
        """Get session data for initial state"""
        try:
            appointment = Appointment.objects.get(session_code=self.session_code)
            session, created = Session.objects.get_or_create(appointment=appointment)
            
            return {
                'session_code': self.session_code,
                'status': session.status,
                'check_in': session.check_in.isoformat() if session.check_in else None,
                'check_out': session.check_out.isoformat() if session.check_out else None,
                'patient': {
                    'id': appointment.patient.user.id,
                    'name': appointment.patient.user.get_full_name() or appointment.patient.user.username
                },
                'therapist': {
                    'id': appointment.therapist.user.id,
                    'name': appointment.therapist.user.get_full_name() or appointment.therapist.user.username
                },
                'datetime': appointment.datetime.isoformat(),
                'duration_minutes': appointment.duration_minutes
            }
        
        except (Appointment.DoesNotExist, Session.DoesNotExist):
            return {}
    
    @database_sync_to_async
    def initiate_check_in(self):
        """Therapist initiates check-in"""
        try:
            appointment = Appointment.objects.get(session_code=self.session_code)
            
            # Check if user is the therapist
            if not (self.user.role == 'therapist' and appointment.therapist.user == self.user):
                return False
            
            session, created = Session.objects.get_or_create(appointment=appointment)
            return session.initiate_check_in()
        
        except Appointment.DoesNotExist:
            return False
    
    @database_sync_to_async
    def approve_check_in(self):
        """Patient approves check-in"""
        try:
            appointment = Appointment.objects.get(session_code=self.session_code)
            
            # Check if user is the patient
            if not (self.user.role == 'patient' and appointment.patient.user == self.user):
                return False
            
            session = Session.objects.get(appointment=appointment)
            return session.approve_check_in()
        
        except (Appointment.DoesNotExist, Session.DoesNotExist):
            return False
    
    @database_sync_to_async
    def complete_session(self, rating, patient_notes):
        """Complete the session"""
        try:
            appointment = Appointment.objects.get(session_code=self.session_code)
            
            # Check if user is the therapist
            if not (self.user.role == 'therapist' and appointment.therapist.user == self.user):
                return False
            
            session = Session.objects.get(appointment=appointment)
            return session.complete_session(rating, patient_notes)
        
        except (Appointment.DoesNotExist, Session.DoesNotExist):
            return False
    
    @database_sync_to_async
    def cancel_session(self, reason):
        """Cancel the session"""
        try:
            appointment = Appointment.objects.get(session_code=self.session_code)
            
            # Check if user has permission
            is_therapist = self.user.role == 'therapist' and appointment.therapist.user == self.user
            is_patient = self.user.role == 'patient' and appointment.patient.user == self.user
            is_admin = self.user.is_superuser or self.user.role == 'admin'
            
            if not (is_therapist or is_patient or is_admin):
                return False
            
            session = Session.objects.get(appointment=appointment)
            
            # Update appointment status
            appointment.status = 'cancelled'
            appointment.notes += f"\nCancelled by {self.user.get_full_name() or self.user.username}: {reason}"
            appointment.save()
            
            # Update session status
            session.status = 'cancelled'
            session.save()
            
            return True
        
        except (Appointment.DoesNotExist, Session.DoesNotExist):
            return False
    
    async def send_status_update(self, success, action_type):
        """Send status update to room group"""
        # Get updated session data
        session_data = await self.get_session_data()
        
        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'status_update',
                'success': success,
                'action_type': action_type,
                'timestamp': timezone.now().isoformat(),
                'session_data': session_data,
                'user_id': self.user.id,
                'user_name': self.user.get_full_name() or self.user.username
            }
        )
    
    # Receive message from room group
    async def status_update(self, event):
        """Send status update to WebSocket"""
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'status_update',
            'success': event['success'],
            'action_type': event['action_type'],
            'timestamp': event['timestamp'],
            'session_data': event['session_data'],
            'user_id': event['user_id'],
            'user_name': event['user_name']
        }))
    
    @database_sync_to_async
    def log_connection(self):
        """Log WebSocket connection"""
        from audit_logs.models import AuditLog
        
        AuditLog.objects.create(
            user=self.user,
            action='ACCESS',
            model_name='WebSocket',
            object_id=self.session_code,
            object_repr=f"WebSocket connection to {self.session_code}",
            new_state={
                'session_code': self.session_code,
                'connection_time': timezone.now().isoformat()
            },
            ip_address=self.scope.get('client')[0] if self.scope.get('client') else None,
            user_agent=self.scope.get('headers', {}).get(b'user-agent', b'').decode('utf-8', 'ignore')
        )
    
    @database_sync_to_async
    def log_disconnection(self, close_code):
        """Log WebSocket disconnection"""
        from audit_logs.models import AuditLog
        
        AuditLog.objects.create(
            user=self.user,
            action='ACCESS',
            model_name='WebSocket',
            object_id=self.session_code,
            object_repr=f"WebSocket disconnection from {self.session_code}",
            new_state={
                'session_code': self.session_code,
                'disconnection_time': timezone.now().isoformat(),
                'close_code': close_code
            },
            ip_address=self.scope.get('client')[0] if self.scope.get('client') else None,
            user_agent=self.scope.get('headers', {}).get(b'user-agent', b'').decode('utf-8', 'ignore')
        )
    
    @database_sync_to_async
    def log_action(self, action, data):
        """Log WebSocket action"""
        from audit_logs.models import AuditLog
        
        AuditLog.objects.create(
            user=self.user,
            action='ACCESS',
            model_name='WebSocket',
            object_id=self.session_code,
            object_repr=f"WebSocket action: {action}",
            new_state={
                'session_code': self.session_code,
                'action': action,
                'data': {k: v for k, v in data.items() if k != 'password'}  # Exclude sensitive data
            },
            ip_address=self.scope.get('client')[0] if self.scope.get('client') else None,
            user_agent=self.scope.get('headers', {}).get(b'user-agent', b'').decode('utf-8', 'ignore')
        )