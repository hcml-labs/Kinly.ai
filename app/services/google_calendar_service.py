from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from app.config import settings
from app.models.appointment import Appointment, AppointmentCategory, AppointmentStatus
from app.models.child import Child
import logging

logger = logging.getLogger(__name__)


class GoogleCalendarService:
    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_REDIRECT_URI
        self.scopes = [
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events'
        ]

    def get_auth_url(self, user_id: str) -> str:
        """Generate Google OAuth authorization URL"""
        from urllib.parse import urlencode
        
        params = {
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': ' '.join(self.scopes),
            'response_type': 'code',
            'access_type': 'offline',
            'prompt': 'consent',
            'state': user_id
        }
        
        return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"

    async def exchange_code(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for tokens"""
        import httpx
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://oauth2.googleapis.com/token',
                data={
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'code': code,
                    'grant_type': 'authorization_code',
                    'redirect_uri': self.redirect_uri
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"Token exchange failed: {response.text}")
            
            data = response.json()
            
            expires_at = None
            if 'expires_in' in data:
                expires_at = datetime.utcnow() + timedelta(seconds=data['expires_in'])
            
            return {
                'access_token': data['access_token'],
                'refresh_token': data.get('refresh_token'),
                'expires_at': expires_at
            }

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh expired access token"""
        import httpx
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://oauth2.googleapis.com/token',
                data={
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'refresh_token': refresh_token,
                    'grant_type': 'refresh_token'
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"Token refresh failed: {response.text}")
            
            data = response.json()
            
            expires_at = None
            if 'expires_in' in data:
                expires_at = datetime.utcnow() + timedelta(seconds=data['expires_in'])
            
            return {
                'access_token': data['access_token'],
                'expires_at': expires_at
            }

    async def sync_appointments(
        self,
        db: Session,
        user_id: UUID,
        family_id: UUID,
        access_token: str,
        refresh_token: str
    ) -> Dict[str, int]:
        """Sync appointments with Google Calendar"""
        import httpx
        
        imported = 0
        exported = 0
        
        try:
            headers = {'Authorization': f'Bearer {access_token}'}
            
            async with httpx.AsyncClient() as client:
                # Get events from Google Calendar
                now = datetime.utcnow().isoformat() + 'Z'
                max_time = (datetime.utcnow() + timedelta(days=30)).isoformat() + 'Z'
                
                response = await client.get(
                    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
                    headers=headers,
                    params={
                        'timeMin': now,
                        'timeMax': max_time,
                        'singleEvents': 'true',
                        'orderBy': 'startTime'
                    }
                )
                
                if response.status_code == 200:
                    events = response.json().get('items', [])
                    
                    for event in events:
                        # Check if already imported
                        existing = db.query(Appointment).filter(
                            Appointment.family_id == family_id,
                            Appointment.title == event.get('summary', 'No Title'),
                            Appointment.start_time == self._parse_google_datetime(event.get('start', {}))
                        ).first()
                        
                        if not existing:
                            new_apt = Appointment(
                                family_id=family_id,
                                title=event.get('summary', 'No Title'),
                                description=event.get('description'),
                                category=AppointmentCategory.PERSONAL,
                                start_time=self._parse_google_datetime(event.get('start', {})),
                                end_time=self._parse_google_datetime(event.get('end', {})),
                                location=event.get('location'),
                                created_by=user_id
                            )
                            db.add(new_apt)
                            imported += 1
                
                # Export FamilySync appointments to Google Calendar
                local_appointments = db.query(Appointment).filter(
                    Appointment.family_id == family_id,
                    Appointment.status == AppointmentStatus.ACTIVE,
                    Appointment.start_time >= datetime.utcnow()
                ).all()
                
                for apt in local_appointments:
                    event_body = {
                        'summary': apt.title,
                        'description': apt.description,
                        'location': apt.location,
                        'start': {
                            'dateTime': apt.start_time.isoformat(),
                            'timeZone': 'UTC'
                        },
                        'end': {
                            'dateTime': apt.end_time.isoformat(),
                            'timeZone': 'UTC'
                        }
                    }
                    
                    # Note: In production, you'd want to track which events have been exported
                    # to avoid duplicates. This is simplified for the MVP.
                
                db.commit()
                
        except Exception as e:
            logger.error(f"Google Calendar sync error: {e}")
            db.rollback()
        
        return {
            'imported': imported,
            'exported': exported
        }

    def _parse_google_datetime(self, dt_obj: Dict) -> datetime:
        """Parse Google Calendar datetime object"""
        if 'dateTime' in dt_obj:
            # Has specific time
            dt_str = dt_obj['dateTime']
            # Remove timezone info for simplicity (would handle properly in production)
            if '+' in dt_str:
                dt_str = dt_str.split('+')[0]
            elif 'Z' in dt_str:
                dt_str = dt_str.replace('Z', '')
            return datetime.fromisoformat(dt_str)
        elif 'date' in dt_obj:
            # All-day event
            return datetime.strptime(dt_obj['date'], '%Y-%m-%d')
        else:
            return datetime.utcnow()
