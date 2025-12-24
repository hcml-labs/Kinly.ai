from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.user import User
from app.models.family import FamilyMember
from app.models.child import Child
from app.schemas.child import ChildCreate, ChildResponse, ChildUpdate
from app.api.deps import get_current_user

router = APIRouter()


def check_family_access(db: Session, user_id: UUID, family_id: UUID) -> bool:
    membership = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id,
        FamilyMember.user_id == user_id
    ).first()
    return membership is not None


@router.post("", response_model=ChildResponse, status_code=status.HTTP_201_CREATED)
async def create_child(
    child_data: ChildCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not check_family_access(db, current_user.user_id, child_data.family_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this family"
        )
    
    new_child = Child(
        family_id=child_data.family_id,
        name=child_data.name,
        date_of_birth=child_data.date_of_birth,
        school=child_data.school,
        grade=child_data.grade,
        activities=child_data.activities,
        medical_notes=child_data.medical_notes,
        avatar_url=child_data.avatar_url
    )
    
    db.add(new_child)
    db.commit()
    db.refresh(new_child)
    
    return new_child


@router.get("", response_model=List[ChildResponse])
async def get_children(
    family_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not check_family_access(db, current_user.user_id, family_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this family"
        )
    
    children = db.query(Child).filter(Child.family_id == family_id).all()
    return children


@router.get("/{child_id}", response_model=ChildResponse)
async def get_child(
    child_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    child = db.query(Child).filter(Child.child_id == child_id).first()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
    
    if not check_family_access(db, current_user.user_id, child.family_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this family"
        )
    
    return child


@router.put("/{child_id}", response_model=ChildResponse)
async def update_child(
    child_id: UUID,
    child_data: ChildUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    child = db.query(Child).filter(Child.child_id == child_id).first()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
    
    if not check_family_access(db, current_user.user_id, child.family_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this family"
        )
    
    update_data = child_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(child, field, value)
    
    db.commit()
    db.refresh(child)
    
    return child


@router.delete("/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_child(
    child_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    child = db.query(Child).filter(Child.child_id == child_id).first()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
    
    if not check_family_access(db, current_user.user_id, child.family_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this family"
        )
    
    db.delete(child)
    db.commit()
