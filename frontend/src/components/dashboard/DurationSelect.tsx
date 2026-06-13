"use client";

import { Label } from "@/components/ui/label";
import { RequiredMark } from "@/components/dashboard/FormField";
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
      <Label htmlFor="schedule-duration" className="text-sm font-medium text-foreground">
        Duration
        <RequiredMark />
      </Label>
      <select
        id="schedule-duration"
        required
        aria-required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none rounded-md border border-border bg-card px-3 text-sm text-foreground transition-colors focus:border-[#0E71EB] focus:outline-none focus:ring-1 focus:ring-[#0E71EB]"
      >
        {DURATION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">Maximum 45 minutes</p>
    </div>
  );
}
