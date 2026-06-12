"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutGrid, Loader2 } from "lucide-react";

import { isUpcomingMeeting } from "@/lib/meeting-rules";
import { meetingApi } from "@/services/meeting-api";
import type { MeetingListItem } from "@/types/meeting";

import { DashboardNav } from "./DashboardNav";
import { MeetingList } from "./MeetingList";

export function Dashboard() {
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const now = new Date();

  const upcomingMeetings = useMemo(
    () => meetings.filter((m) => isUpcomingMeeting(m, now)),
    [meetings, now],
  );

  const recentMeetings = useMemo(
    () => meetings.filter((m) => !isUpcomingMeeting(m, now)),
    [meetings, now],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-[#2D8CFF]/8 blur-3xl" />
        <div className="absolute -right-32 top-48 h-80 w-80 rounded-full bg-[#7B68EE]/8 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#09A287]/6 blur-3xl" />
      </div>

      <DashboardNav onScheduled={loadMeetings} />

      <main className="relative mx-auto max-w-6xl space-y-8 px-4 py-8 md:py-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <LayoutGrid className="h-4 w-4 text-accent-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Your meetings</h2>
            <p className="text-sm text-muted-foreground">
              Upcoming schedules and recent sessions
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-20 text-muted-foreground shadow-sm">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
            Loading your meetings...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-600">
            {error}
          </div>
        ) : (
          <section className="grid gap-6 lg:grid-cols-2">
            <MeetingList
              variant="upcoming"
              title="Upcoming Meetings"
              description="Scheduled sessions on your calendar"
              meetings={upcomingMeetings}
              emptyMessage="No upcoming meetings scheduled"
            />
            <MeetingList
              variant="recent"
              title="Recent Meetings"
              description="Instant calls and past sessions"
              meetings={recentMeetings}
              emptyMessage="No recent meetings yet"
            />
          </section>
        )}
      </main>
    </div>
  );
}
