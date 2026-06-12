"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ShareLinkBoxProps {
  shareLink: string;
  meetingId?: string;
  label?: string;
}

export function ShareLinkBox({
  shareLink,
  meetingId,
  label = "Invite link",
}: ShareLinkBoxProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2 rounded-xl border border-border bg-muted p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {meetingId && (
        <p className="text-xs text-muted-foreground">
          Meeting ID:{" "}
          <code className="rounded bg-card px-1.5 py-0.5 font-mono text-secondary-foreground">
            {meetingId}
          </code>
        </p>
      )}
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={shareLink}
          className="min-w-0 flex-1 truncate rounded-lg border border-border bg-card px-3 py-2 text-sm text-secondary-foreground"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 border-border"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="mr-1.5 h-4 w-4 text-emerald-600" />
              Copied
            </>
          ) : (
            <>
              <Copy className="mr-1.5 h-4 w-4" />
              Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
