"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  CalendarClock,
  LogIn,
  Shield,
  UserPlus,
  Users,
  Video,
  Wifi,
} from "lucide-react";

import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { getAuthUser, isGuestMode } from "@/store/auth-storage";

const FEATURES = [
  {
    icon: Video,
    title: "HD video meetings",
    description: "Start instant calls or join via invite link with camera and mic preview.",
  },
  {
    icon: CalendarClock,
    title: "Schedule ahead",
    description: "Plan meetings with title, date, time, and duration — all from one dashboard.",
  },
  {
    icon: Users,
    title: "Up to 5 participants",
    description: "Real-time mesh WebRTC calls with host controls for mute, video, and kick.",
  },
  {
    icon: Wifi,
    title: "Low-latency signaling",
    description: "WebSocket-based signaling keeps peer connections fast and reliable.",
  },
];

export function HomePage() {
  const router = useRouter();
  const { user, isReady, enterGuest, exitGuest } = useAuth();

  // Discard stale guest sessions when landing on home — not when guest is entered here.
  useEffect(() => {
    if (!isReady) return;
    if (isGuestMode() && !getAuthUser()) {
      exitGuest();
    }
  }, [isReady, exitGuest]);

  const handleGuest = () => {
    enterGuest();
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-[#7B68EE]/10 blur-3xl" />
      </div>

      <header className="relative border-b border-border bg-card/90 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Video className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-foreground">Zoom Clone</span>
          </Link>

          <div className="flex items-center gap-2">
            {isReady && user ? (
              <Button asChild className="rounded-lg bg-primary hover:bg-primary/90">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="rounded-lg">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild className="rounded-lg bg-primary hover:bg-primary/90">
                  <Link href="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative flex-1">
        <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              Simple, secure video conferencing
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Meet anywhere,
              <span className="block text-primary">connect instantly</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Zoom Clone is a full-stack video meeting app built with Next.js, FastAPI, and WebRTC.
              Create instant or scheduled meetings, share invite links, and collaborate with up to
              five participants — no downloads required.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {isReady && user ? (
                <Button
                  asChild
                  size="lg"
                  className="h-12 min-w-[180px] rounded-xl bg-primary px-8 text-base font-semibold hover:bg-primary/90"
                >
                  <Link href="/dashboard">
                    <Video className="mr-2 h-5 w-5" />
                    Open Dashboard
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="h-12 min-w-[180px] rounded-xl bg-primary px-8 text-base font-semibold hover:bg-primary/90"
                  >
                    <Link href="/register">
                      <UserPlus className="mr-2 h-5 w-5" />
                      Get started
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 min-w-[180px] rounded-xl border-border px-8 text-base font-semibold"
                  >
                    <Link href="/login">
                      <LogIn className="mr-2 h-5 w-5" />
                      Sign in
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="secondary"
                    className="h-12 min-w-[180px] rounded-xl px-8 text-base font-semibold"
                    onClick={handleGuest}
                  >
                    Continue as guest
                  </Button>
                </>
              )}
            </div>

            {isReady && user && (
              <p className="mt-4 text-sm text-muted-foreground">
                Signed in as{" "}
                <span className="font-medium text-foreground">{user.username}</span>
              </p>
            )}
          </div>
        </section>

        <section className="border-t border-border bg-card/50 px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                About our application
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                A production-quality Zoom-style experience for creating, scheduling, and joining
                video meetings directly in your browser.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-border px-6 py-6 text-center text-sm text-muted-foreground">
        Zoom Clone — WebRTC video meetings for teams and friends
      </footer>
    </div>
  );
}
