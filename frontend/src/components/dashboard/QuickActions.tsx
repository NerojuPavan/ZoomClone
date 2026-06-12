"use client";

import { Calendar, LogIn, Plus, Sparkles } from "lucide-react";

interface QuickActionsProps {
  onNewMeeting: () => void;
  onJoinMeeting: () => void;
  onScheduleMeeting: () => void;
}

const actions = [
  {
    key: "new" as const,
    label: "New Meeting",
    description: "Start an instant call",
    icon: Plus,
    gradient: "from-[#FF8A4C] to-[#FF6B2C]",
    shadow: "shadow-orange-200/60",
    hover: "hover:shadow-orange-300/70",
  },
  {
    key: "join" as const,
    label: "Join",
    description: "Enter a meeting ID",
    icon: LogIn,
    gradient: "from-[#2D8CFF] to-[#0E71EB]",
    shadow: "shadow-blue-200/60",
    hover: "hover:shadow-blue-300/70",
  },
  {
    key: "schedule" as const,
    label: "Schedule",
    description: "Plan for later",
    icon: Calendar,
    gradient: "from-[#9B8AFF] to-[#7B68EE]",
    shadow: "shadow-violet-200/60",
    hover: "hover:shadow-violet-300/70",
  },
];

export function QuickActions({
  onNewMeeting,
  onJoinMeeting,
  onScheduleMeeting,
}: QuickActionsProps) {
  const handlers = {
    new: onNewMeeting,
    join: onJoinMeeting,
    schedule: onScheduleMeeting,
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#DFE3E8] bg-white p-6 shadow-sm md:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#2D8CFF]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-[#7B68EE]/10 blur-3xl" />

      <div className="relative mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#E7F1FF] px-3 py-1 text-xs font-semibold text-[#0E71EB]">
            <Sparkles className="h-3.5 w-3.5" />
            Video conferencing
          </div>
          <h2 className="text-2xl font-bold text-[#1C1F25]">Get started</h2>
          <p className="mt-1 text-sm text-[#6E7680]">
            Host, join, or schedule a meeting in one click.
          </p>
        </div>
      </div>

      <div className="relative grid gap-4 sm:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key}
              type="button"
              onClick={handlers[action.key]}
              className={`group flex flex-col items-center rounded-2xl border border-transparent bg-[#F7F9FC] p-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-[#DFE3E8] hover:bg-white ${action.shadow} ${action.hover} hover:shadow-lg`}
            >
              <div
                className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md transition-transform group-hover:scale-105 ${action.gradient}`}
              >
                <Icon className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <span className="font-semibold text-[#1C1F25]">{action.label}</span>
              <span className="mt-1 text-xs text-[#6E7680]">{action.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
