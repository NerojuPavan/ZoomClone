# Zoom Clone

A full-stack video conferencing web app inspired by the Zoom web experience. Create instant or scheduled meetings, join via invite link, and connect over real-time video and audio using WebRTC.

**Live stack:** Next.js · FastAPI · SQLite · WebSockets · WebRTC (mesh, up to 5 participants)

---

## Table of contents

- [Project summary](#project-summary)
- [Features](#features)
- [Architecture overview](#architecture-overview)
- [Backend architecture](#backend-architecture)
- [Frontend architecture](#frontend-architecture)
- [Project structure](#project-structure)
- [Local setup](#local-setup)
- [Database schema](#database-schema)
- [API reference](#api-reference)
- [Deployment](#deployment)
- [Assumptions & limits](#assumptions--limits)
- [Cursor rules](#cursor-rules)

---

## Project summary

This repo is a monorepo with two apps:

| App | Path | Role |
|-----|------|------|
| **Frontend** | `frontend/` | Zoom-style dashboard, pre-join screen, meeting room UI |
| **Backend** | `backend/` | REST API for meetings, WebSocket signaling for WebRTC |

**How a call works:**

1. User creates or joins a meeting via REST (`/meetings`, `/join`).
2. Pre-join screen acquires camera/mic and collects display name.
3. After join, the client opens a WebSocket to `/ws/{meeting_id}`.
4. WebRTC offers/answers and ICE candidates are exchanged over the socket (signaling only — media is peer-to-peer).
5. Each participant maintains a mesh of `RTCPeerConnection`s (one per remote peer).

There is **no user authentication** — a default guest user is assumed, per assignment requirements.

---

## Features

### Dashboard
- Zoom-style home: search bar, clock, **New meeting** / **Join** / **Schedule** actions
- Upcoming and previous meeting lists with date grouping
- Light/dark theme (Settings drawer)
- Required-field markers on forms (red `*`)

### Meetings
- Instant meetings with UUID + shareable invite link
- Scheduled meetings (title, description, date/time, duration ≤ 45 min)
- Join validation (not started / ended / expired)
- Pre-join preview with mic/camera toggles

### Meeting room
- Multi-participant video grid (max 5)
- Elapsed meeting timer in header
- Mute / camera / participants panel / leave
- Host controls: mute participant, disable video, kick, mute all
- Remote mic/camera state via `media-state` signaling (UI badges)

---

## Architecture overview

```mermaid
flowchart TB
    subgraph Browser["Browser (Next.js)"]
        UI[Dashboard / MeetingRoom]
        Hooks[useMeeting · useWebRTC · useWebSocket]
        UI --> Hooks
    end

    subgraph Backend["Backend (FastAPI)"]
        REST[REST /meetings]
        WS[WebSocket /ws]
        SVC[MeetingService]
        RM[RoomManager in-memory]
        DB[(SQLite)]
        REST --> SVC --> DB
        WS --> RM
    end

    subgraph P2P["WebRTC mesh"]
        PC1[PeerConnection]
        PC2[PeerConnection]
    end

    Hooks -->|HTTP| REST
    Hooks -->|Signaling| WS
    Hooks --> PC1
    Hooks --> PC2
    PC1 <-.->|Audio/Video| PC2
```

| Concern | Implementation |
|---------|----------------|
| Persistence | SQLite via SQLAlchemy |
| Signaling | Native WebSockets (JSON messages) |
| Media | WebRTC P2P mesh, Google STUN |
| Host | First WebSocket joiner; enforced in `RoomManager` |
| Room cap | 5 participants (configurable) |

---

## Backend architecture

### Layered layout

```
Request
   │
   ▼
app/api/meetings.py      ← HTTP routes (thin controllers)
   │
   ▼
app/services/meeting_service.py   ← Business logic, DB transactions
   │
   ▼
app/models/              ← SQLAlchemy ORM
app/schemas/             ← Pydantic request/response DTOs

WebSocket /ws/{id}  →  app/websocket/signaling.py
                      →  app/websocket/room_manager.py (in-memory rooms)
```

### Key modules

| Module | Responsibility |
|--------|----------------|
| `app/main.py` | FastAPI app, CORS, lifespan (`init_db`), router registration |
| `app/core/config.py` | Settings from env (`DATABASE_URL`, `FRONTEND_URL`, `CORS_ORIGINS`) |
| `app/core/meeting_rules.py` | Join windows, 45 min cap, ended-meeting checks |
| `app/services/meeting_service.py` | CRUD meetings, join/leave, share links, status lifecycle |
| `app/websocket/signaling.py` | Offer/answer/ICE relay, host actions, broadcasts |
| `app/websocket/room_manager.py` | In-memory participant registry + host assignment |
| `app/db/session.py` | Engine, session factory, lightweight migrations |

### WebSocket message types

| Type | Direction | Purpose |
|------|-----------|---------|
| `room-state` | Server → client | Existing participants + host on join |
| `user-joined` / `user-left` | Broadcast | Presence |
| `offer` / `answer` / `ice-candidate` | P2P relay | WebRTC negotiation |
| `media-state` | Broadcast | Mic/camera UI state |
| `host-mute` / `host-video-off` / `host-kick` | Host → target | Host controls |
| `kicked` / `host-changed` | Server → client | Host actions result |

### Meeting lifecycle (backend)

- Created with `status = active`
- Join rejected with **410** if ended or outside join window
- When the last participant leaves via REST, meeting → `ended`

---

## Frontend architecture

### Layered layout

```
app/                    ← Next.js App Router pages
components/
  dashboard/            ← Dashboard, nav, meeting lists, dialogs
  meeting/              ← Room, pre-join, video grid, controls
  ui/                   ← shadcn-style primitives
hooks/
  useMeeting.ts         ← Orchestrates API + WS + WebRTC
  useWebRTC.ts          ← Media + peer connections + signaling handler
  useWebSocket.ts       ← WebSocket connection
  usePreJoinMedia.ts    ← Pre-join getUserMedia
lib/
  meeting-rules.ts      ← Client-side join/upcoming logic (mirrors backend)
  config.ts             ← API/WS URLs, ICE servers, room cap
services/meeting-api.ts ← REST client
types/meeting.ts        ← Shared TS types + signaling unions
```

### Hook orchestration

`useMeeting` waits for local media (`isMediaReady`) before opening the WebSocket so offers/answers always include tracks.

---

## Project structure

```
Scaler/
├── README.md
├── .cursor/rules/           # Cursor AI conventions (frontend + backend)
├── backend/
│   ├── app/
│   │   ├── api/             # REST routers
│   │   ├── core/            # Config, meeting rules
│   │   ├── db/              # SQLAlchemy base + session
│   │   ├── models/          # Meeting, Participant
│   │   ├── schemas/         # Pydantic models
│   │   ├── services/        # MeetingService
│   │   ├── websocket/       # Signaling + RoomManager
│   │   └── main.py
│   ├── seed.py              # Sample meetings
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── app/             # layout, page, meeting/[id]
    │   ├── components/
    │   ├── hooks/
    │   ├── lib/
    │   ├── services/
    │   └── types/
    └── package.json
```

---

## Local setup

### Prerequisites

- **Node.js** 18+
- **Python** 3.11+ (3.12 recommended)
- **npm**

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed.py                    # optional: sample data
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API: http://localhost:8000  
- Swagger: http://localhost:8000/docs  
- Health: http://localhost:8000/health  

**Optional env** (`backend/.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./zoom_clone.db` | SQLAlchemy URL |
| `FRONTEND_URL` | `http://localhost:3000` | Base URL for invite links |
| `CORS_ORIGINS` | localhost origins | Comma-separated CORS list |

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

```bash
npm run dev
```

App: http://localhost:3000

### 3. Quick test

1. Open http://localhost:3000  
2. Click **New meeting** → start → allow camera/mic  
3. Copy invite link → open in a second browser/tab  
4. Join with another display name → verify two-way video/audio  

### Seed data

```bash
cd backend
python seed.py          # skip if DB already has rows
python seed.py --force  # wipe and re-seed
```

Inserts upcoming + recent sample meetings and participant history.

---

## Database schema

### `meetings`

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer PK | Internal ID |
| `meeting_id` | String UUID | Public ID in URLs |
| `title` | String | Meeting name |
| `description` | Text | Optional |
| `status` | String | `active` \| `ended` |
| `created_at` | DateTime | UTC |
| `scheduled_at` | DateTime | Optional scheduled start |
| `duration` | Integer | Minutes (max 45 when scheduled) |

### `participants`

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer PK | Internal ID |
| `meeting_id` | Integer FK | → `meetings.id` |
| `session_user_id` | String UUID | Per-session WebRTC/signaling ID |
| `display_name` | String | Name from pre-join |
| `joined_at` | DateTime | UTC |
| `left_at` | DateTime | Null while in meeting |

```mermaid
erDiagram
    meetings ||--o{ participants : has
    meetings {
        int id PK
        string meeting_id UK
        string title
        text description
        string status
        datetime created_at
        datetime scheduled_at
        int duration
    }
    participants {
        int id PK
        int meeting_id FK
        string session_user_id
        string display_name
        datetime joined_at
        datetime left_at
    }
```

Invite links are computed at runtime: `{FRONTEND_URL}/meeting/{meeting_id}` (not stored in DB).

---

## API reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/meetings` | Create meeting |
| `GET` | `/meetings` | List meetings |
| `GET` | `/meetings/{meeting_id}` | Get one meeting |
| `POST` | `/meetings/{meeting_id}/join` | Join (returns session IDs) |
| `POST` | `/meetings/{meeting_id}/leave?session_user_id=` | Leave |
| `WS` | `/ws/{meeting_id}?user_id=&display_name=` | Signaling |
| `GET` | `/health` | Health check |

---

## Deployment

| Service | Platform | Root directory | Notes |
|---------|----------|----------------|-------|
| Frontend | Vercel | `frontend` | Set `NEXT_PUBLIC_*` env vars |
| Backend | Railway / Render | `backend` | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

**Production checklist**

- [ ] `NEXT_PUBLIC_API_URL` → `https://your-api...`
- [ ] `NEXT_PUBLIC_WS_URL` → `wss://your-api...`
- [ ] `FRONTEND_URL` + `CORS_ORIGINS` on backend
- [ ] HTTPS required for `getUserMedia` in production
- [ ] Consider TURN servers for restrictive networks (STUN-only today)

---

## Assumptions & limits

1. **No auth** — guest user only; `session_user_id` identifies participants per tab.
2. **SQLite** — fine for dev/demo; use Postgres + persistent volume in production.
3. **Mesh WebRTC** — each pair has a peer connection; scales to 5 participants.
4. **In-memory rooms** — `RoomManager` is single-process; multi-instance needs Redis/shared state.
5. **Host** — first WebSocket joiner; host-only actions validated server-side.
6. **Duration** — scheduled meetings capped at 45 minutes.

---

## Cursor rules

Project conventions for AI-assisted development live in:

- [`.cursor/rules/frontend.mdc`](.cursor/rules/frontend.mdc) — Next.js, hooks, UI patterns
- [`.cursor/rules/backend.mdc`](.cursor/rules/backend.mdc) — FastAPI, services, WebSocket

---

## License

Built as an SDE Fullstack assignment project.
