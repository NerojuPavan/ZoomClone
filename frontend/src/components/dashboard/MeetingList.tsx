"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Timer, Users, type LucideIcon } from "lucide-react";

import {
  getEffectiveDuration,
  getMeetingEnd,
  getMeetingJoinState,
  getMeetingStart,
  isMeetingOpen,
  type MeetingJoinState,
} from "@/lib/meeting-rules";
import type { MeetingListItem } from "@/types/meeting";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

interface MeetingListProps {
  variant: "open" | "upcoming" | "recent";
  title: string;
  description: string;
  meetings: MeetingListItem[];
  emptyMessage: string;
  icon: LucideIcon;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getDateGroupLabel(date: Date, now: Date): string {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function groupMeetingsByDate(
  meetings: MeetingListItem[],
  now: Date,
  reverse = false,
): { label: string; meetings: MeetingListItem[] }[] {
  const sorted = [...meetings].sort((a, b) => {
    const aTime = getMeetingStart(a).getTime();
    const bTime = getMeetingStart(b).getTime();
    return reverse ? bTime - aTime : aTime - bTime;
  });

  const groups = new Map<string, MeetingListItem[]>();

  for (const meeting of sorted) {
    const start = getMeetingStart(meeting);
    const label = getDateGroupLabel(start, now);
    const existing = groups.get(label) ?? [];
    existing.push(meeting);
    groups.set(label, existing);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    meetings: items,
  }));
}

function StatusBadge({ joinState }: { joinState: MeetingJoinState }) {
  if (joinState.joinable) return null;

  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        joinState.reason === "not_started"
          ? "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
          : "bg-muted text-muted-foreground",
      )}
    >
      {joinState.label}
    </span>
  );
}

function CopyLinkButton({ shareLink }: { shareLink: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground"
      onClick={handleCopy}
    >
      <Copy className="mr-1 h-3.5 w-3.5" />
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function OpenMeetingRow({ meeting }: { meeting: MeetingListItem }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-foreground">{meeting.title}</p>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            Always open
          </span>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            Live
          </span>
        </div>
        {meeting.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {meeting.description}
          </p>
        )}
        <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-0.5">
            <Users className="h-3 w-3" />
            {meeting.participant_count} joined
          </span>
          <span className="font-mono">{meeting.meeting_id.slice(0, 8)}</span>
        </p>
      </div>

      <div className="flex items-center gap-1">
        {meeting.share_link && <CopyLinkButton shareLink={meeting.share_link} />}
        <Button
          asChild
          size="sm"
          className="h-8 rounded-md bg-primary px-4 text-xs text-primary-foreground hover:bg-primary/90"
        >
          <Link href={`/meeting/${meeting.meeting_id}`}>Join</Link>
        </Button>
      </div>
    </div>
  );
}

function UpcomingMeetingRow({
  meeting,
  now,
}: {
  meeting: MeetingListItem;
  now: Date;
}) {
  const start = getMeetingStart(meeting);
  const end = getMeetingEnd(meeting);
  const joinState = getMeetingJoinState(meeting, now);
  const isOpen = isMeetingOpen(meeting, now);
  const duration = getEffectiveDuration(meeting);
  const isScheduled = Boolean(meeting.scheduled_at);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-5",
        joinState.joinable && "hover:bg-muted/40",
      )}
    >
      <div className="flex min-w-0 flex-1 gap-4">
        <div className="w-20 shrink-0 text-sm">
          <p className="font-medium text-foreground">{formatTime(start)}</p>
          <p className="text-xs text-muted-foreground">{formatTime(end)}</p>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium text-foreground">{meeting.title}</p>
            {isOpen && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                Live
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isScheduled ? `${duration} min` : "Instant"}
            {" · "}
            <span className="font-mono">{meeting.meeting_id.slice(0, 8)}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 pl-24 sm:pl-0">
        {meeting.share_link && <CopyLinkButton shareLink={meeting.share_link} />}
        {joinState.joinable ? (
          <Button asChild size="sm" className="h-8 rounded-md px-4 text-xs">
            <Link href={`/meeting/${meeting.meeting_id}`}>Start</Link>
          </Button>
        ) : (
          <StatusBadge joinState={joinState} />
        )}
      </div>
    </div>
  );
}

function RecentMeetingRow({
  meeting,
  now,
}: {
  meeting: MeetingListItem;
  now: Date;
}) {
  const start = getMeetingStart(meeting);
  const duration = getEffectiveDuration(meeting);
  const joinState = getMeetingJoinState(meeting, now);
  const isScheduled = Boolean(meeting.scheduled_at);

  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex min-w-0 flex-1 gap-4">
        <div className="w-20 shrink-0 text-sm">
          <p className="font-medium text-foreground">{formatTime(start)}</p>
          <p className="text-xs text-muted-foreground">{formatShortDate(start)}</p>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{meeting.title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span>{isScheduled ? "Scheduled" : "Instant"}</span>
            <span className="inline-flex items-center gap-0.5">
              <Timer className="h-3 w-3" />
              {duration}m
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Users className="h-3 w-3" />
              {meeting.participant_count}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-24 sm:pl-0">
        {!joinState.joinable && <StatusBadge joinState={joinState} />}
        {joinState.joinable && (
          <Button
            asChild
            size="sm"
            className="h-8 rounded-md bg-primary px-4 text-xs text-primary-foreground hover:bg-primary/90"
          >
            <Link href={`/meeting/${meeting.meeting_id}`}>Join</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export function MeetingList({
  variant,
  title,
  description,
  meetings,
  emptyMessage,
  icon: HeaderIcon,
}: MeetingListProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const groups = useMemo(() => {
    if (variant === "open") return [];
    return groupMeetingsByDate(meetings, now, variant === "recent");
  }, [meetings, now, variant]);

  const openCount = meetings.filter((m) => isMeetingOpen(m, now)).length;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <HeaderIcon className="h-4 w-4 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {variant === "upcoming" && openCount > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400">{openCount} live</span>
          )}
          <span>{meetings.length}</span>
        </div>
      </div>

      {meetings.length === 0 ? (
        <div className="px-4 py-10 text-center sm:px-5">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : variant === "open" ? (
        <div>
          {meetings.map((meeting) => (
            <OpenMeetingRow key={meeting.meeting_id} meeting={meeting} />
          ))}
        </div>
      ) : (
        <div>
          {groups.map((group) => (
            <div key={group.label}>
              <div className="border-b border-border bg-muted/30 px-4 py-1.5 sm:px-5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </p>
              </div>
              {group.meetings.map((meeting) =>
                variant === "upcoming" ? (
                  <UpcomingMeetingRow key={meeting.meeting_id} meeting={meeting} now={now} />
                ) : (
                  <RecentMeetingRow key={meeting.meeting_id} meeting={meeting} now={now} />
                ),
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
