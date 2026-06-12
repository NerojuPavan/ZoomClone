"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface RemoteVideoProps {
  stream: MediaStream | null;
  displayName: string;
  className?: string;
}

export function RemoteVideo({ stream, displayName, className }: RemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!stream) {
      video.srcObject = null;
      return;
    }

    video.srcObject = stream;
    void video.play().catch(() => {
      // Autoplay may require user gesture in some browsers
    });

    const handleAddTrack = () => {
      void video.play().catch(() => {});
    };

    stream.addEventListener("addtrack", handleAddTrack);
    return () => {
      stream.removeEventListener("addtrack", handleAddTrack);
    };
  }, [stream]);

  const hasVideo = Boolean(stream?.getVideoTracks().some((t) => t.enabled && t.readyState === "live"));

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-zinc-900 aspect-video",
        className,
      )}
    >
      {stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={cn("h-full w-full object-cover", !hasVideo && "sr-only absolute")}
        />
      )}
      {!hasVideo && (
        <div className="flex h-full w-full items-center justify-center bg-zinc-800">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-600 text-3xl font-semibold text-white">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <p className="absolute bottom-16 text-sm text-zinc-400">
            {stream ? "Camera off" : "Waiting for video..."}
          </p>
        </div>
      )}
      <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
        {displayName}
      </div>
    </div>
  );
}
