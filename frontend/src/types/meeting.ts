export interface Participant {
  id: number;
  session_user_id: string;
  display_name: string;
  joined_at: string;
  left_at: string | null;
}

export interface Meeting {
  id: number;
  meeting_id: string;
  title: string;
  description: string | null;
  created_at: string;
  scheduled_at: string | null;
  duration: number | null;
  share_link: string;
  participants: Participant[];
}

export interface MeetingListItem {
  id: number;
  meeting_id: string;
  title: string;
  description: string | null;
  created_at: string;
  scheduled_at: string | null;
  duration: number | null;
  share_link: string;
  participant_count: number;
}

export interface MeetingCreatePayload {
  title: string;
  description?: string | null;
  scheduled_at?: string | null;
  duration?: number | null;
}

export interface JoinMeetingResponse {
  meeting: Meeting;
  session_user_id: string;
  participant_id: number;
}

export interface RoomParticipant {
  user_id: string;
  display_name: string;
}

export interface RemotePeer {
  userId: string;
  displayName: string;
  stream: MediaStream | null;
}

export interface JoinPreferences {
  displayName: string;
  micOn: boolean;
  cameraOn: boolean;
}

export type SignalingMessageType =
  | "room-state"
  | "user-joined"
  | "user-left"
  | "offer"
  | "answer"
  | "ice-candidate"
  | "leave"
  | "error"
  | "host-mute"
  | "host-video-off"
  | "host-kick"
  | "kicked"
  | "host-changed";

export interface SignalingMessage {
  type: SignalingMessageType;
  user_id?: string;
  target_user_id?: string;
  payload: Record<string, unknown>;
}
