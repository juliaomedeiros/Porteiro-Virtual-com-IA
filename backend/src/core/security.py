from cryptography.fernet import Fernet
from .config import settings
import base64
import os

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
