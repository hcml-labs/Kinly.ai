from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.database import Base


class NotificationType(str, enum.Enum):
    REMINDER = "reminder"
    CONFLICT = "conflict"
    SUMMARY = "summary"
    MISSED = "missed"
    UPDATE = "update"
    FAMILY = "family"


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.appointment_id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    notification_type = Column(Enum(NotificationType), default=NotificationType.REMINDER, nullable=False)
    notify_at = Column(DateTime, nullable=False)
    sent = Column(Boolean, default=False, nullable=False)
    read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    appointment = relationship("Appointment", back_populates="notifications")
    user = relationship("User", back_populates="notifications")
