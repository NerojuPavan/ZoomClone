const SESSION_PREFIX = "zoom-clone-session:";

export interface MeetingSession {
  meetingId: string;
  sessionUserId: string;
  participantId: number;
  displayName: string;
}

export function getMeetingSession(meetingId: string): MeetingSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(`${SESSION_PREFIX}${meetingId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MeetingSession;
  } catch {
    return null;
  }
}

export function setMeetingSession(session: MeetingSession): void {
  sessionStorage.setItem(
    `${SESSION_PREFIX}${session.meetingId}`,
    JSON.stringify(session),
  );
}

export function clearMeetingSession(meetingId: string): void {
  sessionStorage.removeItem(`${SESSION_PREFIX}${meetingId}`);
}
