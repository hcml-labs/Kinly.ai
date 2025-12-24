from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models.ai_parsed_input import SourceType
from app.models.appointment import AppointmentCategory


class AIParseRequest(BaseModel):
    source_type: SourceType
    raw_input: Optional[str] = None
    family_id: UUID


class ParsedAppointment(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[AppointmentCategory] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    recurrence_rule: Optional[str] = None
    child_name: Optional[str] = None
    confidence_score: float = 0.0


class AIParseResponse(BaseModel):
    parse_id: UUID
    source_type: SourceType
    parsed_appointments: List[ParsedAppointment]
    raw_input: Optional[str] = None
    overall_confidence: float
    suggestions: List[str] = []


class AIScheduleRequest(BaseModel):
    family_id: UUID
    proposed_appointment: ParsedAppointment


class AIScheduleResponse(BaseModel):
    has_conflicts: bool
    conflicts: List[dict] = []
    suggestions: List[str] = []
    optimal_times: List[datetime] = []


class VoiceInputRequest(BaseModel):
    family_id: UUID
    audio_url: Optional[str] = None
    transcription: Optional[str] = None


class EmailParseRequest(BaseModel):
    family_id: UUID
    email_subject: str
    email_body: str
    sender: Optional[str] = None


class ImageParseRequest(BaseModel):
    family_id: UUID
    image_url: str


class WeeklySummary(BaseModel):
    family_id: UUID
    week_start: datetime
    week_end: datetime
    total_appointments: int
    appointments_by_category: dict
    appointments_by_child: dict
    busiest_day: str
    busiest_day_count: int
    conflicts_detected: int
    suggestions: List[str] = []
