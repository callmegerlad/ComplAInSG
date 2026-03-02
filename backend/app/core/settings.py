"""Application configuration from environment variables."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OPENAI_API_KEY: str = ""

    JWT_SECRET_KEY: str = "complainsg-jwt-secret-key"

    MODEL_NAME: str = "gpt-5.1"

    DATABASE_URL: str = ""

    # All origins that the browser may report as the page origin.
    # In Docker dev the Vite server binds to 0.0.0.0 so both `localhost` and
    # `127.0.0.1` are valid hostnames from the browser's perspective, and they
    # are treated as distinct CORS origins.  Production builds served on port
    # 3000 are also included.  Set this env var (JSON array) to override.
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # JWT Configuration
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
