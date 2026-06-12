"use client";

import type { LucideIcon } from "lucide-react";

import { DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface DialogHeaderIconProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  accent: "blue" | "orange" | "purple" | "teal";
}

const accentStyles = {
  blue: {
    bg: "bg-gradient-to-br from-[#2D8CFF] to-[#0E71EB]",
    ring: "ring-[#2D8CFF]/20",
    badge: "bg-[#E7F1FF] text-[#0E71EB]",
  },
  orange: {
    bg: "bg-gradient-to-br from-[#FF8A4C] to-[#FF6B2C]",
    ring: "ring-[#FF6B2C]/20",
    badge: "bg-[#FFF0E8] text-[#E85D1A]",
  },
  purple: {
    bg: "bg-gradient-to-br from-[#9B8AFF] to-[#7B68EE]",
    ring: "ring-[#7B68EE]/20",
    badge: "bg-[#F0EDFF] text-[#6B58DE]",
  },
  teal: {
    bg: "bg-gradient-to-br from-[#2EC4A0] to-[#09A287]",
    ring: "ring-[#09A287]/20",
    badge: "bg-[#E6F7F3] text-[#078A70]",
  },
};

export function DialogHeaderIcon({
  icon: Icon,
  title,
  subtitle,
  accent,
}: DialogHeaderIconProps) {
  const styles = accentStyles[accent];

  return (
    <div className="flex flex-col items-center pb-2 pt-1 text-center sm:items-start sm:text-left">
      <div
        className={cn(
          "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg ring-4",
          styles.bg,
          styles.ring,
        )}
      >
        <Icon className="h-7 w-7" strokeWidth={2} />
      </div>
      <span className={cn("mb-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold", styles.badge)}>
        {subtitle}
      </span>
      <DialogTitle className="text-xl font-bold text-foreground">{title}</DialogTitle>
    </div>
  );
}
