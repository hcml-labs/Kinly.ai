from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.database import Base


class MemberRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    VIEW_ONLY = "view_only"
    ADD_ONLY = "add_only"


class Family(Base):
    __tablename__ = "families"

    family_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    members = relationship("FamilyMember", back_populates="family", cascade="all, delete-orphan")
    children = relationship("Child", back_populates="family", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="family", cascade="all, delete-orphan")


class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    family_id = Column(UUID(as_uuid=True), ForeignKey("families.family_id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    role = Column(Enum(MemberRole), default=MemberRole.ADMIN, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    family = relationship("Family", back_populates="members")
    user = relationship("User", back_populates="family_memberships")
