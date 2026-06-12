"use client";

import { cn } from "@/lib/utils";
import { getAvatarStyle, getInitials } from "@/lib/avatar";

interface ParticipantAvatarProps {
  userId: string;
  displayName: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-9 w-9 text-xs ring-2",
  md: "h-12 w-12 text-sm ring-2",
  lg: "h-20 w-20 text-2xl ring-4",
  xl: "h-28 w-28 text-4xl ring-4",
};

export function ParticipantAvatar({
  userId,
  displayName,
  size = "md",
  className,
}: ParticipantAvatarProps) {
  const style = getAvatarStyle(userId);
  const initials = getInitials(displayName);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-lg",
        style.bg,
        style.ring,
        sizeClasses[size],
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
