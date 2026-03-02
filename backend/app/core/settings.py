"""Application configuration from environment variables."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OPENAI_API_KEY: str = ""

    JWT_SECRET_KEY: str = "complainsg-jwt-secret-key"

    MODEL_NAME: str = "gpt-5.1"

    DATABASE_URL: str = ""

    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]

    # JWT Configuration
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
