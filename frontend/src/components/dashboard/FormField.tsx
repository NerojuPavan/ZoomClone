"use client";

import type { LucideIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  id: string;
  label: string;
  icon?: LucideIcon;
  hint?: string;
  error?: string;
  multiline?: boolean;
  required?: boolean;
  className?: string;
}

export function RequiredMark() {
  return (
    <span className="ml-0.5 text-destructive" aria-hidden="true">
      *
    </span>
  );
}

type InputProps = FormFieldProps &
  (
    | ({ multiline?: false } & React.ComponentProps<typeof Input>)
    | ({ multiline: true } & React.ComponentProps<typeof Textarea>)
  );

export function FormField({
  id,
  label,
  icon: Icon,
  hint,
  error,
  multiline,
  required,
  className,
  ...props
}: InputProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium text-secondary-foreground">
        {label}
        {required && <RequiredMark />}
      </Label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        )}
        {multiline ? (
          <Textarea
            id={id}
            aria-required={required}
            className={cn(
              "min-h-[88px] resize-none rounded-md border-border bg-card pl-3 text-foreground transition-colors",
              "placeholder:text-muted-foreground focus-visible:border-[#0E71EB] focus-visible:ring-[#0E71EB]/25",
              Icon && "pl-10",
            )}
            {...(props as React.ComponentProps<typeof Textarea>)}
          />
        ) : (
          <Input
            id={id}
            aria-required={required}
            required={required}
            className={cn(
              "h-10 rounded-md border-border bg-card text-foreground transition-colors",
              "placeholder:text-muted-foreground focus-visible:border-[#0E71EB] focus-visible:ring-[#0E71EB]/25",
              Icon && "pl-10",
            )}
            {...(props as React.ComponentProps<typeof Input>)}
          />
        )}
      </div>
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
