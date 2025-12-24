from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.user import User
from app.models.family import Family, FamilyMember, MemberRole
from app.schemas.family import FamilyCreate, FamilyResponse, FamilyMemberInvite, FamilyMemberResponse, FamilyWithMembers
from app.api.deps import get_current_user
from app.services.notification_service import notification_service

router = APIRouter()


@router.post("", response_model=FamilyResponse, status_code=status.HTTP_201_CREATED)
async def create_family(
    family_data: FamilyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_family = Family(
        name=family_data.name,
        created_by=current_user.user_id
    )
    
    db.add(new_family)
    db.flush()
    
    # Add creator as owner
    owner_member = FamilyMember(
        family_id=new_family.family_id,
        user_id=current_user.user_id,
        role=MemberRole.OWNER
    )
    db.add(owner_member)
    
    db.commit()
    db.refresh(new_family)
    
    return new_family


@router.get("", response_model=List[FamilyWithMembers])
async def get_families(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    memberships = db.query(FamilyMember).filter(
        FamilyMember.user_id == current_user.user_id
    ).all()
    
    family_ids = [m.family_id for m in memberships]
    families = db.query(Family).filter(Family.family_id.in_(family_ids)).all()
    
    result = []
    for family in families:
        members = db.query(FamilyMember).filter(
            FamilyMember.family_id == family.family_id
        ).all()
        
        member_responses = []
        for member in members:
            user = db.query(User).filter(User.user_id == member.user_id).first()
            member_responses.append(FamilyMemberResponse(
                id=member.id,
                family_id=member.family_id,
                user_id=member.user_id,
                role=member.role,
                joined_at=member.joined_at,
                user_name=user.name if user else None,
                user_email=user.email if user else None
            ))
        
        result.append(FamilyWithMembers(
            family_id=family.family_id,
            name=family.name,
            created_by=family.created_by,
            created_at=family.created_at,
            members=member_responses
        ))
    
    return result


@router.get("/{family_id}", response_model=FamilyWithMembers)
async def get_family(
    family_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check membership
    membership = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id,
        FamilyMember.user_id == current_user.user_id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this family"
        )
    
    family = db.query(Family).filter(Family.family_id == family_id).first()
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found"
        )
    
    members = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id
    ).all()
    
    member_responses = []
    for member in members:
        user = db.query(User).filter(User.user_id == member.user_id).first()
        member_responses.append(FamilyMemberResponse(
            id=member.id,
            family_id=member.family_id,
            user_id=member.user_id,
            role=member.role,
            joined_at=member.joined_at,
            user_name=user.name if user else None,
            user_email=user.email if user else None
        ))
    
    return FamilyWithMembers(
        family_id=family.family_id,
        name=family.name,
        created_by=family.created_by,
        created_at=family.created_at,
        members=member_responses
    )


@router.put("/{family_id}", response_model=FamilyResponse)
async def update_family(
    family_id: UUID,
    family_data: FamilyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if current user is owner or admin
    membership = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id,
        FamilyMember.user_id == current_user.user_id,
        FamilyMember.role.in_([MemberRole.OWNER, MemberRole.ADMIN])
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners and admins can update family details"
        )
    
    family = db.query(Family).filter(Family.family_id == family_id).first()
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found"
        )
    
    family.name = family_data.name
    db.commit()
    db.refresh(family)
    
    return family


@router.post("/{family_id}/invite", response_model=FamilyMemberResponse)
async def invite_member(
    family_id: UUID,
    invite_data: FamilyMemberInvite,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if current user is owner or admin
    membership = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id,
        FamilyMember.user_id == current_user.user_id,
        FamilyMember.role.in_([MemberRole.OWNER, MemberRole.ADMIN])
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners and admins can invite members"
        )
    
    # Find user by email
    invited_user = db.query(User).filter(User.email == invite_data.email).first()
    if not invited_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email '{invite_data.email}' not found. They need to register first before being added to a family."
        )
    
    # Check if already a member
    existing_member = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id,
        FamilyMember.user_id == invited_user.user_id
    ).first()
    
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this family"
        )
    
    new_member = FamilyMember(
        family_id=family_id,
        user_id=invited_user.user_id,
        role=invite_data.role
    )
    
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    
    # Create notification for existing family members about new member
    await notification_service.create_family_member_notification(
        db, family_id, invited_user.name, current_user.user_id
    )
    
    return FamilyMemberResponse(
        id=new_member.id,
        family_id=new_member.family_id,
        user_id=new_member.user_id,
        role=new_member.role,
        joined_at=new_member.joined_at,
        user_name=invited_user.name,
        user_email=invited_user.email
    )


@router.delete("/{family_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    family_id: UUID,
    member_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if current user is owner
    membership = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id,
        FamilyMember.user_id == current_user.user_id,
        FamilyMember.role == MemberRole.OWNER
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can remove members"
        )
    
    member_to_remove = db.query(FamilyMember).filter(
        FamilyMember.id == member_id,
        FamilyMember.family_id == family_id
    ).first()
    
    if not member_to_remove:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    if member_to_remove.role == MemberRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the owner"
        )
    
    db.delete(member_to_remove)
    db.commit()
