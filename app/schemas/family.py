from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models.family import MemberRole


class FamilyBase(BaseModel):
    name: str


class FamilyCreate(FamilyBase):
    pass


class FamilyResponse(FamilyBase):
    family_id: UUID
    created_by: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class FamilyMemberBase(BaseModel):
    role: MemberRole = MemberRole.ADMIN


class FamilyMemberCreate(FamilyMemberBase):
    email: EmailStr


class FamilyMemberInvite(BaseModel):
    email: EmailStr
    role: MemberRole = MemberRole.VIEW_ONLY


class FamilyMemberResponse(FamilyMemberBase):
    id: UUID
    family_id: UUID
    user_id: UUID
    joined_at: datetime
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    
    class Config:
        from_attributes = True


class FamilyWithMembers(FamilyResponse):
    members: List[FamilyMemberResponse] = []
