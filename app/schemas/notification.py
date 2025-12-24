from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.notification import NotificationType


class NotificationBase(BaseModel):
    title: str
    message: str
    notification_type: NotificationType = NotificationType.REMINDER
    notify_at: datetime


class NotificationCreate(NotificationBase):
    appointment_id: Optional[UUID] = None
    user_id: UUID


class NotificationResponse(NotificationBase):
    notification_id: UUID
    appointment_id: Optional[UUID] = None
    user_id: UUID
    sent: bool
    read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class NotificationUpdate(BaseModel):
    read: Optional[bool] = None
