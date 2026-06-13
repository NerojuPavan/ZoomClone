"use client";

import { useEffect, useState } from "react";
import { Calendar, LogIn, Video } from "lucide-react";

import { cn } from "@/lib/utils";

export type DashboardAction = "new" | "join" | "schedule";

interface DashboardHeroProps {
  onAction: (action: DashboardAction) => void;
}

const actions = [
  {
    key: "new" as const,
    label: "New meeting",
    icon: Video,
    iconClass: "bg-[#FF6B2C] hover:bg-[#E85D1A]",
  },
  {
    key: "join" as const,
    label: "Join",
    icon: LogIn,
    iconClass: "bg-primary hover:bg-[#0C65D8]",
  },
  {
    key: "schedule" as const,
    label: "Schedule",
    icon: Calendar,
    iconClass: "bg-primary hover:bg-[#0C65D8]",
  },
];

export function DashboardHero({ onAction }: DashboardHeroProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const timeLabel = now.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
      <div className="text-center">
        <p className="text-4xl font-light tracking-tight text-foreground sm:text-5xl">{timeLabel}</p>
        <p className="mt-2 text-sm text-muted-foreground">{dateLabel}</p>
      </div>

      <div className="mx-auto mt-10 flex max-w-md items-start justify-center gap-6 sm:gap-10">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key}
              type="button"
              onClick={() => onAction(action.key)}
              className="group flex w-[88px] flex-col items-center gap-2.5 sm:w-[96px]"
            >
              <span
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm transition-transform group-hover:scale-105 sm:h-16 sm:w-16",
                  action.iconClass,
                )}
              >
                <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
              </span>
              <span className="text-center text-xs font-medium text-foreground sm:text-sm">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
