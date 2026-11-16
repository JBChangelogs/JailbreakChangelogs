"use client";

import { lazy, Suspense } from "react";
import Twemoji from "react-twemoji";
import { Spinner } from "@/components/ui/Spinner";

const FullPicker = lazy(() => import("./EmojiPickerContent"));

export function EmojiPicker({
  quickEmojis,
  twemojiEnabled,
  onSelect,
  disabled = false,
}: {
  quickEmojis: string[];
  twemojiEnabled: boolean;
  onSelect: (emoji: string, keepOpen: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="w-[min(320px,calc(100vw-2rem))]">
      {quickEmojis.length > 0 && (
        <div
          role="group"
          aria-label="Quick emoji"
          className="border-border-card flex gap-1 overflow-x-auto border-b p-2"
        >
          {[...new Set(quickEmojis)].map((emoji) => (
            <button
              key={emoji}
              type="button"
              disabled={disabled}
              aria-label={`Choose ${emoji}`}
              className="hover:bg-quaternary-bg flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-xl disabled:opacity-50"
              onClick={(event) => onSelect(emoji, event.shiftKey)}
            >
              {twemojiEnabled ? (
                <Twemoji
                  tag="span"
                  options={{ className: "twemoji pointer-events-none" }}
                >
                  {emoji}
                </Twemoji>
              ) : (
                emoji
              )}
            </button>
          ))}
        </div>
      )}
      <Suspense
        fallback={
          <div
            role="status"
            className="text-secondary-text flex h-80 items-center justify-center gap-2 text-sm"
          >
            <Spinner className="size-4" />
            Loading emoji…
          </div>
        }
      >
        <FullPicker
          twemojiEnabled={twemojiEnabled}
          onSelect={onSelect}
          disabled={disabled}
        />
      </Suspense>
    </div>
  );
}
