"use client";

import { useState } from "react";
import { Copy, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MAX_ROOM_PARTICIPANTS } from "@/lib/config";
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
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(true);

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
      <div className="flex min-h-screen items-center justify-center bg-[#1a1d21] text-zinc-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#2D8CFF]" />
        Loading meeting...
      </div>
    );
  }

  if (error && !meeting && !isJoined) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#1a1d21] text-zinc-400">
        <p className="text-red-400">{error}</p>
      </div>
    );
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
    <div className="flex h-screen flex-col overflow-hidden bg-[#0f1114] text-white">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-[#1a1d21] px-5 py-3">
        <div>
          <h1 className="text-lg font-semibold">{meeting?.title}</h1>
          <p className="text-xs text-zinc-400">
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
        {meeting?.share_link && (
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-700 bg-transparent text-zinc-200 hover:border-[#2D8CFF]/50 hover:bg-zinc-800"
            onClick={handleCopyLink}
          >
            <Copy className="mr-2 h-4 w-4" />
            {copied ? "Copied!" : "Copy invite link"}
          </Button>
        )}
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <main className="flex min-w-0 flex-1 flex-col">
          {mediaError && (
            <div className="shrink-0 bg-amber-900/50 px-4 py-2 text-sm text-amber-200">
              Media error: {mediaError}
            </div>
          )}
          {!isMediaReady && !mediaError && (
            <div className="flex shrink-0 items-center gap-2 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
              <Loader2 className="h-4 w-4 animate-spin text-[#2D8CFF]" />
              Connecting to meeting...
            </div>
          )}
          {hostNotice && (
            <div className="shrink-0 bg-[#2D8CFF]/20 px-4 py-2 text-sm text-[#7eb8ff]">
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
    </div>
  );
}
