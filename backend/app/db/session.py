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
            columns.add("status")

    if "user_id" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE meetings ADD COLUMN user_id INTEGER NULL")
            )
            columns.add("user_id")

    if "is_permanent" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE meetings ADD COLUMN is_permanent BOOLEAN "
                    "NOT NULL DEFAULT 0"
                )
            )


def init_db() -> None:
    # Import models so metadata is registered before create_all.
    from app.models import meeting, participant, user  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _migrate_schema()

    db = SessionLocal()
    try:
        from app.db.permanent_meetings import ensure_permanent_meetings

        ensure_permanent_meetings(db)
    finally:
        db.close()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
