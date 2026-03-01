import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    MODEL_NAME: str = os.getenv("MODEL_NAME", "gpt-5.1")  # matches notebook
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")
    ALLOWED_ORIGINS: list[str] = [
        o.strip()
        for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
        if o.strip()
    ]

settings = Settings()