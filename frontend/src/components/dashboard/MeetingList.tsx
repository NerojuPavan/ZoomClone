"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Clock,
  History,
  Timer,
  Users,
  Video,
} from "lucide-react";

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

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MeetingList({
  variant,
  title,
  description,
  meetings,
  emptyMessage,
}: MeetingListProps) {
  const config = variantConfig[variant];
  const HeaderIcon = config.icon;
  const EmptyIcon = config.emptyIcon;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#DFE3E8] bg-white shadow-sm">
      <div className="flex items-center gap-4 border-b border-[#EFF2F6] bg-gradient-to-r from-white to-[#F7F9FC] px-6 py-5">
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
            <h3 className="text-lg font-bold text-[#1C1F25]">{title}</h3>
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
          <p className="text-sm text-[#6E7680]">{description}</p>
        </div>
        <span className="rounded-full bg-[#EFF2F6] px-3 py-1 text-sm font-semibold text-[#3D4149]">
          {meetings.length}
        </span>
      </div>

      <div className="p-4">
        {meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#DFE3E8] bg-[#F7F9FC] px-6 py-12 text-center">
            <div
              className={cn(
                "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl",
                config.accentLight,
              )}
            >
              <EmptyIcon className={cn("h-7 w-7", config.accentText)} />
            </div>
            <p className="text-sm font-medium text-[#3D4149]">{emptyMessage}</p>
            <p className="mt-1 text-xs text-[#9AA0A9]">
              Use the buttons above to create your first meeting
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {meetings.map((meeting) => (
              <li key={meeting.meeting_id}>
                <Link
                  href={`/meeting/${meeting.meeting_id}`}
                  className={cn(
                    "group flex items-center gap-4 rounded-xl border border-[#EFF2F6] border-l-4 bg-white p-4 transition-all",
                    "hover:border-[#DFE3E8] hover:bg-[#F7F9FC] hover:shadow-md",
                    config.border,
                  )}
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                      config.accentLight,
                    )}
                  >
                    <Video className={cn("h-5 w-5", config.accentText)} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="truncate font-semibold text-[#1C1F25] group-hover:text-[#0E71EB]">
                        {meeting.title}
                      </h4>
                      <code className="shrink-0 rounded-md bg-[#EFF2F6] px-2 py-0.5 text-[10px] font-medium text-[#6E7680]">
                        {meeting.meeting_id.slice(0, 8)}
                      </code>
                    </div>
                    {meeting.description && (
                      <p className="mt-0.5 line-clamp-1 text-sm text-[#6E7680]">
                        {meeting.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#6E7680]">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F7F9FC] px-2 py-1">
                        <Clock className="h-3.5 w-3.5 text-[#2D8CFF]" />
                        {formatDate(meeting.scheduled_at ?? meeting.created_at)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F7F9FC] px-2 py-1">
                        <Users className="h-3.5 w-3.5 text-[#09A287]" />
                        {meeting.participant_count} joined
                      </span>
                      {meeting.duration && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F7F9FC] px-2 py-1">
                          <Timer className="h-3.5 w-3.5 text-[#7B68EE]" />
                          {meeting.duration} min
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="h-5 w-5 shrink-0 text-[#DFE3E8] transition-colors group-hover:text-[#2D8CFF]" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
