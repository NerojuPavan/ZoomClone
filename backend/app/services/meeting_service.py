import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.config import Settings
from app.core.meeting_rules import (
    MAX_MEETING_DURATION_MINUTES,
    meeting_end,
    validate_joinable,
)
from app.models.meeting import Meeting, MeetingStatus
from app.models.participant import Participant
from app.schemas.meeting import (
    JoinMeetingResponse,
    MeetingCreate,
    MeetingListItem,
    MeetingListResponse,
    MeetingResponse,
    ParticipantResponse,
)


class MeetingService:
    def __init__(self, db: Session, settings: Settings):
        self.db = db
        self.settings = settings

    def _build_share_link(self, meeting_id: str) -> str:
        return f"{self.settings.frontend_url}/meeting/{meeting_id}"

    def _to_meeting_response(self, meeting: Meeting) -> MeetingResponse:
        return MeetingResponse(
            id=meeting.id,
            meeting_id=meeting.meeting_id,
            title=meeting.title,
            description=meeting.description,
            status=meeting.status,
            created_at=meeting.created_at,
            scheduled_at=meeting.scheduled_at,
            duration=meeting.duration,
            share_link=self._build_share_link(meeting.meeting_id),
            user_id=meeting.user_id,
            is_permanent=meeting.is_permanent,
            participants=[
                ParticipantResponse.model_validate(p) for p in meeting.participants
            ],
        )

    def _to_list_item(self, meeting: Meeting) -> MeetingListItem:
        participant_count = (
            self.db.query(func.count(Participant.id))
            .filter(Participant.meeting_id == meeting.id)
            .scalar()
            or 0
        )
        return MeetingListItem(
            id=meeting.id,
            meeting_id=meeting.meeting_id,
            title=meeting.title,
            description=meeting.description,
            status=meeting.status,
            created_at=meeting.created_at,
            scheduled_at=meeting.scheduled_at,
            duration=meeting.duration,
            share_link=self._build_share_link(meeting.meeting_id),
            participant_count=participant_count,
            user_id=meeting.user_id,
            is_permanent=meeting.is_permanent,
        )

    def _to_naive_utc(self, value: datetime | None) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is not None:
            return value.astimezone(timezone.utc).replace(tzinfo=None)
        return value

    def create_meeting(self, payload: MeetingCreate) -> MeetingResponse:
        if payload.scheduled_at:
            duration = min(
                payload.duration or MAX_MEETING_DURATION_MINUTES,
                MAX_MEETING_DURATION_MINUTES,
            )
        else:
            duration = MAX_MEETING_DURATION_MINUTES

        meeting = Meeting(
            meeting_id=str(uuid.uuid4()),
            title=payload.title,
            description=payload.description,
            status=MeetingStatus.ACTIVE,
            scheduled_at=self._to_naive_utc(payload.scheduled_at),
            duration=duration,
            user_id=payload.user_id,
            is_permanent=False,
        )
        self.db.add(meeting)
        self.db.commit()
        self.db.refresh(meeting)
        return self._to_meeting_response(meeting)

    def list_meetings(self, user_id: int | None = None) -> MeetingListResponse:
        public_meetings = (
            self.db.query(Meeting)
            .filter(Meeting.is_permanent.is_(True))
            .order_by(Meeting.title.asc())
            .all()
        )

        my_meetings: list[Meeting] = []
        if user_id is not None:
            my_meetings = (
                self.db.query(Meeting)
                .filter(
                    Meeting.user_id == user_id,
                    Meeting.is_permanent.is_(False),
                )
                .order_by(Meeting.created_at.desc())
                .all()
            )

        return MeetingListResponse(
            public_meetings=[self._to_list_item(m) for m in public_meetings],
            my_meetings=[self._to_list_item(m) for m in my_meetings],
        )

    def get_meeting_by_public_id(self, meeting_id: str) -> MeetingResponse:
        meeting = (
            self.db.query(Meeting)
            .options(joinedload(Meeting.participants))
            .filter(Meeting.meeting_id == meeting_id)
            .first()
        )
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Meeting '{meeting_id}' not found",
            )
        return self._to_meeting_response(meeting)

    def join_meeting(self, meeting_id: str, display_name: str) -> JoinMeetingResponse:
        meeting = (
            self.db.query(Meeting)
            .options(joinedload(Meeting.participants))
            .filter(Meeting.meeting_id == meeting_id)
            .first()
        )
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Meeting '{meeting_id}' not found",
            )
        join_error = validate_joinable(meeting)
        if join_error:
            if not meeting.is_permanent and datetime.utcnow() >= meeting_end(meeting):
                meeting.status = MeetingStatus.ENDED
                self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail=join_error,
            )

        session_user_id = str(uuid.uuid4())
        participant = Participant(
            meeting_id=meeting.id,
            session_user_id=session_user_id,
            display_name=display_name.strip(),
        )
        self.db.add(participant)
        self.db.commit()
        self.db.refresh(participant)
        self.db.refresh(meeting)

        return JoinMeetingResponse(
            meeting=self._to_meeting_response(meeting),
            session_user_id=session_user_id,
            participant_id=participant.id,
        )

    def leave_meeting(self, meeting_id: str, session_user_id: str) -> None:
        meeting = (
            self.db.query(Meeting)
            .filter(Meeting.meeting_id == meeting_id)
            .first()
        )
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Meeting '{meeting_id}' not found",
            )

        participant = (
            self.db.query(Participant)
            .filter(
                Participant.meeting_id == meeting.id,
                Participant.session_user_id == session_user_id,
                Participant.left_at.is_(None),
            )
            .order_by(Participant.joined_at.desc())
            .first()
        )
        if participant:
            participant.left_at = datetime.utcnow()

            active_count = (
                self.db.query(func.count(Participant.id))
                .filter(
                    Participant.meeting_id == meeting.id,
                    Participant.left_at.is_(None),
                )
                .scalar()
                or 0
            )
            if active_count == 0 and not meeting.is_permanent:
                meeting.status = MeetingStatus.ENDED

            self.db.commit()
