from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from app.database import get_db
from app.models.user import User
from app.models.family import FamilyMember
from app.models.child import Child
from app.models.appointment import Appointment, AppointmentStatus
from app.models.appointment_note import AppointmentNote
from app.models.document import Document, DocumentType
from app.schemas.appointment import (
    AppointmentCreate, AppointmentResponse, AppointmentUpdate,
    AppointmentNoteCreate, AppointmentNoteResponse, AppointmentWithDetails,
    ConflictCheckResponse, DocumentResponse
)
from app.api.deps import get_current_user
from app.services.storage_service import StorageService
from app.services.notification_service import notification_service

router = APIRouter()
storage_service = StorageService()


def check_family_access(db: Session, user_id: UUID, family_id: UUID) -> bool:
    membership = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id,
        FamilyMember.user_id == user_id
    ).first()
    return membership is not None


def check_conflicts(db: Session, family_id: UUID, start_time: datetime, end_time: datetime, 
                   child_id: Optional[UUID] = None, exclude_id: Optional[UUID] = None) -> List[Appointment]:
    query = db.query(Appointment).filter(
        Appointment.family_id == family_id,
        Appointment.status == AppointmentStatus.ACTIVE,
        Appointment.start_time < end_time,
        Appointment.end_time > start_time
    )
    
    if child_id:
        query = query.filter(
            (Appointment.child_id == child_id) | (Appointment.child_id.is_(None))
        )
    
    if exclude_id:
        query = query.filter(Appointment.appointment_id != exclude_id)
    
    return query.all()


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not check_family_access(db, current_user.user_id, appointment_data.family_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this family"
        )
    
    if appointment_data.child_id:
        child = db.query(Child).filter(
            Child.child_id == appointment_data.child_id,
            Child.family_id == appointment_data.family_id
        ).first()
        if not child:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Child not found in this family"
            )
    
    new_appointment = Appointment(
        family_id=appointment_data.family_id,
        child_id=appointment_data.child_id,
        title=appointment_data.title,
        description=appointment_data.description,
        category=appointment_data.category,
        start_time=appointment_data.start_time,
        end_time=appointment_data.end_time,
        location=appointment_data.location,
        recurrence_rule=appointment_data.recurrence_rule,
        color=appointment_data.color,
        created_by=current_user.user_id
    )
    
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)
    
    # Create appointment reminders (24h and 1h before)
    await notification_service.create_appointment_reminders(db, new_appointment)
    
    # Check for conflicts and notify if any exist
    conflicts = check_conflicts(
        db, new_appointment.family_id, 
        new_appointment.start_time, new_appointment.end_time,
        new_appointment.child_id, new_appointment.appointment_id
    )
    if conflicts:
        await notification_service.create_conflict_notification(
            db, current_user.user_id, new_appointment, conflicts
        )
    
    child_name = None
    if new_appointment.child_id:
        child = db.query(Child).filter(Child.child_id == new_appointment.child_id).first()
        child_name = child.name if child else None
    
    return AppointmentResponse(
        appointment_id=new_appointment.appointment_id,
        family_id=new_appointment.family_id,
        child_id=new_appointment.child_id,
        title=new_appointment.title,
        description=new_appointment.description,
        category=new_appointment.category,
        start_time=new_appointment.start_time,
        end_time=new_appointment.end_time,
        location=new_appointment.location,
        recurrence_rule=new_appointment.recurrence_rule,
        color=new_appointment.color,
        created_by=new_appointment.created_by,
        status=new_appointment.status,
        created_at=new_appointment.created_at,
        updated_at=new_appointment.updated_at,
        child_name=child_name
    )


