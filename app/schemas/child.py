from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID


class ChildBase(BaseModel):
    name: str
    date_of_birth: Optional[date] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    activities: Optional[str] = None
    medical_notes: Optional[str] = None
    avatar_url: Optional[str] = None


class ChildCreate(ChildBase):
    family_id: UUID


class ChildResponse(ChildBase):
    child_id: UUID
    family_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class ChildUpdate(BaseModel):
    name: Optional[str] = None
    date_of_birth: Optional[date] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    activities: Optional[str] = None
    medical_notes: Optional[str] = None
    avatar_url: Optional[str] = None
