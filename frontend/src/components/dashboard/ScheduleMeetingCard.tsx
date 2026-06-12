"use client";

import { useState } from "react";
import { Calendar, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { meetingApi } from "@/services/meeting-api";

import {
  buildScheduledAtISO,
  DateTimeScheduler,
  getDefaultDateTimeValue,
  type DateTimeValue,
} from "./DateTimeScheduler";
import { DurationSelect } from "./DurationSelect";

interface ScheduleMeetingCardProps {
  onScheduled?: () => void;
}

export function ScheduleMeetingCard({ onScheduled }: ScheduleMeetingCardProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateTimeValue, setDateTimeValue] = useState<DateTimeValue>(() =>
    getDefaultDateTimeValue(),
  );
  const [duration, setDuration] = useState("30");
  const [isScheduling, setIsScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSchedule = async (event: React.FormEvent) => {
    event.preventDefault();
    const scheduledAtISO = buildScheduledAtISO(dateTimeValue);
    if (!title.trim() || !scheduledAtISO) return;

    setIsScheduling(true);
    setError(null);
    setSuccess(null);
    try {
      const meeting = await meetingApi.createMeeting({
        title: title.trim(),
        description: description.trim() || null,
        scheduled_at: scheduledAtISO,
        duration: Number(duration) || 30,
      });
      setSuccess(`Scheduled: ${meeting.title}`);
      setTitle("");
      setDescription("");
      setDateTimeValue(getDefaultDateTimeValue());
      onScheduled?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule meeting");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-violet-600" />
          Schedule Meeting
        </CardTitle>
        <CardDescription>Plan a meeting for later</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSchedule} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schedule-title">Title</Label>
            <Input
              id="schedule-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Weekly review"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-description">Description</Label>
            <Textarea
              id="schedule-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DateTimeScheduler value={dateTimeValue} onChange={setDateTimeValue} />
          <DurationSelect value={duration} onChange={setDuration} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}
          <Button
            type="submit"
            variant="secondary"
            className="w-full"
            disabled={
              isScheduling ||
              !title.trim() ||
              !buildScheduledAtISO(dateTimeValue)
            }
          >
            {isScheduling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              "Schedule"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
