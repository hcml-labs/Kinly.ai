from sqlalchemy import Column, String, DateTime, Date, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base


class Child(Base):
    __tablename__ = "children"

    child_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    family_id = Column(UUID(as_uuid=True), ForeignKey("families.family_id"), nullable=False)
    name = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=True)
    school = Column(String, nullable=True)
    grade = Column(String, nullable=True)
    activities = Column(Text, nullable=True)  # JSON string of activities
    medical_notes = Column(Text, nullable=True)  # Non-diagnostic schedule notes
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    family = relationship("Family", back_populates="children")
    appointments = relationship("Appointment", back_populates="child")
