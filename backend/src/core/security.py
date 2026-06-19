from cryptography.fernet import Fernet
from .config import settings
import base64
import os
from typing import Optional

def get_fernet():
    key = settings.ENCRYPTION_KEY
    if not key:
        # Fallback for dev environment if not provided
        # In production this should be explicitly set
        key = base64.urlsafe_b64encode(b"01234567890123456789012345678901").decode()
    return Fernet(key.encode())

def encrypt_key(api_key: str) -> str:
    if not api_key:
        return None
    f = get_fernet()
    return f.encrypt(api_key.encode()).decode()

def decrypt_key(encrypted_key: str) -> str:
    if not encrypted_key:
        return None
    f = get_fernet()
    return f.decrypt(encrypted_key.encode()).decode()

from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
