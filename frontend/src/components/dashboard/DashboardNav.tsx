"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  FileText,
  Link2,
  Loader2,
  LogIn,
  LogOut,
  Plus,
  Search,
  Settings,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { formatLocalDateTime } from "@/lib/datetime";
import { getMeetingJoinState } from "@/lib/meeting-rules";
import { meetingApi } from "@/services/meeting-api";
import type { Meeting } from "@/types/meeting";

import {
  buildScheduledAtISO,
  DateTimeScheduler,
  getDefaultDateTimeValue,
  type DateTimeValue,
} from "./DateTimeScheduler";
import { DurationSelect } from "./DurationSelect";
import { DialogHeaderIcon } from "./DialogHeaderIcon";
import { FormField } from "./FormField";
import { SettingsDrawer } from "@/components/settings/SettingsDrawer";

import { ShareLinkBox } from "./ShareLinkBox";

export type DashboardDialog = "new" | "join" | "schedule";

interface DashboardNavProps {
  onScheduled?: () => void;
  activeDialog?: DashboardDialog | null;
  onDialogChange?: (dialog: DashboardDialog | null) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
}

export function DashboardNav({
  onScheduled,
  activeDialog: controlledDialog,
  onDialogChange,
  search = "",
  onSearchChange,
}: DashboardNavProps) {
  const router = useRouter();
  const { user, isGuest, logout } = useAuth();
  const [internalDialog, setInternalDialog] = useState<DashboardDialog | null>(null);
  const activeDialog = controlledDialog !== undefined ? controlledDialog : internalDialog;

  const setActiveDialog = (dialog: DashboardDialog | null) => {
    if (onDialogChange) onDialogChange(dialog);
    else setInternalDialog(dialog);
  };

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdMeeting, setCreatedMeeting] = useState<Meeting | null>(null);

  const [joinId, setJoinId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleDescription, setScheduleDescription] = useState("");
  const [dateTimeValue, setDateTimeValue] = useState<DateTimeValue>(() =>
    getDefaultDateTimeValue(),
  );
  const [duration, setDuration] = useState("30");
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scheduledMeeting, setScheduledMeeting] = useState<Meeting | null>(null);

  const closeDialog = () => {
    setActiveDialog(null);
    setCreateError(null);
    setJoinError(null);
    setScheduleError(null);
    setCreatedMeeting(null);
    setNewTitle("");
    setNewDescription("");
  };

  const closeScheduleDialog = () => {
    setActiveDialog(null);
    setScheduleError(null);
    setScheduleTitle("");
    setScheduleDescription("");
    setDateTimeValue(getDefaultDateTimeValue());
    setDuration("30");
  };

  const closeScheduleSuccess = () => {
    setScheduledMeeting(null);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const displayName = user?.username ?? (isGuest ? "Guest" : "User");
  const profileInitial = displayName.charAt(0).toUpperCase();

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTitle.trim()) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      const meeting = await meetingApi.createMeeting({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        user_id: user?.id ?? null,
      });
      setCreatedMeeting(meeting);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create meeting");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (event: React.FormEvent) => {
    event.preventDefault();
    const id = joinId.trim();
    if (!id) return;
    setIsJoining(true);
    setJoinError(null);
    try {
      const meeting = await meetingApi.getMeeting(id);
      const joinState = getMeetingJoinState(meeting);
      if (!joinState.joinable) {
        setJoinError(
          joinState.reason === "not_started"
            ? "This meeting hasn't started yet"
            : "This meeting has ended",
        );
        return;
      }
      window.location.href = `/meeting/${id}`;
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Meeting not found");
    } finally {
      setIsJoining(false);
    }
  };

  const handleSchedule = async (event: React.FormEvent) => {
    event.preventDefault();
    const scheduledAtISO = buildScheduledAtISO(dateTimeValue);
    if (!scheduleTitle.trim() || !scheduledAtISO) return;
    setIsScheduling(true);
    setScheduleError(null);
    try {
      const meeting = await meetingApi.createMeeting({
        title: scheduleTitle.trim(),
        description: scheduleDescription.trim() || null,
        scheduled_at: scheduledAtISO,
        duration: Number(duration) || 30,
        user_id: user?.id ?? null,
      });
      closeScheduleDialog();
      setScheduledMeeting(meeting);
      onScheduled?.();
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : "Failed to schedule");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-3 py-3 sm:gap-4 sm:px-6">
          <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm sm:h-10 sm:w-10">
              <Video className="h-5 w-5" />
            </div>
            <span className="hidden truncate text-base font-bold text-foreground sm:inline sm:text-lg">
              Zoom Clone
            </span>
          </Link>

          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="dashboard-search"
              type="search"
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search"
              aria-label="Search meetings"
              className="h-9 w-full rounded-lg border border-border bg-muted/50 pl-9 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-muted/30"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:inline-block">
              Ctrl+K
            </kbd>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Settings"
              title="Settings"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Log out"
              title="Log out"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-9 gap-2 rounded-xl px-2 text-secondary-foreground hover:bg-muted"
              aria-label="Profile"
              title={displayName}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {profileInitial}
              </div>
              <span className="hidden max-w-[120px] truncate text-sm font-medium md:inline">
                {displayName}
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* New Meeting Dialog */}
      <Dialog open={activeDialog === "new"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="gap-0 overflow-hidden border-border p-0 sm:max-w-lg">
          <div className="border-b border-border bg-gradient-to-b from-[#FFF0E8]/50 to-card px-6 pb-6 pt-6">
            <DialogHeaderIcon
              icon={Plus}
              title="Start a New Meeting"
              subtitle="Instant meeting"
              accent="orange"
            />
          </div>
          {createdMeeting ? (
            <div className="space-y-5 px-6 py-6">
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                &quot;{createdMeeting.title}&quot; is ready. Share the invite link below.
              </p>
              <ShareLinkBox
                shareLink={createdMeeting.share_link}
                meetingId={createdMeeting.meeting_id}
              />
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 flex-1 rounded-xl border-border"
                  onClick={closeDialog}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  className="h-12 flex-1 rounded-xl bg-gradient-to-r from-[#FF8A4C] to-[#FF6B2C] text-base font-semibold shadow-md shadow-orange-200/50 hover:from-[#FF7A3C] hover:to-[#E85D1A]"
                  onClick={() => {
                    window.location.href = `/meeting/${createdMeeting.meeting_id}`;
                  }}
                >
                  <Video className="mr-2 h-4 w-4" />
                  Join Meeting
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-5 px-6 py-6">
              <FormField
                id="nav-title"
                label="Meeting title"
                icon={Video}
                required
                placeholder="e.g. Team standup"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                hint="Give your meeting a clear, recognizable name"
              />
              <FormField
                id="nav-desc"
                label="Description"
                icon={FileText}
                multiline
                placeholder="What's this meeting about?"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
              {createError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{createError}</p>
              )}
              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-gradient-to-r from-[#FF8A4C] to-[#FF6B2C] text-base font-semibold shadow-md shadow-orange-200/50 hover:from-[#FF7A3C] hover:to-[#E85D1A]"
                disabled={isCreating || !newTitle.trim()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Video className="mr-2 h-4 w-4" />
                    Start Meeting
                  </>
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Join Meeting Dialog */}
      <Dialog open={activeDialog === "join"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="gap-0 overflow-hidden border-border p-0 sm:max-w-lg">
          <div className="border-b border-border bg-gradient-to-b from-[#E7F1FF]/50 to-card px-6 pb-6 pt-6">
            <DialogHeaderIcon
              icon={LogIn}
              title="Join a Meeting"
              subtitle="Enter meeting ID"
              accent="blue"
            />
          </div>
          <form onSubmit={handleJoin} className="space-y-5 px-6 py-6">
            <FormField
              id="nav-join-id"
              label="Meeting ID or invite link"
              icon={Link2}
              required
              placeholder="Paste link or enter ID"
              value={joinId}
              onChange={(e) => {
                const value = e.target.value;
                const match = value.match(/\/meeting\/([a-f0-9-]+)/i);
                setJoinId(match ? match[1] : value);
              }}
              hint="You can paste the full invite URL from your host"
            />
            {joinError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{joinError}</p>
            )}
            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-gradient-to-r from-[#2D8CFF] to-[#0E71EB] text-base font-semibold shadow-md shadow-blue-200/50 hover:from-[#1A7EF5] hover:to-[#0C65D8]"
              disabled={isJoining || !joinId.trim()}
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Join Meeting
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Meeting Dialog */}
      <Dialog open={activeDialog === "schedule"} onOpenChange={(open) => !open && closeScheduleDialog()}>
        <DialogContent className="gap-0 overflow-hidden border-border p-0 sm:max-w-[480px]">
          <div className="border-b border-border px-6 py-5">
            <DialogHeaderIcon
              icon={CalendarDays}
              title="Schedule Meeting"
              subtitle=""
              accent="blue"
              compact
            />
          </div>
          <form onSubmit={handleSchedule} className="space-y-4 px-6 py-5">
            <FormField
              id="nav-schedule-title"
              label="Topic"
              required
              placeholder="My Meeting"
              value={scheduleTitle}
              onChange={(e) => setScheduleTitle(e.target.value)}
            />
            <FormField
              id="nav-schedule-desc"
              label="Description"
              multiline
              placeholder="Optional meeting description"
              value={scheduleDescription}
              onChange={(e) => setScheduleDescription(e.target.value)}
            />
            <DateTimeScheduler value={dateTimeValue} onChange={setDateTimeValue} />
            <DurationSelect value={duration} onChange={setDuration} />
            {scheduleError && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
                {scheduleError}
              </p>
            )}
            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-md border-border px-5"
                onClick={closeScheduleDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-10 rounded-md bg-[#0E71EB] px-6 font-semibold hover:bg-[#0C65D8]"
                disabled={
                  isScheduling ||
                  !scheduleTitle.trim() ||
                  !buildScheduledAtISO(dateTimeValue)
                }
              >
                {isScheduling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Success Dialog */}
      <Dialog open={!!scheduledMeeting} onOpenChange={(open) => !open && closeScheduleSuccess()}>
        <DialogContent className="gap-0 overflow-hidden border-border p-0 sm:max-w-[480px]">
          <div className="border-b border-border px-6 py-5">
            <DialogHeaderIcon
              icon={CalendarDays}
              title="Meeting Scheduled"
              subtitle=""
              accent="blue"
              compact
            />
          </div>
          {scheduledMeeting && (
            <div className="space-y-4 px-6 py-5">
              <p className="text-sm text-secondary-foreground">
                Your meeting has been scheduled.
              </p>

              <div className="rounded-md border border-border bg-muted/40 p-4">
                <p className="text-base font-semibold text-foreground">{scheduledMeeting.title}</p>
                {scheduledMeeting.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{scheduledMeeting.description}</p>
                )}
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p>
                    {formatLocalDateTime(scheduledMeeting.scheduled_at, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <p>{scheduledMeeting.duration ?? 45} minutes</p>
                </div>
              </div>

              <ShareLinkBox
                shareLink={scheduledMeeting.share_link}
                meetingId={scheduledMeeting.meeting_id}
                label="Invite link"
              />

              <div className="flex justify-end border-t border-border pt-4">
                <Button
                  type="button"
                  className="h-10 rounded-md bg-[#0E71EB] px-6 font-semibold hover:bg-[#0C65D8]"
                  onClick={closeScheduleSuccess}
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
