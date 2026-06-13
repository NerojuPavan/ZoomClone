"use client";

import { useEffect, useRef } from "react";
import { MicOff, VideoOff } from "lucide-react";

import { cn } from "@/lib/utils";

import { ParticipantAvatar } from "./ParticipantAvatar";

export interface VideoTileParticipant {
  userId: string;
  displayName: string;
  isLocal: boolean;
  stream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn?: boolean;
}

interface VideoTileProps {
  participant: VideoTileParticipant;
  className?: string;
  fill?: boolean;
}

export function VideoTile({ participant, className, fill = true }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { userId, displayName, isLocal, stream, isCameraOn, isMicOn = true } = participant;

  const hasVideoTrack = Boolean(stream?.getVideoTracks().length);
  const showVideo = isCameraOn && hasVideoTrack;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!stream) {
      video.srcObject = null;
      return;
    }

    video.srcObject = stream;
    void video.play().catch(() => {});

    const onAddTrack = () => void video.play().catch(() => {});
    stream.addEventListener("addtrack", onAddTrack);
    return () => stream.removeEventListener("addtrack", onAddTrack);
  }, [stream]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-video-tile ring-1 ring-meeting-border/50",
        fill ? "h-full w-full min-h-0" : "aspect-video",
        className,
      )}
    >
      {!showVideo && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-video-tile-from to-video-tile-to">
          <ParticipantAvatar
            userId={userId}
            displayName={displayName}
            size={fill ? "xl" : "lg"}
          />
          {!stream && !isLocal && (
            <p className="absolute bottom-20 text-sm text-zinc-400">Connecting...</p>
          )}
        </div>
      )}

      {stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={cn(
            "h-full w-full object-cover",
            isLocal && "mirror",
            !showVideo && "pointer-events-none absolute h-px w-px overflow-hidden opacity-0",
          )}
        />
      )}

      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <span className="rounded-md bg-black/60 px-2.5 py-1 text-sm font-medium text-white backdrop-blur-sm">
          {displayName}
          {isLocal && <span className="text-zinc-300"> (You)</span>}
        </span>
        {!isMicOn && (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600/90">
            <MicOff className="h-3.5 w-3.5 text-white" />
          </span>
        )}
        {!isCameraOn && (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600/90">
            <VideoOff className="h-3.5 w-3.5 text-white" />
          </span>
        )}
      </div>
    </div>
  );
}
