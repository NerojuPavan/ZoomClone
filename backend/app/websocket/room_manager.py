import asyncio
from dataclasses import dataclass, field

from fastapi import WebSocket


@dataclass
class RoomParticipant:
    user_id: str
    display_name: str
    websocket: WebSocket


@dataclass
class Room:
    meeting_id: str
    host_user_id: str | None = None
    participants: dict[str, RoomParticipant] = field(default_factory=dict)
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)


class RoomManager:
    """In-memory room registry for WebRTC signaling."""

    def __init__(self, max_participants: int = 5):
        self._rooms: dict[str, Room] = {}
        self._max_participants = max_participants
        self._global_lock = asyncio.Lock()

    async def get_or_create_room(self, meeting_id: str) -> Room:
        async with self._global_lock:
            if meeting_id not in self._rooms:
                self._rooms[meeting_id] = Room(meeting_id=meeting_id)
            return self._rooms[meeting_id]

    async def add_participant(
        self,
        meeting_id: str,
        user_id: str,
        display_name: str,
        websocket: WebSocket,
    ) -> tuple[Room, list[RoomParticipant], str]:
        room = await self.get_or_create_room(meeting_id)
        async with room.lock:
            if user_id in room.participants:
                old = room.participants[user_id]
                try:
                    await old.websocket.close(code=4000, reason="Replaced by new connection")
                except Exception:
                    pass
                del room.participants[user_id]

            if len(room.participants) >= self._max_participants:
                raise RoomFullError(
                    f"Room '{meeting_id}' is full (max {self._max_participants})"
                )

            if room.host_user_id is None:
                room.host_user_id = user_id

            room.participants[user_id] = RoomParticipant(
                user_id=user_id,
                display_name=display_name,
                websocket=websocket,
            )
            others = [
                p for uid, p in room.participants.items() if uid != user_id
            ]
            return room, others, room.host_user_id

    async def remove_participant(
        self, meeting_id: str, user_id: str
    ) -> tuple[list[RoomParticipant], str | None]:
        room = self._rooms.get(meeting_id)
        if not room:
            return [], None

        async with room.lock:
            room.participants.pop(user_id, None)
            new_host_id: str | None = None
            if room.host_user_id == user_id:
                room.host_user_id = next(iter(room.participants.keys()), None)
                new_host_id = room.host_user_id
            remaining = list(room.participants.values())
            if not room.participants:
                async with self._global_lock:
                    if meeting_id in self._rooms and not self._rooms[meeting_id].participants:
                        del self._rooms[meeting_id]
            return remaining, new_host_id

    def is_host(self, meeting_id: str, user_id: str) -> bool:
        room = self._rooms.get(meeting_id)
        return bool(room and room.host_user_id == user_id)

    async def kick_participant(
        self, meeting_id: str, host_id: str, target_user_id: str
    ) -> RoomParticipant | None:
        room = self._rooms.get(meeting_id)
        if not room or room.host_user_id != host_id:
            return None
        if target_user_id == host_id:
            return None
        async with room.lock:
            return room.participants.get(target_user_id)

    async def get_participant(
        self, meeting_id: str, user_id: str
    ) -> RoomParticipant | None:
        room = self._rooms.get(meeting_id)
        if not room:
            return None
        return room.participants.get(user_id)

    async def list_participants(self, meeting_id: str) -> list[RoomParticipant]:
        room = self._rooms.get(meeting_id)
        if not room:
            return []
        async with room.lock:
            return list(room.participants.values())


class RoomFullError(Exception):
    pass


from app.core.config import get_settings

room_manager = RoomManager(max_participants=get_settings().max_participants_per_room)
