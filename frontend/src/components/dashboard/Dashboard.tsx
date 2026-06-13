"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, Globe, History, Loader2 } from "lucide-react";

import { useAuth } from "@/components/providers/AuthProvider";

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
  const router = useRouter();
  const { user, isReady, canAccessDashboard } = useAuth();
  const [publicMeetings, setPublicMeetings] = useState<MeetingListItem[]>([]);
  const [myMeetings, setMyMeetings] = useState<MeetingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeDialog, setActiveDialog] = useState<DashboardAction | null>(null);

  const loadMeetings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await meetingApi.listMeetings(user?.id);
      setPublicMeetings(data.public_meetings);
      setMyMeetings(data.my_meetings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load meetings");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isReady && !canAccessDashboard) {
      router.replace("/");
    }
  }, [isReady, canAccessDashboard, router]);

  useEffect(() => {
    if (!canAccessDashboard) return;
    loadMeetings();
  }, [loadMeetings, canAccessDashboard]);

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

  const openRooms = useMemo(() => {
    return publicMeetings.filter((m) => matchesSearch(m, search));
  }, [publicMeetings, search]);

  const upcomingMeetings = useMemo(() => {
    return myMeetings
      .filter((m) => isUpcomingMeeting(m, now))
      .filter((m) => matchesSearch(m, search));
  }, [myMeetings, now, search]);

  const recentMeetings = useMemo(() => {
    return myMeetings
      .filter((m) => !isUpcomingMeeting(m, now))
      .filter((m) => matchesSearch(m, search));
  }, [myMeetings, now, search]);

  if (!isReady || !canAccessDashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
        Loading...
      </div>
    );
  }

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
              variant="open"
              title="Open Rooms"
              description="Always available — join anytime, shown to everyone"
              meetings={openRooms}
              emptyMessage={
                search.trim() ? "No open rooms match your search" : "No open rooms available"
              }
              icon={Globe}
            />

            {!user && (
              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-center text-sm text-muted-foreground">
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>{" "}
                or{" "}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  register
                </Link>{" "}
                to create and save your own meetings.
              </div>
            )}

            {user && (
              <>
                <MeetingList
                  variant="upcoming"
                  title="My Upcoming Meetings"
                  description="Your scheduled sessions"
                  meetings={upcomingMeetings}
                  emptyMessage={
                    search.trim()
                      ? "No upcoming meetings match your search"
                      : "No upcoming meetings yet"
                  }
                  icon={CalendarClock}
                />
                <MeetingList
                  variant="recent"
                  title="My Previous Meetings"
                  description="Your past instant and scheduled calls"
                  meetings={recentMeetings}
                  emptyMessage={
                    search.trim()
                      ? "No previous meetings match your search"
                      : "No previous meetings yet"
                  }
                  icon={History}
                />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
