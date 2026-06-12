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
    <div className="flex items-center justify-center gap-2 border-t border-meeting-border bg-meeting-panel/95 px-3 py-3 backdrop-blur sm:gap-4 sm:px-6 sm:py-4">
      <div className="flex items-center gap-1 rounded-full bg-meeting-panel-muted/90 px-2 py-1.5 sm:gap-2 sm:px-3 sm:py-2">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10 rounded-full text-meeting-text hover:bg-meeting-panel-muted sm:h-11 sm:w-11",
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
            "h-10 w-10 rounded-full text-meeting-text hover:bg-meeting-panel-muted sm:h-11 sm:w-11",
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
            "relative h-10 w-10 rounded-full text-meeting-text hover:bg-meeting-panel-muted sm:h-11 sm:w-11",
            isParticipantsOpen && "bg-primary/20 text-primary",
          )}
          onClick={onToggleParticipants}
          aria-label={isParticipantsOpen ? "Hide participants" : "Show participants"}
        >
          <Users className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {participantCount}
          </span>
        </Button>
      </div>

      <Button
        variant="destructive"
        size="icon"
        className="h-10 w-10 rounded-full bg-red-600 hover:bg-red-700 sm:h-12 sm:w-12"
        onClick={onLeave}
        disabled={isLeaving}
        aria-label="Leave meeting"
      >
        <PhoneOff className="h-5 w-5" />
      </Button>
    </div>
  );
}
