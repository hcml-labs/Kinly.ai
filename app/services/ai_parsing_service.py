import re
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import UploadFile
from app.config import settings
from app.models.appointment import AppointmentCategory
import logging

logger = logging.getLogger(__name__)


class AIParsingService:
    def __init__(self):
        self.openai_available = bool(settings.OPENAI_API_KEY)
        if self.openai_available:
            import openai
            self.openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

    async def parse_email(self, subject: str, body: str, sender: Optional[str] = None) -> Dict[str, Any]:
        """Parse email content to extract appointment information"""
        full_text = f"Subject: {subject}\n\nFrom: {sender or 'Unknown'}\n\n{body}"
        
        if self.openai_available:
            return await self._parse_with_openai(full_text, "email")
        else:
            return self._parse_with_rules(full_text)

    async def parse_text(self, text: str) -> Dict[str, Any]:
        """Parse natural language text to extract appointment information"""
        if self.openai_available:
            return await self._parse_with_openai(text, "text")
        else:
            return self._parse_with_rules(text)

    async def transcribe_audio(self, file: UploadFile) -> str:
        """Transcribe audio file to text"""
        if self.openai_available:
            try:
                contents = await file.read()
                await file.seek(0)
                
                # Use OpenAI Whisper
                transcript = self.openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=("audio.mp3", contents)
                )
                return transcript.text
            except Exception as e:
                logger.error(f"Transcription error: {e}")
                return ""
        else:
            # Fallback: return empty (would need SpeechRecognition library)
            logger.warning("OpenAI not available for transcription")
            return ""

    async def _parse_with_openai(self, text: str, source_type: str) -> Dict[str, Any]:
        """Use OpenAI to parse text and extract appointment information"""
        try:
            system_prompt = """You are an AI assistant that extracts appointment information from text.
            Extract the following information if present:
            - title: Event title/name
            - description: Event description
            - category: One of 'school', 'health', 'activity', 'personal'
            - start_time: Start date and time (ISO format)
            - end_time: End date and time (ISO format)
            - location: Event location
            - recurrence_rule: If recurring, provide iCal RRULE format
            - child_name: Name of child involved (if mentioned)
            
            Return a JSON object with an 'appointments' array containing extracted events.
            Include a 'confidence' score (0-1) for each extraction.
            Include 'suggestions' array with any helpful notes."""

            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Extract appointments from this {source_type}:\n\n{text}"}
                ],
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Convert to our format
            appointments = []
            for apt in result.get("appointments", []):
                appointments.append({
                    "title": apt.get("title"),
                    "description": apt.get("description"),
                    "category": self._map_category(apt.get("category")),
                    "start_time": apt.get("start_time"),
                    "end_time": apt.get("end_time"),
                    "location": apt.get("location"),
                    "recurrence_rule": apt.get("recurrence_rule"),
                    "child_name": apt.get("child_name"),
                    "confidence_score": apt.get("confidence", 0.8)
                })
            
            return {
                "appointments": appointments,
                "confidence": result.get("confidence", 0.8),
                "suggestions": result.get("suggestions", []),
                "parsed_data": result
            }
        except Exception as e:
            logger.error(f"OpenAI parsing error: {e}")
            return self._parse_with_rules(text)

    def _parse_with_rules(self, text: str) -> Dict[str, Any]:
        """Fallback rule-based parsing when OpenAI is not available"""
        appointments = []
        suggestions = []
        
        # Date patterns
        date_patterns = [
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
            r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{4}',
            r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s*\d{4}',
            r'(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)',
            r'(tomorrow|today|next week)'
        ]
        
        # Time patterns
        time_patterns = [
            r'(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)',
            r'(\d{1,2}\s*(?:AM|PM|am|pm))',
            r'(noon|midnight)'
        ]
        
        # Category keywords
        category_keywords = {
            'school': ['school', 'class', 'exam', 'test', 'homework', 'pta', 'teacher', 'grade', 'report card'],
            'health': ['doctor', 'dentist', 'appointment', 'checkup', 'vaccination', 'therapy', 'medical', 'clinic', 'hospital'],
            'activity': ['soccer', 'basketball', 'practice', 'game', 'recital', 'lesson', 'class', 'training', 'swim', 'dance', 'music', 'piano', 'guitar'],
            'personal': ['birthday', 'party', 'celebration', 'family', 'dinner', 'lunch']
        }
        
        # Extract dates
        found_dates = []
        for pattern in date_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            found_dates.extend(matches)
        
        # Extract times
        found_times = []
        for pattern in time_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            found_times.extend(matches)
        
        # Determine category
        text_lower = text.lower()
        detected_category = 'personal'
        for category, keywords in category_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                detected_category = category
                break
        
        # Extract potential title (first line or subject)
        lines = text.split('\n')
        title = lines[0][:100] if lines else "New Appointment"
        if title.startswith("Subject:"):
            title = title.replace("Subject:", "").strip()
        
        # Create appointment if we found date/time info
        if found_dates or found_times:
            appointment = {
                "title": title,
                "description": text[:500],
                "category": detected_category,
                "start_time": None,
                "end_time": None,
                "location": self._extract_location(text),
                "recurrence_rule": self._detect_recurrence(text),
                "child_name": self._extract_child_name(text),
                "confidence_score": 0.5
            }
            
            # Try to parse date/time
            if found_dates:
                suggestions.append(f"Detected date: {found_dates[0]}")
            if found_times:
                suggestions.append(f"Detected time: {found_times[0]}")
            
            appointments.append(appointment)
        else:
            suggestions.append("Could not detect specific date/time. Please enter manually.")
        
        return {
            "appointments": appointments,
            "confidence": 0.5 if appointments else 0.2,
            "suggestions": suggestions,
            "parsed_data": {
                "dates_found": found_dates,
                "times_found": found_times,
                "category_detected": detected_category
            }
        }

    def _map_category(self, category: Optional[str]) -> Optional[str]:
        """Map parsed category to valid enum value"""
        if not category:
            return None
        
        category_lower = category.lower()
        valid_categories = ['school', 'health', 'activity', 'personal']
        
        if category_lower in valid_categories:
            return category_lower
        
        # Map common variations
        mapping = {
            'medical': 'health',
            'doctor': 'health',
            'sports': 'activity',
            'extracurricular': 'activity',
            'education': 'school',
            'academic': 'school'
        }
        
        return mapping.get(category_lower, 'personal')

    def _extract_location(self, text: str) -> Optional[str]:
        """Extract location from text"""
        location_patterns = [
            r'(?:at|location:|venue:|place:)\s*([^,\n]+)',
            r'(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd))',
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return None

    def _detect_recurrence(self, text: str) -> Optional[str]:
        """Detect recurrence patterns and return iCal RRULE"""
        text_lower = text.lower()
        
        if 'every day' in text_lower or 'daily' in text_lower:
            return 'FREQ=DAILY'
        elif 'every week' in text_lower or 'weekly' in text_lower:
            return 'FREQ=WEEKLY'
        elif 'every month' in text_lower or 'monthly' in text_lower:
            return 'FREQ=MONTHLY'
        elif 'every tuesday' in text_lower:
            return 'FREQ=WEEKLY;BYDAY=TU'
        elif 'every monday' in text_lower:
            return 'FREQ=WEEKLY;BYDAY=MO'
        elif 'every wednesday' in text_lower:
            return 'FREQ=WEEKLY;BYDAY=WE'
        elif 'every thursday' in text_lower:
            return 'FREQ=WEEKLY;BYDAY=TH'
        elif 'every friday' in text_lower:
            return 'FREQ=WEEKLY;BYDAY=FR'
        elif 'every saturday' in text_lower:
            return 'FREQ=WEEKLY;BYDAY=SA'
        elif 'every sunday' in text_lower:
            return 'FREQ=WEEKLY;BYDAY=SU'
        
        return None

    def _extract_child_name(self, text: str) -> Optional[str]:
        """Try to extract child name from text"""
        # Common patterns for child references
        patterns = [
            r"(?:for|child:|student:|kid:)\s*([A-Z][a-z]+)",
            r"([A-Z][a-z]+)'s\s+(?:appointment|class|practice|game|lesson)"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1)
        
        return None
