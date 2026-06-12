const AVATAR_PALETTE = [
  { bg: "bg-[#2D8CFF]", ring: "ring-[#2D8CFF]/30" },
  { bg: "bg-[#09A287]", ring: "ring-[#09A287]/30" },
  { bg: "bg-[#7B68EE]", ring: "ring-[#7B68EE]/30" },
  { bg: "bg-[#FF6B2C]", ring: "ring-[#FF6B2C]/30" },
  { bg: "bg-[#E02E2E]", ring: "ring-[#E02E2E]/30" },
  { bg: "bg-[#0E71EB]", ring: "ring-[#0E71EB]/30" },
  { bg: "bg-[#6B58DE]", ring: "ring-[#6B58DE]/30" },
  { bg: "bg-[#078A70]", ring: "ring-[#078A70]/30" },
] as const;

export function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getAvatarStyle(userId: string) {
  return AVATAR_PALETTE[hashUserId(userId) % AVATAR_PALETTE.length];
}

export function getInitials(name: string): string {
  const trimmed = name?.trim() ?? "";
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function isTrackActive(track: MediaStreamTrack | undefined): boolean {
  return Boolean(
    track && track.enabled && !track.muted && track.readyState === "live",
  );
}

export function getStreamMediaState(stream: MediaStream | null): {
  isCameraOn: boolean;
  isMicOn: boolean;
} {
  if (!stream) {
    return { isCameraOn: false, isMicOn: false };
  }

  return {
    isCameraOn: isTrackActive(stream.getVideoTracks()[0]),
    isMicOn: isTrackActive(stream.getAudioTracks()[0]),
  };
}

export function hasActiveVideo(stream: MediaStream | null): boolean {
  if (!stream) return false;
  return isTrackActive(stream.getVideoTracks()[0]);
}
