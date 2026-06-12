"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CalendarDays,
  FileText,
  Link2,
  Loader2,
  LogIn,
  Plus,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { meetingApi } from "@/services/meeting-api";

import {
  buildScheduledAtISO,
  DateTimeScheduler,
  getDefaultDateTimeValue,
  type DateTimeValue,
} from "./DateTimeScheduler";
import { DurationSelect } from "./DurationSelect";
import { DialogHeaderIcon } from "./DialogHeaderIcon";
import { FormField } from "./FormField";

interface DashboardNavProps {
  onScheduled?: () => void;
  activeDialog?: "new" | "join" | "schedule" | null;
  onDialogChange?: (dialog: "new" | "join" | "schedule" | null) => void;
}

export function DashboardNav({
  onScheduled,
  activeDialog: controlledDialog,
  onDialogChange,
}: DashboardNavProps) {
  const [internalDialog, setInternalDialog] = useState<"new" | "join" | "schedule" | null>(null);
  const activeDialog = controlledDialog !== undefined ? controlledDialog : internalDialog;

  const setActiveDialog = (dialog: "new" | "join" | "schedule" | null) => {
    if (onDialogChange) onDialogChange(dialog);
    else setInternalDialog(dialog);
  };

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);

  const closeDialog = () => {
    setActiveDialog(null);
    setCreateError(null);
    setJoinError(null);
    setScheduleError(null);
    setScheduleSuccess(null);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTitle.trim()) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      const meeting = await meetingApi.createMeeting({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
      });
      window.location.href = `/meeting/${meeting.meeting_id}`;
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
      await meetingApi.getMeeting(id);
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
    setScheduleSuccess(null);
    try {
      const meeting = await meetingApi.createMeeting({
        title: scheduleTitle.trim(),
        description: scheduleDescription.trim() || null,
        scheduled_at: scheduledAtISO,
        duration: Number(duration) || 30,
      });
      setScheduleSuccess(`"${meeting.title}" scheduled successfully!`);
      setScheduleTitle("");
      setScheduleDescription("");
      setDateTimeValue(getDefaultDateTimeValue());
      onScheduled?.();
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : "Failed to schedule");
    } finally {
      setIsScheduling(false);
    }
  };

  const navItems = [
    { key: "new" as const, label: "New Meeting", icon: Plus, color: "hover:bg-[#FFF0E8] hover:text-[#FF6B2C]" },
    { key: "join" as const, label: "Join", icon: LogIn, color: "hover:bg-[#E7F1FF] hover:text-[#0E71EB]" },
    { key: "schedule" as const, label: "Schedule", icon: Calendar, color: "hover:bg-[#F0EDFF] hover:text-[#7B68EE]" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#DFE3E8] bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2D8CFF] to-[#0E71EB] text-white shadow-md shadow-blue-200/50">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-[#1C1F25]">Zoom Clone</span>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#6E7680]">
                Meetings
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.key}
                  variant="ghost"
                  className={`gap-2 rounded-xl font-medium text-[#3D4149] ${item.color}`}
                  onClick={() => setActiveDialog(item.key)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* New Meeting Dialog */}
      <Dialog open={activeDialog === "new"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="gap-0 overflow-hidden border-[#DFE3E8] p-0 sm:max-w-lg">
          <div className="border-b border-[#EFF2F6] bg-gradient-to-b from-[#FFF0E8]/50 to-white px-6 pb-6 pt-6">
            <DialogHeaderIcon
              icon={Plus}
              title="Start a New Meeting"
              subtitle="Instant meeting"
              accent="orange"
            />
          </div>
          <form onSubmit={handleCreate} className="space-y-5 px-6 py-6">
            <FormField
              id="nav-title"
              label="Meeting title"
              icon={Video}
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
        </DialogContent>
      </Dialog>

      {/* Join Meeting Dialog */}
      <Dialog open={activeDialog === "join"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="gap-0 overflow-hidden border-[#DFE3E8] p-0 sm:max-w-lg">
          <div className="border-b border-[#EFF2F6] bg-gradient-to-b from-[#E7F1FF]/50 to-white px-6 pb-6 pt-6">
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
      <Dialog open={activeDialog === "schedule"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="gap-0 overflow-hidden border-[#DFE3E8] p-0 sm:max-w-lg">
          <div className="border-b border-[#EFF2F6] bg-gradient-to-b from-[#F0EDFF]/50 to-white px-6 pb-6 pt-6">
            <DialogHeaderIcon
              icon={CalendarDays}
              title="Schedule a Meeting"
              subtitle="Plan ahead"
              accent="purple"
            />
          </div>
          <form onSubmit={handleSchedule} className="space-y-5 px-6 py-6">
            <FormField
              id="nav-schedule-title"
              label="Meeting title"
              icon={Video}
              placeholder="Weekly review"
              value={scheduleTitle}
              onChange={(e) => setScheduleTitle(e.target.value)}
            />
            <FormField
              id="nav-schedule-desc"
              label="Description"
              icon={FileText}
              multiline
              placeholder="Agenda, notes, or goals"
              value={scheduleDescription}
              onChange={(e) => setScheduleDescription(e.target.value)}
            />
            <DateTimeScheduler value={dateTimeValue} onChange={setDateTimeValue} />
            <DurationSelect value={duration} onChange={setDuration} />
            {scheduleError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{scheduleError}</p>
            )}
            {scheduleSuccess && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {scheduleSuccess}
              </p>
            )}
            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-gradient-to-r from-[#9B8AFF] to-[#7B68EE] text-base font-semibold shadow-md shadow-violet-200/50 hover:from-[#8B7AEF] hover:to-[#6B58DE]"
              disabled={
                isScheduling ||
                !scheduleTitle.trim() ||
                !buildScheduledAtISO(dateTimeValue)
              }
            >
              {isScheduling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
