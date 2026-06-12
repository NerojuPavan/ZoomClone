"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Mic,
  MicOff,
  User,
  Video,
  VideoOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePreJoinMedia } from "@/hooks/usePreJoinMedia";
import {
  clearRememberedName,
  getRememberedName,
  setRememberedName,
} from "@/lib/user-preferences";
import { cn } from "@/lib/utils";
import type { JoinPreferences } from "@/types/meeting";

interface PreJoinScreenProps {
  meetingTitle: string;
  meetingId: string;
  onJoin: (prefs: JoinPreferences) => Promise<void>;
  isJoining?: boolean;
  joinError?: string | null;
}

export function PreJoinScreen({
  meetingTitle,
  meetingId,
  onJoin,
  isJoining,
  joinError,
}: PreJoinScreenProps) {
  const [displayName, setDisplayName] = useState("");
  const [rememberName, setRememberName] = useState(false);

  const {
    stream,
    isCameraOn,
    isMicOn,
    isReady,
    error: mediaError,
    toggleCamera,
    toggleMicrophone,
    stop,
  } = usePreJoinMedia(true);

  useEffect(() => {
    const saved = getRememberedName();
    if (saved) {
      setDisplayName(saved);
      setRememberName(true);
    }
  }, []);

  const handleJoin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!displayName.trim()) return;

    if (rememberName) {
      setRememberedName(displayName.trim());
    } else {
      clearRememberedName();
    }

    stop();
    await onJoin({
      displayName: displayName.trim(),
      micOn: isMicOn,
      cameraOn: isCameraOn,
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F9FC]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-[#2D8CFF]/10 blur-3xl" />
        <div className="absolute -left-20 bottom-20 h-64 w-64 rounded-full bg-[#7B68EE]/8 blur-3xl" />
      </div>

      <header className="relative border-b border-[#DFE3E8] bg-white/90 px-6 py-4 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2D8CFF] to-[#0E71EB] text-white shadow-md">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#2D8CFF]">
                Joining meeting
              </p>
              <h1 className="text-xl font-bold text-[#1C1F25]">{meetingTitle}</h1>
            </div>
          </div>
          <code className="rounded-lg bg-[#EFF2F6] px-3 py-1.5 text-xs font-medium text-[#6E7680]">
            ID: {meetingId.slice(0, 8)}...
          </code>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-10 px-6 py-10 lg:flex-row lg:items-start lg:justify-center lg:gap-16 lg:pt-16">
        <div className="w-full max-w-2xl">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#232333] shadow-2xl ring-1 ring-[#DFE3E8]">
            {!isReady && !mediaError && (
              <div className="absolute inset-0 flex items-center justify-center text-[#9AA0A9]">
                <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#2D8CFF]" />
                Starting preview...
              </div>
            )}
            {mediaError && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#232333] p-6 text-center text-sm text-amber-300">
                {mediaError}
              </div>
            )}
            {stream && (
              <video
                autoPlay
                playsInline
                muted
                ref={(el) => {
                  if (el) el.srcObject = stream;
                }}
                className={cn(
                  "h-full w-full object-cover mirror",
                  !isCameraOn && "hidden",
                )}
              />
            )}
            {!isCameraOn && (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2D3A4F] to-[#232333]">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#2D8CFF] to-[#0E71EB] text-4xl font-bold text-white shadow-lg">
                  {displayName ? displayName.charAt(0).toUpperCase() : "?"}
                </div>
              </div>
            )}

            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-3">
              <Button
                type="button"
                className={cn(
                  "h-11 rounded-full border-0 bg-[#3D4149]/90 px-5 text-white backdrop-blur hover:bg-[#3D4149]",
                  !isMicOn && "bg-[#E02E2E] hover:bg-[#C62828]",
                )}
                onClick={toggleMicrophone}
              >
                {isMicOn ? (
                  <Mic className="mr-2 h-4 w-4" />
                ) : (
                  <MicOff className="mr-2 h-4 w-4" />
                )}
                {isMicOn ? "Mute" : "Unmute"}
              </Button>
              <Button
                type="button"
                className={cn(
                  "h-11 rounded-full border-0 bg-[#3D4149]/90 px-5 text-white backdrop-blur hover:bg-[#3D4149]",
                  !isCameraOn && "bg-[#E02E2E] hover:bg-[#C62828]",
                )}
                onClick={toggleCamera}
              >
                {isCameraOn ? (
                  <Video className="mr-2 h-4 w-4" />
                ) : (
                  <VideoOff className="mr-2 h-4 w-4" />
                )}
                {isCameraOn ? "Stop Video" : "Start Video"}
              </Button>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="overflow-hidden rounded-2xl border border-[#DFE3E8] bg-white shadow-lg">
            <div className="border-b border-[#EFF2F6] bg-gradient-to-b from-[#E7F1FF]/60 to-white px-8 py-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2D8CFF] to-[#0E71EB] text-white shadow-md">
                <User className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-[#1C1F25]">Enter Meeting Info</h2>
              <p className="mt-1 text-sm text-[#6E7680]">Set your name before joining</p>
            </div>

            <form onSubmit={handleJoin} className="space-y-5 px-8 py-6">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="font-medium text-[#3D4149]">
                  Your Name
                </Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2D8CFF]" />
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    className="h-12 rounded-xl border-[#DFE3E8] bg-[#F7F9FC] pl-10 focus-visible:border-[#2D8CFF] focus-visible:ring-[#2D8CFF]/25"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-[#F7F9FC] p-3">
                <Checkbox
                  id="remember"
                  checked={rememberName}
                  onCheckedChange={(checked) => setRememberName(checked === true)}
                  className="mt-0.5 border-[#2D8CFF] data-[state=checked]:bg-[#2D8CFF]"
                />
                <Label htmlFor="remember" className="cursor-pointer text-sm leading-snug text-[#6E7680]">
                  Remember my name for future meetings
                </Label>
              </div>

              {joinError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{joinError}</p>
              )}

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-gradient-to-r from-[#2D8CFF] to-[#0E71EB] text-base font-semibold shadow-md shadow-blue-200/50 hover:from-[#1A7EF5] hover:to-[#0C65D8]"
                disabled={isJoining || !displayName.trim()}
              >
                {isJoining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join"
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
