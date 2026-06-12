"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";

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
import { meetingApi } from "@/services/meeting-api";

export function JoinMeetingCard() {
  const router = useRouter();
  const [meetingId, setMeetingId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (event: React.FormEvent) => {
    event.preventDefault();
    const id = meetingId.trim();
    if (!id) return;

    setIsJoining(true);
    setError(null);
    try {
      await meetingApi.getMeeting(id);
      router.push(`/meeting/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Meeting not found");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="h-5 w-5 text-emerald-600" />
          Join Meeting
        </CardTitle>
        <CardDescription>Enter a meeting ID or paste an invite link</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meetingId">Meeting ID</Label>
            <Input
              id="meetingId"
              value={meetingId}
              onChange={(e) => {
                const value = e.target.value;
                const match = value.match(/\/meeting\/([a-f0-9-]+)/i);
                setMeetingId(match ? match[1] : value);
              }}
              placeholder="Paste meeting ID or link"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={isJoining || !meetingId.trim()}
          >
            {isJoining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              "Join"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
