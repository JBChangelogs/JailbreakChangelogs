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
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { recordEmojiUse } from "@/hooks/useFrequentEmojis";
import { mentionsToIds } from "@/utils/messages/mentions";
import type { MessageUser } from "@/utils/messages/types";

export interface MessageComposerProps {
  conversationId: string | null;
  placeholder: string;
  maxChars: number;
  isSending: boolean;
  disabled?: boolean;
  actions?: React.ReactNode;
  onSend: (message: string) => void | Promise<void>;
  onTyping?: () => void;
  /** Who @ can mention: a group's other members, or the other person. */
  mentionUsers?: MessageUser[];
}

const NO_USERS: MessageUser[] = [];

export function MessageComposer({
  conversationId,
  placeholder,
  maxChars,
  isSending,
  disabled = false,
  actions,
  onSend,
  onTyping,
  mentionUsers = NO_USERS,
}: MessageComposerProps) {
  const [draft, setDraft] = React.useState("");
  const [emojiOpen, setEmojiOpen] = React.useState(false);
  const cursorPosRef = React.useRef<number | null>(null);
  const emojiStringMap = useEmojiStringMap();
  const { twemojiEnabled } = useTwemoji();
  const isMobile = useMediaQuery("(max-width: 1023px)");

  React.useEffect(() => {
    setDraft("");
  }, [conversationId]);

  // What's sent: @username becomes <@id>, which is longer, so the limit
  // counts that.
  const outgoing = React.useMemo(
    () => mentionsToIds(draft, mentionUsers),
    [draft, mentionUsers],
  );
  const overLimit = React.useMemo(() => {
    const trimmed = outgoing.trim();
    if (!trimmed) return 0;
    return Math.max(0, sanitizeText(trimmed).length - maxChars);
  }, [outgoing, maxChars]);

  const submit = React.useCallback(() => {
    const trimmed = outgoing.trim();
    if (!trimmed || isSending || disabled) return;

    const sanitized = sanitizeText(trimmed);
    if (sanitized.length > maxChars) {
      toast.error(`Message too long (max ${maxChars} characters).`);
      return;
    }

    void onSend(outgoing);
    setDraft("");
  }, [outgoing, disabled, isSending, maxChars, onSend]);

  const insertEmoji = React.useCallback(
    (emoji: string, keepOpen = false) => {
      const cursor = cursorPosRef.current ?? draft.length;
      const next = draft.slice(0, cursor) + emoji + draft.slice(cursor);
      setDraft(next);
      cursorPosRef.current = cursor + emoji.length;
      recordEmojiUse(emoji);
      if (!keepOpen) setEmojiOpen(false);
    },
    [draft],
  );

  const emojiEntries = React.useMemo(
    () => Object.entries(emojiStringMap).slice(0, 120),
    [emojiStringMap],
  );

  return (
    <>
      {actions}
      <ChatToolbarTextarea
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          cursorPosRef.current = event.target.selectionStart;
          if (event.target.value.trim()) {
            onTyping?.();
          }
        }}
        onSubmit={submit}
        submitOnEnter={!isMobile}
        placeholder={placeholder}
        maxLength={1000}
        disabled={disabled}
        emojiMap={emojiStringMap}
        mentionUsers={mentionUsers}
        onEmojiPicked={recordEmojiUse}
        autoCorrect="off"
        autoComplete="off"
        spellCheck="false"
        autoCapitalize="off"
        rightOverlay={
          <div className="flex items-center">
            {overLimit > 0 ? (
              <span className="text-form-error text-xs font-medium tabular-nums">
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
                      className="hover:bg-tertiary-bg! size-11! p-0! transition-colors lg:size-9! [&_svg]:size-5!"
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
              onPointerDown={(event) => event.preventDefault()}
              aria-label="Send message"
              className="hover:bg-tertiary-bg! size-11! p-0! transition-colors lg:size-9! [&_svg]:size-5!"
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
        // The app's text box: 16px on a 24px line with 8px padding, so one
        // line fills the 40px box and sits centred beside the "+".
        className={`text-primary-text placeholder-secondary-text py-2 pl-3 text-base leading-6 md:text-base ${overLimit > 0 ? "pr-36 lg:pr-32" : ""}`}
      />
    </>
  );
}
