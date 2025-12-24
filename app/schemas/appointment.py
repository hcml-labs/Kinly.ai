from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models.appointment import AppointmentCategory, AppointmentStatus


class AppointmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: AppointmentCategory
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    recurrence_rule: Optional[str] = None
    color: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    family_id: UUID
    child_id: Optional[UUID] = None


class AppointmentResponse(AppointmentBase):
    appointment_id: UUID
    family_id: UUID
    child_id: Optional[UUID] = None
    created_by: UUID
    status: AppointmentStatus
    created_at: datetime
    updated_at: datetime
    child_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class AppointmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[AppointmentCategory] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    recurrence_rule: Optional[str] = None
    color: Optional[str] = None
    status: Optional[AppointmentStatus] = None
    child_id: Optional[UUID] = None


class AppointmentNoteCreate(BaseModel):
    note_text: str


class AppointmentNoteResponse(BaseModel):
    note_id: UUID
    appointment_id: UUID
    note_text: str
    created_by: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class DocumentResponse(BaseModel):
    document_id: UUID
    appointment_id: UUID
    file_name: str
    file_url: str
    file_type: str
    uploaded_at: datetime
    
    class Config:
        from_attributes = True


class AppointmentWithDetails(AppointmentResponse):
    notes: List[AppointmentNoteResponse] = []
    documents: List[DocumentResponse] = []


class ConflictCheckResponse(BaseModel):
    has_conflict: bool
    conflicts: List[AppointmentResponse] = []
    message: str
