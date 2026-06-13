"""Ensure always-open public meeting rooms exist (idempotent, never deletes data)."""

from sqlalchemy.orm import Session

from app.models.meeting import Meeting, MeetingStatus

PERMANENT_ROOMS: list[dict[str, str]] = [
    {
        "meeting_id": "f0000001-0000-0000-0000-000000000001",
        "title": "Open Lounge",
        "description": "Always open — drop in anytime for casual chat",
    },
    {
        "meeting_id": "f0000002-0000-0000-0000-000000000002",
        "title": "Help Desk",
        "description": "Ask questions or get help — available 24/7",
    },
    {
        "meeting_id": "f0000003-0000-0000-0000-000000000003",
        "title": "Study Hall",
        "description": "Quiet co-working room, always available",
    },
]


def ensure_permanent_meetings(db: Session) -> None:
    existing_ids = {
        row[0]
        for row in db.query(Meeting.meeting_id)
        .filter(Meeting.is_permanent.is_(True))
        .all()
    }

    created = False
    for room in PERMANENT_ROOMS:
        if room["meeting_id"] in existing_ids:
            continue
        db.add(
            Meeting(
                meeting_id=room["meeting_id"],
                title=room["title"],
                description=room["description"],
                status=MeetingStatus.ACTIVE,
                is_permanent=True,
                user_id=None,
            )
        )
        created = True

    if created:
        db.commit()

    # Keep permanent rooms active even if they were previously ended.
    stale = (
        db.query(Meeting)
        .filter(
            Meeting.is_permanent.is_(True),
            Meeting.status != MeetingStatus.ACTIVE,
        )
        .all()
    )
    if stale:
        for meeting in stale:
            meeting.status = MeetingStatus.ACTIVE
        db.commit()
