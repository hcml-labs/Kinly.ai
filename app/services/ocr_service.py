import io
from typing import Optional
from fastapi import UploadFile
from PIL import Image
import pytesseract
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class OCRService:
    def __init__(self):
        if settings.TESSERACT_PATH:
            pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_PATH
        self.language = settings.OCR_LANGUAGE

    async def extract_text(self, file: UploadFile) -> str:
        try:
            contents = await file.read()
            await file.seek(0)
            
            image = Image.open(io.BytesIO(contents))
            
            # Preprocess image for better OCR
            image = self._preprocess_image(image)
            
            # Extract text
            text = pytesseract.image_to_string(image, lang=self.language)
            
            return text.strip()
        except Exception as e:
            logger.error(f"OCR extraction error: {e}")
            return ""

    async def extract_text_from_url(self, image_url: str) -> str:
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(image_url)
                response.raise_for_status()
                
                image = Image.open(io.BytesIO(response.content))
                image = self._preprocess_image(image)
                
                text = pytesseract.image_to_string(image, lang=self.language)
                return text.strip()
        except Exception as e:
            logger.error(f"OCR from URL error: {e}")
            return ""

    def _preprocess_image(self, image: Image.Image) -> Image.Image:
        # Convert to grayscale
        if image.mode != 'L':
            image = image.convert('L')
        
        # Resize if too small
        min_dimension = 1000
        width, height = image.size
        if width < min_dimension or height < min_dimension:
            scale = max(min_dimension / width, min_dimension / height)
            new_size = (int(width * scale), int(height * scale))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        return image

    async def extract_structured_data(self, file: UploadFile) -> dict:
        """Extract text and attempt to identify structured data like dates, times, locations"""
        text = await self.extract_text(file)
        
        return {
            "raw_text": text,
            "lines": [line.strip() for line in text.split('\n') if line.strip()]
        }
