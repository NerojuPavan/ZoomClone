"use client";

import { Timer } from "lucide-react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const DURATION_OPTIONS = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
  { value: "180", label: "3 hours" },
];

interface DurationSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DurationSelect({ value, onChange, className }: DurationSelectProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="schedule-duration" className="text-sm font-medium text-[#3D4149]">
        Duration
      </Label>
      <div className="relative">
        <Timer className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#7B68EE]" />
        <select
          id="schedule-duration"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-xl border border-[#DFE3E8] bg-[#F7F9FC] pl-10 pr-3 text-sm text-[#1C1F25] transition-colors focus:border-[#7B68EE] focus:outline-none focus:ring-2 focus:ring-[#7B68EE]/25"
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
