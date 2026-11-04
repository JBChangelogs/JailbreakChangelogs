"use client";

import { toast } from "sonner";
import { Icon } from "@/components/ui/IconWrapper";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ThemeShareCode({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "text-primary-text border-button-info/30 bg-button-info/20 hover:bg-button-info/30 group relative z-10 mt-2 inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 font-mono text-xs leading-none font-medium backdrop-blur-xl transition-colors",
            className,
          )}
          aria-label={`Copy share code ${code}`}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              toast.success(`Share code ${code} copied!`, { duration: 2000 });
            } catch {
              toast.error("Couldn't copy the share code", {
                description: code,
              });
            }
          }}
        >
          Code: {code}
          <Icon
            icon="heroicons:clipboard-document"
            className="h-4 w-4 opacity-50 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left">Click to copy code</TooltipContent>
    </Tooltip>
  );
}
