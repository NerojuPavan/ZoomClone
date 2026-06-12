import uuid
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.config import Settings
from app.models.meeting import Meeting
from app.models.participant import Participant
from app.schemas.meeting import (
    JoinMeetingResponse,
    MeetingCreate,
    MeetingListItem,
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
            created_at=meeting.created_at,
            scheduled_at=meeting.scheduled_at,
            duration=meeting.duration,
            share_link=self._build_share_link(meeting.meeting_id),
            participants=[
                ParticipantResponse.model_validate(p) for p in meeting.participants
            ],
        )

    def create_meeting(self, payload: MeetingCreate) -> MeetingResponse:
        meeting = Meeting(
            meeting_id=str(uuid.uuid4()),
            title=payload.title,
            description=payload.description,
            scheduled_at=payload.scheduled_at,
            duration=payload.duration,
        )
        self.db.add(meeting)
        self.db.commit()
        self.db.refresh(meeting)
        return self._to_meeting_response(meeting)

    def list_meetings(self) -> list[MeetingListItem]:
        meetings = (
            self.db.query(Meeting)
            .order_by(Meeting.created_at.desc())
            .all()
        )
        result: list[MeetingListItem] = []
        for meeting in meetings:
            participant_count = (
                self.db.query(func.count(Participant.id))
                .filter(Participant.meeting_id == meeting.id)
                .scalar()
                or 0
            )
            result.append(
                MeetingListItem(
                    id=meeting.id,
                    meeting_id=meeting.meeting_id,
                    title=meeting.title,
                    description=meeting.description,
                    created_at=meeting.created_at,
                    scheduled_at=meeting.scheduled_at,
                    duration=meeting.duration,
                    share_link=self._build_share_link(meeting.meeting_id),
                    participant_count=participant_count,
                )
            )
        return result

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
            self.db.commit()
