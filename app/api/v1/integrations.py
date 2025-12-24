from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.models.integration import Integration, IntegrationType
from app.api.deps import get_current_user
from app.services.google_calendar_service import GoogleCalendarService
from app.config import settings

router = APIRouter()
google_calendar_service = GoogleCalendarService()


@router.get("")
async def get_integrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    integrations = db.query(Integration).filter(
        Integration.user_id == current_user.user_id
    ).all()
    
    return [
        {
            "integration_id": str(i.integration_id),
            "integration_type": i.integration_type.value,
            "is_active": i.is_active,
            "sync_enabled": i.sync_enabled,
            "last_synced_at": i.last_synced_at.isoformat() if i.last_synced_at else None,
            "created_at": i.created_at.isoformat()
        }
        for i in integrations
    ]


@router.get("/google-calendar/auth")
async def google_calendar_auth(
    current_user: User = Depends(get_current_user)
):
    auth_url = google_calendar_service.get_auth_url(str(current_user.user_id))
    return {"auth_url": auth_url}


@router.get("/google-calendar/callback")
async def google_calendar_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db)
):
    try:
        user_id = UUID(state)
        tokens = await google_calendar_service.exchange_code(code)
        
        # Check if integration already exists
        existing = db.query(Integration).filter(
            Integration.user_id == user_id,
            Integration.integration_type == IntegrationType.GOOGLE_CALENDAR
        ).first()
        
        if existing:
            existing.access_token = tokens["access_token"]
            existing.refresh_token = tokens.get("refresh_token", existing.refresh_token)
            existing.token_expires_at = tokens.get("expires_at")
            existing.is_active = True
        else:
            new_integration = Integration(
                user_id=user_id,
                integration_type=IntegrationType.GOOGLE_CALENDAR,
                access_token=tokens["access_token"],
                refresh_token=tokens.get("refresh_token"),
                token_expires_at=tokens.get("expires_at"),
                is_active=True,
                sync_enabled=True
            )
            db.add(new_integration)
        
        db.commit()
        
        # Redirect to frontend success page
        return RedirectResponse(url=f"{settings.GOOGLE_REDIRECT_URI}?success=true")
    
    except Exception as e:
        return RedirectResponse(url=f"{settings.GOOGLE_REDIRECT_URI}?error={str(e)}")


@router.post("/google-calendar/sync")
async def sync_google_calendar(
    family_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    integration = db.query(Integration).filter(
        Integration.user_id == current_user.user_id,
        Integration.integration_type == IntegrationType.GOOGLE_CALENDAR,
        Integration.is_active == True
    ).first()
    
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Google Calendar integration not found"
        )
    
    # Sync appointments
    result = await google_calendar_service.sync_appointments(
        db=db,
        user_id=current_user.user_id,
        family_id=family_id,
        access_token=integration.access_token,
        refresh_token=integration.refresh_token
    )
    
    # Update last synced
    integration.last_synced_at = datetime.utcnow()
    db.commit()
    
    return {
        "message": "Sync completed",
        "imported": result.get("imported", 0),
        "exported": result.get("exported", 0)
    }


@router.delete("/google-calendar")
async def disconnect_google_calendar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    integration = db.query(Integration).filter(
        Integration.user_id == current_user.user_id,
        Integration.integration_type == IntegrationType.GOOGLE_CALENDAR
    ).first()
    
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Google Calendar integration not found"
        )
    
    db.delete(integration)
    db.commit()
    
    return {"message": "Google Calendar disconnected"}


@router.post("/apple-calendar")
async def connect_apple_calendar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Apple Calendar integration typically uses CalDAV
    # This is a placeholder for the integration
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Apple Calendar integration coming soon"
    )
