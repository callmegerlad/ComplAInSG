"""Application configuration from environment variables."""
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings


_DEFAULT_ORIGINS = "http://localhost:3000,http://localhost:5173,http://localhost:8000"


class Settings(BaseSettings):
    OPENAI_API_KEY: str

    # Accepts both OPENAI_MODEL (in .env) and MODEL_NAME
    MODEL_NAME: str = Field(default="gpt-5.1", alias="OPENAI_MODEL")

    # Database is optional — the triage pipeline works without it
    DATABASE_URL: Optional[str] = None

    # Comma-separated list of allowed CORS origins.
    # Plain string avoids pydantic-settings JSON-parsing issues with .env files.
    ALLOWED_ORIGINS: str = _DEFAULT_ORIGINS

    @property
    def allowed_origins_list(self) -> list[str]:
        """Return origins as a list (splits on comma)."""
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"          # allow PORT, etc. in .env without error
        populate_by_name = True   # allow both alias and field name


settings = Settings()
