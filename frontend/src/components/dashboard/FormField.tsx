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
  className?: string;
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
  className,
  ...props
}: InputProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium text-[#3D4149]">
        {label}
      </Label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2D8CFF]" />
        )}
        {multiline ? (
          <Textarea
            id={id}
            className={cn(
              "min-h-[96px] resize-none rounded-xl border-[#DFE3E8] bg-[#F7F9FC] pl-3 text-[#1C1F25] transition-colors",
              "placeholder:text-[#9AA0A9] focus-visible:border-[#2D8CFF] focus-visible:ring-[#2D8CFF]/25",
              Icon && "pl-10",
            )}
            {...(props as React.ComponentProps<typeof Textarea>)}
          />
        ) : (
          <Input
            id={id}
            className={cn(
              "h-11 rounded-xl border-[#DFE3E8] bg-[#F7F9FC] text-[#1C1F25] transition-colors",
              "placeholder:text-[#9AA0A9] focus-visible:border-[#2D8CFF] focus-visible:ring-[#2D8CFF]/25",
              Icon && "pl-10",
            )}
            {...(props as React.ComponentProps<typeof Input>)}
          />
        )}
      </div>
      {hint && !error && <p className="text-xs text-[#6E7680]">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
