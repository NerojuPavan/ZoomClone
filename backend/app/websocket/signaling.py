import json
import logging
from typing import Any

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.websocket.room_manager import RoomFullError, room_manager

logger = logging.getLogger(__name__)

router = APIRouter()

HOST_ACTIONS = frozenset({"host-mute", "host-video-off", "host-kick"})


async def _send_json(websocket: WebSocket, message: dict[str, Any]) -> None:
    await websocket.send_text(json.dumps(message))


async def _broadcast(
    participants: list,
    message: dict[str, Any],
    exclude_user_id: str | None = None,
) -> None:
    for participant in participants:
        if exclude_user_id and participant.user_id == exclude_user_id:
            continue
        try:
            await _send_json(participant.websocket, message)
        except Exception:
            logger.exception("Failed to send message to user %s", participant.user_id)


@router.websocket("/ws/{meeting_id}")
async def signaling_endpoint(
    websocket: WebSocket,
    meeting_id: str,
    user_id: str = Query(..., min_length=1),
    display_name: str = Query(..., min_length=1),
) -> None:
    await websocket.accept()

    try:
        room, existing, host_user_id = await room_manager.add_participant(
            meeting_id=meeting_id,
            user_id=user_id,
            display_name=display_name,
            websocket=websocket,
        )
    except RoomFullError as exc:
        await _send_json(
            websocket,
            {"type": "error", "payload": {"message": str(exc)}},
        )
        await websocket.close(code=4003, reason="Room full")
        return

    await _send_json(
        websocket,
        {
            "type": "room-state",
            "user_id": user_id,
            "payload": {
                "participants": [
                    {"user_id": p.user_id, "display_name": p.display_name}
                    for p in existing
                ],
                "host_user_id": host_user_id,
            },
        },
    )

    await _broadcast(
        existing,
        {
            "type": "user-joined",
            "user_id": user_id,
            "payload": {
                "user_id": user_id,
                "display_name": display_name,
            },
        },
    )

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await _send_json(
                    websocket,
                    {
                        "type": "error",
                        "payload": {"message": "Invalid JSON"},
                    },
                )
                continue

            msg_type = data.get("type")
            target_user_id = data.get("target_user_id")
            payload = data.get("payload", {})

            if msg_type in ("offer", "answer", "ice-candidate"):
                if not target_user_id:
                    await _send_json(
                        websocket,
                        {
                            "type": "error",
                            "payload": {"message": "target_user_id required"},
                        },
                    )
                    continue

                target = await room_manager.get_participant(meeting_id, target_user_id)
                if not target:
                    await _send_json(
                        websocket,
                        {
                            "type": "error",
                            "payload": {"message": "Target user not in room"},
                        },
                    )
                    continue

                await _send_json(
                    target.websocket,
                    {
                        "type": msg_type,
                        "user_id": user_id,
                        "target_user_id": target_user_id,
                        "payload": payload,
                    },
                )
            elif msg_type in HOST_ACTIONS:
                if not target_user_id:
                    await _send_json(
                        websocket,
                        {
                            "type": "error",
                            "payload": {"message": "target_user_id required"},
                        },
                    )
                    continue

                if not room_manager.is_host(meeting_id, user_id):
                    await _send_json(
                        websocket,
                        {
                            "type": "error",
                            "payload": {"message": "Only the host can perform this action"},
                        },
                    )
                    continue

                if msg_type == "host-kick":
                    target = await room_manager.kick_participant(
                        meeting_id, user_id, target_user_id
                    )
                    if not target:
                        await _send_json(
                            websocket,
                            {
                                "type": "error",
                                "payload": {"message": "Cannot kick this participant"},
                            },
                        )
                        continue

                    await _send_json(
                        target.websocket,
                        {
                            "type": "kicked",
                            "user_id": user_id,
                            "payload": {
                                "reason": "You were removed from the meeting by the host",
                            },
                        },
                    )
                    try:
                        await target.websocket.close(code=4004, reason="Kicked by host")
                    except Exception:
                        pass

                    remaining, new_host_id = await room_manager.remove_participant(
                        meeting_id, target_user_id
                    )
                    await _broadcast(
                        remaining,
                        {
                            "type": "user-left",
                            "user_id": target_user_id,
                            "payload": {
                                "user_id": target_user_id,
                                "display_name": target.display_name,
                            },
                        },
                    )
                    if new_host_id:
                        await _broadcast(
                            remaining,
                            {
                                "type": "host-changed",
                                "user_id": new_host_id,
                                "payload": {"host_user_id": new_host_id},
                            },
                        )
                else:
                    target = await room_manager.get_participant(meeting_id, target_user_id)
                    if not target:
                        await _send_json(
                            websocket,
                            {
                                "type": "error",
                                "payload": {"message": "Target user not in room"},
                            },
                        )
                        continue

                    forward_type = (
                        "host-mute" if msg_type == "host-mute" else "host-video-off"
                    )
                    await _send_json(
                        target.websocket,
                        {
                            "type": forward_type,
                            "user_id": user_id,
                            "target_user_id": target_user_id,
                            "payload": payload,
                        },
                    )
            elif msg_type == "leave":
                break
            else:
                await _send_json(
                    websocket,
                    {
                        "type": "error",
                        "payload": {"message": f"Unknown message type: {msg_type}"},
                    },
                )
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected: meeting=%s user=%s", meeting_id, user_id)
    finally:
        remaining, new_host_id = await room_manager.remove_participant(
            meeting_id, user_id
        )
        await _broadcast(
            remaining,
            {
                "type": "user-left",
                "user_id": user_id,
                "payload": {
                    "user_id": user_id,
                    "display_name": display_name,
                },
            },
        )
        if new_host_id:
            await _broadcast(
                remaining,
                {
                    "type": "host-changed",
                    "user_id": new_host_id,
                    "payload": {"host_user_id": new_host_id},
                },
            )
