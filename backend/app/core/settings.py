"""Application configuration from environment variables."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OPENAI_API_KEY: str = ""

    JWT_SECRET_KEY: str = "complainsg-jwt-secret-key"

    MODEL_NAME: str = "gpt-5.1"

    DATABASE_URL: str = ""

    # CORS: explicit allow-list plus optional regex for local dev ports.
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ]
    ALLOWED_ORIGIN_REGEX: str = r"https?://(localhost|127\\.0\\.0\\.1)(:\\d+)?"

    # JWT Configuration
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
