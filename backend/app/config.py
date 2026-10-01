import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"
    MOCK_LLM: bool = False

    GOOGLE_SHEETS_CREDENTIALS_FILE: str = ""
    GOOGLE_SHEETS_SPREADSHEET_ID: str = ""

    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "support@orange-telecom-demo.com"

    BACKEND_PORT: int = 8000
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/data/orange_support.db"
    DATA_DIR: Path = BASE_DIR / "data"
    PROMPTS_DIR: Path = BASE_DIR / "prompts"
    PDFS_DIR: Path = BASE_DIR / "data" / "pdfs"
    OUTBOX_DIR: Path = BASE_DIR / "data" / "outbox"

    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.PDFS_DIR.mkdir(parents=True, exist_ok=True)
settings.OUTBOX_DIR.mkdir(parents=True, exist_ok=True)

# Auto-detect mock mode if API key is missing or dummy placeholder
if not settings.GEMINI_API_KEY or "your_gemini_api_key" in settings.GEMINI_API_KEY.lower():
    settings.MOCK_LLM = True
