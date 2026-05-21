"use client";

import React from "react";
import { Icon } from "../ui/IconWrapper";
import { CommentReaction } from "@/utils/api/api";
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
import { useCommentsContext } from "./CommentsContext";
import { ReactionsDialog } from "./ReactionsDialog";

export function CommentReactions({
  commentId,
  reactions,
  isRobloxContext,
  compact = false,
}: {
  commentId: number;
  reactions: CommentReaction[] | undefined;
  isRobloxContext: boolean;
  compact?: boolean;
}) {
  const {
    handleReact,
    isRateLimited,
    availableEmojis,
    isLoggedIn,
    setReactionBreakdownOpenId,
    setBreakdownTab,
    reactionPickerInlineOpenId,
    setReactionPickerInlineOpenId,
    getStableReactionOrder,
  } = useCommentsContext();

  if (!reactions || reactions.length === 0) {
    if (!isLoggedIn || availableEmojis.length === 0) return null;
    return null;
  }

  const sortedRxns = getStableReactionOrder(commentId, reactions);
  const top5 = sortedRxns.slice(0, 5);
  const overflow = sortedRxns.slice(5);

  const openDialog = (firstEmoji?: string) => {
    setReactionBreakdownOpenId(commentId);
    setBreakdownTab(firstEmoji ?? sortedRxns[0]?.emoji ?? "all");
  };

  return (
    <>
      <div
        className={
          compact
            ? "mt-1.5 flex flex-wrap items-center gap-1.5"
            : "flex flex-wrap items-center gap-1.5 pb-2"
        }
      >
        {top5.map((r) => (
          <button
            key={r.emoji}
            type="button"
            onClick={() => void handleReact(commentId, r.emoji)}
            className={`flex items-center gap-1 rounded-full border ${compact ? "px-2 py-0.5" : "px-2 py-1"} text-sm transition-colors ${isRateLimited ? "cursor-not-allowed" : "cursor-pointer"} ${
              r.user_reacted
                ? "border-link/30 bg-link/10 text-link"
                : "border-border-card bg-quaternary-bg text-primary-text hover:border-link/30"
            }`}
          >
            <span>{r.emoji}</span>
            <span className="text-xs font-medium">{r.count}</span>
          </button>
        ))}

        {overflow.length > 0 && (
          <button
            type="button"
            onClick={() => openDialog()}
            className={`border-border-card bg-quaternary-bg text-secondary-text hover:border-link/30 hover:text-primary-text flex cursor-pointer items-center gap-1 rounded-full border ${compact ? "px-2 py-0.5" : "px-2 py-1"} text-xs font-medium transition-colors`}
          >
            +{overflow.length} more
          </button>
        )}

        {isLoggedIn && availableEmojis.length > 0 && (
          <Popover
            open={reactionPickerInlineOpenId === commentId}
            onOpenChange={(open) => {
              if (open && isRateLimited) return;
              setReactionPickerInlineOpenId(open ? commentId : null);
            }}
          >
            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={`flex ${compact ? "h-6 w-6" : "h-7 w-7"} bg-quaternary-bg items-center justify-center rounded-lg transition-colors ${
                      isRateLimited
                        ? "text-secondary-text/40 cursor-not-allowed"
                        : "text-primary-text cursor-pointer hover:brightness-110"
                    }`}
                  >
                    <Icon
                      icon="fluent:emoji-add-16-regular"
                      className={compact ? "h-3 w-3" : "h-3.5 w-3.5"}
                    />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Add a reaction</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="grid grid-cols-5 gap-1">
                {availableEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      void handleReact(commentId, emoji);
                      setReactionPickerInlineOpenId(null);
                    }}
                    className="hover:bg-quaternary-bg flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <ReactionsDialog
        commentId={commentId}
        reactions={sortedRxns}
        isRobloxContext={isRobloxContext}
      />
    </>
  );
}
