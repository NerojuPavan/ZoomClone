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
  onMute,
  onMuteAll,
  onDisableVideo,
  onKick,
}: ParticipantListProps) {
  const [muteAllOpen, setMuteAllOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const all = [
    {
      id: localUserId,
      name: localName,
      isLocal: true,
      isMicOn,
      isCameraOn,
    },
    ...participants.map((p) => ({
      id: p.user_id,
      name: p.display_name || "Participant",
      isLocal: false,
      isMicOn: true,
      isCameraOn: true,
    })),
  ];

  const handleMuteAllConfirm = () => {
    onMuteAll?.();
    setMuteAllOpen(false);
  };

  return (
    <>
      <aside
        className={cn(
          "flex shrink-0 flex-col border-l border-zinc-800 bg-[#1a1d21] transition-all duration-300 ease-in-out",
          isOpen ? "w-80 translate-x-0" : "w-0 translate-x-full overflow-hidden border-l-0",
        )}
      >
        <div className="flex w-80 flex-col h-full">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#2D8CFF]" />
              <h2 className="text-sm font-semibold text-white">
                Participants
              </h2>
              <span className="rounded-full bg-[#2D8CFF]/20 px-2 py-0.5 text-xs font-medium text-[#2D8CFF]">
                {all.length}/{MAX_ROOM_PARTICIPANTS}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              onClick={onClose}
              aria-label="Close participants panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {isHost && participants.length > 0 && (
            <div className="border-b border-zinc-800 px-4 py-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-zinc-700 bg-zinc-900/80 text-zinc-200 hover:border-[#2D8CFF]/50 hover:bg-zinc-800"
                onClick={() => setMuteAllOpen(true)}
              >
                <MicOff className="mr-2 h-4 w-4 text-[#2D8CFF]" />
                Mute All
              </Button>
            </div>
          )}

          <ul className="flex-1 space-y-2 overflow-y-auto p-3">
            {all.map((participant) => {
              const isParticipantHost = participant.id === hostUserId;
              const showHostControls =
                isHost && !participant.isLocal && hoveredId === participant.id;

              return (
                <li
                  key={participant.id}
                  className="group rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                  onMouseEnter={() => setHoveredId(participant.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="flex items-center gap-3">
                    <ParticipantAvatar
                      userId={participant.id}
                      displayName={participant.name}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-white">
                          {participant.name}
                        </span>
                        {participant.isLocal && (
                          <span className="shrink-0 text-xs text-zinc-500">(You)</span>
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
                        <span className="text-[10px] text-zinc-500">
                          {participant.isMicOn ? "Unmuted" : "Muted"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {showHostControls && (
                    <div className="mt-2 flex gap-1 border-t border-zinc-800 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 flex-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
                        onClick={() => onMute?.(participant.id)}
                      >
                        <MicOff className="mr-1 h-3.5 w-3.5" />
                        Mute
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 flex-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
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
        <AlertDialogContent className="border-zinc-200 bg-white">
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
    </>
  );
}