@router.get("", response_model=List[AppointmentResponse])
async def get_appointments(
    family_id: UUID,
    child_id: Optional[UUID] = None,
    category: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not check_family_access(db, current_user.user_id, family_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this family"
        )
    
    query = db.query(Appointment).filter(Appointment.family_id == family_id).order_by(Appointment.start_time.desc())
    
    if child_id:
        query = query.filter(Appointment.child_id == child_id)
    
    if category:
        query = query.filter(Appointment.category == category)
    
    if start_date:
        query = query.filter(Appointment.start_time >= start_date)
    
    if end_date:
        query = query.filter(Appointment.end_time <= end_date)
    
    if status:
        query = query.filter(Appointment.status == status)
    
    appointments = query.order_by(Appointment.start_time).all()
    
    result = []
    for apt in appointments:
        child_name = None
        if apt.child_id:
            child = db.query(Child).filter(Child.child_id == apt.child_id).first()
            child_name = child.name if child else None
        
        result.append(AppointmentResponse(
            appointment_id=apt.appointment_id,
            family_id=apt.family_id,
            child_id=apt.child_id,
            title=apt.title,
            description=apt.description,
            category=apt.category,
            start_time=apt.start_time,
            end_time=apt.end_time,
            location=apt.location,
            recurrence_rule=apt.recurrence_rule,
            color=apt.color,
            created_by=apt.created_by,
            status=apt.status,
            created_at=apt.created_at,
            updated_at=apt.updated_at,
            child_name=child_name
        ))
    
    return result


@router.get("/{appointment_id}", response_model=AppointmentWithDetails)
async def get_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appointment = db.query(Appointment).filter(
        Appointment.appointment_id == appointment_id
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    if not check_family_access(db, current_user.user_id, appointment.family_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this family"
        )
    
    child_name = None
    if appointment.child_id:
        child = db.query(Child).filter(Child.child_id == appointment.child_id).first()
        child_name = child.name if child else None
    
    notes = db.query(AppointmentNote).filter(
        AppointmentNote.appointment_id == appointment_id
    ).all()
    
    documents = db.query(Document).filter(
        Document.appointment_id == appointment_id
    ).all()
    
    return AppointmentWithDetails(
        appointment_id=appointment.appointment_id,
        family_id=appointment.family_id,
        child_id=appointment.child_id,
        title=appointment.title,
        description=appointment.description,
        category=appointment.category,
        start_time=appointment.start_time,
        end_time=appointment.end_time,
        location=appointment.location,
        recurrence_rule=appointment.recurrence_rule,
        color=appointment.color,
        created_by=appointment.created_by,
        status=appointment.status,
        created_at=appointment.created_at,
        updated_at=appointment.updated_at,
        child_name=child_name,
        notes=[AppointmentNoteResponse(
            note_id=n.note_id,
            appointment_id=n.appointment_id,
            note_text=n.note_text,
            created_by=n.created_by,
            created_at=n.created_at
        ) for n in notes],
        documents=[DocumentResponse(
            document_id=d.document_id,
            appointment_id=d.appointment_id,
            file_name=d.file_name,
            file_url=d.file_url,
            file_type=d.file_type.value,
            uploaded_at=d.uploaded_at
        ) for d in documents]
    )


@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: UUID,
    appointment_data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appointment = db.query(Appointment).filter(
        Appointment.appointment_id == appointment_id
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    if not check_family_access(db, current_user.user_id, appointment.family_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this family"
        )
    
    update_data = appointment_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)
    
    db.commit()
    db.refresh(appointment)
    
    # Create update notification for family members
    await notification_service.create_appointment_update_notification(
        db, appointment, current_user.user_id
    )
    
    # Check for conflicts after update and notify if any exist
    conflicts = check_conflicts(
        db, appointment.family_id, 
        appointment.start_time, appointment.end_time,
        appointment.child_id, appointment.appointment_id
    )
    if conflicts:
        await notification_service.create_conflict_notification(
            db, current_user.user_id, appointment, conflicts
        )
    
    child_name = None
    if appointment.child_id:
        child = db.query(Child).filter(Child.child_id == appointment.child_id).first()
        child_name = child.name if child else None
    
    return AppointmentResponse(
        appointment_id=appointment.appointment_id,
        family_id=appointment.family_id,
        child_id=appointment.child_id,
        title=appointment.title,
        description=appointment.description,
        category=appointment.category,
        start_time=appointment.start_time,
        end_time=appointment.end_time,
        location=appointment.location,
        recurrence_rule=appointment.recurrence_rule,
        color=appointment.color,
        created_by=appointment.created_by,
        status=appointment.status,
        created_at=appointment.created_at,
        updated_at=appointment.updated_at,
        child_name=child_name
    )


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appointment = db.query(Appointment).filter(
        Appointment.appointment_id == appointment_id
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    if not check_family_access(db, current_user.user_id, appointment.family_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this family"
        )
    
    db.delete(appointment)
    db.commit()


@router.post("/{appointment_id}/notes", response_model=AppointmentNoteResponse)
async def add_note(
    appointment_id: UUID,
    note_data: AppointmentNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appointment = db.query(Appointment).filter(
        Appointment.appointment_id == appointment_id
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    if not check_family_access(db, current_user.user_id, appointment.family_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this family"
        )
    
    new_note = AppointmentNote(
        appointment_id=appointment_id,
        note_text=note_data.note_text,
        created_by=current_user.user_id
    )
    
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    
    return new_note


@router.post("/{appointment_id}/documents", response_model=DocumentResponse)
async def upload_document(
    appointment_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appointment = db.query(Appointment).filter(
        Appointment.appointment_id == appointment_id
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    if not check_family_access(db, current_user.user_id, appointment.family_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this family"
        )
    
    # Determine file type
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension in ['jpg', 'jpeg', 'png', 'gif']:
        file_type = DocumentType.IMAGE
    elif file_extension == 'pdf':
        file_type = DocumentType.PDF
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type"
        )
    
    # Upload file
    file_url = await storage_service.upload_file(file, f"appointments/{appointment_id}")
    
    new_document = Document(
        appointment_id=appointment_id,
        file_name=file.filename,
        file_url=file_url,
        file_type=file_type,
        uploaded_by=current_user.user_id
    )
    
    db.add(new_document)
    db.commit()
    db.refresh(new_document)
    
    return DocumentResponse(
        document_id=new_document.document_id,
        appointment_id=new_document.appointment_id,
        file_name=new_document.file_name,
        file_url=new_document.file_url,
        file_type=new_document.file_type.value,
        uploaded_at=new_document.uploaded_at
    )


@router.post("/check-conflicts", response_model=ConflictCheckResponse)
async def check_appointment_conflicts(
    family_id: UUID,
    start_time: datetime,
    end_time: datetime,
    child_id: Optional[UUID] = None,
    exclude_appointment_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not check_family_access(db, current_user.user_id, family_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this family"
        )
    
    conflicts = check_conflicts(db, family_id, start_time, end_time, child_id, exclude_appointment_id)
    
    conflict_responses = []
    for apt in conflicts:
        child_name = None
        if apt.child_id:
            child = db.query(Child).filter(Child.child_id == apt.child_id).first()
            child_name = child.name if child else None
        
        conflict_responses.append(AppointmentResponse(
            appointment_id=apt.appointment_id,
            family_id=apt.family_id,
            child_id=apt.child_id,
            title=apt.title,
            description=apt.description,
            category=apt.category,
            start_time=apt.start_time,
            end_time=apt.end_time,
            location=apt.location,
            recurrence_rule=apt.recurrence_rule,
            color=apt.color,
            created_by=apt.created_by,
            status=apt.status,
            created_at=apt.created_at,
            updated_at=apt.updated_at,
            child_name=child_name
        ))
    
    has_conflict = len(conflicts) > 0
    message = f"Found {len(conflicts)} conflicting appointment(s)" if has_conflict else "No conflicts found"
    
    return ConflictCheckResponse(
        has_conflict=has_conflict,
        conflicts=conflict_responses,
        message=message
    )
