import os
import uuid
from datetime import datetime
from typing import Optional
from fastapi import UploadFile
import aiofiles
import boto3
from botocore.exceptions import ClientError
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class StorageService:
    def __init__(self):
        self.use_s3 = bool(settings.AWS_ACCESS_KEY_ID and settings.S3_BUCKET_NAME)
        if self.use_s3:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
        self.local_upload_dir = "uploads"
        os.makedirs(self.local_upload_dir, exist_ok=True)

    async def upload_file(self, file: UploadFile, folder: str = "") -> str:
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
        unique_filename = f"{uuid.uuid4()}.{file_extension}" if file_extension else str(uuid.uuid4())
        
        if folder:
            key = f"{folder}/{unique_filename}"
        else:
            key = unique_filename

        if self.use_s3:
            return await self._upload_to_s3(file, key)
        else:
            return await self._upload_locally(file, key)

    async def _upload_to_s3(self, file: UploadFile, key: str) -> str:
        try:
            contents = await file.read()
            self.s3_client.put_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=key,
                Body=contents,
                ContentType=file.content_type or 'application/octet-stream'
            )
            
            url = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
            return url
        except ClientError as e:
            logger.error(f"S3 upload error: {e}")
            raise Exception(f"Failed to upload file to S3: {str(e)}")
        finally:
            await file.seek(0)

    async def _upload_locally(self, file: UploadFile, key: str) -> str:
        try:
            # Create subdirectories if needed
            full_path = os.path.join(self.local_upload_dir, key)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            
            async with aiofiles.open(full_path, 'wb') as out_file:
                contents = await file.read()
                await out_file.write(contents)
            
            await file.seek(0)
            return f"/uploads/{key}"
        except Exception as e:
            logger.error(f"Local upload error: {e}")
            raise Exception(f"Failed to upload file locally: {str(e)}")

    async def delete_file(self, file_url: str) -> bool:
        if self.use_s3:
            return await self._delete_from_s3(file_url)
        else:
            return await self._delete_locally(file_url)

    async def _delete_from_s3(self, file_url: str) -> bool:
        try:
            # Extract key from URL
            key = file_url.split(f"{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/")[-1]
            self.s3_client.delete_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=key
            )
            return True
        except ClientError as e:
            logger.error(f"S3 delete error: {e}")
            return False

    async def _delete_locally(self, file_url: str) -> bool:
        try:
            # Remove /uploads/ prefix
            relative_path = file_url.replace("/uploads/", "")
            full_path = os.path.join(self.local_upload_dir, relative_path)
            
            if os.path.exists(full_path):
                os.remove(full_path)
                return True
            return False
        except Exception as e:
            logger.error(f"Local delete error: {e}")
            return False

    def get_presigned_url(self, file_url: str, expiration: int = 3600) -> Optional[str]:
        if not self.use_s3:
            return file_url
        
        try:
            key = file_url.split(f"{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/")[-1]
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': settings.S3_BUCKET_NAME, 'Key': key},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            logger.error(f"Presigned URL error: {e}")
            return None
