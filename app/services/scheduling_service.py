from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.appointment import Appointment, AppointmentStatus, AppointmentCategory
from app.models.child import Child
from app.schemas.ai import ParsedAppointment, WeeklySummary
import logging

logger = logging.getLogger(__name__)


class SchedulingService:
    async def analyze_schedule(
        self,
        db: Session,
        family_id: UUID,
        proposed_appointment: ParsedAppointment
    ) -> Dict[str, Any]:
        """Analyze proposed appointment for conflicts and suggestions"""
        
        conflicts = []
        suggestions = []
        optimal_times = []
        
        if not proposed_appointment.start_time or not proposed_appointment.end_time:
            return {
                "has_conflicts": False,
                "conflicts": [],
                "suggestions": ["Please specify start and end times"],
                "optimal_times": []
            }
        
        # Check for conflicts
        conflicting_appointments = db.query(Appointment).filter(
            Appointment.family_id == family_id,
            Appointment.status == AppointmentStatus.ACTIVE,
            Appointment.start_time < proposed_appointment.end_time,
            Appointment.end_time > proposed_appointment.start_time
        ).all()
        
        for apt in conflicting_appointments:
            child_name = None
            if apt.child_id:
                child = db.query(Child).filter(Child.child_id == apt.child_id).first()
                child_name = child.name if child else None
            
            conflicts.append({
                "appointment_id": str(apt.appointment_id),
                "title": apt.title,
                "start_time": apt.start_time.isoformat(),
                "end_time": apt.end_time.isoformat(),
                "child_name": child_name,
                "category": apt.category.value
            })
        
        has_conflicts = len(conflicts) > 0
        
        # Generate suggestions
        if has_conflicts:
            suggestions.append(f"This time slot conflicts with {len(conflicts)} existing appointment(s)")
            
            # Find optimal alternative times
            optimal_times = await self._find_optimal_times(
                db, family_id,
                proposed_appointment.start_time,
                proposed_appointment.end_time
            )
            
            if optimal_times:
                suggestions.append("Consider these alternative time slots")
        
        # Check for busy day warning
        day_start = proposed_appointment.start_time.replace(hour=0, minute=0, second=0)
        day_end = day_start + timedelta(days=1)
        
        day_appointments = db.query(Appointment).filter(
            Appointment.family_id == family_id,
            Appointment.status == AppointmentStatus.ACTIVE,
            Appointment.start_time >= day_start,
            Appointment.start_time < day_end
        ).count()
        
        if day_appointments >= 3:
            suggestions.append(f"This day already has {day_appointments} appointments - consider spreading activities")
        
        return {
            "has_conflicts": has_conflicts,
            "conflicts": conflicts,
            "suggestions": suggestions,
            "optimal_times": optimal_times
        }

    async def _find_optimal_times(
        self,
        db: Session,
        family_id: UUID,
        original_start: datetime,
        original_end: datetime,
        num_suggestions: int = 3
    ) -> List[datetime]:
        """Find optimal alternative time slots"""
        duration = original_end - original_start
        optimal_times = []
        
        # Check slots before and after the original time
        check_times = [
            original_start - timedelta(hours=2),
            original_start + timedelta(hours=2),
            original_start + timedelta(days=1),
            original_start - timedelta(days=1),
        ]
        
        for check_time in check_times:
            if len(optimal_times) >= num_suggestions:
                break
            
            # Skip times in the past
            if check_time < datetime.utcnow():
                continue
            
            check_end = check_time + duration
            
            # Check if this slot is free
            conflicts = db.query(Appointment).filter(
                Appointment.family_id == family_id,
                Appointment.status == AppointmentStatus.ACTIVE,
                Appointment.start_time < check_end,
                Appointment.end_time > check_time
            ).count()
            
            if conflicts == 0:
                optimal_times.append(check_time)
        
        return optimal_times

    async def generate_weekly_summary(
        self,
        db: Session,
        family_id: UUID
    ) -> WeeklySummary:
        """Generate weekly summary for a family"""
        
        # Get current week boundaries
        today = datetime.utcnow().date()
        week_start = datetime.combine(today - timedelta(days=today.weekday()), datetime.min.time())
        week_end = week_start + timedelta(days=7)
        
        # Get all appointments for the week
        appointments = db.query(Appointment).filter(
            Appointment.family_id == family_id,
            Appointment.status == AppointmentStatus.ACTIVE,
            Appointment.start_time >= week_start,
            Appointment.start_time < week_end
        ).all()
        
        # Count by category
        by_category = {}
        for apt in appointments:
            cat = apt.category.value
            by_category[cat] = by_category.get(cat, 0) + 1
        
        # Count by child
        by_child = {"family": 0}
        for apt in appointments:
            if apt.child_id:
                child = db.query(Child).filter(Child.child_id == apt.child_id).first()
                child_name = child.name if child else "Unknown"
                by_child[child_name] = by_child.get(child_name, 0) + 1
            else:
                by_child["family"] += 1
        
        # Find busiest day
        day_counts = {}
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        for apt in appointments:
            day_name = day_names[apt.start_time.weekday()]
            day_counts[day_name] = day_counts.get(day_name, 0) + 1
        
        busiest_day = max(day_counts.keys(), key=lambda k: day_counts[k]) if day_counts else "None"
        busiest_count = day_counts.get(busiest_day, 0)
        
        # Check for conflicts
        conflicts_detected = 0
        for i, apt1 in enumerate(appointments):
            for apt2 in appointments[i+1:]:
                if apt1.start_time < apt2.end_time and apt1.end_time > apt2.start_time:
                    conflicts_detected += 1
        
        # Generate suggestions
        suggestions = []
        if busiest_count >= 4:
            suggestions.append(f"{busiest_day} is very busy with {busiest_count} appointments - consider rescheduling some")
        if conflicts_detected > 0:
            suggestions.append(f"You have {conflicts_detected} overlapping appointment(s) this week")
        if len(appointments) > 15:
            suggestions.append("This is a very busy week - make sure to schedule some downtime")
        if len(appointments) == 0:
            suggestions.append("No appointments scheduled this week")
        
        return WeeklySummary(
            family_id=family_id,
            week_start=week_start,
            week_end=week_end,
            total_appointments=len(appointments),
            appointments_by_category=by_category,
            appointments_by_child=by_child,
            busiest_day=busiest_day,
            busiest_day_count=busiest_count,
            conflicts_detected=conflicts_detected,
            suggestions=suggestions
        )

    async def create_recurring_appointments(
        self,
        db: Session,
        base_appointment: Appointment,
        recurrence_rule: str,
        end_date: datetime
    ) -> List[Appointment]:
        """Create recurring appointments based on RRULE"""
        from dateutil.rrule import rrulestr
        
        created_appointments = []
        
        try:
            # Parse the recurrence rule
            rule = rrulestr(recurrence_rule, dtstart=base_appointment.start_time)
            duration = base_appointment.end_time - base_appointment.start_time
            
            # Generate occurrences
            for occurrence in rule:
                if occurrence > end_date:
                    break
                
                if occurrence == base_appointment.start_time:
                    continue  # Skip the original
                
                new_apt = Appointment(
                    family_id=base_appointment.family_id,
                    child_id=base_appointment.child_id,
                    title=base_appointment.title,
                    description=base_appointment.description,
                    category=base_appointment.category,
                    start_time=occurrence,
                    end_time=occurrence + duration,
                    location=base_appointment.location,
                    color=base_appointment.color,
                    created_by=base_appointment.created_by
                )
                
                db.add(new_apt)
                created_appointments.append(new_apt)
            
            db.commit()
            
        except Exception as e:
            logger.error(f"Error creating recurring appointments: {e}")
            db.rollback()
        
        return created_appointments
