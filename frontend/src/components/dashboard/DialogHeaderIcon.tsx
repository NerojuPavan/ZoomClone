"use client";

import type { LucideIcon } from "lucide-react";

import { DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface DialogHeaderIconProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  accent: "blue" | "orange" | "purple" | "teal";
  compact?: boolean;
}

const accentStyles = {
  blue: {
    bg: "bg-[#0E71EB]",
    ring: "ring-[#0E71EB]/20",
    badge: "bg-[#E7F1FF] text-[#0E71EB]",
  },
  orange: {
    bg: "bg-[#FF6B2C]",
    ring: "ring-[#FF6B2C]/20",
    badge: "bg-[#FFF0E8] text-[#E85D1A]",
  },
  purple: {
    bg: "bg-[#7B68EE]",
    ring: "ring-[#7B68EE]/20",
    badge: "bg-[#F0EDFF] text-[#6B58DE]",
  },
  teal: {
    bg: "bg-[#09A287]",
    ring: "ring-[#09A287]/20",
    badge: "bg-[#E6F7F3] text-[#078A70]",
  },
};

export function DialogHeaderIcon({
  icon: Icon,
  title,
  subtitle,
  accent,
  compact = false,
}: DialogHeaderIconProps) {
  const styles = accentStyles[accent];

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white",
            styles.bg,
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        <DialogTitle className="text-lg font-semibold text-foreground">{title}</DialogTitle>
      </div>
    );
  }

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
      {subtitle && (
        <span className={cn("mb-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold", styles.badge)}>
          {subtitle}
        </span>
      )}
      <DialogTitle className="text-xl font-bold text-foreground">{title}</DialogTitle>
    </div>
  );
}
