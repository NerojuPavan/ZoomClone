"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, Loader2, Settings } from "lucide-react";

import { SettingsDrawer } from "@/components/settings/SettingsDrawer";
import { Button } from "@/components/ui/button";
import { MAX_ROOM_PARTICIPANTS } from "@/lib/config";
import { getMeetingJoinState } from "@/lib/meeting-rules";
import { useMeeting } from "@/hooks/useMeeting";

import { ControlBar } from "./ControlBar";
import { ParticipantList } from "./ParticipantList";
import { PreJoinScreen } from "./PreJoinScreen";
import { VideoGrid } from "./VideoGrid";

interface MeetingRoomProps {
  meetingId: string;
}

export function MeetingRoom({ meetingId }: MeetingRoomProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    meeting,
    session,
    isLoading,
    error,
    isJoined,
    isConnected,
    joinMeeting,
    leaveMeeting,
    localStream,
    remotePeers,
    isCameraOn,
    isMicOn,
    toggleCamera,
    toggleMicrophone,
    mediaError,
    isMediaReady,
    isHost,
    hostUserId,
    hostNotice,
    participants,
    kickParticipant,
    muteParticipant,
    muteAllParticipants,
    disableParticipantVideo,
  } = useMeeting({ meetingId });

  const participantCount = participants.length + 1;

  const handleJoin = async (prefs: Parameters<typeof joinMeeting>[0]) => {
    setIsJoining(true);
    setJoinError(null);
    try {
      await joinMeeting(prefs);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    await leaveMeeting();
  };

  const handleCopyLink = async () => {
    if (!meeting?.share_link) return;
    await navigator.clipboard.writeText(meeting.share_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-meeting-bg text-meeting-text-muted">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
        Loading meeting...
      </div>
    );
  }

  if (error && !meeting && !isJoined) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-meeting-bg text-meeting-text-muted">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!isJoined && meeting) {
    const joinState = getMeetingJoinState(meeting);
    if (!joinState.joinable) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-meeting-bg px-6 text-center text-meeting-text-muted">
          <p className="text-lg font-semibold text-meeting-text">{meeting.title}</p>
          <p className="text-red-400">
            {joinState.reason === "not_started"
              ? "This meeting hasn't started yet."
              : "This meeting has ended."}
          </p>
          <Link
            href="/"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to dashboard
          </Link>
        </div>
      );
    }
  }

  if (!isJoined) {
    return (
      <PreJoinScreen
        meetingTitle={meeting?.title ?? "Meeting"}
        meetingId={meetingId}
        onJoin={handleJoin}
        isJoining={isJoining}
        joinError={joinError}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-meeting-bg text-meeting-text">
      <header className="flex shrink-0 flex-col gap-2 border-b border-meeting-border bg-meeting-panel px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold sm:text-lg">{meeting?.title}</h1>
          <p className="text-xs text-meeting-text-muted">
            <span
              className={
                isConnected ? "text-emerald-400" : "text-amber-400"
              }
            >
              {isConnected ? "Connected" : "Connecting..."}
            </span>
            {" · "}
            {participantCount}/{MAX_ROOM_PARTICIPANTS} participants
            {isHost && (
              <span className="text-amber-400"> · Host</span>
            )}
          </p>
        </div>
        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 border-meeting-border bg-transparent text-meeting-text-muted hover:border-primary/50 hover:bg-meeting-panel-muted hover:text-meeting-text"
            aria-label="Settings"
            title="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          {meeting?.share_link && (
            <Button
              variant="outline"
              size="sm"
              className="w-full shrink-0 border-meeting-border bg-transparent text-meeting-text hover:border-primary/50 hover:bg-meeting-panel-muted sm:w-auto"
              onClick={handleCopyLink}
            >
              <Copy className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{copied ? "Copied!" : "Copy invite link"}</span>
              <span className="sm:hidden">{copied ? "Copied!" : "Copy link"}</span>
            </Button>
          )}
        </div>
      </header>

      {isParticipantsOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-label="Close participants panel"
          onClick={() => setIsParticipantsOpen(false)}
        />
      )}

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <main className="flex min-w-0 flex-1 flex-col">
          {mediaError && (
            <div className="shrink-0 bg-amber-900/50 px-4 py-2 text-sm text-amber-200">
              Media error: {mediaError}
            </div>
          )}
          {!isMediaReady && !mediaError && (
            <div className="flex shrink-0 items-center gap-2 bg-meeting-panel-muted px-4 py-2 text-sm text-meeting-text-muted">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Connecting to meeting...
            </div>
          )}
          {hostNotice && (
            <div className="shrink-0 bg-primary/20 px-4 py-2 text-sm text-accent-foreground">
              {hostNotice}
            </div>
          )}
          {error && (
            <div className="shrink-0 bg-red-900/50 px-4 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
          <VideoGrid
            localUserId={session?.sessionUserId ?? ""}
            localStream={localStream}
            localDisplayName={session?.displayName ?? "You"}
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            remotePeers={remotePeers}
            roomParticipants={participants}
          />
        </main>

        <ParticipantList
          isOpen={isParticipantsOpen}
          onClose={() => setIsParticipantsOpen(false)}
          localName={session?.displayName ?? "You"}
          localUserId={session?.sessionUserId ?? ""}
          hostUserId={hostUserId}
          isHost={isHost}
          isMicOn={isMicOn}
          isCameraOn={isCameraOn}
          participants={participants}
          remotePeers={remotePeers}
          onMute={muteParticipant}
          onMuteAll={muteAllParticipants}
          onDisableVideo={disableParticipantVideo}
          onKick={kickParticipant}
        />
      </div>

      <ControlBar
        isCameraOn={isCameraOn}
        isMicOn={isMicOn}
        participantCount={participantCount}
        isParticipantsOpen={isParticipantsOpen}
        onToggleParticipants={() => setIsParticipantsOpen((v) => !v)}
        onToggleCamera={toggleCamera}
        onToggleMicrophone={toggleMicrophone}
        onLeave={handleLeave}
        isLeaving={isLeaving}
      />

      <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
