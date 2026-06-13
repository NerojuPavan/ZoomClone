from datetime import datetime

from pydantic import BaseModel, Field, field_serializer

from app.schemas.serializers import serialize_utc_datetime


class MeetingCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    scheduled_at: datetime | None = None
    duration: int | None = Field(None, ge=1, le=45)
    user_id: int | None = None


class ParticipantResponse(BaseModel):
    id: int
    session_user_id: str
    display_name: str
    joined_at: datetime
    left_at: datetime | None

    model_config = {"from_attributes": True}

    @field_serializer("joined_at", "left_at")
    def serialize_datetimes(self, value: datetime | None) -> str | None:
        return serialize_utc_datetime(value)


class MeetingResponse(BaseModel):
    id: int
    meeting_id: str
    title: str
    description: str | None
    status: str
    created_at: datetime
    scheduled_at: datetime | None
    duration: int | None
    share_link: str
    user_id: int | None = None
    is_permanent: bool = False
    participants: list[ParticipantResponse] = []

    model_config = {"from_attributes": True}

    @field_serializer("created_at", "scheduled_at")
    def serialize_datetimes(self, value: datetime | None) -> str | None:
        return serialize_utc_datetime(value)


class MeetingListItem(BaseModel):
    id: int
    meeting_id: str
    title: str
    description: str | None
    status: str
    created_at: datetime
    scheduled_at: datetime | None
    duration: int | None
    share_link: str
    participant_count: int
    user_id: int | None = None
    is_permanent: bool = False

    model_config = {"from_attributes": True}

    @field_serializer("created_at", "scheduled_at")
    def serialize_datetimes(self, value: datetime | None) -> str | None:
        return serialize_utc_datetime(value)


class MeetingListResponse(BaseModel):
    public_meetings: list[MeetingListItem]
    my_meetings: list[MeetingListItem]


class JoinMeetingRequest(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=255)


class JoinMeetingResponse(BaseModel):
    meeting: MeetingResponse
    session_user_id: str
    participant_id: int
