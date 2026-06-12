import os
from dataclasses import dataclass, field
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    app_name: str = "Zoom Clone API"
    database_url: str = "sqlite:///./zoom_clone.db"
    frontend_url: str = "http://localhost:3000"
    cors_origins: list[str] = field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )
    max_participants_per_room: int = 5


@lru_cache
def get_settings() -> Settings:
    origins = os.getenv("CORS_ORIGINS")
    return Settings(
        database_url=os.getenv("DATABASE_URL", "sqlite:///./zoom_clone.db"),
        frontend_url=os.getenv("FRONTEND_URL", "http://localhost:3000"),
        cors_origins=origins.split(",") if origins else Settings().cors_origins,
    )
