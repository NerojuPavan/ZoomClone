"use client";

import { Timer } from "lucide-react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const DURATION_OPTIONS = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
];

interface DurationSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DurationSelect({ value, onChange, className }: DurationSelectProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="schedule-duration" className="text-sm font-medium text-secondary-foreground">
        Duration <span className="font-normal text-muted-foreground">(max 45 min)</span>
      </Label>
      <div className="relative">
        <Timer className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#7B68EE]" />
        <select
          id="schedule-duration"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-xl border border-border bg-muted pl-10 pr-3 text-sm text-foreground transition-colors focus:border-[#7B68EE] focus:outline-none focus:ring-2 focus:ring-[#7B68EE]/25"
        >
          {DURATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
