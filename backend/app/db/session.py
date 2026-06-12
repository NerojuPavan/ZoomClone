from collections.abc import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.db.base import Base

settings = get_settings()

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _migrate_schema() -> None:
    inspector = inspect(engine)
    if not inspector.has_table("meetings"):
        return

    columns = {column["name"] for column in inspector.get_columns("meetings")}
    if "status" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE meetings ADD COLUMN status VARCHAR(20) "
                    "NOT NULL DEFAULT 'active'"
                )
            )


def init_db() -> None:
    # Import models so metadata is registered before create_all.
    from app.models import meeting, participant  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _migrate_schema()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
