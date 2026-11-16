"use client";

import { EmojiPicker } from "@/components/ui/EmojiPicker";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { CommentTextarea } from "@/components/PageComments/CommentTextarea";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import type { EmojiStringMap } from "@/utils/comments/emojiShortcodes";
import type { Message, MessageUser } from "@/utils/messages/types";
import { recordEmojiUse } from "@/hooks/useFrequentEmojis";
import { mentionsToIds, mentionsToText } from "@/utils/messages/mentions";

const NO_USERS: MessageUser[] = [];

interface MessageEditorProps {
  message: Message;
  emojiStringMap: EmojiStringMap;
  isSending: boolean;
  onSave: (messageId: string, content: string) => void | Promise<void>;
  onCancel: () => void;
  /** Known users: their mentions show as @username while editing. */
  mentionUsers?: MessageUser[];
}

export function MessageEditor({
  message,
  emojiStringMap,
  isSending,
  onSave,
  onCancel,
  mentionUsers = NO_USERS,
}: MessageEditorProps) {
  const [editContent, setEditContent] = useState(
    mentionsToText(
      message.content,
      (id) => mentionUsers.find((user) => user.id === id)?.username,
      // A profile not loaded yet keeps its <@id>, so saving doesn't lose it.
      null,
    ),
  );
  const save = () =>
    void onSave(message.id, mentionsToIds(editContent, mentionUsers));
  const [editEmojiOpen, setEditEmojiOpen] = useState(false);
  const editCursorPosRef = useRef<number | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const textarea = editTextareaRef.current;
    if (!textarea) return;
    textarea.focus();
    const cursor = textarea.value.length;
    textarea.setSelectionRange(cursor, cursor);
    editCursorPosRef.current = cursor;
  }, []);
  const insertEditEmoji = useCallback(
    (emoji: string, keepOpen = false) => {
      const cursor = editCursorPosRef.current ?? editContent.length;
      const next =
        editContent.slice(0, cursor) + emoji + editContent.slice(cursor);
      setEditContent(next);
      editCursorPosRef.current = cursor + emoji.length;
      recordEmojiUse(emoji);
      if (!keepOpen) {
        setEditEmojiOpen(false);
        requestAnimationFrame(() => {
          const el = editTextareaRef.current;
          if (!el) return;
          el.focus();
          const pos = editCursorPosRef.current ?? next.length;
          el.setSelectionRange(pos, pos);
        });
      }
    },
    [editContent],
  );

  return (
    <div className="mt-2 space-y-3 pb-3">
      <div className="border-border-card bg-secondary-bg focus-within:border-button-info relative rounded-xl border transition-colors">
        <CommentTextarea
          ref={editTextareaRef}
          value={editContent}
          onChange={setEditContent}
          emojiMap={emojiStringMap}
          mentionUsers={mentionUsers}
          onEmojiPicked={recordEmojiUse}
          disabled={isSending}
          rows={2}
          className="text-primary-text placeholder-secondary-text min-h-16 w-full resize-y bg-transparent p-3 pr-14 text-sm focus:outline-none disabled:opacity-60"
          autoCorrect="off"
          autoComplete="off"
          spellCheck="false"
          autoCapitalize="off"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              onCancel();
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              save();
            }
          }}
        />
        <div className="absolute top-1/2 right-2 -translate-y-1/2">
          <Popover open={editEmojiOpen} onOpenChange={setEditEmojiOpen}>
            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="!size-11 p-0 lg:!size-9"
                    aria-label="Add an emoji to edited message"
                    disabled={isSending}
                    onPointerDown={() => {
                      editCursorPosRef.current =
                        editTextareaRef.current?.selectionStart ?? null;
                    }}
                  >
                    <Icon icon="heroicons:face-smile" className="!size-5" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Add an emoji</TooltipContent>
            </Tooltip>
            <PopoverContent
              align="end"
              side="top"
              sideOffset={8}
              className="w-auto p-0"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <EmojiPicker
                quickEmojis={Object.values(emojiStringMap)}
                onSelect={insertEditEmoji}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="flex items-center gap-2 lg:hidden">
        <Button
          size="sm"
          onClick={save}
          disabled={isSending || !editContent.trim()}
        >
          {isSending ? <Spinner className="mr-1 h-3 w-3" /> : null}
          Update
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isSending}
        >
          Cancel
        </Button>
      </div>
      <div className="text-secondary-text hidden items-center gap-1 text-xs lg:flex">
        escape to{" "}
        <button
          type="button"
          className="text-link cursor-pointer hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onCancel}
          disabled={isSending}
        >
          cancel
        </button>{" "}
        • enter to{" "}
        <button
          type="button"
          className="text-link cursor-pointer hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          onClick={save}
          disabled={isSending || !editContent.trim()}
        >
          save
        </button>
      </div>
    </div>
  );
}
