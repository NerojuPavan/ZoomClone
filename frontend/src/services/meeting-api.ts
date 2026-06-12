import { API_BASE_URL } from "@/lib/config";
import type {
  JoinMeetingResponse,
  Meeting,
  MeetingCreatePayload,
  MeetingListItem,
} from "@/types/meeting";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      typeof body.detail === "string"
        ? body.detail
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const meetingApi = {
  createMeeting(payload: MeetingCreatePayload): Promise<Meeting> {
    return request<Meeting>("/meetings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  listMeetings(): Promise<MeetingListItem[]> {
    return request<MeetingListItem[]>("/meetings");
  },

  getMeeting(meetingId: string): Promise<Meeting> {
    return request<Meeting>(`/meetings/${meetingId}`);
  },

  joinMeeting(
    meetingId: string,
    displayName: string,
  ): Promise<JoinMeetingResponse> {
    return request<JoinMeetingResponse>(`/meetings/${meetingId}/join`, {
      method: "POST",
      body: JSON.stringify({ display_name: displayName }),
    });
  },

  leaveMeeting(meetingId: string, sessionUserId: string): Promise<void> {
    return request<void>(
      `/meetings/${meetingId}/leave?session_user_id=${encodeURIComponent(sessionUserId)}`,
      { method: "POST" },
    );
  },
};
