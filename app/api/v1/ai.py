from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from app.database import get_db
from app.models.user import User
from app.models.family import FamilyMember
from app.models.ai_parsed_input import AIParsedInput, SourceType
from app.schemas.ai import (
    AIParseRequest, AIParseResponse, AIScheduleRequest, AIScheduleResponse,
    VoiceInputRequest, EmailParseRequest, ImageParseRequest, ParsedAppointment,
    WeeklySummary
)
from app.api.deps import get_current_user
from app.services.ai_parsing_service import AIParsingService
from app.services.ocr_service import OCRService
from app.services.scheduling_service import SchedulingService
from app.services.storage_service import StorageService

router = APIRouter()
ai_service = AIParsingService()
ocr_service = OCRService()
scheduling_service = SchedulingService()
storage_service = StorageService()


def check_family_access(db: Session, user_id: UUID, family_id: UUID) -> bool:
    membership = db.query(FamilyMember).filter(
        FamilyMember.family_id == family_id,
        FamilyMember.user_id == user_id
    ).first()
    return membership is not None


@router.post("/parse-email", response_model=AIParseResponse)
async def parse_email(
    request: EmailParseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not check_family_access(db, current_user.user_id, request.family_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this family"
        )
    
    # Parse email content
    parsed_result = await ai_service.parse_email(
        subject=request.email_subject,
        body=request.email_body,
        sender=request.sender
    )
    
    # Store parsed input
    ai_input = AIParsedInput(
        user_id=current_user.user_id,
        family_id=request.family_id,
        source_type=SourceType.EMAIL,
        raw_input=f"Subject: {request.email_subject}\n\n{request.email_body}",
        parsed_json=parsed_result.get("parsed_data"),
        confidence_score=parsed_result.get("confidence", 0.0)
    )
    
    db.add(ai_input)
    db.commit()
    db.refresh(ai_input)
    
    return AIParseResponse(
        parse_id=ai_input.parse_id,
        source_type=SourceType.EMAIL,
        parsed_appointments=parsed_result.get("appointments", []),
        raw_input=ai_input.raw_input,
        overall_confidence=parsed_result.get("confidence", 0.0),
        suggestions=parsed_result.get("suggestions", [])
    )


@router.post("/parse-image", response_model=AIParseResponse)
async def parse_image(
    family_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not check_family_access(db, current_user.user_id, family_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this family"
        )
    
    # Upload image
    file_url = await storage_service.upload_file(file, f"ai-inputs/{family_id}")
    
    # OCR the image
    ocr_text = await ocr_service.extract_text(file)
    
    # Parse extracted text
    parsed_result = await ai_service.parse_text(ocr_text)
    
    # Store parsed input
    ai_input = AIParsedInput(
        user_id=current_user.user_id,
        family_id=family_id,
        source_type=SourceType.IMAGE,
        raw_input=ocr_text,
        file_url=file_url,
        parsed_json=parsed_result.get("parsed_data"),
        confidence_score=parsed_result.get("confidence", 0.0)
    )
    
    db.add(ai_input)
    db.commit()
    db.refresh(ai_input)
    
    return AIParseResponse(
        parse_id=ai_input.parse_id,
        source_type=SourceType.IMAGE,
        parsed_appointments=parsed_result.get("appointments", []),
        raw_input=ocr_text,
        overall_confidence=parsed_result.get("confidence", 0.0),
        suggestions=parsed_result.get("suggestions", [])
    )


@router.post("/parse-text", response_model=AIParseResponse)
async def parse_text(
    request: AIParseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not check_family_access(db, current_user.user_id, request.family_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this family"
        )
    
    # Parse text input (e.g., "Add soccer practice every Tuesday at 5 PM")
    parsed_result = await ai_service.parse_text(request.raw_input)
    
    # Store parsed input
    ai_input = AIParsedInput(
        user_id=current_user.user_id,
        family_id=request.family_id,
        source_type=SourceType.TEXT,
        raw_input=request.raw_input,
        parsed_json=parsed_result.get("parsed_data"),
        confidence_score=parsed_result.get("confidence", 0.0)
    )
    
    db.add(ai_input)
    db.commit()
    db.refresh(ai_input)
    
    return AIParseResponse(
        parse_id=ai_input.parse_id,
        source_type=SourceType.TEXT,
        parsed_appointments=parsed_result.get("appointments", []),
        raw_input=request.raw_input,
        overall_confidence=parsed_result.get("confidence", 0.0),
        suggestions=parsed_result.get("suggestions", [])
    )


@router.post("/parse-voice", response_model=AIParseResponse)
async def parse_voice(
    family_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not check_family_access(db, current_user.user_id, family_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this family"
        )
    
    # Upload audio file
    file_url = await storage_service.upload_file(file, f"ai-inputs/{family_id}/voice")
    
    # Transcribe audio
    transcription = await ai_service.transcribe_audio(file)
    
    # Parse transcription
    parsed_result = await ai_service.parse_text(transcription)
    
    # Store parsed input
    ai_input = AIParsedInput(
        user_id=current_user.user_id,
        family_id=family_id,
        source_type=SourceType.VOICE,
        raw_input=transcription,
        file_url=file_url,
        parsed_json=parsed_result.get("parsed_data"),
        confidence_score=parsed_result.get("confidence", 0.0)
    )
    
    db.add(ai_input)
    db.commit()
    db.refresh(ai_input)
    
    return AIParseResponse(
        parse_id=ai_input.parse_id,
        source_type=SourceType.VOICE,
        parsed_appointments=parsed_result.get("appointments", []),
        raw_input=transcription,
        overall_confidence=parsed_result.get("confidence", 0.0),
        suggestions=parsed_result.get("suggestions", [])
    )


@router.post("/schedule", response_model=AIScheduleResponse)
async def check_schedule(
    request: AIScheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not check_family_access(db, current_user.user_id, request.family_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this family"
        )
    
    # Check for conflicts and get suggestions
    result = await scheduling_service.analyze_schedule(
        db=db,
        family_id=request.family_id,
        proposed_appointment=request.proposed_appointment
    )
    
    return AIScheduleResponse(
        has_conflicts=result.get("has_conflicts", False),
        conflicts=result.get("conflicts", []),
        suggestions=result.get("suggestions", []),
        optimal_times=result.get("optimal_times", [])
    )


@router.get("/weekly-summary/{family_id}", response_model=WeeklySummary)
async def get_weekly_summary(
    family_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not check_family_access(db, current_user.user_id, family_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this family"
        )
    
    summary = await scheduling_service.generate_weekly_summary(db, family_id)
    
    return summary
