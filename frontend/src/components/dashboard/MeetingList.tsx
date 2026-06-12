"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Clock,
  History,
  Lock,
  Timer,
  Users,
  Video,
} from "lucide-react";

import { formatLocalDateTime } from "@/lib/datetime";
import {
  getEffectiveDuration,
  getMeetingJoinState,
  isMeetingOpen,
} from "@/lib/meeting-rules";
import type { MeetingListItem } from "@/types/meeting";
import { cn } from "@/lib/utils";

interface MeetingListProps {
  variant: "upcoming" | "recent";
  title: string;
  description: string;
  meetings: MeetingListItem[];
  emptyMessage: string;
}

const variantConfig = {
  upcoming: {
    icon: CalendarClock,
    accent: "from-[#2D8CFF] to-[#0E71EB]",
    accentLight: "bg-[#E7F1FF]",
    accentText: "text-[#0E71EB]",
    border: "border-l-[#2D8CFF]",
    badge: "Upcoming",
    emptyIcon: CalendarClock,
  },
  recent: {
    icon: History,
    accent: "from-[#09A287] to-[#078A70]",
    accentLight: "bg-[#E6F7F3]",
    accentText: "text-[#078A70]",
    border: "border-l-[#09A287]",
    badge: "Recent",
    emptyIcon: Video,
  },
};

function OpenBadge() {
  return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
      <span className="relative flex h-2 w-2" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      Open
    </span>
  );
}

function MeetingCard({
  meeting,
  variant,
  now,
}: {
  meeting: MeetingListItem;
  variant: "upcoming" | "recent";
  now: Date;
}) {
  const config = variantConfig[variant];
  const joinState = getMeetingJoinState(meeting, now);
  const isOpen = isMeetingOpen(meeting, now);
  const duration = getEffectiveDuration(meeting);
  const displayDate = meeting.scheduled_at ?? meeting.created_at;

  const cardClassName = cn(
    "group flex items-stretch gap-3 rounded-xl border border-border border-l-4 bg-card p-4 transition-all sm:gap-4",
    config.border,
    isOpen && "border-l-emerald-500 ring-1 ring-emerald-500/20",
    joinState.joinable
      ? "hover:border-border hover:bg-muted hover:shadow-md"
      : "cursor-default opacity-75",
  );

  const content = (
    <>
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12",
          config.accentLight,
        )}
      >
        <Video className={cn("h-5 w-5", config.accentText)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4
              className={cn(
                "truncate font-semibold text-foreground",
                joinState.joinable && "group-hover:text-primary",
              )}
            >
              {meeting.title}
            </h4>
            <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
              ID: {meeting.meeting_id.slice(0, 8)}
            </p>
          </div>
          {isOpen ? (
            <OpenBadge />
          ) : !joinState.joinable ? (
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
                joinState.reason === "not_started"
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
              )}
            >
              {joinState.label}
            </span>
          ) : null}
        </div>

        {meeting.description && (
          <p className="line-clamp-1 text-sm text-muted-foreground">{meeting.description}</p>
        )}

        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <div className="flex min-w-0 items-center gap-1.5 rounded-lg bg-muted px-2 py-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate">
              {formatLocalDateTime(displayDate, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-1.5 rounded-lg bg-muted px-2 py-1.5">
            <Users className="h-3.5 w-3.5 shrink-0 text-[#09A287]" />
            <span className="truncate">{meeting.participant_count} joined</span>
          </div>
          <div className="flex min-w-0 items-center gap-1.5 rounded-lg bg-muted px-2 py-1.5">
            <Timer className="h-3.5 w-3.5 shrink-0 text-[#7B68EE]" />
            <span className="truncate">{duration} min</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center self-center">
        {joinState.joinable ? (
          <ArrowRight className="h-5 w-5 text-border transition-colors group-hover:text-primary" />
        ) : (
          <Lock className="h-4 w-4 text-muted-foreground" aria-hidden />
        )}
      </div>
    </>
  );

  if (joinState.joinable) {
    return (
      <Link href={`/meeting/${meeting.meeting_id}`} className={cardClassName}>
        {content}
      </Link>
    );
  }

  return (
    <div className={cardClassName} aria-disabled title={joinState.label}>
      {content}
    </div>
  );
}

export function MeetingList({
  variant,
  title,
  description,
  meetings,
  emptyMessage,
}: MeetingListProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const config = variantConfig[variant];
  const HeaderIcon = config.icon;
  const EmptyIcon = config.emptyIcon;
  const openCount = meetings.filter((m) => isMeetingOpen(m, now)).length;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-4 border-b border-border bg-gradient-to-r from-card to-muted px-6 py-5">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
            config.accent,
          )}
        >
          <HeaderIcon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                config.accentLight,
                config.accentText,
              )}
            >
              {config.badge}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {description}
            {variant === "upcoming" && openCount > 0 && (
              <span className="mt-1 block text-emerald-600 dark:text-emerald-400">
                {openCount} meeting{openCount === 1 ? "" : "s"} open now
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {variant === "upcoming" && openCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {openCount} open
            </span>
          )}
          <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold text-secondary-foreground">
            {meetings.length}
          </span>
        </div>
      </div>

      <div className="p-4">
        {meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted px-6 py-12 text-center">
            <div
              className={cn(
                "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl",
                config.accentLight,
              )}
            >
              <EmptyIcon className={cn("h-7 w-7", config.accentText)} />
            </div>
            <p className="text-sm font-medium text-secondary-foreground">{emptyMessage}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use the buttons above to create your first meeting
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {meetings.map((meeting) => (
              <li key={meeting.meeting_id}>
                <MeetingCard meeting={meeting} variant={variant} now={now} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
