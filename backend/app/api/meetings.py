from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.schemas.meeting import (
    JoinMeetingRequest,
    JoinMeetingResponse,
    MeetingCreate,
    MeetingListItem,
    MeetingResponse,
)
from app.services.meeting_service import MeetingService

router = APIRouter(prefix="/meetings", tags=["meetings"])


def get_meeting_service(
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> MeetingService:
    return MeetingService(db, settings)


@router.post("", response_model=MeetingResponse, status_code=201)
def create_meeting(
    payload: MeetingCreate,
    service: MeetingService = Depends(get_meeting_service),
) -> MeetingResponse:
    return service.create_meeting(payload)


@router.get("", response_model=list[MeetingListItem])
def list_meetings(
    service: MeetingService = Depends(get_meeting_service),
) -> list[MeetingListItem]:
    return service.list_meetings()


@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(
    meeting_id: str,
    service: MeetingService = Depends(get_meeting_service),
) -> MeetingResponse:
    return service.get_meeting_by_public_id(meeting_id)


@router.post("/{meeting_id}/join", response_model=JoinMeetingResponse)
def join_meeting(
    meeting_id: str,
    payload: JoinMeetingRequest,
    service: MeetingService = Depends(get_meeting_service),
) -> JoinMeetingResponse:
    return service.join_meeting(meeting_id, payload.display_name)


@router.post("/{meeting_id}/leave", status_code=204)
def leave_meeting(
    meeting_id: str,
    session_user_id: str,
    service: MeetingService = Depends(get_meeting_service),
) -> None:
    service.leave_meeting(meeting_id, session_user_id)
