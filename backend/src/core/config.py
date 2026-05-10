from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Porteiro Virtual IA"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    DATABASE_URL: str = "postgresql://user:pass@localhost:5433/porteiro_db"
    
    GOOGLE_API_KEY: Optional[str] = None
    EVOLUTION_API_URL: Optional[str] = None
    EVOLUTION_API_KEY: Optional[str] = None
    
    LANGSMITH_API_KEY: Optional[str] = None
    LANGCHAIN_TRACING_V2: str = "false"
    LANGCHAIN_ENDPOINT: str = "https://api.smith.langchain.com"
    LANGCHAIN_PROJECT: str = "porteiro-virtual-ia"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
