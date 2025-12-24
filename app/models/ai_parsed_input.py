from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text, Numeric, JSON
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum
from app.database import Base


class SourceType(str, enum.Enum):
    EMAIL = "email"
    IMAGE = "image"
    TEXT = "text"
    VOICE = "voice"


class AIParsedInput(Base):
    __tablename__ = "ai_parsed_inputs"

    parse_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    family_id = Column(UUID(as_uuid=True), ForeignKey("families.family_id"), nullable=False)
    source_type = Column(Enum(SourceType), nullable=False)
    raw_input = Column(Text, nullable=True)
    file_url = Column(String, nullable=True)
    parsed_json = Column(JSON, nullable=True)
    confidence_score = Column(Numeric(3, 2), nullable=True)
    processed = Column(String, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
