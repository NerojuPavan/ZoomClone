"use client";

import { useMemo } from "react";

import type { RemotePeer, RoomParticipant } from "@/types/meeting";
import { cn } from "@/lib/utils";

import { VideoTile, type VideoTileParticipant } from "./VideoTile";

interface VideoGridProps {
  localUserId: string;
  localStream: MediaStream | null;
  localDisplayName: string;
  isCameraOn: boolean;
  isMicOn: boolean;
  remotePeers: RemotePeer[];
  roomParticipants: RoomParticipant[];
}

function getGridClasses(count: number): string {
  if (count === 1) {
    return "grid-cols-1 grid-rows-1";
  }
  if (count === 2) {
    return "grid-cols-1 sm:grid-cols-2 grid-rows-2 sm:grid-rows-1";
  }
  if (count <= 4) {
    return "grid-cols-2 grid-rows-2";
  }
  return "grid-cols-2 sm:grid-cols-3 grid-rows-2";
}

export function VideoGrid({
  localUserId,
  localStream,
  localDisplayName,
  isCameraOn,
  isMicOn,
  remotePeers,
  roomParticipants,
}: VideoGridProps) {
  const tiles = useMemo(() => {
    const streamByUser = new Map(remotePeers.map((p) => [p.userId, p.stream]));
    const nameByUser = new Map(remotePeers.map((p) => [p.userId, p.displayName]));

    const remoteTiles: VideoTileParticipant[] = roomParticipants.map((p) => ({
      userId: p.user_id,
      displayName: p.display_name || nameByUser.get(p.user_id) || "Participant",
      isLocal: false,
      stream: streamByUser.get(p.user_id) ?? null,
      isCameraOn: true,
    }));

    const localTile: VideoTileParticipant = {
      userId: localUserId,
      displayName: localDisplayName,
      isLocal: true,
      stream: localStream,
      isCameraOn,
      isMicOn,
    };

    return [...remoteTiles, localTile];
  }, [
    roomParticipants,
    remotePeers,
    localUserId,
    localDisplayName,
    localStream,
    isCameraOn,
    isMicOn,
  ]);

  const count = tiles.length;

  return (
    <div className="flex flex-1 min-h-0 p-3">
      <div
        className={cn(
          "grid h-full w-full gap-3",
          getGridClasses(count),
        )}
      >
        {tiles.map((participant) => (
          <VideoTile
            key={participant.userId}
            participant={participant}
            fill
            className={cn(count === 1 && "max-h-full")}
          />
        ))}
      </div>
    </div>
  );
}
