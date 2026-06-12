"""Seed the database with sample meetings for development and demos."""

import argparse
from datetime import datetime, timedelta

from app.db.session import SessionLocal, init_db
from app.models.meeting import Meeting, MeetingStatus
from app.models.participant import Participant


def seed_database(*, force: bool = False) -> None:
    init_db()
    db = SessionLocal()

    try:
        existing = db.query(Meeting).count()
        if existing > 0 and not force:
            print(f"Database already has {existing} meeting(s). Skipping seed.")
            print("Run with --force to clear and re-seed.")
            return

        if existing > 0 and force:
            db.query(Participant).delete()
            db.query(Meeting).delete()
            db.commit()
            print("Cleared existing meetings and participants.")

        now = datetime.utcnow()

        sample_meetings = [
            Meeting(
                meeting_id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                title="Engineering Sync",
                description="Currently running — open signal demo",
                status=MeetingStatus.ACTIVE,
                created_at=now - timedelta(hours=1),
                scheduled_at=now - timedelta(minutes=10),
                duration=45,
            ),
            Meeting(
                meeting_id="11111111-1111-1111-1111-111111111111",
                title="Team Standup",
                description="Daily sync with the engineering team",
                status=MeetingStatus.ACTIVE,
                created_at=now - timedelta(days=1),
                scheduled_at=now + timedelta(days=1, hours=2),
                duration=30,
            ),
            Meeting(
                meeting_id="22222222-2222-2222-2222-222222222222",
                title="Product Review",
                description="Quarterly roadmap and feature review",
                status=MeetingStatus.ACTIVE,
                created_at=now - timedelta(hours=6),
                scheduled_at=now + timedelta(days=3, hours=4),
                duration=45,
            ),
            Meeting(
                meeting_id="33333333-3333-3333-3333-333333333333",
                title="Design Critique",
                description="UI/UX feedback session",
                status=MeetingStatus.ACTIVE,
                created_at=now - timedelta(days=2),
                scheduled_at=now + timedelta(days=5, hours=1),
                duration=45,
            ),
            Meeting(
                meeting_id="44444444-4444-4444-4444-444444444444",
                title="Sprint Planning",
                description="Plan tasks for the upcoming sprint",
                status=MeetingStatus.ENDED,
                created_at=now - timedelta(days=3),
                scheduled_at=now - timedelta(days=2),
                duration=45,
            ),
            Meeting(
                meeting_id="55555555-5555-5555-5555-555555555555",
                title="Client Demo",
                description="Walkthrough of the Zoom clone MVP",
                status=MeetingStatus.ENDED,
                created_at=now - timedelta(days=5),
                duration=None,
            ),
            Meeting(
                meeting_id="66666666-6666-6666-6666-666666666666",
                title="All Hands",
                description="Company-wide monthly update",
                status=MeetingStatus.ENDED,
                created_at=now - timedelta(days=7),
                scheduled_at=now - timedelta(days=6),
                duration=45,
            ),
        ]

        db.add_all(sample_meetings)
        db.flush()

        sample_participants = [
            Participant(
                meeting_id=sample_meetings[3].id,
                session_user_id="seed-user-1",
                display_name="Alice",
                joined_at=now - timedelta(days=2, hours=1),
                left_at=now - timedelta(days=2),
            ),
            Participant(
                meeting_id=sample_meetings[3].id,
                session_user_id="seed-user-2",
                display_name="Bob",
                joined_at=now - timedelta(days=2, hours=1),
                left_at=now - timedelta(days=2),
            ),
            Participant(
                meeting_id=sample_meetings[4].id,
                session_user_id="seed-user-3",
                display_name="Carol",
                joined_at=now - timedelta(days=5, hours=2),
                left_at=now - timedelta(days=5, hours=1),
            ),
            Participant(
                meeting_id=sample_meetings[5].id,
                session_user_id="seed-user-4",
                display_name="Dave",
                joined_at=now - timedelta(days=6, hours=2),
                left_at=now - timedelta(days=6, hours=1),
            ),
        ]

        db.add_all(sample_participants)
        db.commit()
        print(f"Seeded {len(sample_meetings)} meetings and {len(sample_participants)} participants.")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the Zoom Clone database")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Clear existing data and re-seed sample meetings",
    )
    args = parser.parse_args()
    seed_database(force=args.force)
