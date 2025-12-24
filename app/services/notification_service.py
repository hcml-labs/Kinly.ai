from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationType
from app.models.appointment import Appointment
from app.models.user import User
from app.models.family import FamilyMember
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    async def create_appointment_reminders(
        self,
        db: Session,
        appointment: Appointment
    ) -> List[Notification]:
        """Create reminder notifications for an appointment"""
        notifications = []
        
        # Get all family members to notify
        members = db.query(FamilyMember).filter(
            FamilyMember.family_id == appointment.family_id
        ).all()
        
        reminder_times = [
            (timedelta(days=1), "1 day before"),
            (timedelta(hours=1), "1 hour before"),
        ]
        
        for member in members:
            for delta, label in reminder_times:
                notify_at = appointment.start_time - delta
                
                # Don't create reminders in the past
                if notify_at <= datetime.utcnow():
                    continue
                
                notification = Notification(
                    appointment_id=appointment.appointment_id,
                    user_id=member.user_id,
                    title=f"Reminder: {appointment.title}",
                    message=f"{label}: {appointment.title} at {appointment.start_time.strftime('%I:%M %p')}",
                    notification_type=NotificationType.REMINDER,
                    notify_at=notify_at
                )
                
                db.add(notification)
                notifications.append(notification)
        
        db.commit()
        return notifications

    async def create_conflict_notification(
        self,
        db: Session,
        user_id: UUID,
        appointment: Appointment,
        conflicting_appointments: List[Appointment]
    ) -> Notification:
        """Create notification for scheduling conflict"""
        conflict_titles = [apt.title for apt in conflicting_appointments[:3]]
        
        notification = Notification(
            appointment_id=appointment.appointment_id,
            user_id=user_id,
            title="Schedule Conflict Detected",
            message=f"'{appointment.title}' conflicts with: {', '.join(conflict_titles)}",
            notification_type=NotificationType.CONFLICT,
            notify_at=datetime.utcnow()
        )
        
        db.add(notification)
        db.commit()
        
        return notification

    async def create_missed_appointment_notification(
        self,
        db: Session,
        appointment: Appointment
    ) -> List[Notification]:
        """Create notification for missed appointment"""
        notifications = []
        
        members = db.query(FamilyMember).filter(
            FamilyMember.family_id == appointment.family_id
        ).all()
        
        for member in members:
            notification = Notification(
                appointment_id=appointment.appointment_id,
                user_id=member.user_id,
                title="Missed Appointment",
                message=f"'{appointment.title}' was scheduled for {appointment.start_time.strftime('%B %d at %I:%M %p')}",
                notification_type=NotificationType.MISSED,
                notify_at=datetime.utcnow()
            )
            
            db.add(notification)
            notifications.append(notification)
        
        db.commit()
        return notifications

    async def send_push_notification(
        self,
        user_id: UUID,
        title: str,
        message: str,
        data: Optional[dict] = None
    ) -> bool:
        """Send push notification via FCM"""
        if not settings.FCM_SERVER_KEY:
            logger.warning("FCM not configured, skipping push notification")
            return False
        
        try:
            import httpx
            
            # In production, you'd look up the user's device token
            # This is a placeholder implementation
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    'https://fcm.googleapis.com/fcm/send',
                    headers={
                        'Authorization': f'key={settings.FCM_SERVER_KEY}',
                        'Content-Type': 'application/json'
                    },
                    json={
                        'notification': {
                            'title': title,
                            'body': message
                        },
                        'data': data or {},
                        # 'to': device_token  # Would need to look this up
                    }
                )
                
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Push notification error: {e}")
            return False

    async def send_email_notification(
        self,
        to_email: str,
        subject: str,
        body: str
    ) -> bool:
        """Send email notification"""
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.warning("SMTP not configured, skipping email notification")
            return False
        
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            msg = MIMEMultipart()
            msg['From'] = settings.EMAIL_FROM
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'html'))
            
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            
            return True
        except Exception as e:
            logger.error(f"Email notification error: {e}")
            return False

    async def create_appointment_update_notification(
        self,
        db: Session,
        appointment: Appointment,
        updated_by: UUID
    ) -> List[Notification]:
        """Create notification for appointment update"""
        notifications = []
        
        members = db.query(FamilyMember).filter(
            FamilyMember.family_id == appointment.family_id
        ).all()
        
        updater = db.query(User).filter(User.user_id == updated_by).first()
        updater_name = updater.name if updater else "Someone"
        
        for member in members:
            # Don't notify the person who made the update
            if member.user_id == updated_by:
                continue
                
            notification = Notification(
                appointment_id=appointment.appointment_id,
                user_id=member.user_id,
                title="Appointment Updated",
                message=f"{updater_name} updated '{appointment.title}' scheduled for {appointment.start_time.strftime('%B %d at %I:%M %p')}",
                notification_type=NotificationType.UPDATE,
                notify_at=datetime.utcnow()
            )
            
            db.add(notification)
            notifications.append(notification)
        
        db.commit()
        return notifications

    async def create_family_member_notification(
        self,
        db: Session,
        family_id: UUID,
        new_member_name: str,
        invited_by: UUID
    ) -> List[Notification]:
        """Create notification for new family member"""
        notifications = []
        
        members = db.query(FamilyMember).filter(
            FamilyMember.family_id == family_id
        ).all()
        
        inviter = db.query(User).filter(User.user_id == invited_by).first()
        inviter_name = inviter.name if inviter else "Someone"
        
        for member in members:
            # Don't notify the person who invited
            if member.user_id == invited_by:
                continue
                
            notification = Notification(
                user_id=member.user_id,
                title="New Family Member",
                message=f"{inviter_name} added {new_member_name} to your family",
                notification_type=NotificationType.FAMILY,
                notify_at=datetime.utcnow()
            )
            
            db.add(notification)
            notifications.append(notification)
        
        db.commit()
        return notifications

    async def check_and_create_missed_notifications(self, db: Session) -> int:
        """Check for missed appointments and create notifications"""
        now = datetime.utcnow()
        
        # Find appointments that ended in the last hour and are still active
        one_hour_ago = now - timedelta(hours=1)
        
        missed_appointments = db.query(Appointment).filter(
            Appointment.end_time < now,
            Appointment.end_time >= one_hour_ago,
            Appointment.status == 'active'
        ).all()
        
        count = 0
        for appointment in missed_appointments:
            # Check if we already created a missed notification
            existing = db.query(Notification).filter(
                Notification.appointment_id == appointment.appointment_id,
                Notification.notification_type == NotificationType.MISSED
            ).first()
            
            if not existing:
                await self.create_missed_appointment_notification(db, appointment)
                count += 1
        
        return count

    async def process_pending_notifications(self, db: Session) -> int:
        """Process and send pending notifications (called by scheduler)"""
        now = datetime.utcnow()
        
        pending = db.query(Notification).filter(
            Notification.sent == False,
            Notification.notify_at <= now
        ).all()
        
        sent_count = 0
        
        for notification in pending:
            user = db.query(User).filter(User.user_id == notification.user_id).first()
            
            if user:
                # Send push notification
                await self.send_push_notification(
                    user_id=user.user_id,
                    title=notification.title,
                    message=notification.message,
                    data={'notification_id': str(notification.notification_id)}
                )
                
                # Send email notification
                await self.send_email_notification(
                    to_email=user.email,
                    subject=notification.title,
                    body=f"<p>{notification.message}</p>"
                )
            
            notification.sent = True
            sent_count += 1
        
        db.commit()
        return sent_count


notification_service = NotificationService()
