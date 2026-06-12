"use client";

import { Mic, MicOff, PhoneOff, Users, Video, VideoOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ControlBarProps {
  isCameraOn: boolean;
  isMicOn: boolean;
  participantCount: number;
  isParticipantsOpen: boolean;
  onToggleParticipants: () => void;
  onToggleCamera: () => void;
  onToggleMicrophone: () => void;
  onLeave: () => void;
  isLeaving?: boolean;
}

export function ControlBar({
  isCameraOn,
  isMicOn,
  participantCount,
  isParticipantsOpen,
  onToggleParticipants,
  onToggleCamera,
  onToggleMicrophone,
  onLeave,
  isLeaving,
}: ControlBarProps) {
  return (
    <div className="flex items-center justify-center gap-4 border-t border-zinc-800 bg-[#1a1d21]/95 px-6 py-4 backdrop-blur">
      <div className="flex items-center gap-2 rounded-full bg-zinc-800/90 px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-11 w-11 rounded-full text-zinc-200 hover:bg-zinc-700",
            !isMicOn && "bg-red-600 text-white hover:bg-red-700",
          )}
          onClick={onToggleMicrophone}
          aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}
        >
          {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-11 w-11 rounded-full text-zinc-200 hover:bg-zinc-700",
            !isCameraOn && "bg-red-600 text-white hover:bg-red-700",
          )}
          onClick={onToggleCamera}
          aria-label={isCameraOn ? "Turn off camera" : "Turn on camera"}
        >
          {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-11 w-11 rounded-full text-zinc-200 hover:bg-zinc-700",
            isParticipantsOpen && "bg-[#2D8CFF]/20 text-[#2D8CFF]",
          )}
          onClick={onToggleParticipants}
          aria-label={isParticipantsOpen ? "Hide participants" : "Show participants"}
        >
          <Users className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2D8CFF] px-1 text-[10px] font-bold text-white">
            {participantCount}
          </span>
        </Button>
      </div>

      <Button
        variant="destructive"
        size="icon"
        className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700"
        onClick={onLeave}
        disabled={isLeaving}
        aria-label="Leave meeting"
      >
        <PhoneOff className="h-5 w-5" />
      </Button>
    </div>
  );
}
