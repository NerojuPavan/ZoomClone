"use client";

import { Label } from "@/components/ui/label";
import { RequiredMark } from "@/components/dashboard/FormField";
import { getLocalDateString, getLocalTimeZoneLabel } from "@/lib/datetime";
import { cn } from "@/lib/utils";

export type AmPm = "AM" | "PM";

export interface DateTimeValue {
  date: string;
  hour: string;
  minute: string;
  period: AmPm;
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

const fieldClass =
  "h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground transition-colors focus:border-[#0E71EB] focus:outline-none focus:ring-1 focus:ring-[#0E71EB]";

interface DateTimeSchedulerProps {
  value: DateTimeValue;
  onChange: (value: DateTimeValue) => void;
  className?: string;
}

export function getDefaultDateTimeValue(): DateTimeValue {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30, 0, 0);

  const hours = now.getHours();
  const period: AmPm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;

  return {
    date: getLocalDateString(now),
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
  const today = getLocalDateString();
  const timeZone = getLocalTimeZoneLabel();

  const update = (patch: Partial<DateTimeValue>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label htmlFor="schedule-date" className="text-sm font-medium text-foreground">
          When
          <RequiredMark />
        </Label>
        <input
          id="schedule-date"
          type="date"
          min={today}
          required
          aria-required
          value={value.date}
          onChange={(e) => update({ date: e.target.value })}
          className={cn(fieldClass, "[color-scheme:light] dark:[color-scheme:dark]")}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          Time
          <RequiredMark />
        </Label>
        <div className="grid grid-cols-3 gap-2">
          <select
            id="schedule-hour"
            aria-label="Hour"
            required
            aria-required
            value={value.hour}
            onChange={(e) => update({ hour: e.target.value })}
            className={fieldClass}
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
            required
            aria-required
            value={value.minute}
            onChange={(e) => update({ minute: e.target.value })}
            className={fieldClass}
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
            required
            aria-required
            value={value.period}
            onChange={(e) => update({ period: e.target.value as AmPm })}
            className={fieldClass}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
        <p className="text-xs text-muted-foreground">
          Time zone: {timeZone}
        </p>
      </div>
    </div>
  );
}
