from datetime import datetime

from pydantic import BaseModel, Field


class MeetingCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    scheduled_at: datetime | None = None
    duration: int | None = Field(None, ge=1, le=480)


class ParticipantResponse(BaseModel):
    id: int
    session_user_id: str
    display_name: str
    joined_at: datetime
    left_at: datetime | None

    model_config = {"from_attributes": True}


class MeetingResponse(BaseModel):
    id: int
    meeting_id: str
    title: str
    description: str | None
    created_at: datetime
    scheduled_at: datetime | None
    duration: int | None
    share_link: str
    participants: list[ParticipantResponse] = []

    model_config = {"from_attributes": True}


class MeetingListItem(BaseModel):
    id: int
    meeting_id: str
    title: str
    description: str | None
    created_at: datetime
    scheduled_at: datetime | None
    duration: int | None
    share_link: str
    participant_count: int

    model_config = {"from_attributes": True}


class JoinMeetingRequest(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=255)


class JoinMeetingResponse(BaseModel):
    meeting: MeetingResponse
    session_user_id: str
    participant_id: int
