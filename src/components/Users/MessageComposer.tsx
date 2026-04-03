"use client";

import * as React from "react";
import { toast } from "sonner";
import { Icon } from "@/components/ui/IconWrapper";
import { sanitizeText } from "@/utils/sanitizeText";
import {
  ChatToolbarButton,
  ChatToolbarTextarea,
} from "@/components/chat/chat-toolbar";

export interface MessageComposerProps {
  conversationId: string | null;
  placeholder: string;
  maxChars: number;
  isSending: boolean;
  onSend: (message: string) => void | Promise<void>;
}

export function MessageComposer({
  conversationId,
  placeholder,
  maxChars,
  isSending,
  onSend,
}: MessageComposerProps) {
  const [draft, setDraft] = React.useState("");

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
    if (!trimmed || isSending) return;

    const sanitized = sanitizeText(trimmed);
    if (sanitized.length > maxChars) {
      toast.error(`Message too long (max ${maxChars} characters).`);
      return;
    }

    void onSend(draft);
    setDraft("");
  }, [draft, isSending, maxChars, onSend]);

  return (
    <ChatToolbarTextarea
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onSubmit={submit}
      placeholder={placeholder}
      maxLength={1000}
      rightOverlay={
        <div className="flex items-center gap-2">
          {overLimit > 0 ? (
            <span className="text-xs font-medium text-red-400/90 tabular-nums">
              -{overLimit}
            </span>
          ) : null}
          <ChatToolbarButton
            onClick={submit}
            aria-label="Send message"
            className="hover:bg-secondary-bg/50 transition-colors"
            disabled={!draft.trim() || isSending || overLimit > 0}
          >
            {isSending ? (
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
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
