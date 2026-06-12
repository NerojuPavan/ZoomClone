"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface LocalVideoProps {
  stream: MediaStream | null;
  displayName: string;
  isCameraOn: boolean;
  className?: string;
}

export function LocalVideo({
  stream,
  displayName,
  isCameraOn,
  className,
}: LocalVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    if (stream) {
      void video.play().catch(() => {});
    }
  }, [stream]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-zinc-900 aspect-video",
        className,
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          "h-full w-full object-cover mirror",
          !isCameraOn && "hidden",
        )}
      />
      {!isCameraOn && (
        <div className="flex h-full w-full items-center justify-center bg-zinc-800">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-2xl font-semibold text-white">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
        {displayName} (You)
      </div>
    </div>
  );
}
