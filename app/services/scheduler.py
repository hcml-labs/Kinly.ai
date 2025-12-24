from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
from app.database import SessionLocal
from app.services.notification_service import notification_service
import logging

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def process_notifications_job():
    """Background job to process pending notifications"""
    db = SessionLocal()
    try:
        count = await notification_service.process_pending_notifications(db)
        if count > 0:
            logger.info(f"Processed {count} pending notifications")
    except Exception as e:
        logger.error(f"Error processing notifications: {e}")
    finally:
        db.close()


async def check_missed_appointments_job():
    """Background job to check for missed appointments"""
    db = SessionLocal()
    try:
        count = await notification_service.check_and_create_missed_notifications(db)
        if count > 0:
            logger.info(f"Created {count} missed appointment notifications")
    except Exception as e:
        logger.error(f"Error checking missed appointments: {e}")
    finally:
        db.close()


def start_scheduler():
    """Start the background scheduler"""
    # Process pending notifications every 5 minutes
    scheduler.add_job(
        process_notifications_job,
        trigger=IntervalTrigger(minutes=5),
        id='process_notifications',
        name='Process pending notifications',
        replace_existing=True
    )
    
    # Check for missed appointments every 15 minutes
    scheduler.add_job(
        check_missed_appointments_job,
        trigger=IntervalTrigger(minutes=15),
        id='check_missed_appointments',
        name='Check for missed appointments',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Background scheduler started")


def shutdown_scheduler():
    """Shutdown the background scheduler"""
    scheduler.shutdown()
    logger.info("Background scheduler stopped")
