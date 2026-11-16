"use client";

import Twemoji from "react-twemoji";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { MessageReactions } from "@/utils/messages/types";

export function EmojiGlyph({ emoji }: { emoji: string }) {
  return (
    <Twemoji tag="span" options={{ className: "twemoji pointer-events-none" }}>
      {emoji}
    </Twemoji>
  );
}

/** The chips under a message: each emoji, its count, and who reacted. */
export function ReactionChips({
  reactions,
  currentUserId,
  nameOf,
  onToggle,
}: {
  reactions: MessageReactions | undefined;
  currentUserId: string;
  nameOf: (id: string) => string | undefined;
  /** Missing when you can't react, e.g. a message still sending. */
  onToggle?: (emoji: string) => void;
}) {
  const entries = Object.entries(reactions ?? {});
  if (!entries.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {entries.map(([emoji, users]) => {
        const mine = users.includes(currentUserId);
        return (
          <Tooltip key={emoji}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-pressed={mine}
                aria-label={`${emoji} ${users.length}`}
                disabled={!onToggle}
                onClick={() => onToggle?.(emoji)}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-1 text-lg leading-none transition-colors disabled:cursor-default",
                  mine
                    ? "border-button-info/40 bg-button-info/20"
                    : "border-border-card bg-tertiary-bg hover:bg-quaternary-bg",
                )}
              >
                <EmojiGlyph emoji={emoji} />
                <span className="text-secondary-text text-sm font-semibold">
                  {users.length}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {users.map((id) => nameOf(id) ?? "unknown-user").join(", ")}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
