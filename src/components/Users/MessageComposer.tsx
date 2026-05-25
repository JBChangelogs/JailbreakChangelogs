"use client";

import * as React from "react";
import { toast } from "sonner";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { sanitizeText } from "@/utils/ui/sanitizeText";
import {
  ChatToolbarButton,
  ChatToolbarTextarea,
} from "@/components/chat/chat-toolbar";
import { useEmojiStringMap } from "@/hooks/useEmojiStringMap";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTwemoji } from "@/contexts/TwemojiContext";
import Twemoji from "react-twemoji";

export interface MessageComposerProps {
  conversationId: string | null;
  placeholder: string;
  maxChars: number;
  isSending: boolean;
  disabled?: boolean;
  onSend: (message: string) => void | Promise<void>;
}

export function MessageComposer({
  conversationId,
  placeholder,
  maxChars,
  isSending,
  disabled = false,
  onSend,
}: MessageComposerProps) {
  const [draft, setDraft] = React.useState("");
  const [emojiOpen, setEmojiOpen] = React.useState(false);
  const cursorPosRef = React.useRef<number | null>(null);
  const emojiStringMap = useEmojiStringMap();
  const { twemojiEnabled } = useTwemoji();

  React.useEffect(() => {
    setDraft("");
  }, [conversationId]);

  const overLimit = React.useMemo(() => {
    const trimmed = draft.trim();
    if (!trimmed) return 0;
    return Math.max(0, sanitizeText(trimmed).length - maxChars);
  }, [draft, maxChars]);

  const submit = React.useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed || isSending || disabled) return;

    const sanitized = sanitizeText(trimmed);
    if (sanitized.length > maxChars) {
      toast.error(`Message too long (max ${maxChars} characters).`);
      return;
    }

    void onSend(draft);
    setDraft("");
  }, [draft, disabled, isSending, maxChars, onSend]);

  const insertEmoji = React.useCallback(
    (emoji: string, keepOpen = false) => {
      const cursor = cursorPosRef.current ?? draft.length;
      const next = draft.slice(0, cursor) + emoji + draft.slice(cursor);
      setDraft(next);
      cursorPosRef.current = cursor + emoji.length;
      if (!keepOpen) setEmojiOpen(false);
    },
    [draft],
  );

  const emojiEntries = React.useMemo(
    () => Object.entries(emojiStringMap).slice(0, 120),
    [emojiStringMap],
  );

  return (
    <ChatToolbarTextarea
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value);
        cursorPosRef.current = event.target.selectionStart;
      }}
      onSubmit={submit}
      placeholder={placeholder}
      maxLength={1000}
      disabled={disabled}
      emojiMap={emojiStringMap}
      autoCorrect="off"
      autoComplete="off"
      spellCheck="false"
      autoCapitalize="off"
      rightOverlay={
        <div className="flex items-center gap-1">
          {overLimit > 0 ? (
            <span className="text-xs font-medium text-red-400/90 tabular-nums">
              -{overLimit}
            </span>
          ) : null}
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <ChatToolbarButton
                    type="button"
                    aria-label="Open emoji picker"
                    disabled={disabled}
                    className="transition-colors hover:bg-transparent! active:bg-transparent!"
                  >
                    <Icon icon="heroicons:face-smile" className="h-4 w-4" />
                  </ChatToolbarButton>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Add an emoji</TooltipContent>
            </Tooltip>
            <PopoverContent
              align="end"
              side="top"
              sideOffset={8}
              className="w-72 p-0"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="grid max-h-56 grid-cols-8 gap-px overflow-y-auto p-1.5">
                {emojiEntries.map(([name, emoji]) => (
                  <Tooltip key={name} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => insertEmoji(emoji, e.shiftKey)}
                        className="hover:bg-quaternary-bg flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-transparent text-lg transition-colors"
                      >
                        {twemojiEnabled ? (
                          <Twemoji
                            tag="span"
                            options={{
                              className: "twemoji pointer-events-none",
                            }}
                          >
                            {emoji}
                          </Twemoji>
                        ) : (
                          <span className="pointer-events-none">{emoji}</span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>:{name}:</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <ChatToolbarButton
            onClick={submit}
            aria-label="Send message"
            className="hover:bg-secondary-bg/50 transition-colors"
            disabled={!draft.trim() || isSending || disabled || overLimit > 0}
          >
            {isSending ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Icon icon="heroicons:paper-airplane" className="h-4 w-4" />
            )}
          </ChatToolbarButton>
        </div>
      }
      className="text-primary-text placeholder-secondary-text"
    />
  );
}
