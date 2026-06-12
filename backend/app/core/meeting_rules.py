from datetime import datetime, timedelta

from app.models.meeting import Meeting, MeetingStatus

MAX_MEETING_DURATION_MINUTES = 45


def effective_duration(meeting: Meeting) -> int:
    if meeting.scheduled_at:
        duration = meeting.duration or MAX_MEETING_DURATION_MINUTES
        return min(duration, MAX_MEETING_DURATION_MINUTES)
    return MAX_MEETING_DURATION_MINUTES


def meeting_start(meeting: Meeting) -> datetime:
    return meeting.scheduled_at or meeting.created_at


def meeting_end(meeting: Meeting) -> datetime:
    return meeting_start(meeting) + timedelta(minutes=effective_duration(meeting))


def validate_joinable(meeting: Meeting, now: datetime | None = None) -> str | None:
    now = now or datetime.utcnow()

    if meeting.status == MeetingStatus.ENDED:
        return "This meeting has ended"

    if meeting.scheduled_at and now < meeting.scheduled_at:
        return "This meeting hasn't started yet"

    if now >= meeting_end(meeting):
        return "This meeting has ended"

    return None
