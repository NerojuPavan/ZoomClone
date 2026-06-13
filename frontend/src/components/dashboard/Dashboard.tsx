"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, History, Loader2 } from "lucide-react";

import { isUpcomingMeeting } from "@/lib/meeting-rules";
import { meetingApi } from "@/services/meeting-api";
import type { MeetingListItem } from "@/types/meeting";

import { DashboardHero, type DashboardAction } from "./DashboardHero";
import { DashboardNav } from "./DashboardNav";
import { MeetingList } from "./MeetingList";

function matchesSearch(meeting: MeetingListItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    meeting.title.toLowerCase().includes(q) ||
    meeting.meeting_id.toLowerCase().includes(q) ||
    (meeting.description?.toLowerCase().includes(q) ?? false)
  );
}

export function Dashboard() {
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeDialog, setActiveDialog] = useState<DashboardAction | null>(null);

  const loadMeetings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await meetingApi.listMeetings();
      setMeetings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load meetings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("dashboard-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const now = new Date();

  const upcomingMeetings = useMemo(() => {
    return meetings
      .filter((m) => isUpcomingMeeting(m, now))
      .filter((m) => matchesSearch(m, search));
  }, [meetings, now, search]);

  const recentMeetings = useMemo(() => {
    return meetings
      .filter((m) => !isUpcomingMeeting(m, now))
      .filter((m) => matchesSearch(m, search));
  }, [meetings, now, search]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav
        activeDialog={activeDialog}
        onDialogChange={setActiveDialog}
        onScheduled={loadMeetings}
        search={search}
        onSearchChange={setSearch}
      />

      <DashboardHero onAction={setActiveDialog} />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        {isLoading ? (
          <div className="flex items-center justify-center rounded-xl border border-border bg-card py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
            Loading meetings...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : (
          <div className="space-y-5">
            <MeetingList
              variant="upcoming"
              title="Upcoming Meetings"
              description="Scheduled sessions you can start or join"
              meetings={upcomingMeetings}
              emptyMessage={
                search.trim() ? "No upcoming meetings match your search" : "No upcoming meetings"
              }
              icon={CalendarClock}
            />
            <MeetingList
              variant="recent"
              title="Previous Meetings"
              description="Instant calls and past sessions"
              meetings={recentMeetings}
              emptyMessage={
                search.trim() ? "No previous meetings match your search" : "No previous meetings"
              }
              icon={History}
            />
          </div>
        )}
      </main>
    </div>
  );
}
