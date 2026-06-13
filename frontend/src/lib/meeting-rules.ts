import { parseApiDateTime } from "@/lib/datetime";
import type { MeetingListItem } from "@/types/meeting";

export const MAX_MEETING_DURATION_MINUTES = 45;

type JoinCheckMeeting = Pick<
  MeetingListItem,
  "status" | "scheduled_at" | "created_at" | "duration" | "meeting_id" | "is_permanent"
>;

export type MeetingJoinState =
  | { joinable: true }
  | { joinable: false; reason: "ended" | "not_started" | "expired"; label: string };

export function getEffectiveDuration(
  meeting: Pick<JoinCheckMeeting, "scheduled_at" | "duration">,
): number {
  if (meeting.scheduled_at) {
    return Math.min(
      meeting.duration ?? MAX_MEETING_DURATION_MINUTES,
      MAX_MEETING_DURATION_MINUTES,
    );
  }
  return MAX_MEETING_DURATION_MINUTES;
}

export function getMeetingStart(
  meeting: Pick<JoinCheckMeeting, "scheduled_at" | "created_at">,
): Date {
  return parseApiDateTime(meeting.scheduled_at ?? meeting.created_at);
}

export function getMeetingEnd(meeting: JoinCheckMeeting): Date {
  const start = getMeetingStart(meeting);
  return new Date(start.getTime() + getEffectiveDuration(meeting) * 60 * 1000);
}

export function getMeetingJoinState(
  meeting: JoinCheckMeeting,
  now: Date = new Date(),
): MeetingJoinState {
  if (meeting.is_permanent) {
    if (meeting.status === "ended") {
      return { joinable: false, reason: "ended", label: "Ended" };
    }
    return { joinable: true };
  }

  if (meeting.status === "ended") {
    return { joinable: false, reason: "ended", label: "Ended" };
  }

  const start = getMeetingStart(meeting);

  if (meeting.scheduled_at && now < start) {
    return { joinable: false, reason: "not_started", label: "Not started" };
  }

  if (now >= getMeetingEnd(meeting)) {
    return { joinable: false, reason: "expired", label: "Ended" };
  }

  return { joinable: true };
}

export function isUpcomingMeeting(
  meeting: JoinCheckMeeting,
  now: Date = new Date(),
): boolean {
  if (meeting.is_permanent) return false;
  if (!meeting.scheduled_at) return false;
  if (parseApiDateTime(meeting.scheduled_at) > now) return true;
  return getMeetingJoinState(meeting, now).joinable;
}

/** Scheduled or instant meeting that is active and currently within its join window. */
export function isMeetingOpen(
  meeting: JoinCheckMeeting,
  now: Date = new Date(),
): boolean {
  if (meeting.is_permanent && meeting.status !== "ended") return true;
  if (meeting.status === "ended") return false;

  const joinState = getMeetingJoinState(meeting, now);
  if (!joinState.joinable) return false;

  if (meeting.scheduled_at) {
    return now >= getMeetingStart(meeting);
  }

  return true;
}
