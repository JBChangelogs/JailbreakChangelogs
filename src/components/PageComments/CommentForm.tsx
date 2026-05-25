"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Icon } from "../ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "../ui/button";
import { useCommentsContext } from "./CommentsContext";
import { CommentTextarea } from "./CommentTextarea";
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

export function CommentForm() {
  const {
    isLoggedIn,
    isBlocked,
    isCommentFormExpanded,
    setIsCommentFormExpanded,
    isSubmittingComment,
    handleSubmitComment,
    type,
    changelogId,
    setLoginModal,
    emojiStringMap,
  } = useCommentsContext();
  const { twemojiEnabled } = useTwemoji();

  const [newComment, setNewComment] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPosRef = useRef<number | null>(null);

  const emojiEntries = useMemo(
    () => Object.entries(emojiStringMap).slice(0, 120),
    [emojiStringMap],
  );

  const insertEmoji = useCallback(
    (emoji: string, keepOpen = false) => {
      const cursor = cursorPosRef.current ?? newComment.length;
      const next =
        newComment.slice(0, cursor) + emoji + newComment.slice(cursor);
      setNewComment(next);
      cursorPosRef.current = cursor + emoji.length;
      if (!keepOpen) {
        setEmojiOpen(false);
        requestAnimationFrame(() => {
          const el = textareaRef.current;
          if (!el) return;
          el.focus();
          const pos = cursorPosRef.current ?? next.length;
          el.setSelectionRange(pos, pos);
        });
      }
    },
    [newComment],
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await handleSubmitComment(newComment);
    if (ok) {
      setNewComment("");
    }
  };

  return (
    <form id="new-comment-form" onSubmit={handleFormSubmit}>
      {!isCommentFormExpanded ? (
        <button
          type="button"
          disabled={isBlocked}
          className="border-border-card bg-tertiary-bg text-secondary-text hover:border-button-info w-full cursor-text rounded-lg border px-4 py-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => {
            if (!isLoggedIn) {
              setLoginModal({ open: true });
            } else if (!isBlocked) {
              setIsCommentFormExpanded(true);
            }
          }}
        >
          {isLoggedIn ? "Write a comment..." : "Log in to leave a comment..."}
        </button>
      ) : (
        <div className="border-border-card bg-tertiary-bg focus-within:border-button-info rounded-lg border transition-colors">
          <CommentTextarea
            ref={textareaRef}
            id="new-comment-textarea"
            value={newComment}
            onChange={setNewComment}
            emojiMap={emojiStringMap}
            placeholder="Write a comment..."
            rows={4}
            disabled={isBlocked}
            className="text-primary-text placeholder-secondary-text w-full resize-none bg-transparent p-3 text-sm focus:outline-none disabled:opacity-60"
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
            autoCapitalize="off"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsCommentFormExpanded(false);
                setNewComment("");
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (newComment.trim() && !isSubmittingComment && !isBlocked) {
                  void handleFormSubmit(
                    e as unknown as React.FormEvent<HTMLFormElement>,
                  );
                }
              }
            }}
          />
          <div className="border-border-card flex items-center justify-between gap-2 border-t px-3 py-2">
            <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
              <Tooltip delayDuration={500}>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-secondary-text hover:text-primary-text h-7 w-7 p-0"
                      disabled={isBlocked}
                      onPointerDown={() => {
                        cursorPosRef.current =
                          textareaRef.current?.selectionStart ?? null;
                      }}
                    >
                      <Icon icon="heroicons:face-smile" className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Add an emoji</TooltipContent>
              </Tooltip>
              <PopoverContent
                align="start"
                side="bottom"
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
            {/* Mobile: show buttons */}
            <div className="flex items-center gap-2 lg:hidden">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCommentFormExpanded(false);
                  setNewComment("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={
                  !newComment.trim() || isSubmittingComment || isBlocked
                }
                data-rybbit-event="Post Comment"
                data-rybbit-prop-type={type}
                data-rybbit-prop-context-id={changelogId.toString()}
              >
                {isSubmittingComment ? (
                  <>
                    <Spinner className="h-3.5 w-3.5" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Icon
                      icon="streamline-plump:mail-send-email-message-solid"
                      inline={true}
                    />
                    Post
                  </>
                )}
              </Button>
            </div>
            {/* Desktop: keyboard hints */}
            <div className="text-secondary-text hidden items-center gap-1.5 text-[11px] lg:flex">
              {isSubmittingComment ? (
                <>
                  <Spinner className="h-3 w-3" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <span>Esc to </span>
                  <button
                    type="button"
                    className="text-link cursor-pointer hover:underline"
                    onClick={() => {
                      setIsCommentFormExpanded(false);
                      setNewComment("");
                    }}
                  >
                    cancel
                  </button>
                  <span> • Enter to </span>
                  <button
                    type="button"
                    className="text-link cursor-pointer hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={
                      !newComment.trim() || isSubmittingComment || isBlocked
                    }
                    onClick={() => {
                      if (
                        newComment.trim() &&
                        !isSubmittingComment &&
                        !isBlocked
                      ) {
                        document
                          .querySelector<HTMLFormElement>("#new-comment-form")
                          ?.requestSubmit();
                      }
                    }}
                  >
                    post
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
