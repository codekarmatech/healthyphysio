"""
Purpose: WebSocket consumer for real-time attendance updates
Connected to: Session approval workflow
Methods: check_in, approve_check_in, complete_session
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import Session
from scheduling.models import Appointment

class AttendanceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.session_code = self.scope['url_route']['kwargs']['session_code']
        self.room_group_name = f'attendance_{self.session_code}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        
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
    
    @database_sync_to_async
    def get_session(self):
        try:
            appointment = Appointment.objects.get(session_code=self.session_code)
            session, created = Session.objects.get_or_create(appointment=appointment)
            return session
        except Appointment.DoesNotExist:
            return None
    
    @database_sync_to_async
    def initiate_check_in(self):
        session = self.get_session()
        if session:
            return session.initiate_check_in()
        return False
    
    @database_sync_to_async
    def approve_check_in(self):
        session = self.get_session()
        if session:
            return session.approve_check_in()
        return False
    
    @database_sync_to_async
    def complete_session(self, rating, patient_notes):
        session = self.get_session()
        if session:
            return session.complete_session(rating, patient_notes)
        return False
    
    async def send_status_update(self, success, action_type):
        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'status_update',
                'success': success,
                'action_type': action_type,
                'timestamp': timezone.now().isoformat()
            }
        )
    
    # Receive message from room group
    async def status_update(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'success': event['success'],
            'action_type': event['action_type'],
            'timestamp': event['timestamp']
        }))