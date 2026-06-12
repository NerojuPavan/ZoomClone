"use client";

import { Calendar, Clock } from "lucide-react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type AmPm = "AM" | "PM";

export interface DateTimeValue {
  date: string;
  hour: string;
  minute: string;
  period: AmPm;
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ["00", "15", "30", "45"];

const selectClass =
  "h-11 w-full appearance-none rounded-xl border border-[#DFE3E8] bg-[#F7F9FC] px-3 text-sm text-[#1C1F25] transition-colors focus:border-[#7B68EE] focus:outline-none focus:ring-2 focus:ring-[#7B68EE]/25";

interface DateTimeSchedulerProps {
  value: DateTimeValue;
  onChange: (value: DateTimeValue) => void;
  className?: string;
}

export function getDefaultDateTimeValue(): DateTimeValue {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);
  now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);

  let hours = now.getHours();
  const period: AmPm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;

  return {
    date: now.toISOString().slice(0, 10),
    hour: String(hour12),
    minute: String(now.getMinutes()).padStart(2, "0"),
    period,
  };
}

export function buildScheduledAtISO(value: DateTimeValue): string | null {
  if (!value.date || !value.hour || !value.minute || !value.period) {
    return null;
  }

  let hours = parseInt(value.hour, 10);
  if (value.period === "PM" && hours !== 12) hours += 12;
  if (value.period === "AM" && hours === 12) hours = 0;

  const isoLocal = `${value.date}T${String(hours).padStart(2, "0")}:${value.minute}:00`;
  const parsed = new Date(isoLocal);

  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export function DateTimeScheduler({ value, onChange, className }: DateTimeSchedulerProps) {
  const today = new Date().toISOString().slice(0, 10);

  const update = (patch: Partial<DateTimeValue>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label className="text-sm font-medium text-[#3D4149]">Date</Label>
        <div className="relative">
          <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7B68EE]" />
          <input
            id="schedule-date"
            type="date"
            min={today}
            value={value.date}
            onChange={(e) => update({ date: e.target.value })}
            className={cn(selectClass, "pl-10 [color-scheme:light]")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium text-[#3D4149]">
          <Clock className="h-4 w-4 text-[#7B68EE]" />
          Time
        </Label>
        <div className="grid grid-cols-3 gap-2">
            <select
              id="schedule-hour"
              aria-label="Hour"
              value={value.hour}
              onChange={(e) => update({ hour: e.target.value })}
              className={cn(selectClass, "sm:col-span-1")}
            >
              <option value="" disabled>
                Hour
              </option>
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <select
              id="schedule-minute"
              aria-label="Minute"
              value={value.minute}
              onChange={(e) => update({ minute: e.target.value })}
              className={selectClass}
            >
              <option value="" disabled>
                Min
              </option>
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  :{m}
                </option>
              ))}
            </select>
            <select
              id="schedule-period"
              aria-label="AM or PM"
              value={value.period}
              onChange={(e) => update({ period: e.target.value as AmPm })}
              className={selectClass}
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
        </div>
        <p className="text-xs text-[#6E7680]">Pick a date from the calendar and select a time</p>
      </div>
    </div>
  );
}
