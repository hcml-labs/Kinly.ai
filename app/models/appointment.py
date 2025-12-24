from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.database import Base


class AppointmentCategory(str, enum.Enum):
    SCHOOL = "school"
    HEALTH = "health"
    ACTIVITY = "activity"
    PERSONAL = "personal"


class AppointmentStatus(str, enum.Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class Appointment(Base):
    __tablename__ = "appointments"

    appointment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    family_id = Column(UUID(as_uuid=True), ForeignKey("families.family_id"), nullable=False)
    child_id = Column(UUID(as_uuid=True), ForeignKey("children.child_id"), nullable=True)  # Nullable for family-wide
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(Enum(AppointmentCategory), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    location = Column(String, nullable=True)
    recurrence_rule = Column(Text, nullable=True)  # iCal RRULE format
    color = Column(String, nullable=True)  # Hex color code
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    family = relationship("Family", back_populates="appointments")
    child = relationship("Child", back_populates="appointments")
    created_by_user = relationship("User", back_populates="created_appointments", foreign_keys=[created_by])
    notes = relationship("AppointmentNote", back_populates="appointment", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="appointment", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="appointment", cascade="all, delete-orphan")
