"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Settings, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const THEME_OPTIONS = [
  {
    value: "light",
    label: "Light",
    description: "Always use light mode",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Always use dark mode",
    icon: Moon,
  },
  {
    value: "system",
    label: "System default",
    description: "Match your device settings",
    icon: Monitor,
  },
] as const;

export function SettingsDrawer({ open, onOpenChange }: SettingsDrawerProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  const activeTheme = mounted ? theme ?? "system" : "system";
  const activeResolved = mounted ? resolvedTheme ?? "light" : "light";

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[1px]"
        aria-label="Close settings"
        onClick={() => onOpenChange(false)}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-drawer-title"
        className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-sm flex-col border-l border-border bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 id="settings-drawer-title" className="text-lg font-semibold text-foreground">
                Settings
              </h2>
              <p className="text-sm text-muted-foreground">
                Customize your experience
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg"
            onClick={() => onOpenChange(false)}
            aria-label="Close settings"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <section>
            <h3 className="text-sm font-semibold text-foreground">Appearance</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose how the app looks across dashboard and meetings.
            </p>

            <div className="mt-4 space-y-2">
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = activeTheme === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                      isSelected
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-border bg-background hover:border-primary/40 hover:bg-muted/60",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                    <span
                      className={cn(
                        "h-4 w-4 shrink-0 rounded-full border",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-border bg-background",
                      )}
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>

            {mounted && (
              <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                Currently using{" "}
                <span className="font-medium text-foreground">
                  {activeTheme === "system" ? "system default" : activeTheme}
                </span>
                {activeTheme === "system" && (
                  <>
                    {" "}
                    ({activeResolved} mode)
                  </>
                )}
              </p>
            )}
          </section>
        </div>
      </aside>
    </>
  );
}
