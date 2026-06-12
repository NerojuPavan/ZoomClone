"use client";

import { useState } from "react";
import {
  Crown,
  Mic,
  MicOff,
  UserX,
  Users,
  VideoOff,
  X,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MAX_ROOM_PARTICIPANTS } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { RemotePeer } from "@/types/meeting";

import { ParticipantAvatar } from "./ParticipantAvatar";

interface ParticipantListProps {
  isOpen: boolean;
  onClose: () => void;
  localName: string;
  localUserId: string;
  hostUserId: string | null;
  isHost: boolean;
  isMicOn: boolean;
  isCameraOn: boolean;
  participants: { user_id: string; display_name: string }[];
  remotePeers: RemotePeer[];
  onMute?: (userId: string) => void;
  onMuteAll?: () => void;
  onDisableVideo?: (userId: string) => void;
  onKick?: (userId: string) => void;
}

export function ParticipantList({
  isOpen,
  onClose,
  localName,
  localUserId,
  hostUserId,
  isHost,
  isMicOn,
  isCameraOn,
  participants,
  remotePeers,
  onMute,
  onMuteAll,
  onDisableVideo,
  onKick,
}: ParticipantListProps) {
  const [muteAllOpen, setMuteAllOpen] = useState(false);
  const [allMutedOpen, setAllMutedOpen] = useState(false);

  const peerStateMap = new Map(
    remotePeers.map((p) => [p.userId, { isMicOn: p.isMicOn, isCameraOn: p.isCameraOn }])
  );

  const all = [
    {
      id: localUserId,
      name: localName,
      isLocal: true,
      isMicOn,
      isCameraOn,
    },
    ...participants.map((p) => {
      const peerState = peerStateMap.get(p.user_id);
      return {
        id: p.user_id,
        name: p.display_name || "Participant",
        isLocal: false,
        isMicOn: peerState?.isMicOn ?? false,
        isCameraOn: peerState?.isCameraOn ?? false,
      };
    }),
  ];

  const otherParticipants = all.filter((p) => !p.isLocal);
  const allAlreadyMuted = otherParticipants.length > 0 && otherParticipants.every((p) => !p.isMicOn);

  const handleMuteAllClick = () => {
    if (allAlreadyMuted) {
      setAllMutedOpen(true);
    } else {
      setMuteAllOpen(true);
    }
  };

  const handleMuteAllConfirm = () => {
    onMuteAll?.();
    setMuteAllOpen(false);
  };

  return (
    <>
      <aside
        className={cn(
          "flex shrink-0 flex-col border-l border-meeting-border bg-meeting-panel transition-all duration-300 ease-in-out",
          "max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:z-50 max-md:shadow-2xl",
          isOpen
            ? "w-full max-w-sm translate-x-0 sm:w-80"
            : "w-0 translate-x-full overflow-hidden border-l-0 max-md:pointer-events-none",
        )}
      >
        <div className="flex h-full w-full flex-col sm:w-80">
          <div className="flex items-center justify-between border-b border-meeting-border px-4 py-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-meeting-text">
                Participants
              </h2>
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                {all.length}/{MAX_ROOM_PARTICIPANTS}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-meeting-text-muted hover:bg-meeting-panel-muted hover:text-meeting-text"
              onClick={onClose}
              aria-label="Close participants panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {isHost && participants.length > 0 && (
            <div className="border-b border-meeting-border px-4 py-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-meeting-border bg-meeting-panel-muted/80 text-meeting-text hover:border-primary/50 hover:bg-meeting-panel-muted"
                onClick={handleMuteAllClick}
              >
                <MicOff className="mr-2 h-4 w-4 text-primary" />
                Mute All
              </Button>
            </div>
          )}

          <ul className="flex-1 space-y-2 overflow-y-auto p-3">
            {all.map((participant) => {
              const isParticipantHost = participant.id === hostUserId;
              return (
                <li
                  key={participant.id}
                  className="group rounded-xl border border-meeting-border/80 bg-meeting-panel-muted/50 p-3 transition-colors hover:border-meeting-border hover:bg-meeting-panel-muted"
                >
                  <div className="flex items-center gap-3">
                    <ParticipantAvatar
                      userId={participant.id}
                      displayName={participant.name}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-meeting-text">
                          {participant.name}
                        </span>
                        {participant.isLocal && (
                          <span className="shrink-0 text-xs text-meeting-text-muted">(You)</span>
                        )}
                        {isParticipantHost && (
                          <Crown
                            className="h-3.5 w-3.5 shrink-0 text-amber-400"
                            aria-label="Host"
                          />
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        {participant.isMicOn ? (
                          <Mic className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <MicOff className="h-3 w-3 text-red-400" />
                        )}
                        <span className="text-[10px] text-meeting-text-muted">
                          {participant.isMicOn ? "Unmuted" : "Muted"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isHost && !participant.isLocal && (
                    <div className="mt-2 hidden gap-1 border-t border-meeting-border pt-2 max-md:flex md:group-hover:flex">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 flex-1 text-xs text-meeting-text-muted hover:bg-meeting-panel-muted hover:text-meeting-text"
                        onClick={() => onMute?.(participant.id)}
                      >
                        <MicOff className="mr-1 h-3.5 w-3.5" />
                        Mute
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 flex-1 text-xs text-meeting-text-muted hover:bg-meeting-panel-muted hover:text-meeting-text"
                        onClick={() => onDisableVideo?.(participant.id)}
                      >
                        <VideoOff className="mr-1 h-3.5 w-3.5" />
                        Video
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 flex-1 text-xs text-red-400 hover:bg-red-950/50 hover:text-red-300"
                        onClick={() => onKick?.(participant.id)}
                      >
                        <UserX className="mr-1 h-3.5 w-3.5" />
                        Remove
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      <AlertDialog open={muteAllOpen} onOpenChange={setMuteAllOpen}>
        <AlertDialogContent className="border-border bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Mute all participants?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mute everyone in the meeting. Participants can unmute themselves
              afterward unless you mute them again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#2D8CFF] hover:bg-[#0E71EB]"
              onClick={handleMuteAllConfirm}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={allMutedOpen} onOpenChange={setAllMutedOpen}>
        <AlertDialogContent className="border-border bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>All participants are muted</AlertDialogTitle>
            <AlertDialogDescription>
              All participants in the meeting are already muted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className="bg-[#2D8CFF] hover:bg-[#0E71EB]"
              onClick={() => setAllMutedOpen(false)}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
